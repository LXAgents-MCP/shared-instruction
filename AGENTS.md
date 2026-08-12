---
name: agents-entry-point
description: Entry point for LXAgents/mcp-server — the repository that holds and serves the shared agent instruction set.
---

# AGENTS.md

This repository is `LXAgents/mcp-server`. It holds the shared agent instruction set in
[`content/`](content/) and serves it over MCP as `lxagents-agents-base`. Every other
repository in the organization consumes that set through a connector rather than
copying it.

Working here means you are in **Mode A**: you are editing the shared set itself. A
change to any file under `content/` changes behavior in every consuming repository at
once, so it is versioned and logged like a release.

## Auto-Activation

The instruction set is **always active**. It applies to every task in this repository
whether or not the user mentions it, links to it, or asks for it. Treat these files as
standing orders, not as optional reference material.

At the start of every session, before doing any work:

1. Read `AGENTS.md` (this file).
2. Read [`content/index/root-index.md`](content/index/root-index.md).
3. Match the request against the trigger table below and load the files it names.

If a rule conflicts with a habit, a default, or a template you would otherwise follow,
the rule wins. If it conflicts with an explicit instruction from the user in this
session, the user wins — and you say out loud which rule you are setting aside.

## Trigger table

Mirrors [`content/rules/auto-activation.md`](content/rules/auto-activation.md), which
is the authority. Because this repository *is* the shared set, every `{shared}/…` path
resolves to `content/…`.

| When you are about to… | Load and obey |
|---|---|
| Take in any new request of more than one step | [`content/planning/task-workflow.md`](content/planning/task-workflow.md) |
| Create a branch | [`content/git/branching-strategy.md`](content/git/branching-strategy.md) |
| Write a commit message | [`content/git/commit-conventions.md`](content/git/commit-conventions.md) |
| Open or update a pull request | [`content/git/pull-request-template.md`](content/git/pull-request-template.md) |
| Write **any** commit, tag, PR, comment, or file that will be committed or posted | [`content/rules/no-session-links.md`](content/rules/no-session-links.md) |
| Notice a rule worth adding | [`content/rules/discovery-protocol.md`](content/rules/discovery-protocol.md) |
| Wonder whether something is local or shared | [`content/rules/shared-instructions.md`](content/rules/shared-instructions.md) |
| Decide where a new file goes | [`content/rules/directories.md`](content/rules/directories.md) |
| Change how a repository resolves this set | [`content/rules/mcp-connector.md`](content/rules/mcp-connector.md) |
| Add, move, rename, or delete any file in `content/` or `wiki/` | [`content/creators/index-creator.md`](content/creators/index-creator.md) |
| Write a rule or instruction | [`content/creators/instruction-creator.md`](content/creators/instruction-creator.md) |
| Write documentation | [`content/creators/information-creator.md`](content/creators/information-creator.md) |
| Touch anything that carries a version number | [`content/rules/versioning.md`](content/rules/versioning.md) |
| Record a release | [`content/creators/changelog-creator.md`](content/creators/changelog-creator.md) |
| Need project facts, commands, or orientation | [`wiki/information/architecture.md`](wiki/information/architecture.md) |

## Reading order

1. Read `AGENTS.md`.
2. Read [`content/index/root-index.md`](content/index/root-index.md) — and nothing else
   at this stage.
3. From its routing table, pick the ONE index whose scope matches the task, and read
   that index.
4. Only then open the specific file(s) you need.

## Routing protocol

Route by reading index tables, not by reading files. Do NOT load every index. Do NOT
bulk-scan `content/` to build a registry — `agents://manifest.json` already is one. Do
NOT read an instruction body until that instruction has been selected.

## Iron rule

* `AGENTS.md` and `README.md` are overviews and must never carry detailed rules or
  documentation.
* `content/index/root-index.md` is a **router only**.
* An index never teaches. The moment it explains something, that content belongs in a
  real file.
* **One subject per file.** A cross-cutting rule gets its own file and is linked, not
  pasted into a file about something else.
* `wiki/` is for humans and holds this repository's own documentation. It is not part
  of the served instruction set.
* No `INDEX.md`, anywhere, ever.

## Placement

* Shared instruction content → `content/{folder}/{file}.md`, with frontmatter.
* Routing → `content/index/{scope}-index.md`.
* This repository's human documentation → `wiki/{folder}/{file-name}.md`, no
  frontmatter.
* Release logs → `wiki/logs/{Major}/{Minor}/{Patch}/`.
* Server code → `src/`. Tests → `test/`.

A file added to `content/` is published as a resource on the next boot, so it is not a
draft space. Registration in the owning index rides in the same commit.

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
