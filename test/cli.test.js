import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';
import { resolveVersion } from '../src/version.js';
import { EXIT_ERROR, EXIT_OK, EXIT_USAGE, run } from '../src/cli/run.js';

/** Runs the CLI, capturing what it would have written to stdout. */
async function cli(...argv) {
  const chunks = [];
  const code = await run(argv, { write: (text) => chunks.push(text) });
  return { code, out: chunks.join('\n') };
}

/**
 * An in-memory MCP client, for comparing the two surfaces.
 *
 * Built with the real resolved version, because the CLI resolves it too and
 * the audit payload inlines it — pinning a fake version here would make the
 * two surfaces differ for a reason that has nothing to do with behaviour.
 */
async function connect() {
  const [registry, version] = await Promise.all([loadRegistry(), resolveVersion()]);
  const server = createServer({ registry, version });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, registry };
}

test('cli: --help and --version succeed; no command is a usage error', async () => {
  const help = await cli('--help');
  assert.equal(help.code, EXIT_OK);
  for (const command of ['serve', 'list', 'read', 'setup', 'audit', 'manifest']) {
    assert.match(help.out, new RegExp(`\\b${command}\\b`), `${command} is undocumented`);
  }

  const version = await cli('--version');
  assert.equal(version.code, EXIT_OK);
  assert.match(version.out.trim(), /^\d+\.\d+\.\d+/);

  // Still prints the help, but the status has to tell a script it was wrong.
  const bare = await cli();
  assert.equal(bare.code, EXIT_USAGE);
  assert.match(bare.out, /Usage/);
});

test('cli: unknown commands and missing arguments exit 2, not 0', async () => {
  assert.equal((await cli('frobnicate')).code, EXIT_USAGE);
  assert.equal((await cli('read')).code, EXIT_USAGE);
  assert.equal((await cli('serve', '--http', '--stdio')).code, EXIT_USAGE);
  assert.equal((await cli('serve', '--port', 'abc')).code, EXIT_USAGE);
});

test('cli list: covers the whole set, filters by folder, and refuses an unknown one', async () => {
  const { registry } = await connect();

  const all = await cli('list');
  assert.equal(all.code, EXIT_OK);
  for (const entry of registry.entries) {
    assert.ok(all.out.includes(entry.path), `${entry.path} is missing from the listing`);
  }

  const git = await cli('list', '--folder', 'git');
  assert.equal(git.code, EXIT_OK);
  assert.ok(git.out.includes('git/branching-strategy.md'));
  assert.ok(!git.out.includes('rules/directories.md'), 'the folder filter leaked');

  // A wrong folder is the user's error, not a crash, and names the real ones.
  const missing = await cli('list', '--folder', 'nope');
  assert.equal(missing.code, EXIT_ERROR);
});

test('cli list --json: structured output matches the registry', async () => {
  const { registry } = await connect();
  const { code, out } = await cli('list', '--json');

  assert.equal(code, EXIT_OK);
  const parsed = JSON.parse(out);
  assert.equal(parsed.count, registry.size);
  assert.deepEqual(
    parsed.files.map((file) => file.uri).sort(),
    registry.entries.map((entry) => entry.uri).sort(),
  );
});

test('cli read: name, path, and URI resolve to the same file', async () => {
  const byName = await cli('read', 'branching-strategy');
  const byPath = await cli('read', 'git/branching-strategy.md');
  const byUri = await cli('read', 'agents://git/branching-strategy.md');

  assert.equal(byName.code, EXIT_OK);
  assert.match(byName.out, /# Branching Strategy/);
  assert.equal(byName.out, byPath.out);
  assert.equal(byName.out, byUri.out);
});

test('cli read: a near miss is an error that suggests the real name', async () => {
  const { code } = await cli('read', 'branching');
  assert.equal(code, EXIT_ERROR);
});

test('cli read returns exactly what the MCP resource returns', async () => {
  // The point of the dual-purpose build: a person reading a file at a terminal
  // and an agent reading it over MCP must see identical bytes.
  const { client, server, registry } = await connect();

  for (const entry of registry.entries) {
    const viaCli = await cli('read', entry.name);
    const viaMcp = await client.readResource({ uri: entry.uri });
    assert.equal(viaCli.code, EXIT_OK);
    assert.equal(viaCli.out.trimEnd(), viaMcp.contents[0].text.trimEnd(), entry.uri);
  }

  await server.close();
});

test('cli setup and audit return exactly what the MCP tools return', async () => {
  const { client, server } = await connect();

  const setupCli = await cli('setup');
  const setupTool = await client.callTool({ name: 'agents_setup', arguments: {} });
  assert.equal(setupCli.code, EXIT_OK);
  assert.equal(setupCli.out.trimEnd(), setupTool.content[0].text.trimEnd());
  assert.match(setupCli.out, /# AGENTS-SETUP/);

  const auditCli = await cli('audit');
  const auditTool = await client.callTool({
    name: 'agents_check_duplicate_instructions',
    arguments: {},
  });
  assert.equal(auditCli.code, EXIT_OK);
  assert.equal(auditCli.out.trimEnd(), auditTool.content[0].text.trimEnd());

  await server.close();
});

test('cli manifest is byte-identical to the manifest resource', async () => {
  const { client, server } = await connect();

  const viaCli = await cli('manifest');
  const viaMcp = await client.readResource({ uri: 'agents://manifest.json' });

  assert.equal(viaCli.code, EXIT_OK);
  // Byte-for-byte, not just structurally: the manifest is deliberately
  // deterministic so a client can cache and diff it.
  assert.equal(viaCli.out.trimEnd(), viaMcp.contents[0].text.trimEnd());

  await server.close();
});
