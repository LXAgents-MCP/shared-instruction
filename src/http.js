#!/usr/bin/env node
import { allowedHosts, createApp } from "./app.js";
import { SERVER_NAME, VERSION } from "./version.js";

/**
 * The HTTP entry point.
 *
 * **This file, and not `src/index.js`, is what `npm run start:http` and the `Dockerfile`
 * name** — and neither may change, because the documented Docker command is
 * `node src/http.js`. Everywhere else in the organization the cluster and the port live
 * in `src/index.js`; here they live here, and `src/index.js` reaches this file by dynamic
 * import when `MCP_TRANSPORT=http` is set. One extra hop, forced by a file that must not
 * move. The task record under `.agents/memory/tasks/` has the reasoning.
 *
 * The application itself is in `src/app.js`, which builds and returns an express app and
 * does not listen. This file owns the port, the interface, the startup lines, and the
 * drain.
 */

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Where the process says things.
 *
 * stderr, and not stdout. The stdio entry point is the reason: on that transport stdout
 * *is* the JSON-RPC channel, and `src/index.js` now reaches this file to start HTTP, so a
 * process that logs to stdout would be correct on one entry point and a protocol
 * corruption on the other. The rule is easier to hold as one rule than as an exception.
 */
function log(line) {
  process.stderr.write(`${new Date().toISOString()} ${line}\n`);
}

/**
 * Requests currently being answered, and the closers that end them.
 *
 * **This is what replaced the SSE session map, and it is deliberately not the same
 * shape.** The map counted live *sessions* — state a client held open across requests,
 * keyed by an id it was handed, deleted when its stream closed. None of that exists here:
 * each request carries everything it needs, so there is nothing to key and nothing to
 * look up. A `Set` of closers is what a shutdown can actually act on, which is why it
 * replaces the map rather than impersonating it: `inFlight.size` is the drain count, and
 * the entries are how a stuck request is ended rather than waited on forever.
 *
 * @type {Set<() => void>}
 */
const inFlight = new Set();

const server = createApp({ inFlight }).listen(PORT, HOST, () => {
  const where = HOST === "0.0.0.0" ? "all interfaces" : HOST;
  log(`${SERVER_NAME} ${VERSION} serving over http on :${PORT}/mcp (${where})`);

  // Said out loud, because the default is the unguarded one. Someone reading a
  // container's startup log is the only person who can act on it, and a control that is
  // off silently is worse than no control at all — it reads as present.
  if (allowedHosts().length === 0) {
    log(`${SERVER_NAME} ${VERSION} MCP_ALLOWED_HOSTS is unset, so no Host header allow-list is applied.`);
  }
});

let shuttingDown = false;

/**
 * Shutdown, in this order.
 *
 * The listener closes first, so nothing new arrives — a request accepted during the drain
 * gets an answer rather than a refused connection. Then idle keep-alive sockets are
 * closed, because `close()` waits on them and a client that opened one and went quiet
 * would hold the process open indefinitely for a request that no longer exists. Then a
 * short grace period, after which whatever is genuinely still in flight is cut off
 * rather than waited on forever.
 *
 * The count in the drain line is `inFlight.size`, and that is the number the SSE version
 * printed as `sessions.size` with a different word. **There is no session store to drain
 * here** — each request is self-contained, a fresh `McpServer` closed when its response
 * closes — so what drains is the requests. The line changes shape with that, and so does
 * the test that reads it.
 *
 * @param {string} signal
 */
function shutdown(signal) {
  // A second signal means the operator has stopped waiting.
  if (shuttingDown) {
    process.exit(0);
  }
  shuttingDown = true;
  log(`${signal}, draining ${inFlight.size} in-flight request(s)`);

  const forced = setTimeout(() => {
    server.closeAllConnections();
    for (const close of [...inFlight]) close();
  }, 5000);
  forced.unref();

  server.close(() => {
    clearTimeout(forced);
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
