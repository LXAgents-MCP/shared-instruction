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
| 1 | `chore/shared-instructions-agent-urls-plan` | This file, and its `memory-index.md` row. | not opened |
| 2 | `docs/shared-instructions-agent-urls` | `content/rules/shared-instructions.md` line 14. | not opened |
| 3 | `chore/release-0-10-1` | Version, log, both logs indexes, state, and this table's PR column. | not opened |

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

### Task 2 — `docs/shared-instructions-agent-urls`

Line 14 of `content/rules/shared-instructions.md` now addresses the shared set as
`agents://` alone:

```
| **Shared** | The `lxagents-agents-base` MCP server, addressed as `agents://` | Everything true across repositories. |
```

One line, one cell, nothing else touched. `{shared}` is untouched on line 25 of the same
file and everywhere it is defined, so the placeholder is still a live notation — this
narrows how the two-sets table addresses the set, it does not retire the placeholder.
Anyone reading the change as a deprecation of `{shared}` is reading more into it than it
says.

`npm test` passes 69/69, which covers the four boot invariants in
`content-publishing.md`: the frontmatter is untouched, the `name` is unchanged, and the
file has not moved, so none of them was ever at risk — the run confirms it rather than
discovering it.

Task 3 now owes the release: this is a `content/` change, so consumers pick it up on
their next read with no upgrade step and the log entry is the only notice they get.

### Task 3 — `chore/release-0-10-1`

Released `0.10.1`, a patch approved before the work started.

| File | Change |
|---|---|
| `package.json`, `package-lock.json` | `0.10.0` → `0.10.1`. |
| `wiki/logs/0/10/1/CHANGELOG.md` | New. **Consumers must: nothing.** |
| `content/index/logs-index.md` | `0/10/1` row, newest first. |
| `.agents/index/logs-index.md` | Same row, local form. |
| `.agents/memory/state/repository-state.md` | Version paragraph, and the `0.10.0` merge-state correction. |

`compose.yaml` is left at image tag `0.0.0`, matching every release before this one — it
is a local development tag, not a version carrier that tracks `package.json`.

**The `PR` column reads `not opened`, not a number.** Task-workflow §F gates opening a
pull request on the user's explicit permission, and it was not asked for in this round.
The three branches are pushed and stack cleanly; whoever opens them fills the column in.

**State correction.** The state file claimed `0.10.0` was unmerged with four branches
outstanding. It merged as PR #21, with #22 and #23 after it, and `master` is at `dd87eee`
— which is where task 1 branched from. Corrected in this commit, with the commit named so
the next session can check it rather than trust it.

## Record closed

The work in this record is done: line 14 addresses the shared set as `agents://` alone,
and `0.10.1` is logged. Nothing is left open except the pull request gate above.
