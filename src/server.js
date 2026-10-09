import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CONTENT_TOOLS } from "./tools/from-content.js";
import { SERVER_NAME, VERSION } from "./version.js";

/**
 * Every tool this server exposes.
 *
 * One per file in `content/`, built by `tools/from-content.js`. A tool registered
 * anywhere else is invisible to `listTools()`, to the client's `tools/list`, and to
 * the test suite. This array is the whole surface — there is no discovery, and no
 * way to add a tool at runtime.
 *
 * Nothing here takes an argument, which is the point: there is no `path` for a
 * caller to traverse with, and no verb for a caller to act on. The tools that write
 * the set are absent, not disabled, so pointing a repository at this server cannot
 * mutate it.
 */
const TOOL_MODULES = [...CONTENT_TOOLS];

/**
 * Build the MCP server.
 *
 * @returns {McpServer}
 */
export function createServer() {
  const server = new McpServer(
    { name: SERVER_NAME, version: VERSION },
    {
      instructions:
        "The LXAgents shared agent instruction set, read-only. Every file in the set is its own tool: call the one whose name says what you need, such as plan_creator, branching_strategy, commit_conventions, or discovery_protocol. Call nothing at session start — each convention fires on its own trigger.",
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
