import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CONTENT_DIR } from "../src/version.js";
import { TOOL_FILES } from "../src/tools/from-content.js";
import { TOOL_MODULES, createServer } from "../src/server.js";

/** A client connected to a fresh server over an in-memory pipe. */
async function connect() {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  const server = createServer();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

/** The text of a single-content tool result. */
function textOf(result) {
  assert.equal(result.content.length, 1, "expected exactly one content block");
  assert.equal(result.content[0].type, "text");
  return result.content[0].text;
}

/** Every markdown file in the served set, as [path-relative-to-content, absolute]. */
async function markdownFiles(dir = CONTENT_DIR) {
  const found = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await markdownFiles(full)));
    else if (entry.name.endsWith(".md")) {
      found.push([relative(CONTENT_DIR, full).split(sep).join("/"), full]);
    }
  }

  return found.sort(([a], [b]) => a.localeCompare(b));
}

// The set's own conventions, before the tool surface is tested at all.

test("every served file declares the four-field frontmatter", async () => {
  // name, description, version, author. `version` is the only record of what
  // changed in a file — there is no upgrade step, so without it a stale file
  // looks identical to a fresh one, and a consumer cannot tell them apart.
  // `description` is load-bearing a second way: it is the tool description, so a
  // file without one is a tool a client cannot route on.
  for (const [path, full] of await markdownFiles()) {
    const text = await readFile(full, "utf8");
    const block = text.match(/^---\s*\n(.*?)\n---/s);

    assert.ok(block, `${path} has no frontmatter`);
    for (const field of ["name", "description", "version", "author"]) {
      assert.match(
        block[1],
        new RegExp(`^${field}:\\s*\\S`, "m"),
        `${path} is missing \`${field}:\` in its frontmatter`,
      );
    }
  }
});

test("every creator carries the shared procedure", async () => {
  // The procedure is duplicated across the folder by design, so it can drift
  // with nothing to catch it. plan-creator.md shipped without it; this test is
  // what stops the next one from doing the same.
  const creators = (await markdownFiles()).filter(([path]) =>
    path.startsWith("creators/"),
  );

  assert.ok(creators.length >= 7, `expected the full creator set, found ${creators.length}`);

  // Split on headings rather than matching one: a checkout on Windows serves
  // CRLF, and a `^## ` lookahead does not match "\r\n## ".
  const section = (text) => {
    const parts = text.replace(/\r\n/g, "\n").split(/^## /m);
    return parts.find((p) => p.startsWith("Branch & Commit Convention\n")) ?? null;
  };

  const reference = section(
    await readFile(join(CONTENT_DIR, "creators/memory-creator.md"), "utf8"),
  );
  assert.ok(reference, "memory-creator.md must carry the procedure");

  for (const [path, full] of creators) {
    const text = await readFile(full, "utf8");
    assert.ok(
      section(text),
      `${path} is a creator and must carry the shared procedure`,
    );
    assert.equal(
      section(text).replace(/\r\n/g, "\n"),
      reference.replace(/\r\n/g, "\n"),
      `${path} has drifted from the shared procedure in memory-creator.md`,
    );
  }
});

// The tool surface. One file, one tool, and no argument anywhere.

test("the tool list and the files on disk are a bijection", async () => {
  // Both directions, because each catches a different mistake. Files-to-tools
  // catches a file that was added and never surfaced; tools-to-files catches a
  // tool serving something that is no longer in the set. Together they are what
  // makes "add a file, get a tool" a property rather than a hope.
  const files = (await markdownFiles()).map(([path]) => path);
  const served = [...TOOL_FILES.values()].sort((a, b) => a.localeCompare(b));

  assert.deepEqual(served, files);

  assert.equal(
    TOOL_FILES.size,
    files.length,
    "two files must not derive the same tool name",
  );
  assert.ok(files.length > 20, `expected a real set, found ${files.length} files`);
});

test("every tool name is derived from its own filename", () => {
  // The derivation is the design: a file's name is what a caller reads in the
  // tool list, so it has to survive the trip. Folder stripped, `.md` dropped,
  // kebab to snake. AGENTS.md is the one documented exception.
  for (const [name, path] of TOOL_FILES) {
    if (path === "AGENTS.md") {
      assert.equal(name, "agents_entry_point", "the entry point override must hold");
      continue;
    }

    const expected = path
      .split("/")
      .pop()
      .replace(/\.md$/, "")
      .toLowerCase()
      .replace(/-/g, "_");

    assert.equal(name, expected, `${path} derives ${name}, expected ${expected}`);
    assert.match(name, /^[a-z][a-z0-9_]{0,63}$/, `${name} is not a usable tool name`);
  }
});

test("every tool has a distinct name and a description to route on", () => {
  const names = TOOL_MODULES.map(({ config }) => config.name);
  assert.equal(new Set(names).size, names.length, "tool names must be unique");

  for (const { config } of TOOL_MODULES) {
    assert.ok(
      config.description && config.description.length > 0,
      `${config.name} needs a description`,
    );
  }
});

test("no tool takes an argument", async () => {
  // The structural claim, and the replacement for the traversal defence that the
  // old path-taking tool needed. With no argument there is nothing to traverse
  // with, so this is not a weaker version of the old check — it is the check.
  const { client } = await connect();
  const { tools } = await client.listTools();

  for (const tool of tools) {
    assert.deepEqual(
      tool.inputSchema.properties ?? {},
      {},
      `${tool.name} must take no argument`,
    );
    assert.deepEqual(
      tool.inputSchema.required ?? [],
      [],
      `${tool.name} must require nothing`,
    );
  }
});

test("every tool returns its own file, whole and with frontmatter", async () => {
  const { client } = await connect();

  for (const [name, path] of TOOL_FILES) {
    const text = textOf(await client.callTool({ name, arguments: {} }));
    const onDisk = await readFile(join(CONTENT_DIR, path), "utf8");

    assert.equal(text, onDisk, `${name} must serve ${path} byte for byte`);

    // \r? because a checkout on Windows serves CRLF, and the bytes are served as
    // they are on disk.
    assert.match(text, /^---\r?\n/, `${name} must serve the frontmatter`);
    assert.ok(text.includes("name:"), `${name} must not strip the frontmatter`);
  }
});

test("the whole set is served and nothing is served twice", async () => {
  // Served twice would mean a file the set holds but a caller cannot reach by
  // name; served short would mean a file silently dropped from the surface.
  const { client } = await connect();

  let total = 0;
  for (const [name] of TOOL_FILES) {
    total += textOf(await client.callTool({ name, arguments: {} })).length;
  }

  let onDisk = 0;
  for (const [, full] of await markdownFiles()) {
    onDisk += (await readFile(full, "utf8")).length;
  }

  assert.equal(total, onDisk, "the tools must serve exactly the files on disk");
});

test("the whole set is reachable by tool name", async () => {
  // A file in content/ that nothing routes to is the failure that prompted the
  // router work, so reachability is asserted per file rather than assumed.
  // The name comes from the map, not from re-deriving it here: a test that
  // repeats the derivation cannot catch a mistake in the derivation.
  const { client } = await connect();
  const { tools } = await client.listTools();
  const names = new Set(tools.map((tool) => tool.name));
  const byPath = new Map([...TOOL_FILES].map(([name, path]) => [path, name]));

  for (const path of ["index/root-index.md", "AGENTS.md", "rules/versioning.md"]) {
    const name = byPath.get(path);

    assert.ok(name, `${path} must have a tool`);
    assert.ok(names.has(name), `${path} must be reachable as ${name}`);
  }
});

test("the instructions index routes every convention it should", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "instructions_index", arguments: {} }),
  );

  for (const path of [
    "creators/plan-creator.md",
    "creators/memory-creator.md",
    "creators/instruction-creator.md",
    "creators/security-creator.md",
    "rules/versioning.md",
    "rules/no-session-links.md",
  ]) {
    assert.ok(text.includes(path), `the index must route ${path}`);
  }
});

// auto_activation is the source of truth for when each convention fires. A tool
// can be published, servable, and unrouted, and nothing else in the suite would
// notice — which is how the table reached 23 of 32. This pins the invariant.

test("auto_activation routes every published tool", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  const text = textOf(
    await client.callTool({ name: "auto_activation", arguments: {} }),
  );

  const unrouted = tools
    .map((tool) => tool.name)
    .filter((name) => !text.includes(`\`${name}\``));

  assert.deepEqual(
    unrouted,
    [],
    `auto_activation.md must name every published tool, or a convention can ` +
      `fire with nothing to route on. Unrouted: ${unrouted.join(", ")}`,
  );
});

// mcp_list is the one hand-written tool. It is not generated, so it is pinned
// here rather than covered by the bijection.

test("mcp_list is the only tool outside the generated surface", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);

  assert.equal(names.length, TOOL_FILES.size + 1);
  assert.ok(names.includes("mcp_list"));
  assert.ok(!TOOL_FILES.has("mcp_list"), "mcp_list is hand-written, not derived");
});

test("mcp_list takes no arguments", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  const list = tools.find((tool) => tool.name === "mcp_list");

  assert.deepEqual(list.inputSchema.properties ?? {}, {});
  assert.ok(
    list.description.includes("before cloning"),
    "description must name the routing decision, so a caller can choose without calling",
  );
});

test("mcp_list returns the registry with every sibling", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "mcp_list", arguments: {} }),
  );

  for (const repo of [
    "LXAgents-MCP/security",
    "RBAgents-MCP/shared-instruction",
    "RBAgents-MCP/security",
  ]) {
    assert.ok(text.includes(repo), `registry must name ${repo}`);
  }
});

test("mcp_list does not tell a caller to install the server it is on", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "mcp_list", arguments: {} }),
  );

  // A server listing itself invites a repository to clone and vendor the set it
  // is already connected to - the exact drift the connector exists to prevent.
  assert.doesNotMatch(
    text,
    /LXAgents-MCP\/shared-instruction/,
    "the registry must not name its own repository",
  );
  assert.ok(
    text.includes("already connected"),
    "the registry should say why its own server is absent",
  );
});

// The read-only claim, now over a surface with no arguments at all.

test("the surface is read-only: no tool takes a verb", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();

  for (const tool of tools) {
    const properties = Object.keys(tool.inputSchema.properties ?? {});
    for (const name of ["action", "verb", "operation", "command", "body", "content"]) {
      assert.equal(
        properties.includes(name),
        false,
        `${tool.name} must not accept ${name}`,
      );
    }
  }
});

test("the surface is read-only: no tool takes a credential", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();

  for (const tool of tools) {
    const properties = Object.keys(tool.inputSchema.properties ?? {});
    for (const name of ["apiKey", "api_key", "token", "secret", "password"]) {
      assert.equal(
        properties.includes(name),
        false,
        `${tool.name} must not accept ${name}`,
      );
    }
  }
});

test("the server needs no key to answer", async () => {
  delete process.env.API_KEY;

  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "root_index", arguments: {} }),
  );

  assert.ok(text.length > 500, "the set is served without a key");
});

test("TOOL_MODULES is the whole surface, and every module is well formed", () => {
  assert.equal(TOOL_MODULES.length, TOOL_FILES.size + 1);

  for (const { config, handler } of TOOL_MODULES) {
    assert.equal(typeof config.name, "string");
    assert.ok(config.description.length > 0, `${config.name} needs a description`);
    assert.equal(typeof handler, "function");
  }
});

test("no tool module can write to the set", async () => {
  // The structural claim: the served surface is a read. If a tool ever grows a
  // write path, this is the test that has to be made to fail on purpose.
  const { client } = await connect();
  const { tools } = await client.listTools();

  assert.equal(tools.length, TOOL_FILES.size + 1);
  assert.ok(
    CONTENT_DIR.endsWith("content"),
    "the set root is content/, and every read is resolved inside it",
  );
});
