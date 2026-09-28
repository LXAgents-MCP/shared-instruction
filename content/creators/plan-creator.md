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

## Branch & Commit Convention

Applies to every commit this creator makes.

**Branches** — `{type}/{primary-noun}`, from `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore`, `revert`. Branch off the default branch; one task
per branch, one pull request per branch. Never commit directly to the default branch,
never use a tool-preset prefix (`claude/`, `codex/`, `cursor/`), never add a generated
suffix. Multi-task work stacks in dependency order. Canonical:
[`../git/branching-strategy.md`](agents://git/branching-strategy.md).

**Commits** — `type(optional scope): description`. Imperative subject, plain text, no
trailing period, no links, no issue IDs. Optional body of short bullets saying what and
why. Commit each logical change; never batch a session into one commit; review the diff
first. Index and memory updates ride in the **same commit** as the change they describe.
Canonical: [`../git/commit-conventions.md`](agents://git/commit-conventions.md).

## Which Set

Choose the set before the folder. Universal content goes to the shared set served by the
`lxagents-agents-base` connector; repository-specific content stays local; memory is always
local. A shared file is never copied into a repository except as a declared override
registered in `.agents/index/root-index.md`. See
[`../rules/shared-instructions.md`](agents://rules/shared-instructions.md).

## Directory Mandate

* Indexes: `.agents/index/{scope}-index.md` — never an `INDEX.md`, anywhere.
* Agent wiki: `.agents/wiki/{type}/{file}.md` (frontmatter). Human wiki:
  `wiki/{folder}/{file}.md` (no frontmatter).
* Memory: `.agents/memory/{type}/{file}.md` — local only.
* Instructions: `{set}/{folder}/{file}.md` — one subject per file, matching the filename.

Audience test: would a human contributor read it? → `wiki/`. Does it exist only so an agent
behaves correctly? → `.agents/wiki/`. Both? Facts once in `wiki/`, linked from the agent
page. When nothing fits, create a new folder rather than forcing the file into the closest
one. Placement authority: [`../rules/directories.md`](agents://rules/directories.md).

## No Session Links

Nothing this creator writes, commits, or posts may carry an assistant or tool session link
— including any trailer or footer its tooling appends by default. Strip it before the
commit or the post goes out.
[`../rules/no-session-links.md`](agents://rules/no-session-links.md)

## Registration

Every file this creator creates, moves, or removes is registered in the index that owns
that scope, **in the same commit**. See
[`index-creator.md`](agents://creators/index-creator.md).

## Pull Requests and Versions

Any pull request follows
[`../git/pull-request-template.md`](agents://git/pull-request-template.md); merging requires
user approval per
[`../planning/task-workflow.md`](agents://planning/task-workflow.md). Version changes
require user approval per [`../rules/versioning.md`](agents://rules/versioning.md).

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
