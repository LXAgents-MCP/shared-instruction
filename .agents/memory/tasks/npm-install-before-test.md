---
name: memory-tasks-npm-install-before-test
description: Adding the npm-install-before-npm-test rule to repository.md, after a fresh checkout made an uninstalled tree look like broken code.
---

# Install Before You Trust a Test Result

## 2026-08-28 — planned

**Goal.** `content-publishing.md` tells an agent to run `npm test` before committing
anything under `content/`. On a fresh checkout that instruction produces six failing test
files and no explanation, because `node_modules` is not there. The failure mode is
`ERR_MODULE_NOT_FOUND`, which reads as broken code rather than an uninstalled tree, so the
next agent debugs the wrong thing.

Observed, not hypothesised: it happened during the `0.10.1` round in this repository. The
first `npm test` returned 7 pass / 6 fail. `npm install` turned the same tree into 69/69
with no code change.

**Objective.** `.agents/rules/repository.md` says, beside the commands table, that a fresh
checkout runs `npm install` once before a test result means anything.

**Detail.** Local set only. This is a finding the user selected under
`discovery-protocol.md`; the body below is the one that was approved, placed in the file
that owns stack and commands.

**Not a release.** `content/` is untouched, so nothing is published and no consumer is
affected. `content-publishing.md` scopes "a content change is a release" to `content/**`,
and `.agents/**` is published to nobody. No version carrier moves: no `package.json` bump,
no `wiki/logs/` directory, no changelog. Creating any of those would be an unapproved
version claim under `versioning.md`.

**Why not shared.** "Install dependencies before running tests" is generic, but the rule
being written is about *this* suite's specific failure signature and *this* repository's
instruction that walks into it. Routing question from `directories.md`: is it true for more
than this repository? Not in this form. Local.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/npm-install-before-test-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `docs/npm-install-before-test` | `.agents/rules/repository.md` — the new paragraph. | — |
| 3 | `chore/npm-install-before-test-close` | The closing entry on this record. No version, no changelog. | — |

## Per-task record

### Task 1 — `chore/npm-install-before-test-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

The release slot is kept but carries no release: §B says the two reserved slots are always
present and are not manufactured, and §F still requires the record to be closed out in that
task's commit. What the slot does *not* license is inventing a version to justify itself.

Considered and deliberately not done: adding a matching pointer at
`content-publishing.md` line 41, which is where the misleading instruction actually
fires. It is a second file and outside the finding the user selected, so it is raised as an
option rather than taken.

### Task 2 — `docs/npm-install-before-test`

`.agents/rules/repository.md` gains a paragraph under **Stack and commands**, between the
command table and the orientation link — beside the two commands it sequences, not in a
list of code conventions where it would not be read in time.

It names the failure signature rather than just the instruction. "Run `npm install` first"
is advice anyone would skip; "six of seven files fail with `ERR_MODULE_NOT_FOUND`, and that
is not broken code" is the sentence that stops the wrong debugging session, because it
matches what the reader is looking at when they need it.

It also names `content-publishing.md` as the caller that walks into the trap, so the two
rules point at each other instead of one quietly undermining the other.

`npm test` passes 69/69 — on an installed tree, which is the joke this rule exists to
prevent.
