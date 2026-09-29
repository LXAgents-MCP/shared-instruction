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

## Record open

Tasks 2–5 outstanding.
