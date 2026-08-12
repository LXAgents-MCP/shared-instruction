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
| [`0/1/0`](../../wiki/logs/0/1/0/CHANGELOG.md) | 2026-08-12 | Adds a four-tool surface alongside the prompts and resources. | Nothing. Reconnect if your client showed no tools. |
| [`0/0/0`](../../wiki/logs/0/0/0/CHANGELOG.md) | 2026-08-12 | First release of the shared instruction set, served as `lxagents-agents-base`. | Nothing — initial set. |

## Maintenance

* Newest version first, one row per version directory.
* A new version directory is a version claim and needs user approval —
  [`../../content/rules/versioning.md`](../../content/rules/versioning.md).
* Never edit a released log to change history; corrections go in the next version.
