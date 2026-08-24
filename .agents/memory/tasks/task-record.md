---
name: memory-tasks-task-record
description: Making the task record task 1 of every request, with each task appending its own entry; the 0.9.0 release.
---

# Task Record as Task One

## 2026-08-23 — in progress

**Goal.** Make the task record a first-class task instead of a side-effect.
`task-workflow.md` §B currently writes `.agents/memory/tasks/{slug}.md` once the list is
confirmed, and §E updates it "after each task" with no stated shape. The record therefore
does not exist until work has started, and it never says which task changed what.

**Objective.** `task-workflow.md` reserves two slots — task 1 is always the task record,
task `n` is always the release — and every task between them appends its own entry to
that record in the same commit as its work. Task 1's pull request carries the live chain
of pull request links.

**Detail.** Reserved slots, not extra work: a one-task request still yields three tasks,
because the record is what makes the work reviewable. Task 1's branch is
`chore/{slug}-plan`. The `0.9.0` version bump is gated and not yet approved.

This file is itself task 1 of the change it describes.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/task-record-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `docs/task-workflow-slots` | `planning/task-workflow.md` §B/§C/§E/§F — the slots, task 1's branch name, the per-task append, the pull request chain mechanics. | — |
| 3 | `docs/task-record-dependents` | Every file that restates the workflow: `prompts/branch-and-commit.md`, `creators/memory-creator.md`, `rules/memory-policy.md`, `rules/shared-instructions.md` §H, `prompts/agents-setup.md`. | — |
| 4 | `chore/release-0-9-0` | Version, `wiki/logs/0/9/0/`, both logs indexes, repository state, and the closing entry that fills this table's PR column. | — |

The PR column is empty by design. Pull request numbers do not exist until every branch is
pushed, and filling them in later on branch 1 would force branches 2 to 4 to be rebased.
Task 4 writes them instead, because it is last and already contains everything.

## Per-task record

Each task appends its own entry below, in the same commit as its work. Nothing is written
here in advance.

### Task 1 — `chore/task-record-plan`

Created this file and registered it in `.agents/index/memory-index.md`. No shared file
touched, so nothing is published by this task and it is not yet a release.

### Task 2 — `docs/task-workflow-slots`

`planning/task-workflow.md` now reserves the two slots and states the mechanics.

* §B — the slot table, the split rule scoped to the middle only, a `PR` column on the
  task table, and *why* the record is task 1 rather than a closing note.
* §C — task 1's branch is `chore/{slug}-plan`, with the reasoning.
* §E — every task appends its own `### Task k — {branch}` entry in the same commit as its
  work. This entry is the first instance of that rule applying to itself.
* §F — task 1's pull request body carries the whole chain once every pull request is
  open; the release task fills the record's `PR` column.

Frontmatter description and the `instructions-index.md` row updated to name the slots,
since that row is what an agent routes on.

Task 3 now depends on this: every file that restates the workflow is out of step until it
lands.

### Task 3 — `docs/task-record-dependents`

Every file that restates the workflow, brought into step with task 2.

* `prompts/branch-and-commit.md` — the standing loop goes from 15 steps to 17: task 1
  writes the record before the work, each task appends its own entry, and step 13 edits
  task 1's pull request body to carry the chain.
* `creators/memory-creator.md` — the `tasks/{slug}.md` row says the file is created as
  task 1 and appended to by each task; "when to write" now leads with *before* the work;
  retention points the closing entry at the release task.
* `rules/memory-policy.md` — the same, in its own table row.
* `rules/shared-instructions.md` §H — the §B mandate row names the reserved slots, and a
  new row mandates the record-before-work and the per-task append.
* `prompts/agents-setup.md` §5.4 — the seed record is named as the shape every later one
  takes, since this prompt is what dictates the shape to a new consuming repository.

Mirror check per `.agents/rules/set-mirrors.md`: the root `AGENTS.md` and
`src/tools/mcp-creator.js` reproduce no workflow text, so neither needed a change.
`prompts/agents-setup.md` was the only mirror affected and is covered above.

## Decisions worth not re-litigating

**The PR column is filled in two moves, not one.** Task 1's pull request *body* is edited
once every pull request is open — a body edit, no commit, so no branch is invalidated.
The file's own table is filled by task 4. Trying to do both from branch 1 was the obvious
approach and it cascades: appending a commit to branch 1 leaves branches 2 to 4 behind
and forces a rebase of the whole stack.

**Task 1's branch is `chore/{slug}-plan`, not `docs/`.** A memory record is not
documentation — `wiki/` and `.agents/wiki/` are the documentation trees, and
`memory-policy.md` keeps memory separate from both. `chore` is the correct type for a
planning artefact, and the `-plan` suffix keeps it distinguishable from the work branches
in a branch listing.

**Not folded in: the §F retarget-and-verify finding from the `0.8.0` round.** It was
raised as a discovery finding and never selected, and §F is being edited by task 2, which
makes it tempting. Editing it now would be self-applying a finding the user did not pick.
It is re-presented at the end of this task instead.
