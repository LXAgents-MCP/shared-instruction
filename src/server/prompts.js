/**
 * The prompt surface.
 *
 * Prompts, not tools, are how this server delivers its payload. A tool would
 * make the instruction set something the model decides to call; a prompt makes
 * it something the user invokes and the model then obeys. The distinction
 * matters for an instruction set — these are standing orders, not a lookup.
 *
 * The prompts take no arguments, deliberately. `prompts/get` may omit
 * `arguments` under the MCP spec, but the SDK validates whatever arrives
 * against the declared shape, and an object schema rejects `undefined` even
 * when every field is optional. Declaring arguments would therefore make the
 * server's primary entry point fail for spec-compliant clients that leave them
 * out. Nothing here needs an argument anyway: each procedure begins by
 * determining its own context from the repository.
 */

import { PROMPT_AGENTS_SETUP } from '../constants.js';

/** Wraps prompt text in the single user message clients expect. */
export function userMessage(text) {
  return { role: 'user', content: { type: 'text', text } };
}

/**
 * Reads backing content, failing loudly when it is absent.
 *
 * A prompt that silently returns nothing is worse than one that errors: the
 * agent proceeds with no instructions and looks like it is working.
 */
function requireEntry(registry, uri) {
  const entry = registry.get(uri);
  if (!entry) {
    throw new Error(`prompt content missing from the registry: ${uri}`);
  }
  return entry;
}

/** Preamble shared by every prompt: what the connector is, and how to read it. */
export const CONNECTOR_PREAMBLE = [
  'The shared instruction set referred to below is **this connector**.',
  'Every `agents://…` path in the text is a resource you can read here, and',
  '`agents://manifest.json` lists all of them in one read. There is nothing to clone.',
].join(' ');

/**
 * Registers the `agents-setup` prompt.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 */
export function registerAgentsSetupPrompt(server, registry) {
  server.registerPrompt(
    PROMPT_AGENTS_SETUP,
    {
      title: 'Set up the agent instruction system',
      description:
        "Run the full AGENTS-SETUP procedure: build this repository's AGENTS.md, .agents/ tree, wiki, and memory against the shared instruction set served here.",
    },
    async () => {
      const procedure = requireEntry(registry, 'agents://prompts/agents-setup.md');

      return {
        description:
          'The AGENTS-SETUP procedure, with the shared set resolved through this connector.',
        messages: [
          userMessage(
            `Follow the procedure below for this repository.\n\n${CONNECTOR_PREAMBLE}\n\n---\n\n${procedure.text}`,
          ),
        ],
      };
    },
  );
}
