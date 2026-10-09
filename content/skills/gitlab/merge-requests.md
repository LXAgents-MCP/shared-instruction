---
name: gitlab-merge-requests
description: Creating, reviewing, and merging GitLab merge requests — draft state, pipelines, approvals, and the iid-versus-id distinction that produces wrong answers.
---

# GitLab merge requests

A GitLab merge request is a GitHub pull request under a different name. This page covers
only what differs.

## iid, not id

**The single most important difference on this page.**

| | GitHub | GitLab |
|---|---|---|
| UI / URL number | `id` == the number shown | **`iid`** (per-project) |
| Global internal id | — | `id` (increments across all of GitLab) |

    glab mr view 42                     # 42 = the IID — correct
    glab api projects/owen%2Fapp/merge_requests/42    # IID — correct
    glab api projects/12345/merge_requests/42         # also IID — correct

The **path** takes the numeric project id or the URL-encoded path; the **last segment** takes
the IID. Fetching a merge request by global `id` gives a plausible-looking object from a
*different project*, which is why this bug survives review — nothing errors.

## Creating

    glab mr create --source-branch feature --target-branch main --title "…" --description "…"
    glab mr create --draft

`--description` takes a string; for anything long, write a file and use
`--description-file`. Interactive prompting fails without a TTY, so pass everything.

**Drafts are prefixed with `Draft:` in the title by convention, and the flag is separate.**
Older API versions use `WIP:`. Either way, a draft **cannot be approved or merged** while it
is a draft — so a draft MR under an approval rule waits for a person, and no amount of
pushing unblocks it.

Related flags: `--assignee`, `--reviewer`, `--label`, `--milestone`, `--remove-source-branch`
(delete on merge), `--squash-before-merge`, `--merge-when-pipeline-succeeds`.

## Reading

    glab mr view {iid}
    glab mr list --state opened --assignee "@me"
    glab mr diff {iid}
    glab api projects/{id}/merge_requests/{iid} --jq '{state,merge_status,detailed_merge_status}'

**States:** `opened`, `merged`, `closed`, `locked`.

**`merge_status`** is `can_be_merged`, `cannot_be_merged`, `checking`, `unchecked` — and
`checking` is transient while GitLab computes it. **`unchecked` means not yet computed**, and
reading it as `cannot_be_merged` produces a false conflict.

**`detailed_merge_status`** is the informative one and has more states than `merge_status`:
`mergeable`, `broken_status`, `ci_must_pass`, `ci_still_running`, `discussions_not_resolved`,
`draft_status`, `not_approved`, `blocked_status`, `unchecked`. `merge_status` collapses these
into a yes/no and loses the reason. **Read this field, not `merge_status`.**

## Pipelines

An MR shows the pipeline status of its **head** commit. A pipeline that passed on the target
branch says nothing about this MR.

`--merge-when-pipeline-succeeds` (or `glab mr merge --when-pipeline-succeeds`) merges
automatically once the pipeline goes green and approvals are in. Unlike GitHub's `--auto`,
this one genuinely waits — the merge does not happen immediately if checks already passed and
approvals are outstanding. State the distinction when proposing it.

## Approvals

GitLab's approval rules are **project-configured**, not universal:

    glab api projects/{id}/merge_requests/{iid}/approvals

Returns `approved` (bool), `approvals_required`, `approvals_left`, and `approved_by`. The
rule can depend on the author (no self-approval), the target branch, and file paths — so
"one approval" is not always one approval.

**Approval can be reset** when new commits land, if the project requires it. An MR approved
at 14:00 may need re-approval after a push at 14:05.

**Drafts cannot be approved.** Same trap as GitHub's.

## Merging

    glab mr merge {iid} --squash --remove-source-branch
    glab mr merge {iid} --merge
    glab mr merge {iid} --rebase

Same three methods as GitHub with the same meanings: `--squash` collapses into one commit
and **discards the individual commits' messages** unless you set
`--squash-commit-message` / `--squash-commit-description`; `--remove-source-branch` deletes
the branch locally and remotely.

**Merge is not instant.** GitLab's merge is asynchronous — the request is accepted and the
merge happens shortly after. A `200` means accepted, not merged. Poll
`state == "merged"` before reporting success.

## Squash and commit-message defaults

GitLab composes the squashed message from the MR title and description by default, or from
the commit messages if configured to. **Check what the setting is before assuming** — the
resulting history differs between projects with no explicit configuration.

## Agents

**Say what a merge costs before doing one.** A merged MR is closed to further commits and
`--remove-source-branch` is not undoable through the forge. Propose, do not assume.

**Check `detailed_merge_status` for the reason** before reporting a block — it names whether
it is drafts, approvals, discussions, or CI, and guessing sends you down the wrong path.

**Never approve your own MR.** Several projects forbid it outright and the API rejects it.

**Never merge without being asked.** An agent that opens and merges in the same turn has
removed the only review.

**"Pipeline passed" ≠ "mergeable"** — same as GitHub, plus `not_approved` and
`discussions_not_resolved` are normal waiting states, not failures.

**Sandbox:** needs the network; 403 in-session.
