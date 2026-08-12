---
name: shared-instructions
description: How the shared set and a repository's local set combine — resolution, precedence, override semantics, promotion, and the adoption checklist.
---

# Shared Instructions

Open this the moment you are unsure whether something is local or universal.

## A. The two sets

| Set | Where it lives | What it holds |
|---|---|---|
| **Shared** | The `lxagents-agents-base` MCP server, addressed as `{shared}` / `agents://` | Everything true across repositories. |
| **Local** | `{repo}/.agents/` | Everything true of exactly one repository. |

Memory, indexes, both wikis, and `rules/repository.md` are **always local**. Everything
universal is **always shared**. There is no third place.

**This holds for the producer repository too.** `LXAgents/mcp-server` publishes the
shared set, but it is also an ordinary software project with source, tests and a
container image — so it carries its own `.agents/` for its rules, indexes, agent wiki
and memory, and it must not push any of that into the published set. Producing the set
is not a licence to keep local rules in it: a repository-specific convention in
`{shared}` is broadcast to everyone, which is the same failure as a shared convention
copied into a consumer, running the other way.

## B. Resolution order

Full procedure in [`mcp-connector.md`](agents://rules/mcp-connector.md). In summary:

1. If the `lxagents-agents-base` connector is available in this session, that is the
   shared set.
2. Read `agents://manifest.json` once to learn what exists.
3. Read `agents://index/root-index.md` and route from there.
4. If the connector is unavailable, say so plainly and continue on the local set only.

**Never vendor the shared set.** There is no checkout to commit, and creating one by
hand — cloning, copying, pasting — reintroduces exactly the drift the connector
removes. If you find a vendored copy already present, that is a finding for
[`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md), which
runs on request.

## C. Precedence

Resolve by *kind* first; within a kind, **local always wins over shared**. Highest
first:

1. An explicit instruction from the user in the current session.
2. Rules — local `{repo}/.agents/rules/`, then shared `agents://rules/`.
3. Other instructions — local `{repo}/.agents/**`, then shared `agents://**`.
4. Agent knowledge — local `{repo}/.agents/wiki/`.
5. Human documentation — local `{repo}/wiki/`.
6. Memory — local `{repo}/.agents/memory/`.
7. Your own defaults and habits — last, always.

## D. Override semantics

Override is **by `name`, and it is whole-file**. A local file whose frontmatter `name`
equals a shared file's `name` replaces that shared file entirely for that repository.
There is no partial merge and no section-level override.

The procedure:

1. **Confirm the shared file genuinely does not fit this repository.** A preference is
   not a reason; an incompatibility is.
2. Copy the shared file into the matching local folder, keeping the **same `name`**.
3. Change what must change, and state at the top of the local file which shared file it
   replaces and why, in one line.
4. Add a row to the override table in `.agents/index/root-index.md`, **in the same
   commit**.
5. Overrides are whole-file. A local file must never re-link to the shared file it
   replaces as if both applied.
6. **Overrides are a cost, not a feature.** Every override is a copy that will drift.
   Prefer proposing the change upstream; keep the override only while the
   incompatibility lasts, and drop it when it stops applying.

An override with a stated reason is a decision. A copy without one is an accident, and
the duplicate audit will propose deleting it.

## E. Promoting a local rule to shared

When a second repository needs the same rule, that is the signal. Propose it against
the shared set per
[`discovery-protocol.md`](agents://rules/discovery-protocol.md). Once it lands, delete
the local copies and their override rows — in the same commit as the deletion, so no
index points at a file that no longer exists.

## F. Changing the shared set

A pull request against `LXAgents/mcp-server`, following that repository's own `git/`
conventions. Because a shared change alters behavior in every consuming repository at
once:

* A change that breaks an existing convention is a **major** version bump
  ([`versioning.md`](agents://rules/versioning.md)).
* Every release is logged in that repository's `wiki/logs/`, and the entry names what
  consumers must do — nothing, re-read a file, or drop an override.
* Consumers pick the change up on their next read. There is no upgrade step, which is
  why the log entry has to be explicit about what changed.

## G. Adding a new repository to the organization

The adoption checklist:

1. Root `AGENTS.md` with the connector bootstrap block, verbatim.
2. `.agents/index/root-index.md` with an override table — empty is valid and
   meaningful.
3. `.agents/rules/repository.md`, naming the mode and the connector.
4. `.agents/wiki/context/repository-map.md`, filled with real discovery output.
5. Local wiki and memory seeds.
6. **Nothing copied from the shared set.**

The `agents-setup` prompt performs all of it. Invoke it rather than doing it by hand.
