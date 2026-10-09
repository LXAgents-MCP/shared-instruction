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

An index lists files **from its own set only**. It reaches another scope by pointing at
that scope's root index, never by listing its files. An index that enumerates another
scope's files is a copy in table form, and it goes stale exactly like any other copy.

## Split threshold

* A folder or `{type}` earns its own `{set}/index/{scope}-index.md` when it holds **more
  than ~10 files**, or when it has subfolders of its own.
* Below that threshold, the parent index lists the files inline. Do not create an index for
  a folder with three files — index sprawl costs more hops than it saves.
* Child index filenames are the scope path, kebab-joined:
  `wiki/information/` → `project-wiki-information-index.md`;
  `.agents/wiki/sop/` → `agent-wiki-sop-index.md`;
  `{repo}/.agents/memory/sessions/` → `memory-sessions-index.md` (a project only).
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

* **A repository's root index** — a single Child Indexes table covering every index in
  that repository. It has no override table: there is nothing to override, because
  `.agents/` is the whole instruction system and it is editable in place.

## Relative links

Index files sit in the set's `index/` folder, so:

| Target | Link |
|---|---|
| The local instruction tree | `../rules/{file}.md` |
| The local agent wiki | `../wiki/context/{file}.md` |
| The human wiki | `../../wiki/information/{file}.md` |
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
6. **Any file listed twice.** One file, one row — and a duplicate is as wrong as an
   omission, because the two rows drift apart and the index then describes a set that does
   not exist. Checking for absence cannot find this; count the occurrences.
7. Any local file whose `name` matches a file in another set **without** an override row —
   then it is a probable duplicate: report it as a finding and delete nothing.
   **Check first that the other set can be resolved**: if it cannot, the correct output is
   one line saying so, never a list of deletions.

## Where this applies

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

The branch, commit, and pull request conventions are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
