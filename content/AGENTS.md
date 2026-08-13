---
name: shared-agents-entry-point
description: The LXAgents shared agent instruction set, delivered over MCP — the contract every consuming repository relies on.
---

# LXAgents Shared Agent Instruction Set

This is the shared agent instruction set for **LXAgents**. It holds the conventions
that are true across repositories — branching, commits, pull requests, task
workflow, the creators, the directory architecture — and nothing that belongs to any
one repository.

It is delivered by the `lxagents-agents-base` MCP server. A consuming repository
**connects to it**; it does not clone it, vendor it, or copy it. Every file below is
addressable as a resource under the `agents://` scheme, and the setup procedure is
addressable as the `agents-setup` prompt.

## The consumer contract

> Every repository in this organization keeps its own `AGENTS.md` at its root and its
> own `.agents/` folder, and uses this shared instruction set for everything
> universal. A repository's `.agents/` holds only what is its own — its indexes, its
> `rules/repository.md`, its `wiki/`, its `memory/`, and any deliberate override. It
> must not copy shared files.

The rule that follows from that: **if you can read it from `agents://`, it must not
exist as a file in the consuming repository.** A local copy is drift waiting to
happen, and it is the exact failure this architecture exists to prevent. When a copy
is found anyway, it is resolved by
[`rules/duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md)
— on request, never automatically.

## The adoption checklist

A repository consumes this set once it has all of:

1. A root `AGENTS.md` carrying the connector bootstrap block verbatim
   (see [`rules/mcp-connector.md`](agents://rules/mcp-connector.md)).
2. `.agents/index/root-index.md`, with an override table — empty is a valid and
   meaningful state.
3. `.agents/rules/repository.md`, naming the mode and the connector it resolves.
4. `.agents/wiki/context/repository-map.md`, filled with real discovery output.
5. Seed memory under `.agents/memory/`.
6. **Nothing copied from this set.** No `git/`, `planning/`, `prompts/`, or
   `creators/` folder in the consuming repository.

The `agents-setup` prompt performs this whole procedure. Invoke it from the
connector rather than reproducing it by hand.

## Resolution — how a repository reaches this set

The full procedure, including what to do when the connector is unavailable, is in
[`rules/mcp-connector.md`](agents://rules/mcp-connector.md). In short: the connector
named `lxagents-agents-base` is the shared set. Refer to it as `{shared}` in prose,
and address its files as `agents://{folder}/{file}.md`. There is no checkout, so
there is nothing to keep in sync and nothing to accidentally commit.

## The split — what lives here, what lives in a consuming repository

| Content | Set |
|---|---|
| Branching, commits, pull requests | Shared |
| Task workflow, planning, standing prompts | Shared |
| The five creators | Shared |
| Directory architecture, auto-activation, versioning, memory policy, no-session-links, discovery protocol, connector resolution, duplicate audit, work summary | Shared |
| This set's own index and release log | Shared |
| A repository's rules (`repository.md`) and any override | Local |
| A repository's indexes | Local |
| A repository's agent wiki and human wiki | Local |
| A repository's memory | Local — **never** shared, under any circumstance |
| A repository's release logs | Local |

## Override semantics

Override is **by `name`, and it is whole-file**. A local file whose frontmatter
`name` equals a shared file's `name` replaces that shared file entirely for that
repository. There is no partial merge and no section-level override: to change one
sentence you copy the file, change the sentence, and own the copy — and you record
why in the override table in `.agents/index/root-index.md`.

Overrides are a cost, not a feature. Every override is a copy that will drift.
Prefer proposing the change here; keep the override only while the incompatibility
lasts. See [`rules/shared-instructions.md`](agents://rules/shared-instructions.md).

## How to change this set

A change to a shared file changes behavior in every consuming repository at once, so
it goes through a pull request against `LXAgents/mcp-server`, following this
repository's own `git/` conventions. A change that breaks an existing convention is a
major version bump ([`rules/versioning.md`](agents://rules/versioning.md)) and is
announced in this repository's `wiki/logs/`, with the entry naming what consumers
must do — nothing, re-read a file, or drop an override.

## Reading order

1. Read this file.
2. Read [`index/root-index.md`](agents://index/root-index.md) — and nothing else at
   this stage.
3. From its routing table, pick the ONE index whose scope matches the task, and read
   that index.
4. If that index delegates to a child index, follow the one branch that matches.
5. Only then open the specific file(s) you need.

## Routing protocol

Route by reading index tables, not by reading files. Do NOT load every index. Do NOT
bulk-read this set to build a registry — the manifest at `agents://manifest.json`
already is one, and it is one read instead of twenty. Do NOT read an instruction body
until that instruction has been selected. Each index row's purpose text is what you
route on; the file body is what you load after choosing.

## Iron rule

* `AGENTS.md` and `README.md` are overviews and must never carry detailed rules or
  documentation.
* `index/root-index.md` is a **router only**. It lists other indexes. It must never
  contain rules, documentation, prose, or direct links to leaf content.
* Each index owns exactly one scope and writes outside it never.
* **Local carries only what is local.** A convention true for more than one
  repository belongs here — propose it here, do not copy it there.
* `wiki/` is for humans, `.agents/wiki/` is for agents, and neither duplicates the
  other.
* **One subject per file.** A cross-cutting rule gets its own file and is linked, not
  pasted into a file about something else.
* An index never teaches. The moment it explains something, that content belongs in a
  real file.

## Discovery protocol

Source of truth: [`rules/discovery-protocol.md`](agents://rules/discovery-protocol.md).

> While working, if you find an instruction worth adding — a new rule, or content
> that belongs in an existing instruction file — you must NOT create or edit it on
> your own. Present each finding to the user separately, each in its own code block,
> including the target set (local or shared), the proposed file path, `name`,
> `description`, and full body. Let the user select which ones to apply. Create only
> what the user selects. This gate covers instruction files only — writing memory
> under `.agents/memory/` is expected and needs no approval.

## Version rule

Never change a project version without explicit user approval — see
[`rules/versioning.md`](agents://rules/versioning.md). That includes this set's own
version.

## No session links

Never write a link or identifier pointing at an assistant or tool session into a
file, commit message, commit trailer, branch name, tag, pull request, or comment. If
your tooling appends one by default, strip it before committing or posting — see
[`rules/no-session-links.md`](agents://rules/no-session-links.md).

---

Full routing: [`index/root-index.md`](agents://index/root-index.md).
