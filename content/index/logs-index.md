---
name: shared-logs-index
description: Release history of the shared instruction set, newest first — what changed and what consumers must do about it.
---

# Shared Logs Index

**Scope:** the release history of the shared instruction set
**Parent:** [`root-index.md`](agents://index/root-index.md)

The log files themselves live in `LXAgents-MCP/shared-instruction` under
`wiki/logs/{Major}/{Minor}/{Patch}/`. They are release records for humans, not instructions,
so they are not served as `agents://` resources — this index is the routing surface.

Consumers pick up a shared change on their next read; there is no upgrade step. That makes
the **Consumers must** column the only notice a repository gets, so it is never left blank.

## Versions

| Version | Date | Summary | Consumers must |
|---|---|---|---|
| `0/11/0` | 2026-08-28 | Publishes the model naming convention — every stored model identifier is `{platform}/{model}`, lowercased — and adds the `model_naming_convention` and `model_name_format` tools. | Add the `model_name` trigger row to your `AGENTS.md`, after the "Record a release" row, and read `rules/model-naming-convention.md` before writing to any `model_name` column. Nothing was renamed or removed, so no override needs dropping. |
| `0/10/1` | 2026-08-28 | The two-sets table in `rules/shared-instructions.md` addresses the shared set as `agents://` alone, instead of offering `{shared}` beside it. | Nothing. `{shared}` is unchanged everywhere it is defined and used, so existing references still resolve and no override needs dropping. Re-read `rules/shared-instructions.md` §A only if you quote that table. |
| `0/10/0` | 2026-08-23 | Re-target a stacked pull request before merging it, and verify the default branch after the last merge. | Re-read `planning/task-workflow.md` §F. Re-target pull request `k` to the default branch before merging rather than after, then diff the default branch against the last branch in the chain and report the result. No trigger row changes, no override to drop. |
| `0/9/0` | 2026-08-23 | Every request gets the same shape: task 1 is the task record, task `n` is the release, the work goes between, and each task appends its own entry to the record. | Re-read `planning/task-workflow.md` §B/§C/§E/§F and `prompts/branch-and-commit.md`. From your next multi-task request, write `.agents/memory/tasks/{slug}.md` before the work on a `chore/{slug}-plan` branch, and have each task append its own entry. No trigger row changes, no override to drop, no migration for an existing record. |
| `0/8/0` | 2026-08-23 | Promotes `rules/discovery-protocol.md` from a trigger row to a mandatory standard file, so the propose-never-self-apply gate loads on every request. | Delete the discovery-protocol trigger row from your `AGENTS.md` and make the always-on paragraph beside your trigger table name four files, not three. Both edits, or the gate leaves your repository — `rules/auto-activation.md` now explicitly permits deleting a row the shared set removed. Then re-read it and `rules/shared-instructions.md` §H. |
| `0/7/0` | 2026-08-21 | Renames the npm package to `@lxagents-mcp/shared-instruction`. The connector id and the instruction set are unchanged. | Nothing. The connector is still `lxagents-agents-base`, so existing client configurations keep working. Only npm installs use the new package name. |
| `0/6/1` | 2026-08-21 | Lists `mcp_creator` in the connector's published surface table, which had shown four tools since the connector began exposing five. | Nothing. Re-read `rules/mcp-connector.md` only if you want the complete tool list. |
| `0/6/0` | 2026-08-21 | Withdraws the `mcp_repos` tool. The shared instruction set is unchanged. | Nothing, unless you called `mcp_repos` or the `repos` CLI command directly. No instruction file changed. Reconnect if your client cached the tool list. |
| `0/5/0` | 2026-08-21 | Makes the task and git workflow apply to every request with no trigger phrase, and gates opening a pull request on the user's permission. | Re-read `rules/shared-instructions.md` §H and `planning/task-workflow.md`. Ask before opening a pull request, as you already do before merging. No trigger row changes and no override needs dropping. |
| `0/4/0` | 2026-08-13 | Adds a rule that finished work is reported back to the user, and closes two gaps the duplicate audit hit on real repositories. | Re-read `rules/auto-activation.md` and add the new `work-summary` trigger row to your `AGENTS.md`, plus a row for each of your own local instructions. |
| `0/3/0` | 2026-08-12 | Adds a rule that documentation follows code, and extends the session-link rule to what a forge stores after you post. | Re-read `rules/auto-activation.md` and add the new trigger row to your `AGENTS.md`. Delete any local `change-propagation.md` — it now shadows a shared `name`. |
| `0/2/0` | 2026-08-12 | Separates the producer repository's own `.agents/` set from the `content/` it publishes, and says so in the rules. | Nothing — the clarification affects only a repository that publishes a shared set. |
| `0/1/0` | 2026-08-12 | Adds a four-tool surface alongside the prompts and resources, for clients that enumerate a connector by its tools alone. | Nothing. If your client showed the connector as having no tools, reconnect and it becomes usable. |
| `0/0/0` | 2026-08-12 | First release of the shared instruction set, delivered over the `lxagents-agents-base` MCP server. | Nothing — this is the initial set. |

## Maintenance

* Newest version first, one row per version directory.
* A new version directory is a version claim and requires user approval —
  [`../rules/versioning.md`](agents://rules/versioning.md).
* Never edit a released version's log to change history. Corrections go in the next
  version's log.
* Shape and section rules:
  [`../creators/changelog-creator.md`](agents://creators/changelog-creator.md).
