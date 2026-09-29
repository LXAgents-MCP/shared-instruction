# Environment Variables

**Five, and none of them is a secret.** Four configure the HTTP transport; the fifth picks
which transport runs. A client that spawns the server over stdio sets none of them, which
is why that path has nothing to configure.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | The port the HTTP transport binds. |
| `HOST` | `0.0.0.0` | The interface it binds. Loopback-only hosts need no allow-list. |
| `MCP_ALLOWED_HOSTS` | unset | Comma-separated hostnames permitted in the `Host` header. **Off when unset.** |
| `MCP_TRANSPORT` | `stdio` | Which transport `src/index.js` speaks: `stdio`, or `http` (`streamable-http` is accepted too). `http` reaches `src/http.js`, which serves `POST /mcp`. |
| `MCP_CLUSTER_WORKERS` | CPU count | How many HTTP worker processes to fork. **`1` forks nothing.** |

`src/index.js` reads `MCP_TRANSPORT` and nothing else. `src/http.js` reads the other four.

**Why `MCP_CLUSTER_WORKERS` defaults to a count rather than a number.** One process
handling every request leaves the other CPUs idle, so the default is
`os.availableParallelism()` — the number of CPUs the process was actually given. A container
with two CPUs gets two workers and a laptop does not get eight, and neither has to be told.

```bash
MCP_CLUSTER_WORKERS=4 npm run start:http     # four workers
MCP_CLUSTER_WORKERS=1 npm run start:http     # one process, no fork
```

**`1` means no forking at all**, and that is deliberate rather than a degenerate case: the
same code answers with and without workers, so a difference between the two is a difference
in the fork rather than in the transport. It is also what makes the cluster bisectable
against a single-process deployment. A value below `1` is ignored rather than clamped —
`0` means "I did not mean to set this", and running zero workers would bind no port at all.

**Every worker binds the same `PORT`.** The kernel's shared handle and the round-robin
scheduler do the distribution; no `SO_REUSEPORT` is set by hand and no sticky-session
affinity is written, because the scheduler already knows which connection is next. **The
primary binds nothing and writes no startup line of its own**, so a container's log carries
one `serving over http` line per worker, from the processes that genuinely hold the port.

**Why `MCP_ALLOWED_HOSTS` is off by default, and why that is worth knowing.** It is a
DNS-rebinding guard: it stops a browser on someone's machine resolving an attacker's domain
to a local or internal address and issuing requests the victim's origin policy would block.
The previous implementation of this server had the same control and it **defaulted to off**,
which made its allow-lists inert — see `.agents/memory/tasks/activation-security.md`. That
is a real caveat for any public deployment, so the process prints a line at startup when no
allow-list is configured, rather than leaving the absence to be inferred from silence.

Setting it is one variable:

```bash
MCP_ALLOWED_HOSTS=shared-instruction.example.com,localhost npm run start:http
```

## What configures the server instead

| Thing | How it is set |
|---|---|
| Which file to serve | The path to `src/index.js` in the client's server config. |
| The instruction set | `content/` beside the package. Resolved from the module's own location, not from the working directory, so it does not matter where the client was started from. |
| The version reported at `initialize` | `package.json`, read at import. |
| Transport | Which entry point is run: `src/index.js` for stdio, `src/http.js` for HTTP — or `MCP_TRANSPORT=http` on `src/index.js`, which reaches the second one for you. |

## What this page deliberately does not document

Session modes, content-root overrides, and the twelve variables an earlier transport
carried. None of them exists, and this is a second revision of a page that documented them
and then had to un-document them. If a future transport reintroduces one, it comes back
here — but it should not arrive silently.

## Why the content root is resolved from the module

`src/version.js` builds `CONTENT_DIR` from `import.meta.url` rather than from `process.cwd()`.
A client that spawns the server from an arbitrary working directory would otherwise read a
different — or no — instruction set, and the failure would look like an empty connector
rather than a path bug. The HTTP transport is bound by the same rule and resolves its
content root the same way, so serving from a different directory changes nothing. **A forked
worker resolves it once per worker**, which is why the count is CPU count rather than
"one and done": each worker pays the boot cost of reading the set, and that is a deliberate
trade for using the CPUs rather than one.
