# Docker

The server runs in a container. There is no registry, no service, and no port — this
is a stdio server, and a container is a way to run it with a pinned toolchain rather
than a network endpoint.

## What a container is for here

A client spawns this server as a subprocess and speaks JSON-RPC over its stdin and
stdout. In a container that pipe is still the whole interface. What the image buys:

* **A pinned toolchain.** `node:22-alpine` instead of whatever is on the host.
* **A clean dependency tree.** `npm ci --ignore-scripts --omit=dev` from the lockfile.
  `npm ci` fails rather than resolving something the lockfile does not contain.
* **A non-root process.** The image ends as `USER node`.
* **Isolation from the host**, which matters if the client is on a different machine.

What it does not buy: a listener. There is no HTTP transport in this package, so
`EXPOSE` would be a lie and is deliberately absent.

## Build

```bash
docker build -t lxagents-shared-instruction:2.0.0 .
```

Tag it with the version in `package.json` rather than `latest`. The image's job is to
be reproducible, and `latest` is the one tag that cannot be.

## Run

stdio means the container's stdin has to stay open and attached:

```bash
docker run --rm -i lxagents-shared-instruction:2.0.0
```

**`-i` is not optional.** Without it Docker does not attach stdin, the server sees
closed input, and it exits immediately — which reads as a broken image rather than a
missing flag. There is no `-p`, and adding one would do nothing: there is no port
listening.

To point an MCP client at it, give it the same command with the container attached:

```json
{
  "mcpServers": {
    "lxagents-shared-instruction": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "lxagents-shared-instruction:2.0.0"]
    }
  }
}
```

Most clients do not attach a persistent stdin to a spawned process, so this form
works only where the client does. The npx and local-clone forms in
[Connect a repository](../guides/connect-a-repository.md) are the ones that work
everywhere; the container is for a host that cannot run Node 20.

## What is in the image

| Path | Why |
|---|---|
| `content/` | The product. Copied, not generated — the only thing a repository change is expected to alter. |
| `src/` | The server. |
| `package.json`, `package-lock.json` | Dependency resolution only. |

`.dockerignore` keeps the rest out: `node_modules`, `test`, `wiki`, `.agents`,
`AGENTS.md`, `README.md`, `.git`, and local noise. **The image therefore cannot run
its own test suite** — `npm test` needs `test/`, and the suite is a gate on the
repository, not on the artifact.

## There is no compose file, deliberately

A `compose.yaml` for a stdio server is a footgun: it invites `docker compose up` and
a healthcheck against a port that does not exist, both of which fail in ways that
look like a broken image. The image takes one command and one flag. If a future
change adds a real transport, a compose file becomes worth writing — and the reason
to write one then is that there is something to route to.

## Verifying an image

```bash
docker run --rm -i lxagents-shared-instruction:2.0.0 < ../dev/null
```

With stdin closed the server exits at once, so this checks that the entrypoint
resolves and Node starts — not that the set is correct. To check the set, run
`npm test` in a checkout.

## Related pages

- [Local setup](setup.md) — running the server without a container.
- [Architecture](../information/architecture.md) — the one transport it has.
- [Security model](../security/security-model.md) — what a container does and does
  not change about exposure.
