import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { CONVENTION_TOOLS, MANDATORY_TOOLS } from '../src/constants.js';
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
    'agents_model_name_format',
    'agents_model_naming_convention',
    'branch_strategy',
    'check_duplicate_shared_agents_instruction',
    'commit_strategy',
    'discovery_protocol',
    'list_shared_agents_instruction',
    'mcp_creator',
    'pull_request_strategy',
    'read_shared_agents_instruction',
    'setup_shared_agents_instruction',
    'task_workflow',
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
    'setup_shared_agents_instruction',
    'check_duplicate_shared_agents_instruction',
    ...CONVENTION_TOOLS.map((tool) => tool.name),
  ]) {
    const tool = tools.find((candidate) => candidate.name === name);
    assert.deepEqual(tool.inputSchema.required ?? [], [], `${name} must be callable with no args`);
  }

  await server.close();
});

test('setup_shared_agents_instruction returns the same text as the agents-setup prompt', async () => {
  const { client, server } = await connect();

  // The two surfaces exist for different clients; a repository set up through
  // one must get identical instructions to one set up through the other.
  const viaTool = await client.callTool({ name: 'setup_shared_agents_instruction', arguments: {} });
  const viaPrompt = await client.getPrompt({ name: 'agents-setup' });

  assert.notEqual(viaTool.isError, true);
  assert.equal(viaTool.content[0].text, viaPrompt.messages[0].content.text);
  assert.match(viaTool.content[0].text, /# AGENTS-SETUP/);

  await server.close();
});

test('setup_shared_agents_instruction is callable with arguments omitted entirely', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({ name: 'setup_shared_agents_instruction' });
  assert.notEqual(result.isError, true);
  assert.ok(result.content[0].text.length > 10_000);

  await server.close();
});

test('check_duplicate_shared_agents_instruction matches its prompt and inlines the manifest', async () => {
  const { client, server, registry } = await connect();

  const viaTool = await client.callTool({
    name: 'check_duplicate_shared_agents_instruction',
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

test('list_shared_agents_instruction returns every file with structured output', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({ name: 'list_shared_agents_instruction', arguments: {} });

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

test('list_shared_agents_instruction filters by folder', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({
    name: 'list_shared_agents_instruction',
    arguments: { folder: 'git' },
  });

  const expected = registry.entries.filter((entry) => entry.folder === 'git').length;
  assert.equal(result.structuredContent.count, expected);
  assert.ok(result.structuredContent.files.every((file) => file.folder === 'git'));

  await server.close();
});

test('list_shared_agents_instruction names the real folders when given an unknown one', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'list_shared_agents_instruction',
    arguments: { folder: 'nope' },
  });

  assert.equal(result.isError, true);
  // An error that lists the alternatives saves a second round trip.
  assert.match(result.content[0].text, /Available folders: .*rules/);

  await server.close();
});

test('read_shared_agents_instruction accepts a name, a path, or a URI', async () => {
  const { client, server, registry } = await connect();

  const expected = registry.get('agents://rules/directories.md').text;

  for (const instruction of [
    'directory-architecture',
    'rules/directories.md',
    'agents://rules/directories.md',
  ]) {
    const result = await client.callTool({ name: 'read_shared_agents_instruction', arguments: { instruction } });
    assert.notEqual(result.isError, true, `${instruction} should resolve`);
    assert.equal(result.content[0].text, expected, `${instruction} returned the wrong file`);
  }

  await server.close();
});

test('read_shared_agents_instruction suggests near matches instead of just refusing', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'read_shared_agents_instruction',
    arguments: { instruction: 'directories' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Did you mean: .*directory-architecture/);

  await server.close();
});

test('read_shared_agents_instruction points at the listing when nothing is close', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'read_shared_agents_instruction',
    arguments: { instruction: 'zzzzz' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /list_shared_agents_instruction/);

  await server.close();
});

test('every convention tool returns its content file whole', async () => {
  const { client, server, registry } = await connect();

  // Whole files, not summaries. A caller that got a paraphrase of the task
  // workflow is following something nobody wrote and cannot tell.
  for (const { name, uri } of CONVENTION_TOOLS) {
    const result = await client.callTool({ name, arguments: {} });
    assert.notEqual(result.isError, true, `${name} should succeed`);
    const entry = registry.get(uri);
    assert.ok(entry, `${uri} must resolve`);
    assert.ok(result.content[0].text.endsWith(entry.text), `${name} must return ${uri} whole`);
  }

  await server.close();
});

test('every convention tool is callable with arguments omitted entirely', async () => {
  const { client, server } = await connect();

  for (const { name } of CONVENTION_TOOLS) {
    const result = await client.callTool({ name });
    assert.notEqual(result.isError, true, `${name} must be callable with no args`);
  }

  await server.close();
});

test('no convention tool returns anything near the old activation payload', async () => {
  const { client, server } = await connect();

  // The point of 1.0.0. agents_auto_activation returned ~31,000 characters on
  // every session start; the largest convention here is the task workflow at
  // well under half that, and it is charged only when a request needs it.
  for (const { name } of CONVENTION_TOOLS) {
    const body = (await client.callTool({ name })).content[0].text;
    assert.ok(body.length < 15_000, `${name} returned ${body.length} characters`);
  }

  await server.close();
});

test('the four mandatory tools are all published', async () => {
  const { client, server } = await connect();

  // Written out literally rather than derived from the constant it guards, for
  // the reason the deleted MANDATORY_STANDARD_FILES pin existed: every other
  // test iterates the constant, so a name dropped from it takes its own
  // coverage with it and nothing fails.
  assert.deepEqual(
    [...MANDATORY_TOOLS],
    ['task_workflow', 'branch_strategy', 'commit_strategy', 'discovery_protocol'],
  );

  const { tools } = await client.listTools();
  const names = new Set(tools.map((tool) => tool.name));
  for (const name of MANDATORY_TOOLS) {
    assert.ok(names.has(name), `${name} is mandatory in every repository and must be published`);
  }

  await server.close();
});

test('discovery_protocol still carries the gate that has no trigger of its own', async () => {
  const { client, server } = await connect();

  const body = (await client.callTool({ name: 'discovery_protocol' })).content[0].text;

  // The gate itself is written inline in a repository's AGENTS.md, but this
  // tool is where the canonical block lives. A payload that dropped it would
  // leave nothing to copy that block from.
  assert.match(body, /do NOT create or edit it yourself/);
  assert.match(body, /Never batch-apply, never apply silently/);

  await server.close();
});

test('task_workflow carries the plan gate and the whole procedure', async () => {
  const { client, server } = await connect();

  const body = (await client.callTool({ name: 'task_workflow' })).content[0].text;

  // §A and §F are the first and last things a truncated inline would lose.
  assert.match(body, /## A\. Intake — Goal, Objective, Detail/);
  assert.match(body, /## F\. Pull requests and merging/);
  assert.match(body, /Presenting the plan is not the gate/);
  assert.match(body, /What does not count:/);

  await server.close();
});

test('no tool advertises calling anything at session start', async () => {
  const { client, server } = await connect();

  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert.doesNotMatch(
      tool.description,
      /at the start of every session|call this first/i,
      `${tool.name} must not tell a session to call it up front`,
    );
  }

  await server.close();
});

test('agents_model_naming_convention returns the published rule verbatim', async () => {
  const { client, server, registry } = await connect();

  const result = await client.callTool({ name: 'agents_model_naming_convention', arguments: {} });

  assert.notEqual(result.isError, true);
  // Served from the registry, not restated in the tool — the whole point of
  // keeping the text in content/ is that these two cannot drift.
  const rule = registry.get('agents://rules/model-naming-convention.md');
  assert.ok(result.content[0].text.endsWith(rule.text));
  assert.match(result.content[0].text, /\{platform\}\/\{model\}/);

  await server.close();
});

test('agents_model_naming_convention is callable with arguments omitted entirely', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({ name: 'agents_model_naming_convention' });

  assert.notEqual(result.isError, true);
  await server.close();
});

test('agents_model_name_format lowercases both segments and joins them with one slash', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_model_name_format',
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

test('agents_model_name_format reports input that was already normalized', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_model_name_format',
    arguments: { platform: 'openai', platform_model: 'text-embedding-3-small' },
  });

  assert.equal(result.structuredContent.normalized, false);
  assert.equal(result.structuredContent.model_name, 'openai/text-embedding-3-small');

  await server.close();
});

test('agents_model_name_format output satisfies the rule it implements', async () => {
  const { client, server } = await connect();

  // The rule's checklist, applied to the tool's own output. If the two ever
  // disagree, one of them is wrong and this is where it shows.
  for (const args of [
    { platform: 'OPENAI', platform_model: '  Text-Embedding-3-Small  ' },
    { platform: 'Anthropic', platform_model: 'Claude-Sonnet' },
    { platform: 'voyage', platform_model: 'voyage-3' },
  ]) {
    const result = await client.callTool({ name: 'agents_model_name_format', arguments: args });
    const value = result.structuredContent.model_name;

    assert.equal(value.split('/').length, 2, `${value}: exactly one separator`);
    assert.ok(value.split('/').every((part) => part.length > 0), `${value}: no empty segment`);
    assert.equal(value, value.toLowerCase(), `${value}: lowercase throughout`);
  }

  await server.close();
});

test('agents_model_name_format refuses a blank segment', async () => {
  const { client, server } = await connect();

  const result = await client.callTool({
    name: 'agents_model_name_format',
    arguments: { platform: 'openai', platform_model: '   ' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /platform_model is required/);

  await server.close();
});

test('agents_model_name_format refuses a model id that already carries its platform', async () => {
  const { client, server } = await connect();

  // Silently composing this would store openai/openai/text-embedding-3-small,
  // which is exactly the uncomparable name the convention exists to prevent.
  const result = await client.callTool({
    name: 'agents_model_name_format',
    arguments: { platform: 'OpenAI', platform_model: 'openai/text-embedding-3-small' },
  });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /already carries the "openai\/" prefix/);
  assert.match(result.content[0].text, /text-embedding-3-small/);

  await server.close();
});

test('initialize instructions route by trigger and name nothing to call up front', async () => {
  const { client, server } = await connect();

  const instructions = client.getInstructions();

  // The behaviour 1.0.0 exists to change: a client that reads this must not
  // come away thinking there is an opening call to make.
  assert.match(instructions, /Call nothing at session start/);
  assert.match(instructions, /Shared\n?instruction tools/);
  assert.doesNotMatch(instructions, /agents_auto_activation/);

  for (const name of MANDATORY_TOOLS) {
    assert.ok(instructions.includes(name), `${name} must be named in the instructions`);
  }

  assert.match(instructions, /setup_shared_agents_instruction/);
  assert.match(instructions, /list_shared_agents_instruction/);
  assert.match(instructions, /read_shared_agents_instruction/);
  assert.match(instructions, /only when the user asks/);
  assert.match(instructions, /same text/);

  await server.close();
});
