---
name: gitlab-repositories
description: GitLab projects and groups — namespaces, visibility, permissions, protected branches, and the operations that are not reversible.
---

# GitLab projects

GitHub calls it a repository. GitLab calls it a **project**, and a project lives inside a
**namespace** — a group or a user's personal namespace. The hierarchy is deeper than
GitHub's and most GitLab access failures are namespace mistakes.

## The hierarchy

```
namespace (group, or a user's personal namespace)
  └── subgroup
        └── project        ← the repository
              └── merge requests, issues, pipelines
```

**A project path is `group/subgroup/project`** — more segments than a GitHub
`owner/repo`, and the usual cause of a 404 when you assume two. The same shape is what makes
a URL-encoded path (`group%2Fsubgroup%2Fproject`) necessary in API calls.

## Inspecting

    glab repo view
    glab api projects/owen%2Fapp --jq '{path_with_namespace,visibility,default_branch}'
    glab api "groups/{id}/projects?per_page=100" --paginate
    glab api users/{id}/projects

**`path_with_namespace`** is the fully-qualified path — use it rather than reconstructing it
from parts.

**`glab repo view` infers from the git remote**, so it works in a checkout and nowhere else.
On a self-hosted instance the remote's host selects the instance, so `glab` needs an auth
entry for that host — see [`authentication.md`](authentication.md).

**`last_activity_at`** is the field for "what is actually being worked on", the counterpart to
GitHub's `pushedAt`. `updated_at` moves on metadata changes and is a poor sort for activity.

## Settings

    glab api -X PUT projects/{id} -f visibility=internal -f default_branch=main

**Visibility is `private`, `internal`, or `public`.** `internal` has no GitHub equivalent —
visible to any authenticated user of the instance. It is the setting most often forgotten when
porting a mental model from GitHub, and "private but visible to everyone with a login" is a
real disclosure risk on a large instance.

Private → public is a disclosure event on a project with history. **Not a toggle to flip
casually.**

**Renaming a project** changes its path, which breaks clones, webhooks, CI config, and
anything hardcoding the old path. A redirect exists for a while, and the breakage is in the
consumers that do not follow it.

**Archiving** is read-only and reversible. **Deleting** is not, and it deletes the
repository, issues, merge requests, wikis, and artifacts — a project removal is a much larger
event than a repository removal elsewhere.

## Permissions and roles

| Role | Typical capability |
|---|---|
| Guest | Read; some can create issues |
| Reporter | Read, create issues |
| Developer | Push, merge requests, **create/delete branches** |
| Maintainer | Everything but project administration and some settings |
| Owner | Project administration |

**Developer can delete a branch** — including the default branch if unprotected. This is a
real risk in an automated context.

**Group membership cascades.** A user in a subgroup's parent group inherits permissions
downward, and a project can have its own group-level sharing. Determining "what can this user
actually do" means walking the namespace tree, not reading one project's members list. The
convenient way to check is `GET /projects/{id}/members/all`, which flattens inherited
memberships.

## Protected branches

    glab api "projects/{id}/protected_branches/main" --jq '{merge_access_levels, push_access_levels}'
    glab api -X POST "projects/{id}/protected_branches" \
      -f name=main -f push_access_level=40 -f merge_access_level=40

Access levels are numeric: `0` = no access, `30` = developer, `40` = maintainer,
`60` = admin (via project access token). **Protected branches permit pushes, they do not
forbid them** — the level says who *may* push while protection is on, and pushing by anyone
else is refused. Set it to a high level rather than assuming no one can push.

**A protected branch also blocks force-push and deletion by default**, separately
configurable.

## Branches

    git branch -r
    glab api "projects/{id}/repository/branches?search=feature"

Branch names are not validated against a naming convention — GitLab has no built-in pattern.
Any naming rule here is this workspace's, not the forge's: see
[`../../git/branching-strategy.md`](../../git/branching-strategy.md).

## Agents

**Read-only by default.** Viewing is safe. Editing settings, changing visibility, altering
protection, and deleting are changes for everyone and need the user to have asked.

**Never delete a project.** It takes issues, MRs, wikis, and artifacts with it, and there is
no partial delete.

**Never lower a protected branch's access level** to get a push through. Report what is
blocking.

**Walk the namespace when checking access** — the answer is rarely in the project alone.

**Confirm `path_with_namespace` and the instance** before reporting anything missing. Most
GitLab "not found" results are a path or a host mistake.

**Sandbox:** needs the network; 403 in-session.

## Related

* [`merge-requests.md`](merge-requests.md) — the project path applies there
* [`issues.md`](issues.md) — issues are always project-scoped
* [`ci.md`](ci.md) — where protected branches matter most
* [`authentication.md`](authentication.md) — instance selection happens here
* [`../reference/git-hosting-common.md`](../reference/git-hosting-common.md) — the "project"
  collision this page exists to defuse
