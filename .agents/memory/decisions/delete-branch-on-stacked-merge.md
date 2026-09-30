---
name: delete-branch-on-stacked-merge
description: Why stacked pull requests are merged with branch deletion on, so the forge re-targets and the chain actually reaches master.
---

# Delete branches when merging a stacked chain

**Decision, 2026-09-30, owner-approved:** merge a stacked pull request with
`--delete-branch=true` (the plain `gh pr merge --merge` default), so the forge re-targets
the next pull request in the chain automatically.

## What went wrong without it

The `3.2.0` work shipped as three stacked pull requests — #84, #85, #86 — each targeting
the branch before it. All three were merged with `--delete-branch=false`, which is the
form the Codespaces token guide recommends, because that guide is written for keeping
branches around.

Every merge reported **MERGED** and every page said merged. `master` was still at `3.1.0`
and missing eight files, because #85 and #86 had merged *into feature branches*. The chain
was real, reviewed, and stranded. It took a fourth pull request (#87) to promote the
already-merged tree onto `master`.

This is the hazard `content/creators/plan-creator.md` §F describes — a forge only
re-targets a stacked pull request when the previous base branch is **deleted** on merge.
The merge succeeds either way, so nothing signals the gap.

**Verify the default branch, not the merge status.** `git merge-base --is-ancestor
<release-branch> origin/master`, or diff the trees. Every pull request reporting MERGED is
consistent with `master` having none of the work.

## Why deletion is the fix

Deleting the base branch is the forge's own signal to re-target. It is the mechanism the
platform documents, so it needs no convention of ours to be remembered and no final
promotion pull request to be remembered either.

**The cost:** the merged branches are gone from the remote. The commits are on `master`, so
nothing is lost — a branch is a pointer, not a record. `git log master` is the history.

## How to apply

* Merge a stacked chain with branch deletion **on**, top to bottom, in order.
* After the last merge, run the ancestor check above before reporting the work as landed.
* Keep the re-target explicit when reviewing: confirm each pull request's `baseRefName` is
  the one you expect *before* merging it.

**When a base branch must be kept** — a long-lived integration branch, or a chain whose
branches are under review as a set — then the forge will not re-target, and the chain needs
a final promotion pull request into `master`. That is a real option; it is just not the
default, because it is one more step that has to be remembered.

## Promoted to the shared set

This was a local decision first, then raised as a finding and **accepted into the shared
set at `3.4.0`**: `content/creators/plan-creator.md` §F now makes branch deletion the
stated default for a stacked merge and gives the `git merge-base --is-ancestor` check.

**The rule now lives in §F, not here.** This file keeps the incident — what went wrong in
this repository and why — because §F states the convention without the history that
produced it. Read §F for what to do; read this for why it is worded that way.
