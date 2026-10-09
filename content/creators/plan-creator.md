---
name: plan-creator
description: What a multi-step request becomes — plan, record, branch, release — plus intake, the plan gate, the record and release slots, stacked branches, and the untracked working plan under a repository's .agents/plans/.
---

# Plan Creator

Three subjects, because a plan is not a thing that appears on its own. First, what a
request taken in deliberately *becomes* — four artifacts, three of which outlive the work.
Then the procedure that produces them: split into tasks, gated on the user's approval,
stacked on branches. And the untracked checklist the work is tracked against while it
runs. This file carries all three: **§What a request becomes** is the shape, **§A–§F are
the workflow**, and *The working plan* is what the creator writes.

This file used to be two — `planning/task-workflow.md` carried the shape and this one the
procedure, and the two overlapped at `3.0.0` without either saying so. They are one file
again, because a request's shape and the procedure for producing it are the same subject.

**The creator writes the plan and nothing else.** The record, `wiki/`, `.agents/wiki/`
and the work itself belong to other creators. The workflow says when those happen and
in what order; it does not perform them. The record's own shape belongs to
[`memory-creator.md`](../creators/memory-creator.md), and this file links to it
rather than restating it.

The workflow is not opt-in and needs no trigger phrase: it runs on every request. The
mandate is in [`../rules/shared-instructions.md`](../rules/shared-instructions.md)
§H; what follows is the procedure it points at.

The plan this describes is **untracked and local to whichever repository is running
it** — never published, never shared, never committed. That is still why the working
plan lives outside the repository's history; only the reasoning about *why it is safe
to serve remotely* no longer applies, because there is no remote.

---

# What a request becomes

Four artifacts, and only one of them is disposable. Read this before the workflow: the
workflow below is the procedure that produces them, and a step that names an artifact is
easier to follow once you know which one it is naming.

| Artifact | Tracked? | Lives in | Outlives the work? |
|---|---|---|---|
| **The plan** | No — `.gitignore` excludes `.agents/plans/` | `{repo}/.agents/plans/` | No. Deleted or abandoned when the work lands. |
| **The record** | Yes | `{repo}/.agents/memory/tasks/{slug}.md` | Yes. It is the only account of what was agreed. |
| **The branch** | Yes | The repository's own git history | Yes. The diff is the work. |
| **The release** | Yes | `wiki/logs/{Major}/{Minor}/{Patch}/` and the two log indexes | Yes. It is the notice a consumer gets. |

**Three of the four are tracked, and each of the three outlives the work.** That is the
whole reason for the shape: the plan is scratch, and the other three are what a reader of
the finished chain relies on. §B and §E enforce the invariants that keep them reviewable —
the record written before the diff exists, every task appending to it in its own commit,
and the release treated as a task rather than an afterthought — and those sections give the
reasoning. This table says only what each artifact is and where it goes.

Two of the four need a repository to exist in. **At a workspace root, which is not a git
repository, only the plan is real**: there is no branch to create, no commit to make, and
no release to cut, so §C, §F, and the release slot do not apply there. The plan is still
worth writing — for the stronger reason that no commit could ever capture it. See
[`../rules/repository.md`](../rules/repository.md) §This directory is not a git
repository.

# The workflow

## A. Intake — Goal, Objective, Detail

Before starting work:

1. Read `{repo}/.agents/index/memory-index.md` and load any task or state file that
   matches the request, so you **continue** rather than restart. **In a project only** —
   a workspace root has no memory tree, so there is nothing to read there and the step is
   skipped. See [`../rules/memory-policy.md`](../rules/memory-policy.md) §A.

1b. **Make sure `{repo}/.agents/plans/` exists.** Create it if it does not. The folder is
   authorized to be empty, and its absence is never a reason to hold the plan in context
   instead. This is step zero of every plan, and it comes before the questions in step 2 —
   the plan needs a home, and the home has to exist before the plan is written.

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
them** — the gate below.

## B. Split the request into tasks

Every request has the same shape. Two slots are reserved and always present; the work
goes between them.

| # | Slot | What it is |
|---|---|---|
| `1` | **The task record** | Creates `{repo}/.agents/memory/tasks/{slug}.md` — the confirmed task list, written *before* any of it is built. **In a project**; a root has no memory, so the plan file is the record there. |
| `2…n-1` | **The work** | One task per unit of work. |
| `n` | **The release** | Version, changelog, index rows, and the closing entry on the record. |

Splitting applies to the middle only.

**Every task list starts here, every time.** A single self-contained edit still gets a
plan — a one-task list of three tasks. What does not get one is a request that is genuinely
one step: read a file, answer a question, fix a typo. The threshold is *more than one
step*, not *how much work*, and it is judged before starting rather than partway through.

* Split the work when the parts touch different areas, can be reviewed independently, or
  must land in a particular order.
* A single, self-contained piece of work stays a single work task. **Do not manufacture
  work tasks.** The reserved slots are not manufactured — a one-item request still yields
  three tasks, because a record nobody can read and a release nobody logged are how the
  work stops being reviewable.
* **A change that spans repositories is always more than one work task** — one per
  repository, ordered by which one the others depend on, and the dependency named in the
  plan. There is no shared set that must land first: each repository's instruction set is
  its own, so the ordering is a fact about *this* change and not about the architecture.

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

The naming and message format are *Branch & Commit Convention* below. This section is
only what is specific to running a task list, which that section does not say:

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

**Work independent of the stack is not a second plan.** It is a subagent, spawned by the
task that needs it, carrying no plan of its own — and the test for which it is: *does the
later task need the earlier one's result?* The working rule is in
[`../../AGENTS.md`](../../AGENTS.md) §Multi-agent working; this section says only that a
subagent is not an exception to the ordering above.

## E. Record as you go

* **Every task appends its own entry to `{repo}/.agents/memory/tasks/{slug}.md`, in the same
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
  `{repo}/.agents/memory/decisions/`.
* Update the owning index in the same commit as any file you add, move, or remove.
* Collect anything that should become a rule as a finding under
  [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md), tagged `local`.
  Do not write it into the set yourself.

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
* The `PR` column of `{repo}/.agents/memory/tasks/{slug}.md` is filled by the **release task**,
  not by task 1. The release task is last and already contains every branch below it, so
  writing the numbers there rebases nothing.
* Title and body follow
  [`../git/pull-request-template.md`](../git/pull-request-template.md), and carry no
  session link ([`../rules/no-session-links.md`](../rules/no-session-links.md)).
* **Ask the user before merging anything, and wait for an explicit yes**, on the same
  terms as the pull request gate above. Never merge on your own initiative, and never
  enable auto-merge without being asked.
* Once approved, merge in order `1…n`. Wait for each merge to finish before starting the
  next.
* **Delete each branch as it merges.** A forge re-targets a stacked pull request only when
  the branch it targets is deleted on merge. Deleting is the signal, and it is the
  platform's own — so make it the default for every merge in a chain. Where a branch has
  to be kept, re-target the next pull request by hand **before** merging the current one,
  and check its `baseRefName` rather than assuming.
* **A stack can be fully merged and the default branch untouched.** Where the re-target
  does not happen, pull request `k` merges into branch `k-1`, the work sits on a branch
  nothing resolves, and the default branch stays behind. Every merge succeeds and every
  page says merged, so nothing signals it. This is not a hypothetical: a three-task chain
  once reported three merges with none of the work on the default branch.
* **After the last merge, verify the default branch rather than the pull requests.** "All
  merged" is a claim about pull requests; what matters is the default branch. Check that
  the final branch is an ancestor of it — `git merge-base --is-ancestor <final-branch>
  origin/master` — or diff the two trees. Report that check as part of the final state
  below.
* If a merge conflict appears, resolve it when the correct resolution is unambiguous; when
  resolving it would mean choosing between two behaviors, stop and ask, naming the
  conflicting files.
* Report the final state: which pull requests merged, in which repositories, in what
  order, the result of the tree check above, and anything left open. Present any
  discovery findings.
* Close out `{repo}/.agents/memory/tasks/{slug}.md` in the release task's commit: fill the `PR`
  column, add the release task's own entry, and mark the record done. A record left open
  after the work merged is a record the next session has to re-verify.

**Versions and the release task.** Any pull request follows the template above; merging
requires user approval per §F. A version change requires user approval per
[`../rules/versioning.md`](../rules/versioning.md) — including a new
`wiki/logs/{Major}/{Minor}/{Patch}/` directory, which is a version claim.

---

# The working plan

The workflow above produces the record. This part is what this creator actually writes:
a **local working plan** for the task in flight — an untracked checklist that tracks
work while it runs.

## The folder and the center

- A plan lives at `{repo}/.agents/plans/`, which the repository's `.gitignore`
  excludes. Nothing in it is staged, committed, or pushed, ever.
- **The plan goes in the repository doing the work.** Root work plans at
  `<root>/.agents/plans/`; a project at `orgs/{org}/{repo}` plans in
  `orgs/{org}/{repo}/.agents/plans/`. Never write a project's plan at the root — it
  splits one repository's reasoning across two places, and the root's next session
  inherits a plan for work it has no context for.
- **At a root that is not a git repository, there is nothing to exclude.** `plan-creator`
  normally verifies the exclusion with `git check-ignore`; that command fails outright at
  such a root — `fatal: not a git repository` — and the precondition is *unsatisfiable*
  rather than unmet. The plans are still untracked, for the stronger reason that no commit
  can ever be made. Write the plan, and note that there is no history to keep it out of.
- **Verify the exclusion with `git check-ignore`, never by matching the line.**
  Both `.agents/plans/` and `/.agents/plans/` cover the same path — the first
  matches at any depth, the second is anchored to the repository root — so
  which one a repository writes is its own choice, and a string check for
  either form reports a correctly configured repository as unprotected. Ask
  git what it actually ignores; it answers for the pattern rather than for
  your guess about it.
- **That exclusion is a precondition, not a wish.** The only thing keeping a
  plan out of history is that one `.gitignore` line, and a repository without it
  is one `git add -A` away from publishing its own working notes. Check for it
  before writing anything — see the step in *Before writing*. If the rule is
  missing, **ask the owner to add it, and wait.** Do not edit `.gitignore`
  yourself: it is not this creator's file, it is the repository's, and a rule
  added unasked is a change nobody approved. Carry on writing the plan without
  it, and say plainly that the folder is not yet excluded.
- **`tasks.md` is the center file.** Every other file in the plan appears in its
  routing table, and every route out of a plan file goes through it.
- A file in `.agents/plans/` that `tasks.md` does not list is not part of the
  plan. Link it or delete it.
- `README.md` is a stub, not a second router. It states that the folder is
  untracked and points at `tasks.md`. It carries no routing table of its own.

## Before writing

1. **The request is more than one step.** A single edit needs no plan — write
   the code and skip this creator. The workflow in §A–§F still runs; only the
   plan folder is skipped.
2. **Read the instruction set first.** The repository's `AGENTS.md`, the indexes
   its root index routes to, and whatever shared or workspace convention the
   request triggers. A plan built on a half-read set is a plan to redo.
3. **Check whether a plan already exists** for the task in flight. Continue it;
   do not start a second one.
4. **Refine before planning.** State what changes, what does not change, and
   what is being assumed where the request is silent. This is §A's refinement,
   restated at plan granularity — do it once, in the refinement, rather than
   asking for it twice.
5. **Confirm git ignores the folder.** Run
   `git check-ignore -v .agents/plans/tasks.md`. It must print the matching
   rule, or the plan is one commit away from being published. Do **not**
   substitute a string search for the pattern: `.agents/plans/` and
   `/.agents/plans/` both ignore this path and neither contains the other, so
   reading `.gitignore` for a specific form reports a correctly configured
   repository as unprotected, and the next paragraph then has you ask the owner
   to add a rule that is already there.

   If `check-ignore` prints nothing, ask the owner to add it — name the line
   and the reason — and do not add it yourself. Carry on either way; a missing
   rule is a finding to report, not a reason to withhold the plan.

## The gate comes before the plan

The gate is §B's, and it is the same gate. The plan files are simply the first thing
that gate authorises.

- [ ] Present the plan and **wait for approval**.
- Writing these files is not approval of the plan they describe, and creating
  the folder is not approval of any task in it.
- Before that yes: no branch, no commit, no file outside `.agents/plans/`, and
  no state-changing command. Reading, searching, and establishing a baseline
  are not gated.

## Writing the files

- One purpose per file, kebab-case, `.md`. A file whose name has nothing to do
  with its content is two files.
- The set follows the work rather than a fixed list. In practice: `scope.md` for
  what is in and out, a `*-steps.md` for executable steps, `docs-to-correct.md`
  for what a change falsifies, `git-workflow.md` for branches and gates,
  `verification.md` for what closes a task, `discovery-findings.md` for rules
  noticed and deliberately not applied.
- Every task is a checkbox — `- [ ]` until done, `- [x]` when done. A step that
  cannot be checked is not a step.
- Each task line names its branch and the files it touches, so the checklist is
  executable without rereading the conversation that produced it.
- The person who owns the repository is `the owner`. Not the user, not the
  client, not a name.

## Recording progress

- Tick a box as the step completes, never in one pass at the end. A checklist
  filled in afterwards records nothing.
- Every task still appends its own entry to `{repo}/.agents/memory/tasks/{slug}.md`
  in **its own commit**, per §E. The plan is not that record and does not replace it.
- When the two disagree, the task record wins — it is the one that was reviewed.
- **The plan's last act is to delete its own folder.** When every box is ticked and the
  work has landed, `.agents/plans/` is removed — not moved, not kept, not archived. A
  plan is scratch; the record it produced is what a later session reads.

  **Deleted** and **abandoned** are different endings, and the difference is whether
  anything was built. A finished plan is deleted, because its record says what landed. An
  abandoned one — the work dropped, mid-flight — is also removed, but nothing replaces it,
  so say plainly in the record what was attempted and why it stopped. Leaving a plan in
  the folder is not one of the two: the folder is flat and holds only what is in flight,
  so a leftover plan reads as work under way.

  This is the last step, and it is not done until it has happened — a plan that describes
  deleting itself and stays on disk is a worse artefact than one that was never written,
  because it is confident and wrong.

---

# What this creator refuses

- Committing anything under `.agents/plans/`, or deleting the `.gitignore`
  entry that keeps it out.
- Writing the task record, memory, `wiki/`, or `.agents/wiki/` — those belong to
  the creators in this folder, reached from the repository's `AGENTS.md`.
- Starting the work. The plan is not the work.
- Adding a second center file, or a routing table outside `tasks.md`.
- Skipping the record, or writing it at the end instead of as task 1.

## Related

- [`../git/branching-strategy.md`](../git/branching-strategy.md) — branch
  naming and the stacking order.
- [`../git/commit-conventions.md`](../git/commit-conventions.md) — the commit
  message format.
- [`memory-creator.md`](memory-creator.md) — the task record that outlives the
  plan, and the shape it must take.
- [`index-creator.md`](index-creator.md) — registering a file this creator adds.
- [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md) — a rule
  noticed while working, proposed rather than written.
