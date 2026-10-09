---
name: memory-policy
description: What may be written to a repository's memory and how — the ungated exception to the discovery protocol, and the list of what never goes in.
---

# Memory Policy

## A. Memory belongs to a repository

Memory lives at `{repo}/.agents/memory/`. **A workspace root has none** — not an empty
folder, not a README explaining why, none.

**Why.** The root is a container, not a project. Nothing is ever *worked on* there; the
work happens in `orgs/{org}/{repo}/` and `Personal/{project}/`. A memory file at the root
could
only ever record work on the instruction set itself, which `wiki/` and the git-less caution
in [`repository.md`](repository.md) already cover. Memory is a record of *this machine's
work*, and the root is not where work happens.

The root's five memory files were removed on 2026-10-04 for this reason. What survived was
the descriptive half, folded into
[`../wiki/context/repository-map.md`](../wiki/context/repository-map.md) and
[`../wiki/context/instruction-set-history.md`](../wiki/context/instruction-set-history.md).

**Everything below therefore describes what a repository does.** A repository reading this
file gets a complete memory system, not a restricted one.

## Memory is written automatically and needs no approval

This is the deliberate exception to
[`discovery-protocol.md`](discovery-protocol.md). An agent that finishes a meaningful unit
of work and writes nothing to memory has failed the task.

## Memory is local to its repository

A repository's memory stays in that repository. It is **never** copied between
repositories, never used to carry a convention, and never read from anywhere else. A
convention is a rule file, not a memory file — see
[`discovery-protocol.md`](discovery-protocol.md).

## What to write, and where

Paths are relative to `{repo}/.agents/memory/`:

| Situation | File |
|---|---|
| Ongoing work | `tasks/{slug}.md` — written as task 1, before the work, and appended to by each task |
| What happened in a working session | `sessions/{yyyy-mm-dd}-{slug}.md` |
| A choice with consequences | `decisions/{slug}.md` |
| Current live state of an area | `state/{area}.md`, overwritten in place |

## What never goes in memory

* Secrets, tokens, credentials, private keys.
* Customer data or personal data.
* Full file dumps.
* Assistant or tool session links —
  [`no-session-links.md`](no-session-links.md).
* Anything you would not put in a public commit.
* **A path outside the repository** — an absolute path, a machine's folder name, or a home
  directory. Memory is read on other machines; a path that only resolves here is noise at
  best and a wrong instruction at worst. See
  [`repository.md`](repository.md) §No file names a location outside itself.

Memory is committed to git like everything else. Treat it as public.

## Memory is never normative

A memory file may say "we currently do X". It may never say "always do X". A rule that
deserves to be permanent is proposed through
[`discovery-protocol.md`](../rules/discovery-protocol.md).

## Entry format

Frontmatter, then an H1, then dated entries newest-first under `## {YYYY-MM-DD}`
headings. State facts, links, branches, PR numbers, file paths. No speculation presented
as fact.

## Staleness

Before trusting a memory file, check its newest entry date against the repository's
current state. **If they disagree, the repository wins** — correct the memory file in the
same commit as your work.

## Retention

* When a task ships, mark its `tasks/` file `status: done` with a closing entry.
* At each release, fold `sessions/` files older than that release into one digest under
  the release's log directory, then delete the originals and their rows in
  `memory-index.md`.

## Registration

Every memory file appears in `{repo}/.agents/index/memory-index.md` in the same commit that
creates it. That index is a repository's, for the same reason the memory tree is — see
[`index/root-index.md`](../index/root-index.md), which routes to it for repositories and
has no root row.
