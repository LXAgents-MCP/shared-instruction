---
name: shared-instructions
description: The always-on task and git workflow mandate — what applies to every request without a trigger, and the three permission gates.
---

# Workspace Instructions

**These files are yours to edit.** A convention that lives here is not a vendored copy of
something better kept elsewhere — it *is* the convention. Improve it locally; there is
nowhere else for the improvement to go.

## A. One set

There is one instruction set, at `{repo}/.agents/`, and it is authoritative here.

**This workspace runs on plain `.md` files.** No MCP server serves them, no plugin supplies
them, no marketplace distributes them, and no second set exists to reconcile against. A
capability is recorded as a page, and never
installed, cloned, or resolved from somewhere else.

The `shared` / `local` vocabulary is retired. *"Is this true beyond this workspace?"* is
still worth asking of a rule, because a rule that only fits one situation is a sign the rule
is over-fitted — but the answer no longer decides where the file goes. There is one place it
goes.

## B. Changing a convention

Find the file that owns it — `AGENTS.md`'s Instruction tools block is the routing table and
gives the path — and edit it. That is the whole procedure.

The quality bars are the real constraint:

* A rule you **notice is missing** is still proposed to the owner, not written. Editing a
  rule that exists is ordinary work; inventing a new one is gated.
* Shape: every instruction file carries `name` and `description` frontmatter and covers
  one subject.
* A change this large wants a **memory record**, because the root has no version and no
  history.

**One caution that replaces the old one.** The root is not a git repository, so these files
have no version history. There is no `git diff` to recover a bad edit from and no rollback.
**Read before you overwrite, and prefer a targeted edit to a rewrite when you are unsure.**

## C. The always-on mandate

Everything in this section applies to **every** request, automatically. There is no trigger
phrase and no opt-in. A user who says only "fix the typo" has still asked for the procedure
below; silence is not an exemption, and neither is the size of the change.

This section is the **mandate**, not the procedure: it says what must happen on every
request, not how.

On every request you must:

* Read the Instruction tools block in the root `AGENTS.md` and declare the four mandatory
  tools.
* **Write a plan, and make sure `.agents/plans/` exists** before any work that is more
  than one step.
* Refine the requirements and put the plan in front of the user **before** writing a file
  or changing state.
* Wait for the user to **approve** that plan before writing a file, creating a branch, or
  changing state.
* Break the work into tasks and present the list before starting — task 1 is the record,
  task `n` is the release.
* Write the task record **before** the work, and append each task's entry as that task
  lands.
* Isolate each task on its own branch — one task, one branch, never two on one.
* Ask before opening a pull request, and ask again before merging one.
* Propose any instruction you think should exist — never write it yourself.
* Stop and write a diagnostic report the moment this workflow is bypassed despite
  activation having run.

**The gates are not trigger-gated; the procedures are.** `AGENTS.md` fires most conventions
from a trigger — the plan procedure on a request of more than one step,
the branch procedure when a branch is about to exist. What is *not* trigger-gated is the part
that has to stand before the work starts: **the gates live inline in `AGENTS.md`**, read from
disk at session start, while the tools supply the procedures that implement them.

The activation contract — routing table, precedence order, gates, cost discipline — lives in
that same `AGENTS.md` and nowhere else. It was briefly a separate rule file, which put
one hop between the file every session already opens and the rules for how to use it.

The distinction is the whole design. A permission gate first read at the moment you are about
to write a file has already failed; a branch-naming procedure fetched at the moment you name
a branch has not. So the cheap, always-true half is inline and the expensive,
sometimes-needed half is a call.

The discovery protocol is the sharpest case. Its trigger would fire
only once you had already recognised a finding for what it is — the point at which writing
the rule yourself is one edit away. Its gate therefore stands in `AGENTS.md` from the start
of every request, including the request that never mentions rules at all.

**The four are declared by every repository.** A repository may narrow the rest of its
declaration block to the conventions it uses; it may not drop one of these four, and it may
not carry them as a tool row without the inline gates.

## D. The three permission gates

All three are explicit-consent gates, and each is satisfied by permission the user has
already given — for this task or as a standing instruction. Once given, do not ask again.

* **Approving the plan.** Present the task list, then ask, and wait for a yes. Until it
  arrives, write no file, create no branch, and run nothing that changes state. Reading and
  searching to *build* the plan are not gated.
* **Opening a pull request.** Ask, and wait for a yes.
* **Merging a branch or a pull request.** Ask, and wait for a yes. Never merge on your own
  initiative, and never enable auto-merge unless you were asked.

**No gate is satisfied by inference.** A detailed request is not an approved plan, finishing
the work is not permission to open anything, and a green pipeline is not permission to merge
it.

**This file's name is retired.** It is still called `shared-instructions.md` because earlier
references point there, and there is nothing shared any more. The content is the always-on mandate, and
that is what it is about.
