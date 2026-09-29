---
name: memory-decisions-express-for-http-transport
description: Why express became the third runtime dependency, for the HTTP transport.
---

# express as a third runtime dependency

`.agents/rules/repository.md` states the runtime dependencies are the MCP SDK and zod, and
that adding a third "needs a reason in `.agents/memory/decisions/`". This is that reason.

**Decision.** `express@^5.2.1` is a production dependency, used by `src/http.js`.

**Why it is not a dependency added to serve one call site.** That clause is the rule's
rationale, and it is not what happened. The HTTP entry point uses express for four
distinct things: the `/sse` and `/message` routes, JSON body parsing on the message route,
the `hostHeaderValidation` middleware that `SSEServerTransport` can no longer provide
itself, and error handling. Removing it would mean reimplementing all four against
`node:http`.

**Why the SDK's own helper rather than hand-rolled middleware.** The SDK ships
`createMcpExpressApp`, which returns a configured `Express` with DNS-rebinding protection
already applied. Writing the `Host` allow-list by hand is exactly the kind of security
control that looks right until someone gets the normalisation wrong, and the SDK's version
is the one its own maintainers test. `hostHeaderValidation` is the supported replacement
for `SSEServerTransport`'s deprecated `allowedHosts` option, for the same reason.

**The cost is smaller than it looks.** `express@5.2.1` was already resolved in
`package-lock.json` as a transitive dependency of `@modelcontextprotocol/sdk`. Promoting it
to a direct dependency changes no installed version and introduces no new transitive graph
— verified against the lockfile before and after. The rule exists to stop dependencies
accumulating unnoticed; this one was already there, and naming it is the honest response to
that.

**What would invalidate this.** If `src/http.js` is ever deleted, so is this decision, and
`express` should leave `package.json` in the same commit that removes the last use of it.
