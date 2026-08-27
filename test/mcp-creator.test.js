import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';
import {
  buildContext,
  buildSetupDoc,
  scaffoldRepo,
  writeScaffold,
} from '../src/tools/mcp-creator.js';
import { EXIT_ERROR, EXIT_OK, EXIT_USAGE, run } from '../src/cli/run.js';

const execFileAsync = promisify(execFile);
const SETUP_DOC = 'wiki/environments/setup.md';

async function tempDir() {
  return mkdtemp(join(tmpdir(), 'mcp-creator-'));
}

/**
 * A scratch directory *inside* the working directory.
 *
 * The MCP tool pins its target inside `process.cwd()` on purpose — a model
 * fills that argument in, so it does not get to name an absolute path — which
 * means the tool cannot be exercised against `os.tmpdir()` the way the library
 * can.
 */
async function tempDirInCwd() {
  return mkdtemp(join(process.cwd(), '.mcp-creator-test-'));
}

test('buildContext: a scope stays on the package but never on the bins', () => {
  const scoped = buildContext('@acme/weather-mcp');
  assert.equal(scoped.packageName, '@acme/weather-mcp');
  assert.equal(scoped.slug, 'weather-mcp');
  assert.equal(scoped.serverId, 'weather-mcp');
  assert.equal(scoped.binCli, 'weather-mcp');
  assert.equal(scoped.binServer, 'weather-mcp-server');

  // Anything that cannot sit in a bin name or a URI is normalised away.
  assert.equal(buildContext('Weather Service!').slug, 'weather-service');

  assert.throws(() => buildContext('   '), /name is required/);
  assert.throws(() => buildContext('!!!'), /usable repository name/);
});

test('buildSetupDoc: documents both modes with the names the package declares', () => {
  const context = buildContext('@acme/weather-mcp');
  const doc = buildSetupDoc(context);

  // The requirement this tool exists to satisfy: both modes, precisely.
  assert.match(doc, /## CLI mode/);
  assert.match(doc, /## Server mode/);

  // Each mode gets its own install section, not just a mention.
  const cliMode = doc.slice(doc.indexOf('## CLI mode'), doc.indexOf('## Server mode'));
  const serverMode = doc.slice(doc.indexOf('## Server mode'));
  assert.match(cliMode, /### Install/);
  assert.match(serverMode, /### Install/);

  assert.match(cliMode, /npm install -g @acme\/weather-mcp/);
  assert.match(cliMode, /npm link/);
  assert.match(serverMode, /"mcpServers"/);
  assert.match(serverMode, /weather-mcp-server/);
  assert.match(serverMode, /weather-mcp serve --http/);
});

test('every scaffold ships a setup doc naming its own bins', () => {
  for (const name of ['weather-mcp', '@acme/tickets', 'Some Service']) {
    const plan = scaffoldRepo({ name, cwd: '/tmp' });

    const setup = plan.files.find((file) => file.path === SETUP_DOC);
    assert.ok(setup, `${name} was scaffolded without ${SETUP_DOC}`);

    // The doc must name the bins this very scaffold declares, or it documents
    // a repository that does not exist.
    const pkg = JSON.parse(
      plan.files.find((file) => file.path === 'package.json').contents,
    );
    for (const bin of Object.keys(pkg.bin)) {
      assert.ok(setup.contents.includes(bin), `${name}: setup.md never mentions ${bin}`);
    }
    assert.match(setup.contents, /## CLI mode/);
    assert.match(setup.contents, /## Server mode/);
  }
});

test('scaffoldRepo plans without touching the disk', async () => {
  const root = await tempDir();
  const target = join(root, 'weather-mcp');

  const plan = scaffoldRepo({ name: 'weather-mcp', directory: target });
  assert.equal(plan.target, target);
  assert.ok(plan.files.length >= 10);

  assert.deepEqual(await readdir(root), [], 'planning wrote something');
});

test('writeScaffold: creates the tree, then refuses to clobber it', async () => {
  const root = await tempDir();
  const target = join(root, 'weather-mcp');
  const plan = scaffoldRepo({ name: 'weather-mcp', directory: target });

  const { written } = await writeScaffold(plan);
  assert.ok(written.includes(SETUP_DOC));
  assert.ok(written.includes('package.json'));

  const setup = await readFile(join(target, SETUP_DOC), 'utf8');
  assert.match(setup, /## CLI mode/);
  assert.match(setup, /## Server mode/);

  // Refusing is the point: the alternative is overwriting someone's work.
  await assert.rejects(() => writeScaffold(plan), /already exists and is not empty/);
  await writeScaffold(plan, { force: true });
});

test('the generated JavaScript actually parses', async () => {
  const root = await tempDir();
  const target = join(root, 'weather-mcp');
  await writeScaffold(scaffoldRepo({ name: 'weather-mcp', directory: target }));

  const scripts = ['src/index.js', 'src/cli.js', 'src/server.js', 'src/version.js'];
  for (const script of scripts) {
    // A scaffold that emits code with a syntax error is worse than none.
    await execFileAsync(process.execPath, ['--check', join(target, script)]);
  }

  const pkg = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(pkg.bin).sort(), ['weather-mcp', 'weather-mcp-server']);
  assert.equal(pkg.type, 'module');
});

test('mcp_creator tool: dry by default, and writes only when asked', async (t) => {
  const root = await tempDirInCwd();
  t.after(() => rm(root, { recursive: true, force: true }));
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const target = join(root, 'weather-mcp');

  const planned = await client.callTool({
    name: 'mcp_creator',
    arguments: { name: 'weather-mcp', directory: target },
  });
  assert.notEqual(planned.isError, true);
  assert.equal(planned.structuredContent.written, false);
  assert.ok(planned.structuredContent.files.includes(SETUP_DOC));
  assert.deepEqual(await readdir(root), [], 'the default call wrote to disk');

  const created = await client.callTool({
    name: 'mcp_creator',
    arguments: { name: 'weather-mcp', directory: target, write: true },
  });
  assert.equal(created.structuredContent.written, true);
  assert.equal(created.structuredContent.binServer, 'weather-mcp-server');
  assert.match(await readFile(join(target, SETUP_DOC), 'utf8'), /## Server mode/);

  // A bad name is a message the model can act on, not a thrown exception.
  const bad = await client.callTool({ name: 'mcp_creator', arguments: { name: '!!!' } });
  assert.equal(bad.isError, true);

  await server.close();
});

test('scaffoldRepo: a directory that climbs out of the working directory is refused', async () => {
  const root = await tempDir();

  // Relative means "inside the working directory". Climbing out of it is
  // traversal, and the plan is where it has to be caught: every filesystem
  // call downstream reads plan.target.
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: '../../etc', cwd: root }),
    /escapes the working directory/,
  );
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: 'a/../../../etc', cwd: root }),
    /escapes the working directory/,
  );
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: 'ok\u0000/../../etc', cwd: root }),
    /null byte/,
  );
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: '   ', cwd: root }),
    /non-empty path/,
  );
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: '/', cwd: root }),
    /filesystem root/,
  );

  // A sibling whose name merely starts with dots is not a climb.
  const dotty = scaffoldRepo({ name: 'weather-mcp', directory: '..config', cwd: root });
  assert.equal(dotty.target, join(root, '..config'));

  // An absolute directory stays allowed: that is what the CLI flag is for.
  const explicit = join(root, 'elsewhere');
  assert.equal(scaffoldRepo({ name: 'weather-mcp', directory: explicit, cwd: root }).target, explicit);

  // Unless a boundary is pinned, which is what the MCP tool does.
  assert.throws(
    () => scaffoldRepo({ name: 'weather-mcp', directory: '/tmp/anywhere', cwd: root, root }),
    /resolves outside/,
  );
});

test('writeScaffold: a plan entry cannot write outside its own target', async () => {
  const root = await tempDir();
  const plan = scaffoldRepo({ name: 'weather-mcp', directory: join(root, 'weather-mcp') });

  // A plan is a plain object and can be built by hand, so the write loop
  // re-checks rather than trusting that scaffoldRepo produced it.
  const tampered = {
    ...plan,
    files: [{ path: '../../escaped.js', contents: 'nope' }],
  };
  await assert.rejects(() => writeScaffold(tampered), /escapes/);
  assert.deepEqual(await readdir(root), [], 'the refused write still created something');
});

test('mcp_creator tool: refuses a directory outside the working directory', async () => {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  // The model picks this argument, so an absolute path is not its to pick.
  const escaped = await client.callTool({
    name: 'mcp_creator',
    arguments: { name: 'weather-mcp', directory: '../../escaped', write: true },
  });
  assert.equal(escaped.isError, true);

  const absolute = await client.callTool({
    name: 'mcp_creator',
    arguments: { name: 'weather-mcp', directory: join(tmpdir(), 'escaped-mcp'), write: true },
  });
  assert.equal(absolute.isError, true);

  await server.close();
});

test('mcp_creator declares itself as writing, but never destroying', async () => {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.0.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools } = await client.listTools();
  const creator = tools.find((tool) => tool.name === 'mcp_creator');

  assert.equal(creator.annotations.readOnlyHint, false, 'it creates files');
  assert.equal(creator.annotations.destructiveHint, false, 'it refuses a non-empty target');

  await server.close();
});

test('create CLI: agrees with the tool and defaults to planning', async () => {
  const root = await tempDir();
  const target = join(root, 'weather-mcp');

  const chunks = [];
  const code = await run(['create', 'weather-mcp', '--directory', target, '--json'], {
    write: (text) => chunks.push(text),
  });
  assert.equal(code, EXIT_OK);

  const parsed = JSON.parse(chunks.join('\n'));
  assert.equal(parsed.written, false);
  assert.equal(parsed.binCli, 'weather-mcp');
  assert.ok(parsed.files.includes(SETUP_DOC));
  assert.deepEqual(await readdir(root), [], 'the CLI wrote without --write');

  assert.equal(await run(['create'], { write: () => {} }), EXIT_USAGE);
  assert.equal(await run(['create', '!!!'], { write: () => {} }), EXIT_ERROR);
});

test('create CLI --write: the tree it produces is the tree it planned', async () => {
  const root = await tempDir();
  const target = join(root, 'weather-mcp');

  const chunks = [];
  await run(['create', 'weather-mcp', '--directory', target, '--write', '--json'], {
    write: (text) => chunks.push(text),
  });
  const parsed = JSON.parse(chunks.join('\n'));
  assert.equal(parsed.written, true);

  for (const file of parsed.files) {
    await readFile(join(target, file), 'utf8');
  }

  // A second run must not silently overwrite it.
  assert.equal(
    await run(['create', 'weather-mcp', '--directory', target, '--write'], { write: () => {} }),
    EXIT_ERROR,
  );

  // Unless forced.
  await writeFile(join(target, 'extra.txt'), 'x');
  assert.equal(
    await run(['create', 'weather-mcp', '--directory', target, '--write', '--force'], {
      write: () => {},
    }),
    EXIT_OK,
  );
});
