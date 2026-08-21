---
name: task-workflow
description: How a request becomes tasks, branches, and pull requests — intake, decomposition, stacked branches, in-order execution, and the two gates.
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
refinement and the task list in §B are in front of the user.

## B. Split the request into tasks

* Decide whether it is one task or several. Split it when the parts touch different
  areas, can be reviewed independently, or must land in a particular order.
* A single, self-contained request stays a single task. **Do not manufacture tasks.**
* **A change that spans repositories is always more than one task** — one per repository,
  with the shared-set change first, since consumers depend on it.
* Append a final task for the release process, and give it its own branch and pull
  request.

Present the task list **before doing any work**, numbered `1…n`, each with:

| # | Title | Scope (one line) | Repository | Branch | Files / areas |
|---|---|---|---|---|---|

Order by dependency: if task B builds on task A, A comes first. **Two tasks that touch
the same file are never independent** — sequence them.

Wait for the user to confirm. If they change it, re-present the renumbered list before
starting. Once confirmed, write the list to `.agents/memory/tasks/{slug}.md`.

## C. One branch per task, stacked in order

* Every task gets its own branch, named per
  [`../git/branching-strategy.md`](agents://git/branching-strategy.md).
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

* After each task, update `.agents/memory/tasks/{slug}.md`: what landed, the repository,
  the branch, the PR, what is left.
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
* Title and body follow
  [`../git/pull-request-template.md`](agents://git/pull-request-template.md), and carry no
  session link ([`../rules/no-session-links.md`](agents://rules/no-session-links.md)).
* **Ask the user before merging anything, and wait for an explicit yes**, on the same
  terms as the pull request gate above. Never merge on your own initiative, and never
  enable auto-merge without being asked.
* Once approved, merge in order `1…n`. Wait for each merge to finish before starting the
  next, and re-target the next pull request's base branch if the platform does not do it
  automatically.
* If a merge conflict appears, resolve it when the correct resolution is unambiguous; when
  resolving it would mean choosing between two behaviors, stop and ask, naming the
  conflicting files.
* Report the final state: which pull requests merged, in which repositories, in what
  order, and anything left open. Close out the memory task file, and present any discovery
  findings.
