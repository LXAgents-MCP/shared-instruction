---
name: memory-tasks-merge-workflow
description: Merging planning/task-workflow.md into creators/plan-creator.md and deleting the original — the tool-surface break, the retired planning folder, and the 3.0.0 release.
---

# Merge `task-workflow` into `plan-creator`

**Goal.** One home in the shared set for how a request becomes a plan, tasks, branches
and gates, instead of two files that overlap. `content/planning/task-workflow.md` and
`content/creators/plan-creator.md` both described the plan gate, and a session taking
in a multi-step request had to decide which of them to read first.

**Objective.** `content/planning/task-workflow.md` is gone; its §A–§F is absorbed into
`content/creators/plan-creator.md`; no file in any tree links to the deleted path;
`npm test` is green; the published surface is 31 tools rather than 32; and the set is
released as `3.0.0`.

**Detail.** This is a shared-set change, so it is a release. Two decisions were taken
by the owner before the plan was approved:

| Decision | Choice |
|---|---|
| The mandatory four | `plan_creator` takes `task_workflow`'s slot, so a consumer swaps one tool name in one table |
| The version | `3.0.0`, major — a published file is removed, so a tool consumers name stops existing |

**Pre-work, outside the branch.** `npm install` is required before `npm test` will run
at all in a fresh checkout, and `git check-ignore -v .agents/plans/tasks.md` confirmed
`/.agents/plans/` is excluded before the working plan was written there.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/merge-workflow-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `docs/merge-task-workflow-body` | `content/creators/plan-creator.md` — absorb §A–§F, widen `description`. | — |
| 3 | `docs/merge-task-workflow-links` | Delete `content/planning/task-workflow.md`; repoint every link inside `content/`. | — |
| 4 | `docs/merge-task-workflow-mirrors` | `src/`, `test/`, root `AGENTS.md`, `README.md`, `wiki/`, `repository-state.md`. | — |
| 5 | `docs/merge-task-workflow-release` | `3.0.0`: `package.json`, `wiki/logs/3/0/0/`, both logs indexes, docker tags. | — |

Branches stack: task `k` branches from task `k-1`. The order is forced. Task 2 rewrites
the file task 3 links to, so it lands first; task 3 deletes the path that
`test/server.test.js` and `test/http.test.js` still assert, so the suite stays red
until task 4 — that is expected, not a defect to chase.

## Per-task record

Each task appends its own entry below, in the same commit as its work.

### Task 1 — `chore/merge-workflow-plan`

Created this file and registered it in `.agents/index/memory-index.md`. No shared file
touched, so nothing is published by this task and no version claim is made yet — the
`3.0.0` bump is task 5, and `versioning.md` gates it separately.

The working plan for this work is untracked and lives in `.agents/plans/`, centered on
`tasks.md`. It is scratch and is deleted or abandoned when the work merges; this
record is the one that outlives it.

### Task 2 — `docs/merge-task-workflow-body`

Absorbed `planning/task-workflow.md` §A–§F into `creators/plan-creator.md` and widened
the frontmatter `description` so the tool routes on both jobs rather than only the plan
folder. The set still holds both files, so the surface is still 32 tools and nothing is
published as removed by this task.

**The shape the merge settled on.** The file now has two parts: *The workflow* (§A–§F,
lettered and unchanged from the original so every existing `§B` / `§E` / `§F`
cross-reference in the set keeps resolving to the same letter) and *The working plan*
(what the creator actually writes). The old "It writes nothing else — not the task
record" line survived as a scope note at the top rather than as a claim about the file:
the **creator** is still only the untracked plan, while the file teaches the workflow
the plan is tracked toward. The record's *shape* is delegated to `memory-creator.md`,
which already owned it, so one subject per file survives the merge.

**Two duplications were collapsed rather than concatenated.** `task-workflow.md` §C
and the old `## Branch & Commit Convention` section said overlapping things about
branches and commits, and the plan gate appeared in both §B and in *The gate comes
before the plan*. §C now carries only what is specific to running a task list — task 1's
`chore/{slug}-plan` name, the stacking rule, no two tasks per branch — and points at the
shared convention section for naming and message format. The plan section's gate says
outright that it is §B's gate, and that the plan files are the first thing it
authorises.

**A regression the test caught, and what it was.** The first draft folded the whole
branch-and-commit convention into §C and dropped the `## Branch & Commit Convention`
heading. `test/server.test.js` failed — `every creator carries the shared procedure` —
because that section is pinned **verbatim and byte-identical** against
`memory-creator.md` across the whole folder. The test exists because the procedure is
duplicated by design and can drift with nothing to catch it; `plan-creator.md` is named
in its own comment as the file that shipped without it once already. So the section was
restored byte-for-byte, and the workflow-specific rules moved under §C beside it. The
suite is 31/31.

The merged file is **20,877 bytes**, against 11,503 for `task-workflow.md` and roughly
6,500 for `plan-creator.md` alone. The plan estimated ~16 KB; the real figure is higher
because both files' text is retained in full, with only the two genuine duplications
removed. That makes it the largest file in the set, and it is served by the tool every
repository must declare. The cost is accepted and unchanged in kind — one call at
intake rather than two overlapping calls — but it is larger than planned and consumers
should know the number.

Verified nothing was dropped by a line-by-line comparison of the old file against the
new one: every non-trivial line of `task-workflow.md` is present, the only intentional
loss being its own frontmatter `description`, which named the old file's job alone.

### Task 3 — `docs/merge-task-workflow-links`

Deleted `content/planning/task-workflow.md` and repointed every link to it. Seventeen
files in `content/` changed. This is the commit that actually removes a tool from the
published surface, so it is the one a consuming repository's `AGENTS.md` will break on.

**`plan_creator` took `task_workflow`'s place in all four routing surfaces**, not just
one. They are separate files that all had to move together or the set routes to a tool
that is gone:

| Surface | File |
|---|---|
| The declared-tools table and "the four that are not optional" | `rules/auto-activation.md` |
| The §H gate table — seven rows, plus the four-tool declaration line and two prose mentions | `rules/shared-instructions.md` |
| The connector bootstrap block and its tool table | `rules/mcp-connector.md` |
| The federation contract's task-and-git-workflow section | `AGENTS.md` |

`auto-activation.md` already had a `plan_creator` row carrying the narrower trigger
"plan a task of more than one step, before any file is written". That row absorbed the
old `task_workflow` row and its trigger widened to "take in any request of more than one
step"; the table now has one row per tool rather than two rows for one job.

**The six creators.** Five of them — `changelog`, `index`, `information`, `instruction`
and `security` — carry a byte-identical "merging requires user approval per
`../planning/task-workflow.md`" sentence, so one scripted edit moved all five to
`plan-creator.md` §F. `memory-creator.md` took the same edit plus its two record-specific
references (§B for task 1, §F for the release task). The remaining set-side links were
`git/branching-strategy.md` §C, `git/pull-request-template.md` §F, and
`prompts/branch-and-commit.md` §A.

**`agents-setup.md` is the mirror that mattered most.** It dictates the declaration block
every new consuming repository is given, so leaving its `task_workflow` template row
would have written a dead tool name into every repository set up from the current
prompt. Its template row, its record-shape link, and its "all four mandatory tools"
checklist line were all repointed. `agents-update.md` got the same two edits, which is
what carries a consumer across this release.

**`content/planning/` is gone from the tree**, because git will not track an empty
directory. Four files asserted the folder exists and were corrected: the tree diagram in
`rules/directories.md`, the "nothing copied from this set" step in `AGENTS.md`, and three
places in `agents-setup.md` that enumerate the shared-only folders. The
`instructions-index.md` `planning/` section stays, reworded to match how `security/` is
already described — empty, served, and the place a future file in that folder would be
published from. Its `creators/` row for `plan-creator.md` now names both jobs.

**One `planning/` reference was deliberately kept.** `rules/directories.md` has a table
of candidate folders to create, alongside sixteen others that do not exist — `docs/`,
`skills/`, `personas/`, `ethics/` and the rest. `planning/` belongs in that menu, because
a universal planning rule that is not part of a creator would still land there.

**The suite is red here, as planned, for two reasons only** — the hard-coded `32` in
`test/http.test.js` and the index-routing assertion in `test/server.test.js` that still
names the deleted path. Both are task 4. No other test regressed, and no boot invariant
tripped: the set still builds, so the merge itself published a valid surface.

### Task 4 — `docs/merge-task-workflow-mirrors`

Dropped the tool from the server, the suite, and every copy of the set's text that
lives outside `content/`. Thirteen files. The suite is **31/31**.

**`src/server.js` needed no logic change and one string change.** The surface is
generated from the files on disk, so deleting a file removes its tool with no line of
server code involved — the same property `.agents/rules/set-mirrors.md` calls the
preferred shape. The only edit is inside the `instructions` string every client reads at
`initialize`, which is a mirror by the rule's own table. It named `task_workflow` as an
example tool, so it now names `plan_creator` first and drops the stale name; the other
two examples became `branching_strategy` and `discovery_protocol` so the sentence still
shows a spread across folders rather than three files from one.

**The suite counted the surface in three places**, not the one the plan expected: two
`assert.equal(..., 32)` calls in `test/http.test.js` beyond the cross-transport
assertion. They were all written against a number that changes on every add or remove,
which is the same hand-maintained copy a generated list should not have. They are
corrected to 31 and left as literal counts — a derived count would be a second thing to
keep in step with the set, and the bijection test already proves files and tools agree.

`test/server.test.js` asserted that the instructions index routes
`planning/task-workflow.md`. Because `creators/plan-creator.md` was already in that same
list, the entry is **dropped rather than swapped** — the index still routes the file, it
just no longer routes it twice.

**Every `32` in the human documentation was a mirror of a number, not of a sentence**,
which is why there were so many: the root `AGENTS.md`, `README.md`,
`.agents/memory/state/repository-state.md`, and five `wiki/` pages. All now read 31 tools
and 30 generated. Two of them also named the tool — the root `AGENTS.md` declaration
block and the tool table in `wiki/information/overview.md` — and the "four mandatory
tools" checklist in `wiki/guides/connect-a-repository.md`, which is the page a person
follows to check a consuming repository by hand.

**What was deliberately left alone.** `wiki/logs/**` and the twenty-odd prior records
under `.agents/memory/tasks/` still say `planning/task-workflow.md`, including some that
cite its sections by letter. They are released history: each was true when written, and
`versioning.md` forbids editing a released version's log to change history. The
`2/0/0` row in `content/index/logs-index.md` says `task_workflow` was "unchanged" — true
at `2.0.0`, superseded by `3/0/0`. Rewriting them would make the history lie about when
each change happened.

Verified against a fresh process rather than assumed: `TOOL_FILES` holds 30 entries,
`task_workflow` is absent, and `plan_creator` resolves to `creators/plan-creator.md`.

### Task 5 — `docs/merge-task-workflow-release`

Cut `3.0.0`. `package.json` reads `3.0.0`, `package-lock.json` was resynced rather than
hand-edited, `wiki/logs/3/0/0/CHANGELOG.md` is new, and both logs indexes carry the row
at the top. Suite **31/31**.

**The image tag was in more places than the plan found.** `versioning.md` counts a
container image tag as a version carrier, so every one of them is in scope — and the
plan named only `README.md` and `.agents/rules/repository.md`. The grep turned up two
more wiki pages carrying `lxagents-shared-instruction:2.0.0`: `wiki/environments/docker.md`
in six places and `wiki/security/security-model.md` in two. Both now read `3.0.0`. Had
the release shipped against the plan's list, this repository's own documentation would
have been telling a reader to pull an image the current release does not tag.

**The Consumers must line carries a second instruction, not just the rename.** The
obvious one is `task_workflow` → `plan_creator` in the declaration block. The one that
matters more is **dropping any override registered against the `task-workflow` name**.
An override matches a shared file by `name`, and `task-workflow` is gone, so the match
fails silently — the repository keeps its local copy and nothing anywhere says the shared
rule behind it no longer exists. That is the exact failure `agents-update.md` is written
around, and it is why the line is in both the changelog and both index rows.

The line also says the trigger **widens**, so a consumer who treats this as a pure rename
and edits only the name ends up with a row that fires too narrowly. The `3/0/0` changelog
states the three gates are unchanged and that their terms moved files rather than wording,
so nobody re-derives them.

**Two findings were recorded and not applied**, as the discovery gate requires: `F1`, the
`plan-creator.md` body claiming it carries the set's version while every file in the set
sits at `1.0.0`; and `F2`, six creators restating the merge gate that `plan-creator.md`
now owns. Both are in the working plan at `.agents/plans/discovery-findings.md` and are
repeated in the changelog's "Not fixed here", so a consumer reading the release learns
they were seen rather than missed. `F3`, that the set never states the three gates as a
list, is the one worth the owner's attention: this session asked for the plan gate four
separate times, and it is only in the set as a sentence inside a paragraph.

**State at close.** Five commits on five stacked branches, none pushed, no pull request
opened, nothing merged. The `PR` column stays empty because §F fills it once the pull
requests exist — back-filling it now would rebase the whole stack for no gain.

| # | Branch | Commit |
|---|---|---|
| 1 | `chore/merge-workflow-plan` | `dc2ae8f` |
| 2 | `docs/merge-task-workflow-body` | `cb12bea` |
| 3 | `docs/merge-task-workflow-links` | `e9519ce` |
| 4 | `docs/merge-task-workflow-mirrors` | `febbddf` |
| 5 | `docs/merge-task-workflow-release` | this one |

**Not done:** no branch pushed, no pull request opened, nothing merged, and no consuming
repository's `AGENTS.md` updated — this repository does not hold those repositories. The
`3/0/0` changelog names what each of them must do.
