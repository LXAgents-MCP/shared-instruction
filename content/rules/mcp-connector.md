---
name: mcp-connector-resolution
description: How a repository resolves the shared instruction set through the lxagents-shared-instruction MCP connector instead of cloning it.
version: 1.0.0
author: LXAgents
---

# MCP Connector Resolution

The shared instruction set is **delivered, not vendored**. There is no `.agents`
checkout to clone, no submodule, no sibling directory, and nothing to keep in sync.
The set is served by the `lxagents-shared-instruction` MCP server and read over the
connector.

## The bootstrap block

Every consuming repository carries this block verbatim in its root `AGENTS.md`,
because it must work before any shared file has been read.

> ## Shared Instruction Set
>
> The conventions this repository follows — branching, commits, pull requests, task
> workflow, the creators — live in the shared instruction set served by the
> **`lxagents-shared-instruction`** MCP server. This repository carries only what is its
> own. **Resolve the shared set before doing any work:**
>
> 1. If the `lxagents-shared-instruction` connector is available in this session, that is
>    the shared set. Refer to it as `{shared}`; its files are addressed as
>    `agents://{folder}/{file}.md`.
> 2. **Resolving is not loading.** Do not pull any convention at session start. The
>    **Shared instruction tools** block below declares which tools this repository
>    uses and the trigger for each; call one when its trigger fires, and not before.
> 3. **Every file in the set is its own tool**, named after its filename — so
>    "what exists?" is answered by the tool list the client already has, at no cost.
>    `root_index` routes to the rest; `mcp_list` lists the sibling servers. Do not
>    bulk-call the set.
> 4. If the connector is not available, say so plainly and continue with this
>    repository's local instruction set only. **Do not reconstruct the missing rules
>    from memory, and do not clone or copy them into this repository.**
>
> **The declaration block is required.** A repository without one has no routing table,
> so nothing fires and the omission looks exactly like a session in which no convention
> happened to apply. It names the four mandatory tools at minimum — `plan_creator`,
> `branching_strategy`, `commit_conventions`, `discovery_protocol` — and stamps the set
> version adopted. Shape: `{shared}/prompts/agents-setup.md`. Keeping it current when this
> set moves: `{shared}/prompts/agents-update.md`, on request.
>
> Never commit shared content into this repository. A file that can be read from
> `agents://` must not exist here as a copy — see
> `{shared}/rules/duplicate-instruction-audit.md`.
>
> **Local overrides shared.** A file in `.agents/` whose `name` matches a shared
> file's `name` replaces that shared file entirely for this repository. The current
> overrides are listed in
> [`.agents/index/root-index.md`](.agents/index/root-index.md).

## Why a connector rather than a clone

* **No sync step.** A clone is a snapshot that is stale the moment it lands. The
  connector serves the current set on every read.
* **No accidental commit.** There is no checkout to leave inside the repository, so
  the shared set cannot be vendored by mistake.
* **No duplication.** Every repository reads the same bytes. Drift between
  repositories stops being possible without a declared override.
* **Cheaper context.** Every file is a tool with a description, so the client's own
  tool list answers "what exists?" for free. A clone answers it by walking a tree, and
  reading the tree to build a registry is the work the connector exists to remove.

## Addressing

| You mean | You write |
|---|---|
| A shared file, in prose | `{shared}/rules/directories.md` |
| A shared file, to fetch it | call the tool named after it — `directories` |
| A local file, in prose from a shared file | `{repo}/.agents/index/root-index.md` |
| A local file, from another local file | a relative path — `../rules/repository.md` |

`agents://{folder}/{file}.md` is the **prose notation** this set uses in its own links and
in a consuming repository's `AGENTS.md`. It is not a fetchable URI — the server exposes
tools, not a resource endpoint — so a session resolves it by calling the tool, not by
reading a URI.

Relative, clickable links are used **within** a set only. A shared file never emits a
relative path that points outside the shared set, because it has no idea where the
consuming repository sits on disk.

## Connecting the server

The server speaks **two transports**. The local one is stdio, and it is the default:

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

The second is HTTP, for when the server runs somewhere other than your machine — as a
Web Service, in a container, or beside the repositories that read it. It serves the same
tools at `/mcp`, statelessly — every request stands alone and carries its own JSON-RPC
envelope, so there is no session to open first and none to close:

```json
{
  "mcpServers": {
    "lxagents-shared-instruction": {
      "type": "http",
      "url": "https://shared-instruction.example.com/mcp"
    }
  }
}
```

**`"type": "http"` replaces `"type": "sse"`, and the URL changes with it.** The SSE
transport and its `GET /sse` + `POST /message` pair are gone; a client still registered
that way gets a `404` and reads no tools, which looks like an unreachable server rather
than a stale registration. There is no compatibility route — the two are not the same
protocol, so serving the old path would mean carrying the state SSE depended on.
`GET /healthz` answers `200` and tells a deployment apart from a server that is up and
wrong, which is the first question to ask when a connector resolves nothing.

**stdio remains the right choice for a consuming repository** unless you specifically need
one server serving many clients from a fixed address. It needs no process to keep alive, no
port to expose, and no host to secure. Choose HTTP when the server's lifecycle should not
be tied to any single client — not because it is better.

For npm consumers, `@lxagents-mcp/shared-instruction` exposes the `lxagents-shared-instruction`
binary, so `command: "npx"`, `args: ["-y", "@lxagents-mcp/shared-instruction"]` works
without a checkout. To develop on the instruction set itself, run it from a clone with
`npm start`, serve it with `npm run start:http`, or inspect it in the MCP Inspector with
`npm run inspect`.

**Registering a server does not reach a session that is already running.** A client
loads its connector list at session start, so a server added mid-session reports healthy
and is still absent from the tool surface until the session restarts. That is the common
cause of "the connector is not resolving", and it looks like a broken server rather than
a stale session.

## What the server exposes

**One tool per file, and nothing else.** The tool is named after its own filename — folder
stripped, `.md` dropped, kebab to snake — with one exception: `AGENTS.md` is served as
`agents_entry_point`, because `agents` says nothing about which document it is.

| Tool | Serves |
|---|---|
| `plan_creator` | `creators/plan-creator.md` — one of the four every repository declares |
| `branching_strategy` | `git/branching-strategy.md` — one of the four |
| `commit_conventions` | `git/commit-conventions.md` — one of the four |
| `discovery_protocol` | `rules/discovery-protocol.md` — one of the four |
| `root_index` | `index/root-index.md` — start here; it routes to everything else |
| `agents_entry_point` | `AGENTS.md` — the federation contract |
| `agents_setup` | `prompts/agents-setup.md` |
| `agents_update` | `prompts/agents-update.md` — **on request only** |
| `duplicate_instruction_audit` | `rules/duplicate-instruction-audit.md` — **on request only** |
| `mcp_list` | The registry of sibling instruction and security servers |

…plus one tool for every other file in the set. The list your client enumerates is the
complete list; there is no manifest to fetch, whichever transport you connect over. Start
at `root_index` rather than guessing which convention applies.

**No tool takes an argument.** A tool names one file, so there is no path to pass and
nothing for a caller to traverse with. This server is read-only as a matter of structure
rather than of configuration: the tools that would write the set are not registered.

**No tool is called at session start.** Each fires on the trigger its row in the
repository's declaration block gives it. There are more than thirty; calling them all to
"have them ready" rebuilds the single oversized payload this surface replaced, one call at
a time.

## When the connector is unavailable

State it plainly, once, in your first message: which conventions you could not read,
and that you are proceeding on the local set alone. Then:

* **Do** work from `{repo}/.agents/` and the user's explicit instructions.
* **Do not** invent replacements for the rules you could not read.
* **Do not** clone, vendor, or paste the shared set into the repository as a
  workaround. An unavailable connector is a temporary condition; a vendored copy is
  permanent drift.
