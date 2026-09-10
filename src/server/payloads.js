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
import { releasesSince, readReleases } from './logs.js';
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
 * What a repository must do to move from the set version it adopted to this one.
 *
 * Two modes, and the argument chooses between them deliberately rather than by
 * defaulting. With a version, this is a **delta**: the Consumers must lines the
 * repository has not applied, oldest first, because they compose. Without one it
 * is a **re-sync**: the current state to reconcile against, with no history,
 * which is the honest answer for a repository that never recorded a stamp.
 *
 * Treating a missing version as "since the beginning" would be the worst of
 * both — every line ever written, most of them already applied, with nothing to
 * say which.
 *
 * @param {Readonly<object>} registry
 * @param {string} version the connector's own version
 * @param {string|null} fromVersion the stamp in the repository's AGENTS.md
 * @returns {string}
 */
export function buildUpdatePayload(registry, version, fromVersion = null) {
  const procedure = requireEntry(registry, 'agents://prompts/agents-update.md');
  const header = [
    'Update this repository against the shared instruction set, following the procedure below.',
    '',
    CONNECTOR_PREAMBLE,
    '',
    `**This connector is version \`${version}\`.** That is the value to write into the`,
    '`Adopted shared-set version:` line when the work is done — last, after the edits land.',
  ];

  if (!fromVersion) {
    const logged = readReleases(registry).length;
    return `${header.join('\n')}

## No version given — this is a re-sync, not a delta

You did not pass \`from_version\`, so nothing here is a history. Either this repository
carries no \`Adopted shared-set version:\` stamp, or it was not read.

**Check for a stamp first.** If one exists, call again with it: ${logged} releases are logged, and
a delta tells you *why* each thing changed, which a re-sync cannot. If there is genuinely no
stamp, continue — §1 of the procedure covers exactly this case — and reconcile the
declaration table against \`list_shared_agents_instruction\` directly.

---

${procedure.text}`;
  }

  const { releases, current, ahead } = releasesSince(registry, fromVersion);
  const from = fromVersion.replaceAll('`', '').trim();

  if (ahead) {
    header.push(
      '',
      `**The stamp is ahead of this connector.** It reads \`${from}\`; the newest logged release is`,
      `\`${current}\`. Do not edit anything on that basis. Report it: either the stamp was written`,
      'for a set this connector has not deployed yet, or it was typed by hand.',
    );
    return `${header.join('\n')}\n\n---\n\n${procedure.text}`;
  }

  if (releases.length === 0) {
    header.push(
      '',
      `**Nothing to apply.** The stamp reads \`${from}\`, which is the newest logged release.`,
      '',
      'That is not the same as being in sync. A release changes the *set*; a repository can still',
      'have drifted on its own — a tool renamed out from under a declaration row, an override whose',
      'shared `name` no longer exists. Run §3(b) and §3(c) of the procedure below, skip §3(a), and',
      'leave the stamp alone.',
    );
    return `${header.join('\n')}\n\n---\n\n${procedure.text}`;
  }

  const table = releases.map(
    (release) => `| \`${release.version}\` | ${release.summary} | ${release.consumersMust} |`,
  );

  return `${header.join('\n')}

## ${releases.length} release${releases.length === 1 ? '' : 's'} to apply: \`${from}\` → \`${current}\`

**Oldest first, in the order given.** They compose: a file added by one release and changed
by a later one is left half-applied if you take the newer line first, and nothing about the
result looks wrong.

| Version | What changed | Consumers must |
|---|---|---|
${table.join('\n')}

Apply every line above, then the declaration and override reconciliation in §3(b) and §3(c),
then the stamp. A version you moved past without applying its line is worse than not
updating at all — the stamp now says the work is done.

---

${procedure.text}`;
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
