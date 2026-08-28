# 0.12.0

**Released:** 2026-08-28

Adds `agents_auto_activation`: one read-only call that returns the shared half of the
session-start sequence — the activation rule, the four files that load on every request,
and a routing table for the rest. Six reads become one.

**Consumers must:** re-read the connector bootstrap block in `rules/mcp-connector.md` and
update the copy in your `AGENTS.md`, which now names the one-call shortcut. That is the
only edit. **The six-step sequence is unchanged**, so a repository that does nothing stays
correct — it simply keeps paying six reads for what is now one. No file was renamed, no
`name` changed, no rule was removed, and no trigger row moved, so no override needs
dropping.

## Added

- `agents_auto_activation` — read-only, no arguments, roughly 31,000 characters.

  | Contains | Source |
  |---|---|
  | The activation rule, whole | `rules/auto-activation.md` |
  | The four mandatory standard files, whole | `MANDATORY_STANDARD_FILES` in `src/constants.js` |
  | A routing table for every remaining shared file | The registry, by subtraction |

  **It leads with what it does not contain.** Steps 1, 3 and 4 of the sequence read
  `{repo}/AGENTS.md`, `{repo}/.agents/index/root-index.md`, and
  `{repo}/.agents/index/memory-index.md` — files on the caller's own filesystem that no
  connector can see. The payload's second heading is `## This call does not finish the
  job`, and it names all three. One tool that looked complete would be worse than six
  reads that look like six: a caller who stops there is activated wrong, and nothing
  afterwards signals it.

  The routing table is built by subtracting what was inlined, so a file added to the set
  appears in it on the next boot with no code change.

## Changed

- `rules/auto-activation.md` — a new subsection, **Steps 2, 5 and 6 in one call**, beneath
  the session-start sequence. The sequence itself is untouched: six steps, same numbering,
  same order. The note is an addition, which is what lets a consuming repository still
  carrying the old block be merely out of date rather than wrong.
- `rules/mcp-connector.md` — the bootstrap block gains a **One call instead of six** line,
  and the surface table gains the tool. This block is reproduced verbatim into every
  consuming repository's `AGENTS.md`, which is why it is the line worth changing.
- `prompts/agents-setup.md` — the auto-activation contract a new repository writes for
  itself now names the tool, so repositories set up from here get the shortcut without a
  later migration.

## Notes for this repository

- **The four files are named once.** `MANDATORY_STANDARD_FILES` in `src/constants.js`, with
  `requireEntry` run over it at tool registration. `rules/auto-activation.md` stays the
  authority on *why* those four are mandatory; the constant is the authority on *which*, and
  a URI that stops resolving fails at boot rather than shipping a quietly shorter payload.
- **No new mirror.** `buildActivationPayload` composes from registry entries, so
  `.agents/rules/set-mirrors.md` gains no row — the same constraint `0.11.0` was built
  under.
- **`src/tools/mcp-creator.js` was updated in the same commit**, and it is the one that
  would have been missed: it is source rather than documentation, and the block is a string
  array rather than prose, so it does not surface in a search for a changed sentence. It is
  in the mirror table precisely because `0.8.0` shipped a stale count through it into every
  repository the tool creates. Scaffolded repositories now say: call the tool first, then
  read the local files, because the tool cannot see files in this repository.
- Four tests, each pinning a distinct way this could rot: every inlined file appears whole
  rather than paraphrased; the three local paths are named; nothing in the set is absent
  from the routing table; and the discovery-protocol gate text survives. The last is not
  redundant — that rule has **no trigger row** by design, so it is the file most easily lost
  from a bootstrap payload, and losing it removes the propose-never-self-apply gate
  entirely.
- 80 tests, up from 76, all passing.
