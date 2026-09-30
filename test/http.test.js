import assert from "node:assert/strict";
import test, { after } from "node:test";
import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { request as httpRequest } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { BODY_LIMIT_BYTES } from "../src/app.js";
import { createServer } from "../src/server.js";
import { SERVER_NAME } from "../src/version.js";

/**
 * The HTTP transport, tested over a real socket.
 *
 * `test/server.test.js` exercises the server in memory: same code, no listener. What that
 * cannot reach is the part that only exists when there is a socket — the route table, the
 * transport's own framing, the host it binds, the shape of its errors, and what a shutdown
 * does to a request that is still in flight. This file is that half, and it starts the real
 * entry point as a real child process rather than importing it, because an imported module
 * cannot be given a second port or stopped.
 *
 * It is a rewrite rather than an edit. Every test that opened an SSE stream, minted a
 * session id, or asserted on the session store died with the transport it was testing, and
 * a test edited into shape tests the new code with the old code's assumptions.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The two entry points, named rather than assumed.
 *
 * `src/http.js` is what `npm run start:http` and the `Dockerfile` run, and most of this
 * file drives it. `src/index.js` is what a client spawns, and the delegation to
 * `src/http.js` on `MCP_TRANSPORT=http` is a separate behaviour with its own test — a
 * change that made `npm run start:http` work and `MCP_TRANSPORT=http` fail would be the
 * kind of near miss that reads as a working server.
 */
const ENTRY_HTTP = join(ROOT, "src", "http.js");
const ENTRY_INDEX = join(ROOT, "src", "index.js");

/**
 * How long to wait for the startup line.
 *
 * A deadline rather than a sleep, so the common case costs nothing: the server is up in well
 * under a second on a normal filesystem. It is generous because a checkout on a network or
 * 9p mount can take several seconds just to load the SDK, and a deadline that is too short
 * fails a working server for an environmental reason.
 */
const READY_TIMEOUT_MS = 30_000;

/** The text of a single-content tool result. */
function textOf(result) {
  assert.notEqual(result.isError, true, "expected a successful result");
  assert.equal(result.content.length, 1, "expected exactly one content block");
  return result.content[0].text;
}

/** A free port, so parallel runs do not collide. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/** Every child started by this file, so a failed assertion cannot leak one. */
const openServers = new Set();

after(() => {
  for (const child of openServers) child.kill("SIGKILL");
});

/**
 * Start a server and wait until it is listening.
 *
 * Both streams are captured, because the startup line is on stderr and stdout must stay
 * empty on a server process — a line on stdout would be a defect worth failing on, and one
 * that only shows up when someone switches back to stdio.
 *
 * @param {{ entry?: string, env?: Record<string, string> }} [options]
 * @returns {Promise<{child: import("node:child_process").ChildProcess, port: number,
 *   url: string, proc: import("node:child_process").ChildProcess,
 *   output: () => string, stdout: () => string, stderr: () => string,
 *   countOutput: (needle: string) => number, waitForOutput: (needle: string, ms?: number) => Promise<boolean>}>}
 */
async function startServer({ entry = ENTRY_HTTP, env = {} } = {}) {
  const port = await freePort();

  const child = spawn(process.execPath, [entry], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PORT: String(port),
      // Bound to loopback on purpose: this file must never open a port on every interface
      // of whatever machine runs the suite.
      HOST: "127.0.0.1",
      ...env,
    },
  });

  openServers.add(child);
  child.on("exit", () => openServers.delete(child));

  let captured = "";
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    captured += chunk;
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    captured += chunk;
    stderr += chunk;
  });

  /** Everything the process has written, on either stream. */
  const output = () => captured;

  /**
   * How many times `needle` has appeared so far.
   *
   * Not a boolean: with more than one worker the line is printed once per worker, and "the
   * line appeared" cannot tell one process from two.
   */
  const countOutput = (needle) => captured.split(needle).length - 1;

  /** Resolve true once `needle` has appeared, false if `ms` runs out first. */
  const waitForOutput = (needle, ms = READY_TIMEOUT_MS) =>
    new Promise((resolveWait) => {
      if (captured.includes(needle)) {
        resolveWait(true);
        return;
      }
      const deadline = Date.now() + ms;
      const poll = setInterval(() => {
        if (captured.includes(needle)) {
          clearInterval(poll);
          resolveWait(true);
        } else if (Date.now() > deadline) {
          clearInterval(poll);
          resolveWait(false);
        }
      }, 50);
    });

  const exited = new Promise((resolveExit) => {
    child.once("exit", (code, signal) => resolveExit({ code, signal }));
  });

  // Either the startup line arrives, or the process dies trying — whichever comes first.
  // A server that exited quietly is a failure to report with its own output attached, not
  // a server to test against.
  const ready = await Promise.race([
    waitForOutput("serving over http").then((ok) => ({ ok })),
    exited.then((exit) => ({ exit })),
  ]);

  if (ready.exit || !ready.ok) {
    const how = ready.exit
      ? `it exited with code ${ready.exit.code} and signal ${ready.exit.signal}`
      : `it printed no startup line within ${READY_TIMEOUT_MS}ms`;
    throw new Error(`the server never came up: ${how}.\n--- output ---\n${captured}`);
  }

  return {
    child,
    proc: child,
    port,
    url: `http://127.0.0.1:${port}`,
    output,
    countOutput,
    stdout: () => stdout,
    stderr: () => stderr,
    waitForOutput,
  };
}

/**
 * Start a server, hand it to `run`, and stop it afterwards whether or not `run` throws.
 *
 * @param {object} options
 * @param {(server: Awaited<ReturnType<typeof startServer>>) => Promise<void>} run
 */
async function withServer(options, run) {
  const server = await startServer(options);
  try {
    return await run(server);
  } finally {
    server.child.kill("SIGKILL");
  }
}

/** Connect an MCP client to a running server over a real socket. */
async function connect(url) {
  const client = new Client({ name: "http-test", version: "0.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${url}/mcp`)));
  return client;
}

/**
 * Every client opened by these tests.
 *
 * A Streamable HTTP client can hold a socket open, and a client that is never closed keeps
 * the test file's event loop alive — which shows up as a cancelled file rather than a
 * failing test. Tracked so one hook can close them all, including one a test opened before
 * it failed.
 */
const openClients = new Set();

after(async () => {
  await Promise.allSettled([...openClients].map((client) => client.close()));
  openClients.clear();
});

/** An in-memory client, the reference the socket client is compared against. */
async function inMemoryClient() {
  const server = createServer();
  const client = new Client({ name: "in-memory-test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

test("the health check answers without a session", async () => {
  await withServer({}, async ({ url }) => {
    const response = await fetch(`${url}/healthz`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
    assert.equal(body.server, SERVER_NAME);
    assert.match(body.version, /^\d+\.\d+\.\d+/);
  });
});

test("the startup line names the interface it bound", async () => {
  await withServer({}, async ({ output }) => {
    // The harness binds loopback, so the line has to say loopback. It is the only place the
    // process reports what it actually bound rather than what it was asked to bind, and a
    // container operator reads it first.
    assert.match(output(), /serving over http on :\d+\/mcp \(127\.0\.0\.1\)/);
  });
});

test("a server process writes nothing to stdout", async () => {
  // The rule is repository-wide and used to have an exception: the old HTTP entry point
  // logged its startup line to stdout, which was correct while nothing reached it through
  // `src/index.js`. That exception is gone — the HTTP transport is now reachable from the
  // stdio entry point too, so a process that logs to stdout would be a protocol corruption
  // one line away. Asserted here because it is cheap and a log line drifting onto stdout is
  // a bug that only shows up when someone switches transports.
  await withServer({}, async ({ url, stdout, stderr }) => {
    const client = await connect(url);
    openClients.add(client);

    try {
      await client.listTools();
      textOf(await client.callTool({ name: "branching_strategy", arguments: {} }));
    } finally {
      await client.close();
      openClients.delete(client);
    }

    assert.equal(stdout(), "", `stdout must stay empty, got: ${stdout()}`);
    assert.ok(stderr().length > 0, "the startup line went to stderr");
  });
});

test("the HTTP transport serves the same tools as stdio", async () => {
  await withServer({}, async ({ url }) => {
    const http = await connect(url);
    openClients.add(http);
    const memory = await inMemoryClient();

    try {
      const viaHttp = (await http.listTools()).tools;
      const inMemory = (await memory.client.listTools()).tools;

      assert.equal(viaHttp.length, 31, "30 generated from content/ plus mcp_list");
      assert.deepEqual(
        viaHttp.map((tool) => tool.name).sort(),
        inMemory.map((tool) => tool.name).sort()
      );
      assert.deepEqual(
        viaHttp.map((tool) => tool.description).sort(),
        inMemory.map((tool) => tool.description).sort()
      );
    } finally {
      await http.close();
      openClients.delete(http);
      await memory.close();
    }
  });
});

test("no tool advertises an argument over HTTP either", async () => {
  // The read-only claim does not depend on the transport. Over stdio a tool takes no
  // argument; over HTTP it must take none either, or a deployment would have a second door
  // onto whatever a socket opens that a pipe does not.
  await withServer({}, async ({ url }) => {
    const client = await connect(url);
    openClients.add(client);

    try {
      const { tools } = await client.listTools();

      for (const tool of tools) {
        assert.deepEqual(
          tool.inputSchema.properties ?? {},
          {},
          `${tool.name} must take no argument over HTTP`
        );
        assert.deepEqual(tool.inputSchema.required ?? [], []);
      }

      // The property that makes traversal unrepresentable, asserted against the *new*
      // transport rather than the one it replaced: an argument is silently ignored rather
      // than rejected, so what matters is that it cannot change the answer.
      const withArgument = await client.callTool({
        name: "branching_strategy",
        arguments: { path: "../../etc/passwd" },
      });
      assert.equal(
        textOf(withArgument),
        textOf(await client.callTool({ name: "branching_strategy", arguments: {} })),
        "an argument must not change which file is served"
      );
    } finally {
      await client.close();
      openClients.delete(client);
    }
  });
});

test("a tool call over HTTP returns the file byte-identically", async () => {
  await withServer({}, async ({ url }) => {
    const client = await connect(url);
    openClients.add(client);
    const memory = await inMemoryClient();

    try {
      const overHttp = textOf(
        await client.callTool({ name: "branching_strategy", arguments: {} })
      );
      const overMemory = textOf(
        await memory.client.callTool({ name: "branching_strategy", arguments: {} })
      );

      assert.equal(
        overHttp,
        overMemory,
        "one source of truth: the transports must not serve different text"
      );
      assert.match(overHttp, /^---\r?\n/, "frontmatter is part of the served text");
      assert.ok(overHttp.includes("name: branching-strategy"), "frontmatter intact");
    } finally {
      await client.close();
      openClients.delete(client);
      await memory.close();
    }
  });
});

test("an unknown route says what this server does not serve", async () => {
  await withServer({}, async ({ url }) => {
    const response = await fetch(`${url}/nope`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.jsonrpc, "2.0");
    assert.equal(body.error.code, -32601);
    assert.match(body.error.message, /Not found: \/nope/);

    // The old catch-all ended by pointing the caller at the two routes this transport
    // replaces. Asserted absent rather than merely unreviewed, because a 404 that sends a
    // caller to two routes that no longer exist is worse than a bare one.
    assert.doesNotMatch(JSON.stringify(body), /sse/i);
  });
});

test("GET /mcp is refused rather than served", async () => {
  await withServer({}, async ({ url }) => {
    const response = await fetch(`${url}/mcp`);
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(body.error.code, -32000);
    assert.match(body.error.message, /stateless mode/);
  });
});

test("the routes the SSE transport used are gone", async () => {
  // Asserted rather than assumed. A route left behind from the transport this replaces is
  // the failure that looks like a working server: it would still answer, with a protocol
  // whose client side no longer exists, and the symptom would be a deploy that looks
  // healthy right up until a client tries to connect.
  await withServer({}, async ({ url }) => {
    for (const path of ["/sse", "/message"]) {
      const response = await fetch(`${url}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });

      assert.equal(response.status, 404, `${path} must not be served`);
      assert.equal((await response.json()).error.code, -32601);
    }
  });
});

test("concurrent requests do not share state", async () => {
  await withServer({}, async ({ url }) => {
    const tools = ["commit_conventions", "plan_creator", "versioning"];

    // The transport builds a fresh McpServer per request, so three clients answering three
    // different files at once is the assertion that matters. Interleaved calls on one client
    // would pass against a shared server too.
    const clients = await Promise.all([connect(url), connect(url), connect(url)]);
    openClients.add(clients[0]);
    openClients.add(clients[1]);
    openClients.add(clients[2]);

    try {
      const results = await Promise.all(
        clients.map((client, i) => client.callTool({ name: tools[i], arguments: {} }))
      );

      for (const [i, result] of results.entries()) {
        // Tool names are derived from filenames by replacing hyphens with underscores, so the
        // served text carries the hyphenated form. This distinguishes "answered with the right
        // file" from "answered with some file".
        assert.ok(
          textOf(result).includes(`name: ${tools[i].replace(/_/g, "-")}`),
          `${tools[i]} was answered with another request's file`
        );
      }

      // The first client still works after the other two have been talking.
      assert.ok(
        textOf(await clients[0].callTool({ name: "commit_conventions", arguments: {} }))
          .includes("name: commit-conventions")
      );
    } finally {
      await Promise.all(clients.map((client) => client.close()));
      for (const client of clients) openClients.delete(client);
    }
  });
});

test(
  "a shutdown drains and stops accepting, rather than dropping a listener",
  // Windows has no signal delivery: child.kill() terminates the process outright, so a
  // handler cannot be observed there at all. The assertion is about the shutdown path, and
  // pretending it passed on a platform that never ran it would be worse than skipping it.
  { skip: process.platform === "win32" ? "no signal delivery on Windows" : false },
  async () => {
    await withServer({}, async ({ child, url, output }) => {
      const exited = new Promise((resolveExit) =>
        child.once("exit", (code, signal) => resolveExit({ code, signal }))
      );
      child.kill("SIGINT");

      const { code, signal } = await exited;

      // A handled SIGINT ends in `process.exit(0)`, so the process is gone by its own
      // decision. An unhandled one would report the signal instead, with code null.
      assert.equal(code, 0, `the handler did not run: signal ${signal}`);
      // The count is in-flight *requests*, not sessions. There is no session store left to
      // drain, and a line still reading `session(s)` would describe a transport that is gone.
      assert.match(output(), /SIGINT, draining \d+ in-flight request\(s\)/);

      // And it really is closed: a request after the drain is refused, not queued.
      await assert.rejects(fetch(`${url}/healthz`), "the port is no longer served");
    });
  }
);

/* -------------------------------------------------------------------------- *
 * The `Host` allow-list.
 * -------------------------------------------------------------------------- */

/**
 * A request with a `Host` header of our choosing.
 *
 * `fetch` cannot do this. `Host` is a forbidden header name in the fetch spec, and a client
 * that silently drops it sends the loopback name every time — so a test written with `fetch`
 * would exercise the allow-list and conclude whatever the real control does, which is the
 * worst way to test a security control.
 *
 * @param {{url: string, host: string, path?: string}} options
 * @returns {Promise<{status: number, body: string}>}
 */
function requestWithHost({ url, host, path = "/healthz" }) {
  const target = new URL(path, url);

  return new Promise((resolveRequest, rejectRequest) => {
    const req = httpRequest(
      {
        host: target.hostname,
        port: target.port,
        path: target.pathname,
        method: "GET",
        headers: { Host: host },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolveRequest({ status: res.statusCode, body }));
      }
    );

    req.on("error", rejectRequest);
    req.end();
  });
}

test("with no allow-list set, nothing is refused", async () => {
  await withServer({}, async ({ url }) => {
    // The default, and the one the plan calls the safe-looking-unsafe one. It is asserted
    // explicitly so that a future change to refuse-by-default has to contradict a test
    // rather than pass quietly.
    for (const host of ["example.test", "evil.test", "127.0.0.1"]) {
      const { status } = await requestWithHost({ url, host });
      assert.equal(status, 200, `${host} must be served when no allow-list is set`);
    }
  });
});

test("the startup line announces that no allow-list is applied", async () => {
  await withServer({}, async ({ output }) => {
    assert.match(output(), /MCP_ALLOWED_HOSTS is unset, so no Host header allow-list is applied/);
  });
});

test("the allow-list is applied when MCP_ALLOWED_HOSTS is set", async () => {
  const allowed = "shared-instruction.example.test, other.example.test";

  await withServer({ env: { MCP_ALLOWED_HOSTS: allowed } }, async ({ url, port, proc }) => {
    assert.equal(
      (await requestWithHost({ url, host: "shared-instruction.example.test" })).status,
      200
    );
    assert.equal(
      (await requestWithHost({ url, host: "other.example.test" })).status,
      200
    );

    // The refusal, and its shape: a 403 carrying a JSON-RPC error, not a 404 and not a
    // dropped connection.
    const refused = await requestWithHost({ url, host: "evil.test" });
    assert.equal(refused.status, 403);
    assert.match(JSON.parse(refused.body).error.message, /Invalid Host: evil\.test/);

    // The port is not part of the match. A client that reaches the server through a proxy
    // sends `host:port`, and an allow-list that matched the whole header would refuse it
    // while looking correct in a test that used the bare name.
    assert.equal(
      (await requestWithHost({ url, host: `shared-instruction.example.test:${port}` })).status,
      200
    );

    assert.equal(proc.exitCode, null, "the server is still running");
  });
});

test("the allow-list guards the health check too", async () => {
  // Otherwise a deployment could watch its own server through /healthz while every real
  // caller was refused — a green check on a service nothing can reach.
  await withServer(
    { env: { MCP_ALLOWED_HOSTS: "shared-instruction.example.test" } },
    async ({ url }) => {
      assert.equal((await requestWithHost({ url, host: "evil.test" })).status, 403);
      assert.equal(
        (await requestWithHost({ url, host: "shared-instruction.example.test" })).status,
        200
      );
    }
  );
});

test("setting MCP_ALLOWED_HOSTS silences the warning, so neither can pass by accident", async () => {
  await withServer(
    { env: { MCP_ALLOWED_HOSTS: "shared-instruction.example.test" } },
    async ({ output }) => {
      assert.doesNotMatch(output(), /MCP_ALLOWED_HOSTS is unset/);
      assert.doesNotMatch(output(), /no Host header allow-list is applied/);
    }
  );
});

test("an allow-list of nothing but separators still counts as unset", async () => {
  // `MCP_ALLOWED_HOSTS=` is a shell that lost the value, and `MCP_ALLOWED_HOSTS= , ,` is a
  // paste that did. Treating either as "allow nothing" would refuse every request with a
  // message that names no host at all.
  await withServer({ env: { MCP_ALLOWED_HOSTS: " , , " } }, async ({ url, output }) => {
    assert.equal((await requestWithHost({ url, host: "anything.test" })).status, 200);
    assert.match(output(), /MCP_ALLOWED_HOSTS is unset/);
  });
});

/* -------------------------------------------------------------------------- *
 * The body limit.
 * -------------------------------------------------------------------------- */

test("the body limit is the 4 MB it is declared to be", () => {
  // Pinned as a number, not just as a relation to whatever the constant now says. A limit
  // that quietly became 64 MB would keep every boundary test in this file passing, and the
  // number is a documented property of the transport rather than an implementation detail.
  assert.equal(BODY_LIMIT_BYTES, 4 * 1024 * 1024);
});

test("a body over the limit is refused, and says so in the JSON-RPC envelope", async () => {
  await withServer({}, async ({ url }) => {
    // Valid JSON, valid MCP, simply too large: the only thing wrong with it is its size, so
    // a refusal here is the limit and not a parse failure.
    const oversized = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "branching_strategy",
        arguments: {},
        padding: "x".repeat(BODY_LIMIT_BYTES),
      },
    });
    assert.ok(oversized.length > BODY_LIMIT_BYTES, "the payload must actually exceed the limit");

    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: oversized,
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.jsonrpc, "2.0");
    assert.equal(body.error.code, -32700);
  });
});

test("malformed JSON is refused with exactly the same answer as a body that is too large", async () => {
  // One answer for two causes. A client that sent something unreadable gets the same status
  // and the same code whichever way it was wrong, and splitting them would be a behaviour
  // change nobody asked for.
  await withServer({}, async ({ url }) => {
    const response = await fetch(`${url}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ this is not json",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, -32700);
    assert.equal(body.error.message, "Parse error: request body is not valid JSON");
  });
});

test("no response advertises that the server is running express", async () => {
  await withServer({}, async ({ url }) => {
    // Checked on a served route, on the catch-all, and on the 405, because those three are
    // produced by different places in the stack and could plausibly have taken different
    // paths through it. `X-Powered-By` hands an unauthenticated caller the framework and
    // its version, which is a free upgrade suggestion.
    const health = await fetch(`${url}/healthz`);
    const missing = await fetch(`${url}/nope`);
    const refused = await fetch(`${url}/mcp`);

    for (const response of [health, missing, refused]) {
      assert.equal(
        response.headers.get("x-powered-by"),
        null,
        `X-Powered-By leaked on ${response.url}`
      );
    }
  });
});

/* -------------------------------------------------------------------------- *
 * The two entry points.
 * -------------------------------------------------------------------------- */

test("MCP_TRANSPORT=http reaches the same server through src/index.js", async () => {
  // The delegation is a separate behaviour from the server. `package.json`'s `start:http`
  // and the `Dockerfile` both name `src/http.js` and neither may change, so the transport
  // selection lives in `src/index.js` and reaches the entry point by dynamic import. If
  // that hop broke, `npm run start:http` would keep working and every client configured
  // with `MCP_TRANSPORT=http` would silently fall back to stdio.
  await withServer(
    { entry: ENTRY_INDEX, env: { MCP_TRANSPORT: "http" } },
    async ({ url, stdout, output }) => {
      assert.match(output(), /serving over http on :\d+\/mcp/);

      const client = await connect(url);
      openClients.add(client);
      try {
        assert.equal((await client.listTools()).tools.length, 31);
      } finally {
        await client.close();
        openClients.delete(client);
      }

      // And nothing leaked onto stdout on the way through, which is the whole reason the
      // import is dynamic.
      assert.equal(stdout(), "", `stdout must stay empty, got: ${stdout()}`);
    }
  );
});

test("node src/index.js still speaks stdio and writes nothing to stdout", async () => {
  // Not driven through `startServer`, which waits for an HTTP startup line that stdio never
  // prints. Driven through the SDK's own stdio client instead, so this is the real entry
  // point over a real pipe — the assertion is that the tool list comes back intact, not that
  // a log happens to be quiet.
  const client = new Client({ name: "stdio-test", version: "0.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["src/index.js"],
    cwd: ROOT,
    env: { ...process.env, MCP_TRANSPORT: "stdio" },
    stderr: "pipe",
  });

  let stdout = "";
  transport.stdout?.on("data", (chunk) => {
    stdout += chunk;
  });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    assert.equal(tools.length, 31, "30 generated from content/ plus mcp_list");
    assert.ok(textOf(await client.callTool({ name: "plan_creator", arguments: {} })).length > 0);

    assert.equal(stdout, "", `stdout must stay empty, got: ${stdout}`);
  } finally {
    await client.close();
  }
});
