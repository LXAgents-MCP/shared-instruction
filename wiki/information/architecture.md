# Architecture

Plain JavaScript (Node ESM), no build step. Three layers: content, server, transport.

```
content/                      the instruction set, as markdown files
src/
  index.js                    entry point — loads content, then starts a transport
  config.js                   environment parsing, frozen at import
  constants.js                fixed values shared by every session
  logger.js                   stderr-only structured logging
  version.js                  version resolved from package.json
  content/
    frontmatter.js            frontmatter reader and body normalizer
    registry.js               loads content once into a frozen registry
  server/
    create-server.js          builds one McpServer
    resources.js              publishes each instruction file
    manifest.js               builds and publishes agents://manifest.json
    prompts.js                the two prompts
  transport/
    stdio.js                  local, single client
    http.js                   streamable HTTP, stateless and stateful modes
    session-store.js          bounded, reaped session tracking
    cluster.js                multi-process workers
test/                         node:test suites
```

## Content is loaded once and frozen

`loadRegistry()` walks `content/`, parses each file's frontmatter, hashes its
normalized body, and returns a frozen structure. This happens once, at boot, before any
transport accepts a request.

That single decision is what makes concurrency safe. Sessions, requests, and worker
processes all read the same immutable object: no cache to invalidate, no lock to take,
no interleaving that can produce a torn read. A resource read is a map lookup with no
I/O, so a slow client cannot make other reads queue behind it.

The cost is that content changes require a restart. For a set that is versioned and
released, that is the right trade.

Boot fails — loudly — when a file is missing frontmatter or when two files share a
`name`. `name` is the override key, so an ambiguous one would break precedence in every
consuming repository.

## One server instance per client

`McpServer` holds per-connection state: request ids, progress tokens, the transport
itself. Sharing one instance across simultaneous clients is how responses get delivered
to the wrong connection, so `createServer()` builds a fresh instance per session (or
per request, in stateless mode). Instances are cheap; the expensive part is the
registry they all point at.

## Transports

**stdio** — one client, one process, for local use. Nothing may write to stdout there:
stdout *is* the JSON-RPC channel, so all logging goes to stderr unconditionally.

**Streamable HTTP** — the remote connector surface, in two modes:

| Mode | Behavior | Use it when |
|---|---|---|
| `stateless` (default) | Every POST gets its own transport and server, both discarded when the response ends. | Always, unless you need server-initiated messages. Any process can serve any request, so scaling needs no coordination. |
| `stateful` | Sessions are kept in a bounded, reaped store, keyed by `mcp-session-id`. | The client holds an SSE stream open. |

Stateful sessions are capped (`MCP_MAX_SESSIONS`) and reaped after an idle timeout
(`MCP_SESSION_TTL_MS`). At capacity the server answers `503` with `retry-after` rather
than accepting a session it cannot serve — an honest refusal lets a client retry or
fail over, where an accepted-but-starved session does not. A client that disconnects
without sending `DELETE` has its session reaped rather than leaked.

## Parallelism

Node runs one event loop per process. `MCP_WORKERS` forks that many processes sharing
the listening socket, giving real parallelism across cores. This composes with
stateless mode for free — no shared state means any worker can serve any request.

In stateful mode a session lives in the worker that created it, so run a single worker
or put a session-affinity load balancer in front.

## Shutdown

`SIGTERM`/`SIGINT` closes sessions first, then the HTTP server. The order matters:
closing the HTTP server waits for open connections, and an SSE stream never closes on
its own.

## Related pages

- [Overview](overview.md) — what this serves and why.
- [MCP surface](../reference/mcp-surface.md) — prompts and resources.
- [Environment variables](../environments/env.md) — every knob named above.
