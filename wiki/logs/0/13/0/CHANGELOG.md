# 0.13.0

**Released:** 2026-09-01

Makes plan approval a permission gate rather than a suggestion, and defines what to do
when activation runs and the workflow is bypassed anyway. Both changes are to files
`agents_auto_activation` inlines whole, so they reach a consuming session at the moment
they matter.

**Consumers must:** re-read `planning/task-workflow.md` §B and
`rules/shared-instructions.md` §H, and update the always-on paragraph beside your trigger
table — it now names **three** permission gates, not two. That one word is the only edit
to your `AGENTS.md`. No file was renamed, no `name` changed, no rule was removed, and no
trigger row moved or was added, so no override needs dropping.

**This one changes behaviour rather than only wording.** Unlike `0.12.0`, doing nothing
does not stay correct: a session that has not read the new §B will still present a plan
and begin work in the same breath, which is exactly what the gate now forbids.

## Added

- **The plan gate** — `planning/task-workflow.md` §B. Presenting the plan is not the
  gate; the user's approval is. Until it arrives: no file written, no branch created,
  nothing run that changes state.

  The rule is mostly its negative half, because that is the half that was missing.
  Approval is **not**: silence, an answer to a different question inside the plan, the
  request being detailed, your own confidence, or a harness prompt telling you to
  proceed. Read-only work that *builds* the plan is explicitly not gated — the gate
  stands between the plan and the first change, not between the request and the first
  read.

  It re-arms when the plan changes. The only plan the user approved is the one they saw.

- **The workflow-fallback recovery** — `rules/auto-activation.md`, *When activation runs
  but the workflow does not*. The sibling of the existing *A missing shared set is not
  permission to improvise*: that one covers a set you could not reach, this one covers
  activation that succeeded and did not take.

  Three obligations, the moment you notice, whether a step has been skipped or is about
  to be:

  | # | Obligation |
  |---|---|
  | 1 | Stop, name the skipped step, and ask whether to enforce the protocol for the rest of the session. |
  | 2 | Ask whether to correct the repository's own configuration — usually a drifted `AGENTS.md`. **Ask; do not edit:** it is an instruction artifact, so the discovery protocol governs it. |
  | 3 | Write a diagnostic report saying *why* — what was skipped, the mechanism, and what it cost. |

  The report is owed even when the user declines the first two, and is recorded under
  `{repo}/.agents/memory/`. It is the only part that outlives the session.

## Changed

- `rules/shared-instructions.md` §H — **the two permission gates become three.** Approving
  the plan joins opening a pull request and merging one. Two mandate rows added: wait for
  plan approval before changing state, and report a bypass when one happens.
- `prompts/agents-setup.md` — the auto-activation contract a new repository writes for
  itself names three gates, and the setup checklist gains a line requiring it. Repositories
  created from here get the gate without a later migration.
- `rules/auto-activation.md` — the always-on paragraph now says three gates; the
  frontmatter description names the recovery.
- `content/index/instructions-index.md` — purpose rows for both changed files.

## Notes for this repository

- **Four mirrors, one commit.** `.agents/rules/set-mirrors.md` earned its place again.
  `src/tools/mcp-creator.js:675` is the one that would have been missed: the sentence lives
  there as a **string array in source**, not prose, so a grep for the changed markdown line
  does not find it. Left alone, every repository scaffolded by `mcp_creator` would have
  been created telling its agents there are two gates.
- **One stale mirror left stale, deliberately.** `wiki/logs/0/5/0/CHANGELOG.md` still says
  "two permission gates". `rules/versioning.md` forbids editing a released log to change
  history — corrections go in the next version's log, which is this one. It is a true
  record of what `0.5.0` shipped.
- **One regression test, mutation-proven before it was kept.** `agents_auto_activation
  carries the plan gate and the workflow-fallback recovery` guards the *payload* rather
  than the files, because that is how both behaviours reach a consumer. Renaming the
  fallback heading, or restoring the old "wait for the user to confirm" wording, each drops
  the suite to 83 of 84. Both failures would otherwise be silent: a session with no plan
  gate starts writing immediately and looks productive.
- 84 tests, up from 83, all passing.

## Not published

Shipped in the same release but local to this repository, so no consumer sees them:

- `wiki/security/security-model.md` and `.agents/wiki/security/security-boundaries.md` —
  this repository's own security context, loaded by a **local** trigger row on security,
  authentication, and deployment work. The row is local by design: the shared trigger table
  is mirrored row-for-row, and a shared row naming `.agents/wiki/security/…` would be a
  broken row in every repository that has no such tree.
- The pages record one thing worth knowing before treating the deployment as hardened:
  `MCP_DNS_REBINDING_PROTECTION` defaults to `false`, so `MCP_ALLOWED_HOSTS` and
  `MCP_ALLOWED_ORIGINS` are inert unless it is switched on.

`rules/directories.md` §C and §D gain a `security/` row each, which **is** published —
registering a new folder is required in the same commit that creates it, and the tables
are a baseline rather than a closed set.
