---
name: branching-strategy
description: One task, one branch — naming as {type}/{primary-noun}, release/{version} for the release task, no tool-preset prefixes or session identifiers, stacked in dependency order.
---

# Branching Strategy

## The rules

* **Branch off the default branch for every task.** Never commit directly to it.
* **One task per branch, one pull request per branch.**
* **Naming: `{type}/{primary-noun}`** — lowercase, kebab-case, singular where it reads
  naturally.
* **The release task is the one exception: `release/{version}`** — see *The release
  branch* below.

## Allowed types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

`release` is also allowed, for the release branch alone. It is a branch type only: a
release commit is `chore(release): …`.

## Examples

| Good | Why |
|---|---|
| `feat/login` | A feature, named for the thing it adds. |
| `fix/schema-drift` | A fix, named for the defect. |
| `docs/agents-setup` | Documentation, named for its subject. |
| `build/docker` | Build tooling, named for the surface. |
| `release/1.0.0` | The release task, named for the version it ships. |

| Bad | Why |
|---|---|
| `claude/add-login` | Tool-preset prefix. |
| `feat/login-a1b2c3` | Carries a generated suffix. |
| `feat/session_01ABC` | Carries a session identifier. |
| `my-branch` | No type. |
| `feat/various-changes` | Names nothing. |
| `release/v1.0.0` | The `v` belongs to the git tag, not the branch. |
| `release/next` | Names no version. |
| `release/1.0` | Not a full `Major.Minor.Patch`. |
| `chore/release-1.0.0` | A release branch uses the `release/` form. |

## Forbidden in a branch name

* **Tool-preset prefixes** — `claude/`, `codex/`, `cursor/`, or any other assistant's
  default namespace.
* **Random or generated suffixes.** A branch name is read by people; a hash is noise. If
  two tasks would collide on a name, the names are not specific enough — fix the names.
  A version number is not a generated suffix: `release/{version}` is the one name where
  digits are the point.
* **Session, run, conversation, or trace identifiers.** A branch name that resolves to one
  particular session is a session link, and a session link is never written into a
  repository.

If a branch already violates the convention, recreate it correctly and delete the wrong
one, or present the options to the user.

## The release branch

The release task's branch is `release/{version}`.

* `{version}` is the full `Major.Minor.Patch` the release ships, with no `v`:
  `release/1.0.0`, `release/1.2.1`, `release/1.3.0`. The `v` belongs to the git tag
  (`v1.0.0`), so the branch and the tag never share a name.
* It is the only branch name that carries dots.
* The name is the version, and a version needs the user's approval. Until it is approved,
  a plan writes the branch as `release/{version}`; the real name is never guessed.
* It stacks like any other branch: from the previous task's branch, not from the default
  branch.
* Nothing here creates the tag. A tag carries a version too, and needs its own approval.

## Lifetime

Keep branches short-lived and rebased on the default branch. A branch that has been open
long enough to conflict with itself was two tasks.

## Stacking

For multi-task work, branches stack in dependency order: task 1 branches from the default
branch, task `k` branches from task `k-1`'s branch. Each branch therefore already contains
everything before it, which is what keeps the merges conflict-free.

When one change spans repositories, each repository gets its own branch **with the same
name**, and the merge order is stated in each pull request body. The release branch is the
exception: each repository's carries that repository's own version.
