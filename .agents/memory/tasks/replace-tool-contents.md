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

**Status:** done. Merged in order, #94 to #100, by rebase.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Task record | `chore/replace-tool-contents-plan` |[#94](https://github.com/LXAgents-MCP/shared-instruction/pull/94) |
| 2 | Swap in the new set verbatim, fix tool ids, retire `mcp_list` | `refactor/tool-set` |[#95](https://github.com/LXAgents-MCP/shared-instruction/pull/95) |
| 3 | Add the `release/{version}` branch form to the set | `feat/release-branch` |[#96](https://github.com/LXAgents-MCP/shared-instruction/pull/96) |
| 4 | Make every tool end in itself | `refactor/self-contained-tools` |[#97](https://github.com/LXAgents-MCP/shared-instruction/pull/97) |
| 5 | The `automation` hub | `feat/automation` |[#98](https://github.com/LXAgents-MCP/shared-instruction/pull/98) |
| 6 | Correct current docs and the local set | `docs/tool-surface` |[#99](https://github.com/LXAgents-MCP/shared-instruction/pull/99) |
| 7 | Release `4.0.0` | `release/4.0.0` |[#100](https://github.com/LXAgents-MCP/shared-instruction/pull/100) |

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

### Task 5 — feat/automation

Landed. `content/automation.md` is the 48th tool and the only one that names the others. Id
`automation`; frontmatter `name: Read this tool every session`; the description opens with the
same words so a client listing tools shows them.

- **What it holds.** The rules of use (read once, call nothing else yet, call a tool only when its
  condition is true, never "just in case", call in the order the work reaches them), then one row
  per other tool — 47 rows in eight groups, each `` `id` — condition ``. It is a manifest with
  conditions, not a copy of any tool's text. 5.6 KB, about 1.5k tokens; the test ceiling is 10 KB.
- **Where the conditions come from.** Each is taken from that tool's own description and body
  (`branching_strategy` before a branch is created, `commit_conventions` before a commit message,
  `github_authentication` before any `gh` call), and from the routing the old set carried where a
  tool already existed. Docs and format tools fire on the file type; forge tools fire on the
  operation.
- **One condition is broader than the old rule.** `shared_instructions` is routed to "any request
  that will write a file, commit, or change state", so a read-only question does not pay for it.
- **One sentence added that no source tool carried.** "If a tool named here is not in your tool list,
  say so in your first message and work from what you have; never rebuild a missing tool from
  memory." It replaces the unavailable-connector obligation that went with the deleted
  connector rule.
- **`src/server.js`.** The `initialize` instructions now send a session to `automation` first,
  once, and say each tool is complete on its own. This is the mirror of the hub's own wording.
- **Tests.** The hub is the first tool listed; its description opens with the name; it routes every
  other tool exactly once and no tool that does not exist; every condition is 20–200 characters; it
  stays under 10 KB; the server's instructions name it and say "every session". Each of the first
  three checks was mutation-proven by dropping a row, adding a phantom row, and padding the file.
  The pointer guard from task 4 also needed a fix: for a root-level file, "its path without `.md`"
  is one ordinary word, so it matched prose.

**The read is text, not mechanism.** A read-only server cannot make a client call a tool. What
makes an agent read it is the description, the `initialize` instructions, the repository's
`AGENTS.md` (task 6), and these tests pinning the wording. The tests prove the sentences exist,
not that anyone obeys them.

**Left for later tasks.** `AGENTS.md`, `README.md`, the wiki and the local indexes still say "call
nothing at session start" and name removed tools (task 6).

### Task 6 — docs/tool-surface

Landed. Every current document that named a removed tool, path or claim now describes the new
surface. History was left as written: `wiki/logs/0..3/`, the older task records, decisions and
findings, and the release rows in `.agents/index/logs-index.md`.

- **`AGENTS.md`.** Session start now reads `automation` as step 2 — "beyond `automation`, call no
  shared tool at session start". The declaration block gains an `automation` row. The shared
  trigger table is **gone**: `content/automation.md` is the one authority for when each shared
  tool fires, so the table is not copied (a second table is a second place to forget). The five
  rows that are this repository's own stay. The §H citation became §D, the one the new
  `shared_instructions` actually has. `agents://`, `mcp_list`, `root_index`,
  `agents_entry_point` and the "Authority: mcp-connector" line are removed.
- **Local set.** `root-index` and `agents-index` route the shared set to `content/automation.md`.
  `set-mirrors` drops the `agents-setup` row (the file is deleted), stops mirroring a trigger
  table, and no longer cites a clause the new `shared_instructions` does not contain.
  `content-publishing` pins the new properties, gains *Each tool ends in itself* and *The hub is
  part of the surface*, and drops the `content/index/logs-index.md` step. `repository.md` Docker
  tags are `<version>` instead of a stale `3.1.0`. `repository-map` loses the deleted
  `src/content.js` and `instruction.js`.
- **State.** `repository-state` has a new 2026-10-09 section, and the 2026-09-30 section is marked
  superseded where it differs rather than rewritten.
- **Human docs.** `README`, `mcp-surface`, `overview`, `architecture`, `security-model`,
  `setup`, `connect-a-repository` and `install-as-local-mcp`. The adoption guide no longer
  tells a reader to call `agents_setup` or `duplicate_instruction_audit`; it describes the same
  steps as things the owner asks for. Test counts were dropped rather than updated, since a
  hand-kept count goes stale at the next test.
- **Link check.** All relative links in the current documents resolve except three that were
  already broken on `master` and are not made false by this change: two in
  `.agents/rules/repository.md` (`../wiki/…` should be `../../wiki/…`) and one in
  `.agents/index/memory-index.md` (`sse-to-mcp-transport.md`). Left alone.

**Left for task 7.** The version, the changelog, the logs-index row, and filling the `PR` column.

### Task 7 — release/4.0.0

Committed. Version `4.0.0` — the owner approved it with the plan — in `package.json` and
`package-lock.json` (`npm version 4.0.0 --no-git-tag-version`, so no tag exists). It is a major
because tools are removed: 35 become 48, with 13 removed, 26 added and 22 kept under the same id.

- **`wiki/logs/4/0/0/CHANGELOG.md`**, with the *Consumers must* line filled: read `automation`
  every session; delete every row, call and override naming a removed tool (all thirteen are
  listed); re-read the 22 tools that changed; restart open sessions; do not rely on
  `shared_instructions` §H.
- **`.agents/index/logs-index.md`** gains the `4/0/0` row, newest first. `content/index/logs-index.md`
  no longer exists, so there is only one place to add it.
- **`package-lock.json`** was at `3.1.0` while `package.json` was at `3.4.0`; both are `4.0.0` now.
- **`repository-state`** names the version.

**Two things the record cannot do yet.** The `PR` column stays empty and the status stays open
until the pull requests exist, because their numbers do not. They need the owner's yes, which has
not been asked for, and merging needs a second one. Once they are open, one more commit on this
branch fills the column — it touches only the last branch, so nothing below it is rebased — and the
record is marked done after the merge is verified against `master`.

**Open, for the owner.** The contradictions listed under Task 4. The three links broken before this
work. Whether to create the `v4.0.0` tag, which this work does not.

**One test failure, not explained.** On the first full `npm test` of this task,
`MCP_CLUSTER_WORKERS=2 binds the port from two separate workers` in `test/http.test.js` failed. It
passed alone, three times in the HTTP file alone, and twice more in the full suite (54 of 54). That
test waits for two worker processes to print their startup line, so it depends on how fast the
machine forks under load; this task changed only documents and the version. No root cause was found,
so none is claimed, and the test was not changed. If it recurs on CI it is a real finding to chase.

### Closing entry

Pull requests #94–#100 were opened on the owner's yes, then merged in order 1…7 by rebase,
each branch rebased onto `master` after the one below it merged and deleted as it merged. Rebase
rewrites commits, so the SHAs on `master` are not the SHAs these branches were pushed with, and
"is the branch an ancestor of `master`" cannot be the check; the check is that `master`'s tree equals
the last branch's tree. This commit — the `PR` column and this status — is the one follow-up the
release task needed, since the numbers did not exist until the pull requests did. It touches only
the last branch, so nothing below it was rebased because of it.

