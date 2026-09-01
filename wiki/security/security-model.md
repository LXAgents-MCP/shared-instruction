# Security Model

The security posture of `LXAgents-MCP/shared-instruction` specifically. It is scoped to
this repository and describes nothing about the repositories that consume the set — each
one keeps its own model, and they are deliberately not merged.

## What this project actually is, in security terms

A read-only publisher. It reads markdown from `content/` once at boot into a frozen
registry and serves it over MCP, plus a CLI over the same registry. There is no database,
no user accounts, no session data belonging to anyone, and nothing persisted at runtime.

That shape decides most of what follows: the interesting risk here is not data theft. It
is that the content is **instructions an agent will obey in someone else's repository**.

## The trust boundary that matters most

`content/` is published to every consuming repository as standing orders. An agent in
another repository reads it and treats it as authoritative — that is the entire point of
the connector.

So a wrong instruction in `content/` is not a documentation bug. It is an
instruction-injection vector with organization-wide reach, and it needs no exploit to
trigger: consumers pick a change up on their next read, with no upgrade step and no
review on their side.

Concretely, text merged into `content/` can direct another repository's agent to run a
command, write a file, weaken a convention, or skip a permission gate. Review a
`content/` diff as you would review code that runs on someone else's machine, because in
effect it does. This is why `content/` changes are versioned and logged like a release —
the log entry is the only notice a consumer ever gets.

## Attack surface

| Surface | Exposure | What guards it |
|---|---|---|
| HTTP `/mcp` endpoint | Public, unauthenticated | Nothing to authenticate — the set is public, read-only content. See *No authentication, on purpose* below. |
| Request body | Any caller | `express.json({ limit: MAX_REQUEST_BODY })` — 4 MB, `src/constants.js`. |
| Cross-origin / rebound hosts | Any caller | `originGuard` in `src/transport/http.js`, allow-lists from `MCP_ALLOWED_HOSTS` and `MCP_ALLOWED_ORIGINS`. **Off by default** — see below. |
| Stateful sessions | Any caller, when enabled | Capped at `MCP_MAX_SESSIONS` (default 1000); over capacity returns 503, not an allocation. |
| Resource reads | Any caller | In-memory lookups against a frozen registry. No filesystem or network I/O on the read path, so a read cannot be steered at the disk. |
| `mcp_creator` — the only tool that writes | Any caller | `resolveTarget` in `src/tools/mcp-creator.js`. Detailed below. |
| Dependency install | Build time | `npm ci --ignore-scripts` in the `deps` stage of the `Dockerfile`. |
| Container runtime | Deployed | Runs as the unprivileged `node` user; the tree is readable, not writable. |

### `mcp_creator` and the two channels

`mcp_creator` scaffolds a repository on disk, so it is the one place a caller-supplied
string becomes a filesystem path. `resolveTarget` is the single chokepoint — all three
filesystem calls (`readdir`, `mkdir`, `writeFile`) consume the path it returns, and
`writeScaffold` re-checks every entry in the plan, because a plan is a plain object that
can be assembled by hand between the two calls.

It rejects a null byte, an empty path, a filesystem root, and a relative directory that
climbs out of the working directory. Containment is checked with `relative()` on
already-canonical paths rather than by scanning the input for `..`, which is the check
encoding tricks defeat.

**The two channels are deliberately not equally trusted.** An absolute `--directory` on
the CLI is allowed, because choosing where to scaffold is the CLI's whole purpose and the
person running it already has the shell. The MCP path passes `root: process.cwd()`, so a
model filling in that argument cannot name a target outside the working directory. If you
add another caller, decide which of those two it is before wiring it up.

## No authentication, on purpose

There is no auth on `/mcp`, and adding some would not make the content less public — it
is an instruction set meant to be read by every repository in the organization, and it is
also on npm.

The consequence is a rule, not a caveat: **nothing confidential goes in `content/`, in
`wiki/`, or anywhere else in this repository.** Treat every file here as world-readable,
because it is. If a future change makes any served content non-public, authentication
becomes a prerequisite for that change rather than a follow-up.

## Secrets

There are none, and that is a property worth keeping. Every environment variable this
project reads is configuration, not a credential — transport, host, port, path, session
mode, worker count, log level, and the two allow-lists. They are documented in
[`../environments/env.md`](../environments/env.md).

`.env` and `.env.*` are gitignored (`.env.example` deliberately is not). If this project
ever does need a credential, it does not go in `content/` — see the boundary above.

## Deployment posture

Deployed on Render from `master`, serving streamable HTTP, stateless by default. The
connector URL must include the `/mcp` path.

Two things are worth knowing before treating the deployment as hardened:

* **DNS-rebinding protection is off by default.** `MCP_DNS_REBINDING_PROTECTION` defaults
  to `false` in `src/config.js`, and the origin and host allow-lists only take effect when
  it is on. That default suits local development; a public deployment that cares about
  browser-originated requests should set it, along with `MCP_ALLOWED_HOSTS` and
  `MCP_ALLOWED_ORIGINS`.
* **The free tier spins down when idle**, so the first request after a pause takes 50+
  seconds. That is a cold start, not an outage — and not a denial of service worth
  investigating.

## Reporting something

Open an issue on `LXAgents-MCP/shared-instruction`. If the finding is about content that
would direct another repository's agent to do something harmful, say so in the title — it
is the class of bug that reaches furthest fastest, and it is fixed by a release rather
than a patch on one machine.
