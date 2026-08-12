---
name: information-creator
description: Creates and maintains both wiki trees — routes every page by audience first, and never mirrors a fact between them.
---

# Information Creator

Creates and maintains **both** wiki trees. Its first job on every page is to pick the right
one.

## Route by audience

Apply the audience test from
[`../rules/directories.md`](agents://rules/directories.md):

| The page is… | It goes to | Frontmatter |
|---|---|---|
| Documentation a human contributor reads to understand or use the project | `wiki/{folder}/{file-name}.md` | No |
| A procedure, constraint, or framing that exists so an agent behaves correctly | `.agents/wiki/{type}/{file-name}.md` | Yes |
| Wanted by both audiences | `wiki/`, with the agent page linking to it | — |

Both wiki trees are **local**. The shared set carries no wiki pages beyond its own release
logs.

## Never mirror content between the trees

**Facts live once, in `wiki/`.** The agent page carries the agent-specific procedure or
framing and links to the human page for the underlying facts. If a page starts restating
the human wiki, delete the restatement and leave the link. A duplicated fact is a fact that
will go stale on one side.

## Procedure

1. Apply the audience test.
2. Pick or create the right folder (`wiki/`) or `{type}` (`.agents/wiki/`). If nothing
   fits, create one — lowercase kebab-case, a plain topic noun — and register it in
   [`../rules/directories.md`](agents://rules/directories.md) in the same commit.
3. Write the page: one `#` H1, task-oriented, **real commands from this repository**. No
   placeholder pages full of TODOs — fewer, real pages.
4. Register it in `project-wiki-index.md` or `agent-wiki-index.md`.
5. If the change is user-facing, check `README.md` still points at the right pages.
6. Commit.

## What this creator refuses

* Letting `README.md` grow past an overview. Detail that creeps in is moved down into
  `wiki/`.
* Writing into the instruction folders — that is
  [`instruction-creator.md`](agents://creators/instruction-creator.md).
* Writing memory — that is
  [`memory-creator.md`](agents://creators/memory-creator.md).
* Creating a third documentation tree. `docs/` and `documentation/` are forbidden.

## Branch & Commit Convention

Applies to every commit this creator makes.

**Branches** — `{type}/{primary-noun}`, from `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore`, `revert`. Branch off the default branch; one task
per branch, one pull request per branch. Never commit directly to the default branch,
never use a tool-preset prefix (`claude/`, `codex/`, `cursor/`), never add a generated
suffix. Multi-task work stacks in dependency order. Canonical:
[`../git/branching-strategy.md`](agents://git/branching-strategy.md).

**Commits** — `type(optional scope): description`. Imperative subject, plain text, no
trailing period, no links, no issue IDs. Optional body of short bullets saying what and
why. Commit each logical change; never batch a session into one commit; review the diff
first. Index and memory updates ride in the **same commit** as the change they describe.
Canonical: [`../git/commit-conventions.md`](agents://git/commit-conventions.md).

## Which Set

Choose the set before the folder. Universal content goes to the shared set served by the
`lxagents-agents-base` connector; repository-specific content stays local; memory is always
local. A shared file is never copied into a repository except as a declared override
registered in `.agents/index/root-index.md`. See
[`../rules/shared-instructions.md`](agents://rules/shared-instructions.md).

## Directory Mandate

* Indexes: `.agents/index/{scope}-index.md` — never an `INDEX.md`, anywhere.
* Agent wiki: `.agents/wiki/{type}/{file}.md` (frontmatter). Human wiki:
  `wiki/{folder}/{file}.md` (no frontmatter).
* Memory: `.agents/memory/{type}/{file}.md` — local only.
* Instructions: `{set}/{folder}/{file}.md` — one subject per file, matching the filename.

Audience test: would a human contributor read it? → `wiki/`. Does it exist only so an agent
behaves correctly? → `.agents/wiki/`. Both? Facts once in `wiki/`, linked from the agent
page. When nothing fits, create a new folder rather than forcing the file into the closest
one. Placement authority: [`../rules/directories.md`](agents://rules/directories.md).

## No Session Links

Nothing this creator writes, commits, or posts may carry an assistant or tool session link
— including any trailer or footer its tooling appends by default. Strip it before the
commit or the post goes out.
[`../rules/no-session-links.md`](agents://rules/no-session-links.md)

## Registration

Every file this creator creates, moves, or removes is registered in the index that owns
that scope, **in the same commit**. See
[`index-creator.md`](agents://creators/index-creator.md).

## Pull Requests and Versions

Any pull request follows
[`../git/pull-request-template.md`](agents://git/pull-request-template.md); merging requires
user approval per
[`../planning/task-workflow.md`](agents://planning/task-workflow.md). Version changes
require user approval per [`../rules/versioning.md`](agents://rules/versioning.md).

## Discovery Protocol

Source of truth: [`../rules/discovery-protocol.md`](agents://rules/discovery-protocol.md).

```
## Discovery Protocol

While working, if you notice an instruction worth adding — a new rule, or new
content for an existing instruction file — do NOT create or edit it yourself.
Collect the findings, and when the task is done present them to the user:

* one finding per message block, each in its own code block;
* state the target set — `local` (this repository) or `shared` (the organization's
  instruction set served by the `lxagents-agents-base` connector);
* include the proposed file path, `name`, `description`, and the full proposed
  body;
* explain in one line why it is worth adding.

Then let the user select which findings to apply. Create only the selected ones.
Never batch-apply, never apply silently. A `shared` finding is never written from a
consuming repository — it is reported so it can be raised against the shared set.

**Scope of this gate:** it covers instruction files in either set. Documentation
pages under `wiki/` and `.agents/wiki/` may be written when the facts are real and
verified. Memory under `.agents/memory/` is written freely and automatically — see
`memory-policy.md`.
```
