# 0.8.0

**Released:** 2026-08-23

Promotes `rules/discovery-protocol.md` from a trigger row to a mandatory standard file.
The gate against self-applying an invented rule now loads on every request, exactly like
the branching strategy and the commit conventions.

**Consumers must:** edit your `AGENTS.md`. **Delete the discovery-protocol trigger row**
— the one reading "Notice a rule worth adding" — and make sure the always-on paragraph
beside your trigger table names **four** files rather than three: the task workflow, the
branching strategy, the commit conventions, and the discovery protocol. Deleting the row
without adding the paragraph removes the gate from your repository entirely, so the two
edits go together. Then re-read `rules/auto-activation.md` and `rules/shared-instructions.md`
§H. No file was renamed, no `name` changed, and no rule was removed, so no override needs
dropping. `rules/auto-activation.md` previously forbade removing a mirrored row outright;
it now carves out a row the shared set itself removed, so this instruction no longer
contradicts the rule you are following it from.

## Changed

- `rules/auto-activation.md` — the always-on list is four files, not three.
  `{shared}/rules/discovery-protocol.md` joins the task workflow, the branching strategy,
  and the commit conventions. The session-start sequence gains a step that loads the
  standard files before the trigger table is consulted, since one of them is no longer
  reachable from that table.
- `rules/shared-instructions.md` §H — "the four mandatory standard files", a new mandate
  row for the gate itself (propose any instruction you think should exist; never write it
  into either set yourself), and the heading and body that still counted three.
- `AGENTS.md` — the always-on paragraph names the fourth file and explains why it has no
  trigger row.
- `prompts/agents-setup.md` — the auto-activation contract dictated to a new consuming
  repository now carries the always-on paragraph, and §4.1(d) warns that the four standard
  files must not be re-added as trigger rows. A verification item checks it. Without this,
  a repository set up after this release would have lost the gate along with the row.
- `index/instructions-index.md` — the `discovery-protocol.md` row says it loads on every
  request, because that row is now its only routing surface.
- `rules/auto-activation.md`, "Mirroring this table in a consuming repository" — the
  prohibition on removing a mirrored row gains an exception for a row the shared set
  removed upstream, with a warning to check what replaced it. Without this, a consumer
  following the rule would have refused this release's own instruction.

## Removed

- The `discovery-protocol.md` trigger row, "Notice a rule worth adding, or content worth
  adding to an existing instruction". A trigger fires only once a finding has already been
  recognised for what it is, which is the point at which writing the rule into the set is
  one edit away. The gate has to be standing before the work starts, so it moved to the
  always-on list instead of sitting in both places.

## Notes for this repository

Not part of the published set, but shipped in the same release:

- `src/tools/mcp-creator.js` hard-codes the always-on paragraph into the `AGENTS.md` it
  scaffolds rather than reading it from the set, so it named three files and omitted the
  discovery protocol. Fixed in the same release; every repository the tool creates from
  now on ships the correct count.
- New local rule `.agents/rules/set-mirrors.md`, naming the three places this repository
  reproduces published set text outside `content/` — the root `AGENTS.md`, the hard-coded
  paragraph in the `mcp_creator` scaffold, and the auto-activation contract
  `prompts/agents-setup.md` dictates to new consumers — and requiring them to move in the
  same commit as the set. All three were stale in the first draft of this release and
  nothing written down would have caught it. Local, not shared: only a repository that
  produces the set can hold a mirror of it.
- Documentation propagated in the same release: `wiki/guides/connect-a-repository.md`
  now has an adopter verify the four always-on files, `.agents/wiki/context/repository-map.md`
  carries the mirror trap in its gotchas list, and `.agents/rules/repository.md` records
  the convention that keeps a file off that list — read set text from the registry, the
  way `payloads.js` does.
- 66 tests, unchanged and passing. The registry test that pins the discovery-protocol
  block byte-identical across its six copies still passes: the canonical block itself was
  not touched, only where the rule is activated from.
