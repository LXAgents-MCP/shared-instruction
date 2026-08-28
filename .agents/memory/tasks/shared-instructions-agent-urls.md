---
name: memory-tasks-shared-instructions-agent-urls
description: Narrowing the two-sets table in shared-instructions.md to address the shared set as agents:// only; the 0.10.1 release.
---

# One Addressing Notation in the Two-Sets Table

## 2026-08-28 — planned

**Goal.** The two-sets table in `content/rules/shared-instructions.md` offers two
notations for the same thing — `{shared}` and `agents://`. A table read to answer "where
does this live?" should name one. `agents://` is the one that is real: it is the URI a
client actually resolves, while `{shared}` is a prose placeholder defined elsewhere.

**Objective.** Line 14 addresses the shared set as `agents://` only, and `npm test`
passes the four boot invariants.

**Detail.** Line 14 only. `{shared}` stays live everywhere it is defined and used —
`content/AGENTS.md`, `rules/mcp-connector.md`, `rules/directories.md`, the
`auto-activation.md` trigger table, and `prompts/agents-setup.md`. Line 25 of the same
file keeps its `{shared}`: it is prose about the producer repository, not an addressing
statement, and the user scoped the change to line 14.

**Not a mirror.** `set-mirrors.md` requires checking whether changed set text is
reproduced outside `content/`. It is not: the string `addressed as` appears only on this
line and in `mcp-connector.md` §26, which is a different sentence and out of scope. No
mirror rides along with this change.

**Version.** Patch. The change removes no rule and renames no `name`, so nothing a
consumer relies on moves — `versioning.md` calls that a clarification. Approved as
`0.10.1` before the work started.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/shared-instructions-agent-urls-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `docs/shared-instructions-agent-urls` | `content/rules/shared-instructions.md` line 14. | — |
| 3 | `chore/release-0-10-1` | Version, log, both logs indexes, state, and this table's PR column. | — |

## Per-task record

### Task 1 — `chore/shared-instructions-agent-urls-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing
published.

Three gates were settled with the user before any file was written, and the answers are
recorded here because a later session would otherwise re-litigate them:

* **Branching.** The harness pinned a `claude/…-44tlkx` branch, which
  `branching-strategy.md` forbids twice over — a tool-preset prefix and a generated
  suffix. The user chose the convention and the three-branch stack, which is also the
  explicit permission the harness requires to push elsewhere.
* **Version.** `0.10.1`, patch.
* **Scope.** Line 14 only.

Also found while reading memory: `.agents/memory/state/repository-state.md` claims
`0.10.0` is unmerged with four stacked branches outstanding. It is merged — PR #21
carried `chore/release-0-10-0`, and #22 and #23 landed after it, leaving `master` at
`dd87eee`. Task 3 corrects the state file.
