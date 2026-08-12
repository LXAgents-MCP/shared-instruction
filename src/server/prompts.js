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

import { MANIFEST_URI, PROMPT_AGENTS_SETUP, PROMPT_DUPLICATE_AUDIT } from '../constants.js';
import { buildManifest } from './manifest.js';

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

/**
 * Registers the `check-duplicate-agents-instruction` prompt.
 *
 * This is the on-request half of the instruction set. The corresponding rule
 * fires for nothing else — it proposes deletions, so it runs when a user asks
 * and at no other time. Making it a prompt rather than an always-on rule is
 * what enforces that: it cannot run unless someone invokes it.
 *
 * The manifest is inlined rather than linked. The audit's first step is to read
 * it, and an agent that has it already cannot skip the step, mis-read a hash,
 * or start proposing deletions from a half-loaded picture.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 * @param {string} version
 */
export function registerDuplicateAuditPrompt(server, registry, version) {
  const manifest = `${JSON.stringify(buildManifest(registry, version), null, 2)}\n`;

  server.registerPrompt(
    PROMPT_DUPLICATE_AUDIT,
    {
      title: 'Check for duplicated agent instructions',
      description:
        'Audit this repository against the shared instruction set: find instruction files it duplicates, report each with a verdict, and delete only what the user approves.',
    },
    async () => {
      const procedure = requireEntry(registry, 'agents://rules/duplicate-instruction-audit.md');

      return {
        description:
          'The duplicate-instruction audit, with the shared set manifest supplied inline.',
        messages: [
          userMessage(
            `Audit this repository for instructions duplicated from the shared set, following the procedure below.

${CONNECTOR_PREAMBLE}

The manifest the procedure tells you to read is included at the end of this message, so step 1 is already done — do not re-read \`${MANIFEST_URI}\`. Read only the shared files you actually need to diff.

**Deletion requires per-file approval.** Report every finding with its verdict and wait. Never delete a file whose verdict you could not determine.

---

${procedure.text}

---

## Shared set manifest

\`\`\`json
${manifest}\`\`\`
`,
          ),
        ],
      };
    },
  );
}
