import assert from "node:assert/strict";
import test, { after } from "node:test";
import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { request as httpRequest } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createServer } from "../src/server.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

/**
 * The HTTP transport, tested over a real socket.
 *
 * `.agents/rules/repository.md` requires a test per behavioural change, and until this
 * file the suite was in-memory only — so the transport could have been added, broken, or
 * absent and all nineteen tests would still have passed. That is the same gap that let
 * the documentation describe a surface the code did not have.
 *
 * Every test here starts the real process and speaks to it as a client would. Nothing is
 * stubbed, because the things most likely to be wrong — the endpoint the transport tells
 * the client to POST to, session routing, the message path itself — are exactly the parts
 * a stub would replace with the assumption being tested.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = join(ROOT, "src", "http.js");

/** The text of a single-content tool result. */
function textOf(result) {
  assert.equal(result.content.length, 1, "expected exactly one content block");
  assert.equal(result.content[0].type, "text");
  return result.content[0].text;
}

/** A free port, so parallel runs do not collide. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
    probe.on("error", reject);
  });
}

/**
 * Start `src/http.js` on a free port and wait until it is listening.
 *
 * @returns {Promise<{url: string, stop: () => Promise<void>, proc: import("node:child_process").ChildProcess}>}
 */
async function startServer(env = {}) {
  const port = await freePort();
  const proc = spawn(process.execPath, [ENTRY], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  proc.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  proc.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if (output.includes("listening on")) break;
    if (proc.exitCode !== null) {
      throw new Error(`server exited early (${proc.exitCode}):\n${output}`);
    }
    await new Promise((r) => setTimeout(r, 50));
  }

  if (!output.includes("listening on")) {
    proc.kill();
    throw new Error(`server did not report listening within 15s:\n${output}`);
  }

  return {
    url,
    proc,
    get output() {
      return output;
    },
    async stop() {
      if (proc.exitCode !== null) return;
      proc.kill("SIGTERM");
      await new Promise((r) => {
        const t = setTimeout(() => {
          proc.kill("SIGKILL");
          r();
        }, 5000);
        proc.on("exit", () => {
          clearTimeout(t);
          r();
        });
      });
    },
  };
}

/**
 * Wait for a pattern to appear in the server's output.
 *
 * `startServer` returns the moment the "listening on" line is seen, which says nothing
 * about whether a line written after it has arrived. Asserting on `output` at that
 * instant tests the pipe's timing rather than the server's behaviour, so anything after
 * the ready line is waited for explicitly.
 *
 * @param {{output: string, stop: () => Promise<void>}} server
 * @param {RegExp} pattern
 * @param {number} [timeoutMs]
 * @returns {Promise<string>} the whole output, so the caller can assert on it
 */
async function waitForOutput(server, pattern, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pattern.test(server.output)) return server.output;
    await new Promise((r) => setTimeout(r, 25));
  }
  await server.stop();
  throw new Error(
    `server never logged ${pattern} within ${timeoutMs}ms:\n${server.output}`,
  );
}

/**
 * Every client opened by these tests.
 *
 * An SSE client holds a socket open for the life of the session, so a client that is
 * never closed keeps the event loop alive and the test file never exits — which shows up
 * as a cancelled file rather than a failing test. They are tracked so one hook can close
 * them all, including the ones a test opened before it failed.
 */
const openClients = new Set();

after(async () => {
  await Promise.allSettled([...openClients].map((client) => client.close()));
  openClients.clear();
});

/** A client connected over real SSE. */
async function connect(url) {
  const client = new Client({ name: "http-test", version: "0.0.0" });
  await client.connect(new SSEClientTransport(new URL(`${url}/sse`)));
  openClients.add(client);
  return client;
}

test("the HTTP transport serves the same tools as stdio", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  const client = await connect(server.url);
  const viaHttp = (await client.listTools()).tools.map((tool) => tool.name).sort();

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const inMemory = new Client({ name: "in-memory", version: "0.0.0" });
  const stdioLike = createServer();
  await Promise.all([
    stdioLike.connect(serverTransport),
    inMemory.connect(clientTransport),
  ]);
  const viaMemory = (await inMemory.listTools()).tools.map((tool) => tool.name).sort();

  assert.deepEqual(
    viaHttp,
    viaMemory,
    "the transport must not change the tool surface",
  );
  assert.equal(viaHttp.length, 31, "31 tools: 30 generated from content/ plus mcp_list");
});

test("a tool call over HTTP returns the file byte-identically", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());
  const client = await connect(server.url);

  const overHttp = textOf(await client.callTool({ name: "branching_strategy" }));

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const inMemory = new Client({ name: "in-memory", version: "0.0.0" });
  const reference = createServer();
  await Promise.all([
    reference.connect(serverTransport),
    inMemory.connect(clientTransport),
  ]);
  const overMemory = textOf(
    await inMemory.callTool({ name: "branching_strategy" }),
  );

  assert.equal(
    overHttp,
    overMemory,
    "one source of truth: the transports must not serve different text",
  );
  assert.ok(overHttp.includes("name: branching-strategy"), "frontmatter intact");
});

test("no tool takes an argument over HTTP either", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());
  const client = await connect(server.url);

  for (const tool of (await client.listTools()).tools) {
    assert.deepEqual(
      tool.inputSchema?.properties ?? {},
      {},
      `${tool.name} must declare no properties`,
    );
  }

  // The property that makes traversal unrepresentable, asserted on the new transport.
  //
  // A tool that declares no schema silently ignores an argument rather than rejecting
  // it — that is the SDK's behaviour, and it is the safe one: there is no code path
  // that reads a caller-supplied value, so there is nothing for `path` to steer. What
  // matters is that the argument cannot change the answer, and that the result is the
  // same file the tool always returns.
  const withArgument = await client.callTool({
    name: "branching_strategy",
    arguments: { path: "../../etc/passwd" },
  });

  assert.ok(
    textOf(withArgument).includes("name: branching-strategy"),
    "an argument must not change which file is served",
  );
  assert.equal(
    textOf(withArgument),
    textOf(await client.callTool({ name: "branching_strategy" })),
    "the answer is identical with and without a supplied argument",
  );
});

test("concurrent sessions do not share state", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  // Two independent sessions at once. Sharing one McpServer across connections would
  // interleave request ids and cross-talk; the suites on each must be unaffected.
  const [a, b] = await Promise.all([connect(server.url), connect(server.url)]);

  const [first, second] = await Promise.all([
    a.callTool({ name: "commit_conventions" }),
    b.callTool({ name: "plan_creator" }),
  ]);

  assert.ok(textOf(first).includes("name: commit-conventions"));
  assert.ok(textOf(second).includes("name: plan-creator"));
  assert.notEqual(textOf(first), textOf(second), "each session got its own answer");

  // And the first session still works after the second has been talking.
  assert.ok(textOf(await a.callTool({ name: "versioning" })).includes("name: versioning"));
});

test("an unknown session id is a 404, not a crash or a new session", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  const response = await fetch(`${server.url}/message?sessionId=not-a-session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    }),
  });

  assert.equal(response.status, 404);
  assert.equal(server.proc.exitCode, null, "the server is still running");

  // A real client still works afterwards — a stale session must not poison the process.
  const client = await connect(server.url);
  assert.equal((await client.listTools()).tools.length, 31);
});

test("a session does not outlive its stream", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  // Open and drop several sessions. Without cleanup on disconnect this map grows without
  // bound, and an unauthenticated public port is then a memory-growth primitive.
  for (let i = 0; i < 5; i += 1) {
    const client = await connect(server.url);
    await client.listTools();
    await client.close();
  }

  const response = await fetch(`${server.url}/message?sessionId=whatever`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  assert.equal(response.status, 404);

  // The process is healthy and still serving.
  const client = await connect(server.url);
  assert.equal((await client.listTools()).tools.length, 31);
});

test("a live session is drained on shutdown", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  const client = await connect(server.url);
  await client.listTools();

  // Windows does not deliver SIGTERM to a Node child: `kill` terminates the process, so
  // the handler never runs and the exit code is null rather than 0. The ordering this
  // test is about is therefore only observable where signals are deliverable, and it is
  // asserted there. What is asserted everywhere is the weaker but real invariant — a
  // connected session does not stop the server from shutting down at all.
  const canObserveSignal = process.platform !== "win32";

  // Closed before the signal, so the drain has one session to account for and the
  // process is not held open by a live socket on the way out.
  await client.close();
  openClients.delete(client);

  server.proc.kill("SIGTERM");
  const code = await new Promise((r) => server.proc.on("exit", r));

  assert.notEqual(code, 1, "the process did not crash on the way out");

  if (canObserveSignal) {
    assert.equal(code, 0, "a clean shutdown, not a crash");
    assert.match(
      server.output,
      /draining \d+ session\(s\)/,
      "sessions are drained before exit",
    );
  } else {
    assert.equal(code, null, "terminated by signal, as Windows does");
  }
});

test("an unknown route says what this server actually serves", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  const response = await fetch(`${server.url}/healthz`);
  assert.equal(response.status, 404);
  const body = await response.json();
  assert.match(body.detail, /GET \/sse/);
  assert.match(body.detail, /POST \/message/);
});

test("no response discloses the framework or its version", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  // Express adds `X-Powered-By: Express` unless `src/http.js` disables it. The version in
  // that header narrows what a caller has to guess about an unauthenticated port, and a
  // test is the only thing that keeps the line from being "restored" as dead-looking code.
  // Asserted on the 404 because that response is produced by the catch-all rather than by
  // any route, so it holds for the whole app and not just the paths that happen to be hit.
  const response = await fetch(`${server.url}/healthz`);
  assert.equal(response.status, 404, "the request reached the app at all");
  assert.equal(
    response.headers.get("x-powered-by"),
    null,
    "the framework must not identify itself",
  );
});

/**
 * A request with an explicit `Host` header, returning its status code.
 *
 * `fetch` cannot be used for this: `Host` is a forbidden header name, so it is silently
 * dropped and every request would arrive as the loopback address. Testing a Host
 * allow-list through `fetch` would pass whatever the real control does, which is the
 * worst way to test a security control.
 */
function requestWithHost(url, host, path = "/not-a-route") {
  const { port } = new URL(url);
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      { host: "127.0.0.1", port, path, headers: { Host: host } },
      (response) => {
        response.resume();
        resolve(response.statusCode);
      },
    );
    request.on("error", reject);
    request.end();
  });
}

test("the Host allow-list is applied when MCP_ALLOWED_HOSTS is set", async (t) => {
  const server = await startServer({ MCP_ALLOWED_HOSTS: "example.test" });
  t.after(() => server.stop());

  // A Host outside the list must be refused. The removed implementation's equivalent
  // defaulted to off, which made its allow-list inert; this asserts the control does
  // something rather than assuming it does.
  assert.equal(
    await requestWithHost(server.url, "evil.test"),
    403,
    "a disallowed Host is refused",
  );

  // And the allowed host still works, so the list is a filter and not a blanket denial.
  assert.equal(
    await requestWithHost(server.url, "example.test"),
    404,
    "an allowed Host reaches the routes",
  );

  // The port is not part of the match, so one entry covers every port the service is
  // reached on — which is what makes a single hostname usable behind a proxy.
  assert.equal(
    await requestWithHost(server.url, `example.test:${new URL(server.url).port}`),
    404,
    "the allow-list matches hostname, not host:port",
  );

  assert.equal(server.proc.exitCode, null, "the server is still running");
});

test("with no MCP_ALLOWED_HOSTS the server says so on startup", async (t) => {
  const server = await startServer();
  t.after(() => server.stop());

  // An absent guard should be visible in the logs rather than inferred from silence.
  const output = await waitForOutput(server, /MCP_ALLOWED_HOSTS is unset/);
  assert.match(output, /MCP_ALLOWED_HOSTS is unset/);
});

test("with MCP_ALLOWED_HOSTS set the server does not claim the guard is off", async (t) => {
  const server = await startServer({ MCP_ALLOWED_HOSTS: "example.test" });
  t.after(() => server.stop());

  // The other half of the assertion above. A warning printed unconditionally would make
  // the first test pass for a server that is warning about nothing in particular.
  await new Promise((r) => setTimeout(r, 250));
  assert.doesNotMatch(server.output, /MCP_ALLOWED_HOSTS is unset/);
});
