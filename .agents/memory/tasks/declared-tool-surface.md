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

## Task 2 — feat/update-procedure

Added `content/prompts/agents-update.md` (`name: agents-update-prompt`) and its row in
`content/index/instructions-index.md`, in this commit. 86 tests still pass, which is the
real check: the registry validates frontmatter, the 140-character description ceiling, and
the instruction folder at boot, so a file it accepts is a file that will publish.

Two decisions inside the procedure that task 6 has to honour when it builds the tool:

* **The delta is applied oldest first**, whatever order the tool returns it in. The lines
  compose — a file added in one release and changed in a later one is left half-applied if
  the newer line lands first, and nothing signals it.
* **Calling with no `from_version` is a different mode, not a default.** It returns the
  re-sync path rather than a delta, because a re-sync can see the current state but not the
  reasons it changed. The tool must therefore branch on the argument's presence rather than
  treating a missing version as "since the beginning".

The version stamp is rewritten **last**, after the edits land. A stamp moved first claims
work that has not happened, and the next update computes its delta from that claim.

## Task 3 — refactor/activation-model

Rewrote `content/rules/auto-activation.md`, `content/rules/mcp-connector.md`,
`content/rules/shared-instructions.md` §H and `content/AGENTS.md`. 86 tests still pass —
they read the set from the registry rather than restating it, so a rewrite of this size
touches no assertion until task 5 changes the surface itself.

**The sentence the whole change turns on:** *always active is not the same as always
loaded.* The old file conflated them, and that conflation is what made session start cost
31,000 characters. Resolving the set and consuming it are now separate acts, and the
session-start sequence stops after the four local reads.

**What was kept deliberately**, because it lives nowhere else: precedence, "a missing
shared set is not permission to improvise", and the whole "When activation runs but the
workflow does not" recovery from `0.13.0`. The recovery's §2 examples were retargeted from
trigger-table drift to declaration-block drift — a missing mandatory tool, a stale stamp, a
row naming a tool that no longer exists.

**The mirroring rule inverted.** A consumer used to reproduce the trigger table row-for-row;
it now declares the subset it uses. The floor is the four mandatory tools plus a version
stamp, and the ceiling is gone — a repository with no `model_name` column anywhere should
not be carrying a row about one. What a consumer still may not do: drop one of the four,
invent a trigger, or repoint a row at a local file.

**The split that keeps this safe.** Gates inline in `AGENTS.md`, procedures behind tools.
A permission gate first read at the moment you are about to write a file has already
failed; a branch-naming procedure fetched at the moment you name a branch has not. Task 4
writes that split into the setup procedure.

`rules/auto-activation.md` also gained a second worked example under "Tool-injected defaults
rank below rules" — a harness that names the branch to work on, in a format the convention
forbids. That is this session, and it belonged in the rule rather than only in this record.

## Task 4 — feat/tool-declaration

Rewrote `content/prompts/agents-setup.md` §4.1(c) and (d), the Mode B tree comment, and four
§7 verify bullets. 86 tests pass.

(c) lost two steps. The six-step sequence is four: every remaining step reads a file in the
repository itself, and the section now says outright that no shared tool is called at session
start. The paragraph that used to name four always-loading files now names the four gates
instead — approve the plan, ask before a pull request, ask before merging, propose rather
than write — because those are the half that has to stand before the work, and the
procedures are the half that can wait for a trigger.

(d) replaced the mirrored trigger table with the **Shared instruction tools** block, and
with four rules for filling it in: the first four rows are mandatory, the rest are selected
rather than mirrored, local instruction rows are appended below, and the version is stamped.

**One decision task 5 must honour.** The block carries a literal `{version}` placeholder,
and `buildSetupPayload` names the concrete version in its preamble rather than substituting
it into the published text. Mutating the text would make the setup payload stop being the
file the resource serves, which is the property `content-publishing.md` asks for and
`test/cli.test.js` pins for the read surface. So: prefix, never rewrite.

A repository that adopts without a stamp is not broken — `agents-update.md` §1 already
handles the unstamped case by falling back to a full re-sync. It just cannot have its
history replayed, only its current state reconciled.
