---
name: memory-tasks-activation-security
description: Making plan approval a third permission gate, defining the workflow-fallback recovery, and giving this repository its own local security context.
---

# The Plan Gate, the Fallback, and a Local Security Context

## 2026-09-01 — planned

**Goal.** Two problems, one round. First: the workflow already says to put a plan in
front of the user, but it is not a **gate** — nothing states what counts as approval, so
a session can present a plan and start writing in the same breath and still claim it
complied. Second: activation demonstrably runs and the workflow is still bypassed —
`agents_auto_activation` returns, and the branch, commit and planning conventions are
skipped anyway, with nothing in the session signalling it. Both failures are silent,
which is what makes them worth writing down rather than fixing case by case.

**Objective.** Plan approval is a named permission gate beside the pull request and merge
gates; a session that notices the workflow slipping has a defined recovery instead of
improvising; and this repository carries its own security context that loads on security,
authentication, and deployment work without being asked. `npm test` green; every mirror
updated in the same commit as the text it reproduces.

**Detail.**

* **Both target files are inlined whole into the activation payload.** `auto-activation.md`
  and `planning/task-workflow.md` are two of the five files `agents_auto_activation`
  returns in full, so a change to either reaches every consuming repository on its next
  call with no upgrade step. That is what makes this a release rather than an edit.
* **"The two permission gates" is reproduced in four places outside its authority.**
  `shared-instructions.md` §H owns the sentence; root `AGENTS.md`,
  `content/prompts/agents-setup.md`, and `src/tools/mcp-creator.js` all restate it. The
  last is a hard-coded string array in source rather than prose, so it does not turn up
  in a search for markdown — the exact mirror `set-mirrors.md` exists to catch, and the
  one `0.8.0` shipped stale into every scaffolded repository.
* **The security context is local, so its trigger row is local.** The shared trigger table
  is mirrored row-for-row by every consumer, and `agents-setup.md`'s checklist requires
  every file a row names to exist. A row pointing at `.agents/wiki/security/…` would be a
  broken row in every repository that has not created that tree. The row belongs in this
  repository's **appended** local rows, which is what
  `auto-activation.md` § *Mirroring this table in a consuming repository* prescribes.
* **`wiki/security/` and `.agents/wiki/security/` are new folders.** `directories.md` §F.6
  requires registering a new folder in its tables and in the owning index in the same
  commit. §C and §D both gain a row.
* Published change → a release. `0.13.0`, minor, approved before anything was staged.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | The record | This file and its index row. | `shared-instruction` | `chore/activation-security-plan` | `.agents/memory/tasks/`, `.agents/index/memory-index.md` | |
| 2 | The plan gate and the fallback | The third gate, the recovery procedure, and four mirrors. | `shared-instruction` | `feat/activation-plan-gate` | `content/planning/`, `content/rules/`, `content/prompts/`, `AGENTS.md`, `src/tools/`, `test/` | |
| 3 | The local security context | Two pages, two new folders, two index rows, one trigger row. | `shared-instruction` | `docs/security-context` | `wiki/security/`, `.agents/wiki/security/`, `content/rules/directories.md`, `.agents/index/`, `AGENTS.md` | |
| 4 | The release | `0.13.0`, changelog, both logs indexes, and the closing entry here. | `shared-instruction` | `chore/release-0-13-0` | `package.json`, `wiki/logs/0/13/0/`, `content/index/logs-index.md`, `.agents/index/logs-index.md`, `.agents/memory/tasks/` | |

Branches stack: 1 from the tip of the line carrying `0.12.0`, 2 from 1, 3 from 2, 4 from
3. The `PR` column is filled by task 4 if pull requests are opened, per §F — branch 4
already contains every branch below it, so writing the numbers there rebases nothing.

## Two decisions taken at the plan gate, recorded because they will recur

**The branch names.** The session harness assigned `claude/lxagents-activation-security-vejqmt`
and instructed that nothing be pushed elsewhere without permission.
[`branching-strategy.md`](../../../content/git/branching-strategy.md) forbids a
tool-preset prefix by name, and
[`auto-activation.md`](../../../content/rules/auto-activation.md) § *Tool-injected
defaults rank below rules* says a harness instruction that contradicts a rule does not
win. Rather than resolve that silently in either direction, it went to the user at the
plan gate; they chose the repository convention and, in choosing it, gave the permission
the harness required. **The rule and the harness were both satisfied because the conflict
was surfaced instead of decided.** That is the argument for the gate this round adds,
made by the round itself.

**The commit trailer.** The same harness appends a `Claude-Session:` trailer. That one did
**not** go to the user: [`no-session-links.md`](../../../content/rules/no-session-links.md)
forbids it outright and the tool-injected-defaults paragraph settles the precedence, so
there was nothing to decide. It is stripped from every commit in this round. The
distinction is worth keeping: a conflict a rule already resolves is obeyed, not escalated;
a conflict where obeying either side breaks something is escalated. Asking about the
trailer too would have taught the user that the gate fires on questions with known
answers.

## Per-task record

### Task 1 — `chore/activation-security-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published,
nothing under `content/` touched.

The decision this task exists to record: **the fallback rule is a section of
`auto-activation.md`, not a new file.** The tempting placement is a new
`rules/workflow-recovery.md`, because the procedure is long enough to look like its own
subject. It is not. `auto-activation.md` already carries *A missing shared set is not
permission to improvise* — the failure mode where activation cannot happen. The new
section is its sibling: activation happened and did not take. Same subject, same file,
and splitting them would leave two files each describing half of "what to do when
activation fails", which is the near-duplicate `directories.md` §F.7 forbids.

### Task 2 — `feat/activation-plan-gate`

The plan gate is now a **named permission gate**, and the workflow-fallback recovery is a
section of `auto-activation.md`. Eight files, one commit, because six of them reproduce
text the other two own.

| File | Change | Published? |
|---|---|---|
| `content/planning/task-workflow.md` | §B gains *The plan gate* — what counts as approval, what does not, what is not gated, and the re-arm rule. §A now points at it. | Yes |
| `content/rules/auto-activation.md` | New section: *When activation runs but the workflow does not* — the three obligations and the diagnostic report table. | Yes |
| `content/rules/shared-instructions.md` | §H: two gates become three; two mandate rows added (approve the plan, report a bypass). | Yes |
| `content/prompts/agents-setup.md` | The contract block a new repository writes for itself, plus a checklist line for the three gates. | Yes |
| `content/index/instructions-index.md` | Purpose rows for the two changed files. | Yes |
| `AGENTS.md` | This repository's mirror of the always-on paragraph. | No |
| `src/tools/mcp-creator.js` | The same paragraph, hard-coded into every scaffolded repository. | No |
| `test/tools.test.js` | One regression test. | No |

**What the change actually is.** §H already said to put a plan in front of the user
before writing a file, and §B already said to wait for confirmation. Neither was a
**gate**: nothing stated what counts as approval, so a session could present a plan and
start writing in the same message and still claim compliance. The new text is almost
entirely the negative half — *what does not count* — because that is the half that was
missing, and because every item on that list is a real way the old wording was satisfied
without the user ever approving anything. "The request being detailed" is the one worth
keeping: a precise request is the case where skipping the gate feels most justified and
is least visible.

**Why the fallback landed in `auto-activation.md` rather than a new file.** Argued in task
1's entry and unchanged by the implementation: the file already carries *A missing shared
set is not permission to improvise*, and the new section is its sibling — activation that
could not happen, and activation that happened without taking.

**The mirror that would have been missed.** `src/tools/mcp-creator.js:675` carries the
sentence as a **string array in source**, not as prose, so a grep for the markdown line
does not find it. It is in `set-mirrors.md` for exactly this reason, and it earned the row
again this round: without it, every repository scaffolded by `mcp_creator` would have been
created telling its agents there are two gates.

**One mirror deliberately not updated.** `wiki/logs/0/5/0/CHANGELOG.md` also says "two
permission gates". It is released history, and
[`versioning.md`](../../../content/rules/versioning.md) forbids editing a released log to
change history — corrections go in the next version's log. It stays wrong on purpose,
because it is a true record of what `0.5.0` shipped.

**Tests: 84 pass, up from 83.** The new one is `agents_auto_activation carries the plan
gate and the workflow-fallback recovery`, and it was mutation-proven before being kept:

| Mutation | Result |
|---|---|
| Rename the fallback heading in `auto-activation.md` | 83 pass, **1 fail** |
| Restore the old "Wait for the user to confirm" wording in `task-workflow.md` | same test fails |
| Both reverted | 84 pass, tree clean |

The test guards the payload rather than the files, which is the point: both behaviours
reach a consuming repository only by being inlined into `agents_auto_activation`, and both
fail **silently** if dropped — a session with no plan gate starts writing immediately and
looks productive, and one with no fallback bypasses the workflow and looks fine. That is
the same argument the discovery-protocol gate test rests on, and it is the reason this
assertion is not redundant with the inlined-whole test beside it.

### Task 3 — `docs/security-context`

Two pages, two new folders, and the trigger row that makes them load without being asked.

| File | Tree | Carries |
|---|---|---|
| `wiki/security/security-model.md` | Human | Trust boundaries, the attack-surface table, the two-channel `mcp_creator` design, secrets, deployment caveats. |
| `.agents/wiki/security/security-boundaries.md` | Agent | The isolation rule, the per-surface checklist, what to escalate, what is not a finding. |

**The isolation rule is the point of the round, not the page count.** The request was for
a security context that does not mix across repositories, and the mechanism is §A of the
agent page: a security conclusion is stated *about a named repository*, a mitigation
learned elsewhere is re-derived here rather than assumed, and a threat model is never
copied between repositories. The worst case is named explicitly because it is the
comfortable one — this repository has no authentication and no secrets **by design**, and
carrying "there is nothing to protect here" into a repository that holds credentials is
the failure that feels like context rather than a claim.

**Facts live once.** `directories.md` §D and `information-creator.md` both forbid
mirroring between the trees, so the agent page opens by sending the reader to the human
page and then carries only what an agent must *do*. The attack-surface table appears in
`wiki/` and nowhere else.

**Every fact was read out of the code, not assumed.** `resolveTarget` and the
`root: process.cwd()` argument in `src/server/tools.js`; `MAX_REQUEST_BODY` at 4 MB and
`DEFAULT_MAX_SESSIONS` at 1000 in `src/constants.js`; `originGuard` in
`src/transport/http.js`; `--ignore-scripts` and `USER node` in the `Dockerfile`; the eight
environment variables, none of which is a credential. The one that changed the page rather
than confirming it: **`MCP_DNS_REBINDING_PROTECTION` defaults to `false`**
(`src/config.js:107`), so the origin and host allow-lists do nothing unless it is switched
on. That is a real caveat for a public deployment and it is now written down.

**Two new folders, registered in the same commit** per `directories.md` §F.6: `security/`
added to the §C `wiki/` table and to the §D `.agents/wiki/` type table — a published edit,
so it belongs to this release. `.agents/wiki/security/` is a new `{type}`, not a file
forced into `sop/`, because §F.5 says to create the folder that fits rather than rename the
file to suit the closest one.

**The trigger row is local, and that is the architectural decision here.** It went into
this repository's **appended** rows in `AGENTS.md`, not into
`content/rules/auto-activation.md`. The shared table is mirrored row-for-row by every
consumer, and `agents-setup.md`'s checklist requires every file a row names to exist — so a
shared row pointing at `.agents/wiki/security/…` would be a broken row in every repository
that has not created that tree, and would also publish a repository-specific rule, which
`shared-instructions.md` §A forbids the producer twice over. Put to the user at the plan
gate; they chose local. **The shared version is a discovery finding, not a silent
addition.**

Also updated, per `change-propagation.md`: the `README.md` documentation list and the
further-reading list in `repository-map.md`. 84 tests pass, unchanged — this task touches
no code.

### Task 4 — `chore/release-0-13-0`

`0.13.0`, minor, approved at the plan gate before anything was staged — a gate added, a
recovery added, nothing renamed or removed.

| Carrier | State |
|---|---|
| `package.json` | `0.12.0` → `0.13.0` |
| `wiki/logs/0/13/0/CHANGELOG.md` | New |
| `content/index/logs-index.md` | Row added, newest first |
| `.agents/index/logs-index.md` | Row added, newest first |
| `compose.yaml` | Still `0.0.0` — unchanged since the first release, still deliberate |

**The `Consumers must` line says something the previous release could not.** `0.12.0` was
able to promise that doing nothing stayed correct, because it extended the sequence rather
than rewriting it. This one cannot: a session that has not read the new §B will still
present a plan and start work in the same breath, which is precisely what the gate
forbids. The entry says so in bold rather than burying it, because a consumer who reads
"must" for something optional starts discounting the column — and the inverse, a real
behaviour change filed under "re-read a file", is how a gate gets silently ignored.

**The changelog carries a *Not published* section.** The security pages and the local
trigger row ship in the same release but reach no consumer, and `directories.md` §C/§D
gaining a `security/` row each **is** published. Splitting the entry that way is more
honest than either omitting the local work or letting a consumer think a new folder
convention was imposed on them.

**`repository-state.md` corrected a stale claim while it was open.** It said `0.12.0` was
the unmerged tip. In fact `origin/master` is at `dd87eee` carrying `0.10.0`, 49 commits
behind, and everything from `0.10.1` onward lives on the stacked line. That is exactly the
kind of staleness the file warns about in its own `0.10.0` paragraph — the next session
plans a branch point from it — so the paragraph now names the commit and the version
`master` is actually at.

## Record closed

Four tasks, four stacked branches, 84 tests passing on the last of them, which contains
the other three.

**The `PR` column is empty on purpose.** No pull request was opened: §F gates that on
asking, and it was not asked for in this round. The column is filled by whoever opens
them.

**What this round proves about itself.** The plan gate it adds is the gate it ran under.
The branch-name conflict between the harness and `branching-strategy.md` reached the user
because a plan was put in front of them first; had the work started on the assigned
`claude/…` branch, the conflict would have been resolved silently in the harness's favour
and nobody would have seen it. That is the whole argument for the rule, and it is the
reason this record is worth reading before the next round rather than after.
