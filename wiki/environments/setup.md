# Local Setup

## Requirements

Node.js 20 or newer. There is no build step — the server is plain JavaScript.

## Install and test

```bash
npm install
npm test
```

The suite covers the content registry, the MCP surface over an in-memory transport, the
HTTP transport in both session modes, concurrent clients, session reaping, and the
manifest hashes.

## Run

```bash
# stdio — one client, for an editor or CLI
npm start

# streamable HTTP — the connector surface
npm run start:http

# HTTP with reload on change
npm run dev
```

Check it is up:

```bash
curl -s http://localhost:3000/readyz
# {"status":"ready","resources":25,"sessions":0}
```

## Inspect it

```bash
npm run inspect
```

This runs the MCP Inspector against the stdio server, listing every prompt and resource
and letting you read them.

## Content changes require a restart

The instruction set is read once at boot into a frozen registry, so editing anything
under `content/` has no effect until the process restarts. `npm run dev` handles that
for HTTP; restart manually for stdio.

Boot fails deliberately when a file under `content/` is missing `name` or `description`
frontmatter, or when two files share a `name`. Both would break routing or precedence
in every consuming repository, so they are startup errors rather than runtime
surprises.

## Related pages

- [Environment variables](env.md) — every configuration knob.
- [Docker](docker.md) — running it in a container.
- [Architecture](../information/architecture.md) — why it is built this way.
