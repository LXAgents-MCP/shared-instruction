---
name: index-creator
description: Owns the shape of every index file in every set — the centralized mandate, the split threshold, the canonical template, and the audit.
---

# Index Creator

Every index in every set looks the same because this file says so.

## The centralized-index mandate

* Every index is a file in its set's `index/` folder, named `{scope}-index.md`.
* **`INDEX.md` is forbidden repository-wide** — at the root, in `.agents/`, in `wiki/`, in
  any subfolder, in any monorepo package.
* **An index is never placed inside the scope it describes.** This includes `wiki/`, which
  is routed from `.agents/index/project-wiki-index.md`.

## The set boundary

An index lists files **from its own set only**. It reaches the other set by pointing at
that set's root index, never by listing its files. A local index that enumerates shared
files is a copy of the shared set in table form, and it will go stale exactly like any
other copy.

## Split threshold

* A folder or `{type}` earns its own `{set}/index/{scope}-index.md` when it holds **more
  than ~10 files**, or when it has subfolders of its own.
* Below that threshold, the parent index lists the files inline. Do not create an index for
  a folder with three files — index sprawl costs more hops than it saves.
* Child index filenames are the scope path, kebab-joined:
  `wiki/information/` → `project-wiki-information-index.md`;
  `.agents/wiki/sop/` → `agent-wiki-sop-index.md`;
  `.agents/memory/sessions/` → `memory-sessions-index.md`.
* When a scope crosses the threshold: move its rows out of the parent into the new child,
  replace them in the parent with a single "Child Indexes" row, and add the child to the
  set's root index — **all in one commit**.
* Every index names its parent. Every child index is reachable from its set's root.

## What an index may contain

Pointer tables, a scope line, a parent link, and — in a consuming repository's root index
only — the override table. **Nothing else.** An index never explains a rule, never documents
behavior, and never carries prose beyond a one-line purpose per row. The moment it explains
something, that content belongs in a real file.

## Canonical template

Copy this shape exactly.

````
---
name: {scope}-index
description: Index of {scope} — {what an agent finds here}.
---

# {Scope} Index

**Scope:** `{directory this index owns}`
**Parent:** [{parent index name}]({relative path, e.g. root-index.md})

## {Section — one per folder or type in scope}

| File | Purpose |
|---|---|
| [`{relative path}`]({relative path}) | {One line. What it is for, not what it says.} |

## Child Indexes

| Index | Scope | Load when |
|---|---|---|
| [`{scope}-index.md`]({scope}-index.md) | {what lives under that scope} | {the condition that makes this branch the right one} |
````

## Root-index variants

* **Local root index** — no `Scope`/`Parent` lines. A single Child Indexes table covering
  every local index plus a row for the shared router, then the override table.
* **Shared root index** — the same, minus the override table. The shared set overrides
  nothing.

## Relative links

Index files sit in the set's `index/` folder, so:

| Target | Link |
|---|---|
| The local instruction tree | `../rules/repository.md` |
| The local agent wiki | `../wiki/context/repository-map.md` |
| The human wiki | `../../wiki/information/overview.md` |
| A sibling index | `project-wiki-index.md` |
| The other set | `{shared}/…` or `agents://…` — never a relative path |

## Maintenance

* A file added, removed, moved, or renamed updates its owning index **in the same commit**.
* An index added, removed, or renamed updates its set's root index **in the same commit**.
* An override added or dropped updates the override table **in the same commit**.
* A `Purpose` cell is one line and never grows into a paragraph.
* Rows are sorted so the most-used entries come first.

## No orphans

Every index file must be reachable from its set's root index, and every file in an indexed
scope must appear in **exactly one** index.

## Audit procedure

Walk the local set and `wiki/`, then report all six:

1. Files missing from their index.
2. Index rows pointing at files that no longer exist.
3. Any `INDEX.md` that has appeared anywhere.
4. Any session link in a tracked file.
5. Any file carrying a section that does not belong to its subject.
6. Any local file whose `name` matches a shared file **without** an override row — then
   hand off to
   [`../rules/duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md).

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
