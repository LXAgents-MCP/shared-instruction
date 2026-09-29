# Docker

**There is no container image.** This repository has no `Dockerfile` and no
`compose.yaml`, so the `docker build` and `docker compose up` this page used to document
could not work.

A leftover `.dockerignore` remains at the repository root. It is inert on its own, but it
is also the only trace of a build setup that no longer exists, and both it and this page
are candidates for deletion.

## Why there is no image

The server is an **MCP stdio server**. A client spawns it as a subprocess and speaks
JSON-RPC over its stdin and stdout. A container is a poor fit for that shape:

- stdio is a pipe between two processes, and a container is a boundary between machines.
  Putting a pipe behind a port mapping is not a translation, it is a second mechanism.
- There is nothing to expose. No HTTP port, no health endpoint, no session to hold open.
- The payload is a directory of markdown files and a few kilobytes of JavaScript. An image
  would be larger than the source it copies.

If this set ever needs to be served remotely, the right change is a transport in
`src/index.js` — and the reason there is no image is that no such transport exists.

## Related pages

- [Local setup](setup.md) — how the server is actually run.
- [Architecture](../information/architecture.md) — the one transport it has.
