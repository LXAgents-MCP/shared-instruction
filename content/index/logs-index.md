---
name: shared-logs-index
description: Release history of the shared instruction set, newest first — what changed and what consumers must do about it.
---

# Shared Logs Index

**Scope:** the release history of the shared instruction set
**Parent:** [`root-index.md`](agents://index/root-index.md)

The log files themselves live in `LXAgents/mcp-server` under
`wiki/logs/{Major}/{Minor}/{Patch}/`. They are release records for humans, not instructions,
so they are not served as `agents://` resources — this index is the routing surface.

Consumers pick up a shared change on their next read; there is no upgrade step. That makes
the **Consumers must** column the only notice a repository gets, so it is never left blank.

## Versions

| Version | Date | Summary | Consumers must |
|---|---|---|---|
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
