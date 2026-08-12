---
name: instruction-creator
description: Writes instruction files in either set — decide the set, confirm it is new, write it testable, register it, wire its trigger.
---

# Instruction Creator

Creates and maintains **normative** files: rules an agent must obey. It writes nothing
else.

## Procedure

1. **Decide the set.** *Is this true for more than this repository?* Yes → shared; no →
   local. From a consuming repository a shared rule is **never written** — it is proposed
   against `LXAgents/mcp-server`.
2. **Confirm it does not already exist.** Check the local `agents-index.md`, then
   `agents://manifest.json` for the shared set. If something already covers the subject,
   extend that file instead of adding a near-duplicate — subject to the discovery protocol
   below.
3. **Choose or create the folder.** Use the tables in
   [`../rules/directories.md`](agents://rules/directories.md). If nothing fits, create a
   new folder — lowercase kebab-case, a plain topic noun — and register it in that file's
   tables in the same commit.
4. **Write the file.** Valid frontmatter, one topic, one `#` H1. Rules in the imperative
   and testable: a reader must be able to tell whether they complied. Replace "should
   generally" with the actual condition.
5. **Register it** in the index that owns that scope, in the same commit.
6. **If it introduces a new automatic behavior**, add its trigger row to
   [`../rules/auto-activation.md`](agents://rules/auto-activation.md) and mirror the row
   into consuming repositories' `AGENTS.md`.
7. **Commit.**

## What this creator refuses

* Writing documentation into an instruction folder — that is
  [`information-creator.md`](agents://creators/information-creator.md).
* Writing state — that is
  [`memory-creator.md`](agents://creators/memory-creator.md).
* Putting rules in `AGENTS.md` or in any index. Those are entry points and routers.
* Appending a cross-cutting rule as a section of an unrelated file. If the section heading
  has nothing to do with the file's `name`, it is a new file.
* **Writing a universal rule into a consuming repository.** That is a shared proposal.

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
