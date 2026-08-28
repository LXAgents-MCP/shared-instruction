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

import { AUTO_ACTIVATION_URI, MANDATORY_STANDARD_FILES, MANIFEST_URI } from '../constants.js';
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
export function buildSetupPayload(registry) {
  const procedure = requireEntry(registry, 'agents://prompts/agents-setup.md');

  return `Follow the procedure below for this repository.

${CONNECTOR_PREAMBLE}

---

${procedure.text}`;
}

/**
 * The shared half of the session-start sequence, in one payload.
 *
 * Composed from registry entries rather than written out here, for the reason
 * `.agents/rules/set-mirrors.md` gives: a hard-coded copy of set text is a
 * mirror, and mirrors drift. Adding a file to `MANDATORY_STANDARD_FILES` is
 * therefore the whole change — nothing here names the four individually.
 *
 * The payload leads with what it does *not* contain. Three steps of the
 * sequence read local files that no connector can see, and a caller who
 * believes one tool finished the job is activated wrong in a way nothing
 * signals afterwards.
 *
 * @param {Readonly<object>} registry
 * @returns {string}
 */
export function buildActivationPayload(registry) {
  const rule = requireEntry(registry, AUTO_ACTIVATION_URI);
  const mandatory = MANDATORY_STANDARD_FILES.map((uri) => requireEntry(registry, uri));

  const routing = registry.entries
    .filter((entry) => entry.uri !== rule.uri && !MANDATORY_STANDARD_FILES.includes(entry.uri))
    .map((entry) => `| \`${entry.path}\` | \`${entry.name}\` | ${entry.description} |`);

  return `# Session activation

The shared instruction set is now active for this session. It is a set of standing orders:
it applies to every task from here on, whether or not the user mentions it.

${CONNECTOR_PREAMBLE}

## This call does not finish the job

Three steps of the sequence below read files on **your** filesystem, which no connector can
see. Read them yourself, now:

1. \`{repo}/AGENTS.md\` — the repository's entry point (step 1).
2. \`{repo}/.agents/index/root-index.md\` — its router (step 3).
3. \`{repo}/.agents/index/memory-index.md\` — and load only the rows matching the request,
   so you continue prior work instead of restarting it (step 4).

Everything shared — steps 2, 5 and 6 — is below, in full. Nothing else needs reading before
you start.

---

${rule.text}

---

# The four mandatory standard files

These load on every request, not on a trigger, and they are reproduced here whole so that
activation is one call. ${mandatory.length} files, in the order the rule names them.

${mandatory.map((entry) => `---\n\n${entry.text}`).join('\n\n')}

---

# Routing table for everything else

Every remaining shared file. Route on the description; read one at a time with
\`agents_read_instruction\` when a trigger fires. Do not bulk-read the set.

| Path | name | Purpose |
|---|---|---|
${routing.join('\n')}

---

You are activated. Read the three local files named above, then begin.`;
}

/**
 * The model naming convention.
 *
 * Returned whole rather than summarised. The rule ends in a four-point
 * checklist a caller is expected to apply, and a summary is precisely the form
 * in which a checklist stops being checkable.
 *
 * @param {Readonly<object>} registry
 * @returns {string}
 */
export function buildModelNamingPayload(registry) {
  const rule = requireEntry(registry, 'agents://rules/model-naming-convention.md');

  return `Apply the convention below to every model identifier this repository stores, on every platform it integrates.

${CONNECTOR_PREAMBLE}

---

${rule.text}`;
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
