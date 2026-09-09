---
name: mcp-connector-resolution
description: How a repository resolves the shared instruction set through the lxagents-agents-base MCP connector instead of cloning it.
---

# MCP Connector Resolution

The shared instruction set is **delivered, not vendored**. There is no `.agents`
checkout to clone, no submodule, no sibling directory, and nothing to keep in sync.
The set is served by the `lxagents-agents-base` MCP server and read over the
connector.

## The bootstrap block

Every consuming repository carries this block verbatim in its root `AGENTS.md`,
because it must work before any shared file has been read.

> ## Shared Instruction Set
>
> The conventions this repository follows — branching, commits, pull requests, task
> workflow, the creators — live in the shared instruction set served by the
> **`lxagents-agents-base`** MCP server. This repository carries only what is its
> own. **Resolve the shared set before doing any work:**
>
> 1. If the `lxagents-agents-base` connector is available in this session, that is
>    the shared set. Refer to it as `{shared}`; its files are addressed as
>    `agents://{folder}/{file}.md`.
> 2. **Resolving is not loading.** Do not pull any convention at session start. The
>    **Shared instruction tools** block below declares which tools this repository
>    uses and the trigger for each; call one when its trigger fires, and not before.
> 3. Where the client exposes no tools, the same conventions are read as
>    `agents://{folder}/{file}.md` resources, on the same triggers.
>    `list_shared_agents_instruction` — or `agents://manifest.json` — answers "what
>    exists?" in one call. Do not bulk-read the set.
> 4. If the connector is not available, say so plainly and continue with this
>    repository's local instruction set only. **Do not reconstruct the missing rules
>    from memory, and do not clone or copy them into this repository.**
>
> **The declaration block is required.** A repository without one has no routing table,
> so nothing fires and the omission looks exactly like a session in which no convention
> happened to apply. It names the four mandatory tools at minimum — `task_workflow`,
> `branch_strategy`, `commit_strategy`, `discovery_protocol` — and stamps the set version
> adopted. Shape: `{shared}/prompts/agents-setup.md`. Keeping it current when this set
> moves: `{shared}/prompts/agents-update.md`, on request.
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
* **Cheaper context.** `agents://manifest.json` answers "what exists?" in one read;
  a clone answers it by walking a tree.

## Addressing

| You mean | You write |
|---|---|
| A shared file, in prose | `{shared}/rules/directories.md` |
| A shared file, as a resource | `agents://rules/directories.md` |
| A local file, in prose from a shared file | `{repo}/.agents/index/root-index.md` |
| A local file, from another local file | a relative path — `../rules/repository.md` |

Relative, clickable links are used **within** a set only. A shared file never emits a
relative path that points outside the shared set, because it has no idea where the
consuming repository sits on disk.

## Connecting the server

**As a remote connector** — the normal case, and what makes this set available to a
repository without cloning anything:

1. Open **Settings → Connectors → Add custom connector**.
2. Name it `lxagents-agents-base`.
3. Point it at the deployed server's MCP endpoint — **including the `/mcp` path**:
   `https://<host>/mcp`.

The path is not optional. A URL without it lands on a route that speaks no MCP, and
clients tend to read that failure as "this server needs authentication" and report a
sign-in or registration error rather than a wrong address. If connecting fails that
way, check the path first.

**As a local stdio server** — for development on the instruction set itself:

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

## What the server exposes

| Kind | Name / URI | Purpose |
|---|---|---|
| Prompt | `agents-setup` | The full setup procedure. Invoke it to scaffold or adopt the instruction system in a repository. |
| Prompt | `agents-update` | Move a repository from the set version it adopted to the current one. **On request only.** |
| Prompt | `check-duplicate-agents-instruction` | The duplicate audit. Runs **only when the user asks** — see `duplicate-instruction-audit.md`. |
| Resource | `agents://manifest.json` | Every shared file with `name`, path, description and content hash. |
| Resource | `agents://AGENTS.md` | The federation contract. |
| Resource | `agents://{folder}/{file}.md` | Any shared instruction file. |
| Tool | `task_workflow` | The task workflow. One of the four every repository declares. |
| Tool | `branch_strategy` | The branching strategy. One of the four. |
| Tool | `commit_strategy` | The commit conventions. One of the four. |
| Tool | `discovery_protocol` | The propose-never-self-apply protocol. One of the four. |
| Tool | `pull_request_strategy` | The pull request title and body rules. |
| Tool | `agents_model_naming_convention` | The `{platform}/{model}` rule for stored model identifiers, whole. |
| Tool | `agents_model_name_format` | Builds one compliant `model_name` from a platform and that platform's model id. |
| Tool | `setup_shared_agents_instruction` | Same text as the `agents-setup` prompt. |
| Tool | `update_shared_agents_instruction` | The version delta and the re-sync procedure. **On request only.** |
| Tool | `check_duplicate_shared_agents_instruction` | Same text as the audit prompt, manifest inlined. **On request only.** |
| Tool | `list_shared_agents_instruction` | The manifest, optionally filtered to one folder. |
| Tool | `read_shared_agents_instruction` | One file, by `name`, path, or URI. The route to everything without a dedicated tool. |
| Tool | `mcp_creator` | Scaffolds a new MCP repository. **Not part of reading this set** — listed so you know the capability is there. Plans by default; creates files only when asked. |

**No tool is called at session start.** Each fires on the trigger its row in the
repository's declaration block gives it. Calling them all to "have them ready" rebuilds the
single oversized payload this surface replaced, one call at a time.

**Prefer the prompts and resources.** They are the right primitives for standing
orders, and the tools return identical text. The tools exist because some clients
enumerate a connector by its tools alone and never surface prompts or resources — a
server without them shows up there as unusable. Use whichever your client actually
exposes; the instructions you receive are the same either way.

Everything above except `mcp_creator` is read-only. `mcp_creator` writes files, and
only when a call explicitly asks it to — so it is never something to invoke while
merely resolving the set.

## When the connector is unavailable

State it plainly, once, in your first message: which conventions you could not read,
and that you are proceeding on the local set alone. Then:

* **Do** work from `{repo}/.agents/` and the user's explicit instructions.
* **Do not** invent replacements for the rules you could not read.
* **Do not** clone, vendor, or paste the shared set into the repository as a
  workaround. An unavailable connector is a temporary condition; a vendored copy is
  permanent drift.
