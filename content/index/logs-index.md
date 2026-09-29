---
name: shared-logs-index
description: Release history of the shared instruction set, newest first — what changed and what consumers must do about it.
version: 1.0.0
author: LXAgents
---

# Shared Logs Index

**Scope:** the release history of the shared instruction set
**Parent:** [`root-index.md`](agents://index/root-index.md)

The log files themselves live in `LXAgents-MCP/shared-instruction` under
`wiki/logs/{Major}/{Minor}/{Patch}/`. They are release records for humans, not instructions,
so they are not served as tools — this index is the routing surface.

Consumers pick up a shared change on their next read; there is no upgrade step. That makes
the **Consumers must** column the only notice a repository gets, so it is never left blank.

## Versions

| Version | Date | Summary | Consumers must |
|---|---|---|---|
| `3/0/0` | 2026-09-29 | The task workflow and the plan creator are one file: `planning/task-workflow.md` is deleted and its procedure lives in `creators/plan-creator.md`, which takes its slot among the four tools every repository declares. The surface is 31 tools, was 32. Removing a published tool consumers name is breaking, hence major. | **Rename one tool and drop any override on it — doing nothing does not stay correct here.** `task_workflow` → `plan_creator` in your `AGENTS.md` declaration block, and delete any override registered against the `task-workflow` name, which now matches nothing and would silently make your local copy the only rule there is. The row's trigger widens to "take in any request of more than one step", so re-read `creators/plan-creator.md` rather than treating this as a rename. No other tool is renamed or removed and no gate changed; `agents_update` does both. |
| `2/0/0` | 2026-09-29 | Every file in the set is its own tool: 31 generated from `content/` plus `mcp_list`. No `path` argument, no registry, no tool list to keep in step with the set — a name is derived from the filename and a description from the file's own frontmatter. Removing every previously published tool name is breaking, hence major. | **Rename every tool you call — doing nothing does not stay correct here.** `branch_strategy` → `branching_strategy`, `commit_strategy` → `commit_conventions`, `pull_request_strategy` → `pull_request_template`, `agents_model_naming_convention` → `model_naming_convention`, `setup_shared_agents_instruction` → `agents_setup`, `update_shared_agents_instruction` → `agents_update`, `check_duplicate_shared_agents_instruction` → `duplicate_instruction_audit`. `task_workflow` and `discovery_protocol` are unchanged. `read_shared_agents_instruction`, `agents_model_name_format` and `mcp_creator` are gone — call the tool for the file you want. **The connector id is also renamed: `lxagents-agents-base` → `lxagents-shared-instruction`**, so update the name in your client configuration. No instruction `name` was renamed or removed, so no override needs dropping. |
| `1/0/0` | 2026-09-09 | Replaces the one-call `agents_auto_activation` with one read-only tool per convention, and moves the routing decision into each repository's own `AGENTS.md`. Adds `update_shared_agents_instruction`. | **Edit your `AGENTS.md` — doing nothing does not stay correct here.** Replace the trigger table with a Shared instruction tools block declaring `task_workflow`, `branch_strategy`, `commit_strategy` and `discovery_protocol` at minimum, move the three permission gates and the discovery block inline, rename every tool you call (`agents_setup` → `setup_shared_agents_instruction`, and see the log for the other five), and stamp the version last. `update_shared_agents_instruction` does all four. No instruction `name` was renamed or removed, so no override needs dropping. |
| `0/14/0` | 2026-09-01 | Adds `creators/security-creator.md`, and makes `security/` a folder the connector actually serves — a file there was previously never collected rather than rejected. | Add one trigger row to your `AGENTS.md`, after "Write documentation", pointing at `{shared}/creators/security-creator.md`. Nothing renamed or removed, no existing row changed, so no override needs dropping. No universal security policy ships yet — the folder is served and empty. |
| `0/13/0` | 2026-09-01 | Plan approval becomes the third permission gate, and `rules/auto-activation.md` gains the recovery for a workflow bypassed after activation ran. | Re-read `planning/task-workflow.md` §B and `rules/shared-instructions.md` §H, and change "two permission gates" to "three" in the always-on paragraph beside your trigger table. That is the only `AGENTS.md` edit. Nothing renamed or removed, no trigger row changed, so no override needs dropping — but doing nothing does **not** stay correct here: the gate is new behaviour. |
| `0/12/0` | 2026-08-28 | Adds `agents_auto_activation` — one call returning the activation rule, the four mandatory standard files, and a routing table for the rest. | Re-read the bootstrap block in `rules/mcp-connector.md` and update the copy in your `AGENTS.md`. The six-step sequence is unchanged, so doing nothing stays correct; nothing was renamed or removed. |
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
