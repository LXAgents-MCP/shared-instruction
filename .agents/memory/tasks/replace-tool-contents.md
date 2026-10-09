---
name: memory-tasks-replace-tool-contents
description: Replacing every published tool with the owner's re-created set, making each tool self-contained, adding the automation hub and the release/{version} branch form; the 4.0.0 release.
---

# Replace the Tool Contents

## 2026-10-09 — in progress

**Goal.** The server serves only the owner's re-created tool set, plus one hub tool that
agents read every session and that says when to load each other tool.

**Objective.** `content/` holds the 47 files of the owner's source repository plus
`automation.md`, and nothing else. No old file or tool name survives in `content/` or `src/`.
Every tool except `automation` is self-contained. `automation` lists all 47 others with the
condition that activates each. The server boots and `npm test` is green.

**Detail.** Edit this repository only. The source repository `tool-contents` is read-only and
the owner will delete it, so nothing here may depend on it afterwards: files are copied, never
linked.

**Status:** open. Task 1 of 7.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Task record | `chore/replace-tool-contents-plan` | |
| 2 | Swap in the new set verbatim, fix tool ids, retire `mcp_list` | `refactor/tool-set` | |
| 3 | Add the `release/{version}` branch form to the set | `feat/release-branch` | |
| 4 | Make every tool end in itself | `refactor/self-contained-tools` | |
| 5 | The `automation` hub | `feat/automation` | |
| 6 | Correct current docs and the local set | `docs/tool-surface` | |
| 7 | Release `4.0.0` | `release/4.0.0` | |

Branches stack: task 1 from `master`, task `k` from task `k-1`.

## Decisions the owner approved with the plan

| # | Decision |
|---|---|
| D1 | Seven convention-named stacked branches, not the harness-named `claude/…` branch. The release branch is `release/{version}` with no `v`, because the git tag already carries it (`v4.0.0`). |
| D2 | Version `4.0.0` — tools are removed and renamed, so it is a major. |
| D3 | `mcp_list` is retired. It served `index/server-registry.md`, which the new set drops. |
| D4 | Self-containment inlines the one fact a pointer carried, and drops pointers that were only navigation. |
| D5 | Tool ids stay derived from the filename. The 13 files under `skills/github` and `skills/gitlab` get explicit overrides, because four filename pairs collide and boot refuses a collision. |
| D6 | `automation` is named "Read this tool every session"; its description opens with the same words. No MCP `title` support is added. |
| D7 | Current docs are corrected in task 6. History (`wiki/logs/0..3`, older task records, decisions, findings) is left as written. |

`automation` is a manifest with activation conditions, not a copy of every tool's text. Embedding
all 47 would defeat the token saving it exists for.

## Known tension, recorded now and listed in full by task 4

The new contents are written for a plain-files workspace. `rules/shared-instructions.md` and
`rules/repository.md` say no MCP server serves them and that routing lives in each consumer's
`AGENTS.md`; `rules/repository.md` and `skills/engineering/mcp-server.md` describe "this
workspace". Published here, they reach every consumer. Their meaning is not changed.

## Task entries

### Task 1 — chore/replace-tool-contents-plan

Landed: this record and its row in `memory-index.md`. The `PR` column is filled by task 7, not
here, so no later branch needs a rebase. Nothing under `content/`, `src/` or `test/` changes in
this task. Task 2 depends on nothing from this entry except the plan above.
