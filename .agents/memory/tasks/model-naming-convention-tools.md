---
name: memory-tasks-model-naming-convention-tools
description: Publishing the {platform}/{model} naming convention as a shared rule, and the two read-only tools that serve it to an Agents IDE.
---

# Model Naming Convention and Its Tools

## 2026-08-28 — planned

**Goal.** The shared set says nothing about how a stored model identifier is formed. A
repository that writes `model_name` into `chat_message_embeddings` therefore invents its
own shape, and the shapes disagree: `text-embedding-3-small` from a direct OpenAI call and
`openai/text-embedding-3-small` from an OpenRouter call are the same model under two names,
and nothing downstream can tell. Publishing the convention is what lets an Agents IDE build
multi-platform support — OpenRouter as a core, or a direct API call — without guessing.

**Objective.** Two new **read-only** tools on the `lxagents-agents-base` connector, named
for the content they serve, backed by a new published rule in `content/rules/`. `npm test`
green. Every place that lists the tool surface updated in the same round.

**Detail.**

* The rule is **shared**. The routing question in `directories.md` is *is this true for more
  than this repository?* — a cross-provider naming format is true for every repository that
  stores one, so it goes in `content/` and is published, not into `.agents/`.
* The tools **read the rule from the frozen registry**. `repository.md` requires it and
  `set-mirrors.md` explains the cost of the alternative: hard-coded set text is a new mirror
  to maintain, and `src/tools/mcp-creator.js` is the standing example of one that drifted.
* `model_name_format` is the second tool and it is not a text tool: it applies the rule's
  construction logic to a `platform` and a `platform_model` and returns the normalized name.
  That is deliberate. A convention an IDE can only *read* still has to be re-implemented at
  every call site; one it can *call* has a single answer. It stays read-only — no I/O, no
  writes, same output for the same input.
* A change under `content/**` is published on the next boot and is a release
  (`content-publishing.md`), so task 5 is a real release with a version, a changelog, and a
  row in both logs indexes.

**Branches.** The session was configured to develop on `claude/model-naming-convention-tools-rzudan`.
The user overrode that mid-round and asked for the repository convention instead, so the
work is stacked across five `{type}/{primary-noun}` branches per `branching-strategy.md`.
The tool-preset branch carries no commits and is left where it is.

**Version.** `0.11.0` proposed — a **minor** bump, because this adds a rule and a file and
removes nothing. Not staged until the user approves it; `versioning.md` treats a staged bump
as a bump.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/model-naming-convention-tools-plan` | This file, and its `memory-index.md` row. | #30 |
| 2 | `feat/model-naming-convention` | `content/rules/model-naming-convention.md`, its index row, its trigger row, and both `AGENTS.md` mirrors. | #31 |
| 3 | `feat/model-naming-tools` | `model_naming_convention` and `model_name_format`, the payload builder behind them, and their tests. | #32 |
| 4 | `docs/model-naming-surface` | Every place that lists the tool surface: the connector rule, `mcp-surface.md`, `overview.md`, `README.md`, the state file. | #33 |
| 5 | `chore/release-0-11-0` | Version, changelog, both logs indexes, and the closing entry here. | #34 |
| 6 | `docs/model-naming-openrouter` | The OpenRouter rationale on the rule, the approved `work-summary` mirror row, and the changelog fold-in. | #35 |

## Per-task record

### Task 1 — `chore/model-naming-convention-tools-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

Recorded here because it decided the shape of everything after it: **the rule is written
first and the tools are written second**, not the other way round. The request asked for
tools; the tools cannot be built correctly without deciding where their text lives, and the
answer that keeps them from drifting is "in `content/`, read at boot". Task 2 therefore
publishes a file that nothing calls yet, and task 3 calls it.

### Task 2 — `feat/model-naming-convention`

`content/rules/model-naming-convention.md` is published: the `{platform}/{model}` format,
lowercase-before-the-write, and the construction line for a direct API integration.

Placed in `rules/` rather than a new folder. `directories.md` §B offers `database/` and
`api/`, and both are near misses — this is not a schema rule and not an API design
standard, it is a naming convention for a value that crosses both. `rules/` is the folder
for repository-wide rules, and creating a folder for one file would have needed a row in
`directories.md` §B and its own index besides.

The rule ends in a four-point checklist because `instruction-creator.md` requires a reader
to be able to tell whether they complied. "Follow the convention" is not checkable; "exactly
one `/`, both segments non-empty, all lowercase, normalized before the write" is — and it is
what task 3's `model_name_format` implements, so the rule and the tool cannot disagree
without a test failing.

Registered in `content/index/instructions-index.md`, given a trigger row in
`auto-activation.md`, and mirrored into the root `AGENTS.md` trigger table in the same
commit — `set-mirrors.md` names that table as a mirror, so the row exists in both places or
the rule never fires here. `content/AGENTS.md` gains a row in the shared/local split table.

69 tests still pass. That is the meaningful check for this task: the four boot invariants in
`content-publishing.md` — frontmatter, a unique `name`, a description of 139 of the 140
permitted characters, and a declared folder — are all enforced at registry load, so a bad
file would have failed the suite rather than shipped.

### Task 3 — `feat/model-naming-tools`

Two read-only tools, named for the content they serve:

| Tool | Args | Returns |
|---|---|---|
| `model_naming_convention` | none | The published rule, whole, from the registry. |
| `model_name_format` | `platform`, `platform_model` | `{ model_name, platform, model, normalized }`. |

`buildModelNamingPayload` in `payloads.js` follows `buildSetupPayload` exactly: it reads
`agents://rules/model-naming-convention.md` through `requireEntry` and prefixes the
connector preamble. No rule text is written into `src/`, so `set-mirrors.md` gains no new
row — that was the constraint the whole shape was chosen for.

`src/tools/model-name.js` holds the composition, beside `mcp-creator.js`. It is a pure
function: no I/O, no clock, no filesystem, same output for the same input, which is what
lets `model_name_format` claim `readOnlyHint` and `idempotentHint` honestly rather than by
assertion.

**It refuses rather than guesses.** A `platform_model` that already carries its platform
prefix is an error naming the segment to pass instead, because the silent alternative
writes `openai/openai/text-embedding-3-small` — a name nothing downstream can compare,
which is the exact failure the convention exists to prevent. A blank segment is refused on
the same grounds.

Three tests earn their place beyond the happy path:

* the payload **ends with** the registry entry's own text, so the tool cannot drift from
  the published rule without failing;
* the rule's four-point checklist is run against the tool's output across three inputs, so
  the rule and its implementation cannot disagree silently;
* the read-only sweep now covers every tool except `mcp_creator`, instead of only names
  starting with `agents_`. The old filter would have passed a new tool that quietly
  declared itself a writer.

`buildInstructions` in `create-server.js` names both tools, so a client sees them at
`initialize` rather than having to enumerate the surface first — which is the point, for an
IDE deciding how to store a model identifier.

76 tests pass, up from 69.

### Task 4 — `docs/model-naming-surface`

Every place that lists the tool surface, updated in one commit rather than left to be
found later:

| File | What was stale |
|---|---|
| `content/rules/mcp-connector.md` | The published surface table — two Tool rows. |
| `wiki/reference/mcp-surface.md` | The tools table, the resource list, and a new section on the two tools. |
| `wiki/information/overview.md` | The surface table, and "26 of them" for the instruction files. |
| `README.md` | "five tools — four read-only", and the resource count. |
| `.agents/memory/state/repository-state.md` | 26 files, 27 resources, 5 tools. |

The counts were the part most likely to be missed, and `0.6.1` exists because they were:
that release shipped only because the connector surface table had said four tools since
the day it began exposing five. Grepping for `26 files`, `five tools`, and `four read-only`
found the last stale count in the state file, which no table of contents points at.

`content/rules/mcp-connector.md` is published, so this task is part of the same release as
task 2 — a consumer reading the connector rule sees the two new tools listed there.

**Deliberately not changed:** the CLI. `lxagents-agents read model-naming-convention`
already serves the rule from the same registry, so the convention is reachable in CLI mode
without a new command; `model_name_format` computes rather than serving set text, and
`cli.test.js` pins CLI/MCP parity only for the payloads both surfaces deliver. Adding a
command would be new surface, not parity. Raised as an option, not taken.

### Task 5 — `chore/release-0-11-0`

`0.11.0`, approved by the user before anything was staged: a **minor** bump, because the
round adds a rule and a file and removes nothing. `package.json`, `package-lock.json`, a
new `wiki/logs/0/11/0/CHANGELOG.md`, and a row in both logs indexes.

The **Consumers must** line is the whole point of the entry and it names one action: add
the `model_name` trigger row to `AGENTS.md`, after the "Record a release" row so the
mirrored table stays in order, then read the rule before writing to a `model_name` column.
`auto-activation.md` forbids reordering mirrored rows, so naming the position is not
pedantry — a consumer who appends it anywhere else has a table that no longer mirrors the
authority.

No session digest: `.agents/memory/sessions/` is empty, so `changelog-creator.md`'s
fold-and-delete step had nothing to fold.

`compose.yaml` still tags the image `0.0.0` and was left alone — a deliberate local-build
placeholder since the first release, not an oversight this round should quietly fix.

The state file's merge paragraph was corrected as well as advanced: it claimed `master` was
at `dd87eee` with `0.10.1` unmerged, which stopped being true when `0.10.1` and the
install-before-test round landed. That paragraph is the one a next session plans a branch
point from, so a stale one is worse than none.

## Task 6 — `docs/model-naming-openrouter`

Added after the chain was already open, on the user's instruction, and stacked on top of
the release rather than pushed into task 2. Pushing to `feat/model-naming-convention` would
have invalidated the three branches above it and forced a rebase of the whole stack; a new
branch on top costs nothing, which is the same reasoning §F gives for never pushing to
branch 1 to back-fill pull request numbers.

**The consequence, stated rather than hidden:** the release is task 5 and the work is task
6, so for this record the reserved release slot is not last. Folding the changelog
amendment into task 6 is what keeps that honest — `0.11.0` is unmerged, so this is
amending an unreleased entry, not rewriting a released one, which `changelog-creator.md`
forbids.

### The content

The user's note said the project uses OpenRouter as its core AI API. **That sentence was
generalised rather than copied.** `directories.md` forbids anything repository-specific in
the shared set, and this file is published to every consumer — most of which do not use
OpenRouter. What is universal is the design fact underneath it: the format *is*
OpenRouter's, deliberately, so a repository using it as a core passes a stored name
straight through, a direct integration builds the same string, and switching between them
is configuration rather than a migration.

The new section sits **before** `## Direct API integrations` because it is the reason that
section exists. The overlapping bullet under "Why this is a rule and not a preference" was
trimmed to a pointer rather than left to say the same thing twice.

### The finding

`AGENTS.md` gains the `work-summary` trigger row, which the user selected from the finding
raised at the end of the previous round. It had been missing since `0.4.0`: `set-mirrors.md`
calls that table a row-for-row mirror of `auto-activation.md`, and it was one row short — so
the rule telling an agent to report finished work never fired from a trigger in the
repository that publishes that rule.

Not applied on the agent's own initiative. It was proposed, the user selected it, and only
then was it written — which is the whole shape `discovery-protocol.md` asks for.

76 tests still pass.
