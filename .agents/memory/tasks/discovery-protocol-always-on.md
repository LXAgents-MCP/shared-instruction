---
name: memory-tasks-discovery-protocol-always-on
description: Promoting discovery-protocol.md from a trigger row to a mandatory standard file; the 0.8.0 release.
---

# Discovery Protocol Always On

## 2026-08-23 — shipped

Three tasks, one branch each, stacked in dependency order off `master`.

| # | Branch | What landed |
|---|---|---|
| 1 | `docs/discovery-protocol` | The always-on list becomes four files; the trigger row is dropped from `auto-activation.md` and from the root `AGENTS.md` mirror; §H, `content/AGENTS.md`, `agents-setup.md`, and the instructions index follow. Second commit: the hard-coded paragraph in `mcp_creator`'s scaffold, which would have shipped the old count to every repository the tool creates. |
| 2 | `docs/set-mirrors` | The two approved discovery findings: `.agents/rules/set-mirrors.md`, and the carve-out in `auto-activation.md` for a row the shared set removed upstream. |
| 3 | `chore/release-0-8-0` | Version, `wiki/logs/0/8/0/`, both logs indexes, state, this file. |

Documentation propagation rode with the change it describes: the adoption guide on
branch 1 (it is the human counterpart of `agents-setup.md`), the orientation page and
the code conventions on branch 2 (they route to the rule that branch introduced).

## Decisions worth not re-litigating

**Removing the trigger row was the user's call, made against a recommendation to keep
it.** The recommendation was that `task-workflow`, `branching-strategy` and
`commit-conventions` are all always-on *and* keep their rows, so removing this one makes
discovery-protocol the only always-on file without one, and forces every consumer to
re-sync its mirrored table. The user chose removal; the release note therefore carries an
explicit two-part instruction, because deleting the row without adding the always-on
paragraph would remove the gate from a consuming repository altogether.

**The prompt named four files to edit; seven needed editing.** The three it missed were
the repository's own root `AGENTS.md` (this repository consumes its own set, so its
mirror goes stale like any consumer's), `src/tools/mcp-creator.js` (the scaffold
hard-codes the paragraph instead of reading it from the set), and
`content/prompts/agents-setup.md` (which dictates the auto-activation contract to every
new consumer and had no always-on clause at all — the row removal would have silently
dropped the gate from every future setup).

**`agents-setup.md` §4.1(d) now forbids re-adding the standard files as trigger rows.**
Without that, the row-for-row mirroring instruction and the always-on paragraph pull in
opposite directions, and a setup agent would reasonably put discovery-protocol back in
the table.

**Minor, not patch.** The set adds a mandate and removes a trigger row, but renames no
file, changes no `name`, and removes no rule — the minor case in `versioning.md`. The
`0/4/0` release set the precedent for treating a trigger-table change this way.

**The canonical discovery-protocol block was not touched.** `test/registry.test.js:95`
pins it byte-identical across six copies. Only where the rule activates from changed, not
what it says, so the test needed no update.

**The branch was renamed mid-task, at the user's instruction.** The harness pinned
`claude/discovery-protocol-mandatory-qqn3rk`, which violates `branching-strategy.md`
twice — tool-preset prefix and generated suffix. Once the user gave explicit permission
to move, the work was restructured onto the three stacked branches above and the local
`claude/…` branch was deleted. The remote copy is the user's to delete. Nothing was
merged at any point, so no history was rewritten.

**Both findings were applied on their own branch, not folded into task 1.** They were
presented and selected after task 1 was already committed, which makes them a separate
task under `task-workflow.md` §B, and the release moved to the end where §B puts it.

## Known gaps, deliberately left

* `wiki/logs/0/5/0/CHANGELOG.md` still says "three files". Released logs are never
  rewritten — `versioning.md`.
* Consuming repositories are not updated by this release; they pick it up on their next
  read and must make the two `AGENTS.md` edits themselves.
* Still no CI, and `compose.yaml` still tags the image `0.0.0`.
