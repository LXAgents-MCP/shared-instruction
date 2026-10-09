---
name: github-api
description: The GitHub REST and GraphQL APIs as reached through gh api — pagination, versioning, conditional requests, and the errors that look like something else.
---

# GitHub API

Reach for this when `gh` does not wrap the operation. Prefer `gh`'s subcommands when they
exist — they handle pagination and output formatting already.

## Through `gh api`

    gh api repos/{owner}/{repo}
    gh api repos/{owner}/{repo}/issues --paginate --jq '.[].number'
    gh api -X POST repos/{owner}/{repo}/issues -f title="Bug" -f body="…"
    gh api graphql -f query='{ viewer { login } }'

**`{owner}` and `{repo}` placeholders** are substituted by `gh` — they are not URL syntax.
Used outside `gh api` they are literal.

**Field flags differ by method.** `-f` sends a string, `-F` sends a typed value (numbers,
booleans, `null`). For a JSON object or array you need `-F key='[1,2]'` with the value
already JSON, or `--input` with a file:

    gh api -X POST repos/{owner}/{repo}/issues --input issue.json

`-f` on a value that must be an array produces a string, and the API rejects it with a
validation error naming the type — usually read as "the API is broken".

### Pagination

`--paginate` follows pages and concatenates them. **It returns a single array of items**, so
`--jq` operates over all pages at once. Without it you get 30 items and no error, which is
the shape of a silent data-loss bug.

Endpoints that paginate on a different key (search results use `items`, some listings use
`names`) need `--jq` adjusted accordingly, or `--slurp` to get all pages as separate
arrays.

## REST

**Base:** `https://api.github.com`. Version is in the path header: `/repos/{owner}/{repo}`
is v3 under the hood.

**Versioning is opt-in and defaults to the current version.** To pin:

    gh api -H "X-GitHub-Api-Version: 2022-11-28" repos/{owner}/{repo}

Worth pinning in anything you intend to keep, because "the API changed" is otherwise a
mystery failure months later.

**Media type matters for some endpoints.** Returns rendered HTML by default; ask for raw
file content with `-H "Accept: application/vnd.github.raw"`. Without it you get a base64
blob and an afternoon lost.

**Errors are JSON with a `message`** that is often a sentence about *your request*, not the
object — "Must have admin rights" for a repository you simply cannot see.

### Status codes that mean something other than what they say

| Code | Actual meaning in practice |
|---|---|
| 404 | Not found **or** not permitted to know it exists |
| 401 | No credentials, or they expired |
| 403 | Authenticated but not allowed — rate limit, SSO, or missing scope |
| 422 | Validation failed; the body names the offending field |
| 409 | Conflict — a branch existed, a ref moved |

**A 404 on a repository you can see in a browser is almost always a permissions problem.**
Check `gh auth status` before concluding it does not exist.

### Rate limits

Authenticated: 5,000 requests/hour. Unauthenticated: 60. Exceeding returns **403** with
`X-RateLimit-Remaining: 0`, which is indistinguishable from a permissions 403 unless you
read the headers:

    gh api rate_limit --jq '.rate'

Secondary limits apply for bursts and for creating many issues or comments — a short
secondary-limit lockout returns 403 with a `Retry-After`, not a rate-limit reset.

## GraphQL

For what you need several related things at once — REST needs one request per object.

    gh api graphql -f query='
      query($owner:String!, $repo:String!) {
        repository(owner:$owner, name:$repo) {
          pullRequests(states:OPEN, first:50) {
            nodes { number title reviewDecision }
          }
        }
      }' -F owner=owner -F repo=repo

**GraphQL has a node limit** — a query can fail with "too many nodes requested" for a large
result set. Paginate with `after:` cursors rather than raising `first:`.

**`repository(owner:name:)` with `name` null returns null, not an error**, when the
repository does not exist. A query that dereferences into a null repository fails far from
the real cause.

**Errors come back HTTP 200** with an `errors` array in the body. A client checking only the
status code sees success on a failed query — the single most common GraphQL bug.

## Conditional requests

`ETag` / `If-None-Match` — a `304` means unchanged, costs nothing against the rate limit.
Also `If-Modified-Since`. Useful for polling something without burning quota.

## Agents

**Never print a token** in a command, an error, or a script.

**`--paginate` unless you are certain the result is small.** A missing page is silent.

**Check the body of a GraphQL response**, not the status code.

**A 404 is ambiguous by design.** Verify with `gh auth status` before reporting "does not
exist".

**Every call here needs the network** and 403s in-session — that is the sandbox, not the
API.
