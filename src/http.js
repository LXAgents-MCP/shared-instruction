#!/usr/bin/env node
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { hostHeaderValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { createServer } from "./server.js";

/**
 * The HTTP transport — the second way to reach this server.
 *
 * `src/index.js` is still the default and still speaks stdio. Nothing here changes what
 * the server serves: `createServer()` is the same factory, and it returns a fresh
 * `McpServer` per call, so each session gets its own. Sharing one across sessions would
 * be a real bug — `McpServer` holds per-connection state — and this file is the reason
 * that rule has a second reader.
 *
 * **SSE, and it is deprecated.** `@modelcontextprotocol/sdk` marks `SSEServerTransport`
 * as deprecated in favour of `StreamableHTTPServerTransport`, and deprecates its own
 * `allowedHosts` and `enableDnsRebindingProtection` options in favour of the
 * `hostHeaderValidation` middleware used below. The transport was specified explicitly
 * and is built as asked; the deprecation is recorded here and in the release log rather
 * than left for the next reader to discover. Moving to Streamable HTTP is a change to
 * this file and this comment.
 */

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Live sessions, keyed by the session id the transport mints.
 *
 * `/sse` and `/message` are not two independent routes. The first opens a stream and
 * mints a session; the transport tells the client to POST to the second with that
 * session id, and the entry here is what routes the message back. An SSE transport is
 * therefore stateful, and this map is the state.
 *
 * It is bounded by connection lifetime rather than by anything else: `res.on("close")`
 * deletes the entry when the stream ends, so a client that opens a stream and
 * disconnects does not leak one. Without that, an unauthenticated public port is a
 * memory-growth primitive.
 *
 * @type {Map<string, SSEServerTransport>}
 */
const sessions = new Map();

/**
 * The `Host` header allow-list, when one is configured.
 *
 * This is the control that used to default to off. The removed implementation shipped
 * `MCP_DNS_REBINDING_PROTECTION` defaulting to `false`, which made its allow-lists inert
 * — see `.agents/memory/tasks/activation-security.md`. The SDK's `createMcpExpressApp`
 * applies the same idea automatically, but only when the host is loopback, and a
 * container binds `0.0.0.0`. So the protection would be off in exactly the deployment
 * this file exists to enable, which is the same trap one level up.
 *
 * `MCP_ALLOWED_HOSTS` (comma-separated) turns it on. Unset means the check is skipped
 * rather than guessed at: a wrong allow-list silently refusing every request is a worse
 * failure than an absent one, and the transport serves public markdown either way. This
 * is stated in the same terms as the rest of the security posture — see
 * `wiki/security/security-model.md`.
 *
 * @returns {string[]}
 */
function allowedHosts() {
  const raw = process.env.MCP_ALLOWED_HOSTS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

const app = express();

const hosts = allowedHosts();
if (hosts.length > 0) {
  app.use(hostHeaderValidation(hosts));
}

app.use(express.json());

/**
 * Open a session. The stream stays open for the life of the connection; the transport
 * sends the endpoint event that tells the client where to POST.
 */
app.get("/sse", async (_req, res) => {
  // The first argument is where the client is told to POST. It is not optional — a
  // transport constructed without it accepts messages it has nowhere to route.
  const transport = new SSEServerTransport("/message", res);
  sessions.set(transport.sessionId, transport);

  // Fires on disconnect as well as on a clean close, which is the case that leaks.
  res.on("close", () => {
    sessions.delete(transport.sessionId);
  });

  await createServer().connect(transport);
});

/**
 * Deliver one message to the session it belongs to.
 *
 * An unknown or expired session id is a 404. It is not a crash and not a new session:
 * silently opening one here would hand a caller a session id it did not negotiate, and
 * crashing would turn a stale client into a denial of service for everyone else.
 */
app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport =
    typeof sessionId === "string" ? sessions.get(sessionId) : undefined;

  if (!transport) {
    res.status(404).json({
      error: "Unknown session",
      detail:
        "This session id is not open. Sessions live only as long as their SSE stream, " +
        "so reconnect to /sse and use the id it returns.",
    });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
});

// Anything else is not a route this server has. A 404 that says so is more useful to a
// client than a bare one, and it is the only place a request is answered with prose.
app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    detail: "This server serves MCP over SSE: GET /sse to open a session, POST /message to send to it.",
  });
});

/**
 * Shutdown.
 *
 * Order matters, and the stdio entry point has no equivalent problem: the listener is
 * closed first so nothing new arrives, then each session is closed so its peer sees a
 * clean end rather than a dropped socket. The removed implementation had this same
 * drain-before-close ordering — see `wiki/logs/0/0/0/CHANGELOG.md`.
 *
 * `stdio` does not get a logger, because on that transport stdout *is* the JSON-RPC
 * channel. This process has no such constraint, which is why logging to stdout here is
 * correct and would be a protocol corruption one file over.
 */
const server = app.listen(PORT, HOST, () => {
  const where = HOST === "0.0.0.0" ? "all interfaces" : HOST;
  process.stdout.write(
    `${new Date().toISOString()} lxagents-shared-instruction listening on http://${HOST}:${PORT} (${where})\n`,
  );
  if (hosts.length === 0) {
    process.stdout.write(
      `${new Date().toISOString()} MCP_ALLOWED_HOSTS is unset, so no Host header allow-list is applied.\n`,
    );
  }
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`${new Date().toISOString()} ${signal}, draining ${sessions.size} session(s)\n`);

  await new Promise((resolve) => server.close(resolve));
  await Promise.allSettled([...sessions.values()].map((t) => t.close()));

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
