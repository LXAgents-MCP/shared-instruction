---
name: memory-state-repository-state
description: Current known state of LXAgents/mcp-server — what exists, what is deployed, and what is not built yet.
---

# Repository State

## 2026-08-12

**What this is.** An MCP server serving the LXAgents shared agent instruction set as
`lxagents-agents-base`. Plain JavaScript, Node ESM, no build step. Published as
`@lxagents/agents-base`.

**Structure.** `content/` holds the 26 published instruction files. `.agents/` holds
this repository's own instruction set — created in this session; before that the
repository had none, and its root `AGENTS.md` routed its own conventions into the
published set. `wiki/` holds human documentation. `src/` and `test/` hold the server.

**Surface.** 2 prompts (`agents-setup`, `check-duplicate-agents-instruction`), 26
resources (26 instruction files plus `agents://manifest.json`), and 4 read-only tools
(`agents_setup`, `agents_check_duplicate_instructions`, `agents_list_instructions`,
`agents_read_instruction`). Prompts and tools deliver identical text from
`src/server/payloads.js`.

**Transports.** stdio for local use; streamable HTTP for the connector, stateless by
default, with optional stateful sessions and cluster workers.

**Deployed.** Render, from `master`, at `https://lxagents-mcp-server.onrender.com/mcp`.
Free tier, so it spins down when idle and the first request after a pause takes 50+
seconds. Connected successfully once the `/mcp` path was included in the connector URL —
omitting it surfaced as a sign-in error, which cost a debugging round and is now written
into `content/rules/mcp-connector.md`.

**Version.** `0.3.0`. Releases so far: `0.0.0` (initial set), `0.1.0` (tool surface),
`0.2.0` (producer/local set split), `0.3.0` (change propagation). `0.3.0` is committed but
not yet merged or deployed, so the connector still serves `0.2.0`.

**Tests.** 46, all passing, across registry, server, http, manifest, and tools.

**Not built yet.**

* No CI — nothing runs `npm test` or builds the image on push.
* `content/rules/mcp-connector.md` still uses a `https://<host>/mcp` placeholder rather
  than the real Render hostname; pinning it is a deliberate decision, not an oversight.
* No migration guide for repositories that already carry an older instruction set; the
  prompt for it was drafted in conversation but never written to `wiki/guides/`.

**Next obvious step.** Decide whether to pin the deployed hostname into the shared set,
and whether to add CI.
