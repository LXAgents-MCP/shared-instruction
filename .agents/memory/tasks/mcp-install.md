---
name: memory-tasks-mcp-install
description: The §F retarget rule, and a wiki guide for running this repository as a local MCP server from ./mcps/.
---

# Local MCP Install and the Retarget Rule

## 2026-08-23 — in progress

**Goal.** Two unrelated changes in one chain.

1. Apply the §F finding re-presented at the end of the `0.9.0` round: a stacked pull
   request is re-targeted **before** merging, and the default branch is verified after
   the last merge.
2. Give a human a copy-paste way to run this repository as a local MCP server from a
   clone under `./mcps/{org}/{repo}/`, for when the deployed connector is not the right
   answer.

**Objective.** `task-workflow.md` §F states both halves of the rule. `wiki/` carries a
guide whose copy-paste block drops straight into a consuming repository's `AGENTS.md`.
No merges this round — pull requests only.

**Detail.** `./mcps/{org or owner}/{repo}/` is a fixed layout, not a suggestion. The
guide is human documentation and is not published, so only task 2 drives the release.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/mcp-install-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `docs/task-workflow-retarget` | `planning/task-workflow.md` §F — retarget before merging, verify after. | — |
| 3 | `docs/local-mcp-install` | `wiki/guides/install-as-local-mcp.md` and its `project-wiki-index.md` row. | — |
| 4 | `chore/release-{version}` | Version, log, both logs indexes, state, and this table's PR column. | — |

## Per-task record

### Task 1 — `chore/mcp-install-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

## Decisions worth not re-litigating

**`./mcps/` is a runtime, not a vendored set — and the guide has to say so.**
`mcp-connector.md` forbids cloning the set into a repository, and
`shared-instructions.md` §A forbids vendoring it. Both remain true. What makes a clone
under `./mcps/` legitimate is that it runs the *server*: the instruction files are still
read as `agents://` resources, never by file path out of the clone, and `mcps/` is
gitignored so it never enters the consuming repository's history. A committed `./mcps/`
is vendoring, and `duplicate-instruction-audit.md` should treat it as such. The rule
already sanctions the same thing in a looser form — "as a local stdio server, for
development on the instruction set itself", with a `cwd` path — so this formalises where
that clone lives rather than opening a new door.

**`mcp-connector.md` is deliberately left unedited.** It is the natural place to name a
third connection mode, and it is a published rule that this change arguably makes
incomplete. `change-propagation.md` is explicit: documentation you fix yourself, an
instruction you do not — you collect the finding and present it. Editing it here would
be self-applying. Raised as a finding instead.

**Two unrelated changes, one chain.** §B splits work that touches different areas, and
these do. They are separate tasks on separate branches with separate pull requests; they
share only the record and the release, which is what the chain is for.
