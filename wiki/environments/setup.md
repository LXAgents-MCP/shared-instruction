# Local Setup

This package is **dual-purpose**. The same instruction set and the same code are
reachable two ways:

| Mode | What it is | Who uses it |
|---|---|---|
| **CLI mode** | A terminal command that prints the instruction set | A person reading, grepping, or piping the conventions |
| **Server mode** | An MCP server over stdio or streamable HTTP | An MCP client — an editor, an agent, a connector |

Both read the same frozen content registry, so a file read in one is byte-identical to
the same file read in the other. The test suite pins that as an invariant.

## Requirements

Node.js 20 or newer. There is no build step — the server is plain JavaScript.

```bash
npm install
npm test
```

The suite covers the content registry, the MCP surface over an in-memory transport, the
HTTP transport in both session modes, concurrent clients, session reaping, the manifest
hashes, and the CLI.

---

## CLI mode

### Install

```bash
# From the repository, for development
npm install
npm link            # puts lxagents-agents on PATH

# Or globally, from the package
npm install -g @lxagents/agents-base
```

Without installing anything, run it straight out of the checkout:

```bash
node src/cli/index.js --help
npm run cli -- --help
```

### Use

```bash
lxagents-agents list                       # every file, with its description
lxagents-agents list --folder git          # one folder only
lxagents-agents list --json                # machine-readable

lxagents-agents read branching-strategy    # by frontmatter name
lxagents-agents read git/commit-conventions.md
lxagents-agents read agents://rules/directories.md

lxagents-agents setup                      # the AGENTS-SETUP procedure
lxagents-agents audit                      # the duplicate-instruction audit
lxagents-agents manifest                   # the manifest, as JSON
```

`read` accepts a frontmatter `name`, a path, or an `agents://` URI — all three resolve
to the same file, so whichever form you are holding works.

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | The request was understood but could not be satisfied — no such instruction, no such folder |
| `2` | The command line itself was wrong — unknown command, missing argument, bad flag |

Scripts can rely on these: `lxagents-agents read some-name >/dev/null || echo missing`.

---

## Server mode

### Install

An MCP client spawns the server as a subprocess, so "installing" it means pointing the
client at it. Either bin works — `lxagents-agents-base` is the server directly, and
`lxagents-agents serve` reaches the same server through the CLI.

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

For a remote connector, point the client at `https://<host>/mcp` — **including the
`/mcp` path**. Without it the handshake fails, and clients report that as a sign-in
error rather than a wrong address. See
[`connect-a-repository.md`](../guides/connect-a-repository.md).

### Run

```bash
# stdio — one client, for an editor or an agent
npm start
lxagents-agents serve --stdio

# streamable HTTP — the connector surface
npm run start:http
lxagents-agents serve --http --port 3000

# HTTP with reload on change
npm run dev
```

Check it is up:

```bash
curl -s http://localhost:3000/readyz
# {"status":"ready","resources":26,"sessions":0}
```

Every option has an environment equivalent — see [Environment variables](env.md). The
CLI flags set those variables before the server boots, so the two never disagree.

### Inspect it

```bash
npm run inspect
```

This runs the MCP Inspector against the stdio server, listing every prompt, resource,
and tool, and letting you read them.

### stdout belongs to the protocol

On the stdio transport, stdout **is** the JSON-RPC channel. Every log line goes to
stderr instead, and `serve` prints nothing of its own. Only the CLI commands write to
stdout, and only through `src/cli/output.js`. A `console.log` anywhere else in `src/` is
a bug that corrupts the protocol stream.

---

## Content changes require a restart

The instruction set is read once at boot into a frozen registry, so editing anything
under `content/` has no effect until the process restarts. `npm run dev` handles that
for HTTP; restart manually for stdio. Each CLI command is its own short-lived process,
so it always reads the current content.

Boot fails deliberately when a file under `content/` is missing `name` or `description`
frontmatter, or when two files share a `name`. Both would break routing or precedence in
every consuming repository, so they are startup errors rather than runtime surprises.

A description longer than 140 characters is not a boot failure but a **test** failure —
`npm test` rejects it, because a description that long stops being something an agent
can route on at a glance.

## Related pages

- [Environment variables](env.md) — every configuration knob.
- [Docker](docker.md) — running it in a container.
- [MCP surface](../reference/mcp-surface.md) — every prompt, resource, and tool.
- [Architecture](../information/architecture.md) — why it is built this way.
