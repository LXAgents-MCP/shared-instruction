---
name: memory-tasks-auto-activation-and-github-guide
description: Task record for completing the auto_activation routing table to every published tool, and publishing the github_token_access_guide as a new tool.
status: active
---

# Task: Complete the `auto_activation` routing table, and add `github_token_access_guide`

Four branches, stacked. The plan was approved before task 1 was written.

## The plan

| # | Task | Branch | Scope |
|---|---|---|---|
| 1 | The record | `chore/auto-activation-and-github-guide-plan` | This file. |
| 2 | The new tool | `feat/github-token-access-guide` | `content/rules/github-token-access-guide.md`, sanitized; the index; four test counts. |
| 3 | Complete routing | `feat/auto-activation-complete-table` | The 9 tools `auto-activation.md` never named, plus the one task 2 adds. |
| 4 | Release `3.1.0` | `chore/release-3.1.0` | Version carriers, changelog, logs index, image tags, and the state-file correction. |

Tasks 2 and 3 are sequential because they touch one file: task 3's table must name the
tool task 2 creates. Two tasks touching the same file are never independent.

The working plan is untracked, under `.agents/plans/`, and is deleted or abandoned when
the work merges. Where the two disagree, this record wins.

## What this is

Two changes to the published set, both requested by the owner.

**The routing table is incomplete.** `content/rules/auto-activation.md` is the source of
truth for when each convention fires, and it names **23 of the 32** published tools. Nine
are absent: `root_index`, `instructions_index`, `logs_index`, `server_registry`,
`branch_and_commit`, `memory_policy`, `agents_setup`, `task_workflow`, and
`auto_activation` itself. Nothing detected this, because nothing checks it — a tool can
be published, servable, and unrouted, and the suite stays green. Task 3 closes the gap
and task 2 adds the test that keeps it closed.

**GitHub authentication in Codespaces is a recurring failure with a non-obvious cause.**
A Codespace holds two GitHub credentials: `ghu_` in `GITHUB_TOKEN`, auto-provisioned and
scopeless, and `ghp_` in `~/.config/gh/hosts.yml`, which has `repo`. The system
credential helper in `/etc/gitconfig` is consulted first and serves the scopeless one,
so `git push` fails `403` and `gh pr create` fails with `Resource not accessible by
integration` — while `gh auth status` looks correctly authenticated. The PAT was never
missing; it was shadowed. The fix is `env -u GITHUB_TOKEN`, scoped to the child process
rather than a global unset.

This was hit for real across five repositories before it was written down, which is what
makes it worth a tool rather than a note.

## What was decided, and what was declined

The owner chose between three shapes for `auto_activation` and picked the first:

| Option | Chosen | Why the others were declined |
|---|---|---|
| Complete routing table for every tool, bodies fetched on demand | **Yes** | — |
| Merge every file into `auto_activation`, one call returns all of it | No | ~237,000 characters, and it reinstates the oversized payload `2.0.0` deleted |
| Routing table plus the four mandatory tools inlined | No | Adds ~55,000 characters of fixed cost to every session to save four calls |

**The architecture is preserved.** `auto_activation` stays a routing file. It names what
to call and never inlines a body. No consumer's declaration block breaks, because every
existing row keeps its exact wording and trigger — the change is additive.

The guide is published **sanitized**: the owner's account name and four repository names
become placeholders. This repository is public, and the set is read by consuming
repositories that are not these five. The diagnosis survives in full — two tokens,
helper resolution order, the environment-variable fix, and both verification commands.

## Baseline

`npm test` before any change: **50 tests, 50 pass, 0 fail**. The four
`content/` bijection and byte-identity checks are among them, so a change under
`content/` that moves a served byte fails the suite.

## Notes for the tasks that follow

* Task 2 makes the tool count **33**. Four assertions in `test/http.test.js` hardcode
  `32` and must change. `test/server.test.js` derives its count from `TOOL_FILES.size`
  and needs no edit.
* Task 3's table covers **33**, not the 32 named in the request: task 2 adds one.
* The release is **`3.1.0`** — minor, because `versioning.md` classes an added file as
  minor. The owner approved this number explicitly.
* Task 4 also corrects `.agents/memory/state/repository-state.md`, which is wrong on
  three counts. Owner-approved.

### Task 1 — `chore/auto-activation-and-github-guide-plan`

This file, and its row in `memory-index.md`. The plan was approved before it was
written, so the record states intent before any diff exists.
