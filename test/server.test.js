import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';

/** Connects a client to a fresh server over a linked in-memory transport pair. */
async function connect() {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, registry };
}

test('initialize: reports the configured id, version, and routing instructions', async () => {
  const { client, server } = await connect();

  assert.deepEqual(client.getServerVersion(), {
    name: 'lxagents-agents-base',
    title: 'LXAgents Agents Base',
    version: '0.0.0',
  });

  const instructions = client.getInstructions();
  assert.match(instructions, /agents-setup/);
  assert.match(instructions, /route into it; do not read it all/i);

  await server.close();
});

test('resources/list: every instruction file is listed with a description', async () => {
  const { client, server, registry } = await connect();

  const { resources } = await client.listResources();
  // Every instruction file, plus the manifest.
  assert.equal(resources.length, registry.size + 1);

  for (const resource of resources) {
    assert.ok(resource.description, `${resource.uri} has no description to route on`);
  }
  for (const entry of registry.entries) {
    const resource = resources.find((candidate) => candidate.uri === entry.uri);
    assert.ok(resource, `${entry.uri} is not published`);
    assert.equal(resource.mimeType, 'text/markdown');
  }

  const uris = resources.map((resource) => resource.uri);
  assert.ok(uris.includes('agents://AGENTS.md'));
  assert.ok(uris.includes('agents://rules/duplicate-instruction-audit.md'));

  await server.close();
});

test('resources/read: returns the file verbatim', async () => {
  const { client, server, registry } = await connect();

  const uri = 'agents://git/commit-conventions.md';
  const { contents } = await client.readResource({ uri });

  assert.equal(contents.length, 1);
  assert.equal(contents[0].uri, uri);
  assert.equal(contents[0].text, registry.get(uri).text);

  await server.close();
});

test('resources/read: an unknown URI is an error, not empty content', async () => {
  const { client, server } = await connect();

  await assert.rejects(() => client.readResource({ uri: 'agents://rules/nope.md' }));

  await server.close();
});

test('prompts/list: exposes agents-setup, and declares no arguments', async () => {
  const { client, server } = await connect();

  const { prompts } = await client.listPrompts();
  const setup = prompts.find((prompt) => prompt.name === 'agents-setup');

  assert.ok(setup, 'agents-setup must be published');
  assert.ok(setup.description);
  // Declaring arguments would make prompts/get reject a request that omits
  // them, which the spec permits. See the note in src/server/prompts.js.
  assert.equal(setup.arguments, undefined);

  await server.close();
});

test('prompts/get: agents-setup carries the whole procedure', async () => {
  const { client, server, registry } = await connect();

  const result = await client.getPrompt({ name: 'agents-setup' });

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].role, 'user');
  const text = result.messages[0].content.text;
  assert.ok(
    text.includes(registry.get('agents://prompts/agents-setup.md').text),
    'the procedure must be delivered in full, not summarised',
  );
  assert.match(text, /There is nothing to clone/);

  await server.close();
});

test('prompts/get: succeeds when the client omits arguments entirely', async () => {
  const { client, server } = await connect();

  // A spec-compliant client may send prompts/get with no arguments field at
  // all. That must work, so the server declares no argument schema.
  const result = await client.getPrompt({ name: 'agents-setup' });
  assert.ok(result.messages[0].content.text.length > 1000);

  await server.close();
});

test('concurrency: independent client sessions do not share server state', async () => {
  // Two sessions, interleaved on purpose. Each has its own McpServer over its
  // own transport; only the frozen registry is shared.
  const [first, second] = await Promise.all([connect(), connect()]);

  const [a, b] = await Promise.all([
    first.client.readResource({ uri: 'agents://rules/directories.md' }),
    second.client.readResource({ uri: 'agents://rules/memory-policy.md' }),
  ]);

  assert.match(a.contents[0].text, /name: directory-architecture/);
  assert.match(b.contents[0].text, /name: memory-policy/);
  assert.notEqual(first.server, second.server);

  await first.server.close();

  // Closing one session must leave the other usable.
  const stillWorks = await second.client.listResources();
  assert.ok(stillWorks.resources.length > 0);

  await second.server.close();
});
