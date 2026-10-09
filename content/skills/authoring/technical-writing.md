---
name: technical-writing
description: How to write technical documentation that stays true — leading with the answer, one subject per page, and stating the source for anything that can change. Read before writing or reviewing any documentation page.
---

# Technical Writing

Documentation fails in a specific way: it was true when written, and nobody noticed when
it stopped being true. Most of what follows is about avoiding that rather than about
prose quality.

## Lead with the answer

Someone opening a page has a question. The first paragraph should answer it.

Compare "This document describes the configuration options available when deploying the
service, including the various authentication mechanisms…" against "Three auth modes:
none, API key, and OAuth. Use API key for a single tenant; OAuth only when you need
per-user scopes."

The first tells the reader they are about to read a manual. The second tells them the
answer and lets them decide whether to continue. **Structure before detail, always.**

## One subject per page

A page covering several subjects serves none of them. Split it and cross-link.

The test is the filename: if you are about to add a section whose heading has nothing to
do with the page's name, that is a new page. `server.md` with a section on deployment
configuration is two pages wearing one name.

This is a structural rule, not a preference. A page about one thing can be linked
precisely, replaced without collateral damage, and trusted — and those three properties
are what make documentation worth maintaining.

## State what changes and what does not

The most useful thing in a document is often an explicit boundary:

* "This holds because the root is not a git repository. If it ever becomes one, this
  rule no longer applies."
* "Everything below assumes the shared set is reachable. It is not."

A reader who knows where a rule stops can reason about it. A reader who does not has to
either over-apply it or guess.

## Cite the source, and its version

Anything factual about a system you do not own needs a source and a date. An undated fact
about someone else's tool is worthless within a year, and it fails silently rather than
obviously.

The stronger form: **prefer the authoritative source over the prose describing it.** If a
limit is enforced in a validator, cite the validator, not a page about it. Prose drifts
from code; the validator is the thing that actually runs.

## What to write down

| Write | Do not write |
|---|---|
| The command, with real output | A description of what the command does |
| The limit, with its number | "limited" |
| Why this approach | A list of alternatives with no recommendation |
| The failure people hit | A warning that says "be careful" |
| What is not supported | Silence about the boundary |

**Show, do not describe.** A reader can copy a command; they cannot reconstruct one from
a paragraph about what it configures.

## Handle the parts that go stale

Documentation that cannot be maintained gets abandoned, and an abandoned page is worse
than a missing one — it looks like coverage.

* **Prefer structural facts over incidental ones.** "Ports are configured in the settings
  file" ages better than a port number.
* **Date anything volatile, and mark it as dated.**
* **Delete rather than hedge.** A page saying "this may or may not still apply" is not
  useful. If it no longer applies, remove it; if it does, say so plainly.
* **Link instead of copying.** A restated fact is a fact that will go stale on one side
  only, and nobody will remember which side is authoritative.

## Structure that works

* One `#` heading naming the subject, matching the filename.
* A short opening that answers the page's question.
* Sections in the order a reader needs them, not the order the system is built.
* Tables for anything with the same shape across rows — they beat prose for lookup.
* A worked example where the format is fiddly, because that is where readers get stuck.
* Links out at the end, or inline where relevant. Not a link dump.

## Revising

Read the existing page before rewriting it. The goal is usually a targeted edit — a
corrected limit, a new row in a table, a stale link fixed — and a rewrite loses whatever
was already right and cannot be recovered from a file with no version history.

That is worth stating plainly in this workspace, where it is a real constraint: **the root
is not a git repository**, so there is no `git diff` to recover a bad edit from. Read
first, edit narrowly.

## See also

* [`../visual-design/web-interface.md`](../visual-design/web-interface.md) — the same
  hierarchy-before-polish principle applied to an interface
* [`../guidance/code-review.md`](../guidance/code-review.md) — reviewing prose with the
  same rigour as code
* [`../../creators/information-creator.md`](../../creators/information-creator.md) — where
  a page goes, and the audience test that decides it