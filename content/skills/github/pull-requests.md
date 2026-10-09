---
name: github-pull-requests
description: Creating, reading, reviewing, and merging GitHub pull requests with the gh CLI — including draft state, merge methods, and the checks that gate a merge.
---

# GitHub pull requests

## Creating one

    gh pr create --base main --title "…" --body "…"

`--body` from a string is fragile for anything long — quoting, newlines, backticks. Prefer
`--body-file`, written to a temp file, for anything past a line or two. `gh pr create`
without `--title`/`--body` opens an editor, which fails in a non-interactive session: always
pass both explicitly.

**Push first.** `gh pr create` needs the branch on the remote; it will offer to push
interactively, which also fails without a TTY. Push explicitly, then create.

**Check the base branch before you open.** `--base main` against a repository whose trunk is
`master` fails, or worse succeeds against the wrong thing. `gh repo view --json
defaultBranchRef` gives the answer.

### Draft

`--draft` marks it not ready for review. Draft PRs still run CI and still accept commits;
what changes is that they are excluded from review queues. Toggle later with
`gh pr ready {n}` / `gh pr convert --draft`.

## Reading one

    gh pr view {n}
    gh pr view {n} --json title,state,mergeable,reviewDecision,statusCheckRollup
    gh pr diff {n}
    gh pr list --state open --author "@me"

`--json` is the reliable path. The human-readable output is a rendering for a terminal, and
anything parsing it will break the first time GitHub changes a word. `--json` with
`--jq` covers most needs without a script:

    gh pr list --json number,title,updatedAt --jq '.[] | "\(.number)\t\(.title)"'

**States that are not `open`/`closed`:** `merged` is its own state, and a closed unmerged
PR is *not* a failed PR. Check `mergedAt`, not the absence of `closed`.

**`mergeable`** is `UNKNOWN` while GitHub computes it in the background. `UNKNOWN` is not
`false`; treating it as a conflict sends you chasing a problem that does not exist. Wait and
re-read.

**`reviewDecision`** is the field that matters for "can this merge" — `APPROVED`,
`CHANGES_REQUESTED`, `REVIEW_REQUIRED`, or null when no rule applies.

### Comments

    gh pr view {n} --comments          # human-readable
    gh api repos/{owner}/{repo}/issues/{n}/comments --jq '.[].body'

Review comments and issue comments are **different objects** in the API — review comments
hang off `pulls/{n}/comments`, plain comments off `issues/{n}/comments`. Asking for the
wrong one returns an empty list, which reads as "no comments" rather than "wrong endpoint".
`gh pr view --comments` shows both.

## Reviewing

    gh pr review {n} --approve
    gh pr review {n} --request-changes --body "…"
    gh pr review {n} --comment --body "…"

`--request-changes` **blocks the merge** when required reviews are configured. A plain
`--comment` does not. Both count as "a review" in most API queries, so a count of reviews
is not a count of approvals.

**Line comments** cannot be created by `gh pr review` — they need the API, with the
`commit_id`, `path`, and `line` (or `side`+`start_line`) of the diff position. The line
number refers to a position **in the diff**, not in the file, and it shifts as the diff
changes — a comment on a stale position 404s or attaches to the wrong line.

## Merging

    gh pr merge {n} --squash --delete-branch
    gh pr merge {n} --merge
    gh pr merge {n} --rebase

| Method | Result | Use when |
|---|---|---|
| `--merge` | True merge commit | History must be preserved as-is |
| `--squash` | One commit on the base | Default for most work; a PR becomes one change |
| `--rebase` | Commits replayed, no merge commit | Linear history, individual commits kept |

`--squash` **discards the PR's individual commits** in the base's history. The title and
body become the squashed commit message unless you pass
`--subject`/`--body`. For a PR of several commits, that single message is usually worse than
any of them — set it deliberately.

`--auto` merges when checks and required reviews pass. It also **merges immediately** if they
already have, so it is not a "queue for later" flag. Say which you mean.

`--delete-branch` deletes the local **and** remote branch. On a shared branch or one you
still need locally, that is the destructive bit.

## What gates a merge

Four independent things, and all four can block:

1. **Mergeability** — no conflicts with the base.
2. **Required reviews** — see `reviewDecision`. Draft PRs cannot be approved, so a draft
   with required reviews will never merge no matter how many approving comments exist.
3. **Required status checks** — configured by name; a check that never reports is as
   blocking as one that fails.
4. **Branch protection** — the base may forbid direct pushes, or require linear history, or
   forbid force-push.

A merge attempt that fails reports which one. Do not work down the list guessing — read the
error, then check that one thing.

## Agents

**Say what a merge costs before doing one.** A merged PR is closed to further commits, and
`--delete-branch` is not undoable through the forge. If the user has not asked for a merge,
propose it.

**"Checks passed" is not "ready to merge."** Green checks with a missing required review is
the normal blocked state, and it is not a failure to fix — it is waiting on a person.

**Never merge your own PR without being asked.** An agent that opens a PR and merges it in
the same turn has bypassed the only review the change was going to get.

**Sandbox:** every command here needs the network and will 403 in-session.
