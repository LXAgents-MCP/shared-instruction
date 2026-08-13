---
name: memory-tasks-work-summary-rule
description: Adding the work-summary rule and closing two audit gaps found on real consuming repositories; the 0.4.0 release.
---

# Task: The Work Summary Rule And Two Audit Fixes

## Goal

Add a shared rule that finished work is reported back to the user, and fix two gaps
that surfaced while deduplicating `JetsadaWijit/jwz` and `JetsadaWijit/jwz-website`
against this set.

## Where the two fixes came from

They were not theoretical. Running the duplicate audit against two repositories that
were scaffolded before indexes moved to `.agents/index/` produced both:

1. **The audit proposed deleting the repositories' routing tables.** Its "never a
   candidate" table excluded `.agents/index/**`, but those repositories kept indexes at
   `.agents/INDEX.md`, `wiki/INDEX.md`, `wiki/logs/INDEX.md`, and the repository root.
   The exclusion did not reach them, so they were classified by path as stale copies.
   Fixed by excluding any `INDEX.md` at any depth and saying why.
2. **"Mirrors it row-for-row" read as a closed table.** Both repositories carry local
   instruction folders — `api/`, `security/`, `dependencies/`, `skills/` in one;
   `docs/`, `frontend/`, `knowledge/`, `deploy/`, `skills/` in the other. A trigger
   table with no rows for them leaves every one of those files unable to auto-activate.
   Fixed by stating that the mirrored rows are a floor and local rows are appended
   below, while removing, reordering, or repointing a mirrored row stays forbidden.

Both were reported as discovery-protocol findings and approved before being written.

## What was added

`content/rules/work-summary.md` (`name: work-summary`). The gap it closes: every
obligation this set carried produced an artifact — a commit, an index row, a memory
entry, a changelog — and none of them reach the person who asked for the work. The rule
fixes the five things a summary must carry, states that silence reads as success, and
draws the line between a summary (delivered, then scrolls away) and the durable record
in `.agents/memory/tasks/` and `wiki/logs/`.

## Release

`0.4.0`, minor — the set gains a rule and breaks no existing convention. The version was
proposed to the user and approved before anything was bumped, per
`content/rules/versioning.md`.

Consumers must add the new trigger row. Both `jwz` and `jwz-website` were updated on
their own branches in the same effort, so neither is left owing the re-read.

## Propagation carried out

Adding a served file changes the resource count, which several documents state as a
number. `24 → 25` was missed once before and is now a known trap; `25 → 26` was applied
to `README.md`, `wiki/information/overview.md`, `wiki/environments/setup.md`,
`.agents/wiki/context/repository-map.md`, and
`.agents/memory/state/repository-state.md`, plus the resource table in
`wiki/reference/mcp-surface.md` and the rules table in
`content/index/instructions-index.md`.

## Verification

`npm test` — 46 passing, 0 failing, including the four registry boot invariants that
would otherwise refuse to start the server. Note that the suite reports 4 failures
before `npm install`; that is a missing `node_modules`, not a content fault.
