/**
 * `mcp-creator` — scaffolding a new MCP repository.
 *
 * The generated repository is **dual-purpose from the first commit**: it ships
 * a CLI bin and a server bin over one shared implementation, the same shape
 * this repository has. That is a deliberate default rather than a flourish —
 * a repository that starts server-only grows a CLI later by bolting a second
 * entry point onto code that assumed stdout was free, and by then the two
 * surfaces have already drifted.
 *
 * Because the layout is fixed, its documentation can be generated with it:
 * `buildSetupDoc` emits `wiki/environments/setup.md` with real install and run
 * instructions for **both** modes, derived from the same names the manifest
 * and the bins use. Every repository this tool creates is therefore documented
 * for both modes on the day it is created, which is the only day anyone
 * reliably writes that page.
 *
 * Scaffolding is planned and written in two steps. `scaffoldRepo` returns the
 * full file list without touching the disk; `writeScaffold` commits it. The
 * tool surface defaults to the plan, so a model that calls it speculatively
 * cannot litter someone's filesystem.
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/** Strips a scope and anything that cannot sit in a bin name or a URI. */
function slugify(value) {
  const withoutScope = value.includes('/') ? value.slice(value.lastIndexOf('/') + 1) : value;
  const slug = withoutScope
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug;
}

/** Title-cases a slug for prose and for the server title. */
function titleize(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Derives every name the scaffold needs from the one the caller supplied.
 *
 * Centralised because the bins, the server id, the package name and the docs
 * must agree: a setup page that names a bin the package.json does not declare
 * is worse than no setup page.
 */
export function buildContext(name, { description = null } = {}) {
  const packageName = name.trim();
  if (!packageName) throw new Error('a repository name is required');

  const slug = slugify(packageName);
  if (!slug) throw new Error(`"${name}" does not reduce to a usable repository name`);

  return Object.freeze({
    packageName,
    slug,
    title: titleize(slug),
    serverId: slug,
    binCli: slug,
    binServer: `${slug}-server`,
    description: description?.trim() || `MCP server and CLI for ${titleize(slug)}.`,
  });
}

/**
 * The generated `wiki/environments/setup.md`.
 *
 * This is the piece the tool exists to guarantee. It documents CLI mode and
 * server mode separately — install, run, and verify for each — using the names
 * from `buildContext`, so the commands in it are the commands that actually
 * work in the repository it ships with.
 *
 * @param {ReturnType<typeof buildContext>} context
 * @returns {string}
 */
export function buildSetupDoc(context) {
  const { packageName, slug, binCli, binServer, serverId, title } = context;

  return [
    '# Local Setup',
    '',
    `\`${packageName}\` is **dual-purpose**. The same code is reachable two ways:`,
    '',
    '| Mode | What it is | Who uses it |',
    '|---|---|---|',
    '| **CLI mode** | A terminal command | A person running it by hand or from a script |',
    '| **Server mode** | An MCP server over stdio or streamable HTTP | An MCP client — an editor, an agent, a connector |',
    '',
    'Both modes share one implementation, so a result produced in one is identical to the',
    'same result produced in the other.',
    '',
    '## Requirements',
    '',
    'Node.js 20 or newer. There is no build step.',
    '',
    '```bash',
    'npm install',
    'npm test',
    '```',
    '',
    '---',
    '',
    '## CLI mode',
    '',
    '### Install',
    '',
    '```bash',
    '# From a checkout, for development',
    'npm install',
    `npm link                 # puts ${binCli} on PATH`,
    '',
    '# Or globally, from the registry',
    `npm install -g ${packageName}`,
    '```',
    '',
    'Without installing anything:',
    '',
    '```bash',
    'node src/cli.js --help',
    'npm run cli -- --help',
    '```',
    '',
    '### Use',
    '',
    '```bash',
    `${binCli} --help          # every command`,
    `${binCli} --version       # the version`,
    `${binCli} tools           # list the tools this server exposes`,
    '```',
    '',
    '### Exit codes',
    '',
    '| Code | Meaning |',
    '|---|---|',
    '| `0` | Success |',
    '| `1` | The request was understood but could not be satisfied |',
    '| `2` | The command line itself was wrong |',
    '',
    '---',
    '',
    '## Server mode',
    '',
    '### Install',
    '',
    'An MCP client spawns the server as a subprocess, so installing it means pointing the',
    `client at it. Either bin works — \`${binServer}\` is the server directly, and`,
    `\`${binCli} serve\` reaches the same server through the CLI.`,
    '',
    '```json',
    '{',
    '  "mcpServers": {',
    `    "${serverId}": {`,
    '      "command": "node",',
    '      "args": ["src/index.js"],',
    `      "cwd": "/path/to/${slug}"`,
    '    }',
    '  }',
    '}',
    '```',
    '',
    'Once the package is installed globally, the bin can be named directly instead:',
    '',
    '```json',
    '{',
    '  "mcpServers": {',
    `    "${serverId}": {`,
    `      "command": "${binServer}"`,
    '    }',
    '  }',
    '}',
    '```',
    '',
    'For a remote connector, point the client at `https://<host>/mcp` — **including the',
    '`/mcp` path**. Without it the handshake fails, and clients report that as a sign-in',
    'error rather than a wrong address.',
    '',
    '### Run',
    '',
    '```bash',
    '# stdio — one client, for an editor or an agent',
    'npm start',
    `${binCli} serve --stdio`,
    '',
    '# streamable HTTP — the connector surface',
    'npm run start:http',
    `${binCli} serve --http --port 3000`,
    '```',
    '',
    'Check it is up:',
    '',
    '```bash',
    'curl -s http://localhost:3000/healthz',
    '```',
    '',
    '### Inspect it',
    '',
    '```bash',
    'npm run inspect',
    '```',
    '',
    'This runs the MCP Inspector against the stdio server, listing every tool and letting',
    'you call them.',
    '',
    '### stdout belongs to the protocol',
    '',
    'On the stdio transport, stdout **is** the JSON-RPC channel. Logging goes to stderr,',
    'and `serve` prints nothing of its own. Only CLI commands write to stdout. A',
    '`console.log` on the server path is a bug that corrupts the protocol stream.',
    '',
    '## Related pages',
    '',
    `- [\`README.md\`](../../README.md) — what ${title} is for.`,
    '- [`AGENTS.md`](../../AGENTS.md) — how agents work in this repository.',
    '',
  ].join('\n');
}

/** `package.json` for the generated repository — both bins, no build step. */
function buildPackageJson(context) {
  return `${JSON.stringify(
    {
      name: context.packageName,
      version: '0.1.0',
      description: context.description,
      type: 'module',
      main: 'src/index.js',
      bin: {
        [context.binCli]: 'src/cli.js',
        [context.binServer]: 'src/index.js',
      },
      files: ['src', 'README.md'],
      scripts: {
        start: 'node src/index.js',
        'start:http': 'MCP_TRANSPORT=http node src/index.js',
        cli: 'node src/cli.js',
        test: 'node --test',
        inspect: 'npx @modelcontextprotocol/inspector node src/index.js',
      },
      engines: { node: '>=20' },
      license: 'MIT',
      keywords: ['mcp', 'model-context-protocol'],
      dependencies: { '@modelcontextprotocol/sdk': '^1.30.0' },
    },
    null,
    2,
  )}\n`;
}

/** The MCP server itself — one tool, enough to prove the wiring. */
function buildServer(context) {
  return [
    '/**',
    ' * The MCP server.',
    ' *',
    ' * A fresh instance per connection: McpServer holds per-connection state, so',
    ' * sharing one across simultaneous clients delivers responses to the wrong',
    ' * connection.',
    ' */',
    '',
    "import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';",
    '',
    `export const SERVER_ID = '${context.serverId}';`,
    `export const SERVER_TITLE = '${context.title}';`,
    '',
    '/** Every tool this server exposes, described once and shared by both modes. */',
    'export const TOOLS = Object.freeze([',
    '  {',
    "    name: 'ping',",
    "    title: 'Ping',",
    "    description: 'Return pong, to prove the server is reachable. Takes no arguments.',",
    '    run: async () => "pong",',
    '  },',
    ']);',
    '',
    '/** @returns {McpServer} */',
    'export function createServer({ version }) {',
    '  const server = new McpServer(',
    '    { name: SERVER_ID, title: SERVER_TITLE, version },',
    '    { instructions: `${SERVER_TITLE} — call the tools listed below.` },',
    '  );',
    '',
    '  for (const tool of TOOLS) {',
    '    server.registerTool(',
    '      tool.name,',
    '      {',
    '        title: tool.title,',
    '        description: tool.description,',
    '        annotations: {',
    '          readOnlyHint: true,',
    '          destructiveHint: false,',
    '          idempotentHint: true,',
    '          openWorldHint: false,',
    '        },',
    '      },',
    '      async () => ({ content: [{ type: "text", text: await tool.run() }] }),',
    '    );',
    '  }',
    '',
    '  return server;',
    '}',
    '',
  ].join('\n');
}

/**
 * The server entry point — what an MCP client spawns.
 *
 * Serves stdio by default and streamable HTTP when asked, because the setup
 * page the scaffold ships documents both. Generating a document that promises
 * a mode the code does not have is the drift this whole repository exists to
 * prevent, so the scaffold implements what its docs claim.
 *
 * HTTP uses node:http and the SDK transport directly — no web framework, so
 * the generated repository keeps a single runtime dependency.
 */
function buildServerEntry() {
  return [
    '#!/usr/bin/env node',
    '/**',
    ' * Server entry point — what an MCP client spawns.',
    ' *',
    ' * The CLI half is src/cli.js. Both reach the same createServer, so neither',
    ' * can expose a tool the other cannot.',
    ' *',
    ' * Nothing here may write to stdout: on stdio, stdout is the JSON-RPC channel.',
    ' */',
    '',
    "import { createServer as createHttpServer } from 'node:http';",
    '',
    "import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';",
    "import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';",
    '',
    "import { SERVER_ID, createServer } from './server.js';",
    "import { version } from './version.js';",
    '',
    "const transportName = (process.env.MCP_TRANSPORT ?? 'stdio').toLowerCase();",
    'const port = Number.parseInt(process.env.PORT ?? "3000", 10);',
    '',
    '/** Reads a request body, bounded so one client cannot exhaust memory. */',
    'async function readBody(req, limit = 4 * 1024 * 1024) {',
    '  const chunks = [];',
    '  let size = 0;',
    '  for await (const chunk of req) {',
    '    size += chunk.length;',
    '    if (size > limit) throw new Error("request body too large");',
    '    chunks.push(chunk);',
    '  }',
    '  if (chunks.length === 0) return undefined;',
    '  return JSON.parse(Buffer.concat(chunks).toString("utf8"));',
    '}',
    '',
    'function rpcError(res, status, code, message) {',
    '  res.writeHead(status, { "content-type": "application/json" });',
    '  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }));',
    '}',
    '',
    'if (transportName === "http" || transportName === "streamable-http") {',
    '  // Stateless: a fresh server and transport per request, discarded after.',
    '  // Nothing is shared between requests, so any process can serve any request.',
    '  const httpServer = createHttpServer(async (req, res) => {',
    '    if (req.method === "GET" && req.url === "/healthz") {',
    '      res.writeHead(200, { "content-type": "application/json" });',
    '      res.end(JSON.stringify({ status: "ok", server: SERVER_ID, version }));',
    '      return;',
    '    }',
    '',
    '    if (req.url !== "/mcp") {',
    '      rpcError(res, 404, -32601, `Not found: ${req.url}`);',
    '      return;',
    '    }',
    '    if (req.method !== "POST") {',
    '      // GET and DELETE are session operations, and this server is stateless.',
    '      rpcError(res, 405, -32000, `${req.method} is not supported in stateless mode`);',
    '      return;',
    '    }',
    '',
    '    let body;',
    '    try {',
    '      body = await readBody(req);',
    '    } catch {',
    '      rpcError(res, 400, -32700, "Parse error: request body is not valid JSON");',
    '      return;',
    '    }',
    '',
    '    const server = createServer({ version });',
    '    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });',
    '    res.on("close", () => {',
    '      void transport.close();',
    '      void server.close();',
    '    });',
    '',
    '    try {',
    '      await server.connect(transport);',
    '      await transport.handleRequest(req, res, body);',
    '    } catch (error) {',
    '      if (!res.headersSent) rpcError(res, 500, -32603, String(error));',
    '    }',
    '  });',
    '',
    '  httpServer.listen(port, () => {',
    '    process.stderr.write(`${SERVER_ID} ${version} serving over http on :${port}/mcp\\n`);',
    '  });',
    '',
    '  const shutdown = () => httpServer.close(() => process.exit(0));',
    '  process.on("SIGTERM", shutdown);',
    '  process.on("SIGINT", shutdown);',
    '} else {',
    '  const server = createServer({ version });',
    '  await server.connect(new StdioServerTransport());',
    '  // stderr, never stdout: stdout carries JSON-RPC on this transport.',
    '  process.stderr.write(`${SERVER_ID} ${version} serving over stdio\\n`);',
    '}',
    '',
  ].join('\n');
}

/** The CLI entry point. */
function buildCliEntry(context) {
  return [
    '#!/usr/bin/env node',
    '/**',
    ' * CLI entry point — what a person at a terminal runs.',
    ' *',
    ' * The counterpart to src/index.js. "serve" hands off to the server half;',
    ' * every other command renders for a terminal. This file is the only one',
    ' * allowed to write to stdout.',
    ' */',
    '',
    "import { TOOLS } from './server.js';",
    "import { version } from './version.js';",
    '',
    'const HELP = `' + context.binCli + ' — ' + context.description,
    '',
    'Usage',
    '  ' + context.binCli + ' <command>',
    '',
    'Commands',
    '  serve            Run as an MCP server over stdio',
    '  tools            List the tools this server exposes',
    '',
    'Options',
    '  -h, --help       Show this help',
    '  -v, --version    Show the version`;',
    '',
    'const [command, ...rest] = process.argv.slice(2);',
    '',
    'if (command === "-v" || command === "--version") {',
    '  process.stdout.write(`${version}\\n`);',
    '} else if (!command || command === "-h" || command === "--help" || command === "help") {',
    '  process.stdout.write(`${HELP}\\n`);',
    '  process.exitCode = command ? 0 : 2;',
    '} else if (command === "serve") {',
    '  if (rest.includes("--http")) process.env.MCP_TRANSPORT = "http";',
    '  if (rest.includes("--stdio")) process.env.MCP_TRANSPORT = "stdio";',
    '  const portFlag = rest.indexOf("--port");',
    '  if (portFlag !== -1 && rest[portFlag + 1]) process.env.PORT = rest[portFlag + 1];',
    '  // Imported dynamically so the env above is set before the server reads it,',
    '  // and so the CLI commands never pay for the transport.',
    '  await import("./index.js");',
    '} else if (command === "tools") {',
    '  for (const tool of TOOLS) {',
    '    process.stdout.write(`${tool.name.padEnd(16)} ${tool.description}\\n`);',
    '  }',
    '} else {',
    '  process.stderr.write(`Unknown command "${command}". Try --help.\\n`);',
    '  process.exitCode = 2;',
    '}',
    '',
  ].join('\n');
}

/** Version resolution, kept in one place so both entry points agree. */
function buildVersionModule() {
  return [
    '/** The version, read from package.json so there is one place to bump it. */',
    '',
    "import { readFile } from 'node:fs/promises';",
    "import { dirname, resolve } from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    '',
    "const PACKAGE_JSON = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');",
    '',
    'let resolved = "0.0.0";',
    'try {',
    "  resolved = JSON.parse(await readFile(PACKAGE_JSON, 'utf8')).version ?? resolved;",
    '} catch {',
    '  // A bundled copy should still start rather than crash on a version string.',
    '}',
    '',
    'export const version = resolved;',
    '',
  ].join('\n');
}

/** A test that fails loudly if the two surfaces ever stop agreeing. */
function buildTest(context) {
  return [
    "import assert from 'node:assert/strict';",
    "import { test } from 'node:test';",
    '',
    "import { Client } from '@modelcontextprotocol/sdk/client/index.js';",
    "import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';",
    '',
    "import { SERVER_ID, TOOLS, createServer } from '../src/server.js';",
    '',
    "test('every declared tool is registered and described', async () => {",
    "  const server = createServer({ version: '0.0.0' });",
    "  const client = new Client({ name: 'test-client', version: '0.0.0' });",
    '  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();',
    '  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);',
    '',
    `  assert.equal(client.getServerVersion().name, '${context.serverId}');`,
    '',
    '  const { tools } = await client.listTools();',
    '  assert.deepEqual(',
    '    tools.map((tool) => tool.name).sort(),',
    '    TOOLS.map((tool) => tool.name).sort(),',
    '  );',
    '  for (const tool of tools) {',
    '    assert.ok(tool.description, `${tool.name} needs a description`);',
    '  }',
    '',
    '  await server.close();',
    '  void SERVER_ID;',
    '});',
    '',
  ].join('\n');
}

/** The README, pointing at the setup page rather than restating it. */
function buildReadme(context) {
  return [
    `# ${context.slug}`,
    '',
    context.description,
    '',
    `- **Server id:** \`${context.serverId}\``,
    `- **Package:** \`${context.packageName}\``,
    `- **Dual-purpose:** a CLI (\`${context.binCli}\`) and an MCP server (\`${context.binServer}\`).`,
    '',
    '## Quick start',
    '',
    '```bash',
    'npm install',
    'npm test',
    '',
    `npm run cli -- tools     # CLI mode`,
    'npm start                # server mode, over stdio',
    '```',
    '',
    'Installation and usage for **both modes** are in',
    '[`wiki/environments/setup.md`](wiki/environments/setup.md).',
    '',
    '## License',
    '',
    'MIT',
    '',
  ].join('\n');
}

/** The agent entry point, wired to the shared instruction set. */
function buildAgentsDoc(context) {
  return [
    '---',
    'name: agents-entry-point',
    `description: Entry point for ${context.slug} — a dual-purpose MCP server and CLI.`,
    '---',
    '',
    '# AGENTS.md',
    '',
    `This repository is \`${context.slug}\`: an MCP server and a CLI over one`,
    'implementation. It consumes the LXAgents shared agent instruction set through the',
    '`lxagents-agents-base` connector rather than keeping its own copy of it.',
    '',
    '## Auto-activation',
    '',
    'The shared instruction set is **always active**. It applies to every task here',
    'whether or not the user mentions it. Resolve it through the connector, read',
    '`agents://index/root-index.md`, and route from there.',
    '',
    'Three files load on **every** request rather than on a trigger — the task workflow,',
    'the branching strategy, and the commit conventions — along with the two permission',
    'gates that ride with them: ask before opening a pull request, ask before merging.',
    'See `agents://rules/shared-instructions.md` §H.',
    '',
    '## Local rules',
    '',
    '* **Never copy a shared file into this repository.** If you can read it from',
    '  `agents://`, it must not exist here as a file.',
    '* **Nothing writes to stdout except the CLI.** On stdio, stdout is the JSON-RPC',
    '  channel; logging goes to stderr.',
    '* **Both surfaces stay in step.** A tool added to `src/server.js` is reachable from',
    '  the CLI too, and a test pins that they agree.',
    '',
    '## Documentation',
    '',
    '* [`wiki/environments/setup.md`](wiki/environments/setup.md) — installing and running',
    '  both CLI mode and server mode.',
    '',
  ].join('\n');
}

/** The ignore file. */
function buildGitignore() {
  return ['node_modules/', '*.log', '.env', '.DS_Store', 'coverage/', ''].join('\n');
}

/**
 * Plans a new repository without touching the disk.
 *
 * @param {{ name: string, description?: string|null, directory?: string|null, cwd?: string }} options
 * @returns {{ context: object, target: string, files: {path: string, contents: string}[] }}
 */
export function scaffoldRepo({ name, description = null, directory = null, cwd = process.cwd() }) {
  const context = buildContext(name, { description });
  const target = resolve(cwd, directory ?? context.slug);

  const files = [
    { path: 'package.json', contents: buildPackageJson(context) },
    { path: 'README.md', contents: buildReadme(context) },
    { path: 'AGENTS.md', contents: buildAgentsDoc(context) },
    { path: '.gitignore', contents: buildGitignore() },
    { path: 'src/index.js', contents: buildServerEntry() },
    { path: 'src/cli.js', contents: buildCliEntry(context) },
    { path: 'src/server.js', contents: buildServer(context) },
    { path: 'src/version.js', contents: buildVersionModule() },
    { path: 'test/server.test.js', contents: buildTest(context) },
    // The reason this tool exists: every generated repository is documented for
    // both modes on the day it is created.
    { path: 'wiki/environments/setup.md', contents: buildSetupDoc(context) },
  ];

  return { context, target, files: Object.freeze(files) };
}

/** True when the directory is absent or holds nothing. */
async function isEmptyDir(path) {
  try {
    return (await readdir(path)).length === 0;
  } catch {
    return true; // Missing is as good as empty; mkdir will create it.
  }
}

/**
 * Writes a plan to disk.
 *
 * Refuses a non-empty target unless `force`, because the alternative is
 * overwriting someone's work to save them one `rm`.
 *
 * @param {ReturnType<typeof scaffoldRepo>} plan
 * @param {{ force?: boolean }} [options]
 * @returns {Promise<{ target: string, written: string[] }>}
 */
export async function writeScaffold(plan, { force = false } = {}) {
  if (!force && !(await isEmptyDir(plan.target))) {
    throw new Error(
      `${plan.target} already exists and is not empty. Choose another directory, or pass force to overwrite.`,
    );
  }

  const written = [];
  for (const file of plan.files) {
    const absolute = join(plan.target, file.path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, file.contents, 'utf8');
    written.push(file.path);
  }

  return { target: plan.target, written };
}

/** Renders a plan for a terminal or a tool result. */
export function formatScaffold(plan, { written = false } = {}) {
  const { context, target, files } = plan;

  return [
    `# ${written ? 'Created' : 'Plan for'} ${context.slug}`,
    '',
    `| Field | Value |`,
    '|---|---|',
    `| Package | \`${context.packageName}\` |`,
    `| Server id | \`${context.serverId}\` |`,
    `| CLI bin | \`${context.binCli}\` |`,
    `| Server bin | \`${context.binServer}\` |`,
    `| Target | \`${target}\` |`,
    '',
    `## Files (${files.length})`,
    '',
    ...files.map((file) => `- \`${file.path}\``),
    '',
    written
      ? `Next: \`cd ${target} && npm install && npm test\`. Both modes are documented in wiki/environments/setup.md.`
      : 'Nothing was written. Call again with write enabled to create these files.',
    '',
  ].join('\n');
}
