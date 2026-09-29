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
