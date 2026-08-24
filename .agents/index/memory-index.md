---
name: memory-index
description: Index of this repository's memory — current state and task records. Read every session.
---

# Memory Index

**Scope:** `.agents/memory/`
**Parent:** [`root-index.md`](root-index.md)

Read this every session and load only the rows whose scope matches the request, so you
continue prior work instead of restarting it. Every memory file is registered here in
the same commit that creates it.

## state/

| File | Purpose |
|---|---|
| [`../memory/state/repository-state.md`](../memory/state/repository-state.md) | Current known state: what exists, what is deployed, what is not built yet. |

## tasks/

| File | Purpose |
|---|---|
| [`../memory/tasks/local-agents-set.md`](../memory/tasks/local-agents-set.md) | Separating this repository's own instruction set from the published `content/`. |
| [`../memory/tasks/change-propagation-rule.md`](../memory/tasks/change-propagation-rule.md) | Adding the change-propagation rule and hardening no-session-links; the `0.3.0` release. |
| [`../memory/tasks/work-summary-rule.md`](../memory/tasks/work-summary-rule.md) | Adding the work-summary rule and closing two audit gaps found on real consumers; the `0.4.0` release. |
| [`../memory/tasks/dual-purpose-and-workflow.md`](../memory/tasks/dual-purpose-and-workflow.md) | Repository URL migration, the always-on workflow mandate, the dual-purpose CLI, and `mcp-creator`; the `0.5.0` and `0.6.0` releases. |
| [`../memory/tasks/discovery-protocol-always-on.md`](../memory/tasks/discovery-protocol-always-on.md) | Promoting `discovery-protocol.md` from a trigger row to a mandatory standard file; the `0.8.0` release. |
| [`../memory/tasks/task-record.md`](../memory/tasks/task-record.md) | Making the task record task 1 of every request, with each task appending its own entry; the `0.9.0` release. |
| [`../memory/tasks/mcp-install.md`](../memory/tasks/mcp-install.md) | The §F retarget rule, and a wiki guide for running this repository as a local MCP server from `./mcps/`. |
