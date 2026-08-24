# 0.9.0

**Released:** 2026-08-23

Gives every request the same shape: task 1 is always the task record, task `n` is always
the release, and the work goes between them. Each task appends its own entry to the
record in the same commit as its work.

**Consumers must:** re-read `planning/task-workflow.md` §B, §C, §E and §F, and
`prompts/branch-and-commit.md`. From your next multi-task request, write
`.agents/memory/tasks/{slug}.md` **before** the work rather than after the list is
confirmed, on a `chore/{slug}-plan` branch, and have each task append its own entry. No
file was renamed, no `name` changed, and no rule was removed, so no override needs
dropping and no trigger row changes. An existing task record needs no migration — the
shape applies from the next request.

## Changed

- `planning/task-workflow.md` §B — two reserved slots, a slot table, and a `PR` column on
  the task table. The split rule is scoped to the work in the middle, so "do not
  manufacture tasks" no longer reads as an argument against the reserved slots: a
  one-item request still yields three tasks. The section says why the record comes first
  — written first it states intent a reviewer can check the diff against; written last it
  is a summary of whatever happened, which the diff already gives you.
- `planning/task-workflow.md` §C — task 1's branch is `chore/{slug}-plan`. Memory is
  neither documentation tree, so `docs/` is the wrong type, and the suffix keeps the
  record apart from the work branches in a listing.
- `planning/task-workflow.md` §E — every task appends its own `### Task k — {branch}`
  entry in the same commit as its work, never batched at the end. This is what makes the
  record a per-task changelog: `git log -p` on that one file replays the work task by
  task, and a reviewer sees the claim and the change in the same commit.
- `planning/task-workflow.md` §F — once every pull request is open, task 1's pull request
  **body** carries the whole chain, so the record's pull request is the index of the
  work. The record file's own `PR` column is filled by the release task instead.
- `prompts/branch-and-commit.md` — the standing loop goes from 15 steps to 17, matching
  the above.
- `creators/memory-creator.md` and `rules/memory-policy.md` — `tasks/{slug}.md` is
  created as task 1 and appended to by each task; the closing entry belongs to the
  release task.
- `rules/shared-instructions.md` §H — the §B mandate row names the reserved slots, and a
  new row mandates record-before-work and the per-task append.
- `prompts/agents-setup.md` §5.4 — the seed record is named as the shape every later
  record takes, since this prompt is what dictates that shape to a new consuming
  repository.
- `index/instructions-index.md` — the `task-workflow.md` row names the slots, since that
  row is what an agent routes on.

## Notes for this repository

- The `PR` column exists because a pull request number does not: it cannot be known when
  the record is written. Back-filling it on branch 1 afterwards leaves every later branch
  behind and forces a rebase of the whole stack, so §F splits the job — a body edit on
  task 1's pull request, which costs nothing, and the file's own column filled by the
  release task, which is last and already contains everything.
- This release was built under the workflow it defines. `.agents/memory/tasks/task-record.md`
  is task 1 of its own change, and each of the four tasks appended its entry as it landed.
- Mirror check per `.agents/rules/set-mirrors.md`: the root `AGENTS.md` and
  `src/tools/mcp-creator.js` reproduce no workflow text and needed no change;
  `prompts/agents-setup.md` was the only affected mirror.
- 66 tests, unchanged and passing.
