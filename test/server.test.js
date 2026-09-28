import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, TOOL_MODULES } from "../src/server.js";
import { CONTENT_DIR } from "../src/version.js";

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

test("both tools are registered", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();

  assert.deepEqual(names, ["instruction", "mcp_list"]);
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

test("instruction advertises the path it takes", async () => {
  const { client } = await connect();
  const { tools } = await client.listTools();
  const instruction = tools.find((tool) => tool.name === "instruction");

  assert.ok(instruction.inputSchema.properties.path, "path must be in the schema");
  assert.equal(instruction.inputSchema.required.includes("path"), true);
});

test("instruction returns a file from the set", async () => {
  const { client } = await connect();
  const result = await client.callTool({
    name: "instruction",
    arguments: { path: "index/root-index.md" },
  });

  const text = textOf(result);
  // \r? because a checkout on Windows serves CRLF, and the bytes are served as
  // they are on disk.
  assert.match(text, /^---\r?\n/, "frontmatter is part of the served text");
  assert.ok(text.includes("name:"), "frontmatter is not stripped");
});

test("mcp_list returns the registry with every sibling", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "mcp_list", arguments: {} }),
  );

  for (const repo of [
    "LXAgents-MCP/shared-instruction",
    "LXAgents-MCP/security",
    "RBAgents-MCP/shared-instruction",
    "RBAgents-MCP/security",
  ]) {
    assert.ok(text.includes(repo), `registry must name ${repo}`);
  }
});

test("a traversal attempt reports not found and leaks nothing", async () => {
  const { client } = await connect();

  for (const path of [
    "../../package.json",
    "../../../.git/config",
    "rules/../../package.json",
    "/etc/passwd",
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
  ]) {
    const result = await client.callTool({
      name: "instruction",
      arguments: { path },
    });
    const text = textOf(result);

    assert.match(text, /^not found:/, `${path} must be refused`);
    assert.doesNotMatch(text, /"name":/, `${path} must leak nothing`);
    assert.doesNotMatch(text, /\[core\]/, `${path} must leak nothing`);
  }
});

test("an unknown path inside the set reports not found", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({
      name: "instruction",
      arguments: { path: "rules/does-not-exist.md" },
    }),
  );

  assert.match(text, /^not found: rules\/does-not-exist\.md/);
});

test("the set root itself is not a file", async () => {
  const { client } = await connect();
  const text = textOf(
    await client.callTool({ name: "instruction", arguments: { path: "." } }),
  );

  assert.match(text, /^not found:/);
});

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

test("TOOL_MODULES is the whole surface, and every module is well formed", () => {
  assert.equal(TOOL_MODULES.length, 2);

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

  assert.deepEqual(
    tools.map((tool) => tool.name).sort(),
    ["instruction", "mcp_list"],
  );
  assert.ok(
    CONTENT_DIR.endsWith(`${"content"}`),
    "the set root is content/, and every read is resolved inside it",
  );
});
