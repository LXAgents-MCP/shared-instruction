---
name: agents-entry-point
description: Entry point for LXAgents-MCP/shared-instruction — the repository that holds and serves the shared agent instruction set.
---

# AGENTS.md

This repository is `LXAgents-MCP/shared-instruction`. It holds the shared agent
instruction set in [`content/`](content/) and serves it over MCP as
`lxagents-shared-instruction`. Every other
repository in the organization consumes that set through a connector rather than
copying it.

## Two sets, two roles

This repository is both the **producer** of the shared set and a **consumer** of it, so
it carries both:

| Set | Path | Published? |
|---|---|---|
| Shared — the product | [`content/`](content/) | **Yes.** Served as one tool per file. A change here changes behaviour in every consuming repository, so it is versioned and logged like a release. |
| Local — this repository's own | [`.agents/`](.agents/) | No. Its rules, indexes, agent wiki, and memory. |

`{shared}` resolves to `content/` **in the working tree**, not the deployed connector:
you are editing the set, so a deployed snapshot may be older than your branch.

Never put a repository-specific rule in `content/`, and never put a universal convention
in `.agents/`. The routing question is in
[`content/rules/directories.md`](content/rules/directories.md): *is this true for more
than this repository?*

## Auto-Activation

The instruction set is **always active**. It applies to every task in this repository
whether or not the user mentions it, links to it, or asks for it. Treat these files as
standing orders, not as optional reference material.

**Always active is not always loaded.** At the start of every session, before doing any
work:

1. Read `AGENTS.md` (this file), including the Shared instruction tools block below.
2. Resolve the shared set — see [Using the connector](#using-the-connector). Here that
   is `content/` in the working tree, and the step is still not skippable: it is where
   you find out whether the connector is reachable, which you have to say either way.
3. Read [`.agents/index/root-index.md`](.agents/index/root-index.md).
4. Read [`.agents/index/memory-index.md`](.agents/index/memory-index.md) and load only
   the rows matching the request, so you continue prior work instead of restarting it.

That is the whole sequence, and every step reads a file on disk. **Call no shared tool at
session start** — each fires on the trigger its row gives it, and calling them up front pays
for procedures the request may never need.

**These gates stand from the first message, before any tool is called:** approve the plan
before any file is written, ask before opening a pull request, ask before merging, and
propose a discovered rule rather than writing it. A gate first read at the moment it should
have applied has already failed, which is why they are here and not behind a call. See
[`content/rules/shared-instructions.md`](content/rules/shared-instructions.md) §H.

If a rule conflicts with a habit, a default, or a template you would otherwise follow,
the rule wins — including a harness that names a branch, a commit trailer, or a pull
request footer the conventions forbid. If it conflicts with an explicit instruction from
the user in this session, the user wins — and you say out loud which rule you are setting
aside.

## Shared instruction tools

This repository **is** the shared set, so every tool below resolves to a file in `content/`
in the working tree rather than to a deployed connector. The block is written the way a
consuming repository's is, because this repository consumes its own set and its entry point
goes stale exactly like a consumer's.

Adopted shared-set version: `content/` in the working tree — the producer tracks its branch,
not a release.

**Every file in `content/` is its own tool**, named after its filename, so the tool list is
the file list. Start at `root_index` or `agents_entry_point` rather than calling everything.

| When you are about to… | Call | Which is |
|---|---|---|
| Take in any request of more than one step | `plan_creator` | [`content/creators/plan-creator.md`](content/creators/plan-creator.md) |
| Create a branch | `branching_strategy` | [`content/git/branching-strategy.md`](content/git/branching-strategy.md) |
| Write a commit message | `commit_conventions` | [`content/git/commit-conventions.md`](content/git/commit-conventions.md) |
| Notice a rule that should exist | `discovery_protocol` | [`content/rules/discovery-protocol.md`](content/rules/discovery-protocol.md) |
| Open or update a pull request | `pull_request_template` | [`content/git/pull-request-template.md`](content/git/pull-request-template.md) |
| Write to any `model_name` column | `model_naming_convention` | [`content/rules/model-naming-convention.md`](content/rules/model-naming-convention.md) |

The first four are mandatory in every repository, this one included. **No tool takes an
argument** — a tool names one file, so there is no path to pass.

## Using the connector

Authority: [`content/rules/mcp-connector.md`](content/rules/mcp-connector.md). Setup, in
full: [`wiki/guides/install-as-local-mcp.md`](wiki/guides/install-as-local-mcp.md).

This repository **is** the server. It publishes `content/` as `lxagents-shared-instruction`, so
here the connector is the thing being edited, not the thing being consulted — read
`content/` in the working tree and treat a deployed snapshot as possibly older than your
branch. Everywhere else, read `agents://`.

### Register it

| Transport | How |
|---|---|
| Local stdio (default) | `command: node`, `args: ["src/index.js"]`, `cwd:` this checkout |
| Published | `command: npx`, `args: ["-y", "@lxagents-mcp/shared-instruction"]` |
| HTTP | `type: http`, `url: https://<host>/mcp` — `npm run start:http` binds `PORT \|\| 3000` |

Both transports serve the same tool surface — one tool per file in `content/`, plus
`mcp_list`. Do not state a count here: it goes stale at the next file added. To get the
current count, enumerate the connector's tools. stdio is the right default for a client
that can spawn a process; HTTP is for running the server as a service at a fixed address.

**Registering a server does not reach a session that is already running.** The client
loads connectors at session start, so `claude mcp add` mid-session leaves a server that
reports healthy and is still absent from the tool surface until the session restarts.
That is the common case, and it looks like a broken server rather than a stale session.

### Read from it

1. Enumerate the tools. Every file in `content/` is one, named after its filename, with
   its `description` attached — that list is the manifest, and it costs nothing to read.
2. `root_index`, then route. Never bulk-call the set.
3. Call the one tool whose trigger fired. None takes an argument.

**Nothing is called at session start.** Each of the convention tools above returns one file
when its trigger fires. Calling every tool up front rebuilds the one oversized payload this
surface replaced, one call at a time — and there are more than thirty of them.

`duplicate_instruction_audit` and `agents_update` run only when the user asks.

### When it will not resolve

A server that is registered but absent from the tool surface, or a client that shows no
tools at all, is the case to recognise. Either way the rule is the same, and it is a
speaking obligation: **say plainly, in your first message, that the connector is
unavailable and which conventions you could not read.** Then work from the local set.
Never reconstruct the missing rules from memory, and never clone or paste the shared set
into a repository as a workaround — an unavailable connector is temporary, a vendored
copy is permanent drift.

To inspect the surface by hand while developing on the set itself, run `npm run inspect`
and drive it with the MCP Inspector.

## Trigger table — the rest of the set

Mirrors [`content/rules/auto-activation.md`](content/rules/auto-activation.md), which
is the authority. Because this repository *is* the shared set, every `{shared}/…` path
resolves to `content/…`, and every row below is also a tool named after its file. The
conventions declared in the block above are not repeated here.

| When you are about to… | Load and obey |
|---|---|
| Write **any** commit, tag, PR, comment, or file that will be committed or posted | [`content/rules/no-session-links.md`](content/rules/no-session-links.md) |
| Run **any** `gh` or `git` command that reaches GitHub | [`content/rules/github-token-access-guide.md`](content/rules/github-token-access-guide.md) |
| Wonder whether something is local or shared | [`content/rules/shared-instructions.md`](content/rules/shared-instructions.md) |
| Document a permission gate, or judge whether one is mechanical or text-borne | [`content/rules/gate-enforcement.md`](content/rules/gate-enforcement.md) |
| Decide where a new file goes | [`content/rules/directories.md`](content/rules/directories.md) |
| Change how a repository resolves this set | [`content/rules/mcp-connector.md`](content/rules/mcp-connector.md) |
| Add, move, rename, or delete any file in `content/` or `wiki/` | [`content/creators/index-creator.md`](content/creators/index-creator.md) |
| Write a rule or instruction | [`content/creators/instruction-creator.md`](content/creators/instruction-creator.md) |
| Write documentation | [`content/creators/information-creator.md`](content/creators/information-creator.md) |
| Write or change a security file — a policy, a threat model, or a security SOP | [`content/creators/security-creator.md`](content/creators/security-creator.md) |
| Change code or structure that a document describes | [`content/rules/change-propagation.md`](content/rules/change-propagation.md) |
| Touch anything that carries a version number | [`content/rules/versioning.md`](content/rules/versioning.md) |
| Record a release | [`content/creators/changelog-creator.md`](content/creators/changelog-creator.md) |
| Report finished work back to the user | [`content/rules/work-summary.md`](content/rules/work-summary.md) |
| Update a repository against a newer set version | [`content/prompts/agents-update.md`](content/prompts/agents-update.md) — on request only |
| Edit anything under `content/` | [`.agents/rules/content-publishing.md`](.agents/rules/content-publishing.md) |
| Change text that `content/` publishes and this repository also reproduces | [`.agents/rules/set-mirrors.md`](.agents/rules/set-mirrors.md) |
| Record progress, a decision, or session state | [`content/creators/memory-creator.md`](content/creators/memory-creator.md) |
| Decide what may be written to memory, or what must never be | [`content/rules/memory-policy.md`](content/rules/memory-policy.md) |
| Build a repository's instruction, knowledge, or memory system from scratch | [`content/prompts/agents-setup.md`](content/prompts/agents-setup.md) |
| Need the router — which index to read next | [`content/index/root-index.md`](content/index/root-index.md) |
| Need the full list of rules, conventions, and creators | [`content/index/instructions-index.md`](content/index/instructions-index.md) |
| Need release history, and what consumers must do about it | [`content/index/logs-index.md`](content/index/logs-index.md) |
| Need the sibling-server catalogue and their clone URLs | [`content/index/server-registry.md`](content/index/server-registry.md) |
| Activation ran but the workflow still did not happen | [`content/rules/auto-activation.md`](content/rules/auto-activation.md) |
| Need project facts, commands, or orientation | [`.agents/wiki/context/repository-map.md`](.agents/wiki/context/repository-map.md) |
| Work on security, authentication, secrets, or deployment | [`.agents/wiki/security/security-boundaries.md`](.agents/wiki/security/security-boundaries.md) |
| Do anything at all in this repository | [`.agents/rules/repository.md`](.agents/rules/repository.md) |

## Reading order

1. Read `AGENTS.md`.
2. Read [`.agents/index/root-index.md`](.agents/index/root-index.md) — and nothing else
   at this stage. It routes to both sets.
3. From its routing table, pick the ONE index whose scope matches the task, and read
   that index.
4. Only then open the specific file(s) you need.

## Routing protocol

Route by reading index tables, not by reading files. Do NOT load every index. Do NOT
bulk-scan `content/` to build a registry — every file in it is already a tool with a
description, so the tool list is the registry. Do NOT read an instruction body until
that instruction has been selected.

## Iron rule

* `AGENTS.md` and `README.md` are overviews and must never carry detailed rules or
  documentation.
* `.agents/index/root-index.md` and `content/index/root-index.md` are **routers only**.
* An index never teaches. The moment it explains something, that content belongs in a
  real file.
* **One subject per file.** A cross-cutting rule gets its own file and is linked, not
  pasted into a file about something else.
* `wiki/` is for humans and holds this repository's own documentation. It is not part
  of the served instruction set.
* No `INDEX.md`, anywhere, ever.

## Placement

* Universal instruction content → `content/{folder}/{file}.md`, with frontmatter.
  **Published.**
* This repository's own rules → `.agents/rules/{file}.md`.
* Routing → `.agents/index/{scope}-index.md` for local, `content/index/` for shared.
* Agent knowledge → `.agents/wiki/{type}/{file-name}.md`.
* Memory → `.agents/memory/{type}/{file-name}.md`.
* Human documentation → `wiki/{folder}/{file-name}.md`, no frontmatter.
* Release logs → `wiki/logs/{Major}/{Minor}/{Patch}/`.
* Server code → `src/`. Tests → `test/`.

A file added to `content/` is published as a tool on the next boot, so it is not a
draft space — see
[`.agents/rules/content-publishing.md`](.agents/rules/content-publishing.md).
Registration in the owning index rides in the same commit.

## Discovery protocol

Source of truth:
[`content/rules/discovery-protocol.md`](content/rules/discovery-protocol.md).

> While working, if you find an instruction worth adding — a new rule, or content that
> belongs in an existing instruction file — you must NOT create or edit it on your own.
> Present each finding to the user separately, each in its own code block, including
> the target set (local or shared), the proposed file path, `name`, `description`, and
> full body. Let the user select which ones to apply. Create only what the user
> selects. This gate covers instruction files only — writing memory under
> `.agents/memory/` is expected and needs no approval.

## Version rule

Never change the version without explicit user approval — see
[`content/rules/versioning.md`](content/rules/versioning.md). That includes
`package.json`, the compose image tag, and creating a new `wiki/logs/` directory.

## No session links

Never write a link or identifier pointing at an assistant or tool session into a file,
commit message, commit trailer, branch name, tag, pull request, or comment. If your
tooling appends one by default, strip it before committing or posting — see
[`content/rules/no-session-links.md`](content/rules/no-session-links.md).
