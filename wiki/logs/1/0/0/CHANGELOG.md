# 1.0.0

**Released:** 2026-09-09

Replaces the single `agents_auto_activation` call with one read-only tool per convention,
and moves the routing decision into each repository's own `AGENTS.md`. Session start no
longer costs 31,000 characters.

**Consumers must:** edit your `AGENTS.md`. This is the first release where doing nothing
does **not** stay correct — five tool names changed and one was removed, so a repository
that ignores this keeps calling tools that no longer exist.

1. **Replace your trigger table with a Shared instruction tools block.** Full shape and
   rules in `prompts/agents-setup.md` §4.1(d). The four rows every repository carries:

   ```
   ## Shared instruction tools

   Adopted shared-set version: `1.0.0`

   | When you are about to…                     | Call                 |
   |--------------------------------------------|----------------------|
   | Take in any request of more than one step  | `task_workflow`      |
   | Create a branch                            | `branch_strategy`    |
   | Write a commit message                     | `commit_strategy`    |
   | Notice a rule that should exist            | `discovery_protocol` |
   ```

   Add `pull_request_strategy` and `agents_model_naming_convention` if you use them, keep a
   row for every other convention you rely on, and **append your own local instruction
   rows** below. Drop the rest: a narrower table is the point.

2. **Move the gates inline.** The three permission gates and the discovery-protocol block
   go in the contract paragraph above the table, not behind a call. A gate first read at the
   moment it should have applied has already failed.

3. **Rename every tool you call.** `agents_setup` → `setup_shared_agents_instruction`,
   `agents_check_duplicate_instructions` → `check_duplicate_shared_agents_instruction`,
   `agents_list_instructions` → `list_shared_agents_instruction`, `agents_read_instruction`
   → `read_shared_agents_instruction`, `model_naming_convention` →
   `agents_model_naming_convention`, `model_name_format` → `agents_model_name_format`.

4. **Stamp the version**, last, after the edits land.

`update_shared_agents_instruction` performs all four and reports what it changed. No
override needs dropping: no instruction `name` was renamed or removed, so a local file that
overrode a shared one still overrides it.

## Added

- **Six convention tools**, one content file each, on a trigger rather than at session
  start: `task_workflow`, `branch_strategy`, `commit_strategy`, `discovery_protocol`,
  `pull_request_strategy`, `agents_model_naming_convention`. The first four are declared by
  every repository; the rest are declared by the repositories that use them.

- **`update_shared_agents_instruction`**, and the `agents-update` prompt behind it. Given
  the version a repository adopted, it returns the **Consumers must** line for every release
  since — oldest first, because the lines compose and applying a newer one first leaves an
  older edit silently unmade. Given nothing, it returns a re-sync instead of a history: a
  missing version is a different mode, not a default. A stamp ahead of the connector is
  reported rather than applied. **On request only** — it edits `AGENTS.md`.

- **`prompts/agents-update.md`**, the procedure it serves.

- **A version stamp in every repository's `AGENTS.md`.** `setup_shared_agents_instruction`
  writes it, `mcp_creator` writes it into every repository it scaffolds, and the update tool
  reads it back. A repository created without one writes `unstamped` rather than a guess —
  a wrong stamp yields a confidently wrong delta, while a missing one routes to the re-sync
  path by design.

- **A CLI `update [--from <version>]`**, matching the tool, and `src/server/logs.js`, which
  parses the release history out of `index/logs-index.md`.

## Changed

- **Activation is declared per repository, not fixed by the set.**
  `rules/auto-activation.md` is rewritten around one sentence: *always active is not the
  same as always loaded.* The session-start sequence drops from six steps to four, and every
  remaining step reads a file in the repository itself.

- **A consumer no longer mirrors the trigger table row-for-row.** It declares the subset it
  uses. The floor is the four mandatory tools plus a stamp; there is no ceiling. A
  repository that stores no model identifier should not be carrying a row about one.

- **Gates inline, procedures behind a tool.** `rules/shared-instructions.md` §H now says
  which half is which, and why: a permission gate fetched at the moment you are about to
  write a file has already failed, while a branch-naming procedure fetched as you name a
  branch has not.

- **Five tools renamed** into two families — bare topic names for conventions,
  `{verb}_shared_agents_instruction` for the tools that act on the set. See **Consumers
  must** above for the mapping.

- **The `initialize` instructions** no longer tell a client to call anything first.

## Removed

- **`agents_auto_activation`.** It returned the activation rule, four whole instruction
  files and a routing table — about 31,000 characters — and was documented as the first call
  of every session, so every repository paid it for a one-line typo fix as much as for a
  refactor. Measured replacement: `branch_strategy` + `commit_strategy` is 5,133 characters;
  `task_workflow` alone is 11,778; **all six together are 28,965**, so the worst case of the
  new surface is cheaper than the best case of the old one. Each tool is pinned under 15,000
  characters by test.

  Nothing was lost with it. `rules/auto-activation.md` is still published and still the
  authority every declaration block is built from — only the one-call payload is gone.

## Fixed

- **`src/server/create-server.js` was an unlisted mirror.** Its `initialize` text restates
  the routing model to every client that connects, which makes it set text living outside
  `content/` — and it was not in `.agents/rules/set-mirrors.md`. It is now, alongside a note
  that a change to the tool set in `src/constants.js` puts four files in scope.
