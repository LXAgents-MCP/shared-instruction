---
name: gitlab-issues
description: GitLab issues and the things GitHub has no equivalent for — epics, issue types, iteration, weight, and boards.
---

# GitLab issues

Same basic operations as GitHub, on a different path, plus a layer of structure that does
not exist on GitHub at all.

## The project scope

**Every GitLab issue belongs to a project.** The API path is always
`projects/{id}/issues` — there is no global issue list. The same is true of merge requests,
and it is why `id` versus `iid` confusion is so common here: you must identify the project
before the issue.

    glab issue list
    glab issue create --title "…" --description "…" --label bug
    glab api projects/owen%2Fapp/issues --jq '.[].iid'

`owen%2Fapp` is the URL-encoded path form. A bare `owen/app` in a URL is read as a path
with two segments and fails.

## Creating and editing

    glab issue create --title "Bug" --description "…" --label bug --assignee "@me"
    glab issue edit {iid} --add-label "needs triage" --remove-label triage
    glab issue close {iid}
    glab issue reopen {iid}

Prefer `--description-file` for anything long. There is no delete — GitLab supports deleting
an issue via the API, but it destroys discussion irrecoverably, so close and edit instead.

## Labels and milestones

    glab label list
    glab milestone list

Same silent-creation behaviour as GitHub: applying a label or milestone that does not exist
creates it rather than failing. On GitLab a milestone can be scoped to a project **or** a
group, and a project-level one with the same title as a group-level one is easy to
confuse — check the scope.

## What GitHub does not have

These are the reason a GitLab issue is not just a GitHub issue.

**Epics** — a container above issues, tracking a body of work that spans projects. An issue
can belong to an epic; an epic belongs to a group. `epic_id` on an issue.

**Issue types** — a small typed classification (typically incident, bug, task, feature).
Required on Premium. An issue with no type when the project requires one cannot be closed.

**Iteration** — a time-boxed sprint attached to an issue. Roughly "milestone, but
recurring", and it drives burndown charts.

**Weight** — a numeric estimate used for capacity planning. Not a time estimate; it is a
relative planning unit.

**Boards** — kanban over issues within a project or group. (Note that a GitLab *board* is
the GitHub *project*, while a GitLab *project* is the GitHub *repository*. See the vocabulary
page.)

**Confidential issues** — visible only to project members, on Premium. They do not appear in
the global issue search at all, which is the intended behaviour and looks like a missing
issue.

## The issue/MR API overlap

**Merge requests are issues in GitLab too**, at `issues/{iid}` — with `merge_requests`
issues can be reached through the issues endpoint. GitLab returns an `iid` on the issues
listing that matches the MR iid, so filtering by `type` matters:

    glab api projects/owen%2Fapp/issues --jq '.[] | select(.state=="opened")'

Most listings already scope by resource; the mixed listing is what bites when you hit
`/issues` directly.

## Notes vs discussions

GitLab has **notes** (comments) and **discussions** (comment threads, which can be
resolved). A discussion can be `resolved: true`, and many projects require all discussions
resolved before merging — which is why `discussions_not_resolved` appears in
`detailed_merge_status`.

    glab api projects/{id}/merge_requests/{iid}/discussions --jq '.[] | {resolved}'

Resolving a discussion is `PUT .../discussions/{id}` with `resolved: true`. **Do not resolve
a discussion to make a merge go through** — it means "this concern is handled", which is a
claim about someone else's work.

## Boards and lists

    glab api projects/{id}/boards --jq '.[] | {name, lists: [.lists[].title]}'
    glab api "groups/{id}/issues?state=opened" --paginate

Group-level issues span projects, which is GitHub's closest equivalent to a repository-level
issue with cross-repository links. Group issue search is a separate path from project issue
search and is easy to mistake for one.

## Agents

**Never delete an issue.** Discussion is not recoverable.

**Never resolve a discussion to unblock a merge** — it is a judgement about the code that
belongs to a reviewer.

**Never comment as a side effect.** Notes are public under the user's account.

**Check the instance and project path first** on any access failure — a 404 on GitLab is more
often the wrong project or the wrong instance than missing permissions.

**Confidential issues are invisible by design.** If an issue "does not exist" for a
privileged-looking user, that may be the answer.

**Sandbox:** needs the network; 403 in-session.
