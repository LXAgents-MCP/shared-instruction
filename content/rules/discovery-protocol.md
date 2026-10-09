---
name: discovery-protocol
description: How to handle a rule you think should exist — propose it, never self-apply it; what is gated, and where the canonical block is copied.
---

# Discovery Protocol

This is the single source of truth for how an agent handles a rule it thinks should
exist. It is its own file because it is a cross-cutting process rule: it belongs to no
single topic, and pasting it into a file about some other subject is exactly the
mistake the one-subject-per-file rule forbids.

## A. The canonical block

Every other copy of this block is made from the one below. It is reproduced verbatim.

```
## Discovery Protocol

While working, if you notice an instruction worth adding — a new rule, or new
content for an existing instruction file — do NOT create or edit it yourself.
Collect the findings, and when the task is done present them to the user:

* one finding per message block, each in its own code block;
* state the target set — `local`, which is this workspace's only set;
* include the proposed file path, `name`, `description`, and the full proposed
  body;
* explain in one line why it is worth adding.

Then let the user select which findings to apply. Create only the selected ones.
Never batch-apply, never apply silently.

**Scope of this gate:** it covers instruction files. Documentation
pages under `wiki/` and `.agents/wiki/` may be written when the facts are real and
verified. A project's memory under `.agents/memory/` is written freely and
automatically.
```

## B. Choosing the target set

Ask one question: *is this true for more than this repository?* It is still worth
asking — it tells you whether a rule is over-fitted to one situation — but it no longer
decides where the rule goes. There is one set, and it is `{repo}/.agents/`.

* **Either answer → `local`.** It belongs in `{repo}/.agents/`.
* **If the answer was yes**, say so in the finding. A rule that is true across
  repositories is a sign this workspace has outgrown its single scope — worth telling
  the user, not worth filing somewhere else.

## C. What counts as a finding

* A rule that does not exist yet.
* A rule that exists but is wrong, stale, or contradicted by how the repository
  actually works.
* A missing folder or `{type}`.
* A convention the codebase clearly follows that nothing has written down.
* A local override that has outlived its reason and should be dropped.

A one-off preference the user stated for a single task is **not** a finding. Neither
is a duplicate you spotted in passing — that is a duplicate audit, and it runs only
on request.

## D. What is gated and what is not

| Target | Gated? |
|---|---|
| Instruction files in either set | Yes — propose, wait for selection. |
| Index files | No — index rows follow their file, in the same commit. |
| `wiki/`, `.agents/wiki/` | No — write when the facts are real and verified. |
| `{repo}/.agents/memory/` | No — write freely and automatically. Never at a workspace root. |

## E. How to present findings

At the end of the task, not mid-flow. One code block per finding, never bundled into a
single block, never applied first and reported after.

The exception: if a finding **blocks** the current task — you cannot proceed correctly
without deciding it — say so and ask immediately instead of waiting for the end.

## F. Where the block lives, and why it is not copied

**There are no copies.** The gate is stated here, and every file that needs it links to
this section rather than reproducing it.

This section used to register seven verbatim copies as "a deliberate, listed exception"
to the facts-live-once rule, on the reasoning that an agent opening only a creator should
still see the gate. **Those copies were deleted**, and the exception with them. The gate
lives in this file and in the root `AGENTS.md`, which every session reads
before it reads anything else — so the failure the copies were protecting against, an agent
never seeing the gate at all, cannot happen.

The evidence for removing them: six byte-identical copies of an 85-line block all still asserted a connector that had
already been retired, because nobody edits six places when one rule changes. **A copy of a
rule outlives the rule it copies**, and the copies were wrong in the same direction at the
same time.

**The correct way to make a gate unavoidable is routing, not duplication.** Put the rule
where every session already looks, and link to it from everywhere else.
