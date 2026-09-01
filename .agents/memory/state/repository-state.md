---
name: memory-state-repository-state
description: Current known state of LXAgents-MCP/shared-instruction — what exists, what is deployed, and what is not built yet.
---

# Repository State

## 2026-08-28

**What this is.** A dual-purpose package that serves the LXAgents shared agent
instruction set: an MCP server (`lxagents-agents-base`) and a CLI (`lxagents-agents`)
over one frozen registry. Plain JavaScript, Node ESM, no build step. Published as
`@lxagents-mcp/shared-instruction`; the MCP connector id stays `lxagents-agents-base`,
since consuming repositories name it in their client configuration.

**Three permission gates, not two.** As of `0.13.0`: approve the plan, ask before opening
a pull request, ask before merging. The sentence naming them is reproduced in four places
— `shared-instructions.md` §H owns it; `AGENTS.md`, `prompts/agents-setup.md`, and
`src/tools/mcp-creator.js` restate it.

**This repository has its own security context.** `wiki/security/security-model.md` (facts)
and `.agents/wiki/security/security-boundaries.md` (the SOP), loaded by a **local** trigger
row. Its first rule is that a security context never crosses repositories.

**Structure.** `content/` holds the 28 published instruction files. `.agents/rules/`
holds three local rules: `repository.md`, `content-publishing.md`, and `set-mirrors.md`,
the last naming every place outside `content/` that copies published set text. `.agents/`
holds
this repository's own instruction set. `wiki/` holds human documentation. `src/` and
`test/` hold the server and the CLI.

**Surface.** 2 prompts (`agents-setup`, `check-duplicate-agents-instruction`), 29
resources (28 instruction files plus `agents://manifest.json`), and 8 tools — 7
read-only (`agents_auto_activation`, `agents_setup`,
`agents_check_duplicate_instructions`, `agents_list_instructions`,
`agents_read_instruction`, `model_naming_convention`, `model_name_format`) and one that
writes (`mcp_creator`, which plans by default).

`agents_auto_activation` is the session-start entry point as of `0.12.0`: one call returns
`rules/auto-activation.md`, the four mandatory standard files whole, and a routing table
built by subtracting what was inlined. It cannot return the three local reads — the
repository's own `AGENTS.md`, root index, and memory index — and says so before anything
else.
Prompts and tools deliver identical text from `src/server/payloads.js`.

`model_name_format` is the only read-only tool that computes rather than returns text. It
applies `rules/model-naming-convention.md` — lowercase both segments, join with one `/` —
and `test/tools.test.js` runs that rule's checklist against its output, so the two cannot
drift apart silently.

**Two modes.** The package is dual-purpose as of `0.5.0`: `lxagents-agents` is a CLI over
the same frozen registry, `lxagents-agents-base` is the MCP server. Both boot through
`src/server/run.js`; a test pins that the two surfaces return identical bytes.

**Transports.** stdio for local use; streamable HTTP for the connector, stateless by
default, with optional stateful sessions and cluster workers.

**Deployed.** Render, from `master`, free tier — so it spins down when idle and the
first request after a pause takes 50+ seconds. Connecting works only when the `/mcp`
path is included in the connector URL; omitting it surfaces as a sign-in error, which
cost a debugging round and is now written into `content/rules/mcp-connector.md`.

**The deployed hostname is unverified.** It was
`https://lxagents-mcp-server.onrender.com/mcp`, named after the old repository. Whether
Render still serves that name after the move to `LXAgents-MCP/shared-instruction` has
not been checked from this repository. Confirm it before quoting it to anyone.

**Version.** `0.14.0`. Releases so far: `0.0.0` (initial set), `0.1.0` (tool surface),
`0.2.0` (producer/local set split), `0.3.0` (change propagation), `0.4.0` (work summary),
`0.5.0` (always-on workflow, dual-purpose CLI, repository tools), `0.6.0` (`mcp_repos`
withdrawn), `0.6.1` (connector surface table completed), `0.7.0` (package renamed),
`0.8.0` (discovery protocol always on), `0.9.0` (task record as task 1), `0.10.0`
(re-target before merging), `0.10.1` (`agents://` alone in the two-sets table), `0.11.0`
(the model naming convention and its two tools), `0.12.0` (one-call session activation), `0.13.0` (the plan gate, the workflow-fallback recovery, and this repository's own security context), `0.14.0` (the security creator, and `security/` made servable).

**`origin/master` is at `83b6f3d` and carries `0.12.0`** as of 2026-09-01, having advanced
from `dd87eee`/`0.10.0` earlier the same day. **Re-verify with `git fetch` rather than
trusting this SHA** — the previous version of this paragraph was added specifically to stop
a session planning a branch point from a stale claim, and it went stale within the hour. A
recorded commit is a snapshot; the remote is the authority.

`0.13.0` and `0.14.0` are both unmerged as of writing: eight stacked branches in one line.
`0.13.0` is four of them — `chore/activation-security-plan`,
`feat/activation-plan-gate`, `docs/security-context`, `chore/release-0-13-0` — in that
merge order, each branched from the one before, the first from `master`. `0.14.0` is the other four —
`chore/security-creator-plan`, `feat/security-folder`, `feat/security-creator`,
`chore/release-0-14-0` — stacked on top of that chain rather than on `master`, because it
depends on the plan gate `0.13.0` defines.

The `0.10.0` entry above said "unmerged, deliberately not merged this round" until
`0.10.1` corrected it. It merged as pull request #21, with #22 (`fix/sonarcloud-findings`)
and #23 (`docs/connector-usage`) landing after it. A state file that goes stale about what
is merged is worse than one that says nothing, because the next session plans a branch
point from it — so this paragraph now names the commit `master` is actually at.

**Local install has a fixed layout.** A clone that runs this server locally belongs at
`./mcps/{org or owner}/{repo}/`, gitignored. It is a runtime, not a vendored set: the
instructions are still read as `agents://` resources, never by file path into the clone.
A committed `./mcps/` is vendoring. See `wiki/guides/install-as-local-mcp.md`.

**Every request has the same shape.** As of `0.9.0`, task 1 is always the task record,
task `n` is always the release, and the work goes between them. Each task appends its own
`### Task k — {branch}` entry to `.agents/memory/tasks/{slug}.md` in the same commit as
its work, so `git log -p` on that file replays the request task by task.

**Four mandatory standard files, not three.** As of `0.8.0` the task workflow, the
branching strategy, the commit conventions, and `rules/discovery-protocol.md` load on
every request. The discovery protocol has **no trigger row** — it was deliberately
removed, so an `AGENTS.md` that mirrors the table must carry the always-on paragraph or
it loses the gate entirely.

**Tests.** 86, all passing, across registry, server, http, manifest, tools, cli, and
mcp-creator. A fresh checkout has no `node_modules` and six of the seven files then fail
with `ERR_MODULE_NOT_FOUND` — run `npm install` first, per `.agents/rules/repository.md`.

**Not built yet.**

* No CI — nothing runs `npm test` or builds the image on push.
* `compose.yaml` still tags the image `0.0.0`, as it has since the first release. It is
  a local build placeholder, deliberately not moved with the package version.
* `content/rules/mcp-connector.md` still uses a `https://<host>/mcp` placeholder rather
  than the real Render hostname; pinning it is a deliberate decision, not an oversight.
* No migration guide for repositories that already carry an older instruction set; the
  prompt for it was drafted in conversation but never written to `wiki/guides/`.
* No consuming repository has picked up the `0.8.0` trigger-row removal yet. Each one has
  to delete the row and add the always-on paragraph by hand.
* No consuming repository has adopted the `0.9.0` task shape yet. It applies from each
  repository's next multi-task request; existing task records need no migration.
* `rules/mcp-connector.md` names two ways to connect — remote, and a local stdio server at
  an arbitrary path. `wiki/guides/install-as-local-mcp.md` now fixes that path at
  `./mcps/{owner}/{repo}/`, but the rule has not been updated to say so. Deliberate: it is
  a published instruction, so it goes through the discovery gate. Raised as a finding.

**Next obvious step.** Decide whether to pin the deployed hostname into the shared set,
and whether to add CI.
