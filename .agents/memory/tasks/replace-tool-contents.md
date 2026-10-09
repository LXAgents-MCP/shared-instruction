---
name: memory-tasks-replace-tool-contents
description: Replacing every published tool with the owner's re-created set, making each tool self-contained, adding the automation hub and the release/{version} branch form; the 4.0.0 release.
---

# Replace the Tool Contents

## 2026-10-09 — in progress

**Goal.** The server serves only the owner's re-created tool set, plus one hub tool that
agents read every session and that says when to load each other tool.

**Objective.** `content/` holds the 47 files of the owner's source repository plus
`automation.md`, and nothing else. No old file or tool name survives in `content/` or `src/`.
Every tool except `automation` is self-contained. `automation` lists all 47 others with the
condition that activates each. The server boots and `npm test` is green.

**Detail.** Edit this repository only. The source repository `tool-contents` is read-only and
the owner will delete it, so nothing here may depend on it afterwards: files are copied, never
linked.

**Status:** open. Tasks 1–4 of 7 landed.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Task record | `chore/replace-tool-contents-plan` | |
| 2 | Swap in the new set verbatim, fix tool ids, retire `mcp_list` | `refactor/tool-set` | |
| 3 | Add the `release/{version}` branch form to the set | `feat/release-branch` | |
| 4 | Make every tool end in itself | `refactor/self-contained-tools` | |
| 5 | The `automation` hub | `feat/automation` | |
| 6 | Correct current docs and the local set | `docs/tool-surface` | |
| 7 | Release `4.0.0` | `release/4.0.0` | |

Branches stack: task 1 from `master`, task `k` from task `k-1`.

## Decisions the owner approved with the plan

| # | Decision |
|---|---|
| D1 | Seven convention-named stacked branches, not the harness-named `claude/…` branch. The release branch is `release/{version}` with no `v`, because the git tag already carries it (`v4.0.0`). |
| D2 | Version `4.0.0` — tools are removed and renamed, so it is a major. |
| D3 | `mcp_list` is retired. It served `index/server-registry.md`, which the new set drops. |
| D4 | Self-containment inlines the one fact a pointer carried, and drops pointers that were only navigation. |
| D5 | Tool ids stay derived from the filename. The 13 files under `skills/github` and `skills/gitlab` get explicit overrides, because four filename pairs collide and boot refuses a collision. |
| D6 | `automation` is named "Read this tool every session"; its description opens with the same words. No MCP `title` support is added. |
| D7 | Current docs are corrected in task 6. History (`wiki/logs/0..3`, older task records, decisions, findings) is left as written. |

`automation` is a manifest with activation conditions, not a copy of every tool's text. Embedding
all 47 would defeat the token saving it exists for.

## Known tension, recorded now and listed in full by task 4

The new contents are written for a plain-files workspace. `rules/shared-instructions.md` and
`rules/repository.md` say no MCP server serves them and that routing lives in each consumer's
`AGENTS.md`; `rules/repository.md` and `skills/engineering/mcp-server.md` describe "this
workspace". Published here, they reach every consumer. Their meaning is not changed.

## Task entries

### Task 1 — chore/replace-tool-contents-plan

Landed: this record and its row in `memory-index.md`. The `PR` column is filled by task 7, not
here, so no later branch needs a rebase. Nothing under `content/`, `src/` or `test/` changes in
this task. Task 2 depends on nothing from this entry except the plan above.

### Task 2 — refactor/tool-set

Landed. `content/` is the owner's 47 files, byte-identical to the source repository
(`diff -r` is empty). 34 old files are gone: 22 overwritten and 12 with no successor
(`AGENTS.md`, the four `index/` files, `planning/task-workflow`, both `prompts/agents-*`,
`rules/{auto-activation,duplicate-instruction-audit,mcp-connector,mcp-tool-availability}`).

- **Ids.** `NAME_OVERRIDES` is now exported and holds the 13 forge pages
  (`github_actions` … `gitlab_repositories`); the `AGENTS.md` override is gone with its file.
  Boot now throws on an override that matches no file, so a rename cannot leave one inert.
- **`mcp_list` retired.** `src/tools/mcp-list.js` deleted, with `src/tools/instruction.js` and
  `src/content.js`, which nothing imported once it went. The surface is 47 generated tools and
  no hand-written one.
- **Tests.** Frontmatter is two fields, `name` and `description`; the new set carries no
  `version` or `author`. Removed the tests that pinned deleted files: the shared-procedure
  check on creators, `instructions_index`, `auto_activation`, and the six `mcp_list` tests.
  Added override and forge-naming checks. 47 pass, 0 fail.
- **`src/server.js`.** The `instructions` string no longer names `root_index`,
  `agents_entry_point` or `mcp_list`. Task 5 rewrites it for `automation`.

**Left for later tasks.** The files still link to each other, and 25 of those links point at
files that do not exist (task 4). Docs and the local set still name the removed tools
(task 6). `package-lock.json` drifted to `3.4.0` under `npm install` and was reverted; it
belongs to task 7.

### Task 3 — feat/release-branch

Landed. The release task's branch is `release/{version}` — the full `Major.Minor.Patch`, no
`v`, because the git tag already carries it (`v1.0.0`). Stated in each tool that names branches,
in its own words:

- `plan_creator` — the slot table row and a §C bullet: the form, that `release` is a branch type
  for this form alone while a release commit stays `chore(release): …`, that the task list shows
  the placeholder until the version is approved, and that each repository's release branch carries
  its own version. §F adds that the branch is not created before that approval.
- `branching_strategy` — description, naming rule, allowed types, good and bad examples
  (`release/v1.0.0`, `release/next`, `release/1.0`, `chore/release-1.0.0`), a *The release
  branch* section, and the cross-repository sentence, which otherwise demanded the same branch
  name in every repository.
- `branch_and_commit` — step 5 and the *Branch names* section, which repeat the type list.
- `github_token_access_guide` — its example branch `chore/release-1.2.3` is now `release/1.2.3`.

`commit_conventions` is unchanged: `release` is not a commit type.

**No tag is created, and no tool tells an agent to create one.** A tag is a version carrier and
needs its own approval.

Two tests pin the wording: each of the three branch-naming tools contains `release/{version}`
and no `v`-prefixed form outside the bad-examples table, and no tool but `branching_strategy`
still shows `chore/release`. A typo guard, not a control. 18 pass in `server.test.js`.

**For task 4:** this is the only deliberate change to the owner's wording. Task 4's diff against
this branch should be links and pointers and nothing else.

### Task 4 — refactor/self-contained-tools

Landed. No tool except `automation` (task 5) links to, names, or sends the reader to another
tool. Before: 321 links across 44 of the 47 files, 25 pointing at files that do not exist in the
set, about 60 filename mentions in prose, and one reference to a section that was never there.
After: none, and `server.test.js` fails if one comes back — a link, another tool's path, or
another tool's id or frontmatter name. The test was mutation-checked: adding a link, a path and
two ids to one file made it fail on all four.

**Method.** Navigation-only pointers were deleted: 20 `Related` and `See also` sections in
`skills/`, and the identical `Related` ownership table in the six creators that carried it.
Where a sentence leaned on another tool for a fact, the fact was written in (D4): the branch
type list and commit format in `plan_creator`, the pull request title and body shape, the
`pat()` helper in `github_authentication`, the connector-restart cure in `mcp_builder`.
References to the consumer's own `AGENTS.md` stay as plain text, since it is not a tool.

**One allowlist, stated in the test.** `anthropic-agent-skills` names Anthropic's own
`skill-creator` and `mcp-builder` skills. They share a name with two tools here and are facts
about another vendor, not pointers.

**One rule reversed on purpose.** `instruction_creator` said "Facts live once, and every other
file links to them", "Link, do not inline", and refused "inlining another file's content". That
is the opposite of what the owner asked for, so the three sentences now say the reverse: a tool
states the one fact it needs in a sentence of its own, never by pointing, and still does not copy
a neighbour's procedure. The owner's instruction was explicit; this is recorded so it is a
decision and not a surprise.

**Contradictions left as written, for the owner to decide.** The contents were written for a
plain-files workspace and are now served by an MCP server. These sentences say otherwise:

| Tool | What it says |
|---|---|
| `shared_instructions` | "This workspace runs on plain `.md` files. No MCP server serves them"; the activation contract "lives in … `AGENTS.md` and nowhere else" |
| `repository` | "This workspace runs on plain files … No MCP server serves any of it"; the shared set was served over MCP and "that server is gone" |
| `mcp_server` | The copy of this very server's set "is now authoritative and the server is gone" |
| `instruction_creator` | "one set — plain `.md` files, with no server serving them"; refuses "anything that assumes an MCP server" |
| `index_creator`, `information_creator`, `memory_creator`, `changelog_creator`, `security_creator` | "There is no second instruction set … no server serving them, no plugin, no connector" |
| `directories` | refers to a "second instruction set" as something that does not exist |

The `shared_instructions` sentence about routing living only in `AGENTS.md` also disagrees with
the `automation` hub that task 5 adds.

**Left for later tasks.** `automation` (task 5). Docs and the local set still name the removed
tools (task 6).

