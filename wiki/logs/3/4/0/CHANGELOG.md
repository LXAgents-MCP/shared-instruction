# 3.4.0

**Released:** 2026-09-30

`content/creators/plan-creator.md` §F now makes **branch deletion the default** when
merging a stacked chain, and replaces a description of the hazard with a command that
checks it. The hazard itself was already documented there; what was missing was a default
that does not depend on remembering, per merge, to look for it. The surface is **34 tools**,
unchanged.

**Consumers must:** re-read §F before your next multi-task merge. Nothing in your
`AGENTS.md` changes and no tool is added, renamed, or removed — but §F now prescribes a
merge flag you were not previously told to set.

## Changed

- **`content/creators/plan-creator.md` §F — the stacked-merge rule.** Three bullets become
  four, and the substance moves from *describing the failure* to *defaulting against it*.

  **Branch deletion is now the stated default.** The previous text said to re-target "if
  the platform does not do it automatically" — a conditional that reads as something to
  remember at each merge. Deleting the base branch is the platform's own re-target signal,
  so it is now the instruction rather than the fallback.

  **The hazard is named as something that has happened.** A stack can be fully merged and
  the default branch untouched: pull request `k` merges into branch `k-1`, the work sits on
  a branch nothing resolves, and every page says merged. The text now says so in one
  sentence, because a rule with a worked failure attached is followed more reliably than
  one that reads as a hypothetical.

  **The verification is a command, not an instruction to diff.** §F now gives
  `git merge-base --is-ancestor <final-branch> origin/master` as the check, alongside the
  tree diff it replaces, and reframes what is being verified: *"all merged" is a claim about
  pull requests; what matters is the default branch.*

  **The re-target case is kept, and moved earlier.** Where a branch genuinely has to be
  kept, re-target the next pull request by hand **before** merging the current one and check
  its `baseRefName`. The old text said "before merging, not after" and meant the same thing;
  it is now attached to the case that needs it rather than standing alone.

## Notes for reviewers

- **This rule was promoted from a local decision, not written fresh.** It was first recorded
  in `LXAgents-MCP/shared-instruction`'s own memory after a three-task chain there reported
  three merges with none of the work on the default branch, then raised as a finding and
  accepted. The incident is in `.agents/memory/decisions/delete-branch-on-stacked-merge.md`;
  §F states the convention without the history.
- **The other two copies of the old wording are historical log records** —
  `wiki/logs/0/10/0/CHANGELOG.md` and a row in `.agents/index/logs-index.md`. They are
  left exactly as written. A released log is a record of what was said then, and rewriting
  one to match current guidance would falsify it.
- **Scope note for consumers who keep branches deliberately.** This makes deletion the
  default for every repository following the set, not only this one. A team reviewing a
  branch as part of a wider set is expected to re-target by hand — the rule says so, and
  names the check to confirm it.
