---
name: github-repositories
description: Inspecting and managing GitHub repositories with the gh CLI — settings, defaults, branch protection, collaborators, and the operations that are not reversible.
---

# GitHub repositories

## Inspecting

    gh repo view
    gh repo view owner/name --json name,defaultBranchRef,visibility,isArchived
    gh repo list owner --limit 100 --json name,visibility,pushedAt
    gh repo clone owner/name

`gh repo view` with no argument infers the repository from the git remote — which means it
works in a checkout and fails anywhere else, and in a directory with no remote it errors
rather than guessing.

**`pushedAt` is the useful field for listing.** It is the last push, so
`gh repo list --sort pushed` answers "what is actually being worked on" in a way that
`updatedAt` (which moves on metadata changes) does not.

**`--json` over human-readable output.** Always. The rendered output is for a terminal and
is not a stable interface.

## Settings

    gh repo edit --enable-issues=false
    gh repo edit --default-branch main
    gh repo edit --visibility private

**These are not reversible by re-running the command with a different value.** Public →
private is fine; private → public on a repository with history is a disclosure event.
`--visibility` on a repository with secrets or history is not a toggle to flip casually.

**Renaming** (`gh repo rename`) rewrites every clone's remote URL and breaks CI config,
webhooks, and anything hardcoding the old name. GitHub redirects the old URL afterwards, so
it mostly works, and the breakage is in the places that do not follow redirects.

**Archiving** (`gh repo archive`) makes it read-only and is reversible; **deleting** is not.

## Branch protection

The most consequential repository setting, and `gh` has partial support:

    gh api -X PUT repos/{owner}/{repo}/branches/{branch}/protection \
      -F required_status_checks[strict]=true \
      -F required_status_checks[contexts][]=build \
      -F required_pull_request_reviews[required_approving_review_count]=1 \
      -F enforce_admins=true \
      -F restrictions=null

This endpoint is **not wrapped by `gh repo edit`** and the payload is nested arrays, which
`-F` handles awkwardly — `required_status_checks[contexts][]=build` is the form. It also
**replaces** the whole configuration rather than merging, so a partial `PUT` silently drops
the rules you did not mention. Read the current state, modify, write the whole thing back.

Requiring a status check by name means a check that never reports **blocks every merge
forever** — the PR waits for a check that will never come. Before requiring a check, confirm
it actually runs on pull requests; on a push-only workflow it never will.

## Collaborators

    gh repo add-collaborator owner/name user --permission push
    gh api repos/{owner}/{repo}/collaborators --jq '.[].login'

Permissions: `pull`, `triage`, `push`, `maintain`, `admin`. `push` is enough for most work
and is a much smaller grant than `admin`.

**This is access control, not a cosmetic setting.** Adding a collaborator grants real
repository access under the user's account and generally triggers a notification. Do not do
it as a side effect of a task; do it when asked.

## Forking

`gh repo fork` and the API's `fork` endpoint. Forks are full repositories — they take disk,
they can hold secrets, and they do not inherit the parent's branch protection.

## Deleting

    gh repo delete owner/name --yes

Irreversible, and `--yes` exists because it should never be reached by accident. **Never
without an explicit instruction naming the repository.** A mistake here is unrecoverable
except through a support ticket.

## Agents

**Read-only by default.** `gh repo view` and `gh repo list` are safe. `gh repo edit`,
`add-collaborator`, `archive`, `delete`, and anything writing branch protection change the
repository for everyone and need the user to have asked.

**Report the default branch.** It is the answer to a surprising number of questions, and
getting it wrong means branching from the wrong place.

**Branch protection is a gate, not a setting to work around.** If a push is refused, the
correct response is to tell the user what protection blocked it — never to propose removing
the protection.

**Sandbox:** needs the network; 403 in-session.
