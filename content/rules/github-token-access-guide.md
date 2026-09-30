---
name: github-token-access-guide
description: Why gh and git fail with 403 or "not accessible by integration" in a Codespace, and the env -u GITHUB_TOKEN fix that makes the credential you already have get used.
version: 1.0.0
author: LXAgents
---

# GitHub Token Access

In a GitHub Codespace, `git push` and `gh pr create` fail with errors that read like a
permissions problem and are not one. The credential you need is already present and
valid — something else is answering first.

**The fix is `env -u GITHUB_TOKEN`, scoped to the single command.** Read this before the
first `gh` or `git` call that writes.

## Two credentials, and the wrong one wins

A Codespace holds two GitHub tokens for the same account:

| | Codespaces token | Personal access token |
|---|---|---|
| Where | `GITHUB_TOKEN` environment variable | `~/.config/gh/hosts.yml` |
| Type | `ghu_` — auto-provisioned, **no scopes** | `ghp_` — carries `repo`, `workflow`, … |
| Read a public repository | yes | yes |
| Create a pull request | **no** | yes |
| Merge a pull request | **no** | yes |
| `git push` | **no** — `403 Permission denied` | yes |

Nothing needs provisioning. The PAT is present, valid, and being shadowed.

## Which credential are you holding

```bash
gh auth status
```

Two entries appear for the same account; the **active** one is listed first.

| Output | Meaning |
|---|---|
| `Token: ghu_…` | The scopeless Codespaces token. PR operations will fail. |
| `Token: ghp_…` plus a scopes list | The PAT. Push and PR operations work. |

To see what **git** will actually use, which is not always the same answer:

```bash
printf 'protocol=https\nhost=github.com\n\n' | git credential fill | grep username
```

| Output | Meaning |
|---|---|
| `username=PersonalAccessToken` | The Codespaces token — **pushes will fail** |
| `username=<your-account>` | The PAT — push and PR operations work |

Neither command prints a secret.

## Why `git push` fails

Two credential helpers are configured, and git consults them in order:

| Order | Source | Value |
|---|---|---|
| 1 | `/etc/gitconfig` (system) | `credential.helper=/.codespaces/bin/gitcredential_github.sh` |
| 2 | `.git/config` (repository-local) | `credential.helper=!gh auth git-credential` |

The **system** helper is read first, so it answers before `gh` is ever consulted, and it
serves the `GITHUB_TOKEN` from the environment — the scopeless one.

It is written to be polite about this. Its first real check is:

```sh
# If we don't have a token, there's nothing to do
if [ "$GITHUB_TOKEN" = "" ]; then
  exit 0
fi
```

With the variable empty it exits immediately as a no-op, and git falls through to
`gh auth git-credential`, which reads the PAT out of `hosts.yml`. **So the fix is to make
the system helper decline.**

`gh` needs the same treatment for a related reason: the `gh` CLI prefers the
`GITHUB_TOKEN` environment variable over `hosts.yml` when both exist, so it silently used
the read-only token for writes too.

## The fix

```bash
env -u GITHUB_TOKEN git push -u origin BRANCH
env -u GITHUB_TOKEN gh pr create --repo OWNER/REPO --base master --head BRANCH \
  --title "…" --body-file pr.md
env -u GITHUB_TOKEN gh pr merge 12 --repo OWNER/REPO --merge --delete-branch=false
```

Stripping the variable is the whole trick. It sounds backwards — adding a token is what
you would expect to help — and the mechanism above is why.

Define it once and reuse it:

```bash
# ~/.bashrc
pat() { env -u GITHUB_TOKEN "$@"; }
```

```bash
pat() { env -u GITHUB_TOKEN "$@"; }

pat gh pr create --repo OWNER/REPO --base master --head chore/release-1.2.3 \
  --title "Release 1.2.3" --body-file /tmp/body.md
pat gh pr merge 12 --repo OWNER/REPO --merge --delete-branch=false
pat git push -u origin chore/release-1.2.3
```

### Do not unset it globally

`unset GITHUB_TOKEN` in `~/.bashrc` would fix git, but `GITHUB_TOKEN` is what the
Codespace itself uses to reach GitHub for its own operations. Stripping it for a child
process is why the fix is a **function** and not a global unset: the change is scoped to
the command, reversible, and touches no managed file.

### What does not work

Overriding the helper list in `~/.gitconfig` with an empty reset value:

```bash
git config --global credential.helper ''            # does not override /etc/gitconfig
git config --global credential.helper '!gh auth git-credential'
```

With `GITHUB_TOKEN` still set, this still resolves to the Codespaces token. The system
helper in `/etc/gitconfig` is read before the global file and wins. Editing
`/etc/gitconfig` would work, but it is a system-wide change to a managed file and would
break the Codespaces path for anything that genuinely needs the auto-provisioned token.
**Strip the environment variable instead.**

## Symptoms and causes

| Symptom | Cause | Fix |
|---|---|---|
| `GraphQL: Resource not accessible by integration (createPullRequest)` | the `ghu_` token | `pat gh pr create …` |
| `remote: Permission to … denied`, or `403` on push | the system helper served `GITHUB_TOKEN` | `pat git push` |
| `gh auth status` shows only the `ghu_` entry | the environment variable taking precedence | `pat gh auth status` |
| `permission denied (publickey)` on a `git@github.com:…` remote | SSH is not configured; these repositories use HTTPS | use the HTTPS remote, or `pat gh auth setup-git` |
| A merge reports success and nothing lands | the pull request's base was a feature branch, not the default branch | `pat gh pr view N --json baseRefName` |

## When the PAT stops working

The `ghp_` token in `~/.config/gh/hosts.yml` is the only credential here that can create
and merge pull requests. If it is revoked or expires, the `ghu_` token cannot replace it
— it has no write scope at all.

```bash
env -u GITHUB_TOKEN gh auth login
```

That prompts for a browser flow, which a Codespace with no browser cannot complete.
Generate a PAT at <https://github.com/settings/tokens> with the `repo` scope and store
it:

```bash
env -u GITHUB_TOKEN gh auth login --with-token < token.txt
rm token.txt
```

**Keep the `pat` wrapper after re-authenticating.** The Codespaces token will still be in
the environment and will still shadow whatever was just stored.
