---
name: planning-lifecycle
description: The four artifacts a request becomes — plan, record, branch, release — which are tracked, which outlive which, and what makes the chain reviewable.
version: 1.0.0
author: LXAgents
---

# Task Workflow

The **shape** of a request that takes more than one step: what it becomes, which of those
things are tracked, and what outlives what. The **procedure** that produces them is
[`../creators/plan-creator.md`](agents://creators/plan-creator.md) — read this file to
know what the artifacts are, read that one to know what to do next. This file never
restates it; a second copy of the procedure is a second thing to correct, and at `3.0.0`
those two files did overlap without either saying so.

**This file's `name` is not its filename, on purpose.** It is `planning-lifecycle`, not
`task-workflow`. Overrides key on `name`, and at `3.0.0` this procedure was folded into
`plan-creator.md` and consumers were told to **delete** any override registered against the
`task-workflow` name. Reclaiming that name would silently switch such a local copy back on
— the exact failure the rename was a major version for, returning with no error to signal
it. A stale override must stay inert. The filename is the historical path that four
`AGENTS.md` trigger tables and every release log before `3.0.0` name, so the path stays and
the name does not.

## The four artifacts

| Artifact | Tracked? | Lives in | Outlives the work? |
|---|---|---|---|
| **The plan** | No — `.gitignore` excludes `/.agents/plans/` | `{repo}/.agents/plans/` | No. Deleted or abandoned when the work merges. |
| **The record** | Yes | `{repo}/.agents/memory/tasks/{slug}.md` | Yes. It is the only account of what was agreed. |
| **The branch** | Yes | The repository's own git history | Yes. The diff is the work. |
| **The release** | Yes | `wiki/logs/{Major}/{Minor}/{Patch}/` and the two log indexes | Yes. It is the notice consumers get. |

Only the plan is untracked, and it is untracked on purpose: a plan is working notes, and a
repository should not publish the notes it thinks with. **That exclusion is a
precondition, not a preference** — the one `.gitignore` line is the only thing keeping the
plan out of history, so confirm it with `git check-ignore -v .agents/plans/tasks.md` before
writing a plan. If the rule is missing, ask the owner to add it; do not edit `.gitignore`
yourself, because a rule added unasked is a change nobody approved.

**The record wins every disagreement.** When the plan and the record say different things,
the record is the one that was reviewed, committed, and merged — the plan is scratch that
was never supposed to be read by anyone but the session writing it.

## What makes the chain reviewable

Three invariants. They are stated here because they are what a reader of the finished
chain relies on, not because this file is where they are enforced — the procedure enforces
all three.

* **The record is written before the work, not after.** Written first it states intent
  before a diff exists, so a reviewer checks the plan against the work. Written last it is
  a summary of whatever happened, which the diff already says.
* **Every task appends to the record in its own commit.** Never a follow-up commit, never
  batched at the end. This is what makes the record a per-task changelog: `git log -p` on
  that one file replays the work task by task, and a reviewer reading a task's diff sees
  the claim and the change together.
* **The release is a task, not an afterthought.** A change under `content/` is a release —
  consumers read the set live with no upgrade step, so the log is the only notice they get
  — and a version number never moves without the owner. See
  [`../rules/versioning.md`](agents://rules/versioning.md).

## A request that touches more than one repository

Order it, do not stack it. Branches stack only inside one repository, so a cross-repository
change is a sequence of independent stacks, and each pull request states which pull
request in which repository must merge first. The shared-set change comes **first**:
consumers depend on it, and a consumer repository that lands before the set it consumes
resolves a version its peers do not have.

## What this is not

* **Not the plan.** The plan is untracked, local, and per-repository. It is written by
  [`../creators/plan-creator.md`](agents://creators/plan-creator.md) and deleted with the
  work.
* **Not a trigger.** The workflow runs on every request and needs no trigger phrase — see
  [`../rules/auto-activation.md`](agents://rules/auto-activation.md). This file is read to
  understand the shape, not because something fired.
* **Not a local file.** A repository overrides any of this only by declaring it in its
  `.agents/index/root-index.md`, and an override is a copy that will drift. Prefer
  proposing the change here — [`../rules/shared-instructions.md`](agents://rules/shared-instructions.md).

## Related

* [`../creators/plan-creator.md`](agents://creators/plan-creator.md) — the procedure, and
  the working plan this file describes.
* [`../git/branching-strategy.md`](agents://git/branching-strategy.md) — branch naming and
  the stacking order.
* [`../creators/memory-creator.md`](agents://creators/memory-creator.md) — the shape the
  record itself must take.
* [`../rules/shared-instructions.md`](agents://rules/shared-instructions.md) §H — the
  mandate this workflow is pointed at by.
