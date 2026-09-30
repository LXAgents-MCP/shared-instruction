import { readSetFile } from "../content.js";

const REGISTRY_PATH = "index/server-registry.md";

export const config = {
  name: "mcp_list",
  description:
    "List the sibling instruction and security MCP servers and what each is for, with its scope, clone URL, and the organisations they are published in. Use this before cloning one, to pick the server that matches the project. Report the whole list to the user and let them choose; do not clone or register a connector without an explicit yes. Does not list this server - you are already connected to it.",
};

export async function handler() {
  const text = await readSetFile(REGISTRY_PATH);

  if (text === null) {
    throw new Error(
      `The server registry is missing from the published set at ${REGISTRY_PATH}. This server cannot describe its siblings without it.`,
    );
  }

  return { content: [{ type: "text", text }] };
}

export default { config, handler };
