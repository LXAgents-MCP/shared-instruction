import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { AUTO_ACTIVATION_URI, MANDATORY_STANDARD_FILES } from '../src/constants.js';
import { loadRegistry } from '../src/content/registry.js';
import { createServer } from '../src/server/create-server.js';
import { requireEntry } from '../src/server/payloads.js';

async function connect() {
  const registry = await loadRegistry();
  const server = createServer({ registry, version: '0.1.0' });
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, registry };
}

test('tools/list: publishes every tool, each described and non-destructive', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();

  assert.deepEqual(names, [
    'agents_auto_activation',
    'agents_check_duplicate_instructions',
    'agents_list_instructions',
    'agents_read_instruction',
    'agents_setup',
    'mcp_creator',
    'model_name_format',
    'model_naming_convention',
  ]);

  for (const tool of tools) {
    assert.ok(tool.description, `${tool.name} needs a description`);
    // Nothing here may destroy anything, whether or not it is read-only.
    assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} must be non-destructive`);
  }

  await server.close();
});

test('every content tool is read-only', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  // Every tool but the one writer, rather than the `agents_` prefix alone —
  // a new tool must opt into writing deliberately, not by being named freely.
  for (const tool of tools.filter((candidate) => candidate.name !== 'mcp_creator')) {
    assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} must be read-only`);
  }

  // mcp_creator is the sole exception, and declares it: it writes files.
  const writers = tools.filter((tool) => tool.annotations?.readOnlyHint === false);
  assert.deepEqual(writers.map((tool) => tool.name), ['mcp_creator']);

  await server.close();
});

test('the zero-argument tools declare no required arguments', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  for (const name of [
    'agents_setup',
    'agents_check_duplicate_instructions',
    'model_naming_convention',
    'agents_auto_activation',
  ]) {
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

test('agents_auto_activation inlines the rule and every mandatory standard file', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({ name: 'agents_auto_activation', arguments: {} });
  const body = result.content[0].text;

  assert.notEqual(result.isError, true);

  // Whole files, not summaries: a caller that got a paraphrase of the task
  // workflow is activated wrong and cannot tell.
  for (const uri of [AUTO_ACTIVATION_URI, ...MANDATORY_STANDARD_FILES]) {
    const entry = registry.get(uri);
    assert.ok(body.includes(entry.text), `${uri} must be inlined whole`);
  }

  await server.close();
});

test('agents_auto_activation names the local files it cannot return', async () => {
  const { client, server } = await connect();

  const body = (await client.callTool({ name: 'agents_auto_activation' })).content[0].text;

  // The failure this guards: one call, a caller who believes it finished, and
  // three steps of the sequence silently skipped.
  assert.match(body, /This call does not finish the job/);
  for (const local of [
    '{repo}/AGENTS.md',
    '{repo}/.agents/index/root-index.md',
    '{repo}/.agents/index/memory-index.md',
  ]) {
    assert.ok(body.includes(local), `${local} must be named as a local read`);
  }

  await server.close();
});

test('agents_auto_activation routes to every file it did not inline', async () => {
  const { client, server, registry } = await connect();

  const body = (await client.callTool({ name: 'agents_auto_activation' })).content[0].text;
  const inlined = new Set([AUTO_ACTIVATION_URI, ...MANDATORY_STANDARD_FILES]);

  // Inlined or routed to — no shared file may be unreachable after one call.
  for (const entry of registry.entries) {
    if (inlined.has(entry.uri)) continue;
    assert.ok(body.includes(`\`${entry.path}\``), `${entry.path} must appear in the routing table`);
  }

  await server.close();
});

test('agents_auto_activation carries the discovery gate, which has no trigger row', async () => {
  const { client, server } = await connect();

  const body = (await client.callTool({ name: 'agents_auto_activation' })).content[0].text;

  // discovery-protocol.md is deliberately absent from the trigger table, so a
  // payload that dropped it would leave the gate unreachable at session start.
  assert.match(body, /do NOT create or edit it yourself/);
  assert.match(body, /Never batch-apply, never apply silently/);

  await server.close();
});

test('MANDATORY_STANDARD_FILES pins the four files, in order, and every one resolves', async () => {
  const registry = await loadRegistry();

  // Written out literally rather than derived from the constant it guards.
  // Every other activation test iterates MANDATORY_STANDARD_FILES, so a URI
  // dropped from it takes its own coverage with it: the payload gets shorter,
  // the dropped file quietly reappears in the routing table as though it had
  // never been mandatory, and all 80 tests still pass. This assertion is the
  // only thing that fails in that case.
  assert.deepEqual(
    [...MANDATORY_STANDARD_FILES],
    [
      'agents://planning/task-workflow.md',
      'agents://git/branching-strategy.md',
      'agents://git/commit-conventions.md',
      'agents://rules/discovery-protocol.md',
    ],
  );

  // The lookup registerTools performs at boot. Pinned here too, so a file
  // renamed under content/ fails as a test rather than as a startup crash on
  // a deployment nobody is watching.
  for (const uri of MANDATORY_STANDARD_FILES) {
    const entry = requireEntry(registry, uri);
    assert.equal(entry.uri, uri);
    assert.ok(entry.text.length > 0, `${uri} must have content to inline`);
  }
});

test('agents_auto_activation inlines planning/task-workflow.md inside the mandatory section', async () => {
  const { client, server, registry } = await connect();

  const body = (await client.callTool({ name: 'agents_auto_activation' })).content[0].text;
  const workflow = registry.get('agents://planning/task-workflow.md');

  const heading = body.indexOf('# The four mandatory standard files');
  const routing = body.indexOf('# Routing table for everything else');
  const inlined = body.indexOf(workflow.text);

  assert.ok(heading !== -1, 'the mandatory section must exist');
  assert.ok(routing > heading, 'the routing table must follow the mandatory section');

  // Named on its own rather than left to the loop above because this is the
  // file the workflow itself depends on: a session that never reads it plans
  // nothing, asks for no intake, and stacks no branches — and the omission
  // looks like a shorter payload, not like an error.
  assert.ok(inlined > heading && inlined < routing, 'task-workflow.md must sit in the section');

  // §A and §F are the first and last things a truncated inline would lose.
  assert.match(body, /## A\. Intake — Goal, Objective, Detail/);
  assert.match(body, /## F\. Pull requests and merging/);

  // The heading says "four" in prose while the count beneath it is computed.
  // Tying them together is what stops the word becoming a lie.
  assert.ok(body.includes(`${MANDATORY_STANDARD_FILES.length} files, in the order`));

  await server.close();
});

test('agents_auto_activation never routes to a file it already inlined', async () => {
  const { client, server, registry } = await connect();

  const body = (await client.callTool({ name: 'agents_auto_activation' })).content[0].text;
  const table = body.slice(body.indexOf('# Routing table for everything else'));

  // The converse of the routing test above, and the half that catches a
  // filter that stopped filtering: a mandatory file listed as somewhere to go
  // "when a trigger fires" reads as optional, which is the one thing it is not.
  for (const uri of [AUTO_ACTIVATION_URI, ...MANDATORY_STANDARD_FILES]) {
    const entry = registry.get(uri);
    assert.ok(entry, `${uri} must resolve`);
    assert.ok(!table.includes(`\`${entry.path}\``), `${entry.path} is inlined; do not route to it`);
  }

  await server.close();
});

test('model_naming_convention returns the published rule verbatim', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({ name: 'model_naming_convention', arguments: {} });

  assert.notEqual(result.isError, true);
  // Served from the registry, not restated in the tool — the whole point of
  // keeping the text in content/ is that these two cannot drift.
  const rule = registry.get('agents://rules/model-naming-convention.md');
  assert.ok(result.content[0].text.endsWith(rule.text));
  assert.match(result.content[0].text, /\{platform\}\/\{model\}/);

  await server.close();
});

test('model_naming_convention is callable with arguments omitted entirely', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({ name: 'model_naming_convention' });

  assert.notEqual(result.isError, true);
  await server.close();
});

test('model_name_format lowercases both segments and joins them with one slash', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'model_name_format',
    arguments: { platform: 'OpenAI', platform_model: 'Text-Embedding-3-Small' },
  });

  assert.notEqual(result.isError, true);
  assert.deepEqual(result.structuredContent, {
    model_name: 'openai/text-embedding-3-small',
    platform: 'openai',
    model: 'text-embedding-3-small',
    normalized: true,
  });
  assert.match(result.content[0].text, /^openai\/text-embedding-3-small\n/);

  await server.close();
});

test('model_name_format reports input that was already normalized', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'model_name_format',
    arguments: { platform: 'openai', platform_model: 'text-embedding-3-small' },
  });

  assert.equal(result.structuredContent.normalized, false);
  assert.equal(result.structuredContent.model_name, 'openai/text-embedding-3-small');

  await server.close();
});

test('model_name_format output satisfies the rule it implements', async () => {
  const { client, server } = await connect();

  // The rule's checklist, applied to the tool's own output. If the two ever
  // disagree, one of them is wrong and this is where it shows.
  for (const args of [
    { platform: 'OPENAI', platform_model: '  Text-Embedding-3-Small  ' },
    { platform: 'Anthropic', platform_model: 'Claude-Sonnet' },
    { platform: 'voyage', platform_model: 'voyage-3' },
  ]) {
    const result = await client.callTool({ name: 'model_name_format', arguments: args });
    const value = result.structuredContent.model_name;

    assert.equal(value.split('/').length, 2, `${value}: exactly one separator`);
    assert.ok(value.split('/').every((part) => part.length > 0), `${value}: no empty segment`);
    assert.equal(value, value.toLowerCase(), `${value}: lowercase throughout`);
  }

  await server.close();
});

test('model_name_format refuses a blank segment', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'model_name_format',
    arguments: { platform: 'openai', platform_model: '   ' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /platform_model is required/);

  await server.close();
});

test('model_name_format refuses a model id that already carries its platform', async () => {
  const { client, server } = await connect();

  // Silently composing this would store openai/openai/text-embedding-3-small,
  // which is exactly the uncomparable name the convention exists to prevent.
  const result = await client.callTool({
    name: 'model_name_format',
    arguments: { platform: 'OpenAI', platform_model: 'openai/text-embedding-3-small' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /already carries the "openai\/" prefix/);
  assert.match(result.content[0].text, /text-embedding-3-small/);

  await server.close();
});

test('initialize instructions cover both surfaces and the on-request audit', async () => {
  const { client, server } = await connect();

  const instructions = client.getInstructions();
  assert.match(instructions, /agents_setup/);
  assert.match(instructions, /agents_list_instructions/);
  assert.match(instructions, /agents_auto_activation/);
  assert.match(instructions, /model_naming_convention/);
  assert.match(instructions, /only when the user asks/);
  assert.match(instructions, /same text/);

  await server.close();
});
