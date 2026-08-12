/**
 * Streamable HTTP transport — the remote connector surface.
 *
 * Two modes, both built so that many clients can be connected at once:
 *
 * **stateless** (default). Every POST gets its own transport and its own
 * `McpServer`, both discarded when the response ends. Nothing is shared between
 * requests except the frozen registry, so requests cannot interleave into each
 * other's state and any instance can serve any request. This is what makes the
 * server horizontally scalable — put N processes or N containers behind a load
 * balancer and no coordination is required.
 *
 * **stateful**. Sessions are kept in a bounded, reaped store so a client can
 * hold an SSE stream open and receive server-initiated messages. Each session
 * still gets its own `McpServer`; the store only decides how long it lives.
 */

import { randomUUID } from 'node:crypto';

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { MAX_REQUEST_BODY, SERVER_ID } from '../constants.js';
import { log } from '../logger.js';
import { createServer } from '../server/create-server.js';
import { SessionStore } from './session-store.js';

/** JSON-RPC error body for failures that happen before a transport exists. */
function rpcError(code, message, id = null) {
  return { jsonrpc: '2.0', error: { code, message }, id };
}

/**
 * Rejects cross-origin and rebound-host requests when protection is enabled.
 *
 * The SDK can do this inside the transport, but that path is deprecated in
 * favour of middleware, and doing it here also covers the health endpoints.
 */
function originGuard({ allowedHosts, allowedOrigins }) {
  return (req, res, next) => {
    const origin = req.get('origin');
    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      res.status(403).json(rpcError(-32600, `Origin not allowed: ${origin}`));
      return;
    }
    const host = req.get('host');
    if (host && allowedHosts.length > 0 && !allowedHosts.includes(host)) {
      res.status(403).json(rpcError(-32600, `Host not allowed: ${host}`));
      return;
    }
    next();
  };
}

/**
 * Builds the express app.
 *
 * @param {{ registry: object, version: string, config: object }} options
 * @returns {{ app: import('express').Express, sessions: SessionStore }}
 */
export function createHttpApp({ registry, version, config }) {
  const app = express();
  const sessions = new SessionStore({
    ttlMs: config.sessionTtlMs,
    maxSessions: config.maxSessions,
  });
  const stateful = config.sessionMode === 'stateful';

  app.disable('x-powered-by');
  app.use(express.json({ limit: MAX_REQUEST_BODY }));

  // Malformed JSON reaches the error handler before any route, so it needs its
  // own reply — otherwise express answers with an HTML error page a JSON-RPC
  // client cannot parse.
  app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      res.status(400).json(rpcError(-32700, 'Parse error: request body is not valid JSON'));
      return;
    }
    next(error);
  });

  if (config.dnsRebindingProtection) {
    app.use(
      originGuard({ allowedHosts: config.allowedHosts, allowedOrigins: config.allowedOrigins }),
    );
  }

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', pid: process.pid, uptime: Math.round(process.uptime()) });
  });

  app.get('/readyz', (_req, res) => {
    // Readiness is content readiness: the process is useless without the set.
    const ready = registry.size > 0;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'no-content',
      resources: registry.size,
      sessions: sessions.size,
    });
  });

  app.get('/', (_req, res) => {
    res.json({
      name: SERVER_ID,
      version,
      transport: 'streamable-http',
      sessionMode: config.sessionMode,
      endpoint: config.mcpPath,
      resources: registry.size,
    });
  });

  app.post(config.mcpPath, async (req, res) => {
    try {
      await (stateful
        ? handleStatefulPost({ req, res, registry, version, sessions })
        : handleStatelessPost({ req, res, registry, version }));
    } catch (error) {
      log.error('request failed', { error: error instanceof Error ? error.message : String(error) });
      if (!res.headersSent) {
        res.status(500).json(rpcError(-32603, 'Internal server error'));
      }
    }
  });

  // GET opens the SSE stream and DELETE terminates a session. Both only exist
  // when sessions do; in stateless mode there is nothing to attach to.
  const sessionOnly = async (req, res) => {
    if (!stateful) {
      res.status(405).json(rpcError(-32000, 'Method not allowed in stateless mode'));
      return;
    }
    const id = req.get('mcp-session-id');
    const session = id ? sessions.touch(id) : undefined;
    if (!session) {
      res.status(404).json(rpcError(-32001, 'Unknown or expired session'));
      return;
    }
    await session.transport.handleRequest(req, res);
  };

  app.get(config.mcpPath, sessionOnly);
  app.delete(config.mcpPath, sessionOnly);

  if (stateful) sessions.start();

  return { app, sessions };
}

/** One transport and one server per request; nothing survives the response. */
async function handleStatelessPost({ req, res, registry, version }) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createServer({ registry, version });

  // Closing on response end rather than after handleRequest resolves: the
  // client may abort mid-flight, and the listener fires either way.
  res.on('close', () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

/** Reuses a session when the client names one, creates one on initialize. */
async function handleStatefulPost({ req, res, registry, version, sessions }) {
  const requestedId = req.get('mcp-session-id');

  if (requestedId) {
    const session = sessions.touch(requestedId);
    if (!session) {
      res.status(404).json(rpcError(-32001, 'Unknown or expired session'));
      return;
    }
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  if (!isInitializeRequest(req.body)) {
    res.status(400).json(rpcError(-32000, 'Missing mcp-session-id header'));
    return;
  }

  if (sessions.isFull) {
    // Refusing is better than accepting and degrading: an honest 503 lets a
    // client retry or fail over, where an accepted-but-starved session does not.
    res.setHeader('retry-after', '5');
    res.status(503).json(rpcError(-32000, 'Server at session capacity, retry shortly'));
    return;
  }

  const server = createServer({ registry, version });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => sessions.set(sessionId, { transport, server }),
    onsessionclosed: (sessionId) => sessions.forget(sessionId),
  });

  transport.onclose = () => {
    if (transport.sessionId) sessions.forget(transport.sessionId);
    void server.close();
  };

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
