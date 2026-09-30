# Overview

`LXAgents-MCP/shared-instruction` is an MCP server that delivers the organization's
shared agent instruction set. It is published as `@lxagents-mcp/shared-instruction`, and the MCP
connector it serves is named `lxagents-shared-instruction` — the package name and the connector
id are deliberately different, because renaming the id would break every consuming
repository's client configuration.

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

**Tools, and nothing else.** One per markdown file in `content/`, plus one hand-written
`mcp_list`. No prompts, no resources. Reachable over stdio or stateless HTTP at
`POST /mcp`; both serve the same tools, because both call the same `createServer()`.

| Tool | Serves |
|---|---|
| `agents_entry_point` | `AGENTS.md`, the federation contract. The one name that is not derived from its filename. |
| `root_index` | `index/root-index.md` — start here; it routes to the rest. |
| `plan_creator` | `creators/plan-creator.md` |
| `branching_strategy` | `git/branching-strategy.md` |
| `commit_conventions` | `git/commit-conventions.md` |
| `discovery_protocol` | `rules/discovery-protocol.md` |
| `mcp_list` | The registry of sibling instruction and security servers. Hand-written. |
| …and one tool for each of the other 24 files | Named after its own filename. |

The complete list is whatever the client enumerates from `tools/list`. It is deliberately
not written out here: a hand-maintained copy of a generated list is a copy that goes stale.

**No tool takes an argument.** Each one names a single file, so there is no path to pass
and nothing for a caller to traverse with. Every tool is read-only.

## Why the tools, and not prompts

A tool makes an instruction set something the model *may decide* to call, and a session
sees the full list — name and description — before deciding anything. That is what lets a
repository route on a description without reading a body.

The set's own rules are explicit that **nothing is called at session start**. Each
convention fires on its own trigger, declared in the consuming repository's `AGENTS.md`.
A session that only branches and commits pays for two files rather than thirty-two — which
is the entire point of the current design, and the reason this page does not describe a
single bulk call.

## The duplicate audit

Some repositories already carry a copy of these rules — set up before the connector
existed, or scaffolded by copying another repository. Those copies override the shared
originals by `name` and then go stale silently.

`duplicate_instruction_audit` finds them, classifies each as an exact duplicate, a stale
copy, a declared override, or local-only, and proposes deletions.

It runs **only when the user asks for it**. Every other rule in the set fires
automatically; this one does the opposite, because it proposes deletions.

## Related pages

- [Architecture](architecture.md) — how the tool surface is generated, and why that makes
  concurrency and read cost a non-issue.
- [MCP surface](../reference/mcp-surface.md) — the generated tools, and the longer list of
  what this server does not expose.
- [Connect a repository](../guides/connect-a-repository.md) — adoption, step by step.
