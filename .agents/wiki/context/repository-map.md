---
name: agent-wiki-context-repository-map
description: Orientation before touching this repository — what lives where, the commands, the entry points, and the gotchas that actually bite.
---

# Repository Map

Read this before changing anything here. Underlying facts live in `wiki/`; this page is
the agent-facing orientation and links out rather than restating.

## What this repository is

`LXAgents-MCP/shared-instruction` — an MCP server that serves the LXAgents shared agent
instruction set as `lxagents-agents-base`. Plain JavaScript, Node ESM, no build step.

It is both the **producer** of the shared set and a **consumer** of it. See
[`../../rules/repository.md`](../../rules/repository.md).

## What lives where

| Path | Contents | Touch it when |
|---|---|---|
| `content/` | The published instruction set — 31 markdown files, each served as its own tool. | You are changing a convention every repository follows. **This is a release.** |
| `.agents/` | This repository's own rules, indexes, agent wiki, memory. | You are changing something true only here. |
| `wiki/` | Human documentation, plus `wiki/logs/` release history. | A person needs to read it. |
| `src/tools/` | `from-content.js` builds the generated surface; `mcp-list.js` is the one hand-written tool. | Adding or changing a tool. |
| `src/server.js` | Builds one `McpServer` and registers every tool; carries the `instructions` text. | Changing the MCP surface. |
| `src/content.js` | The set root, the frontmatter reader, and `readSetFile` with its path check. | Changing how content is located or read. |
| `src/version.js` | `ROOT`, `CONTENT_DIR`, `VERSION`, `SERVER_NAME`. | Renaming the server or moving the set. |
| `test/` | `server.test.js` — the whole suite. | Always. Every behavioural change ships with one. |

There is no `src/server/`, no `src/cli/`, no `src/transport/`, and no `src/content/`
directory. If a file you are about to edit is under one of those paths, it does not exist
here.

## Entry points

There is **one**:

* `src/index.js` — what an MCP client spawns. Connects a stdio transport, handles
  `SIGINT`, and nothing else. It is the only transport.

Behind it:

* `src/tools/from-content.js` — walks `content/` at import, derives a tool name and
  description per file, and reads each file once into a frozen `Map`. This is the boot-time
  validation gate, and the only module that touches every file in the set.
* `src/server.js` — `TOOL_MODULES`, the array every registered tool comes from. Add a
  module here and its tools appear; nothing else registers anything.
* `src/content.js` — `readSetFile`, reached by exactly one caller with a constant path.

## Commands

```bash
npm install
npm test                 # node:test — one file, 19 tests
npm start                # stdio
npm run inspect          # MCP Inspector against the stdio server
```

`npm start` and `npm run start:stdio` are the same thing. There is no HTTP server, no
watch mode, no CLI, and no container.

## Gotchas that actually bite

* **`content/` is published.** Adding a file there ships it to every consuming
  repository on the next boot as a new tool. See
  [`../../rules/content-publishing.md`](../../rules/content-publishing.md).
* **Content changes need a restart.** The map is frozen at boot; editing markdown does
  nothing to a running process.
* **Three files outside `content/` copy its text.** The root `AGENTS.md`,
  `content/prompts/agents-setup.md`, and the `instructions` string in `src/server.js` all
  reproduce set text and go stale silently. Grep for a sentence you changed before
  committing — see [`../../rules/set-mirrors.md`](../../rules/set-mirrors.md).
* **Never write to stdout.** stdout is the JSON-RPC channel. There is no logger module
  and no exception to the rule, because there is no CLI. A `console.log` anywhere in
  `src/` is a bug that corrupts the protocol stream.
* **Never share an `McpServer` between connections.** It holds per-connection state;
  reusing one delivers responses to the wrong connection. `createServer()` builds a fresh
  one every time.
* **No tool declares an input schema, and none should.** An object schema that rejects
  `undefined` breaks clients that omit `arguments` — which is why these tools declare
  none. Do not "tidy" a schema in; if a tool needs an argument, that is a design decision
  to make deliberately, not a cleanup.
* **A file rename is a breaking change, not a rename.** The tool name is derived from the
  filename, so renaming removes a tool a consumer's `AGENTS.md` may name.
* **Two files with the same basename collide.** The folder is stripped from the name, so
  the boot throws rather than letting one shadow the other. Resolve it with an entry in
  `NAME_OVERRIDES`, not by renaming a file.
* **`src/tools/instruction.js` is dead.** Nothing imports it. It is the old
  path-taking tool, left on disk after #63; see the note in the repository's state.

## Generated and vendored paths

`node_modules/` only. Nothing is generated into the tree, and there is no `dist/` —
if you find yourself adding one, stop and re-read
[`../../rules/repository.md`](../../rules/repository.md).

A leftover `.dockerignore` sits at the root. It is inert; there is no `Dockerfile` and no
compose file. Both it and `wiki/environments/docker.md` are deletion candidates that
have not been removed.

## Where the shared set resolves from

`content/`, in the working tree — not the deployed connector. You are editing the set,
so the working tree is the authority.

## Further reading

* [`../../../wiki/information/architecture.md`](../../../wiki/information/architecture.md) — how the server is built and why.
* [`../../../wiki/reference/mcp-surface.md`](../../../wiki/reference/mcp-surface.md) — the tool surface, and what it deliberately does not expose.
* [`../../../wiki/environments/env.md`](../../../wiki/environments/env.md) — configuration.
* [`../security/security-boundaries.md`](../security/security-boundaries.md) — the security SOP, and the rule against carrying a security context between repositories.
