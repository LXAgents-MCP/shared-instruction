---
name: shared-root-index
description: Router for the shared instruction set — lists every shared index and nothing else.
---

# Shared Root Index

This file lists indexes only. Never rules, never documentation, never leaf content links.
Read exactly one branch per task.

## Child Indexes

| Index | Scope | Load when |
|---|---|---|
| [`instructions-index.md`](agents://index/instructions-index.md) | `rules/`, `git/`, `planning/`, `prompts/`, `creators/`, `security/` | You need any shared convention — placement, branching, commits, pull requests, planning, security, or a creator. |
| [`logs-index.md`](agents://index/logs-index.md) | The shared set's release history | You need to know what changed in this set, or must record a release. |

## Maintenance

* Adding, removing, or renaming any file in `index/` updates this table **in the same
  commit**.
* This set has no override table — the shared set overrides nothing.
* `agents://manifest.json` is the machine-readable form of everything below. Prefer one
  read of the manifest over walking the set.
