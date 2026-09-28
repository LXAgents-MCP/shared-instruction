import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import instructionTool from "./tools/instruction.js";
import mcpListTool from "./tools/mcp-list.js";
import { SERVER_NAME, VERSION } from "./version.js";

/**
 * Every tool this server exposes.
 *
 * A tool registered anywhere else is invisible to `listTools()`, to the
 * client's `tools/list`, and to the test suite. This array is the whole
 * surface — there is no discovery, and no way to add a tool at runtime.
 */
const TOOL_MODULES = [instructionTool, mcpListTool];

/**
 * Build the MCP server.
 *
 * The two tools here are the entire write surface, which is to say there is
 * none. `instruction` returns a file from `content/`; `mcp_list` returns the
 * server registry. Nothing in this repository accepts a verb, so pointing a
 * repository at this server cannot mutate the set — the property holds because
 * the code that would write is absent, not because a check refuses it.
 */
export function createServer() {
  const server = new McpServer(
    { name: SERVER_NAME, version: VERSION },
    {
      instructions:
        "The shared agent instruction set, read-only. Call mcp_list to see which instruction and security servers exist and which fits a project. Call instruction with a path such as 'git/branching-strategy.md' to read one file. Start from 'index/root-index.md' and route; do not bulk-read the set.",
    },
  );

  for (const { config, handler } of TOOL_MODULES) {
    server.registerTool(
      config.name,
      { description: config.description, inputSchema: config.schema },
      handler,
    );
  }

  return server;
}

export { TOOL_MODULES };
