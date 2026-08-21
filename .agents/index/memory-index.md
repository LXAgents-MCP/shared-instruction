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
| [`../memory/tasks/dual-purpose-and-workflow.md`](../memory/tasks/dual-purpose-and-workflow.md) | Repository URL migration, the always-on workflow mandate, the dual-purpose CLI, and the two MCP repository tools; the `0.5.0` release. |
