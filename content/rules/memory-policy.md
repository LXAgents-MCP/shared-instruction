---
name: memory-policy
description: What may be written to a repository's memory and how — the ungated exception to the discovery protocol, and the list of what never goes in.
---

# Memory Policy

## Memory is written automatically and needs no approval

This is the deliberate exception to
[`discovery-protocol.md`](agents://rules/discovery-protocol.md). An agent that finishes a
meaningful unit of work and writes nothing to memory has failed the task.

## Memory is always local

It lives in the consuming repository's `.agents/memory/`. It is **never** written to the
shared set, never copied between repositories, and never used to carry a convention. The
shared set has no memory at all.

## What to write, and where

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
  [`no-session-links.md`](agents://rules/no-session-links.md).
* Anything you would not put in a public commit.

Memory is committed to git like everything else. Treat it as public.

## Memory is never normative

A memory file may say "we currently do X". It may never say "always do X". A rule that
deserves to be permanent is proposed through
[`discovery-protocol.md`](agents://rules/discovery-protocol.md).

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

Every memory file appears in `.agents/index/memory-index.md` in the same commit that
creates it.
