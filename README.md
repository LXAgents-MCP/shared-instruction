# shared-instruction

The MCP server that delivers the **LXAgents shared agent instruction set**. A
repository connects it as a connector and reads the conventions it needs — branching,
commits, pull requests, task workflow, the creators, the directory architecture —
instead of cloning or vendoring a copy of them.

- **Server id:** `lxagents-agents-base`
- **Package:** `@lxagents-mcp/shared-instruction`
- **Surface:** MCP prompts and resources, plus thirteen tools — twelve read-only, and `mcp_creator`, which writes.
- **Dual-purpose:** the same set is reachable as a CLI (`lxagents-agents`) and as an MCP server (`lxagents-agents-base`).

## Key features

- **One convention, one tool.** `task_workflow`, `branch_strategy`, `commit_strategy`,
  `discovery_protocol`, `pull_request_strategy` and `agents_model_naming_convention` each
  return one file when its trigger fires. **Nothing is called at session start** — a
  repository declares which tools it uses in its own `AGENTS.md`, and a session that only
  branches and commits pays about 5,000 characters instead of the 31,000 the old single
  activation call charged every time.
- **Per-repository control.** The declaration block is the routing table. A repository that
  stores no model identifier does not carry a row about one, and the narrowing is visible
  in a diff rather than buried in a payload.
- **`setup_shared_agents_instruction`** and the `agents-setup` prompt — the full procedure
  that builds a repository's `AGENTS.md`, `.agents/` tree, wiki, and memory, and stamps the
  set version adopted.
- **`update_shared_agents_instruction`** — moves a repository from the version it adopted to
  the current one, returning the **Consumers must** line for every release since, oldest
  first. **On request only.**
- **`check_duplicate_shared_agents_instruction`** and the
  `check-duplicate-agents-instruction` prompt — find instructions a repository duplicates
  from the shared set. **On request only**; deletion needs per-file approval.
- **29 instruction resources** under `agents://`, plus `agents://manifest.json` listing
  every file with a content hash — one read instead of walking the set. Anything without a
  tool of its own is reached with `list_shared_agents_instruction` and
  `read_shared_agents_instruction`.
- **Model naming** — `agents_model_naming_convention` returns the `{platform}/{model}` rule
  every stored model identifier follows; `agents_model_name_format` builds one, so a direct
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
- [Security model](wiki/security/security-model.md) — trust boundaries, attack surface, and what is deliberately not protected.

## Working with agents

The instruction set this server delivers is also the instruction set this repository
follows. Start at [`AGENTS.md`](AGENTS.md); the canonical content lives in
[`content/`](content/).

## License

MIT — see [`LICENSE`](LICENSE).
