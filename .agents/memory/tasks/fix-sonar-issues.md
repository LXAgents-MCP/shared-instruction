---
name: memory-tasks-fix-sonar-issues
description: Clearing the two remaining SonarCloud findings in LXAgents-MCP/shared-instruction — a super-linear regex in frontmatter parsing, and Express framework version disclosure.
---

# Two Remaining SonarCloud Findings

**Goal.** Clear the last two SonarCloud findings in this repository.

1. `src/tools/from-content.js:66` — super-linear regex (performance).
2. `src/http.js:72` — Express framework version disclosure (security hotspot).

**Objective.** Both are small, independent, and each owns exactly one file, so each
becomes its own commit on one branch rather than a batched session commit.

**Pre-work, outside the branch.** The working tree carried CRLF while the repository
stores LF, so all 110 tracked files read as modified with no real change. `master` now
carries `.gitattributes` pinning `text=auto eol=lf` (`d45a99a`), which collapsed the
churn before this branch was cut. `npm install` was also required before `npm test` would
run at all — a fresh checkout otherwise looks like broken code.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/fix-sonar-issues-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `chore/fix-sonar-issues-plan` | `src/tools/from-content.js` — the frontmatter field regex. | — |
| 3 | `chore/fix-sonar-issues-plan` | `src/http.js` — disable the `x-powered-by` header. | — |

Tasks 2 and 3 share this branch deliberately. Run in sequence, not in parallel: they
touch different files but the same git index, and two agents staging and committing at
once race for it.

## Per-task record

Each task appends its own entry below, in the same commit as its work.

### Task 1 — `chore/fix-sonar-issues-plan`

Created this file and registered it in `.agents/index/memory-index.md`. No shared file
touched, so nothing is published by this task.
