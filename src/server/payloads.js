/**
 * The text each procedure delivers, built once and shared by the prompt surface
 * and the tool surface.
 *
 * Both surfaces exist because clients gate on different primitives: some expose
 * prompts, some only list tools. Neither may be the "real" one — a repository
 * that got the setup procedure through a tool and one that got it through a
 * prompt must receive identical instructions, so the text is built here and
 * neither surface owns it.
 */

import { MANIFEST_URI } from '../constants.js';
import { manifestJson } from './manifest.js';

/** What the connector is, and how to read it. Prefixes every payload. */
export const CONNECTOR_PREAMBLE = [
  'The shared instruction set referred to below is **this connector**.',
  'Every `agents://…` path in the text is a resource you can read here, and',
  '`agents://manifest.json` lists all of them in one read. There is nothing to clone.',
].join(' ');

/**
 * Reads backing content, failing loudly when it is absent.
 *
 * A procedure that silently returns nothing is worse than one that errors: the
 * agent proceeds with no instructions and looks like it is working.
 */
export function requireEntry(registry, uri) {
  const entry = registry.get(uri);
  if (!entry) {
    throw new Error(`content missing from the registry: ${uri}`);
  }
  return entry;
}

/**
 * The AGENTS-SETUP procedure.
 *
 * @param {Readonly<object>} registry
 * @returns {string}
 */
export function buildSetupPayload(registry, version) {
  const procedure = requireEntry(registry, 'agents://prompts/agents-setup.md');

  return `Follow the procedure below for this repository.

${CONNECTOR_PREAMBLE}

**The version to stamp is \`${version}\`.** §4.1(d) has you write a Shared instruction tools
block carrying \`Adopted shared-set version:\`; that is the value it takes. The procedure below
writes it as \`{version}\` because it is published text and is served byte-for-byte as
\`agents://prompts/agents-setup.md\` — substitute here, not there.

---

${procedure.text}`;
}

/**
 * One standing convention, returned whole.
 *
 * Every convention tool is this function with a different URI. They return the
 * registry entry rather than a summary for the reason the whole set exists: a
 * caller who received a paraphrase of the task workflow is following something
 * nobody wrote, and cannot tell.
 *
 * `lead` is the one line that says what to *do* with the text. It is tool prose,
 * not set text, which is why it arrives as an argument instead of living here —
 * see `.agents/rules/set-mirrors.md` on why `src/` never hard-codes the set.
 *
 * @param {Readonly<object>} registry
 * @param {string} uri
 * @param {string} lead
 * @returns {string}
 */
export function buildConventionPayload(registry, uri, lead) {
  const entry = requireEntry(registry, uri);

  return `${lead}

${CONNECTOR_PREAMBLE}

---

${entry.text}`;
}

/**
 * The duplicate-instruction audit, with the manifest inlined.
 *
 * The manifest is inlined rather than linked because the audit's first step is
 * to read it. An agent that already has it cannot skip the step, mis-read a
 * hash, or start proposing deletions from a half-loaded picture.
 *
 * @param {Readonly<object>} registry
 * @param {string} version
 * @returns {string}
 */
export function buildAuditPayload(registry, version) {
  const procedure = requireEntry(registry, 'agents://rules/duplicate-instruction-audit.md');

  return `Audit this repository for instructions duplicated from the shared set, following the procedure below.

${CONNECTOR_PREAMBLE}

The manifest the procedure tells you to read is included at the end of this message, so step 1 is already done — do not re-read \`${MANIFEST_URI}\`. Read only the shared files you actually need to diff.

**Deletion requires per-file approval.** Report every finding with its verdict and wait. Never delete a file whose verdict you could not determine.

---

${procedure.text}

---

## Shared set manifest

\`\`\`json
${manifestJson(registry, version)}\`\`\`
`;
}
