# Security Model

The security posture of `LXAgents-MCP/shared-instruction` specifically. It is scoped to
this repository and describes nothing about the repositories that consume the set — each
one keeps its own model, and they are deliberately not merged.

## What this project actually is, in security terms

A read-only publisher. It reads markdown from `content/` once at boot into a frozen map and
serves it over MCP. There is no database, no user accounts, and nothing persisted at
runtime.

**It has two transports, and one of them is a network listener.** `src/index.js` speaks
stdio, which is a pipe a client spawns. `src/http.js` speaks stateless HTTP, which binds a
port. The second is newer than this page's previous revision, and it changes the shape of
everything below: the interesting risk is still not data theft, because the content is
public by design, but a listener adds a reachability question that a pipe does not have.

That shape decides most of what follows: the content is **instructions an agent will obey
in someone else's repository**, and that remains the risk that reaches furthest.

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

Note what makes this worse rather than better: the set is published to npm. Nothing in the
distribution path is a review either.

## Attack surface

| Surface | Exposure | What guards it |
|---|---|---|
| Tool calls | Any caller | **Nothing, and that is the design.** Every tool is read-only and takes no argument. There is no path, no verb, and no target a caller can supply. |
| Path reads | None | No tool takes a path and nothing opens a file a caller named. The set is read once at boot from a fixed directory. Detailed below. |
| **The HTTP listener** | **Anyone who can reach the port** | **No authentication.** The content is public, so auth would not make it less so. Optional `Host` allow-list via `MCP_ALLOWED_HOSTS`, **off unless set**. Detailed below. |
| In-flight requests | Anyone who can reach the port | One `McpServer` per request, never shared, closed when its response closes. **The set of them is per-request closers, not a map of live sessions** — a stateless transport has no id to key on and keeps nothing between requests, so there is no store to fill. |
| Process startup | Anyone who can spawn it | Reads `package.json` and walks `content/`. Malformed content throws and the process exits rather than serving something wrong. |
| Dependency install | Build time | `npm install` runs lifecycle scripts. `npm ci --ignore-scripts` is the safer form for a build you do not control. |
| Publishing | Anyone with npm credentials | Publishing changes what every consumer reads. Treat a release as a security-relevant action, because it is one. |

## The HTTP listener

This section is new, and it is the part of this page that most deserves scepticism from a
reader who trusted the previous revision.

**What it changes.** A stdio server is reachable only by whoever can spawn the process. An
HTTP server is reachable by anyone who can open a socket to it. That is the whole
difference, and it is not a small one: the exposure is no longer "who can read this
repository" but "who can reach this port".

**What it does not change.** Every tool is still read-only, still takes no argument, and
still returns one of the same public files. A caller who reaches the port gets exactly
what a caller who clones the repository and runs it locally gets. There is no privileged
operation to reach, no credential to present, and no state to corrupt. The listener widens
who can ask, not what they can do once they have.

**And the worker pool does not widen it either.** `src/http.js` forks one process per CPU by
default, but every worker binds the same port and serves the same 33 read-only tools, so the
pool multiplies capacity rather than surface. Two things follow that are worth stating:
there is still nothing shared between workers to corrupt — each builds its own `McpServer`
per request — and the `Host` allow-list is evaluated by every worker independently, so
there is no way to reach a worker that skipped it.

**Authentication, and why there is none.** The content is an instruction set meant to be
read by every repository in the organization, and it is also on npm. Requiring a key would
not make it less public; it would only make it harder to read, and the people who need it
are exactly the people who should not be blocked.

That reasoning was previously made in a context where the server could not be reached at
all, which made it close to vacuous. It is stated again here in the context where it
actually has to hold, and it holds for one reason: **nothing confidential is served**. The
moment that stops being true, this argument stops being an answer — see the escalation
item in `.agents/wiki/security/security-boundaries.md`.

**The `Host` allow-list, and its default.** `MCP_ALLOWED_HOSTS` (comma-separated) turns on
hostname validation. **It is off unless set**, and the process says so on startup.

This default is worth distrusting, because the last implementation of this server had the
same shape and it was a live problem: `MCP_DNS_REBINDING_PROTECTION` defaulted to `false`,
so `originGuard`'s allow-lists did nothing at all — see
`.agents/memory/tasks/activation-security.md`. The same trap is reachable again here, and
narrower: the SDK's `createMcpExpressApp` applies protection automatically for loopback
hosts only, and **a container binds `0.0.0.0`**, which is the deployment this transport
exists to enable.

For a server on a routable interface, the exposure is DNS rebinding — a browser on
someone's machine resolving an attacker-controlled name to a local or internal address, and
issuing requests the victim's origin policy would otherwise block. The `Host` allow-list
is the mitigation. Setting it is one environment variable, and the test suite asserts that
it rejects a disallowed `Host` rather than assuming it does.

**Not included, deliberately.** No rate limiting and no TLS termination. Both belong to
whatever sits in front of the process, and each is a decision for whoever deploys this.

**`/healthz` was in that list and is not any more.** This page previously argued for its
absence: *"a probe endpoint on a server that serves only public markdown is a route that
exists to be probed."* That argument was not refuted — it was met with consistency. The
four sibling servers already answer `GET /healthz`, and the reason a probe route is
objectionable here is the reason it is unremarkable there. What it answers is
`{ status, server, version }`, read before any request body, so it exposes nothing the set
does not and cannot be used to enumerate files. A deployment that needs a liveness probe
gets one, and a deployment that does not has not lost anything it had.

**There are no sessions.** The transport this replaced was stateful: it minted a session
that lived as long as the client's stream, and an unauthenticated public port with an
unbounded session map is a memory-growth primitive. `POST /mcp` mints nothing. Each request
carries everything it needs, builds its own `McpServer`, and is closed when its response
closes — so the memory-growth primitive this paragraph used to have a mitigation for is
gone rather than bounded, and the only thing a shutdown counts is what is running right
now. See *Attack surface* above, and the per-request row in it.

## No path is read from a caller

The server holds no function that takes caller-influenced input. The set is read once at boot
from a fixed directory, a tool call is a map lookup, and nothing opens a file a caller named.

- **The guard is structural.** No tool takes a `path`, so a caller has nothing to traverse
  with. There used to be one path-taking read, reached by one tool with a constant path, and
  a check that ran before any filesystem call; both are gone.
- **A test pins it.** Every tool's schema has no properties and no required fields, so a tool
  that grows an argument has to be added deliberately, against that test.

If a future change adds any read keyed on caller input, that is the change to look at first.

## No authentication, on purpose

There is no auth, and adding some would not make the content less public — it is an
instruction set meant to be read by every repository in the organization, and it is also
on npm. The reasoning and its new context are in **The HTTP listener** above.

The consequence is a rule, not a caveat: **nothing confidential goes in `content/`, in
`wiki/`, or anywhere else in this repository.** Treat every file here as world-readable,
because it is — and with an HTTP transport it is world-readable over the network as well
as from npm. If a future change makes any served content non-public, that change needs a
different delivery mechanism rather than a key on this one.

## Secrets

There are none, and that is a property worth keeping. This server reads only five
environment variables, and none of them is a credential:

| Variable | Default | What it is |
|---|---|---|
| `PORT` | `3000` | The port to bind. A number. |
| `HOST` | `0.0.0.0` | The interface to bind. An address. |
| `MCP_ALLOWED_HOSTS` | unset | Hostnames permitted in the `Host` header. **Off when unset.** |
| `MCP_TRANSPORT` | `stdio` | Which transport `src/index.js` speaks. A word. |
| `MCP_CLUSTER_WORKERS` | CPU count | How many HTTP worker processes to fork. A number. |

There is no configuration that could become a credential, which is why the absence of
authentication above is survivable. A future variable that takes a secret changes that, and
the rule at the boundary above is where to stop it.

`.env` and `.env.*` are gitignored (`.env.example` deliberately is not). If this project
ever does need a credential, it does not go in `content/` — see the boundary above.

## Deployment posture

The server can be run two ways, and they have genuinely different exposure.

**stdio** — a client spawns the process and speaks JSON-RPC over a pipe. Exposure is
bounded by who can run the process at all. `npm start` and `npm run start:stdio` are the
same command, named for what it is.

**HTTP** — `npm run start:http` binds a port and serves the same tools, stateless, at
`POST /mcp`, with a `GET /healthz` beside it. Exposure is bounded by who can reach that
port. It is designed to be deployed as a Web Service, and it is not deployed anywhere by
this repository: there is no host, no hostname, and no registry image, and the
documentation says "can be deployed" rather than "is deployed" for that reason.

**A `Dockerfile` exists and can do either.** The image pins the toolchain, installs from
the lockfile with `--ignore-scripts`, and ends as `USER node`. It declares `EXPOSE 3000`
and its default entrypoint is still the stdio server; the HTTP one is a command away:

```bash
docker run --rm -i lxagents-shared-instruction:3.1.0                     # stdio
docker run --rm -p 3000:3000 lxagents-shared-instruction:3.1.0 \
  node src/http.js                                                        # HTTP
```

A container here is both a way to run the server without Node 20 and, with that second
command, a network boundary — so it should now be described as one where it is one, and
the earlier claim that it could not be was true only while stdio was the whole interface.

Three properties of the image are load-bearing and are checked before committing it: the
install runs with lifecycle scripts disabled, the process is not root, and the exposed
port matches the one the server binds. Either of the first two dropped turns a pinned
non-root image into one that runs third-party install hooks as root.

**The image has still never been built.** Docker is not available in the environment these
changes were written in, so the `EXPOSE` and entrypoint changes are unverified by build.
That is recorded here rather than left to be assumed.

## Reporting something

Open an issue on `LXAgents-MCP/shared-instruction`. If the finding is about content that
would direct another repository's agent to do something harmful, say so in the title — it
is the class of bug that reaches furthest fastest, and it is fixed by a release rather
than a patch on one machine.
