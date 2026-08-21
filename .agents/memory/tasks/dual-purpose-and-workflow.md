---
name: memory-tasks-dual-purpose-and-workflow
description: Repository URL migration, the always-on workflow mandate, the dual-purpose CLI, and mcp-creator; the 0.5.0 and 0.6.0 releases.
---

# Dual-Purpose Build and the Always-On Workflow

## 2026-08-21 — shipped

Six tasks, one branch each, stacked in dependency order off `master`.

| # | Branch | What landed |
|---|---|---|
| 1 | `docs/repository-url` | Repository slug and URL moved to `LXAgents-MCP/shared-instruction`. |
| 2 | `docs/global-workflow-enforcement` | The always-on mandate as `shared-instructions.md` §H. |
| 3 | `feat/dual-purpose-entry-point` | CLI half of the package, sharing one registry with the server. |
| 4 | `feat/mcp-repos-tool` | `mcp-repos` — discovery and selection of MCP repositories. **Withdrawn in `0.6.0`.** |
| 5 | `feat/mcp-creator-tool` | `mcp-creator` — scaffolds a dual-purpose MCP repository. |
| 6 | `chore/release-0-5-0` | Version bump, `wiki/logs/0/5/0/`, index rows, this file. |
| 7 | `refactor/mcp-repos-removal` | `mcp-repos` withdrawn, plus the `0.6.0` release. One branch, two commits, by request. |
| 8 | `docs/agents-state-refresh` | This audit: `.agents/` and `wiki/` brought back in line with the code. |

## Decisions worth not re-litigating

**§H was appended, not inserted.** Sections A–G keep their letters because
`prompts/agents-setup.md` cites `shared-instructions.md` §F by name. Renumbering would
have silently broken that reference.

**§H is a mandate and a router, not a procedure.** Task breakdown and one-branch-per-task
were already owned by `task-workflow.md` §B/§C and `branching-strategy.md`. Restating
them in §H would have created the exact duplication the request asked to remove, so §H
names the authority for each clause instead. Only the genuinely new mechanics were
written into the owning files: the refine/plan gate into §A, the pull request gate into
§F beside the merge gate.

**`0.5.0` is a minor bump.** The set adds rules but renames no file, changes no `name`,
and removes nothing — the minor case in `versioning.md`. No consumer needs to drop an
override or edit a trigger row.

**The scaffold implements the HTTP mode its own docs promise.** The first draft generated
a `setup.md` describing `start:http` and `/healthz` against a stdio-only scaffold. That
is precisely the drift `change-propagation.md` exists to prevent, so the scaffold gained
a real `node:http` + SDK transport path rather than the doc being quietly narrowed.

**`mcp_creator` plans by default.** It is the only non-read-only tool here. Writing only
on an explicit flag keeps a speculative model call from creating directory trees, and it
refuses a non-empty target unless forced.

## Withdrawn in 0.6.0

`mcp-repos` was removed one release after it shipped. It scanned the filesystem to find
MCP repositories, but anything reaching this server arrived through a client that
already holds its own server list in configuration, so it answered a question the caller
had usually already answered. Nothing depended on it and `mcp_creator` never called it.
**Do not re-add it** without a caller that actually needs it.

## What the 0.6.0 audit found stale

Documentation drifts fastest where nobody reads it. Worth knowing which pages lie when
they go unmaintained:

* `.agents/wiki/context/repository-map.md` documented one entry point after the build
  became dual-purpose, and still said "never write to stdout" flatly, contradicting the
  CLI carve-out recorded in `.agents/rules/repository.md` in the same release.
* `.agents/memory/state/repository-state.md` carried its original date heading and said
  the connector "lags until `0.5.0` merges" after both `0.5.0` and `0.6.0` had merged.
* `wiki/information/overview.md` claimed "the server exposes no tools at all" — wrong
  since `0.1.0` added the tool surface, and never corrected in five releases.
* `wiki/information/architecture.md` had a source tree missing `tools.js` and
  `payloads.js` (since `0.1.0`) as well as `cli/`, `tools/`, `run.js`, and `resolve.js`.

## Known gaps, deliberately left

* `wiki/logs/0/2/0/CHANGELOG.md` still names the old slug. Released logs are never
  rewritten — `versioning.md`.
* The deployed Render hostname was named after the old repository. Whether it still
  resolves after the move has not been checked. Confirm before quoting it.
* `compose.yaml` still tags the image `0.0.0`, as it has since `0.0.0`. Left alone to
  match precedent rather than changed as a side effect of a release.
* Still no CI. Nothing runs `npm test` on push.
* Merged branches accumulate on the remote; deleting them was out of scope.
