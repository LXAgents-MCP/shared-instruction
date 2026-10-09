---
name: gitlab-api
description: The GitLab REST and GraphQL APIs through glab api and curl — pagination, rate limits, URL-encoded paths, and the errors that mean something else.
---

# GitLab API

`glab` covers less than `gh` does, so this page comes up sooner than its GitHub
counterpart.

## Base and shape

    https://gitlab.com/api/v4         # gitlab.com
    https://gitlab.example.com/api/v4 # self-hosted

**Every path is project- or group-scoped:**

    projects/{id-or-url-encoded-path}/...
    groups/{id-or-url-encoded-path}/...

`{id}` is the **numeric global project id**, or the path **URL-encoded**: `owen%2Fapp`, and
`group%2Fsubgroup%2Fproject` for a nested path. An unencoded slash splits the path into two
segments and the request 404s.

    glab api "projects/owen%2Fapp/merge_requests" --paginate
    curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
      "https://gitlab.example.com/api/v4/projects/12345/issues"

**Use the API, not curl, where you can** — `glab api` picks the host and token from the
configured auth entry, which removes the two things people get wrong most often: the wrong
instance and a missing token. curl also risks the token appearing in a shell history or a
logged command; `glab api` references it from the environment without echoing it.

## Through `glab api`

    glab api projects/{id}/issues --paginate --jq '.[].iid'
    glab api -X POST projects/{id}/issues -f title="Bug" -f description="…"
    glab api -X PUT "projects/{id}/variables/KEY" -f value=secret -f masked=true

`-f` sends a form field, `-F` a typed one. As on GitHub, a field that must be an array or
object needs `--input` with a JSON file, not a `-f` string.

## Pagination

    --paginate     follows every page and concatenates

The defaults are **20 for most list endpoints**, 100 where documented. **Not paginating
returns a partial list with no error** — the shape of a silent data-loss bug. `glab api
--paginate` concatenates into one array, so `--jq` operates across all pages.

GitLab also accepts explicit `page` and `per_page` parameters, and returns
`X-Next-Page` / `X-Total-Pages` headers. `X-Next-Page` is empty on the last page, so
looping on it is the reliable pattern.

## Rate limits

Authenticated GitLab.com: **2,000 requests per minute** per user (or per project token), and
**projects on the free tier have a lower ceiling**. Unauthenticated is much lower and is
usually blocked outright on the API.

Exceeding returns **429**, which is unambiguous — better than GitHub's 403. Rate-limit
headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `RateLimit-Observed`.

**Self-hosted instances can have rate limiting disabled or configured differently**, so
this does not apply uniformly.

## Errors

| Code | Meaning |
|---|---|
| 400 | Bad request — malformed path or parameter |
| 401 | No token, or it expired |
| 403 | Authenticated, insufficient role or scope |
| 404 | **Not found, not permitted, wrong instance, or wrong path** |
| 409 | Conflict — mostly uniqueness (a branch or tag already exists) |
| 429 | Rate limited |

**GitLab's 404 is the widest of the four causes** and the least likely to be what you
assumed. Before reporting something missing, check the instance host, then the path
encoding, then the id-versus-iid question, and only then permissions.

The error body carries a human-readable `message`, and it is more specific than GitHub's —
it usually names the actual problem.

## GraphQL

    glab api graphql -f query='{ currentUser { username } }'

Available on GitLab.com and self-hosted, but **far less used and less complete than the
REST API** — several resources are REST-only. Check before assuming an object is reachable.
GraphQL is also authenticated with the same token in the `Authorization: Bearer` header
rather than `PRIVATE-TOKEN`.

## Deprecations

Deprecated endpoints announce a `Deprecation` and a `Sunset` header, and GitLab announces
removals by version. **`Gitlab.com` and self-hosted versions deprecate on different
schedules**, so code that works on one can fail on the other later.

## Agents

**Never print a token.** Not in a command, not in a URL, not in an error. GitLab's
`PRIVATE-TOKEN` header form is safer than a query parameter — parameters land in access logs.

**`--paginate` unless certain the list is small.**

**A 404 means four things.** Instance, path encoding, id-vs-iid, permissions. Check in that
order.

**Confirm `path_with_namespace` before assuming a project does not exist.**

**Every call needs the network** and 403s in-session — that is the sandbox.
