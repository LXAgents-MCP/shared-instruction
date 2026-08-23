---
name: memory-state-repository-state
description: Current known state of LXAgents-MCP/shared-instruction — what exists, what is deployed, and what is not built yet.
---

# Repository State

## 2026-08-23

**What this is.** A dual-purpose package that serves the LXAgents shared agent
instruction set: an MCP server (`lxagents-agents-base`) and a CLI (`lxagents-agents`)
over one frozen registry. Plain JavaScript, Node ESM, no build step. Published as
`@lxagents-mcp/shared-instruction`; the MCP connector id stays `lxagents-agents-base`,
since consuming repositories name it in their client configuration.

**Structure.** `content/` holds the 26 published instruction files. `.agents/rules/`
holds three local rules: `repository.md`, `content-publishing.md`, and `set-mirrors.md`,
the last naming every place outside `content/` that copies published set text. `.agents/`
holds
this repository's own instruction set. `wiki/` holds human documentation. `src/` and
`test/` hold the server and the CLI.

**Surface.** 2 prompts (`agents-setup`, `check-duplicate-agents-instruction`), 27
resources (26 instruction files plus `agents://manifest.json`), and 5 tools — 4
read-only (`agents_setup`, `agents_check_duplicate_instructions`,
`agents_list_instructions`, `agents_read_instruction`) and one that writes
(`mcp_creator`, which plans by default). Prompts and tools deliver identical text from
`src/server/payloads.js`.

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

**Version.** `0.8.0`. Releases so far: `0.0.0` (initial set), `0.1.0` (tool surface),
`0.2.0` (producer/local set split), `0.3.0` (change propagation), `0.4.0` (work summary),
`0.5.0` (always-on workflow, dual-purpose CLI, repository tools), `0.6.0` (`mcp_repos`
withdrawn), `0.6.1` (connector surface table completed), `0.7.0` (package renamed),
`0.8.0` (discovery protocol always on). Everything up to `0.7.0` is merged to `master`;
`0.8.0` is unmerged, on three stacked branches — `docs/discovery-protocol`,
`docs/set-mirrors`, and `chore/release-0-8-0`, in that merge order.

**Four mandatory standard files, not three.** As of `0.8.0` the task workflow, the
branching strategy, the commit conventions, and `rules/discovery-protocol.md` load on
every request. The discovery protocol has **no trigger row** — it was deliberately
removed, so an `AGENTS.md` that mirrors the table must carry the always-on paragraph or
it loses the gate entirely.

**Tests.** 66, all passing, across registry, server, http, manifest, tools, cli, and
mcp-creator.

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

**Next obvious step.** Decide whether to pin the deployed hostname into the shared set,
and whether to add CI.
