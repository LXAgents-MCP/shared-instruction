---
name: memory-tasks-sse-to-mcp-transport
description: Task record for replacing the SSE transport at /sse and /message with a stateless POST /mcp on express, adding a cluster primary, and correcting every page that described the old transport.
---

# Task: SSE to `POST /mcp`, and cluster workers

Three branches, stacked. Local commits only; nothing is pushed from them.

## The plan

| # | Task | Branch | Scope |
|---|---|---|---|
| 1 | The record | `chore/sse-to-mcp-plan` | This file. |
| 2 | `/mcp` transport | `feat/express-transport` | SSE at `/sse`+`/message` → stateless `POST /mcp` + `GET /healthz`. |
| 3 | cluster workers | `feat/cluster-workers` | A `cluster` primary forking workers onto the one `PORT`. |

The working plan is untracked, under `.agents/plans/`, and is deleted or abandoned when
the work merges. Where the two disagree, this record wins.

## What this is

**This repository is the exception among the five, and the plan had to be written
differently because of it.**

The other four serve `POST /mcp` from a `node:http` server, and this is a like-for-like
swap there. This repository is **already on express** and it speaks **SSE**, at `GET
/sse` and `POST /message`. There is no `/mcp` and no `/healthz`.

That is not an accident. It is recorded in
[`feat-http-transport.md`](./feat-http-transport.md) — *Transport: **SSE, as
specified*** — and in
[`../decisions/express-for-http-transport.md`](../decisions/express-for-http-transport.md).
The owner has reviewed both and chosen `/mcp` anyway, for consistency across the five,
and with it accepted that this is a **breaking change for every deployed client**.

So the task is not "add express" here. It is **replace a stateful, session-carrying,
deprecated transport with a stateless one**, and correct every page in the repository
that describes the old one — which is the largest documentation surface of the five,
with eleven files naming `/sse`.

## What the supersession does and does not do

`SSEServerTransport` is marked `@deprecated … Use StreamableHTTPServerTransport
instead` in `@modelcontextprotocol/sdk@1.30.1`. The earlier record already noted this
and kept SSE because it was specified explicitly. The owner has now reversed that, so
the deprecation stands and the reversal is deliberate rather than accidental.

**The prior record and decision file are superseded, not deleted.** They record what was
true and why, and a decision still on disk is the record of why this repository looked
the way it did. The decision file is *corrected in part* — two of its sentences become
false, and the file records that it was superseded rather than replaced.

## Baseline

`npm test` before any change: **31 tests, 31 pass, 0 fail** (Node 24.21.0, `node
--test`, no framework). This includes the four `content/` bijection and byte-identity
checks; a change in `src/` must move no served byte.

## The one structural difference from the other four

Everywhere else the entry point is `src/index.js`. Here, `src/http.js` stays the HTTP
entry point, because `package.json`'s `start:http` and the `Dockerfile` comment both
say `node src/http.js` and **neither may change** — the `Dockerfile` is not being
modified. So `src/index.js` gains `MCP_TRANSPORT=http` support and delegates to
`src/http.js` by dynamic import, which is what keeps express out of the stdio process
where stdout is the JSON-RPC channel.

## What goes away

The session store, the `SSEServerTransport`, and `res.on("close") → sessions.delete` —
the state that made SSE stateful, with no stateless equivalent. What replaces them is
an **in-flight set**, as in the sibling repositories, so shutdown can close requests
deliberately. The drain line changes shape with it: `draining {n} session(s)` becomes
`draining {n} in-flight request(s)`.

## Preserved

`MCP_ALLOWED_HOSTS` with its exact semantics — off when unset, empty, or
separators-only, and announced on startup either way; `PORT` default 3000; `HOST`
default `0.0.0.0`; nothing on stdout; the read-only 31-tool surface.

## Held, not done

`content/rules/mcp-connector.md` documents the connector as `"type": "sse"` at
`https://shared-instruction.example.com/sse`. That becomes false the moment `/mcp`
ships, and it is **published content**: a change under `content/` is a release, and the
version does not move without the owner. Raised in
`.agents/plans/docs-to-correct.md`, not performed. It also means the version bump and
`wiki/logs/{M}/{m}/{p}/` are not optional for task 2 to close — they are a decision
the owner has to make.

## Test counts

| Point | Tests | Pass | Fail |
|---|---|---|---|
| Baseline, before any change | 31 | 31 | 0 |

---

### Task 1 — `chore/sse-to-mcp-plan`

Created this record with the confirmed task list, before any of the work, so a reviewer
checks the plan against the work rather than inferring the plan from it. Registered in
[`.agents/index/memory-index.md`](../../index/memory-index.md) in this commit.

Task 2 branches from this branch and adds its own entry here in its own commit.
