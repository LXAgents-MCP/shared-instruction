---
name: gitlab-authentication
description: How glab and the GitLab API authenticate — tokens, scopes, self-hosted instances, and the failures that look like something else. Read before any glab or GitLab API call.
---

# GitLab authentication

Read before any `glab` command or GitLab API call. The GitHub page's `GITHUB_TOKEN`
shadowing trap **does not apply here** — see the last section, because it is the thing
people wrongly carry over.

## The short version

`glab auth login` for an interactive session, or a token in `GITLAB_TOKEN` /
`GLAB_TOKEN`. `glab auth status` to check which host, which user, and which scopes.

**GitLab is multi-instance.** `gitlab.com` and a self-hosted instance are different hosts
with different accounts and different tokens. `glab` keeps credentials per host and is
selected by the remote's URL — so a self-hosted project uses its own entry. Check
`glab auth status` when a command hits the wrong instance, because "authenticated but cannot
see the project" often means "authenticated to the *other* GitLab".

## Tokens

| Type | Notes |
|---|---|
| **Personal access token** | Belongs to a user, expires, has scopes. The default. |
| **Project access token** | Belongs to a project, not a person. Preferred for automation — no personal dependency. |
| **Group access token** | Group-scoped, for automation across a group. |
| **OAuth** | For applications, not scripts. |
| **Deploy / CI job token** | Inside a pipeline only, very limited. |

**Expiry is the common failure.** GitLab tokens have a maximum lifetime and expire
silently — the symptom is a 401 that used to work. `glab auth status` shows the expiry.

### Scopes

`api` is the broad one and covers most of what `glab` needs. The narrower set:

| Scope | Grants |
|---|---|
| `read_api` | Read everything `api` reads |
| `read_repository` | Clone and pull over HTTPS |
| `write_repository` | Push over HTTPS |
| `read_user` | Read your own profile |
| `api` | Full API access — **what `glab` generally needs** |

Note the shape of this table: it is much flatter than GitHub's, where `repo` and `workflow`
are fine-grained and surprising. In GitLab, "read_repository but not read_api" is normal and
enough for cloning; anything using the API at all tends to need `api`.

`write_repository` is a push-only grant and does **not** grant API writes. A token with only
`write_repository` can push a branch but cannot open a merge request through the API — which
looks like a permissions bug and is not.

## Self-hosted

The base URL differs: `https://gitlab.example.com/api/v4` rather than
`https://gitlab.com/api/v4`. `glab` infers it from the remote, so it generally works
unconfigured; a hand-written curl against `gitlab.com` will not reach a self-hosted
instance at all.

**Self-hosted versions differ in available features.** Pipeline types, security features,
and some API fields vary by version, and the free tier omits some of them. An endpoint that
404s on a self-hosted instance may be a tier restriction rather than a typo.

## Diagnosing a failure

| Symptom | Likely cause |
|---|---|
| 401 | Expired or revoked token |
| 403 | Authenticated but lacking the scope or role |
| 404 on a project you can see | **Wrong instance**, or a permissions/visibility issue |
| Worked yesterday | Token expired |
| Clone works, API calls fail | `write_repository`/`read_repository` without `api` |
| `glab` writes to the wrong host | No auth entry for that host; check the remote URL |

**404 rather than 403** for something you cannot see is the same pattern as GitHub — and on
GitLab it has an extra cause: you may be on a different instance entirely. Check the host
before the permissions.

## `glab` specifics

`glab` is **much narrower than `gh`**. There is no `glab repo view` equivalent covering
everything; `glab repo` is thin. Expect to fall through to `glab api` — which is the GitLab
API, so [`api.md`](api.md) applies with GitLab's paths.

`glab mr create` and `glab mr merge` cover the common merge-request work. Beyond that,
`curl` or `glab api` against `/api/v4`.

## The GitHub trap does not apply

GitHub's Codespaces inject a read-only `GITHUB_TOKEN` that silently shadows a working `gh`
login — see [`../github/authentication.md`](../github/authentication.md). **GitLab has no
equivalent.** A `GITLAB_TOKEN` in the environment is one you set deliberately, and there is
no read-only injection to unwrap.

So: do not go looking for an environment token to unset when GitLab calls 403. Debug the
token itself.

## Agents

**Never print a token.** Not in a command, not in an error, not in a script. Reference it by
variable name only. See [`../../rules/no-session-links.md`](../../rules/no-session-links.md)
for the parallel rule.

**Prefer a project or group access token over a personal one** for anything automated. It
survives the person leaving, and it can be scoped to one project.

**Check the instance.** `glab auth status` — the first question on any GitLab access
problem, ahead of permissions.

**The sandbox has no network egress.** Every command here fails with 403 in-session. That
is the network, not the token — and unlike GitHub there is no shadowing to rule out, so a
403 here in-session is unambiguous.

## Related

* [`api.md`](api.md) — the API these credentials reach
* [`merge-requests.md`](merge-requests.md) — the main reason to authenticate
* [`../github/authentication.md`](../github/authentication.md) — the other forge, and the
  trap that does not transfer
* [`../reference/git-hosting-common.md`](../reference/git-hosting-common.md) — vocabulary
