# shared-instruction

The MCP server that delivers the **LXAgents shared agent instruction set**. A
repository connects it as a connector and reads the conventions it needs — branching,
commits, pull requests, task workflow, the creators, the directory architecture —
instead of cloning or vendoring a copy of them.

- **Server id:** `lxagents-agents-base`
- **Package:** `@lxagents-mcp/shared-instruction`
- **Transport:** stdio. There is no HTTP server and no remote endpoint.
- **Surface:** 32 tools. 31 are generated — one per markdown file in `content/` — and one
  is hand-written. Every one is read-only and every one takes no arguments.
- **Requirements:** Node >= 20. ESM, no build step.

## Key features

- **One file, one tool.** Every `.md` under `content/` becomes a tool named after its own
  filename, so `git/commit-conventions.md` is `commit_conventions`. **Adding a file to the
  set adds its tool** — there is no registry to edit and no hand-written tool module to
  write. The one documented exception is `AGENTS.md`, served as `agents_entry_point`,
  because `agents` says nothing about which document it is.
- **No tool takes an argument.** A tool names one file, so there is no path to pass, no
  lookup to guess at, and **nothing for a caller to traverse with**. This is the structural
  replacement for a path argument, not a weaker check on one: `test/server.test.js`
  asserts that every tool's schema has no properties and no required fields, so a future
  tool that grows an argument has to be added deliberately.
- **Read once, at boot.** The whole set is read into a frozen map when the process starts.
  A tool call is a map lookup — no filesystem I/O on the read path — and a malformed set
  fails the process at startup rather than returning a wrong answer to the first caller
  that needed the file.
- **The description is the routing key.** A tool's description is that file's own
  frontmatter `description`, verbatim. A file without one **fails at boot**: it would
  publish as a tool a client cannot route on.
- **Nothing is called at session start.** A repository declares which tools it uses in its
  own `AGENTS.md`, and each fires on its own trigger. A session that only branches and
  commits pays for two files, not thirty-one.
- **Per-repository control.** The declaration block is the routing table. A repository that
  stores no model identifier does not carry a row about one, and the narrowing is visible
  in a diff rather than buried in a payload.
- **`mcp_list`** — the registry of sibling instruction and security servers, with each one's
  scope and clone URL. Use it before cloning one. It deliberately does not list this server;
  you are already connected to it.
- **`agents_setup`**, **`agents_update`** and **`duplicate_instruction_audit`** — the
  procedures for adopting, re-syncing and auditing a repository's use of the set. The last
  two run **on request only**.

## Quick start

```bash
npm install
npm test
```

Serve it to an MCP client over stdio:

```bash
npm start
```

Or inspect the surface by hand:

```bash
npm run inspect
```

Full instructions are in [`wiki/environments/setup.md`](wiki/environments/setup.md).

## Connect it

A local stdio server, named `lxagents-agents-base`:

```json
{
  "mcpServers": {
    "lxagents-agents-base": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/path/to/shared-instruction"
    }
  }
}
```

For npm consumers the package exposes that binary, so `command: "npx"` with
`args: ["-y", "@lxagents-mcp/shared-instruction"]` works without a checkout. See
[`wiki/guides/connect-a-repository.md`](wiki/guides/connect-a-repository.md).

**Registering a server does not reach a session that is already running.** A client loads
its connector list at session start, so a server added mid-session reports healthy and is
still absent from the tool surface until the session restarts.

## Documentation

- [Overview](wiki/information/overview.md) — what this serves and why it is a server.
- [Architecture](wiki/information/architecture.md) — how the tool surface is built.
- [MCP surface](wiki/reference/mcp-surface.md) — every tool, and what the server does not expose.
- [Local setup](wiki/environments/setup.md) — running and testing it.
- [Security model](wiki/security/security-model.md) — trust boundaries, and what is deliberately not protected.

## Working with agents

The instruction set this server delivers is also the instruction set this repository
follows. Start at [`AGENTS.md`](AGENTS.md); the canonical content lives in
[`content/`](content/).

Because this repository *is* the producer, a change to `content/` changes behavior in
every consuming repository at once. See [`content/rules/versioning.md`](content/rules/versioning.md)
for what that means before you change anything there.

## License

MIT — see [`LICENSE`](LICENSE).
