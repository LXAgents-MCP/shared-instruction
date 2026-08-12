/**
 * Environment parsing, done once at import time.
 *
 * The result is frozen because every worker, session and request reads it
 * concurrently. Nothing rewrites config at runtime, so no lock is needed.
 */

import { availableParallelism } from 'node:os';
import {
  DEFAULT_HOST,
  DEFAULT_MAX_SESSIONS,
  DEFAULT_MCP_PATH,
  DEFAULT_PORT,
  DEFAULT_SESSION_TTL_MS,
} from './constants.js';

/** Reads an integer env var, falling back when unset or unparseable. */
function readInt(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer, received "${raw}"`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}, received ${parsed}`);
  }
  return parsed;
}

/** Reads a comma-separated list, trimming blanks. Empty means "no restriction". */
function readList(name) {
  const raw = process.env[name];
  if (!raw) return [];
  return Object.freeze(
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

/** Reads a boolean env var. Accepts 1/true/yes/on, case-insensitively. */
function readBool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

/**
 * Worker count for the HTTP transport.
 *
 * `auto` forks one worker per available core, which is how this server gets
 * real parallelism: Node runs one event loop per process, so N workers behind
 * the shared listening socket serve N requests genuinely at the same time.
 * `1` keeps everything in the parent, which is what stdio and local debugging
 * want.
 */
function readWorkers() {
  const raw = (process.env.MCP_WORKERS ?? '1').trim().toLowerCase();
  if (raw === 'auto') return Math.max(1, availableParallelism());
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error(`MCP_WORKERS must be a positive integer or "auto", received "${raw}"`);
  }
  return parsed;
}

/** Normalises the transport selector, accepting the aliases people actually type. */
function readTransport() {
  const raw = (process.env.MCP_TRANSPORT ?? 'stdio').trim().toLowerCase();
  if (['stdio', 'stdout', 'local'].includes(raw)) return 'stdio';
  if (['http', 'streamable-http', 'streamablehttp', 'remote'].includes(raw)) return 'http';
  throw new Error(`MCP_TRANSPORT must be "stdio" or "http", received "${raw}"`);
}

/**
 * Session mode for the HTTP transport.
 *
 * `stateless` builds a fresh server and transport per request and throws both
 * away afterwards — no shared mutable state, so any number of clients (and any
 * number of worker processes behind a load balancer) can be served in any
 * order. `stateful` additionally honours `mcp-session-id`, which clients need
 * for server-initiated messages over SSE.
 */
function readSessionMode() {
  const raw = (process.env.MCP_SESSION_MODE ?? 'stateless').trim().toLowerCase();
  if (raw === 'stateless' || raw === 'stateful') return raw;
  throw new Error(`MCP_SESSION_MODE must be "stateless" or "stateful", received "${raw}"`);
}

export const config = Object.freeze({
  transport: readTransport(),
  host: process.env.MCP_HOST ?? DEFAULT_HOST,
  port: readInt('PORT', DEFAULT_PORT, { min: 1, max: 65535 }),
  mcpPath: process.env.MCP_PATH ?? DEFAULT_MCP_PATH,
  sessionMode: readSessionMode(),
  sessionTtlMs: readInt('MCP_SESSION_TTL_MS', DEFAULT_SESSION_TTL_MS, { min: 1000 }),
  maxSessions: readInt('MCP_MAX_SESSIONS', DEFAULT_MAX_SESSIONS, { min: 1 }),
  workers: readWorkers(),
  allowedHosts: readList('MCP_ALLOWED_HOSTS'),
  allowedOrigins: readList('MCP_ALLOWED_ORIGINS'),
  contentDir: process.env.MCP_CONTENT_DIR ?? null,
  logLevel: (process.env.LOG_LEVEL ?? 'info').trim().toLowerCase(),
  // Off by default: the server publishes public instruction text and is often
  // run behind a proxy that already terminates origin checks.
  dnsRebindingProtection: readBool('MCP_DNS_REBINDING_PROTECTION', false),
});
