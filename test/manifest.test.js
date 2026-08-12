import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { normalizeBody, parseFrontmatter } from '../src/content/frontmatter.js';
import { buildManifest } from '../src/server/manifest.js';
import { createServer } from '../src/server/create-server.js';

async function connect() {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, registry };
}

test('manifest: covers every file, sorted by path', async () => {
  const registry = await loadRegistry();
  const manifest = buildManifest(registry, '0.0.0');

  assert.equal(manifest.server, 'lxagents-agents-base');
  assert.equal(manifest.version, '0.0.0');
  assert.equal(manifest.count, registry.size);
  assert.equal(manifest.files.length, registry.size);
  assert.equal(manifest.overrideKey, 'name');

  const paths = manifest.files.map((file) => file.path);
  assert.deepEqual(paths, [...paths].sort((a, b) => a.localeCompare(b)));

  for (const file of manifest.files) {
    assert.ok(file.name && file.description && file.uri);
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
  }
});

test('manifest: is deterministic, so a client can cache and diff it', async () => {
  const registry = await loadRegistry();
  const first = JSON.stringify(buildManifest(registry, '0.0.0'));
  const second = JSON.stringify(buildManifest(await loadRegistry(), '0.0.0'));
  assert.equal(first, second);
  assert.doesNotMatch(first, /\d{4}-\d{2}-\d{2}T/, 'a timestamp would break caching and diffing');
});

test('manifest: hashes reproduce from the served file, which is what an audit relies on', async () => {
  const { client, server, registry } = await connect();

  const manifest = JSON.parse(
    (await client.readResource({ uri: 'agents://manifest.json' })).contents[0].text,
  );

  // Reproduce a hash exactly as a consuming repository would: read the file,
  // strip frontmatter, normalize, hash. If this drifts, every audit is wrong.
  const target = manifest.files.find((file) => file.path === 'rules/directories.md');
  const { contents } = await client.readResource({ uri: target.uri });
  const { body } = parseFrontmatter(contents[0].text);
  const { createHash } = await import('node:crypto');
  const recomputed = createHash('sha256').update(normalizeBody(body), 'utf8').digest('hex');

  assert.equal(recomputed, target.sha256);
  assert.equal(target.sha256, registry.get(target.uri).sha256);

  await server.close();
});

test('manifest: is served as JSON and listed as a resource', async () => {
  const { client, server, registry } = await connect();

  const { resources } = await client.listResources();
  const entry = resources.find((resource) => resource.uri === 'agents://manifest.json');
  assert.ok(entry, 'the manifest must be discoverable, not just readable');
  assert.equal(entry.mimeType, 'application/json');
  assert.equal(resources.length, registry.size + 1);

  await server.close();
});

test('duplicate audit prompt: is published and describes itself as on-request', async () => {
  const { client, server } = await connect();

  const { prompts } = await client.listPrompts();
  const audit = prompts.find((prompt) => prompt.name === 'check-duplicate-agents-instruction');

  assert.ok(audit, 'the audit prompt must be published');
  assert.match(audit.description, /only what the user approves/);
  assert.equal(audit.arguments, undefined);

  await server.close();
});

test('duplicate audit prompt: carries the procedure and the manifest inline', async () => {
  const { client, server, registry } = await connect();

  const result = await client.getPrompt({ name: 'check-duplicate-agents-instruction' });
  const text = result.messages[0].content.text;

  assert.ok(
    text.includes(registry.get('agents://rules/duplicate-instruction-audit.md').text),
    'the procedure must be delivered in full',
  );
  assert.match(text, /## Shared set manifest/);
  assert.match(text, /Deletion requires per-file approval/);

  // The inlined manifest must be valid JSON an agent can parse straight out.
  const json = text.slice(text.indexOf('```json') + 7, text.lastIndexOf('```'));
  const parsed = JSON.parse(json);
  assert.equal(parsed.count, registry.size);

  await server.close();
});

test('initialize instructions warn against running the audit unprompted', async () => {
  const { client, server } = await connect();
  assert.match(client.getInstructions(), /only when the user asks/);
  await server.close();
});
