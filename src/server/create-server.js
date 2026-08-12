/**
 * Builds one `McpServer` instance.
 *
 * A fresh instance is created per client session (or per request, in stateless
 * mode) rather than shared across connections. `McpServer` holds per-connection
 * state — request ids, progress tokens, the transport itself — so reusing one
 * across simultaneous clients is how you get responses delivered to the wrong
 * connection. Building one is cheap: the expensive part, the content, is the
 * frozen registry that every instance points at.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { PROMPT_AGENTS_SETUP, SERVER_ID, SERVER_TITLE } from '../constants.js';
import { registerAgentsSetupPrompt } from './prompts.js';
import { registerInstructionResources } from './resources.js';

/**
 * Text handed to the client at `initialize`. Clients surface it to the model
 * before any resource is read, so it is the one chance to explain how to route
 * this set rather than swallow it whole.
 */
function buildInstructions(registry) {
  return [
    `This connector serves the LXAgents shared agent instruction set (${registry.size} files).`,
    '',
    'It is a set of standing orders, not reference material. Route into it; do not read it all.',
    '',
    `- Invoke the \`${PROMPT_AGENTS_SETUP}\` prompt to set up or adopt the instruction system in a repository.`,
    '- Read `agents://manifest.json` once to learn what exists — it is one read instead of many.',
    '- Read `agents://index/root-index.md` to route, then open only the files the routing table names.',
    '- `agents://AGENTS.md` is the federation contract a consuming repository relies on.',
    '',
    'A repository consuming this set must never keep its own copy of a file served here.',
    'A local copy overrides the shared one by `name` and then silently goes stale.',
  ].join('\n');
}

/**
 * @param {{ registry: Readonly<object>, version: string }} options
 * @returns {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer}
 */
export function createServer({ registry, version }) {
  const server = new McpServer(
    {
      name: SERVER_ID,
      title: SERVER_TITLE,
      version,
    },
    {
      instructions: buildInstructions(registry),
    },
  );

  registerInstructionResources(server, registry);
  registerAgentsSetupPrompt(server, registry);

  return server;
}
