---
name: logs-index
description: This repository's release history, newest first — what changed and what consumers must do.
---

# Logs Index

**Scope:** `wiki/logs/`
**Parent:** [`project-wiki-index.md`](project-wiki-index.md)

Because consumers read the shared set live and pick a change up on their next read, the
**Consumers must** column is the only notice they get. It is never left blank.

## Versions

| Version | Date | Summary | Consumers must |
|---|---|---|---|
| [`0/9/0`](../../wiki/logs/0/9/0/CHANGELOG.md) | 2026-08-23 | Task 1 is always the task record, task `n` the release, and each task appends its own entry. Built under the workflow it defines. | Re-read `planning/task-workflow.md` and `prompts/branch-and-commit.md`. Write the record before the work, on `chore/{slug}-plan`. |
| [`0/8/0`](../../wiki/logs/0/8/0/CHANGELOG.md) | 2026-08-23 | `discovery-protocol.md` becomes the fourth mandatory standard file; its trigger row is dropped. The `mcp-creator` scaffold is corrected, `auto-activation.md` permits an upstream row removal, and `.agents/rules/set-mirrors.md` records where this repository copies set text. | Delete the discovery-protocol trigger row from your `AGENTS.md` and make the always-on paragraph name four files. Re-read `rules/auto-activation.md` and `rules/shared-instructions.md` §H. |
| [`0/7/0`](../../wiki/logs/0/7/0/CHANGELOG.md) | 2026-08-21 | Package, image, and server title renamed to match the repository. `SERVER_ID` and both bins deliberately unchanged. | Nothing — no connector config changes. |
| [`0/6/1`](../../wiki/logs/0/6/1/CHANGELOG.md) | 2026-08-21 | Adds `mcp_creator` to the connector surface table; fixes a matching read-only contradiction in `mcp-surface.md`. | Nothing — documentation only. |
| [`0/6/0`](../../wiki/logs/0/6/0/CHANGELOG.md) | 2026-08-21 | Withdraws the `mcp_repos` tool and its CLI command; no shared-set change. | Nothing, unless you called `mcp_repos` or `repos` directly. Reconnect if the tool list was cached. |
| [`0/5/0`](../../wiki/logs/0/5/0/CHANGELOG.md) | 2026-08-21 | Always-on task and git workflow, a pull request permission gate, and the dual-purpose CLI with the `mcp-repos` and `mcp-creator` tools. | Re-read `rules/shared-instructions.md` §H and `planning/task-workflow.md`; ask before opening a pull request. |
| [`0/4/0`](../../wiki/logs/0/4/0/CHANGELOG.md) | 2026-08-13 | Adds the work-summary rule, and closes two audit gaps found on real consuming repositories. | Re-read `rules/auto-activation.md`, add the `work-summary` trigger row, and add a row per local instruction file. |
| [`0/3/0`](../../wiki/logs/0/3/0/CHANGELOG.md) | 2026-08-12 | Adds change-propagation, and widens no-session-links to what a forge stores after you post. | Re-read `rules/auto-activation.md`, add the change-propagation trigger row, and delete any local `change-propagation.md`. |
| [`0/2/0`](../../wiki/logs/0/2/0/CHANGELOG.md) | 2026-08-12 | Separates this repository's own `.agents/` set from the published `content/`. | Nothing — affects only a publishing repository. |
| [`0/1/0`](../../wiki/logs/0/1/0/CHANGELOG.md) | 2026-08-12 | Adds a four-tool surface alongside the prompts and resources. | Nothing. Reconnect if your client showed no tools. |
| [`0/0/0`](../../wiki/logs/0/0/0/CHANGELOG.md) | 2026-08-12 | First release of the shared instruction set, served as `lxagents-agents-base`. | Nothing — initial set. |

## Maintenance

* Newest version first, one row per version directory.
* A new version directory is a version claim and needs user approval —
  [`../../content/rules/versioning.md`](../../content/rules/versioning.md).
* Never edit a released log to change history; corrections go in the next version.
