import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { loadRegistry } from '../src/content/registry.js';
import { SessionStore } from '../src/transport/session-store.js';
import { createHttpApp } from '../src/transport/http.js';

const baseConfig = {
  mcpPath: '/mcp',
  sessionMode: 'stateless',
  sessionTtlMs: 60_000,
  maxSessions: 100,
  allowedHosts: [],
  allowedOrigins: [],
  dnsRebindingProtection: false,
};

/** Starts the app on an ephemeral port and returns its base URL. */
async function listen(overrides = {}) {
  const registry = await loadRegistry();
  const { app, sessions } = createHttpApp({
    registry,
    version: '0.0.0',
    config: { ...baseConfig, ...overrides },
  });

  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1');
    listener.once('listening', () => resolve(listener));
    listener.once('error', reject);
  });

  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    registry,
    close: async () => {
      await sessions.closeAll();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

/** Connects an MCP client over streamable HTTP. */
async function connect(url) {
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
  return client;
}

let stateless;

before(async () => {
  stateless = await listen();
});

after(async () => {
  await stateless.close();
});

test('health endpoints report liveness and content readiness', async () => {
  const health = await fetch(`${stateless.url}/healthz`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');

  const ready = await fetch(`${stateless.url}/readyz`);
  assert.equal(ready.status, 200);
  const body = await ready.json();
  assert.equal(body.status, 'ready');
  assert.equal(body.resources, stateless.registry.size);
});

test('the root endpoint describes the server without an MCP handshake', async () => {
  const body = await (await fetch(stateless.url)).json();
  assert.equal(body.name, 'lxagents-agents-base');
  assert.equal(body.endpoint, '/mcp');
  assert.equal(body.sessionMode, 'stateless');
});

test('stateless: a client can list and read resources over HTTP', async () => {
  const client = await connect(stateless.url);

  const { resources } = await client.listResources();
  // Every instruction file, plus the manifest.
  assert.equal(resources.length, stateless.registry.size + 1);

  const { contents } = await client.readResource({ uri: 'agents://AGENTS.md' });
  assert.match(contents[0].text, /name: shared-agents-entry-point/);

  await client.close();
});

test('stateless: the agents-setup prompt is delivered over HTTP', async () => {
  const client = await connect(stateless.url);

  const { prompts } = await client.listPrompts();
  assert.ok(prompts.some((prompt) => prompt.name === 'agents-setup'));

  const result = await client.getPrompt({ name: 'agents-setup' });
  assert.match(result.messages[0].content.text, /# AGENTS-SETUP/);

  await client.close();
});

test('stateless: eight concurrent clients are all served correctly', async () => {
  // The point of stateless mode: no shared mutable state, so simultaneous
  // clients cannot interleave into each other's requests.
  const clients = await Promise.all(Array.from({ length: 8 }, () => connect(stateless.url)));

  const targets = [
    'agents://rules/directories.md',
    'agents://rules/memory-policy.md',
    'agents://git/commit-conventions.md',
    'agents://planning/task-workflow.md',
  ];

  const results = await Promise.all(
    clients.map((client, index) => client.readResource({ uri: targets[index % targets.length] })),
  );

  for (const [index, result] of results.entries()) {
    const expected = targets[index % targets.length];
    assert.equal(result.contents[0].uri, expected, 'a response was routed to the wrong client');
    assert.equal(result.contents[0].text, stateless.registry.get(expected).text);
  }

  await Promise.all(clients.map((client) => client.close()));
});

test('stateless: GET and DELETE on the MCP path are refused, not silently accepted', async () => {
  for (const method of ['GET', 'DELETE']) {
    const response = await fetch(`${stateless.url}/mcp`, { method });
    assert.equal(response.status, 405, `${method} should be refused in stateless mode`);
  }
});

test('malformed JSON gets a JSON-RPC parse error, not an HTML error page', async () => {
  const response = await fetch(`${stateless.url}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ not json',
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, -32700);
});

test('stateful: sessions are issued, reused, and terminated', async () => {
  const stateful = await listen({ sessionMode: 'stateful' });
  try {
    const client = await connect(stateful.url);

    // Two calls on one session: the second must reuse it, not create another.
    await client.listResources();
    await client.listPrompts();

    const readyBody = await (await fetch(`${stateful.url}/readyz`)).json();
    assert.equal(readyBody.sessions, 1, 'one client should hold exactly one session');

    await client.close();
  } finally {
    await stateful.close();
  }
});

test('stateful: an unknown session id is rejected', async () => {
  const stateful = await listen({ sessionMode: 'stateful' });
  try {
    const response = await fetch(`${stateful.url}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'mcp-session-id': 'does-not-exist' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    });
    assert.equal(response.status, 404);
  } finally {
    await stateful.close();
  }
});

test('stateful: capacity is refused with 503 rather than degrading', async () => {
  const stateful = await listen({ sessionMode: 'stateful', maxSessions: 1 });
  try {
    const first = await connect(stateful.url);

    await assert.rejects(
      () => connect(stateful.url),
      'a second session must be refused when capacity is 1',
    );

    await first.close();
  } finally {
    await stateful.close();
  }
});

test('session store: idle sessions are reaped, active ones are not', async () => {
  const store = new SessionStore({ ttlMs: 50, maxSessions: 10 });
  const closed = [];
  const fake = (id) => ({
    transport: { close: async () => closed.push(`${id}:transport`) },
    server: { close: async () => closed.push(`${id}:server`) },
  });

  store.set('idle', fake('idle'));
  store.set('active', fake('active'));
  assert.equal(store.size, 2);

  // Advance past the TTL for both, then touch one so it stays.
  const later = Date.now() + 1000;
  store.touch('active');
  const reaped = await store.sweep(later);

  assert.equal(reaped, 2, 'both are idle relative to a far-future clock');
  assert.equal(store.size, 0);
  assert.ok(closed.includes('idle:transport') && closed.includes('idle:server'));
});

test('session store: closeAll closes everything and stops the reaper', async () => {
  const store = new SessionStore({ ttlMs: 60_000, maxSessions: 10, sweepIntervalMs: 10 });
  let closes = 0;
  store.start();
  store.set('a', { transport: { close: async () => (closes += 1) }, server: null });

  await store.closeAll();
  assert.equal(store.size, 0);
  assert.equal(closes, 1);
});
