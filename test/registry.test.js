import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { normalizeBody, parseFrontmatter } from '../src/content/frontmatter.js';
import { loadRegistry } from '../src/content/registry.js';
import { INSTRUCTION_FOLDERS } from '../src/constants.js';

test('frontmatter: reads name and description, and keeps colons in values', () => {
  const { data, body, hasFrontmatter } = parseFrontmatter(
    '---\nname: a-rule\ndescription: Do X: then Y\n---\n# Title\n\nBody.\n',
  );
  assert.equal(hasFrontmatter, true);
  assert.equal(data.name, 'a-rule');
  assert.equal(data.description, 'Do X: then Y');
  assert.equal(body, '# Title\n\nBody.\n');
});

test('frontmatter: a document without frontmatter is returned whole', () => {
  const { data, body, hasFrontmatter } = parseFrontmatter('# Plain\n');
  assert.equal(hasFrontmatter, false);
  assert.deepEqual(data, {});
  assert.equal(body, '# Plain\n');
});

test('normalizeBody: line endings and trailing whitespace do not change the hash input', () => {
  assert.equal(normalizeBody('a  \r\nb\t\r\n\r\n'), normalizeBody('a\nb\n'));
});

test('registry: loads the shipped instruction set with unique names and URIs', async () => {
  const registry = await loadRegistry();

  assert.ok(registry.size >= 20, `expected the full set, loaded ${registry.size}`);

  const names = new Set();
  const uris = new Set();
  for (const entry of registry.entries) {
    assert.ok(entry.description.length <= 140, `${entry.path}: description over 140 chars`);
    assert.match(entry.name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${entry.path}: name is not kebab-case`);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
    names.add(entry.name);
    uris.add(entry.uri);
  }
  assert.equal(names.size, registry.size);
  assert.equal(uris.size, registry.size);
});

test('registry: entries are reachable by URI and by name, and are frozen', async () => {
  const registry = await loadRegistry();

  const entry = registry.get('agents://rules/directories.md');
  assert.ok(entry, 'directories.md should be published');
  assert.equal(entry.name, 'directory-architecture');
  assert.equal(registry.getByName('directory-architecture'), entry);
  assert.ok(Object.isFrozen(entry), 'entries must be immutable — every session shares them');
  assert.equal(registry.get('agents://nope.md'), undefined);
});

test('registry: this repository\'s own .agents/ set is never published', async () => {
  const registry = await loadRegistry();

  // content/ is the product; .agents/ is this repository's own instruction set.
  // Publishing a local rule would broadcast a repository-specific convention to
  // every consumer, which is the exact failure the separation exists to prevent.
  const leaked = registry.entries.filter((entry) => entry.path.includes('.agents'));
  assert.deepEqual(leaked, [], 'a local instruction file leaked into the published set');

  for (const entry of registry.entries) {
    assert.doesNotMatch(entry.uri, /\.agents/, `${entry.uri} is not part of the product`);
  }

  // Local names must not collide with shared ones by accident: a matching name
  // is an override, and an unintended one silently shadows a published rule.
  const { readFile, readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const localNames = [];
  for (const folder of ['rules', 'index', 'wiki/context', 'memory/state', 'memory/tasks']) {
    const dir = join('.agents', folder);
    for (const file of await readdir(dir)) {
      const raw = await readFile(join(dir, file), 'utf8');
      const name = /^name:\s*(.+)$/m.exec(raw)?.[1]?.trim();
      assert.ok(name, `${dir}/${file} has no frontmatter name`);
      localNames.push(name);
    }
  }

  assert.equal(new Set(localNames).size, localNames.length, 'duplicate name within .agents/');
  for (const name of localNames) {
    assert.equal(
      registry.getByName(name),
      undefined,
      `local name "${name}" collides with a published file — that would be an undeclared override`,
    );
  }
});

test('registry: the discovery-protocol block is byte-identical in every copy', async () => {
  const registry = await loadRegistry();

  // The canonical block is the first fenced code block in discovery-protocol.md.
  // Each creator reproduces it verbatim; that duplication is deliberate and
  // bounded, so it is worth a test rather than a comment.
  const fenced = (text) => text.split(/^```$/m)[1];
  const canonical = fenced(registry.get('agents://rules/discovery-protocol.md').text);
  assert.ok(canonical?.includes('Discovery Protocol'), 'canonical block not found');

  const copies = registry.entries.filter((entry) => entry.folder === 'creators');
  assert.equal(copies.length, 5, 'all five creators must exist');
  for (const copy of copies) {
    const block = copy.text.slice(copy.text.indexOf('## Discovery Protocol'));
    assert.equal(fenced(block), canonical, `${copy.path} has drifted from the canonical block`);
  }
});

test('a file under content/security/ is collected and served', async () => {
  // The failure this guards is silence, not an error. `collectPaths` walks
  // INSTRUCTION_FOLDERS and nothing else, so a folder missing from that list
  // is skipped: the file is absent from the manifest, absent from agents://,
  // and absent from every other test. `directories.md` has declared
  // `security/` a usable shared folder since it was written, which is exactly
  // why an author would expect this to work without checking.
  const dir = await mkdtemp(join(tmpdir(), 'lxagents-security-'));
  try {
    await writeFile(
      join(dir, 'AGENTS.md'),
      '---\nname: fixture-entry-point\ndescription: Fixture entry point.\n---\n\n# Fixture\n',
    );
    await mkdir(join(dir, 'security'));
    await writeFile(
      join(dir, 'security', 'secret-handling.md'),
      '---\nname: fixture-secret-handling\ndescription: Fixture security rule.\n---\n\n# Secret Handling\n',
    );

    const registry = await loadRegistry({ contentDir: dir });
    const entry = registry.getByName('fixture-secret-handling');

    assert.ok(entry, 'a file under security/ must reach the registry');
    assert.equal(entry.folder, 'security');
    assert.equal(entry.uri, 'agents://security/secret-handling.md');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('INSTRUCTION_FOLDERS keeps index last, so a new folder is added above it', () => {
  // Ordering is not cosmetic: `index/` holds routers rather than instructions,
  // and every listing built from this constant reads better with the routing
  // folder last. Pinned because the natural way to add a folder is to append.
  assert.equal(INSTRUCTION_FOLDERS.at(-1), 'index');
  assert.ok(INSTRUCTION_FOLDERS.includes('security'));
});
