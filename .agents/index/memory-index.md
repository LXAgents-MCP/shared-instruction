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
| [`../memory/tasks/sonarcloud-quality-security.md`](../memory/tasks/sonarcloud-quality-security.md) | Clearing the SonarCloud findings in both repositories — path traversal, three super-linear regexes, an implicit sort, Docker install hooks, and a CLI refactor. |
| [`../memory/tasks/shared-instructions-agent-urls.md`](../memory/tasks/shared-instructions-agent-urls.md) | Narrowing the two-sets table in `shared-instructions.md` to address the shared set as `agents://` only; the `0.10.1` release. |
| [`../memory/tasks/npm-install-before-test.md`](../memory/tasks/npm-install-before-test.md) | Adding the npm-install-before-npm-test rule, after a fresh checkout made an uninstalled tree look like broken code. |
| [`../memory/tasks/model-naming-convention-tools.md`](../memory/tasks/model-naming-convention-tools.md) | Publishing the `{platform}/{model}` naming convention and the two read-only tools that serve it; the `0.11.0` release. |
| [`../memory/tasks/agents-auto-activation-tool.md`](../memory/tasks/agents-auto-activation-tool.md) | One read-only tool that activates a session in a single call: the activation rule, the four mandatory files, and the routing table. |
| [`../memory/tasks/claude-md-import.md`](../memory/tasks/claude-md-import.md) | Adding `.claude/CLAUDE.md` as an import of the root `AGENTS.md`, so Claude Code and every other agent read one file. |
| [`../memory/tasks/activation-inlining-audit.md`](../memory/tasks/activation-inlining-audit.md) | Auditing whether `agents_auto_activation` still inlines `planning/task-workflow.md`, and closing the test gap that let the question stay open. |
| [`../memory/tasks/activation-security.md`](../memory/tasks/activation-security.md) | Making plan approval a third permission gate, defining the workflow-fallback recovery, and adding this repository's own security context. |
