# Environment Variables

All are optional. Parsing happens once at import and the result is frozen — nothing
rewrites configuration at runtime. An invalid value fails startup rather than being
silently ignored.

## Transport

| Variable | Default | Meaning |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | `stdio` for local use, `http` for the connector surface. Aliases: `local`, `remote`, `streamable-http`. |
| `MCP_HOST` | `0.0.0.0` | Interface to bind. HTTP only. |
| `PORT` | `3000` | Port to bind. HTTP only. |
| `MCP_PATH` | `/mcp` | Path the MCP endpoint is served from. |

## Sessions and concurrency

| Variable | Default | Meaning |
|---|---|---|
| `MCP_SESSION_MODE` | `stateless` | `stateless` builds a transport and server per request; `stateful` keeps sessions keyed by `mcp-session-id`. |
| `MCP_SESSION_TTL_MS` | `1800000` (30 min) | How long an idle stateful session lives before it is reaped. |
| `MCP_MAX_SESSIONS` | `1000` | Cap on concurrent stateful sessions. At the cap the server answers `503` with `retry-after`. |
| `MCP_WORKERS` | `1` | Cluster workers. `auto` forks one per available core. HTTP only. |

Use `stateless` unless a client needs server-initiated messages over SSE. It has no
shared state, so any worker or replica can serve any request.

With `MCP_SESSION_MODE=stateful`, a session lives in the worker that created it — run
`MCP_WORKERS=1` or put a session-affinity load balancer in front.

## Security

| Variable | Default | Meaning |
|---|---|---|
| `MCP_DNS_REBINDING_PROTECTION` | `false` | Enables origin and host checking. |
| `MCP_ALLOWED_ORIGINS` | *(empty)* | Comma-separated allowed `Origin` values. Empty means no restriction. |
| `MCP_ALLOWED_HOSTS` | *(empty)* | Comma-separated allowed `Host` values. Empty means no restriction. |

Off by default: the server publishes public instruction text and is usually run behind
a proxy that already terminates origin checks. Turn it on when exposing the port
directly.

## Content and logging

| Variable | Default | Meaning |
|---|---|---|
| `MCP_CONTENT_DIR` | `content/` beside the package | Override the instruction set root. |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, or `debug`. |

Logs are JSON, one object per line, written to **stderr only** — on stdio, stdout is
the JSON-RPC channel.

## Examples

```bash
# Local development over stdio
MCP_TRANSPORT=stdio node src/index.js

# Remote connector, one worker per core
MCP_TRANSPORT=http MCP_WORKERS=auto PORT=3000 node src/index.js

# Stateful sessions, single worker, exposed directly
MCP_TRANSPORT=http \
  MCP_SESSION_MODE=stateful \
  MCP_WORKERS=1 \
  MCP_DNS_REBINDING_PROTECTION=true \
  MCP_ALLOWED_ORIGINS=https://claude.ai \
  node src/index.js
```
