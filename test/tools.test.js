import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';

async function connect() {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.1.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, registry };
}

test('tools/list: publishes the four tools, all read-only', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();

  assert.deepEqual(names, [
    'agents_check_duplicate_instructions',
    'agents_list_instructions',
    'agents_read_instruction',
    'agents_setup',
  ]);

  for (const tool of tools) {
    assert.ok(tool.description, `${tool.name} needs a description`);
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} must be read-only`);
    assert.equal(tool.annotations?.destructiveHint, false);
  }

  await server.close();
});

test('the two entry-point tools declare no required arguments', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  for (const name of ['agents_setup', 'agents_check_duplicate_instructions']) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.deepEqual(tool.inputSchema.required ?? [], [], `${name} must be callable with no args`);
  }

  await server.close();
});

test('agents_setup returns the same text as the agents-setup prompt', async () => {
  const { client, server } = await connect();

  // The two surfaces exist for different clients; a repository set up through
  // one must get identical instructions to one set up through the other.
  const viaTool = await client.callTool({ name: 'agents_setup', arguments: {} });
  const viaPrompt = await client.getPrompt({ name: 'agents-setup' });

  assert.notEqual(viaTool.isError, true);
  assert.equal(viaTool.content[0].text, viaPrompt.messages[0].content.text);
  assert.match(viaTool.content[0].text, /# AGENTS-SETUP/);

  await server.close();
});

test('agents_setup is callable with arguments omitted entirely', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({ name: 'agents_setup' });
  assert.notEqual(result.isError, true);
  assert.ok(result.content[0].text.length > 10_000);

  await server.close();
});

test('agents_check_duplicate_instructions matches its prompt and inlines the manifest', async () => {
  const { client, server, registry } = await connect();

  const viaTool = await client.callTool({
    name: 'agents_check_duplicate_instructions',
    arguments: {},
  });
  const viaPrompt = await client.getPrompt({ name: 'check-duplicate-agents-instruction' });

  assert.equal(viaTool.content[0].text, viaPrompt.messages[0].content.text);

  const body = viaTool.content[0].text;
  assert.match(body, /Deletion requires per-file approval/);
  const json = body.slice(body.indexOf('```json') + 7, body.lastIndexOf('```'));
  assert.equal(JSON.parse(json).count, registry.size);

  await server.close();
});

test('agents_list_instructions returns every file with structured output', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({ name: 'agents_list_instructions', arguments: {} });

  assert.notEqual(result.isError, true);
  assert.equal(result.structuredContent.count, registry.size);
  assert.equal(result.structuredContent.files.length, registry.size);
  for (const file of result.structuredContent.files) {
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
    assert.ok(file.description);
  }
  assert.match(result.content[0].text, /\| Path \| name \| Purpose \|/);

  await server.close();
});

test('agents_list_instructions filters by folder', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({
    name: 'agents_list_instructions',
    arguments: { folder: 'git' },
  });

  const expected = registry.entries.filter((entry) => entry.folder === 'git').length;
  assert.equal(result.structuredContent.count, expected);
  assert.ok(result.structuredContent.files.every((file) => file.folder === 'git'));

  await server.close();
});

test('agents_list_instructions names the real folders when given an unknown one', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_list_instructions',
    arguments: { folder: 'nope' },
  });

  assert.equal(result.isError, true);
  // An error that lists the alternatives saves a second round trip.
  assert.match(result.content[0].text, /Available folders: .*rules/);

  await server.close();
});

test('agents_read_instruction accepts a name, a path, or a URI', async () => {
  const { client, server, registry } = await connect();

  const expected = registry.get('agents://rules/directories.md').text;

  for (const instruction of [
    'directory-architecture',
    'rules/directories.md',
    'agents://rules/directories.md',
  ]) {
    const result = await client.callTool({ name: 'agents_read_instruction', arguments: { instruction } });
    assert.notEqual(result.isError, true, `${instruction} should resolve`);
    assert.equal(result.content[0].text, expected, `${instruction} returned the wrong file`);
  }

  await server.close();
});

test('agents_read_instruction suggests near matches instead of just refusing', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_read_instruction',
    arguments: { instruction: 'directories' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Did you mean: .*directory-architecture/);

  await server.close();
});

test('agents_read_instruction points at the listing when nothing is close', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_read_instruction',
    arguments: { instruction: 'zzzzz' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /agents_list_instructions/);

  await server.close();
});

test('initialize instructions cover both surfaces and the on-request audit', async () => {
  const { client, server } = await connect();

  const instructions = client.getInstructions();
  assert.match(instructions, /agents_setup/);
  assert.match(instructions, /agents_list_instructions/);
  assert.match(instructions, /only when the user asks/);
  assert.match(instructions, /same text/);

  await server.close();
});
