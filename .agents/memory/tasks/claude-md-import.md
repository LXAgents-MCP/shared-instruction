---
name: memory-tasks-claude-md-import
description: Adding .claude/CLAUDE.md as an import of the root AGENTS.md, so Claude Code and every other agent read one file rather than two.
---

# CLAUDE.md as an Import, Not a Copy

## 2026-08-28 — planned

**Goal.** Claude Code looks for `CLAUDE.md`. This repository's instructions are in the
root `AGENTS.md`, which every other agent reads directly. Without a `CLAUDE.md`, Claude
Code starts a session in this repository with none of the auto-activation contract, the
trigger table, or the discovery gate.

**Objective.** `.claude/CLAUDE.md` exists and contains an import of `../AGENTS.md` and
nothing else — no copied content.

**Detail.**

* **The file is an import, deliberately.** A second copy of `AGENTS.md` is the exact
  failure `rules/duplicate-instruction-audit.md` and `rules/shared-instructions.md` §A
  exist to prevent: the copy goes stale and then quietly overrides the original. That the
  copy would be local rather than shared does not change the mechanism.
* **The path is `../AGENTS.md`, not `AGENTS.md`.** Claude Code resolves an `@import`
  relative to the file that contains it, so from `.claude/` a bare `@AGENTS.md` would
  resolve to `.claude/AGENTS.md`, which does not exist. The user's comment records this,
  which is why the comment is worth keeping in the file rather than only here.
* **Not a third documentation tree.** `directories.md` forbids one, but `.claude/` is tool
  configuration in the same category as `.github/` — it holds no instruction content of its
  own, only the pointer. Had it carried a copy, it would have been a third tree and
  forbidden.
* **Not published, not a release.** Nothing under `content/` changes, so no consuming
  repository is affected, and no version carrier moves: no `package.json` bump, no
  `wiki/logs/` directory, no changelog. Creating any of those would be an unapproved
  version claim under `versioning.md`.

**The one thing worth flagging.** `.claude/CLAUDE.md` is a project memory location Claude
Code reads, alongside a root `CLAUDE.md`. If a future session finds the file is not being
picked up, the fix is to move it to the repository root with the import path changed to
`@AGENTS.md` — not to paste the content in.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/claude-md-import-plan` | This file, and its `memory-index.md` row. | |
| 2 | `chore/claude-md-import` | `.claude/CLAUDE.md`. | |
| 3 | `chore/claude-md-import-close` | The closing entry here. No version, no changelog. | |

## Per-task record

### Task 1 — `chore/claude-md-import-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

Recorded because the interesting decision is one a diff cannot show: the file is two lines
and a comment, and the reason it is not two hundred lines is the whole point. Anyone
looking at `.claude/CLAUDE.md` later and thinking it looks unhelpfully thin should find
this entry before they "improve" it by pasting `AGENTS.md` into it.

### Task 2 — `chore/claude-md-import`

`.claude/CLAUDE.md`: one import line, one blank line, and the comment explaining itself.
21 lines, and the count is the point.

`@../AGENTS.md` resolves — checked, not assumed: `.claude/../AGENTS.md` is the 11,956-byte
root entry point. The failure this guards against is silent, since a `CLAUDE.md` whose
import misses does not error, it just supplies nothing.

Not gitignored. Checked with `git check-ignore` before writing, because `.gitignore`
already covers `.idea/` and `.vscode/`, and a tool-config directory that turned out to be
ignored would have produced a file that works locally and does not exist for anyone else.

The comment stays in the file rather than being moved here. It answers the question at the
place it gets asked — someone opening `.claude/CLAUDE.md` and finding two lines — and
`AGENTS.md`'s own iron rule about entry points not carrying detail does not reach a
comment that exists to stop the file being "fixed".

### Task 3 — `chore/claude-md-import-close`

Closes the record. **No version bump, no changelog, no `wiki/logs/` directory, and no row
in either logs index.**

That is deliberate rather than an omission, and it is the same call the
install-before-test round made. `content/` is untouched, so no consuming repository sees
anything on its next read, and `content-publishing.md` scopes the release obligation to
`content/**`. The reserved slot is named "the release" and the pull on a slot with that
name is to find something to release; there was nothing, and inventing a `0.12.1` to fill
it would be an unapproved version claim under `versioning.md` — a version is a claim made
to everyone downstream, and downstream saw nothing here.

80 tests pass, unchanged and untouched by this round: nothing in `src/`, `content/`, or
`test/` moved. The run confirms the tree is clean rather than clearing the change.

**Pull requests.** The user asked in the same message to merge the chain in order, which
is both gates given at once — `task-workflow.md` §F treats permission already given as the
yes, so neither was asked again.

## Record closed

`.claude/CLAUDE.md` imports the root `AGENTS.md`. One source of instructions, two readers.
Nothing published, nothing versioned, nothing left open.
