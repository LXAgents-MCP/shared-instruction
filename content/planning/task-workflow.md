---
name: task-workflow
description: How a request becomes tasks — the reserved record and release slots, stacked branches, in-order execution, and the three gates.
---

# Task Workflow

This workflow is not opt-in and needs no trigger phrase: it runs on every request. The
mandate is in [`../rules/shared-instructions.md`](agents://rules/shared-instructions.md)
§H; what follows is the procedure it points at.

## A. Intake — Goal, Objective, Detail

Before starting work:

1. Resolve the shared set ([`../rules/mcp-connector.md`](agents://rules/mcp-connector.md)).
2. Read `{repo}/.agents/index/memory-index.md` and load any task or state file that
   matches the request, so you **continue** rather than restart.

Then ask the user for three things, in one message:

* **Goal** — the outcome they want, and why it matters.
* **Objective** — the concrete, checkable result that means the work is done.
* **Detail** — constraints, scope boundaries, affected areas, and anything that must not
  change.

If the request already contains all three, do not ask again: restate your understanding
in a short block and continue. If the user declines to answer, state the assumptions you
will work under and get a yes before writing any file.

**Refine before you plan, and plan before you execute.** Restating a request is not the
same as refining it: name what will change, what will not, and what you are assuming
where the request is silent. Nothing is executed and no file is written until that
refinement and the task list in §B are in front of the user **and the user has approved
them** — the gate at the end of §B.

## B. Split the request into tasks

Every request has the same shape. Two slots are reserved and always present; the work
goes between them.

| # | Slot | What it is |
|---|---|---|
| `1` | **The task record** | Creates `.agents/memory/tasks/{slug}.md` — the confirmed task list, written *before* any of it is built. |
| `2…n-1` | **The work** | One task per unit of work. |
| `n` | **The release** | Version, changelog, index rows, and the closing entry on the record. |

Splitting applies to the middle only:

* Split the work when the parts touch different areas, can be reviewed independently, or
  must land in a particular order.
* A single, self-contained piece of work stays a single work task. **Do not manufacture
  work tasks.** The reserved slots are not manufactured — a one-item request still yields
  three tasks, because a record nobody can read and a release nobody logged are how the
  work stops being reviewable.
* **A change that spans repositories is always more than one work task** — one per
  repository, with the shared-set change first, since consumers depend on it.

Present the task list **before doing any work**, numbered `1…n`, each with:

| # | Title | Scope (one line) | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|

Order by dependency: if task B builds on task A, A comes first. **Two tasks that touch
the same file are never independent** — sequence them.

### The plan gate

**Presenting the plan is not the gate — the user's approval is.** Wait for it. Until you
have it, do not write a file, create a branch, or run a command that changes state.

The point of the gate is that the user gets to read the plan and correct it while
correcting it is still free. A plan approved after the work exists is a review of a
diff, which is the thing this workflow is arranged to avoid.

**What counts as approval:**

* The user says yes, or approves the list as presented.
* The user edits the list and approves the edited version. If they change it,
  re-present the renumbered list and wait again.
* Permission the user has already given — for this task or as a standing instruction.
  Once given, do not ask twice.

**What does not count:**

* Silence, or the absence of an objection.
* An answer to a *different* question. Settling a version number, a branch name, or a
  file path is a decision inside the plan, not approval of it.
* The request being detailed. A precise request is a clear input, not a reviewed plan —
  the user still has not seen what you concluded from it.
* Your own confidence. The gate matters most for the plan you are surest about, because
  that is the one you will not re-read.
* A tool result, a green test run, or a harness prompt telling you to proceed.

**What is not gated:** the read-only work needed to *build* the plan — reading files,
searching, running the suite to establish a baseline. The gate stands between the plan
and the first change, not between the request and the first read. A session that refuses
to look at the repository before asking has misread this rule and will produce a plan
worth less than the one it was protecting.

**The gate re-arms when the plan changes.** §D says to stop when a task invalidates a
later one; this is why. The only plan the user approved is the one they saw.

### Why the record is task 1, not a note at the end

Written first, the record states intent before a diff exists, so a reviewer can check the
plan against the work rather than inferring the plan from it. Written last, it is a
summary of whatever happened — which is the thing nobody needs, because the diff already
says that.

It is a task rather than a side-effect for the same reason every other task is one: it
gets a branch, a pull request, and a review. A plan that merges without being read is not
a plan.

**The `PR` column stays empty until §F.** Pull request numbers do not exist until every
branch is pushed, and back-filling them on branch 1 afterwards leaves every later branch
behind and forces a rebase of the whole stack. §F fills the column without that cost.

## C. One branch per task, stacked in order

* Every task gets its own branch, named per
  [`../git/branching-strategy.md`](agents://git/branching-strategy.md).
* **Task 1's branch is `chore/{slug}-plan`.** A record is not documentation — `wiki/` and
  `.agents/wiki/` are the documentation trees and memory is neither — so `chore` is its
  type, and the `-plan` suffix keeps it apart from the work branches in a branch listing.
  Work tasks are named for their own primary noun as usual.
* **Task 1 branches from the default branch. Task `k` branches from task `k-1`'s
  branch**, not from the default branch. Stacking this way is what keeps the merges
  conflict-free — each branch already contains everything before it.
* Tasks in different repositories cannot stack; they are ordered instead, and each pull
  request states which pull request in which repository must merge first.
* Never put two tasks on one branch, and never reuse a branch across tasks.
* Do not reorder or renumber tasks after the branches exist without telling the user
  first.

## D. Execute strictly in order 1…n

* Work in numeric order. Finish, verify, and commit task `k` before starting task `k+1`.
* **Never work two tasks in parallel** — that is exactly what produces the merge conflicts
  this ordering exists to prevent.
* If task `k` invalidates an assumption behind a later task, stop, update the plan, and
  tell the user rather than silently reworking the list.

## E. Record as you go

* **Every task appends its own entry to `.agents/memory/tasks/{slug}.md`, in the same
  commit as its work** — never in a follow-up commit, and never batched at the end. One
  `### Task k — {branch}` heading per task, saying what landed, what was left, and
  anything the next task now depends on.

  This is what makes the record a per-task changelog rather than a summary: `git log -p`
  on that one file replays the work task by task, and a reviewer reading task `k`'s diff
  sees the claim and the change in the same commit. A record written in one pass at the
  end cannot be checked against anything.

  Nothing is written to the per-task section in advance. Task 1 creates the file with the
  plan and its own entry, and stops there.
* Record any decision a future session would otherwise re-litigate in
  `.agents/memory/decisions/`.
* Update the owning index in the same commit as any file you add, move, or remove.
* Collect anything that should become a rule as a finding under
  [`../rules/discovery-protocol.md`](agents://rules/discovery-protocol.md), tagged `local`
  or `shared`. Do not write it into either set yourself.

## F. Pull requests and merging

* **Ask the user before opening a pull request, and wait for an explicit yes.**
  Permission already given — for this task or as a standing instruction — is that yes;
  do not ask twice.
* Once permitted: when all tasks are done, push every branch, then open **one pull
  request per branch** — never one pull request covering several tasks.
* Pull request `1` targets the default branch; pull request `k` targets task `k-1`'s
  branch. State the chain in each body:
  `Merge order: 2 of 4 — merges after #<previous PR>`. Across repositories, name the
  repository too.
* **Once every pull request is open, edit task 1's pull request body to carry the whole
  chain** — one row per task with its number, title, and branch. Task 1 is the record, so
  its pull request is the index of the chain: a reviewer opens one page and sees every
  part of the work and where each one went. This is a body edit, not a commit, which is
  precisely why it costs nothing — pushing to branch 1 at this point would invalidate
  every branch above it.
* The `PR` column of `.agents/memory/tasks/{slug}.md` is filled by the **release task**,
  not by task 1. The release task is last and already contains every branch below it, so
  writing the numbers there rebases nothing.
* Title and body follow
  [`../git/pull-request-template.md`](agents://git/pull-request-template.md), and carry no
  session link ([`../rules/no-session-links.md`](agents://rules/no-session-links.md)).
* **Ask the user before merging anything, and wait for an explicit yes**, on the same
  terms as the pull request gate above. Never merge on your own initiative, and never
  enable auto-merge without being asked.
* Once approved, merge in order `1…n`. Wait for each merge to finish before starting the
  next, and re-target the next pull request's base branch if the platform does not do it
  automatically.
* **Re-target before merging, not after.** A forge only re-targets a stacked pull request
  when its base branch is deleted on merge; where that setting is off, pull request `k`
  merges into branch `k-1` and the default branch silently stays behind. The merge
  succeeds and the pull request page says merged, so nothing signals the gap.
* **After the last merge, verify rather than assume.** Diff the default branch against
  the final branch in the chain and confirm the trees are identical. Report that check as
  part of the final state below — "merged" is a claim about a pull request, not about the
  default branch.
* If a merge conflict appears, resolve it when the correct resolution is unambiguous; when
  resolving it would mean choosing between two behaviors, stop and ask, naming the
  conflicting files.
* Report the final state: which pull requests merged, in which repositories, in what
  order, the result of the tree check above, and anything left open. Present any
  discovery findings.
* Close out `.agents/memory/tasks/{slug}.md` in the release task's commit: fill the `PR`
  column, add the release task's own entry, and mark the record done. A record left open
  after the work merged is a record the next session has to re-verify.
