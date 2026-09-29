---
name: auto-activation
description: How a repository declares which conventions fire unasked, what outranks what, and the recovery when activation does not take.
version: 1.0.0
author: LXAgents
---

# Auto-Activation

## The instruction set is always active

It applies **by default, silently, on every task**. The user never has to reference it,
link it, or ask for it. Silence is not permission to skip it. Treat these files as
standing orders, not as optional reference material.

**Always active is not the same as always loaded.** A convention that applies to every task
is not a convention that must be read before every task. Which conventions this repository
follows is declared once, in its `AGENTS.md`; the text of each one is fetched when its
trigger fires. The two are separate, and conflating them is what made session start cost
thirty thousand characters before a word of work was done.

## Session-start sequence

Before doing any work:

1. Read the repository's root `AGENTS.md`, **including its Shared instruction tools block** —
   that block is the routing table for everything below.
2. Resolve the shared set — [`mcp-connector.md`](agents://rules/mcp-connector.md).
3. Read `{repo}/.agents/index/root-index.md`.
4. Read `{repo}/.agents/index/memory-index.md` and load only the memory rows whose
   scope matches the current request, so you continue prior work instead of restarting
   it.

That is the whole sequence. **Do not call a convention tool at session start.** Every step
above reads a file in the repository itself; the shared set is resolved but not consumed
until a trigger fires. A session that opens by pulling the task workflow, the branch rules
and the commit format has paid for three procedures before knowing whether the request needs
any of them.

## Every file is a tool, and each repository declares which apply

The shared set publishes **one read-only tool per file**, so the tool list *is* the file
list. A tool is named after its own filename — `git/commit-conventions.md` is
`commit_conventions` — with one exception: `AGENTS.md` is `agents_entry_point`, because
`agents` says nothing about which document it is. A file added to the set gets its tool
on the next boot; nothing is registered by hand.

A repository's `AGENTS.md` carries a **Shared instruction tools** block listing the tools
it uses, the trigger for each, and the set version it adopted. That block — not this
file — is what a session routes on.

| Tool | Serves | Fires when you are about to… |
|---|---|---|
| `plan_creator` | `creators/plan-creator.md` | Take in any request of more than one step |
| `branching_strategy` | `git/branching-strategy.md` | Create a branch |
| `commit_conventions` | `git/commit-conventions.md` | Write a commit message |
| `discovery_protocol` | `rules/discovery-protocol.md` | Notice a rule that should exist |
| `pull_request_template` | `git/pull-request-template.md` | Open or update a pull request |
| `model_naming_convention` | `rules/model-naming-convention.md` | Write to any `model_name` column |
| `no_session_links` | `rules/no-session-links.md` | Write anything that will be committed or posted |
| `versioning` | `rules/versioning.md` | Touch anything carrying a version number |
| `mcp_list` | the set's own server registry | Find out which other servers exist |

**No tool takes an argument.** A tool names one file, so there is no path to pass, no
lookup to guess at, and nothing for a caller to traverse with. The full list of tools is
whatever the client enumerates; `mcp_list` answers "what exists?" for the *other* servers,
not for this one.

Where a client exposes no tools, the model is unchanged — the declaration block names the
same conventions, and each is read as its `agents://` resource instead.

### The four that are not optional

`plan_creator`, `branching_strategy`, `commit_conventions` and `discovery_protocol`
appear in **every** repository's declaration block. A repository may narrow the rest of
the table to what it actually needs; it may not narrow these.

**Their gates are inline, not behind the tool.** A permission gate first read at the moment
you are about to write a file has already failed. So `AGENTS.md` carries the gates
themselves — approve the plan before writing, ask before opening a pull request, ask before
merging, and the discovery-protocol block — while the tools carry the *procedures* that
implement them. The mandate is
[`shared-instructions.md`](agents://rules/shared-instructions.md) §H.

[`discovery-protocol.md`](agents://rules/discovery-protocol.md) is the one to watch. Its
trigger fires only once you have recognised a finding for what it is, and by then writing
the rule into the set yourself is one edit away — which is why the gate stands inline from
the start of the request and the tool exists only to supply the rest of the procedure.

## Trigger table for the rest of the set

This file is the source of truth for these rows. A repository declares the ones it needs.
Each `{shared}` row is a tool call, named after the file; the `{repo}` rows are files in
the consuming repository and are read from disk.

| When you are about to… | Call or read |
|---|---|
| Write **any** commit, tag, PR, comment, or file that will be committed or posted | `no_session_links` |
| Wonder whether something is local or shared, or need to override a shared rule | `shared_instructions` |
| Decide where a new file goes | `directories` |
| Resolve, connect, or fail to reach the shared set | `mcp_connector` |
| Add, move, rename, or delete any file in a set or in `wiki/` | `index_creator` |
| Write a rule or instruction | `instruction_creator` |
| Write documentation, an SOP, or a domain guideline | `information_creator` |
| Write or change a security file — a policy, a threat model, or a security SOP | `security_creator` |
| Change code or structure that a document describes | `change_propagation` |
| Record progress, a decision, or session state | `memory_creator` |
| Touch anything that carries a version number | `versioning` |
| Record a release | `changelog_creator` |
| Report finished work back to the user | `work_summary` |
| Find a probable duplicate of a shared file — **on request only** | `duplicate_instruction_audit` |
| Update a repository against a newer set version — **on request only** | `agents_update` |
| Find out which other instruction servers exist | `mcp_list` |
| Need project facts, commands, or orientation | `{repo}/.agents/wiki/context/repository-map.md` |
| Do anything at all in this project | `{repo}/.agents/rules/repository.md` |

Any row whose file is overridden locally resolves to the local copy — that is what the
override table in `root-index.md` is for.

### Declaring these tables in a consuming repository

A consumer does **not** mirror this file row-for-row. It declares the subset it uses, which
is the point: a repository with no `model_name` column anywhere should not be carrying a row
about one.

What a consumer must do:

* Declare all four mandatory tools, and stamp the set version it adopted.
* Declare a row for every convention it genuinely uses, with the trigger this file gives it.
* **Append rows for its own local instructions** — one per file in `.agents/` that should
  fire on a trigger. Without those a repository's own conventions never activate.

What a consumer must not do: drop one of the four, invent a trigger this file does not give,
or repoint a row at a local file. Repointing is an override, and an override is declared in
the override table of `.agents/index/root-index.md`, never by quietly editing a trigger.

Keeping the block current when this set moves is
[`prompts/agents-update.md`](agents://prompts/agents-update.md), on request.

## The two things that never auto-activate

`duplicate_instruction_audit`
([`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md)) and
`agents_update`
([`agents-update.md`](agents://prompts/agents-update.md)) run **on request only**. Neither
is part of session start, and neither fires because you noticed something. The first
proposes deletions; the second edits `AGENTS.md`. If you spot a probable duplicate, or a
version stamp behind the current set, note it, finish the task, and mention it at the end.
The user decides whether to run either.

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
most, and `{shared}/git/branching-strategy.md` for the next most common: a harness that
names the branch to work on, in a format the convention forbids.

Setting one aside is not silent. **Say which default you are overriding and which rule
overrides it**, in the session and in the task record.

## A missing shared set is not permission to improvise

If resolution failed, work from the local set, say which conventions you could not read,
and do not invent replacements.

## When activation runs but the workflow does not

The section above is about a set you could not reach. This one is the opposite failure,
and it is the common one: activation **succeeded** — the block was read, the tools were
there — and the workflow still did not happen. No plan went to the user, no branch was
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
whether to fix the repository's own configuration — usually `{repo}/AGENTS.md`: a
declaration block missing one of the four mandatory tools, a stamp naming a version older
than the set, a row naming a tool that no longer exists, gates that were never written
inline, or an entry point that never mentions the set at all.

**Ask; do not edit.** `AGENTS.md` is an instruction artifact, so
[`discovery-protocol.md`](agents://rules/discovery-protocol.md) governs it: propose the
change with the file named and the body written out, and wait to be selected. Repairing
the mechanism that failed to constrain you is not a repair you make unsupervised.

### 3. Write the diagnostic report

A short report, in the session, saying **why** it happened. Not an apology — a cause.

| Part | What it must say |
|---|---|
| **What was skipped** | The named step, from the sequence above or the four mandatory tools. "The branch and commit conventions were bypassed", not "I made a mistake". |
| **Why** | The mechanism. The declaration block was read at session start and never consulted again once work began; a harness default contradicted a rule and won because nothing checked; the request looked small enough that planning felt disproportionate; the trigger fired before the work revealed which row it needed. |
| **What it cost** | What is now wrong that otherwise would not be — an unreviewed plan, a mis-named branch, a commit needing amendment — and what putting it right would take. |

The middle row is the one to insist on. "The workflow was not followed" restates the
question. "The declaration block was read at session start and never consulted again once
the work began" is a cause — and it is the right one often enough to be worth checking
first.

**The report is owed even when nothing is enforced.** If the user declines both questions
above, write it anyway and record it under `{repo}/.agents/memory/`. It is the only part
of this that outlives the session, and the next session starts by reading memory.

## Cost discipline

Load what the trigger names and nothing more. Never call every declared tool to "have them
ready" — there are more than thirty, and calling them all reproduces the single oversized
payload this design replaced, one call at a time. Enumerating the tool list is free and
always tells you what exists; `mcp_list` does the same for the other servers. Read a body
only once its tool has been selected.

## Overrides and the escape hatch

When the user overrides a rule, **say which rule you are setting aside**, and record it
in `.agents/memory/decisions/` if it will recur. If the user says "ignore the agent
instructions for this", obey them for that task only, and note it.
