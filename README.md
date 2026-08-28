# shared-instruction

The MCP server that delivers the **LXAgents shared agent instruction set**. A
repository connects it as a connector and reads the conventions it needs — branching,
commits, pull requests, task workflow, the creators, the directory architecture —
instead of cloning or vendoring a copy of them.

- **Server id:** `lxagents-agents-base`
- **Package:** `@lxagents-mcp/shared-instruction`
- **Surface:** MCP prompts and resources, plus seven tools — six read-only, and `mcp_creator`, which writes.
- **Dual-purpose:** the same set is reachable as a CLI (`lxagents-agents`) and as an MCP server (`lxagents-agents-base`).

## Key features

- **`agents-setup` prompt** — the full setup procedure that builds a repository's
  `AGENTS.md`, `.agents/` tree, wiki, and memory.
- **`check-duplicate-agents-instruction` prompt** — finds instructions a repository
  duplicates from the shared set and removes them. Runs **only when asked**.
- **27 instruction resources** under `agents://`, plus `agents://manifest.json`
  listing every file with a content hash — one read instead of walking the set.
- **Read-only tools** — `agents_setup`, `agents_check_duplicate_instructions`,
  `agents_list_instructions`, `agents_read_instruction` — delivering the same content
  as the prompts, for clients that surface tools only.
- **Model naming** — `model_naming_convention` returns the `{platform}/{model}` rule
  every stored model identifier follows; `model_name_format` builds one, so a direct
  API integration and a gateway route store the same string for the same model.
- **`mcp_creator`** — scaffolds a new dual-purpose MCP repository from one name, each
  one shipping a `wiki/environments/setup.md` that documents both CLI and server mode.
  Plans by default; writes only when asked.
- **Many clients at once.** Content is loaded once into a frozen registry; each
  request or session gets its own server instance, so nothing is shared and any
  process can serve any request.

## Quick start

```bash
npm install
npm test
```

**CLI mode** — read the set at a terminal:

```bash
npm link                                  # puts lxagents-agents on PATH
lxagents-agents list --folder git
lxagents-agents read branching-strategy
lxagents-agents setup
```

**Server mode** — serve the set to an MCP client:

```bash
npm start              # stdio, for an editor or agent
npm run start:http     # streamable HTTP — http://localhost:3000/mcp
```

Both modes read the same frozen registry, so a file read at a terminal is
byte-identical to the same file read over MCP. Full instructions for each mode are in
[`wiki/environments/setup.md`](wiki/environments/setup.md).

With Docker:

```bash
docker compose up --build
```

## Connect it

Add a custom connector pointing at `https://<host>/mcp`, named
`lxagents-agents-base`. **Include the `/mcp` path** — without it the handshake fails,
and clients report that as a sign-in error rather than a wrong address. For local development over stdio, see
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
