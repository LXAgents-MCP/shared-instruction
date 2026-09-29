# Local Setup

An MCP server over stdio. There is no CLI, no HTTP mode, and no container image.

| Mode | What it is | Who uses it |
|---|---|---|
| **Server mode** | An MCP server over stdio | An MCP client — an editor, an agent, a connector |

## Requirements

Node.js 20 or newer. There is no build step — the server is plain JavaScript (ESM).

```bash
npm install
npm test
```

The suite is one file, `test/server.test.js`, and it is the whole suite: 19 tests
driving a real MCP client over an in-memory transport. It covers the frontmatter contract,
the shared creator procedure, the file-to-tool bijection in both directions, name
derivation, uniqueness and descriptions, the zero-argument claim, byte-for-byte payload
fidelity, total-served equality, reachability, index routing, `mcp_list` in isolation, and
the read-only claim.

---

## Server mode

### Install

An MCP client spawns the server as a subprocess, so "installing" it means pointing the
client at it. From a checkout:

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

From npm, the package exposes that same file as a bin, so no checkout is needed:

```json
{
  "mcpServers": {
    "lxagents-agents-base": {
      "command": "npx",
      "args": ["-y", "@lxagents-mcp/shared-instruction"]
    }
  }
}
```

There is no remote form. `src/index.js` connects `StdioServerTransport` and nothing else,
so a client configured with a URL is pointed at nothing this package provides.

### Run

```bash
npm start        # stdio
npm run start:stdio   # the same thing, named for what it is
```

### Inspect it

```bash
npm run inspect
```

This runs the MCP Inspector against the stdio server, listing every tool and letting you
call it. With 32 tools and no prompts or resources, the tool list is the whole surface.

### stdout belongs to the protocol

On the stdio transport, stdout **is** the JSON-RPC channel. Nothing in this repository
writes to stdout: there is no logger module, and no `console.log` in `src/`. A
`console.log` added there would corrupt the protocol stream, which is worth knowing before
adding one.

---

## Content changes require a restart

The instruction set is read once at boot into a frozen map, so editing anything under
`content/` has no effect until the process restarts. This is deliberate — a versioned,
released set that is never served half-applied is worth more than live reload — and it is
the reason the boot-time checks below exist.

Boot **fails deliberately** when a file under `content/`:

- derives a name that is not a valid MCP tool identifier
- derives the same name as another file in a different folder
- has no frontmatter `description`

Each would break routing for every consuming repository, so each is a startup error rather
than a runtime surprise. The fix is usually one line in `NAME_OVERRIDES` in
`src/tools/from-content.js`.

## Related pages

- [MCP surface](../reference/mcp-surface.md) — the tool surface, and what is not exposed.
- [Environment variables](env.md) — which is to say, none.
- [Architecture](../information/architecture.md) — how the surface is generated.
