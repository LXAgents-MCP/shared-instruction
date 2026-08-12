---
name: memory-tasks-change-propagation-rule
description: Adding change-propagation to the shared set and hardening no-session-links against server-side footers — decisions, version, and consumer fallout.
---

# Task: Add change propagation to the shared set

**Status:** branches pushed, not merged

## 2026-08-12

**Goal.** Two gaps in the shared set, on two stacked branches:
`docs/session-link-verification`, then `docs/change-propagation` on top of it.

**Gap 1 — the session-link rule stopped at the push.** It assumed a link is added before
an artifact leaves your hands, so its only check was a pre-push scan of commit messages.
A forge or bot can append a footer server-side *after* a clean body is submitted, and
nothing inspectable locally shows it. The file also named a remedy only for landed
history, so read literally it made a published pull request body look as unfixable as a
merged commit. Fixed by adding "Check again after you post" and splitting removal into
its three real cases — posted body (edit in place), unmerged commit (rewrite and
force-push with `--force-with-lease`), landed history (stays, report it). The `name` is
unchanged, so this is not a major bump and no index row moved.

**Gap 2 — nothing said documentation follows code.** Confirmed rather than assumed:
grepping `content/` for phrasings of the obligation returned zero hits. Every "same
commit" rule in the set governed indexes (`index-creator.md`) or memory
(`memory-policy.md`); none covered the pages that describe **behaviour**. So a commit
could change how something works, leave the page describing it wrong, and violate no
rule.

**Decision — scope the new rule by a question, not a file list.** `change-propagation.md`
asks *would a reader who trusted this page now be wrong?* rather than enumerating paths.
The set is consumed by unrelated repositories in unrelated languages, so anything naming
a specific tree, build tool, or layout beyond the four the set itself defines would be
false somewhere. The rule names no repository, language, or framework.

**Decision — a stale instruction is not self-repaired.** The rule fixes documentation but
routes a stale *rule* through `discovery-protocol.md`. Letting an agent rewrite an
instruction because it looked out of date is exactly what that gate exists to prevent,
and being provably stale is not an exemption.

**Decision — placed after `no-session-links.md`** in both `content/index/instructions-index.md`
and `wiki/reference/mcp-surface.md`. Those two tables were already in step and stay that
way; the rule also hands directly off to `discovery-protocol.md`, which now follows it.

**Version — `0.3.0`, minor**, chosen by the user. It adds a rule and a trigger row rather
than renaming or removing a `name`. Released inside the feature commit, as `0.2.0` was;
this repository does not cut separate release commits.

**Resource count.** 24 → 25 in `README.md`, `wiki/information/overview.md`,
`wiki/environments/setup.md`, and `.agents/wiki/context/repository-map.md`.
`wiki/logs/0/0/0/CHANGELOG.md` still says 24 and is correct as history — a released log
is never edited to change the past.

**Consumer fallout — `MCAgents/core` carries a local `change-propagation.md`.** The
moment the shared rule ships, the local copy shadows it by `name` and starts drifting.
Its removal is prepared on `chore/change-propagation-duplicate` in that repository, but
core resolves the set through the connector, which serves the **deployed** version. That
branch must not merge until `0.3.0` is merged *and deployed*, or core is left with no
change-propagation rule at all.

**Left to do.** Merge and deploy `0.3.0`, then merge core's branch. Neither was done
here — merging was not requested.
