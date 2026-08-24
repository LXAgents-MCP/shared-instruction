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

### Task 2 — `docs/task-workflow-retarget`

`planning/task-workflow.md` §F gains the two halves of the finding.

* Re-target **before** merging. A forge only re-targets a stacked pull request when its
  base branch is deleted on merge; with that setting off, pull request `k` merges into
  branch `k-1` and the default branch stays behind while every signal says success.
* After the last merge, diff the default branch against the final branch in the chain and
  report the result. "Merged" is a claim about a pull request, not about the default
  branch.

The closing bullet of §F now names the tree check as part of the final state, so the
report has somewhere to land rather than being an unhomed instruction.

Evidence, not theory: this cost a mis-merge in the `0.8.0` chain, where PR 2 landed on
branch 1 and only a tree diff caught it. Applying it by hand in the `0.9.0` chain landed
all four cleanly.

### Task 3 — `docs/local-mcp-install`

`wiki/guides/install-as-local-mcp.md` — five steps, plus what to paste into `AGENTS.md`.

* Opens with when *not* to use it: the remote connector stays the normal case, and this
  is for a cold host, an offline machine, a client that only takes a local command, or
  work on the set itself.
* "The one rule that makes this safe" comes before the steps, not after: the clone is a
  runtime, and three conditions keep it from becoming a vendored set — `mcps/` is
  gitignored, files are read as `agents://` and never by path into the clone, and nothing
  is copied out into `.agents/`.
* Step 3 is the gitignore, and the page says outright that it is the step that matters.
  Steps 1, 2, 4 and 5 are convenience; step 3 is what keeps a runtime from turning into
  permanent drift.
* Step 5 is the copy-paste `AGENTS.md` block, which degrades correctly: if the connector
  already resolves, the block tells the agent to ignore the rest of it.
* Also covers staleness — a clone is a snapshot, `git pull` does nothing to a running
  process because the registry is frozen at boot — and removal.

`wiki/guides/connect-a-repository.md` gains a pointer: it already described a local stdio
server with an arbitrary `/path/to/shared-instruction`, so the two pages disagreed about
where a clone lives until now. Both are `wiki/`, so fixing it here is documentation work,
not a rule change.

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
