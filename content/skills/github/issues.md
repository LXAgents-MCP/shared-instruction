---
name: github-issues
description: Creating, searching, and managing GitHub issues and labels with the gh CLI — including the issue/PR API overlap that makes one endpoint serve both.
---

# GitHub issues

## Creating

    gh issue create --title "…" --body "…" --label bug --assignee "@me"
    gh issue create --body-file notes.md

Same rule as PRs: pass `--title` and `--body` explicitly, because the interactive path
fails without a TTY, and prefer `--body-file` for anything long.

`--assignee "@me"` is a literal the CLI expands; a bare username assigns to that user, and
a typo creates a new account invitation rather than an error.

## The issue/PR API overlap

**GitHub models pull requests as issues.** A PR *is* an issue with `pull_request` set, at the
same `/issues/{n}` endpoint. Consequences worth knowing before writing anything against the
API:

* Listing `/issues` returns **pull requests too**, mixed in with real issues.
* `/issues/{n}` on a PR number returns the PR's issue-shaped data — title, body, labels —
  without the PR-specific fields.

**Always filter** when you mean issues:

    gh issue list --state open
    gh api repos/{owner}/{repo}/issues --jq '[.[] | select(.pull_request == null)]'

Omitting that filter is how a script ends up "closing all open issues" and also closing
three pull requests. `gh issue list` already excludes PRs; the raw API does not.

## Searching

    gh issue list --search "is:open label:bug sort:updated-desc"
    gh issue list --author "@me" --assignee "@me" --state open
    gh search issues "repo:owner/name is:open" --limit 50

`gh search` reaches the **search index**, which is eventually consistent — an issue created a
second ago may not be there yet, and results are capped per query (100 for issue search).
`gh issue list` hits the real API and is consistent but cannot do full-text search. If you
need something that exists right now, use the list.

Useful qualifiers: `is:open`, `label:`, `assignee:`, `author:`, `milestone:`, `no:label`,
`comments:>10`, `created:>2026-01-01`, `sort:updated-desc`.

## Editing

    gh issue edit {n} --add-label bug --remove-label "needs triage"
    gh issue edit {n} --add-assignee "@me" --milestone "Q1"
    gh issue close {n} --comment "fixed in #123"
    gh issue reopen {n}

`gh issue close` closes; there is no `--delete` — deletion is permanent and API-only
(`gh api -X DELETE repos/{owner}/{repo}/issues/{n}`). **Do not delete an issue to remove
its content.** Close it and edit the body. An agent asked to "remove that note" should edit,
not delete.

## Labels

    gh label list
    gh label create bug --description "…" --color d73a4a
    gh label edit bug --color B60205

**Labels are repository-scoped.** A label that exists in one repository does not exist in
another, and applying an unknown one silently creates it — so a typo gives you a new empty
label rather than an error, and the issue now has two labels differing by one character.

Colours are the only styling a label gets; there is no description shown inline. Hex may be
given with or without `#`.

## Milestones

    gh api repos/{owner}/{repo}/milestones --jq '.[].title'
    gh issue edit {n} --milestone "v1.0"

Milestones are global per repository and **not validated** — `--milestone "v1.0"` creates
the milestone if it does not exist. That is convenient and it is also how typos become
permanent, invisible clutter: the issue looks assigned, but to a milestone nobody is
tracking. Check first.

## Agents

**Never delete.** Issues hold discussion that deletion destroys irrecoverably. Close and
edit.

**Never comment as a side effect.** `gh issue comment` posts publicly under the user's
account. If the user did not ask for a comment, do not leave one.

**Closing is reversible** — `gh issue reopen` brings it back — so closing is cheaper than
deleting, which is why the first is the default.

**A label or milestone that does not exist is created, not rejected.** Verify before
writing, if the value matters.

**Sandbox:** needs the network; 403 in-session.
