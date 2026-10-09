---
name: github-authentication
description: How the gh CLI authenticates, the GITHUB_TOKEN shadowing trap in Codespaces, and what happens when authentication silently fails. Read before any gh or GitHub API call.
---

# GitHub authentication

Read before any `gh` command or GitHub API call. Most confusing GitHub failures are
authentication failures wearing another name.

## The short version

`gh auth login` for an interactive session. `gh auth status` to check. **`GITHUB_TOKEN` in
the environment overrides everything**, and it is very often set to something you did not
choose — most commonly in a Codespace, where it is a read-only token that shadows a
working `gh` login.

## `gh` resolves credentials in this order

1. `GH_TOKEN` — highest precedence, beats everything.
2. `GITHUB_TOKEN` — next.
3. `gh`'s own stored credentials — from `gh auth login`.

This means **an environment variable silently replaces working credentials.** No error, no
prompt; commands just fail with 403, or worse, succeed against the wrong account.

## The Codespaces trap

Inside a Codespace, GitHub injects a `GITHUB_TOKEN` automatically. It is:

* **read-only** — it cannot push, create a PR, or write anything.
* **scoped to the codespace**, not to your account's full permissions.

So a session with a perfectly good `gh auth login` behind it will still fail on any write,
and the error points at permissions rather than at the token being the wrong token. The
fix is to remove the variable for that command:

    env -u GITHUB_TOKEN gh pr create

or export a real token first. **Always** check whether `GITHUB_TOKEN` or `GH_TOKEN` is set
before concluding that your login is broken.

A small shell helper makes the fix a habit: `pat() { env -u GITHUB_TOKEN "$@"; }`, then
`pat gh pr create`. It is a **function** rather than a global `unset`, because the Codespace
itself uses `GITHUB_TOKEN` for its own operations; the function scopes the change to one
command.

The rule is GitHub-specific. GitLab has no equivalent, so nothing here transfers.

## Tokens and scopes

`gh auth status` prints the scopes on the stored token. For writing you need `repo` (private
repositories) and `workflow` (editing `.github/workflows/`). A token missing `workflow`
can push code that pushes code and cannot edit the workflow that does it — a genuinely
confusing error, and the fix is a scope, not a permission.

Fine-grained tokens replace classic ones. They are per-repository and per-permission, so
"my token works on repo A but not repo B" is usually a repository selection, not a bug.

## Diagnosing a failure

Work down this list; do not start by re-authenticating.

| Symptom | Likely cause |
|---|---|
| 403 on a write, login is fine | `GITHUB_TOKEN` is set and read-only — see above |
| 403 on reading a private repo | Stored token lacks `repo` scope |
| 403 on editing a workflow file | Missing `workflow` scope |
| 404 on a repo you can see | Token cannot see it, **or** it genuinely does not exist — these are indistinguishable |
| Works locally, fails for the agent | Different environment, so a different token |

**The 404-that-is-really-a-403 is the nastiest one.** Forges return 404 rather than 403 for
resources you are not allowed to know exist, which hides permissions problems as
not-found. Before concluding a repository, issue, or run does not exist, confirm you are
authenticated as the account you think you are.

## For agents specifically

**Never print a token.** Not in output, not in an error message, not in a command echo. If a
command needs a token, reference it by variable name. The parallel rule: never write a link to an assistant
session into anything a repository records.

**An agent should not hold a token at all where it can be avoided.** A read-only token that
the session never uses is one fewer thing to leak. If a tool needs credentials, it takes
them from the environment and never writes them anywhere.

**The sandbox has no network egress.** Every command on this page fails with 403 from the
session sandbox — that is the network, not the token. If you are seeing 403 *everywhere*,
check whether you are in the sandbox before you debug authentication. Anything on this page
has to be run by the user on their own machine.
