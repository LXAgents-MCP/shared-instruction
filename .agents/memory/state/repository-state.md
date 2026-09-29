---
name: memory-state-repository-state
description: Current known state of LXAgents-MCP/shared-instruction — what exists, what is deployed, and what is not built yet.
---

# Repository State

## 2026-09-29

**What this is.** A read-only MCP server that serves the LXAgents shared agent instruction
set. Plain JavaScript, Node ESM, no build step. Published as
`@lxagents-mcp/shared-instruction`; the server name is `lxagents-shared-instruction`, renamed
from `lxagents-agents-base` in `2.0.0`. Every consuming repository named the old one in
its client configuration, so each has to update it.

**Not dual-purpose.** There is no CLI. `package.json` declares one bin,
`lxagents-shared-instruction`, which is the server. The `lxagents-agents` CLI, the `mcp_repos`
and `mcp_creator` tools, MCP prompts, `agents://` resources, and a `manifest.json` were all
removed in #63. `content/index/root-index.md` and several `content/` files still used
`agents://` link notation; that survives as prose addressing, not as a fetchable endpoint.

**Three permission gates, not two.** Approve the plan, ask before opening a pull request,
ask before merging. `shared-instructions.md` §H owns the sentence; the root `AGENTS.md`,
`content/prompts/agents-setup.md`, and the `instructions` string in `src/server.js`
restate it — three mirrors, listed in `.agents/rules/set-mirrors.md`.

**This repository has its own security context.** `wiki/security/security-model.md` (facts)
and `.agents/wiki/security/security-boundaries.md` (the SOP), loaded by a **local** trigger
row. Its first rule is that a security context never crosses repositories.

**Structure.** `content/` holds 30 published instruction files. `.agents/rules/` holds
three local rules: `repository.md`, `content-publishing.md`, and `set-mirrors.md`. `wiki/`
holds human documentation. `src/` is eight files and `test/` is two.

**Surface — one tool per file.** 31 tools: 30 generated from `content/`, one per file,
plus `mcp_list`. The name is derived from the path (folder stripped, `.md` dropped, kebab →
snake), with one override: `AGENTS.md` → `agents_entry_point`. The description is the
file's own frontmatter `description`, verbatim. **No tool takes an argument.**

That is a change from `1.0.0`, where six hand-named convention tools replaced the
single 31,000-character `agents_auto_activation` call. The four mandatory ones are still
`plan_creator`, `branching_strategy`, `commit_conventions`, and `discovery_protocol`, but
they are no longer a fixed set: there are 30 files, and a repository declares in its own
`AGENTS.md` which of them it uses.

`mcp_list` is the one hand-written tool, and the only one that reaches `readSetFile` in
`src/content.js` — with a constant path. Because no tool takes a `path`, there is nothing
for a caller to traverse with; the zero-argument design is the replacement for the old
traversal check, not a weaker version of it.

**Transports.** Two, both calling the same `createServer()`, so the surface is identical by
construction: `src/index.js` (stdio by default, and `MCP_TRANSPORT=http` to reach the
other) and `src/http.js`, which binds the port and serves the express app in `src/app.js` at
`POST /mcp` and `GET /healthz`. **The HTTP transport is stateless** — a fresh `McpServer`
and a fresh `StreamableHTTPServerTransport` per request, no session id minted, and no
session store. It replaced an SSE transport at `GET /sse` and `POST /message` whose
`SSEServerTransport` was **deprecated in the SDK**; that removal is **breaking for every
deployed client** and was a deliberate, owner-reviewed decision — see
`.agents/memory/tasks/sse-to-mcp-transport.md`. The application is in `src/app.js` and does
not listen, which is what lets `src/http.js` own the port, the startup lines and the drain
without the two being tangled. `src/index.js` reaches it by **dynamic import**, so express
never loads into a stdio process whose stdout is the JSON-RPC channel. Four environment
variables reach the HTTP path, none of them a secret: `PORT`, `HOST`, `MCP_ALLOWED_HOSTS`,
and `MCP_TRANSPORT`. **The allow-list is off unless set**; the same control in the removed
transport defaulted to off, which made it inert. **Cluster workers are still not there.**

**One held item on the transport change.** `content/rules/mcp-connector.md:105-112` still
documents the connector as `"type": "sse"` at `/sse`. That is published content, and a
change under `content/` is a release whose version does not move without the owner, so it
is raised and not performed. The corrected pages in `wiki/` and `AGENTS.md` therefore
**disagree with the set** until the owner releases it.

**Not deployed anywhere.** There is no Render service and nothing is routed. The
`src/http.js` listener is a capability, not a deployment — who runs it, on what address,
behind what, is the operator's decision. Consuming repositories reach this package through
`npx`, a local clone, `docker run -i`, or the HTTP endpoint of an instance someone deployed.

**A `Dockerfile` exists, and is not a deployment.** Single stage, `node:22-alpine`,
`npm ci --ignore-scripts --omit=dev`, `USER node`, entrypoint `node src/index.js`, now with
`EXPOSE 3000`. There is still no compose file: a compose file encodes a deployment, and
this repository has none. The image was **never built** — Docker is not installed in the
environment this was written in, so neither the `EXPOSE` nor the entrypoint override has
been verified by a build. `.dockerignore` excludes `node_modules`, `test`, `wiki`,
`.agents` and the markdown at the root, which means the image cannot run its own test
suite.

**Version.** `1.0.0`. Releases: `0.0.0` (initial set) through `0.14.0` (the security
creator, and `security/` made servable) are in `wiki/logs/`; `1.0.0` replaced the MCP
server with a read-only instruction set (#63), then restored the `version` and `author`
frontmatter fields on every served file (#64, #65).

**`master` is at `cf68380`** as of 2026-09-29. **Re-verify with `git fetch` rather than
trusting this SHA** — an earlier version of this file carried a SHA that went stale within
the hour, and a state file that is confidently wrong is worse than one that says nothing,
because the next session plans a branch point from it.

**Local install has a fixed layout.** A clone that runs this server locally belongs at
`./mcps/{org or owner}/{repo}/`, gitignored. It is a runtime, not a vendored set: the
instructions are still read through the connector, never by file path into the clone. A
committed `./mcps/` is vendoring. See `wiki/guides/install-as-local-mcp.md`.

**Every request has the same shape.** Task 1 is always the task record, task `n` is
always the release, and the work goes between them. Each task appends its own
`### Task k — {branch}` entry to `.agents/memory/tasks/{slug}.md` in the same commit as
its work, so `git log -p` on that file replays the request task by task.

**Tests.** 42, all passing, in two files. `server.test.js` (19) drives a real MCP client on
an in-memory transport; `http.test.js` (23) drives a real client against a real listening
process, because sockets do not reproduce in memory. A fresh checkout has no
`node_modules` and the suite then fails with `ERR_MODULE_NOT_FOUND` — run `npm install`
first, per `.agents/rules/repository.md`.

**Not built yet.**

* No CI — nothing runs `npm test` on push.
* No migration guide for repositories that already carry an older instruction set.
* No consuming repository has adopted the per-file tool surface yet. Each one has to
  replace its declaration block with the per-file table, and the tool names in an older
  block may not exist.
* `src/tools/instruction.js` is dead code — nothing imports it. It is the old
  path-taking tool, left on disk after #63. Deleting it needs the owner's `git rm`; it was
  not removed unilaterally.
* The `Dockerfile` has never been built. Docker was unavailable in the environment that
  wrote it, and the HTTP work has since added an `EXPOSE` and an entrypoint override that
  are equally unverified. It should be built once, both run forms checked, before anyone
  relies on it.
* The HTTP transport has never been run outside its own tests. Nothing is deployed, so
  there is no address, no ingress, and no evidence about how it behaves behind a proxy.

**Next obvious step.** Build the image once and check both run forms, and delete the dead
`instruction.js`.
