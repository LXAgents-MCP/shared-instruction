# Environment Variables

**There are none.** `grep process.env src/` returns no matches: this server reads no
environment variable and is configured entirely by how it is invoked.

That is not an omission to be filled in. Every knob this page used to document belonged to
a streamable-HTTP transport with session modes, worker pools, DNS-rebinding checks and
override environment variables for the content root — none of which the server has. The
page survived their removal.

## What configures the server instead

| Thing | How it is set |
|---|---|
| Which file to serve | The path to `src/index.js` in the client's server config. |
| The instruction set | `content/` beside the package. Resolved from the module's own location, not from the working directory, so it does not matter where the client was started from. |
| The version reported at `initialize` | `package.json`, read at import. |
| Transport | Fixed at stdio. |

## Why the content root is resolved from the module

`src/version.js` builds `CONTENT_DIR` from `import.meta.url` rather than from `process.cwd()`.
A client that spawns the server from an arbitrary working directory would otherwise read a
different — or no — instruction set, and the failure would look like an empty connector
rather than a path bug.
