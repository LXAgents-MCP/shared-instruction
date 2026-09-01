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
| [`0/14/0`](../../wiki/logs/0/14/0/CHANGELOG.md) | 2026-09-01 | The security creator, and `security/` added to `INSTRUCTION_FOLDERS` after it turned out a file there was silently never collected. Resource count 27 → 28. | Add the security-creator trigger row to your `AGENTS.md`. |
| [`0/13/0`](../../wiki/logs/0/13/0/CHANGELOG.md) | 2026-09-01 | The plan gate and the workflow-fallback recovery, across four mirrors; one mutation-proven test. Ships this repository's own security context alongside, unpublished. | Re-read `planning/task-workflow.md` §B and `rules/shared-instructions.md` §H; say three gates, not two, in your always-on paragraph. |
| [`0/12/0`](../../wiki/logs/0/12/0/CHANGELOG.md) | 2026-08-28 | `agents_auto_activation` returns session start in one call. The sequence is extended, not rewritten; `mcp-creator.js` updated in the same round. | Re-read the connector bootstrap block and update your `AGENTS.md` copy. |
| [`0/11/0`](../../wiki/logs/0/11/0/CHANGELOG.md) | 2026-08-28 | `rules/model-naming-convention.md` is published, with `model_naming_convention` and `model_name_format` serving it. The tools read the rule from the registry, so no new mirror. | Add the `model_name` trigger row to your `AGENTS.md` and read the new rule before writing a `model_name`. |
| [`0/10/1`](../../wiki/logs/0/10/1/CHANGELOG.md) | 2026-08-28 | The two-sets table in `rules/shared-instructions.md` drops the `{shared}` alternative and addresses the shared set as `agents://` alone. | Nothing — `{shared}` stays valid everywhere it is defined, including the trigger table. |
| [`0/10/0`](../../wiki/logs/0/10/0/CHANGELOG.md) | 2026-08-23 | §F: re-target before merging, verify the default branch after. Ships `wiki/guides/install-as-local-mcp.md` alongside, which is not published. | Re-read `planning/task-workflow.md` §F. Re-target before merging, then diff the default branch against the last branch in the chain. |
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
