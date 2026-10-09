---
name: memory-tasks-http-token-auth
description: Requiring a bearer token on the HTTP transport while stdio stays open, and the breaking release that follows.
---

# Require a Token on the HTTP Transport

## 2026-10-09 — in progress

**Goal.** A server reached over a network proves who is calling; a server a client spawns on its
own machine does not have to.

**Objective.** The HTTP transport refuses every request except `GET /healthz` unless it carries
`Authorization: Bearer <token>` matching `MCP_AUTH_TOKEN`, and refuses to start without a usable
token. The stdio transport is unchanged and needs no token. `npm test` is green, and every page
that said this server has no authentication says what is true now.

**Detail.** Edit this repository only. `security` gets the same change in its own record, and
`cli` is excluded: it is stdio-only by design and gains no network code. The token is read from the
environment and appears nowhere in a log, a response or a file. `content/` does not change — nothing
in the published set describes how an HTTP client authenticates, so the tool surface is untouched.

**Status:** in progress.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Task record | `chore/http-token-auth-plan` | |
| 2 | Require a token on HTTP | `feat/http-token-auth` | |
| 3 | Release | `release/{version}` | |

Branches stack: task 1 from `master`, task `k` from task `k-1`. The `PR` column is filled by
task 3.

## Decisions the owner approved with the plan

| # | Decision |
|---|---|
| D1 | Convention-named stacked branches, not the harness-named `claude/…` branch. |
| D2 | The transport decides. HTTP always needs the token; stdio never does. A bind on loopback does not waive it, because a reverse proxy on the same host would turn that waiver into an open door. |
| D3 | One variable, `MCP_AUTH_TOKEN`, the sixth this server reads. The owner's approval of the plan is the say-so `repository.md` asks for. |
| D4 | Fail closed. HTTP refuses to start with the token unset or shorter than 32 characters, and there is no opt-out flag. The check runs in the primary before any worker is forked, so a missing token is one clear line and not a crash loop through the respawn limit. |
| D5 | `Authorization: Bearer` only, compared in constant time. No query-string form: a URL is logged. A wrong or missing token is a `401` with `WWW-Authenticate: Bearer`, in the JSON-RPC error envelope the other refusals use. |
| D6 | The check sits after the `Host` allow-list and before the body parser and every route, so an unauthenticated caller cannot make the server parse a body or find a route. `/healthz` stays open: it returns only `{status, server, version}` and an orchestrator's probe cannot send a token. |
| D7 | Clients that can send a header are the target: Claude Code, a `.mcp.json` `headers` entry, the Agent SDK, the Inspector. A client that authenticates only with OAuth cannot use a static token. The plan raised this and the owner approved without objecting, so it is recorded here as the assumption it is. |

## Consequences to carry into the release

This is breaking for anyone who reaches a deployed HTTP instance. The new version refuses to boot
without `MCP_AUTH_TOKEN`, and a client without the header gets `401`. The token has to be set on the
host and in each consumer's connector configuration before the new version is deployed. The release
log names that under **Consumers must**; the version needs the owner's approval.

## Task entries

### Task 1 — chore/http-token-auth-plan

Landed: this record and its row in `memory-index.md`. The `PR` column is filled by task 3, not
here, so no later branch needs a rebase. Nothing outside `.agents/` changes in this task. Task 2
depends on nothing from this entry except the plan above.

### Task 2 — feat/http-token-auth

Landed. HTTP requires `Authorization: Bearer <MCP_AUTH_TOKEN>` on every route except
`GET /healthz`, and refuses to start without a token of at least 32 characters. stdio is
unchanged and never reads the variable. `npm test` runs 70 tests, up from 54, all passing.

**Code.** New `src/auth.js` (`tokenProblem`, `configuredToken`, `requireBearerToken`). `src/app.js`
mounts the middleware after the `Host` allow-list and before the body parser, with the exact
`GET /healthz` exemption, and `createApp` throws without a usable token. `src/http.js` checks in
the primary before forking and sets the exit code rather than calling `process.exit`, because
nothing is listening yet and the line must not be cut off. The startup line says a token is
required and never what it is.

**Tests.** Every existing HTTP test now runs with a token. Sixteen new ones cover missing, wrong,
malformed and correct credentials, no route being revealed, the check running before the body is
parsed, the exact `/healthz` exemption, the token never reaching the output, the refusal to start
through both entry points with one worker and several (once, and not a respawn loop), and stdio
ignoring even an unusable value. Four controls were each broken on purpose and the matching test
failed every time: the comparison made always-true, the check moved after the body parser, the
primary's check removed, and the `/healthz` exemption loosened to a prefix.

**Docs.** The security model, its agent-facing counterpart, the environment, Docker, setup,
connect and local-install pages, the surface and architecture pages, the README, the Dockerfile
comments, the repository map and the repository state now say what is true. The decision is
recorded in `decisions/http-bearer-token.md`.

**Left stale on purpose — instruction files, for the owner to decide.** The discovery protocol
forbids editing these unprompted, so each is reported in the pull request instead:

- `AGENTS.md`, the HTTP row of the "Register it" table: registration now also needs an
  `Authorization` header.
- `.agents/rules/repository.md`: "two transports and five variables" is now six; the HTTP run
  command in its table now needs `MCP_AUTH_TOKEN`.
- `content/skills/engineering/mcp-server.md`: its three-state diagnostics table has no row for a
  `401`, the new way a registered HTTP connector reports no tools. This one is published, so it
  would be a release of its own.

**Not verified.** The Docker image was not built, as before. Nothing was deployed or run against
the Render service. The `${MCP_AUTH_TOKEN}` header expansion and the `claude mcp add --header`
form are written from the clients' documented behaviour and were not run against a client here.

Left for task 3: version, changelog, the two log indexes, the `PR` column and closing this record.

### Task 3 — release/5.0.0

Landed. The version is `5.0.0`, approved by the owner: a client of a deployed HTTP instance that
sends no token now gets a `401`, and the new version will not boot without `MCP_AUTH_TOKEN`.
`package.json` and the lockfile carry it, `wiki/logs/5/0/0/CHANGELOG.md` records it with the
**Consumers must** steps, and `.agents/index/logs-index.md` has its row. Image tags in the docs
move to `5.0.0`; several had been left at `3.1.0`. The repository state names the new version. No
git tag was created; a tag carries a version too and needs its own approval.

**The order of operations matters here.** The Render service tracks `master` and redeploys on
merge, so `MCP_AUTH_TOKEN` has to be set on it before this lands, or the deploy fails at startup.
The changelog says so first among the steps.

The `PR` column and the closing of this record follow once the pull requests exist, in their own
commit on this branch. Nothing is stacked on this branch, so that commit invalidates nothing.
