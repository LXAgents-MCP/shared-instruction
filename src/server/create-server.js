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
    '**Call nothing at session start.** Read the repository\'s own `AGENTS.md` — its **Shared',
    'instruction tools** block declares which tools that repository uses and the trigger for',
    'each. Call one when its trigger fires. Calling them all up front pays for procedures the',
    'request may never need.',
    '',
    'One convention, one tool:',
    '',
    '- `task_workflow` — a request of more than one step',
    '- `branch_strategy` — about to create a branch',
    '- `commit_strategy` — about to write a commit message',
    '- `discovery_protocol` — you noticed a rule that should exist',
    '- `pull_request_strategy` — about to open or update a pull request',
    '- `agents_model_naming_convention` — about to write a `model_name`; `agents_model_name_format` builds one',
    '',
    'The first four are declared by every repository. Their **gates** are written inline in that',
    'repository\'s `AGENTS.md` and stand from the first message — approve the plan before writing,',
    'ask before opening a pull request, ask before merging, propose a discovered rule rather than',
    'applying it. These tools carry the procedures, not the gates.',
    '',
    `- Invoke the \`${PROMPT_AGENTS_SETUP}\` prompt, or call \`setup_shared_agents_instruction\`, to set up or adopt the instruction system in a repository.`,
    '- Call `list_shared_agents_instruction` (or read `agents://manifest.json`) once to learn what exists, then `read_shared_agents_instruction` for anything without a tool of its own.',
    '- `agents://AGENTS.md` is the federation contract a consuming repository relies on.',
    '',
    'The prompts and the tools deliver the same text. Prefer prompts and resources where your',
    'client exposes them; the tools exist for clients that only enumerate tools.',
    '',
    'A repository consuming this set must never keep its own copy of a file served here.',
    'A local copy overrides the shared one by `name` and then silently goes stale.',
    '',
    `Two things run **only when the user asks**: the \`${PROMPT_DUPLICATE_AUDIT}\` prompt and`,
    '`check_duplicate_shared_agents_instruction`, which propose deletions; and',
    '`update_shared_agents_instruction`, which edits `AGENTS.md`. Never invoke either on your own',
    'initiative or as part of session start.',
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
