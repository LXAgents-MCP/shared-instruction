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
