# Architecture

Plain JavaScript (Node ESM), no build step. Two dependencies: the MCP SDK, and `express`
for the HTTP transport. The whole server is seven files.

```
content/                      the instruction set — 31 markdown files
src/
  index.js                    entry — stdio transport, what a client spawns
  http.js                     entry — HTTP/SSE transport, for running as a service
  server.js                   builds the McpServer and registers the tool surface
  version.js                  ROOT, CONTENT_DIR, VERSION, SERVER_NAME
  content.js                  readSetFile — the one path-taking read, and its guard
  tools/
    from-content.js           generates one tool per file in content/
    mcp-list.js               the one hand-written tool
test/
  server.test.js              19 tests over a real client on an in-memory transport
  http.test.js                11 tests over a real client against a real listening process
```

## The tool surface is generated, not declared

`buildContentTools()` in `src/tools/from-content.js` walks `content/` at import, and for
each `.md` file produces a tool whose name is derived from its filename, whose description
is that file's frontmatter `description`, and whose handler returns the file's text.

There is no list to keep in step with the set. `src/server.js` spreads the result into
`TOOL_MODULES` and registers each one, so **adding a file to `content/` adds its tool** and
nothing else has to change. That is the reason this design replaced the previous one, which
carried a hand-maintained table in `src/constants.js` alongside a matching prose block in
`src/server/tools.js` — two lists that had to agree, and a boot-time throw when they did not.

## Content is read once, at boot

Every file is read into a `Map` when the process starts, keyed by tool name. A tool call is
then a map lookup: no filesystem I/O on the read path, and no work a slow client can make
another client wait behind.

The cost is that content changes need a restart. For a set that is versioned and released,
that is the right trade — and a change to `content/` is never served half-applied.

Reading everything up front also means a malformed set is caught at **startup** rather than
by the first caller that happened to need the broken file. Boot throws on a name that is not
a valid MCP identifier, on two files deriving the same name, on a file with no frontmatter
`description`, and on an empty set.

## One server instance per connection

`createServer()` builds a fresh `McpServer` per call. `McpServer` holds per-connection
state — request ids, progress tokens, the transport — and sharing one instance across
concurrent clients is how responses get delivered to the wrong connection. Instances are
cheap; what they share is the already-loaded map.

## Two transports

`src/index.js` connects `StdioServerTransport`. `src/http.js` connects
`SSEServerTransport` and binds a port. Both call the same `createServer()`, so the surface
they expose is identical by construction rather than by discipline — a change to the tool
set cannot reach one transport and miss the other.

The HTTP path adds a session store, because SSE is stateful: `GET /sse` mints a session and
holds it open, and the transport tells the client to POST to `/message` with that session
id. The store is a `Map` keyed by connection and deleted on close, so it is bounded by
live connections rather than by total requests.

There is still no worker pool and no clustering. Neither transport needs one at this size,
and a shared `McpServer` across connections is the thing to avoid — see *One server
instance per connection* above, which the HTTP transport turns from a nicety into the
invariant that keeps concurrent sessions from cross-talking.

## The one path-taking read

`src/content.js` exports `readSetFile(relativePath)`, which is the only function here that
takes caller-influenced input. It is reached by exactly one caller — `mcp_list`, with the
constant `index/server-registry.md` — and it is not the primary guard against anything.

The primary guard is structural: **no tool takes a path**, so a caller has nothing to
traverse with. `isSafeRelativePath` remains because it is correct and because a function
that reads a path from its caller should not be able to escape its directory if that
function is reused. It runs *before* any filesystem call, not after — a path that reaches
`fs` with a `..` in it has already been resolved against the process working directory, and
a check that runs afterwards is a check against a value the caller already influenced.

## Shutdown

The stdio transport has no open connections to drain, so `SIGINT` closes the server and
exits `0` with nothing to order.

The HTTP transport does have live connections, and the ordering is not optional: close the
listener first so nothing new arrives, then close each session so its peer sees a clean end
rather than a dropped socket. A removed implementation had the same drain-before-close
ordering — see [`wiki/logs/0/0/0/CHANGELOG.md`](../logs/0/0/0/CHANGELOG.md).

## Related pages

- [Overview](overview.md) — what this serves and why.
- [MCP surface](../reference/mcp-surface.md) — the tool surface, and what is not exposed.
- [Environment variables](../environments/env.md) — the three the HTTP transport reads.
