---
name: memory-tasks-agents-auto-activation-tool
description: One read-only tool that activates a session — the activation rule, the four mandatory standard files, and the routing table in a single call.
---

# One-Call Session Activation

## 2026-08-28 — planned

**Goal.** Session start currently costs six reads before any work begins: `AGENTS.md`, the
connector, the local root index, the local memory index, the four mandatory standard
files, and the trigger table. Four of those are shared and identical in every repository,
so every session pays the same cost to learn the same thing — and a session that skips a
step is activated wrong in a way nothing signals. The user wants to open a session, call
one tool, and be correctly activated.

**Objective.** A read-only tool that returns the shared half of the session-start sequence
in one call: `rules/auto-activation.md` in full, the four mandatory standard files in full,
and a routing table for everything else. `npm test` green, every mirror of the read
sequence updated.

**Detail.**

* **The tool cannot return everything.** Steps 1, 3 and 4 of the sequence are local files —
  `{repo}/AGENTS.md`, `{repo}/.agents/index/root-index.md`,
  `{repo}/.agents/index/memory-index.md` — which live on the caller's filesystem, not in
  this connector. The payload must say so plainly and name them, or a caller reads one tool
  and believes it is done when it is half activated. That warning is the difference between
  a shortcut and a trap.
* **The sequence itself does not change.** The six steps stay six steps in
  `rules/auto-activation.md`; the tool is how the shared part of them is satisfied in one
  read. Rewriting the sequence would mean rewriting it in four mirrors, and would strand
  every consuming repository whose `AGENTS.md` carries the old numbering.
* **Text is read from the registry, never restated.** Same constraint as `0.11.0`:
  `payloads.js` composes from registry entries, so `.agents/rules/set-mirrors.md` gains no
  new row.
* **The four files are named in one place.** A frozen constant, so a change to which files
  are mandatory is one edit and fails at boot rather than drifting between the rule and the
  tool.
* Published change → a release. Version proposed at task 4, not staged before approval.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/agents-auto-activation-plan` | This file, and its `memory-index.md` row. | |
| 2 | `feat/agents-auto-activation` | `MANDATORY_STANDARD_FILES`, `buildActivationPayload`, the `agents_auto_activation` tool, and its tests. | |
| 3 | `docs/auto-activation-one-call` | The one-call note in `rules/auto-activation.md`, the connector bootstrap block, the setup prompt's contract, both `AGENTS.md` mirrors, and the surface docs. | |
| 4 | `chore/release-0-12-0` | Version, changelog, both logs indexes, and the closing entry here. | |

## Per-task record

### Task 1 — `chore/agents-auto-activation-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

The decision this task exists to record: **the tool is additive, the protocol is not
rewritten.** The tempting version of this request is to replace the six-step sequence with
"call one tool". That would break the two things the sequence does which a tool cannot —
the local reads, and working at all when the connector is unreachable, which
`rules/auto-activation.md` has a whole section about. So the sequence stands and the tool
serves it.
