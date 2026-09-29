# Local Setup

An MCP server over stdio, with an HTTP transport available for running it as a service.
There is no CLI. There is a container image — see [Docker](docker.md).

| Mode | What it is | Who uses it |
|---|---|---|
| **Server mode** | An MCP server over stdio, or over HTTP/SSE | An MCP client — an editor, an agent, a connector |

## Requirements

Node.js 20 or newer. There is no build step — the server is plain JavaScript (ESM).

```bash
npm install
npm test
```

The suite is two files and 30 tests. `test/server.test.js` drives a real MCP client over an
in-memory transport and covers the frontmatter contract, the shared creator procedure, the
file-to-tool bijection in both directions, name derivation, uniqueness and descriptions, the
zero-argument claim, byte-for-byte payload fidelity, total-served equality, reachability,
index routing, `mcp_list` in isolation, and the read-only claim. `test/http.test.js` drives
a real client against a real listening process and covers the HTTP transport: the two
transports agreeing, concurrent sessions, unknown sessions, session lifetime, shutdown
ordering, the `Host` allow-list, and the startup warning when no allow-list is set.

---

## Server mode

### Install

An MCP client spawns the server as a subprocess, so "installing" it means pointing the
client at it. From a checkout:

```json
{
  "mcpServers": {
    "lxagents-shared-instruction": {
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
    "lxagents-shared-instruction": {
      "command": "npx",
      "args": ["-y", "@lxagents-mcp/shared-instruction"]
    }
  }
}
```

There is a remote form as well, for a server running at a fixed address. `src/http.js`
serves the same tools over SSE at `/sse`; see
[Connect a repository](../guides/connect-a-repository.md).

### Run

```bash
npm start             # stdio
npm run start:stdio   # the same thing, named for what it is
npm run start:http    # HTTP on 0.0.0.0:3000, or $PORT
```

The two entry points differ only in transport. Same 31 tools, same content, same
read-only surface.

### Inspect it

```bash
npm run inspect
```

This runs the MCP Inspector against the stdio server, listing every tool and letting you
call it. With 31 tools and no prompts or resources, the tool list is the whole surface.

### stdout belongs to the protocol — on stdio

On the stdio transport, stdout **is** the JSON-RPC channel. Nothing in `src/index.js`
writes to it: there is no logger module, and no `console.log` on that path. A
`console.log` added there would corrupt the protocol stream, which is worth knowing before
adding one.

**`src/http.js` is the exception, and deliberately.** The HTTP process speaks JSON-RPC
over a socket, not a pipe, so stdout is an ordinary logging channel there and its startup
line uses it. The rule is per-entry-point, not per-repository — a single shared "never
write to stdout" would forbid correct behaviour in one file on the grounds that it is
fatal in the other.

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
- [Environment variables](env.md) — the three the HTTP transport reads.
- [Architecture](../information/architecture.md) — how the surface is generated.
