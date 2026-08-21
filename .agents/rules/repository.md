---
name: repository-rules
description: Rules specific to LXAgents-MCP/shared-instruction — the dual producer/consumer role, the code conventions, and what must not be introduced.
---

# Repository Rules

Rules that are true of **this repository only**. Anything true of more than one
repository belongs in `content/` and is published — see
[`content-publishing.md`](content-publishing.md).

This file is a hub. It links out rather than restating, and it never repeats a rule
that `content/` already carries.

## This repository has two roles

| Role | Meaning |
|---|---|
| **Producer** | It holds the shared instruction set in `content/` and serves it over MCP as `lxagents-agents-base`. Editing `content/` changes behaviour in every consuming repository. |
| **Consumer** | It follows that same set, plus the local additions in `.agents/`. |

The two must not blur. `content/` is the product; `.agents/` is this repository's own
instruction set, exactly like any consuming repository's.

**When following the set here, `{shared}` resolves to `content/` in the working tree —
not to the deployed connector.** You are editing the set, so the working tree is the
authority; the deployed server is a snapshot that may be older than your branch.

## What lives where

| Path | Holds | Published? |
|---|---|---|
| `content/` | The shared instruction set. | **Yes** — served as `agents://` resources. |
| `.agents/` | This repository's own rules, indexes, agent wiki, memory. | No. |
| `wiki/` | This repository's human documentation. | No. |
| `src/`, `test/` | The server and CLI implementation and its tests. | No. |

Never put a repository-specific rule in `content/`, and never put a universal
convention in `.agents/`. The routing question is the one in
[`content/rules/directories.md`](../../content/rules/directories.md): *is this true for
more than this repository?*

## Stack and commands

Plain JavaScript, Node ESM, Node >= 20. **There is no build step** — do not add one, and
do not introduce TypeScript, a bundler, or a transpiler without agreement.

| Task | Command |
|---|---|
| Install | `npm install` |
| Test | `npm test` |
| Run locally (stdio) | `npm start` |
| Run the connector surface | `npm run start:http` |
| Run the CLI | `npm run cli -- <command>` |
| Inspect the MCP surface | `npm run inspect` |
| Container | `docker compose up --build` |

Full orientation: [`../wiki/context/repository-map.md`](../wiki/context/repository-map.md).

## Code conventions the codebase already follows

* **ESM only.** `import`/`export`, `.js` extensions in relative specifiers, no `require`.
* **Nothing writes to stdout except the CLI.** On the stdio transport stdout is the
  JSON-RPC channel, so all logging goes through `src/logger.js` to stderr. The one
  exception is CLI output, which is the CLI's whole product and is safe because `serve`
  prints nothing itself — it must go through `src/cli/output.js`. A `console.log`
  anywhere in `src/` is still a bug.
* **The registry is frozen and shared.** Never mutate a registry entry, and never add a
  per-request cache keyed on shared state — that is what makes concurrent clients safe.
* **One `McpServer` per session.** Never hoist a server instance to module scope.
* **Fail at boot, not at first call.** Content problems — missing frontmatter, a
  duplicate `name` — are startup errors by design. Keep them that way.
* **Comments explain why, not what.**

## Testing

Every behavioural change ships with a test in `test/`, using `node:test` and
`node:assert/strict`. The suite must pass before any commit.

Prefer a test that pins an invariant over one that pins a string: the useful tests here
are the ones asserting that all three surfaces — prompts, tools, and the CLI — return
identical text, that manifest hashes reproduce from the served file, and that concurrent
sessions do not cross.

## What must not be introduced

* A build step, or any compiled output committed to the repository.
* A dependency added to serve one call site. The runtime dependencies are the MCP SDK,
  express, and zod; adding a fourth needs a reason in
  `.agents/memory/decisions/`.
* Filesystem or network I/O on the resource-read path. Reads are in-memory lookups, and
  keeping them that way is why a slow client cannot block others.
* A third documentation tree. `wiki/` and `.agents/wiki/` are the only two.
* Anything under `content/` that is not part of the published set.

## Deployment

Deployed on Render from `master`, serving streamable HTTP. The connector URL **must**
include the `/mcp` path — see
[`content/rules/mcp-connector.md`](../../content/rules/mcp-connector.md). The free tier
spins down when idle, so the first request after a pause takes 50+ seconds; that is
expected, not a fault.
