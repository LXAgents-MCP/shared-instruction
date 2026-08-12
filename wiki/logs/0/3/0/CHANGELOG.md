# 0.3.0

**Released:** 2026-08-12

Adds a rule that documentation follows code, and widens the session-link rule to cover
what a forge stores after you post.

**Consumers must:** re-read `rules/auto-activation.md` and add the new trigger row to
your `AGENTS.md` — `Change code or structure that a document describes` →
`{shared}/rules/change-propagation.md`. If your repository carries a local
`change-propagation.md`, delete it and remove its index row: it now shadows a shared
`name` and will silently go stale.

## Added

- `rules/change-propagation.md` — a change to code or project structure updates every
  document that describes it, in the same commit. Scopes the obligation by the question
  *would a reader who trusted this page now be wrong?*, so it reaches the pages a change
  actually invalidated and stops there. A stale **instruction** is exempt from self-repair
  and goes through the discovery protocol instead.
- `rules/auto-activation.md` — the matching trigger row, so the rule fires before the
  work starts rather than being remembered afterwards.

## Changed

- `rules/no-session-links.md` — the pre-push scan is now stated as necessary but not
  sufficient. A forge, bot, or integration can append a session footer server-side after
  a clean body was submitted, and nothing inspectable locally will show it, so a posted
  artifact is read back and scanned before the create call counts as verified.
- `rules/no-session-links.md` — the removal guidance is split into the three cases it
  actually covers. A posted pull request, issue, comment, or release note is edited in
  place; an unmerged commit is rewritten and force-pushed with `--force-with-lease`;
  landed history stays and is reported.

## Fixed

- Nothing in the set said that documentation follows code. Every "same commit" obligation
  it carried governed indexes or memory, so a commit could change behaviour, leave the
  page describing it wrong, and violate no rule.
- The session-link rule assumed a link was added before an artifact left your hands, and
  named a remedy only for landed history. Read literally, it left a published pull request
  body looking as unfixable as a merged commit, when editing it in place is the easy case.
