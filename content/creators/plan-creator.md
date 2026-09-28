---
name: plan-creator
description: Creates and maintains the untracked working plan under a repository's .agents/plans/ — one file per purpose, with tasks.md as the center.
version: 1.0.0
author: RBZagan
---

# Plan Creator

Writes the **local working plan** for a task in flight: an untracked checklist
that tracks work while it runs. It writes nothing else — not the task record,
not documentation, not code, and not the work itself.

This is served by `lxagents-agents-base` and carries this set's version. The
plan it describes is **untracked and local to whichever repository is running
it** — a plan is never published, never shared, and never committed, so
serving the creator that writes one leaks no repository's work.

## The folder and the center

- A plan lives at `{repo}/.agents/plans/`, which the repository's `.gitignore`
  excludes as `/.agents/plans/`. Nothing in it is staged, committed, or pushed,
  ever.
- **`tasks.md` is the center file.** Every other file in the plan appears in its
  routing table, and every route out of a plan file goes through it.
- A file in `.agents/plans/` that `tasks.md` does not list is not part of the
  plan. Link it or delete it.
- `README.md` is a stub, not a second router. It states that the folder is
  untracked and points at `tasks.md`. It carries no routing table of its own.

## Before writing

1. **The request is more than one step.** A single edit needs no plan — write
   the code and skip this creator.
2. **Read the instruction set first.** The repository's `AGENTS.md`, the indexes
   its root index routes to, and whatever shared or workspace convention the
   request triggers. A plan built on a half-read set is a plan to redo.
3. **Check whether a plan already exists** for the task in flight. Continue it;
   do not start a second one.
4. **Refine before planning.** State what changes, what does not change, and
   what is being assumed where the request is silent.

## The gate comes before the plan

- [ ] Present the plan and **wait for approval**.
- Writing these files is not approval of the plan they describe, and creating
  the folder is not approval of any task in it.
- Before that yes: no branch, no commit, no file outside `.agents/plans/`, and
  no state-changing command. Reading, searching, and establishing a baseline
  are not gated.

## Writing the files

- One purpose per file, kebab-case, `.md`. A file whose name has nothing to do
  with its content is two files.
- The set follows the work rather than a fixed list. In practice: `scope.md` for
  what is in and out, a `*-steps.md` for executable steps, `docs-to-correct.md`
  for what a change falsifies, `git-workflow.md` for branches and gates,
  `verification.md` for what closes a task, `discovery-findings.md` for rules
  noticed and deliberately not applied.
- Every task is a checkbox — `- [ ]` until done, `- [x]` when done. A step that
  cannot be checked is not a step.
- Each task line names its branch and the files it touches, so the checklist is
  executable without rereading the conversation that produced it.
- The person who owns the repository is `the owner`. Not the user, not the
  client, not a name.

## Recording progress

- Tick a box as the step completes, never in one pass at the end. A checklist
  filled in afterwards records nothing.
- Every task still appends its own entry to `{repo}/.agents/memory/tasks/{slug}.md`
  in **its own commit**. The plan is not that record and does not replace it.
- When the two disagree, the task record wins — it is the one that was reviewed.
  The plan is scratch and is deleted or abandoned when the work merges.

## What this creator refuses

- Committing anything under `.agents/plans/`, or deleting the `.gitignore`
  entry that keeps it out.
- Writing the task record, memory, `wiki/`, or `.agents/wiki/` — those belong to
  the creators in this folder, reached from the repository's `AGENTS.md`.
- Starting the work. The plan is not the work.
- Adding a second center file, or a routing table outside `tasks.md`.

## Related

- [`../planning/task-workflow.md`](../planning/task-workflow.md) — the tasks, the
  branches, and the three gates a plan tracks toward.
- [`memory-creator.md`](memory-creator.md) — the task record that outlives the
  plan.
