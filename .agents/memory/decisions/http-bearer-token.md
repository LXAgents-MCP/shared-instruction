---
name: memory-decisions-http-bearer-token
description: Why the HTTP transport requires a bearer token and refuses to start without one, when the set had no authentication by design.
---

# The HTTP Transport Requires a Bearer Token

## 2026-10-09

**Decision.** The HTTP transport requires `Authorization: Bearer <token>` matching
`MCP_AUTH_TOKEN` on every route except `GET /healthz`, and the process refuses to start without a
token of at least 32 characters. The stdio transport reads no token and needs none.

**What it reverses.** The security model argued, in several places, for no authentication on the
grounds that the content is public and on npm. That argument was about confidentiality, and it
still holds: the token does not make a byte of the set private. What changed is the question
being asked. The owner wants a deployed instance to serve only callers it has issued the token
to, and the tool surface is unchanged. The token gates the service, not the text, and the
security model says so, so the old argument and the new control do not contradict each other.

**Why the transport decides, rather than the bind address.** A server on `127.0.0.1` behind a
reverse proxy on the same host is reachable from the internet, so "loopback needs no token" would
be a waiver that fails open in exactly that deployment. The transport is the fact the server can
rely on: a client that spawns a process is local by construction, and a client that opens a socket
is not.

**Why fail closed, with no opt-out.** An optional token means a deployment that forgot to set it
runs open and says nothing a person reads. Refusing to start turns that into a visible failure at
deploy time. `createApp` throws too, so calling the app directly cannot skip it. An opt-out flag
was considered and declined: it is the one setting that would eventually be left on.

**Why the check is in the primary.** Left to the workers, a missing token is the same line from
each of them and then a respawn loop through the crash limit.

**Alternatives declined.** A query-string token, because a URL is logged. OAuth, because a static
bearer is what the clients in use can send and an OAuth server is a service to run. Per-client
tokens, because nothing asks for identity or individual revocation yet and the cost is a store of
tokens; rotation by changing the variable is the remedy for now.

**Known limits, all stated in the security model.** One shared token; no TLS and no rate limiting
in this process; clients that can only authenticate through OAuth cannot use it.

**Consequence.** Breaking for anyone who reaches a deployed instance. The Render service tracks
`master` and redeploys on merge, so the variable has to be set on it, and the clients updated,
before the change is merged.
