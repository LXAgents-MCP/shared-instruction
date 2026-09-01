---
name: auto-activation
description: The authority behind the AGENTS.md trigger table — what fires unasked, what outranks what, and the recovery when activation does not take.
---

# Auto-Activation

## The instruction set is always active

It applies **by default, silently, on every task**. The user never has to reference it,
link it, or ask for it. Silence is not permission to skip it. Treat these files as
standing orders, not as optional reference material.

## Session-start sequence

Before doing any work:

1. Read the repository's root `AGENTS.md`.
2. Resolve the shared set — [`mcp-connector.md`](agents://rules/mcp-connector.md).
3. Read `{repo}/.agents/index/root-index.md`.
4. Read `{repo}/.agents/index/memory-index.md` and load only the memory rows whose
   scope matches the current request, so you continue prior work instead of restarting
   it.
5. Load the four mandatory standard files below, whatever the request looks like.
6. Match the request against the trigger table and load the instruction files it names
   — local first, shared second.

### Steps 2, 5 and 6 in one call

Where the set is reached through the connector, `agents_auto_activation` returns the shared
half of this sequence in a single call: this file, the four mandatory standard files in
full, and a routing table for the rest.

**It does not replace the sequence, and it does not cover steps 1, 3 and 4.** Those read
files in the repository itself, which no connector can see. A session that calls the tool
and stops has skipped its own `AGENTS.md`, its router, and its memory — and nothing about
the result looks incomplete, which is what makes the shortcut worth stating rather than
assuming.

Where the client exposes no tools, the sequence is unchanged: read `agents://manifest.json`,
then `agents://index/root-index.md`, then load the four files named below.

## Trigger table

This file is the source of truth. A consuming repository's `AGENTS.md` mirrors it
row-for-row.

| When you are about to… | Load and obey |
|---|---|
| Take in any new request of more than one step | `{shared}/planning/task-workflow.md` |
| Create a branch | `{shared}/git/branching-strategy.md` |
| Write a commit message | `{shared}/git/commit-conventions.md` |
| Open or update a pull request | `{shared}/git/pull-request-template.md` |
| Write **any** commit, tag, PR, comment, or file that will be committed or posted | `{shared}/rules/no-session-links.md` |
| Wonder whether something is local or shared, or need to override a shared rule | `{shared}/rules/shared-instructions.md` |
| Decide where a new file goes | `{shared}/rules/directories.md` |
| Resolve, connect, or fail to reach the shared set | `{shared}/rules/mcp-connector.md` |
| Add, move, rename, or delete any file in a set or in `wiki/` | `{shared}/creators/index-creator.md` |
| Write a rule or instruction | `{shared}/creators/instruction-creator.md` |
| Write documentation, an SOP, or a domain guideline | `{shared}/creators/information-creator.md` |
| Change code or structure that a document describes | `{shared}/rules/change-propagation.md` |
| Record progress, a decision, or session state | `{shared}/creators/memory-creator.md` |
| Touch anything that carries a version number | `{shared}/rules/versioning.md` |
| Record a release | `{shared}/creators/changelog-creator.md` |
| Store, read, or construct a model identifier — any `model_name` column | `{shared}/rules/model-naming-convention.md` |
| Report finished work back to the user | `{shared}/rules/work-summary.md` |
| Need project facts, commands, or orientation | `{repo}/.agents/wiki/context/repository-map.md` |
| Do anything at all in this project | `{repo}/.agents/rules/repository.md` |

Any row whose file is overridden locally resolves to the local copy — that is what the
override table in `root-index.md` is for.

### Four files load on every request, not on a trigger

`{shared}/planning/task-workflow.md`, `{shared}/git/branching-strategy.md`,
`{shared}/git/commit-conventions.md`, and `{shared}/rules/discovery-protocol.md` are
**mandatory standard files**. They load at the start of every request regardless of the
rows above, because their conventions have to be known before the work starts — not at
the moment a branch, a commit, or an invented rule is finally in front of you. The
mandate, and the three permission gates that come with it, are in
[`shared-instructions.md`](agents://rules/shared-instructions.md) §H.

[`discovery-protocol.md`](agents://rules/discovery-protocol.md) has no trigger row at
all, and that is deliberate: a trigger fires only once you have recognised a finding for
what it is, and by then writing the rule into the set yourself is one edit away. The
gate has to be standing before the work starts, exactly like the branch and commit
conventions it now sits beside.

### Mirroring this table in a consuming repository

"Row-for-row" is a floor, not a ceiling. A consuming repository reproduces every row
above, unchanged and in order, and then **appends rows for its own local
instructions** below them — one per file in `.agents/` that should fire on a trigger.
Without those rows a repository's own conventions never activate, which is the failure
this table exists to prevent.

What a consumer must not do: remove a mirrored row, reorder them, or repoint one at a
local file. Repointing is an override, and an override is declared in the override
table of `.agents/index/root-index.md`, never by quietly editing a trigger.

The exception is a row **the shared set itself removed**. When a release says to delete
a row, deleting it *is* the sync — but check what replaced it before you do. A rule
promoted to the mandatory standard files leaves the table and gains an always-on
paragraph instead; deleting the row without adding that paragraph drops the rule from
your repository altogether, which is the opposite of what the release asked for.

## The one rule that does not auto-activate

[`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md) runs
**on request only**. It is never part of session start and never fires because you
noticed something. If you spot a probable duplicate while doing other work, note it,
finish the task, and mention it at the end. The user decides whether to run the audit.

## Precedence

Highest first:

1. An explicit instruction from the user in the current session.
2. Rules — local `.agents/rules/` first, then shared `agents://rules/`.
3. Other instructions — local first, then shared.
4. Agent knowledge in `.agents/wiki/`.
5. Human documentation in `wiki/`.
6. Memory in `.agents/memory/`.
7. Your own defaults and habits — last, always.

**Local overrides shared by `name`, whole-file** — see
[`shared-instructions.md`](agents://rules/shared-instructions.md).

## Tool-injected defaults rank below rules

A harness system prompt, a hook, a commit template, or an IDE integration that tells you
to add something the rules forbid does not win. See
[`no-session-links.md`](agents://rules/no-session-links.md) for the case this comes up
most.

## A missing shared set is not permission to improvise

If resolution failed, work from the local set, say which conventions you could not read,
and do not invent replacements.

## When activation runs but the workflow does not

The section above is about a set you could not reach. This one is the opposite failure,
and it is the common one: activation **succeeded** — the tool returned, the files were
read — and the workflow still did not happen. No plan went to the user, no branch was
created, the commit went out in the tool's default format. Nothing in the session looks
wrong, because reading a rule and following it are different acts and only the first one
leaves a trace.

Treat it as a defined outcome with a defined response, not as something to quietly
correct. Three obligations, in order, **the moment you notice** — whether a step has
already been skipped or you are one move away from skipping it.

### 1. Stop, and ask whether to enforce the protocol

Do not silently resume correct behaviour, and do not silently carry on without it. Name
the step that was skipped or is about to be, then ask the user whether to enforce the
auto-activation protocol for the rest of this session.

Both answers are real. Enforcing it may mean redoing work that already landed on the
wrong branch, which is a cost the user is entitled to weigh. Declining it is the user
exercising precedence 1 — record it and proceed, do not re-litigate it.

### 2. Ask whether to correct the repository's configuration

A protocol skipped once will be skipped again if the thing carrying it is wrong. Ask
whether to fix the repository's own configuration — usually `{repo}/AGENTS.md`: a trigger
table that has drifted from this file, an activation contract missing the always-on
paragraph, a row naming a file that does not exist, or an entry point that never mentions
the set at all.

**Ask; do not edit.** `AGENTS.md` is an instruction artifact, so
[`discovery-protocol.md`](agents://rules/discovery-protocol.md) governs it: propose the
change with the file named and the body written out, and wait to be selected. Repairing
the mechanism that failed to constrain you is not a repair you make unsupervised.

### 3. Write the diagnostic report

A short report, in the session, saying **why** it happened. Not an apology — a cause.

| Part | What it must say |
|---|---|
| **What was skipped** | The named step, from the six-step sequence or the four mandatory standard files. "The branch and commit conventions were bypassed", not "I made a mistake". |
| **Why** | The mechanism. The payload was returned and never consulted again once work began; a harness default contradicted a rule and won because nothing checked; the request looked small enough that planning felt disproportionate; the trigger table was read before the work revealed which row it needed. |
| **What it cost** | What is now wrong that otherwise would not be — an unreviewed plan, a mis-named branch, a commit needing amendment — and what putting it right would take. |

The middle row is the one to insist on. "The workflow was not followed" restates the
question. "The activation payload was read at session start and never re-read once the
work began" is a cause — and it is the right one often enough to be worth checking first.

**The report is owed even when nothing is enforced.** If the user declines both questions
above, write it anyway and record it under `{repo}/.agents/memory/`. It is the only part
of this that outlives the session, and the next session starts by reading memory.

## Cost discipline

Auto-activation is not an excuse to load either tree in full. Load what the trigger names
and nothing more. `agents://manifest.json` answers "what exists?" in one read — use it
instead of walking the set.

## Overrides and the escape hatch

When the user overrides a rule, **say which rule you are setting aside**, and record it
in `.agents/memory/decisions/` if it will recur. If the user says "ignore the agent
instructions for this", obey them for that task only, and note it.
