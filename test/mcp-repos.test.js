import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';
import { discoverRepos, inspectDirectory, selectRepos } from '../src/tools/mcp-repos.js';
import { EXIT_OK, run } from '../src/cli/run.js';

/** Builds a throwaway tree of repositories to discover. */
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'mcp-repos-'));

  const write = async (dir, name, body) => {
    await mkdir(join(root, dir), { recursive: true });
    await writeFile(join(root, dir, name), body);
  };

  // Qualifies twice over: SDK dependency plus an mcp keyword.
  await write('alpha-server', 'package.json', JSON.stringify({
    name: 'alpha-server',
    description: 'An alpha MCP server',
    dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
    keywords: ['mcp'],
  }));

  // Qualifies once, via a client config file.
  await write('beta-tools', 'package.json', JSON.stringify({ name: 'beta-tools' }));
  await write('beta-tools', '.mcp.json', '{"mcpServers":{}}');

  // Not an MCP repository: an agent repository with no MCP surface at all.
  await write('gamma-docs', 'package.json', JSON.stringify({ name: 'gamma-docs' }));
  await write('gamma-docs', 'AGENTS.md', '# AGENTS');

  // Must never be descended into, even though it looks like a match.
  await write(join('alpha-server', 'node_modules', 'decoy'), 'package.json', JSON.stringify({
    name: 'decoy',
    dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
  }));

  return root;
}

test('inspectDirectory: an AGENTS.md alone does not make a repository an MCP one', async () => {
  const root = await fixture();

  const alpha = await inspectDirectory(join(root, 'alpha-server'));
  assert.equal(alpha.name, 'alpha-server');
  assert.equal(alpha.confidence, 'high', 'two signals should read as high confidence');

  const beta = await inspectDirectory(join(root, 'beta-tools'));
  assert.equal(beta.confidence, 'low', 'one signal should read as low confidence');

  // The distinction that matters: agent repository != MCP repository.
  assert.equal(await inspectDirectory(join(root, 'gamma-docs')), null);
});

test('discoverRepos: scans a root and never descends into node_modules', async () => {
  const root = await fixture();
  const { repositories } = await discoverRepos({ roots: [root], env: {} });

  const names = repositories.map((repo) => repo.name).sort();
  assert.deepEqual(names, ['alpha-server', 'beta-tools']);
  assert.ok(!names.includes('decoy'), 'node_modules was scanned');
});

test('discoverRepos: a registry file contributes repositories with no checkout', async () => {
  const root = await fixture();
  const registryFile = join(root, 'registry.json');
  await writeFile(
    registryFile,
    JSON.stringify({
      repositories: [
        { name: 'remote-only', url: 'https://example.invalid/mcp', transport: 'http' },
      ],
    }),
  );

  const { repositories } = await discoverRepos({ roots: [root], registryFile, env: {} });
  const remote = repositories.find((repo) => repo.name === 'remote-only');

  assert.ok(remote, 'the registry entry was dropped');
  assert.equal(remote.source, 'registry');
  assert.equal(remote.path, null, 'a registry entry need not exist on disk');
});

test('discoverRepos: a missing root is skipped rather than fatal', async () => {
  const { repositories } = await discoverRepos({
    roots: ['/nonexistent-path-for-a-test'],
    env: {},
  });
  assert.deepEqual(repositories, []);
});

test('selectRepos: narrows without silently picking a winner', async () => {
  const root = await fixture();
  const { repositories } = await discoverRepos({ roots: [root], env: {} });

  const exact = selectRepos(repositories, 'alpha-server');
  assert.equal(exact.exact.name, 'alpha-server');

  // A substring that hits one repository still resolves, but not "exactly".
  const partial = selectRepos(repositories, 'beta');
  assert.equal(partial.exact, null);
  assert.deepEqual(partial.matches.map((repo) => repo.name), ['beta-tools']);

  assert.deepEqual(selectRepos(repositories, 'nothing-like-this').matches, []);
});

test('mcp_repos tool and the repos CLI command agree', async () => {
  const root = await fixture();

  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const viaTool = await client.callTool({ name: 'mcp_repos', arguments: { root } });
  assert.notEqual(viaTool.isError, true);
  assert.equal(viaTool.structuredContent.count, 2);
  assert.deepEqual(
    viaTool.structuredContent.repositories.map((repo) => repo.name).sort(),
    ['alpha-server', 'beta-tools'],
  );

  const chunks = [];
  const code = await run(['repos', '--root', root, '--json'], {
    write: (textOut) => chunks.push(textOut),
  });
  assert.equal(code, EXIT_OK);
  const viaCli = JSON.parse(chunks.join('\n'));

  assert.deepEqual(
    viaCli.repositories.map((repo) => repo.name).sort(),
    viaTool.structuredContent.repositories.map((repo) => repo.name).sort(),
  );

  await server.close();
});

test('mcp_repos: an empty result explains where it looked', async () => {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const result = await client.callTool({
    name: 'mcp_repos',
    arguments: { root: '/nonexistent-path-for-a-test' },
  });

  assert.equal(result.structuredContent.count, 0);
  assert.match(result.content[0].text, /MCP_REPOS_FILE|MCP_REPOS_ROOTS/);

  await server.close();
});
