# Task — connector registration, `.gitignore`, and two open pull requests

Register the deployed connector, land an uncommitted `.gitignore` change on an existing
branch rather than a new one, and merge the two open pull requests.

**Status:** complete. Task 1 of 1 — no release. Task `n` would be the release, and neither
pull request warrants one on its own; that decision is still the owner's and is untouched.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Connector, `.gitignore`, both merges | `docs/mcp-tool-availability`, `docs/plan-placement` | [#92](https://github.com/LXAgents-MCP/shared-instruction/pull/92), [#93](https://github.com/LXAgents-MCP/shared-instruction/pull/93) |

### Task 1 — connector, `.gitignore`, both merges

Landed. `.mcp.json` written and gitignored, `f05c378` on top of `#92`, and `#92` then
`#93` merged to `master` as `4bc8090` and `de80d46`. Suite 54 pass, 0 fail, run on merged
`master` before the push — not only on the branches.

## What was decided, and what was not

**The `.gitignore` change rode into `#92`, not onto `master` directly.** The change adds
`.mcp.json` and retitles the block to "Agents". `.mcp.json` is the client's project-level
connector config, so the rule belongs with the connector work, and the owner asked for no
new branch. `#92` is that branch.

**The rebase was a no-op and is recorded as one.** Both branches already sat on
`origin/master` at `2692af0`, so `git rebase` reported *up to date* on each and rewound
nothing. Recorded because a plan step that turned out to do nothing is worth stating, and
because "rebase first" reads as work done when no work was needed.

**Neither branch was deleted on merge.** `.agents/memory/decisions/delete-branch-on-stacked-merge.md`
records three pull requests reporting MERGED while `master` had none of the work. Deleting
is not on the path.

**No version bump.** `#92` adds a published file, which `content/rules/versioning.md` classes
as minor, and both authors said so and deliberately stopped short. The rule requires the
owner's explicit yes, and none was given, so `package.json` is untouched at `3.4.0`.

## The merge API returned 404 for every method

`POST /repos/{owner}/{repo}/pulls/{n}/merge` returned `404 Not Found` for `merge`,
`squash` and `rebase`, on both `#92` and `#93`. This was not permissions:

| Check | Result |
|---|---|
| Token | classic `ghp_`, scope header `x-oauth-scopes: repo` |
| Identity | `JetsadaWijit`, `type: User` |
| Repo permission | `admin`, and `admin` again from the collaborators endpoint |
| Branch protection | none — `404 Branch not protected` is the *absent* case |
| Rulesets | repo `[]`; the org-level endpoint 404s, but that is the scope this token lacks |
| API writes | a no-op `PATCH` to `#92` succeeded, so writes are not blocked in general |
| Merge methods allowed | commit, squash and rebase all `true` |

So the endpoint alone was unavailable. **The merges were performed locally instead**:
`--no-ff` on each branch, merge commits pushed to `master`. GitHub recognises a merge
commit whose second parent is the pull request head, and both pull requests came back
`merged=true` with the expected `merge_commit_sha`, `master` head is `de80d46`, and the new
rule file is present at 5160 bytes. **The tree was verified rather than assumed** — that is
the whole lesson of the stacked-merge decision above.

## Two findings, raised and not acted on

**`package-lock.json` is at `3.1.0` while `package.json` is at `3.4.0`.** `npm install`
corrects it in the working tree, so the drift is invisible until an install. It was
reverted rather than committed, because it belongs to neither pull request and would have
ridden along unnoticed.

**This file's own predecessor is stale in three places**, which is the failure its SHA
warning predicts. `repository-state.md` says the version is `3.2.0` (it is `3.4.0`, and
`GET /healthz` plus `initialize` both confirm the deployed instance agrees), says
`planning/task-workflow.md` was folded into `plan-creator.md` and `planning/` retired in
`3.0.0` (the file is present, and the deployed surface serves a `task_workflow` tool), and
counts 33 files in `content/` where there are 34. Left uncorrected: rewriting a state file
is a change to shared understanding and belongs to its own task, not to a merge.