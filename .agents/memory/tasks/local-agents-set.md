---
name: memory-tasks-local-agents-set
description: Separating this repository's own instruction set into .agents/ from the published content/ — goal, decisions, and status.
---

# Task: Separate the local instruction set from the published set

**Status:** in progress

## 2026-08-12

**Goal.** `content/` is the product served over MCP. This repository's own agent
instructions must live in `.agents/`, as in any consuming repository.

**The problem found.** `.agents/` did not exist at all. Nothing was nested wrongly —
`content/` held exactly the 24 published files — but with no local set, this
repository's own conventions had nowhere to live. The root `AGENTS.md` trigger table
pointed at `content/…` and `wiki/…` for repo orientation, so the repository read its own
shipped product as its instruction set and had no place for local rules or memory.

**Decision — the repository has two roles, stated explicitly.** Producer of `content/`,
consumer of the same set plus local additions in `.agents/`. Recorded in
`.agents/rules/repository.md`.

**Decision — `{shared}` resolves to `content/` in the working tree**, not the deployed
connector. This repository edits the set, so a deployed snapshot may be older than the
branch in hand.

**Decision — no overrides.** `repository-rules` and `content-publishing` are additions;
neither `name` exists in `content/`, so the override table is empty and says so.

**Decision — the version bump was made without the usual approval step.** The user asked
to work immediately, which outranks `content/rules/versioning.md` under precedence rule
1. `0.2.0` was chosen: minor, since it adds a convention and renames no `name`. Stated
openly to the user rather than done quietly.

**Created.** `.agents/index/` (six indexes), `.agents/rules/repository.md`,
`.agents/rules/content-publishing.md`, `.agents/wiki/context/repository-map.md`, and
these two memory files.

**Branches.** `refactor/local-agents-set` (this work), then `docs/producer-repo-mode`
for the `content/` change that teaches Mode A about the producer repository.

**Left to do.** Update `content/` so Mode A acknowledges the producer keeps a local set;
bump to `0.2.0` and log it.
