---
name: memory-tasks-activation-inlining-audit
description: Auditing whether agents_auto_activation still inlines planning/task-workflow.md, and closing the test gap that let the question stay open.
---

# The Activation Payload Still Inlines the Task Workflow

## 2026-08-30 — planned

**Goal.** A report that `planning/task-workflow.md` was "missed or ignored" when
`agents_auto_activation` ran. If true, every consuming session plans nothing: no intake,
no task list, no stacked branches, and no signal that anything is wrong — the payload is
simply shorter.

**Objective.** Each of the four links in the chain checked against the running code, and
whatever is actually broken fixed.

**Detail.** Four checks were named, in order: the URI is in `MANDATORY_STANDARD_FILES`;
`requireEntry` resolves it; its full text lands in the `# The four mandatory standard
files` section; and it is filtered out of the routing array. Push only, no pull request.

## What the audit found

**Nothing was broken.** All four checks pass, in the working tree and on the deployed
connector. The finding is recorded here because it is what shapes the task list below:
had a link been broken, task 2 would have been a fix rather than a test.

| Check | Result |
|---|---|
| `agents://planning/task-workflow.md` in `MANDATORY_STANDARD_FILES` | Present, first, `src/constants.js:66`. |
| `requireEntry(registry, uri)` resolves it | Resolves — 9,681 bytes, `name: task-workflow`. |
| Full text inside the mandatory section | Inlined whole, between the section heading and the routing heading. |
| Excluded from `routing` | Absent from the table, as are the other three and the rule. |

No path resolution issue and no missing import. `DEFAULT_CONTENT_DIR` resolves `content/`
beside the package, `collectPaths` walks `planning/` because it is in
`INSTRUCTION_FOLDERS`, and the live connector returns the file in full — checked by
calling the deployed tool, not by reading the source and assuming.

**What was broken is the reason nobody could answer the question from the suite.**
`test/tools.test.js` derived every activation expectation from `MANDATORY_STANDARD_FILES`
itself:

```js
for (const uri of [AUTO_ACTIVATION_URI, ...MANDATORY_STANDARD_FILES]) { … }
```

A test that iterates the constant it is meant to guard cannot fail when that constant
shrinks — the loop runs one time fewer and passes. Verified rather than argued: deleting
the `task-workflow.md` line from `src/constants.js` left **80 of 80 tests passing**. The
routing test then actively required the dropped file to appear in the routing table, so
the suite would have blessed the regression rather than merely missing it.

That is the shape of the failure the report describes, and it was undetectable. So the
work is coverage, not code.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | The record | This file and its index row. | `shared-instruction` | `chore/activation-inlining-audit-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | — |
| 2 | Pin the mandatory set | Three regression tests, each proven to fail first. | `shared-instruction` | `test/activation-inlining` | `test/tools.test.js` | — |
| 3 | Close the record | Closing entry. No version, no changelog. | `shared-instruction` | `chore/activation-inlining-audit-close` | `.agents/memory/tasks/` | — |

Branches stack: 1 from `master`, 2 from 1, 3 from 2. No pull requests — the user asked
for pushes only, which is a narrower answer than the §F gate asks for and needs no
further permission.

**No release task, deliberately.** Slot `n` is the release, and there is nothing to
release: no file under `content/` changes, so no consuming repository sees anything, and
a version bump needs approval under
[`versioning.md`](../../../content/rules/versioning.md). Task 3 closes the record instead
— the same call the `claude-md-import` round made, and for the same reason.

## Per-task record

### Task 1 — `chore/activation-inlining-audit-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing
published, nothing in `src/` or `test/` touched.

Recorded because the interesting result is the one a diff cannot show: the answer to the
question asked was "the code is correct", and a branch that only adds tests looks, from
its diff alone, like tests added for no reason. The reason is the 80-of-80 pass with the
constant gutted, and it is written down here because it will not be reproducible from the
repository once the tests exist to prevent it.

### Task 2 — `test/activation-inlining`

Three tests added to `test/tools.test.js`, each mutation-proven on this branch before
being kept:

| Test | Fails when |
|---|---|
| `MANDATORY_STANDARD_FILES pins the four files, in order, and every one resolves` | The list is shortened, reordered, or points at a file that no longer exists. |
| `agents_auto_activation inlines planning/task-workflow.md inside the mandatory section` | The file stops being inlined, or lands outside the section. |
| `agents_auto_activation never routes to a file it already inlined` | The routing filter stops excluding the mandatory four or the rule. |

Mutation A — delete the `task-workflow.md` line from `src/constants.js`: 81 pass, **2
fail** (the first two above). Before this branch the same mutation passed 80 of 80.
Mutation B — drop `!MANDATORY_STANDARD_FILES.includes(entry.uri)` from the routing filter
in `src/server/payloads.js`: 82 pass, **1 fail** (the third). Both mutations were reverted
and the tree checked clean; `src/` is untouched by this branch.

The first test is written out **literally** rather than derived from
`MANDATORY_STANDARD_FILES`, which reads as duplication and is the entire point: it is the
one assertion in the suite that does not inherit its expectations from the thing it
guards. `repository.md` asks for tests that pin an invariant over tests that pin a
string — the invariant here is *which four files are mandatory*, and it cannot be
expressed by reading the list.

83 tests pass. Nothing under `content/` changed, so no consuming repository is affected
and nothing is published by this branch.
