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
| `content/` | The published instruction set — 26 markdown files served as `agents://` resources. | You are changing a convention every repository follows. **This is a release.** |
| `.agents/` | This repository's own rules, indexes, agent wiki, memory. | You are changing something true only here. |
| `wiki/` | Human documentation, plus `wiki/logs/` release history. | A person needs to read it. |
| `src/content/` | Registry and frontmatter parsing — loads `content/` once at boot. | Changing how content is loaded, validated, or hashed. |
| `src/server/` | `create-server.js`, `resources.js`, `prompts.js`, `tools.js`, `manifest.js`, `payloads.js`, `run.js`. | Changing the MCP surface or the boot sequence. |
| `src/cli/` | `index.js`, `run.js`, `commands.js`, `output.js` — the CLI half of the dual-purpose build. | Changing what a person sees at a terminal. |
| `src/tools/` | Tools that act on repositories rather than on content — `mcp-repos.js`. Surfaced through both MCP and the CLI. | Adding or changing a repository-level tool. |
| `src/transport/` | `stdio.js`, `http.js`, `session-store.js`, `cluster.js`. | Changing how clients connect or how concurrency works. |
| `test/` | `node:test` suites — registry, server, http, manifest, tools, cli. | Always. Every behavioural change ships with one. |

## Entry points

* `src/index.js` — process entry. Loads content, then starts stdio or HTTP.
* `src/server/create-server.js` — builds one `McpServer`; the single place every
  prompt, resource, and tool is registered.
* `src/content/registry.js` — `loadRegistry()`, the boot-time validation gate.
* `src/server/payloads.js` — the procedure text shared by prompts and tools.

## Commands

```bash
npm install
npm test                 # node:test, all suites
npm start                # stdio
npm run start:http       # streamable HTTP on :3000
npm run dev              # HTTP with restart on change
npm run inspect          # MCP Inspector against the stdio server
docker compose up --build
```

## Gotchas that actually bite

* **`content/` is published.** Adding a file there ships it to every consuming
  repository on the next boot. See
  [`../../rules/content-publishing.md`](../../rules/content-publishing.md).
* **Content changes need a restart.** The registry is frozen at boot; editing markdown
  does nothing to a running process.
* **Never write to stdout.** stdout is the JSON-RPC channel on stdio. Use
  `src/logger.js`, which writes to stderr.
* **Never share an `McpServer` between clients.** It holds per-connection state;
  reusing one delivers responses to the wrong connection.
* **Prompts and tools must stay identical.** Both read `payloads.js`; tests assert the
  outputs match byte for byte.
* **Declaring optional-only argument schemas breaks callers.** The SDK validates
  arguments against an object schema that rejects `undefined`, and the spec lets clients
  omit `arguments`. The two zero-argument tools and both prompts declare no schema for
  this reason — do not "tidy" one in.
* **The connector URL needs the `/mcp` path.** Without it the handshake fails and
  clients report a sign-in error, which sends you debugging the wrong thing.

## Generated and vendored paths

`node_modules/` only. Nothing is generated into the tree, and there is no `dist/` —
if you find yourself adding one, stop and re-read
[`../../rules/repository.md`](../../rules/repository.md).

## Where the shared set resolves from

`content/`, in the working tree — not the deployed connector. You are editing the set,
so the working tree is the authority.

## Further reading

* [`../../../wiki/information/architecture.md`](../../../wiki/information/architecture.md) — how the server is built and why.
* [`../../../wiki/reference/mcp-surface.md`](../../../wiki/reference/mcp-surface.md) — every prompt, resource, tool, and endpoint.
* [`../../../wiki/environments/env.md`](../../../wiki/environments/env.md) — configuration.
