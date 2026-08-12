/**
 * The prompt surface.
 *
 * Prompts are the right primitive for an instruction set: a tool is something
 * the model *may decide* to call, while a prompt is something a user invokes
 * and the model then obeys. These are standing orders, so prompts come first.
 *
 * They are not sufficient on their own, though — some clients enumerate
 * connectors by their tools and never surface prompts at all. `tools.js` is the
 * compatibility layer for those; both surfaces deliver identical text from
 * `payloads.js`.
 *
 * The prompts take no arguments, deliberately. `prompts/get` may omit
 * `arguments` under the MCP spec, but the SDK validates whatever arrives
 * against the declared shape, and an object schema rejects `undefined` even
 * when every field is optional. Declaring arguments would therefore make the
 * server's primary entry point fail for spec-compliant clients that leave them
 * out — and a prompt is typically invoked by a person clicking a button, with
 * no arguments to send.
 */

import { PROMPT_AGENTS_SETUP, PROMPT_DUPLICATE_AUDIT } from '../constants.js';
import { buildAuditPayload, buildSetupPayload } from './payloads.js';

/** Wraps prompt text in the single user message clients expect. */
export function userMessage(text) {
  return { role: 'user', content: { type: 'text', text } };
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 * @param {string} version
 */
export function registerPrompts(server, registry, version) {
  server.registerPrompt(
    PROMPT_AGENTS_SETUP,
    {
      title: 'Set up the agent instruction system',
      description:
        "Run the full AGENTS-SETUP procedure: build this repository's AGENTS.md, .agents/ tree, wiki, and memory against the shared instruction set served here.",
    },
    async () => ({
      description:
        'The AGENTS-SETUP procedure, with the shared set resolved through this connector.',
      messages: [userMessage(buildSetupPayload(registry))],
    }),
  );

  server.registerPrompt(
    PROMPT_DUPLICATE_AUDIT,
    {
      title: 'Check for duplicated agent instructions',
      description:
        'Audit this repository against the shared instruction set: find instruction files it duplicates, report each with a verdict, and delete only what the user approves.',
    },
    async () => ({
      description: 'The duplicate-instruction audit, with the shared set manifest supplied inline.',
      messages: [userMessage(buildAuditPayload(registry, version))],
    }),
  );
}
