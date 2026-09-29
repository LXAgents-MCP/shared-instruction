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

**Structure.** `content/` holds 31 published instruction files. `.agents/rules/` holds
three local rules: `repository.md`, `content-publishing.md`, and `set-mirrors.md`. `wiki/`
holds human documentation. `src/` is six files and `test/` is one.

**Surface — one tool per file.** 32 tools: 31 generated from `content/`, one per file,
plus `mcp_list`. The name is derived from the path (folder stripped, `.md` dropped, kebab →
snake), with one override: `AGENTS.md` → `agents_entry_point`. The description is the
file's own frontmatter `description`, verbatim. **No tool takes an argument.**

That is a change from `1.0.0`, where six hand-named convention tools replaced the
single 31,000-character `agents_auto_activation` call. The four mandatory ones are still
`task_workflow`, `branching_strategy`, `commit_conventions`, and `discovery_protocol`, but
they are no longer a fixed set: there are 31 files, and a repository declares in its own
`AGENTS.md` which of them it uses.

`mcp_list` is the one hand-written tool, and the only one that reaches `readSetFile` in
`src/content.js` — with a constant path. Because no tool takes a `path`, there is nothing
for a caller to traverse with; the zero-argument design is the replacement for the old
traversal check, not a weaker version of it.

**Transports.** stdio only. `src/index.js` connects a stdio transport and handles
`SIGINT`. The streamable-HTTP transport, session store, and cluster workers were removed
in #63.

**Not deployed anywhere.** There is no Render service, no listener, and no port. The
previous version of this file named a Render hostname and warned that it was unverified;
that deployment is gone with the transport it served. Consuming repositories reach this
package through `npx`, a local clone, or `docker run -i`.

**A `Dockerfile` exists, and is not a deployment.** Single stage, `node:22-alpine`,
`npm ci --ignore-scripts --omit=dev`, `USER node`, entrypoint `node src/index.js`. No
`EXPOSE` and no compose file, both deliberate: stdio is a pipe, not a port. The image was
**never built** — Docker is not installed in the environment this was written in, so
whether it builds is unverified. `.dockerignore` excludes `node_modules`, `test`, `wiki`,
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

**Tests.** 19, all passing, in one file. A fresh checkout has no `node_modules` and the
file then fails with `ERR_MODULE_NOT_FOUND` — run `npm install` first, per
`.agents/rules/repository.md`.

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
  wrote it. It should be built once and the entrypoint checked before anyone relies on it.

**Next obvious step.** Build the image once to confirm the entrypoint, and delete the
dead `instruction.js`.
