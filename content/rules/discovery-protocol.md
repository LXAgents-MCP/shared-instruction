---
name: discovery-protocol
description: How to handle a rule you think should exist — propose it, never self-apply it; what is gated, and where the canonical block is copied.
---

# Discovery Protocol

This is the single source of truth for how an agent handles a rule it thinks should
exist. It is its own file because it is a cross-cutting process rule: it belongs to no
single topic, and pasting it into a file about some other subject is exactly the
mistake [`directories.md`](agents://rules/directories.md) forbids.

## A. The canonical block

Every other copy of this block is made from the one below. It is reproduced verbatim.

```
## Discovery Protocol

While working, if you notice an instruction worth adding — a new rule, or new
content for an existing instruction file — do NOT create or edit it yourself.
Collect the findings, and when the task is done present them to the user:

* one finding per message block, each in its own code block;
* state the target set — `local` (this repository) or `shared` (the organization's
  instruction set served by the `lxagents-agents-base` connector);
* include the proposed file path, `name`, `description`, and the full proposed
  body;
* explain in one line why it is worth adding.

Then let the user select which findings to apply. Create only the selected ones.
Never batch-apply, never apply silently. A `shared` finding is never written from a
consuming repository — it is reported so it can be raised against the shared set.

**Scope of this gate:** it covers instruction files in either set. Documentation
pages under `wiki/` and `.agents/wiki/` may be written when the facts are real and
verified. Memory under `.agents/memory/` is written freely and automatically — see
`memory-policy.md`.
```

## B. Choosing the target set

Ask one question: *is this true for more than this repository?*

* **Yes → `shared`.** It belongs to the set served by the connector. From a consuming
  repository you never write it; you report it so it can be raised as a pull request
  against `LXAgents/mcp-server`.
* **No → `local`.** It belongs in `{repo}/.agents/`.

When it is genuinely ambiguous, propose it as `local` and note that it may be worth
promoting later. Never propose the same rule to both — that is how two sets of
conventions start disagreeing.

## C. What counts as a finding

* A rule that does not exist yet.
* A rule that exists but is wrong, stale, or contradicted by how the repository
  actually works.
* A missing folder or `{type}`.
* A convention the codebase clearly follows that nothing has written down.
* A local override that has outlived its reason and should be dropped.

A one-off preference the user stated for a single task is **not** a finding. Neither
is a duplicate you spotted in passing — that is
[`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md), and
it runs on request.

## D. What is gated and what is not

| Target | Gated? |
|---|---|
| Instruction files in either set | Yes — propose, wait for selection. |
| Index files | No — index rows follow their file, in the same commit. |
| `wiki/`, `.agents/wiki/` | No — write when the facts are real and verified. |
| `.agents/memory/` | No — write freely and automatically. |

## E. How to present findings

At the end of the task, not mid-flow. One code block per finding, never bundled into a
single block, never applied first and reported after.

The exception: if a finding **blocks** the current task — you cannot proceed correctly
without deciding it — say so and ask immediately instead of waiting for the end.

## F. Where the block is duplicated, and why

Verbatim copies of §A live in the files below, so an agent that opens only one of them
still sees the gate. This is a deliberate, listed exception to the "facts live once"
rule, and the duplication is bounded: **changing the block updates every copy in the
same commit.**

| Copy |
|---|
| `agents://AGENTS.md` |
| `agents://creators/instruction-creator.md` |
| `agents://creators/information-creator.md` |
| `agents://creators/changelog-creator.md` |
| `agents://creators/index-creator.md` |
| `agents://creators/memory-creator.md` |
| A consuming repository's root `AGENTS.md` |

The consuming repository's copy is written once at setup and re-synced whenever this
block changes and the repository next runs the `agents-setup` prompt.
