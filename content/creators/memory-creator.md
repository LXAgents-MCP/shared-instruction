---
name: memory-creator
description: Maintains .agents/memory/ — the one creator exempt from the approval gate, because memory that waits for permission never gets written.
---

# Memory Creator

Creates and maintains files under the local `.agents/memory/`.

## No approval gate

**This creator is exempt from the discovery protocol's approval requirement for its own
writes.** The reason is practical: memory that waits for permission is memory that never
gets written, and a session that records nothing forces the next session to start over.

The exemption covers memory only. The moment this creator wants to write a rule or a wiki
page, the normal gates apply.

## Memory is always local

It lives in the consuming repository's `.agents/memory/`. This creator **never** writes
into the shared set, never copies memory between repositories, and never uses memory to
carry a convention.

## Procedure

1. Pick the right `{type}`:

   | Situation | File |
   |---|---|
   | Ongoing work | `tasks/{slug}.md` |
   | What happened in a session | `sessions/{yyyy-mm-dd}-{slug}.md` |
   | A choice with consequences | `decisions/{slug}.md` |
   | Current live state of an area | `state/{area}.md`, overwritten in place |

2. Check `memory-index.md` for an existing file on the same subject and **extend it rather
   than creating a near-duplicate**.
3. Write or update the file: frontmatter, one `#` H1, dated entries newest-first under
   `## {YYYY-MM-DD}` headings.
4. Register it in `memory-index.md`.
5. Commit — **in the same commit as the work it describes**.

## When to write, without being asked

* At the end of a task.
* When a decision is made that a future session would otherwise re-litigate.
* When work is left unfinished.
* When something surprising is learned about the codebase.
* When a branch or pull request is opened.
* When an override is added or dropped.

## Never write

* Secrets, tokens, credentials, private keys.
* Customer data or personal data.
* Full file dumps.
* Assistant or tool session links. **A session log records *what happened*; it never
  records the URL of the session it happened in.**
* Anything you would not put in a public commit — memory is committed to git like
  everything else.

## Memory is never normative

A memory file may say "we currently do X". It may never say "always do X".

## Staleness

Before trusting a memory file, check its newest entry date against the repository's current
state. **If they disagree, the repository wins** — correct the memory file in the same
commit as your work.

## Retention

* When a task ships, mark its `tasks/` file `status: done` with a closing entry.
* At each release, fold `sessions/` files older than that release into one digest under the
  release's log directory, then delete the originals and their rows in `memory-index.md` —
  see [`changelog-creator.md`](agents://creators/changelog-creator.md).

Full policy: [`../rules/memory-policy.md`](agents://rules/memory-policy.md).

## Boundaries

This creator never writes rules and never writes wiki pages in either tree.

* If a memory entry starts sounding like a permanent rule, route it through
  [`instruction-creator.md`](agents://creators/instruction-creator.md) and
  [`../rules/discovery-protocol.md`](agents://rules/discovery-protocol.md).
* If it is a durable fact, route it through
  [`information-creator.md`](agents://creators/information-creator.md).

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
