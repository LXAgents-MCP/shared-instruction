---
name: auto-activation
description: The authority behind the AGENTS.md trigger table — when each instruction fires without being asked, and what outranks what.
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
mandate, and the two permission gates that come with it, are in
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

## Cost discipline

Auto-activation is not an excuse to load either tree in full. Load what the trigger names
and nothing more. `agents://manifest.json` answers "what exists?" in one read — use it
instead of walking the set.

## Overrides and the escape hatch

When the user overrides a rule, **say which rule you are setting aside**, and record it
in `.agents/memory/decisions/` if it will recur. If the user says "ignore the agent
instructions for this", obey them for that task only, and note it.
