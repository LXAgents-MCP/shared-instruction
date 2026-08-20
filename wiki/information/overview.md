# Overview

`LXAgents-MCP/shared-instruction` is an MCP server that delivers the organization's
shared agent instruction set. Its id is `lxagents-agents-base` and it is published as
`@lxagents/agents-base`.

## The problem it solves

An agent working in a repository needs to know the organization's conventions: how
branches are named, what a commit message looks like, what belongs in a pull request
body, where a new file goes. Those conventions are identical across repositories, so
writing them into each one produces N copies of the same rules.

Copies drift. A fix lands in one repository and not the others; nothing signals that a
copy has fallen behind; and because a local file takes precedence over a shared one,
the stale copy is the one that wins.

The usual answer is a shared `.agents` repository that each consumer clones as a
sibling. That removes the copies but adds a checkout: something to clone, keep current,
and accidentally commit.

## The answer here

Serve the set instead. A repository adds one connector and reads the rules it needs at
the moment it needs them. There is no checkout, so there is nothing to sync and nothing
to vendor by mistake, and every repository reads the same bytes.

## What it serves

| Kind | Name / URI | Purpose |
|---|---|---|
| Prompt | `agents-setup` | The full setup procedure for a repository's instruction, knowledge, and memory system. |
| Prompt | `check-duplicate-agents-instruction` | Finds instructions a repository duplicates from this set. Runs only when asked. |
| Resource | `agents://manifest.json` | Every file with its `name`, path, description, and content hash. |
| Resource | `agents://AGENTS.md` | The federation contract consuming repositories rely on. |
| Resource | `agents://{folder}/{file}.md` | Any instruction file — 26 of them. |

## Why prompts and not tools

A tool makes an instruction set something the model *may decide* to call. A prompt
makes it something a user invokes and the model then obeys. These are standing orders,
so the prompt is the correct primitive, and the server exposes no tools at all.

Resources cover the other half: an agent that has already been told to follow the set
needs to read one file out of it, addressed by URI, without a round trip through a tool
call.

## The duplicate audit

Some repositories already carry a copy of these rules — set up before the connector
existed, or scaffolded by copying another repository. Those copies override the shared
originals by `name` and then go stale silently.

`check-duplicate-agents-instruction` finds them, classifies each as an exact duplicate,
a stale copy, a declared override, or local-only, and proposes deletions.

It runs **only when the user asks for it**. Every other rule in the set fires
automatically; this one does the opposite, because it proposes deletions. Making it a
prompt is what enforces that — it cannot run unless somebody invokes it.

## Related pages

- [Architecture](architecture.md) — how the server is built and why it is safe under
  concurrency.
- [MCP surface](../reference/mcp-surface.md) — the full prompt and resource list.
- [Connect a repository](../guides/connect-a-repository.md) — adoption, step by step.
