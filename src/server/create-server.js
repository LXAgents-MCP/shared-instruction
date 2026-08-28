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

import {
  PROMPT_AGENTS_SETUP,
  PROMPT_DUPLICATE_AUDIT,
  SERVER_ID,
  SERVER_TITLE,
} from '../constants.js';
import { registerManifestResource } from './manifest.js';
import { registerPrompts } from './prompts.js';
import { registerInstructionResources } from './resources.js';
import { registerTools } from './tools.js';

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
    '- **Call `agents_auto_activation` first, at the start of every session.** One call returns the activation rule, the four files that load on every request, and the routing table for the rest.',
    `- Invoke the \`${PROMPT_AGENTS_SETUP}\` prompt, or call the \`agents_setup\` tool, to set up or adopt the instruction system in a repository.`,
    '- Call `agents_list_instructions` (or read `agents://manifest.json`) once to learn what exists — one call instead of many.',
    '- Then read one file at a time with `agents_read_instruction`, or the matching `agents://` resource.',
    '- `agents://AGENTS.md` is the federation contract a consuming repository relies on.',
    '- `model_naming_convention` returns the `{platform}/{model}` rule for stored model identifiers, and `model_name_format` builds one — use them when adding support for another platform.',
    '',
    'The prompts and the tools deliver the same text. Prefer prompts and resources where your',
    'client exposes them; the tools exist for clients that only enumerate tools.',
    '',
    'A repository consuming this set must never keep its own copy of a file served here.',
    'A local copy overrides the shared one by `name` and then silently goes stale.',
    '',
    `The \`${PROMPT_DUPLICATE_AUDIT}\` prompt and the \`agents_check_duplicate_instructions\` tool find`,
    'those copies. They run **only when the user asks** — they propose deletions, so never invoke',
    'them on your own initiative or as part of session start.',
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
  registerManifestResource(server, registry, version);
  registerPrompts(server, registry, version);
  registerTools(server, registry, version);

  return server;
}
