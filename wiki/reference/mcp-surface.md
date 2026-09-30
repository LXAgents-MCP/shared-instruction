# MCP Surface

Everything `lxagents-shared-instruction` exposes.

**It exposes tools, and nothing else.** 31 of them: 30 generated — one per markdown file
in `content/` — plus `mcp_list`, which is hand-written. There are no prompts and no
resources. It is reachable over two transports, and they expose the same tools. See
[What this server does not expose](#what-this-server-does-not-expose).

## Server identity

| Field | Value |
|---|---|
| `name` | `lxagents-shared-instruction` |
| `version` | from `package.json`, read at import by `src/version.js` |
| transport | stdio (`src/index.js`) or stateless HTTP (`src/http.js`, `POST /mcp`) |

Every entry point calls the same `createServer()`, so the surface is identical by
construction. A test asserts the two agree, tool for tool and byte for byte on a call.

`initialize` also returns `instructions`, which names real tools, points a first-time
caller at `root_index` or `agents_entry_point` rather than at everything, and says plainly
that nothing is to be called at session start.

## The generated tools

30 tools, one per `.md` file under `content/`. Nothing registers them by hand.

### Naming

A tool is named after its own filename:

- the folder is dropped — `git/branching-strategy.md` is `branching_strategy`
- `.md` is dropped
- the name is lowercased and kebab becomes snake
- one override: `AGENTS.md` is `agents_entry_point`, because `agents` says nothing about
  which document it is

Dropping the folder is what keeps the short names short. The cost is that two folders
holding the same filename would collide — and a collision **throws at boot** rather than
letting the second file silently shadow the first. Two files named `index.md` in different
folders is the case that would do it.

### Descriptions

A tool's description is that file's own frontmatter `description`, verbatim. That field
already exists to let a caller route without opening the body, which is exactly a tool
description's job.

A file with no frontmatter `description` **fails the process at startup**. It would publish
as a tool no client can route on, and a missing description is invisible until someone
tries to use it.

### Payloads

Each tool returns its file whole — frontmatter included, byte-identical to what is on
disk. The frontmatter is part of the published text, not metadata to strip.

### Arguments

**None. No tool takes an argument.**

This is the load-bearing property of the surface, so it is asserted rather than
described: `test/server.test.js` checks that every tool's `inputSchema` has empty
`properties` and empty `required`.

It is worth being precise about what that replaced. The surface used to be one tool taking
a `path` string, and path traversal is a real concern for that design — which is why
`src/content.js` exists and why its `isSafeRelativePath` check runs *before* any
filesystem call rather than after. With no path argument there is no traversal to defend
against, so the absence of the argument **is** the defence, and a `..` is not a malformed
request but an unnameable one. `src/content.js` is now reached only by `mcp_list`, with a
constant path, and its check remains correct.

### Failure at boot

`buildContentTools()` throws, failing the process, when:

| Condition | Why it is fatal rather than a warning |
|---|---|
| A derived name is not `[a-z][a-z0-9_]{0,63}` | It is not a usable MCP tool name. Add it to `NAME_OVERRIDES`. |
| Two files derive the same name | One would silently shadow the other. |
| A file has no frontmatter `description` | It would publish as an unroutable tool. |
| The set is empty | The server would expose nothing. |

A malformed set fails at startup rather than returning a wrong answer to the first caller
that needed the file.

## The hand-written tool

### `mcp_list`

Serves `index/server-registry.md`: the sibling instruction and security servers, each with
its scope and clone URL.

It is hand-written rather than generated, and it deliberately **does not list this
server** — a registry listing the server you are already connected to invites a repository
to clone and vendor the set it is reading, which is the exact drift the connector exists
to prevent. A test asserts both halves of that: the registry does not name
`LXAgents-MCP/shared-instruction`, and it does say why.

## The bijection

Every file has exactly one tool, and every tool serves exactly one file. The test suite
asserts **both directions**, because each catches a different mistake:

- **files → tools** catches a file that was added and never surfaced
- **tools → files** catches a tool serving something no longer in the set

Together they make "add a file, get a tool" a property rather than a hope. A second test
asserts that the total characters served across all generated tools equals the total bytes
of the files on disk, so nothing can be served short.

## What this server does not expose

This is the more useful half of the page, because previous versions of this file
documented all of the following as if it were shipped. None of it is.

| Not exposed | Notes |
|---|---|
| **Prompts** | `agents-setup`, `agents-update` and the duplicate audit are **files**, served as the tools `agents_setup`, `agents_update` and `duplicate_instruction_audit`. |
| **Resources** | There is no `agents://` URI scheme to fetch and no `manifest.json`. `agents://` survives in the instruction set as the *prose notation* its links use, not as a fetchable endpoint. |
| **A CLI** | `package.json` declares one bin, `lxagents-shared-instruction`, which is the server. There is no `lxagents-agents`, no `list`/`read`/`setup`/`audit` subcommands, and no `npm run cli`. |
| **A writer** | Every tool is read-only. The tools that would write the set are not registered rather than disabled, so pointing a repository at this server cannot mutate it. A test asserts that no tool accepts a write verb or a credential. |
| **A registry of tools** | `src/constants.js`, `src/server/` and `src/cli.js` were removed. The surface is built by `src/tools/from-content.js` and the array in `src/server.js`. |
| **Health and readiness endpoints** | `GET /healthz`, and nothing else. **This row previously read the opposite** — "No `/healthz`, no `/readyz`… a probe endpoint on a server that serves only public markdown is a route that exists to be scanned" — and the objection was met with consistency rather than refuted. The four sibling servers already serve `/healthz`, and a deployment that has to treat one of five identically shaped servers differently is one this repository declined to pay for. What answers is `{ status, server, version }` and nothing derived from the set, before any body is read, so the route is not a window onto the content. |
| **Authentication** | Neither transport has any, and adding it would not make the content less public — it is on npm. See the [security model](../security/security-model.md). |

**What the HTTP transport does expose** is the same 31 tools, at `POST /mcp`, plus
`GET /healthz`. It is **stateless**: every request carries everything it needs, no session
id is minted, and there is no session store to bound. Any other method on `/mcp` is a 405
that says so, and any other path is a JSON-RPC 404.

The previous transport was a deprecated SSE one that held a session per open stream, and
it is gone. `SSEServerTransport` is deprecated in the SDK in favour of
`StreamableHTTPServerTransport`, and moving off it is breaking for every deployed client —
see the task record under [`.agents/memory/tasks/`](../../.agents/memory/tasks/).

The full tool list is whatever the client enumerates from `tools/list`; it is never written
down here, because a hand-maintained copy of a generated list is a copy that goes stale.

## Cost

The set is loaded once, so a session pays for the files whose triggers actually fire.
Calling every tool reproduces the oversized payload this design replaced, one call at a
time — and there are more than thirty of them, so that is a real cost rather than a
hypothetical one. `src/server.js`'s `instructions` string says so at `initialize`, and
`content/rules/auto-activation.md` says it again as a rule.

## Tests

`test/server.test.js` is 19 tests over a real MCP client on an in-memory transport, not a
mock. It covers the frontmatter contract, the shared creator procedure, the bijection both
ways, name derivation, uniqueness and descriptions, the zero-argument claim, byte-for-byte
fidelity, total-served equality, reachability, index routing, `mcp_list` in isolation, and
the read-only claim.

`test/http.test.js` is 23 more, over a real client against a real listening process rather
than an in-memory transport, because the things that can go wrong on the HTTP path are
about sockets and do not reproduce in memory. It asserts the two transports expose the same
tools and return byte-identical payloads, that concurrent requests do not cross-talk, that
`/healthz` answers, that any other method on `/mcp` is a 405 and any other path a 404, that
the routes the SSE transport used are **gone** rather than assumed to be, that the drain
reports in-flight requests and not sessions, that nothing is written to stdout, and that a
`Host` header outside `MCP_ALLOWED_HOSTS` is actually rejected — over `node:http`, because
`fetch` cannot set the header and would test nothing.

There is no `test/tools.test.js` and no `test/logs.test.js`. Those covered the six-tool
convention surface and the changelog delta parser, both of which were removed.
