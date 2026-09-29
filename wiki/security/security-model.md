# Security Model

The security posture of `LXAgents-MCP/shared-instruction` specifically. It is scoped to
this repository and describes nothing about the repositories that consume the set — each
one keeps its own model, and they are deliberately not merged.

## What this project actually is, in security terms

A read-only publisher. It reads markdown from `content/` once at boot into a frozen map and
serves it over MCP. There is no database, no user accounts, no session data belonging to
anyone, no network listener, and nothing persisted at runtime.

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

Note what makes this worse rather than better: the set is published to npm. Nothing in the
distribution path is a review either.

## Attack surface

| Surface | Exposure | What guards it |
|---|---|---|
| Tool calls | Any caller | **Nothing, and that is the design.** Every tool is read-only and takes no argument. There is no path, no verb, and no target a caller can supply. |
| The one path-taking read | `mcp_list` only | `isSafeRelativePath` in `src/content.js`, before any filesystem call. The single caller passes a constant. Detailed below. |
| Process startup | Anyone who can spawn it | Reads `package.json` and walks `content/`. Malformed content throws and the process exits rather than serving something wrong. |
| Dependency install | Build time | `npm install` runs lifecycle scripts. `npm ci --ignore-scripts` is the safer form for a build you do not control. |
| Publishing | Anyone with npm credentials | Publishing changes what every consumer reads. Treat a release as a security-relevant action, because it is one. |

There is no HTTP endpoint, no session, no request body, and no origin or host allow-list,
because there is no listener. The previous version of this page documented all of those;
none of it survived the transport's removal.

## The one path-taking read

`src/content.js` exports `readSetFile(relativePath)` — the only function in the server that
takes caller-influenced input. It is reached by exactly one caller, `mcp_list`, with the
constant `index/server-registry.md`.

It is worth being precise about what does and does not protect it:

- **The primary guard is structural.** No tool takes a `path`, so a caller has nothing to
  traverse with. That is the reason the old path-taking tool needed a traversal check, and
  the reason this one no longer does.
- **`isSafeRelativePath` remains**, and is correct on its own terms: it rejects absolute
  paths, null bytes, mixed separators, and any `..` segment — **before** any filesystem
  call, not after. A path that reaches `fs` with a `..` in it has already been resolved
  against the process working directory, so a check running afterwards is a check against
  a value the caller already influenced.
- **Containment is re-confirmed** by comparing the resolved path against the set root.

If a future change adds a second caller, this is the function to look at first.

## No authentication, on purpose

There is no auth, and adding some would not make the content less public — it is an
instruction set meant to be read by every repository in the organization, and it is also
on npm.

The consequence is a rule, not a caveat: **nothing confidential goes in `content/`, in
`wiki/`, or anywhere else in this repository.** Treat every file here as world-readable,
because it is. If a future change makes any served content non-public, that change needs
a different delivery mechanism rather than a key on this one.

## Secrets

There are none, and that is a property worth keeping. This server reads **no environment
variable at all** — `grep process.env src/` returns nothing — so there is no configuration
that could become a credential and no allow-list to get wrong.

`.env` and `.env.*` are gitignored (`.env.example` deliberately is not). If this project
ever does need a credential, it does not go in `content/` — see the boundary above.

## Deployment posture

There is no remote deployment, no exposed port, and no service. The server is a stdio
subprocess: a client spawns it and speaks JSON-RPC over a pipe. Its exposure is bounded by
who can read the repository and the npm package.

**A `Dockerfile` exists and does not change that.** The image pins the toolchain, installs
from the lockfile with `--ignore-scripts`, and ends as `USER node` — but it declares no
`EXPOSE` and listens on nothing, because there is no transport that would. Running it is
`docker run -i`; the pipe is still the entire interface. A container here is a way to run
the server somewhere without Node 20, not a network boundary, and it should not be
described as one.

Two properties of the image are load-bearing and are checked before committing it: the
install runs with lifecycle scripts disabled, and the process is not root. Either one
dropped turns a pinned non-root image into one that runs third-party install hooks as
root.

## Reporting something

Open an issue on `LXAgents-MCP/shared-instruction`. If the finding is about content that
would direct another repository's agent to do something harmful, say so in the title — it
is the class of bug that reaches furthest fastest, and it is fixed by a release rather
than a patch on one machine.
