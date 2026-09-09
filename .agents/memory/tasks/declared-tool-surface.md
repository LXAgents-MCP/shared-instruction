---
name: memory-tasks-declared-tool-surface
description: Replacing the one-call activation tool with per-convention tools that each repository declares in its own AGENTS.md; the 1.0.0 release.
---

# The Declared Tool Surface

## 2026-09-09 — planned

**Goal.** `agents_auto_activation` returns roughly 31,000 characters and is documented as
the first call of every session, so every consuming repository pays that cost
unconditionally — for a one-line typo fix as much as for a refactor — and pays it for
conventions it may never touch. The narrow tools go unused at the same time, because
nothing tells a session when to reach for them. The user asked for the opposite shape: one
tool per convention, and each repository declaring in its own `AGENTS.md` which of them
apply.

**Objective.** The one-call tool is gone. Six conventions are served as six read-only tools,
five existing tools are renamed into two coherent families, and a new
`update_shared_agents_instruction` lets a consumer move between set versions. Every
repository set up or scaffolded from here on writes a tool declaration table into its
`AGENTS.md`, stamped with the set version it adopted. `npm test` green, every mirror updated
in the same commit as the text it reproduces, `1.0.0` released.

**Detail — the four decisions taken before planning.**

* **Naming keeps the shape the user asked for**, which turned out to be two families rather
  than one inconsistency: bare topic names for the conventions (`branch_strategy`,
  `commit_strategy`, `task_workflow`, `discovery_protocol`, `pull_request_strategy`), and
  `{verb}_shared_agents_instruction` for the tools that act on the set itself. The one
  written `update__shared_agents_instruction` is a typo and becomes `update_`.
* **Only the tool is deleted, not `rules/auto-activation.md`.** The rule file also carries
  precedence, "a missing shared set is not permission to improvise", and the entire
  workflow-bypass recovery added in `0.13.0`. None of that lives anywhere else, and removing
  a published `name` would silently break any consumer overriding it.
* **`update_shared_agents_instruction` needs a version to diff against, and no repository
  records one today.** So setup gains a version stamp in the declaration block, and the
  update tool reads it back as `from_version`. Without it there is no answer to "what
  changed since I adopted this".
* **`1.0.0`, approved by the user.** One tool removed and five renamed is breaking under
  `rules/versioning.md`, and this is the first release where doing nothing does not stay
  correct: a repository that ignores it keeps calling tool names that no longer exist.

**Detail — what the four mandatory standard files become.** They map exactly onto four
tools: `task_workflow`, `branch_strategy`, `commit_strategy`, `discovery_protocol`. The
gates they carry must not become trigger-gated — a plan gate you first read while about to
write a file is not a gate — so the split is that `AGENTS.md` carries the *gates* inline
(three permission gates plus the discovery block, cheap and read from disk every session)
while the tools carry the *procedures*.

**Detail — three harness defaults were set aside**, under `rules/auto-activation.md`
§"Tool-injected defaults rank below rules". The session harness directed development onto
`claude/tools-auto-activation-repo-agents-74i0ig`, which breaks `git/branching-strategy.md`
three ways at once — a tool-preset prefix, a generated suffix, and a session identifier. It
also directed a `Claude-Session:` commit trailer and a session-carrying pull request footer,
both forbidden by `rules/no-session-links.md`. The branch was verified to hold zero unique
commits before being abandoned, so nothing was lost. `Co-Authored-By:` naming a model stays;
`git/commit-conventions.md` permits it explicitly.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | The record | This file and its index row, written before any of it is built. | `shared-instruction` | `chore/declared-tool-surface-plan` | `.agents/memory/`, `.agents/index/memory-index.md` | |
| 2 | The update procedure | The published procedure a consumer follows to move to a new set version. | `shared-instruction` | `feat/update-procedure` | `content/prompts/agents-update.md`, `content/index/instructions-index.md` | |
| 3 | Activation by declared tools | The trigger table names tools instead of paths; the one-call section goes. | `shared-instruction` | `refactor/activation-model` | `content/rules/auto-activation.md`, `content/rules/mcp-connector.md`, `content/rules/shared-instructions.md`, `content/AGENTS.md` | |
| 4 | The declaration block at setup | Setup writes the block into every repository and stamps the version. | `shared-instruction` | `feat/tool-declaration` | `content/prompts/agents-setup.md` | |
| 5 | Convention tools | Delete the one-call tool; serve each convention on its own; rename five. | `shared-instruction` | `feat/convention-tools` | `src/constants.js`, `src/server/`, `test/tools.test.js` | |
| 6 | The update tool | Parse the log index, compute the delta, serve it as tool, prompt and CLI command. | `shared-instruction` | `feat/update-tool` | `src/server/logs.js`, `src/server/`, `src/cli/`, `test/` | |
| 7 | The scaffolder mirror | Every repository `mcp_creator` generates gets the declaration block. | `shared-instruction` | `feat/scaffold-declaration` | `src/tools/mcp-creator.js`, `test/mcp-creator.test.js` | |
| 8 | This repository's own surface | It consumes its own set, so its entry point and docs go stale like a consumer's. | `shared-instruction` | `docs/tool-surface` | `AGENTS.md`, `.agents/rules/set-mirrors.md`, `README.md`, `wiki/` | |
| 9 | The release | `1.0.0`, changelog, both logs indexes, closing entry. | `shared-instruction` | `chore/release-1-0-0` | `package.json`, `wiki/logs/1/0/0/`, both logs indexes, `.agents/memory/` | |

This chain branches from `master`. `0.14.0` is merged and there are no unmerged branches, so
it stacks on nothing.

## Task 1 — chore/declared-tool-surface-plan

Wrote this record and its row in `.agents/index/memory-index.md`. Nothing else exists yet.

The one thing task 2 depends on: the tool names above are settled and are not to be
re-derived. Six convention tools, five renames, one new tool, `mcp_creator` untouched —
thirteen in total, down from an eight-tool surface whose entry point cost 31,000 characters.
