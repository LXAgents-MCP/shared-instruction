---
name: memory-tasks-auto-activation-and-github-guide
description: Task record for completing the auto_activation routing table to every published tool, and publishing the github_token_access_guide as a new tool.
status: done
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

**Status: all four committed. Not pushed, no pull request opened** — the owner holds the
PR gate, and the branches are stacked, so `3.1.0` is the only one that is mergeable on its
own.

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

### Task 2 — `feat/github-token-access-guide`

**Landed.** `content/rules/github-token-access-guide.md` is new, and the published tool
count is **33**.

Sanitized as approved: the owner's account name became `<your-account>` and the four
repository names became `OWNER/REPO`. The diagnosis is intact — two credentials, the
helper resolution order and why the system helper wins, the early-exit check that makes
`env -u GITHUB_TOKEN` sufficient, the `gh auth status` and `git credential fill`
verifications, the `~/.gitconfig` empty-reset approach that does **not** work, and the
re-authentication path. Verified by grep: no account name, no repository name, and no
token material survives in the published file.

Registered in `content/index/instructions-index.md` in this commit, per
`index-creator.md` — a file added updates its owning index in the same commit.

The four hardcoded `32`s in `test/http.test.js` became `33`, and the two count messages
were corrected to "32 generated from content/ plus mcp_list".
`test/server.test.js` needed no edit — it derives its count from `TOOL_FILES.size`, which
is why one suite caught the addition automatically and the other needed four manual
edits. That asymmetry is worth remembering before the next file is added.

**Verified:** `npm test` — 50 tests, 50 pass, 0 fail. The `content/` bijection and
byte-identity checks pass, so the new file is served whole and no served byte moved.

**Task 3 now depends on this:** its table has a 33rd tool to name.

### Task 3 — `feat/auto-activation-complete-table`

**Landed.** The table in `content/rules/auto-activation.md` now names **all 33** published
tools. It named 23 of 32 before, and 9 were absent.

Two rows were written wrong on the first pass and corrected before commit. Both named an
act the mandatory table above them already owns — "create a branch, or write a commit
message" pointed at `branch_and_commit` when `branching_strategy` and
`commit_conventions` already hold those triggers, and `task_workflow` was described as
doing the planning when it documents what the artifacts **are**. A routing table whose
rows contradict the table above it is worse than a missing row: it gives two answers to
one question. `branch_and_commit` is now routed as the standing loop, and `task_workflow`
as the shape.

**The invariant test shipped here, not in task 2.** It was added before the table was
touched and failed with exactly the 10 expected names, which is what made the gap
demonstrable rather than asserted from a count. It checks the served text for every
published tool name, so a file added to `content/` without a row now fails the suite.

`AGENTS.md` was corrected **in this commit**, as
[`.agents/rules/set-mirrors.md`](../../rules/set-mirrors.md) requires: a change to
`auto-activation.md` updates the mirrors that reproduce it in the same commit. Eight rows
were added to its trigger table. The other two named mirrors needed nothing —
`content/prompts/agents-setup.md` holds a *selected* example block rather than a copy of
the table, and the `instructions` string in `src/server.js` names four tools and two
entry points, neither of which this change touched.

**Verified:** `npm test` — 51 tests, 51 pass, 0 fail. The `content/` bijection and
byte-identity checks pass, so the routing file is still served whole.

### Task 4 — `chore/release-3.1.0`

**Landed.** `3.1.0`, minor, as the owner approved: `versioning.md` classes an added file
as minor, and a file was added.

The counts were **not** confined to where the plan predicted. The plan named
`wiki/environments/{docker,setup,env}.md`; the real image-tag carriers are
`README.md`, `wiki/environments/docker.md`, `wiki/security/security-model.md` and
`.agents/rules/repository.md`, and `env.md` and `setup.md` carry none. The count carriers
were found by grep rather than from the plan, and the two lists overlap without matching.

`.agents/memory/state/repository-state.md` was corrected on three counts, as approved, and
a **fourth** turned up while doing it: a bullet under "Not built yet" still said the HTTP
transport had never run outside its tests because nothing was deployed, which the
correction above it directly contradicted. Correcting three claims and leaving the file
self-contradicting would have been worse than not starting.

**Two of the three corrections were checked rather than assumed.** `GET /healthz` answered
`200`, so the deployment claim is verified, not inferred. A `tools/list` against the live
endpoint returned **32** tools with no `github_token_access_guide`, so the deployed
instance is behind this release — recorded in the changelog's "Not done", because
`/healthz` would never have shown it. **A `200` is evidence that something is up, not that
it runs this branch**, and that is now written into the state file.

The state file also carried the version as `1.0.0` and a `master` SHA of `cf68380` against
the real `2cf1e5f`, and its own stale-SHA warning is the same failure mode as both. All
three are corrected together for that reason.

**Verified:** `npm test` — 51 tests, 51 pass, 0 fail. No stale `32` or `3.0.2` tag remains
outside historical `wiki/logs/` rows and prior task records, both of which are correct as
history.

**Not done, and deliberately:** nothing was pushed and no pull request was opened. The
owner holds that gate.
