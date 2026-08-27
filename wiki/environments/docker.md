# Docker

## Build and run

```bash
docker build -t lxagents-mcp/shared-instruction:0.0.0 .
docker run --rm --init -p 3000:3000 lxagents-mcp/shared-instruction:0.0.0
```

Or with compose:

```bash
docker compose up --build
```

Then:

```bash
curl -s http://localhost:3000/readyz
```

## What the image contains

Two stages. The first installs production dependencies (`npm ci --omit=dev
--ignore-scripts`, so no dependency's install hook runs as root at build time); the
second copies `node_modules`, `src/`, `content/`, `package.json`, and `LICENSE`. Tests,
wiki, and git metadata are excluded by `.dockerignore`.

Manifests are copied before source, so editing code does not invalidate the dependency
layer.

## Defaults baked in

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MCP_TRANSPORT` | `http` |
| `MCP_HOST` | `0.0.0.0` |
| `PORT` | `3000` |
| `MCP_PATH` | `/mcp` |
| `MCP_SESSION_MODE` | `stateless` |
| `MCP_WORKERS` | `auto` |

Override any of them with `-e` or the compose `environment` block. See
[environment variables](env.md).

## No init inside the image

The runtime stage installs no packages, so the image builds on a machine with no route
to the distro mirrors. Node is PID 1 and handles `SIGTERM` itself, and it reaps its own
cluster workers. Where a reaper is wanted anyway, run with `--init`; `compose.yaml` sets
`init: true`.

## Non-root, read-only

The container runs as the unprivileged `node` user (uid 1000). Nothing is written to
disk at runtime — the instruction set is read once at boot — so `compose.yaml` mounts
the root filesystem read-only with `/tmp` as tmpfs, and sets `no-new-privileges`.

## Healthcheck

Gated on `/readyz`, not `/healthz`: the process is useless until the instruction set has
loaded, and readiness is the condition an orchestrator should route traffic on.

```
--interval=30s --timeout=3s --start-period=10s --retries=3
```

## Scaling

Stateless mode means any replica can serve any request, so scale horizontally with no
coordination:

```bash
docker compose up --scale agents-base=4
```

With `MCP_SESSION_MODE=stateful` a session lives in one process — use a single replica
and a single worker, or a session-affinity load balancer.

## Related pages

- [Environment variables](env.md)
- [Local setup](setup.md)
- [Architecture](../information/architecture.md)
