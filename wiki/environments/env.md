# Environment Variables

**Four, and none of them is a secret.** Three configure the HTTP transport; the fourth
picks which transport runs. A client that spawns the server over stdio sets none of them,
which is why that path has nothing to configure.

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | The port the HTTP transport binds. |
| `HOST` | `0.0.0.0` | The interface it binds. Loopback-only hosts need no allow-list. |
| `MCP_ALLOWED_HOSTS` | unset | Comma-separated hostnames permitted in the `Host` header. **Off when unset.** |
| `MCP_TRANSPORT` | `stdio` | Which transport `src/index.js` speaks: `stdio`, or `http` (`streamable-http` is accepted too). `http` reaches `src/http.js`, which serves `POST /mcp`. |

`src/index.js` reads `MCP_TRANSPORT` and nothing else. `src/http.js` reads the other three.

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

Session modes, worker pools, content-root overrides, and the twelve variables an earlier
transport carried. None of them exists, and this is a second revision of a page that
documented them and then had to un-document them. If a future transport reintroduces one,
it comes back here — but it should not arrive silently.

## Why the content root is resolved from the module

`src/version.js` builds `CONTENT_DIR` from `import.meta.url` rather than from `process.cwd()`.
A client that spawns the server from an arbitrary working directory would otherwise read a
different — or no — instruction set, and the failure would look like an empty connector
rather than a path bug. The HTTP transport is bound by the same rule and resolves its
content root the same way, so serving from a different directory changes nothing.
