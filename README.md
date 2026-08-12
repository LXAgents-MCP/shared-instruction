# mcp-server

The MCP server that delivers the **LXAgents shared agent instruction set**. A
repository connects it as a connector and reads the conventions it needs — branching,
commits, pull requests, task workflow, the creators, the directory architecture —
instead of cloning or vendoring a copy of them.

- **Server id:** `lxagents-agents-base`
- **Package:** `@lxagents/agents-base`
- **Surface:** MCP prompts and resources. No tools.

## Key features

- **`agents-setup` prompt** — the full setup procedure that builds a repository's
  `AGENTS.md`, `.agents/` tree, wiki, and memory.
- **`check-duplicate-agents-instruction` prompt** — finds instructions a repository
  duplicates from the shared set and removes them. Runs **only when asked**.
- **24 instruction resources** under `agents://`, plus `agents://manifest.json`
  listing every file with a content hash — one read instead of walking the set.
- **Many clients at once.** Content is loaded once into a frozen registry; each
  request or session gets its own server instance, so nothing is shared and any
  process can serve any request.

## Quick start

```bash
npm install
npm test

# Local, over stdio
npm start

# Remote connector surface, over streamable HTTP
npm run start:http     # http://localhost:3000/mcp
```

With Docker:

```bash
docker compose up --build
```

## Connect it

Add a custom connector pointing at `https://<host>/mcp`, named
`lxagents-agents-base`. For local development over stdio, see
[`wiki/guides/connect-a-repository.md`](wiki/guides/connect-a-repository.md).

## Documentation

- [Overview](wiki/information/overview.md) — what this serves and why it is a server.
- [Architecture](wiki/information/architecture.md) — registry, transports, concurrency.
- [MCP surface](wiki/reference/mcp-surface.md) — every prompt and resource.
- [Local setup](wiki/environments/setup.md) — running and testing it.

## Working with agents

The instruction set this server delivers is also the instruction set this repository
follows. Start at [`AGENTS.md`](AGENTS.md); the canonical content lives in
[`content/`](content/).

## License

MIT — see [`LICENSE`](LICENSE).
