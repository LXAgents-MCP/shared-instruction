---
name: memory-tasks-feat-http-transport
description: Adding an HTTP/SSE transport alongside stdio so the server can run as a Web Service — a breaking change to the published connector block.
---

# HTTP Transport

## 2026-09-29 — planned

**Goal.** This server speaks stdio and nothing else, which bounds it to a subprocess on
someone's machine. Give it a second transport so it can run as a long-lived network
service, without changing anything a stdio consumer depends on.

**Objective.** A second entry point serving the same 32-tool surface over HTTP; a
`Dockerfile` that can expose it; every page in this repository that claims "stdio only"
corrected in the same commit as the code that falsifies it; and a security model that
survives having a listener. One branch for the record, one for the work, two pull
requests, merged in order.

**This re-adds what PR #63 removed.** `2.0.0`'s changelog records the removal of a
streamable-HTTP transport, a session store, a Render deployment, and twelve environment
variables, and the correction of roughly twenty files that still described them. This is
the same change run forwards. The failure mode is the same one in reverse: pages whose
*reasoning* rests on the absence of a listener do not become merely incomplete when there
is a listener, they become false, and a patch that repairs the sentences leaves the
argument standing.

**The published block makes this breaking, and that is the finding that shaped the plan.**
`content/rules/mcp-connector.md` states that stdio is the only transport immediately above
the connector JSON block that `content/AGENTS.md:17-18` says every consuming repository
carries **verbatim** in its root `AGENTS.md`. Correcting it changes text already copied
into repositories this one does not control, and those copies do not update themselves.
That is a release with a `Consumers must:` line, not a documentation fix — and it is why
the version question is not optional housekeeping.

### Decisions taken

| Decision | Choice |
|---|---|
| Transport | **SSE, as specified** — `SSEServerTransport`, `/sse` and `/message` |
| Branches | Two, per `task-workflow.md` §C and the request's own steps 2–3 |
| `express` | Added, with the reason recorded in `.agents/memory/decisions/` |
| `ENTRYPOINT` | `src/index.js` stays the default; the HTTP invocation is documented |
| Compose, hosting, `/healthz` | Out of scope — deployment decisions, not transport ones |
| Version | **Held.** No approval given; see *Open* below |

**Why SSE despite the deprecation.** `@modelcontextprotocol/sdk@1.30.1` declares
`SSEServerTransport` as `@deprecated … Use StreamableHTTPServerTransport instead`, and its
`allowedHosts` / `enableDnsRebindingProtection` are deprecated individually in favour of
`hostHeaderValidation` middleware. Streamable HTTP was recommended and is the better
default. The request specified SSE explicitly and in detail, the deprecation was surfaced
before work began, and the instruction to proceed came without overriding it — so the
explicit instruction wins, per `AGENTS.md`'s conflict rule, and the deprecation is recorded
in the source and the changelog rather than left for the next reader to trip over. Changing
it later is a one-file change.

### The security detail that must not regress

`.agents/memory/tasks/activation-security.md:183-189` records that the deleted
implementation's `originGuard` and `MCP_DNS_REBINDING_PROTECTION` **defaulted to off**, so
its host and origin allow-lists did nothing unless switched on. A public port with inert
guards is a live vulnerability, and that changelog is the only place in this repository
documenting the setting existed at all.

The replacement has a subtler version of the same trap: `createMcpExpressApp` auto-enables
DNS-rebinding protection when the host is loopback, and a Web Service binds `0.0.0.0`.
The protection is therefore off in exactly the deployment this change exists to enable,
unless `allowedHosts` is passed explicitly. The implementation asserts a rejected `Host` is
rejected, rather than assuming it.

**No auth, no rate limiting, no TLS.** The content is public and on npm, so authentication
would not make it less so — but that argument was made when there was no way to reach the
server, and it has to be restated in its new shape rather than carried over. The security
page will say the gap is a gap.

### Task 1 — `chore/feat-http-transport-plan`

This record, and its row in `.agents/index/memory-index.md`. Nothing else.

### Open, and needing the owner

* **A version.** The release is a `2.1.0` minor — no tool name changes, no tool removed —
  but `versioning.md` gates both `package.json` and a new `wiki/logs/2/1/0/` directory on
  explicit approval, and none was given for this task. The work lands; the release waits.

* **The Docker image has still never been built.** Docker is not installed in this
  environment, for the second time. The `EXPOSE` and entrypoint changes cannot be validated
  by building, and will be recorded as unverified rather than described as working.

* **`src/tools/instruction.js` is still dead code** on the default branch, from the
  previous task. Deleting a pre-existing file requires the owner:

  ```
  git -C C:\Users\owen\MyProjects\LXAgents-MCP\shared-instruction rm src/tools/instruction.js
  ```

### Task 3 — `feat/http-transport`

The transport, its tests, and every page the transport falsifies — one commit, because
`change-propagation.md` puts documentation in the same commit as the code that makes it
wrong, and splitting them would leave master briefly describing a server that does not
exist.

**What landed.**

| File | What |
|---|---|
| `src/http.js` | The entry point. `/sse` opens a session, `/message` routes to one, anything else is a 404 that names both. Session store bounded by `res.on("close")`. Drain-then-close on `SIGINT`/`SIGTERM`. |
| `test/http.test.js` | 11 tests against a real listening process. |
| `package.json` | `express` as a production dependency; `start:http`; `start:stdio` as the named form of `start`. |
| `Dockerfile` | `EXPOSE 3000`, entrypoint unchanged. |

**`ENTRYPOINT` stayed `src/index.js`.** The request asked for the entrypoint to change, and
it did not. An image whose default transport changes is a silent breaking change for every
existing `docker run -i` caller, and the HTTP form is one argument away with no second
image and no second build:

```bash
docker run --rm -p 3000:3000 lxagents-shared-instruction:2.0.0 node src/http.js
```

This is a decision the owner can reverse in one line; it is recorded here because the plan
said otherwise and the reason changed.

**Three tests failed and all three were the test's fault, not the code's.** Worth the
lines, because each is a way of asserting something that was never true:

* *A tool given an argument must not quietly ignore it* — the SDK **does** ignore extra
  arguments, silently, returning `isError: undefined`. The assertion invented a contract
  the server never had. Rewritten to assert what is actually true: the argument cannot
  change which file is served, and the result is identical with and without it.
* *Shutdown drains sessions* — on Windows `child.kill("SIGTERM")` kills the process
  without running a Node handler, so the test observed nothing. The code was correct and
  unobservable here. The assertion is now `process.platform !== "win32"`, with a comment
  saying why, rather than deleted.
* *The startup warning appears* — this one is a genuine race, and it passed on one run and
  failed on the next. The test asserted on captured stdout at the instant the "listening
  on" line appeared, and the warning is written a tick later. Fixed by waiting for the
  line, and the other half was added: with `MCP_ALLOWED_HOSTS` set, the server must **not**
  print it, so a warning printed unconditionally cannot pass the first test.

**One more correction, because it is the trap the record above warns about.**
`createMcpExpressApp` was the obvious choice and it enables DNS-rebinding protection
*only for loopback* — and a container binds `0.0.0.0`. Using it would have shipped the
protection off in exactly the deployment this task exists to enable. `hostHeaderValidation`
is applied explicitly instead, and a test asserts a disallowed `Host` returns 403 through
`node:http`, because `fetch` cannot set `Host` and would have passed whatever the real
control does.

**Documentation corrected in the same commit.** `README.md`,
`wiki/information/{architecture,overview}.md`, `wiki/reference/mcp-surface.md`,
`wiki/environments/{setup,env,docker}.md`, `wiki/security/security-model.md`,
`wiki/guides/{connect-a-repository,install-as-local-mcp}.md`,
`content/rules/mcp-connector.md`, `AGENTS.md`, `.agents/rules/repository.md`,
`.agents/wiki/{context/repository-map,security/security-boundaries}.md`,
`.agents/index/project-wiki-index.md`, `.agents/memory/state/repository-state.md`, and this
record. Thirty tests, all passing.

**Pages that were false, not merely incomplete.** The sweep found the re-add runs the #63
failure mode in reverse. `wiki/environments/docker.md` argued *against* a compose file
because "there is no transport to compose" — which is now false, and the reasoning had to
be replaced rather than deleted, so it now says a compose file encodes a deployment and
this repository has none. `wiki/environments/env.md` opened with "**There are none.**" and
now carries three variables. The security model argued at length that there is no
network-facing surface; that argument is gone and the page now argues the *actual* one,
which is harder, because "no auth on a public markdown server" and "no auth on a listening
socket" are different claims.

## Record open

Tasks 4–5 outstanding.
