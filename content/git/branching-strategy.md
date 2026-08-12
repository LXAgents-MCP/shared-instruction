---
name: branching-strategy
description: One task, one branch — naming as {type}/{primary-noun}, no tool-preset prefixes, no session identifiers, stacked in dependency order.
---

# Branching Strategy

## The rules

* **Branch off the default branch for every task.** Never commit directly to it.
* **One task per branch, one pull request per branch.**
* **Naming: `{type}/{primary-noun}`** — lowercase, kebab-case, singular where it reads
  naturally.

## Allowed types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

## Examples

| Good | Why |
|---|---|
| `feat/login` | A feature, named for the thing it adds. |
| `fix/schema-drift` | A fix, named for the defect. |
| `docs/agents-setup` | Documentation, named for its subject. |
| `build/docker` | Build tooling, named for the surface. |

| Bad | Why |
|---|---|
| `claude/add-login` | Tool-preset prefix. |
| `feat/login-a1b2c3` | Carries a generated suffix. |
| `feat/session_01ABC` | Carries a session identifier. |
| `my-branch` | No type. |
| `feat/various-changes` | Names nothing. |

## Forbidden in a branch name

* **Tool-preset prefixes** — `claude/`, `codex/`, `cursor/`, or any other assistant's
  default namespace.
* **Random or generated suffixes.** A branch name is read by people; a hash is noise. If
  two tasks would collide on a name, the names are not specific enough — fix the names.
* **Session, run, conversation, or trace identifiers** — see
  [`../rules/no-session-links.md`](agents://rules/no-session-links.md).

If a branch already violates the convention, recreate it correctly and delete the wrong
one, or present the options to the user.

## Lifetime

Keep branches short-lived and rebased on the default branch. A branch that has been open
long enough to conflict with itself was two tasks.

## Stacking

For multi-task work, branches stack in dependency order: task 1 branches from the default
branch, task `k` branches from task `k-1`'s branch. Each branch therefore already contains
everything before it, which is what keeps the merges conflict-free. See
[`../planning/task-workflow.md`](agents://planning/task-workflow.md).

When one change spans repositories, each repository gets its own branch **with the same
name**, and the merge order is stated in each pull request body.
