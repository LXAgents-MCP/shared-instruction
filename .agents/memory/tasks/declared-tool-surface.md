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
| 1 | The record | This file and its index row, written before any of it is built. | `shared-instruction` | `chore/declared-tool-surface-plan` | `.agents/memory/`, `.agents/index/memory-index.md` | #54 |
| 2 | The update procedure | The published procedure a consumer follows to move to a new set version. | `shared-instruction` | `feat/update-procedure` | `content/prompts/agents-update.md`, `content/index/instructions-index.md` | #55 |
| 3 | Activation by declared tools | The trigger table names tools instead of paths; the one-call section goes. | `shared-instruction` | `refactor/activation-model` | `content/rules/auto-activation.md`, `content/rules/mcp-connector.md`, `content/rules/shared-instructions.md`, `content/AGENTS.md` | #56 |
| 4 | The declaration block at setup | Setup writes the block into every repository and stamps the version. | `shared-instruction` | `feat/tool-declaration` | `content/prompts/agents-setup.md` | #57 |
| 5 | Convention tools | Delete the one-call tool; serve each convention on its own; rename five. | `shared-instruction` | `feat/convention-tools` | `src/constants.js`, `src/server/`, `test/tools.test.js` | #58 |
| 6 | The update tool | Parse the log index, compute the delta, serve it as tool, prompt and CLI command. | `shared-instruction` | `feat/update-tool` | `src/server/logs.js`, `src/server/`, `src/cli/`, `test/` | #59 |
| 7 | The scaffolder mirror | Every repository `mcp_creator` generates gets the declaration block. | `shared-instruction` | `feat/scaffold-declaration` | `src/tools/mcp-creator.js`, `test/mcp-creator.test.js` | #60 |
| 8 | This repository's own surface | It consumes its own set, so its entry point and docs go stale like a consumer's. | `shared-instruction` | `docs/tool-surface` | `AGENTS.md`, `.agents/rules/set-mirrors.md`, `README.md`, `wiki/` | #61 |
| 9 | The release | `1.0.0`, changelog, both logs indexes, closing entry. | `shared-instruction` | `chore/release-1-0-0` | `package.json`, `wiki/logs/1/0/0/`, both logs indexes, `.agents/memory/` | #62 |

This chain branches from `master`. `0.14.0` is merged and there are no unmerged branches, so
it stacks on nothing.

**PR column:** empty at the time of writing, filled by task 9 once the user opened the §F
gate. Filled here rather than on task 1's branch: task 9 is last and already contains every
branch below it, so writing the numbers here rebases nothing, while writing them on branch 1
would invalidate all eight above it. Task 1's pull request carries the chain as a **body
edit** for the same reason.

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

## Task 5 — feat/convention-tools

Deleted `agents_auto_activation` and `buildActivationPayload`. Registered six convention
tools from `CONVENTION_TOOLS`, renamed five, and rewrote the `initialize` instructions.
**85 tests pass**, down from 86: eight activation tests and the `MANDATORY_STANDARD_FILES`
pin were deleted, seven new ones added.

**Measured, because the whole task is a claim about cost:**

| Called | Characters |
|---|---|
| `branch_strategy` + `commit_strategy` | 5,133 |
| all six at once | 28,965 |
| the old `agents_auto_activation`, every session | ~31,000 |

A session that only branches and commits now pays 5,133 instead of 31,000. Calling *all
six* still costs less than the old opening call, which is the useful bound: the worst case
of the new design beats the best case of the old one. `test/tools.test.js` pins each tool
under 15,000 characters so a future inline cannot quietly rebuild the payload.

**Design notes for anyone changing this later:**

* `CONVENTION_TOOLS` lives in `constants.js` as `{name, uri}` pairs; the prose each tool
  advertises itself with lives in `tools.js` as `CONVENTION_PROSE`. `registerTools` throws
  at boot if a name has no prose, so the two cannot drift into a tool published without a
  description — which several clients will not surface at all.
* `buildModelNamingPayload` is gone. `agents_model_naming_convention` is just another row in
  the loop, and `buildConventionPayload(registry, uri, lead)` serves all six. One builder,
  not six.
* `MANDATORY_STANDARD_FILES` became `MANDATORY_TOOLS` — four names, not four URIs, because
  what is mandatory is now that a repository *declares* them. `registerTools` checks each
  is actually published, so dropping one from `CONVENTION_TOOLS` fails at boot rather than
  leaving `auto-activation.md` promising a call nothing serves.
* A new test asserts **no tool description contains "at the start of every session" or
  "call this first"**. That sentence is what made the old surface expensive, and it would
  come back one helpful description at a time.

`AUTO_ACTIVATION_URI` is kept and still `requireEntry`-checked at boot even though no tool
returns it: the file is the authority every declaration block is built from, and a rename
should fail loudly rather than leave every trigger pointing at nothing.

## Task 6 — feat/update-tool

Added `src/server/logs.js`, `buildUpdatePayload`, the `update_shared_agents_instruction`
tool, the `agents-update` prompt, and a CLI `update [--from <version>]`. **99 tests pass**,
up from 85 — seven in a new `test/logs.test.js`, five for the tool, two for the CLI.

**The parser is the fragile part, so it fails loudly.** `parseReleaseRows` throws on a row
without exactly four cells and on a table with no release rows at all, and
`test/logs.test.js` runs it over the real `content/index/logs-index.md`. The failure it
prevents is specific: a row that stops matching would vanish from an update payload in
silence, and a repository told about four releases when five happened has nothing to notice
the fifth with. It skips the header on the version-cell test rather than on line position,
so prose above the table does not break it.

**Version comparison is numeric, and the test says why.** This set has shipped `0.9.0` and
`0.14.0`; string comparison puts them the wrong way round, which would silently hand a
repository the wrong delta rather than erroring.

**Two modes, chosen by the argument's presence, never by defaulting.** With a version it is
a delta; without one it is a re-sync that says so. Treating a missing version as "since the
beginning" would return every line ever written, most already applied, with nothing marking
which — the worst of both. Two more cases are answered rather than computed: a stamp ahead
of the connector is reported, not applied, and a stamp already current triggers §3(b)/§3(c)
only, because a release changes the set while a repository can still have drifted on its own.

**The prompt and the tool differ here, deliberately, and this is the first place they do.**
A prompt is invoked by a person clicking a button with no arguments to send, so
`agents-update` is always the re-sync path; only the tool takes `from_version`. The payload
states which mode it is in rather than letting the caller assume.

Two test bugs worth recording, since both would have passed while asserting nothing real:
the oldest-first assertion had to be scoped to the table (the heading above it already names
the target version, so a whole-body index passes on a reversed table), and the re-sync test
had to pass `arguments: {}` rather than omitting them — a tool that declares a schema is
called with an object, which is the contract `tools.js` documents.

**SonarCloud found a third defect after the pull requests were open.** `releasesSince`
reduced over the release list with no initial value (`logs.js` L132). Not reachable today —
`readReleases` throws on an empty index before the reduce runs — but the guarantee lived in
a *different function*, so the code sat one refactor away from throwing "Reduce of empty
array with no initial value": true, useless, and pointing at the wrong file. Seeded from the
destructured first element, with two tests pinning that a broken index reports what is
actually wrong with it — no rows, or no index resource at all. 101 tests pass on this
branch, up from 99.

Fixed here rather than on a follow-up branch, because this is where the defect is. The three
branches stacked above were rebased onto the fix rather than merged into, keeping the stack
linear as `planning/task-workflow.md` §C describes.
## Task 7 — feat/scaffold-declaration

Rewrote `buildAgentsDoc` in `src/tools/mcp-creator.js` and pinned it with two tests. **101
pass**, up from 99.

`buildAgentsDoc` is one of the three mirrors `.agents/rules/set-mirrors.md` lists, and the
worst-consequence one: it hard-codes set text into every repository the tool creates, so a
change to the activation model that misses it ships the old model forever, into repositories
nobody will think to re-check. It now emits the declaration block, the inline gates, and the
harness-defaults sentence.

**The scaffolder had to learn the connector version.** The block carries a stamp, and a
stamp is what `update_shared_agents_instruction` reads back — so `scaffoldRepo` and
`buildContext` gained a `sharedSetVersion`, threaded from both surfaces (`tools.js` passes
the `version` already in scope; `run.js` passes the resolved one).

**Called without a version it writes `unstamped — run update_shared_agents_instruction`,
not a guess.** A wrong stamp is worse than a missing one: a missing stamp routes to the
re-sync path by design, while a wrong one produces a confidently wrong delta and nothing
signals it. The second test pins that behaviour, because "just default it to the current
version" is the obvious-looking change that would break it.

One test asserts the generated file contains neither `agents_auto_activation` nor the phrase
"at the start of every session", case-insensitively. That sentence is what made the old
surface expensive, and a scaffolder is exactly where it would quietly come back.

## Task 8 — docs/tool-surface

Rewrote this repository's own entry point and every page that lists the surface: `AGENTS.md`,
`.agents/rules/set-mirrors.md`, `README.md`, `wiki/reference/mcp-surface.md`,
`wiki/information/overview.md`, `wiki/guides/connect-a-repository.md`. 101 tests pass.

**The root `AGENTS.md` now carries a declaration block like any consumer's**, with a third
column naming the `content/` file each tool resolves to — the producer reads the working
tree, not a deployed connector. Its stamp says so in words rather than carrying a version:
this repository tracks its branch, and a release number there would be false the moment
someone edits `content/`. The trigger table kept only the rows for conventions that have no
tool of their own.

**`set-mirrors.md` gained a fourth mirror.** `src/server/create-server.js` restates the
routing model in the `initialize` text every client receives, which makes it set text living
outside `content/` — the definition the rule uses. It had been a mirror since the instructions
were first written and was never listed. The obligation line now also names a change to the
tool set in `src/constants.js`, since adding a tool changes what four of these files claim.

The mirror table also records which is worst to miss: `buildAgentsDoc`, because it ships
into repositories nobody will think to re-check.

**A sweep for stale names came back clean** apart from four categories that must stay:
deliberate historical references in `src/server/tools.js` and two test comments, three tests
asserting the old name is *absent*, released log rows (`versioning.md` — never rewritten),
and past task records. `.agents/memory/state/repository-state.md` still describes an 8-tool
surface; that is current state rather than history, and task 9 corrects it.

## Task 9 — chore/release-1-0-0

`1.0.0`. `package.json`, `wiki/logs/1/0/0/CHANGELOG.md`, both logs indexes,
`.agents/memory/state/repository-state.md`, and this closing entry. **101 tests pass.**

**Verified end to end, not assumed:** 13 tools and 3 prompts over an in-memory MCP client;
`npm run cli -- update --from 0.13.0` returns `0.14.0` then `1.0.0`, oldest first, from the
row this task just added; `branch_strategy` is 2,423 characters through the CLI; and
`git log master..HEAD` carries no session link.

**The release exposed one stale test.** `test/logs.test.js` asserted `current === '0.14.0'`
as a literal, so bumping the version failed a test about the *parser*. It now derives the
newest version from the index and additionally asserts it sorts last — which is what the
test meant all along, and which will not need editing at the next release. A hard-coded
version inside a test about version handling is worth watching for.

**Where this leaves consumers.** This is the first release whose **Consumers must** line is
not optional: five tools were renamed and one removed, so a repository that ignores it calls
names that no longer resolve. No instruction `name` changed, though, so no override needs
dropping — the break is in the tool surface, not in the set.

**The §F gates, both asked and both given.** The user opened the pull request and merge
gates together in a later turn. Pull requests #54–#62 were opened one per branch, #54's body
edited to carry the chain, and the stack merged in order 1…9, each pull request re-targeted
to `master` before its merge rather than after — a forge only re-targets a stacked pull
request when the base branch is deleted on merge, and where that setting is off, pull request
`k` merges into branch `k-1` and the default branch silently stays behind.

**Not done, and deliberately.** No consuming repository was touched — adopting `1.0.0` is
each repository's own task, which is what `update_shared_agents_instruction` exists for.
