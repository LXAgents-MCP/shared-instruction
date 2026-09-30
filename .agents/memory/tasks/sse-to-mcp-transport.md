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
| After task 2 | 42 | 42 | 0 |

---

### Task 1 — `chore/sse-to-mcp-plan`

Created this record with the confirmed task list, before any of the work, so a reviewer
checks the plan against the work rather than inferring the plan from it. Registered in
[`.agents/index/memory-index.md`](../../index/memory-index.md) in this commit.

---

### Task 2 — `feat/express-transport`

`GET /sse` and `POST /message` are gone. `POST /mcp` and `GET /healthz` replace them, on
the same express app, and this is breaking for every deployed client.

**`src/app.js` is new** and holds the whole HTTP surface as a pure factory: `POST /mcp`,
`GET /healthz`, a JSON-RPC 405 for any other method on `/mcp`, a JSON-RPC 404 for everything
else, and a four-argument error handler that gives an oversized body and a malformed one the
same 400 / `-32700`. It does not listen. `src/http.js` owns the port, the interface, the
startup lines and the drain.

**`src/index.js` gained `MCP_TRANSPORT=http`** and reaches `src/http.js` by dynamic import.
The import is dynamic because `src/index.js` is the stdio entry point and stdout there is the
JSON-RPC channel — a static import would load express into that process whether or not HTTP
was selected. The stdio statements themselves are unchanged, only re-indented into the
`else`.

**Three decisions worth recording, because none of them was in the plan.**

*The startup line moved from stdout to stderr.* The old HTTP entry point logged to stdout,
on the reasoning that the protocol is on a socket there. That reasoning was true and became
irrelevant the moment `src/index.js` could reach `src/http.js`: the same file is then one hop
from a process whose stdout is a protocol stream. So the HTTP path logs to stderr, the "one
rule with an exception" carve-out in `.agents/rules/repository.md` and
`wiki/environments/setup.md` is gone, and a test asserts stdout stays empty. The
`Dockerfile` is untouched and does not depend on the stream.

*The drain line changed shape* from `draining {n} session(s)` to
`draining {n} in-flight request(s)`, because there are no sessions left to count. The
in-flight set is **not** the session map renamed: it is a set of per-request closers, which
is what a shutdown can act on, and the backstop invokes them if a request is stuck.

*The body limit is new.* The SSE transport parsed its own bodies with the SDK default, which
is effectively unbounded, so an unauthenticated public port accepted whatever a caller sent.
`express.json({ limit: 4 * 1024 * 1024 })` declares a ceiling the previous route did not have.

**`express@^5.2.1` was already a direct dependency** here — the SSE transport used it — so
`npm install --package-lock-only` produces an empty diff. No version of any package moved,
and `package.json` is unchanged. The direct-dependency marking the other four repositories
needed had already landed with the SSE work.

**The Dockerfile is untouched**, and `node src/http.js` still works because `src/http.js` is
still the HTTP entry point. That constraint is the reason this repository has one file and
one hop the other four do not.

**`test/http.test.js` is a rewrite**: 11 SSE tests died with the transport and 23 replaced
them. The suite went 31 → 42, and the run got faster (41 s → 13 s) because there are no
long-lived streams for the runner to wait on.

**Two `verification.md` greps do not come back empty, and one of them cannot.**

* `grep -rn "/sse" wiki/ AGENTS.md README.md` outside `wiki/logs/` — **clean.** The pages
  that recorded the old transport now record its removal without spelling the route.
* `grep -rn "/sse\|SSEServerTransport" src/ test/` — **clean in `src/`**; two lines remain in
  `test/http.test.js`, and both are irreducible: one asserts the 404 body no longer mentions
  the old transport, the other asserts that the two old routes return 404. A test asserting a
  route is gone has to name it. `verification.md` asks for both assertions, so the grep and
  the assertions cannot both be satisfied.

**Documentation corrected in this commit**, each because the code above falsifies it:
`AGENTS.md`, `README.md`, `wiki/reference/mcp-surface.md` (including the row that argued
*against* `/healthz`), `wiki/security/security-model.md` (including the *Sessions*
subsection), `wiki/information/architecture.md`, `wiki/information/overview.md`,
`wiki/environments/setup.md`, `wiki/environments/env.md`, `wiki/environments/docker.md`,
`wiki/guides/connect-a-repository.md`, `wiki/guides/install-as-local-mcp.md`,
`.agents/wiki/context/repository-map.md`, `.agents/memory/state/repository-state.md`,
`.agents/index/memory-index.md`, `.agents/rules/repository.md`, and
`.agents/memory/decisions/express-for-http-transport.md` — the last **corrected in part and
marked superseded**, not deleted.

`MCP_ALLOWED_HOSTS` keeps its exact semantics, `PORT` still defaults to 3000, `HOST` to
`0.0.0.0`, the 31-tool surface is untouched, and the four `content/` bijection and
byte-identity checks pass: a change in `src/` moved no served byte.
