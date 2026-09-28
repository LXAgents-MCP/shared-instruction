import { readSetFile } from "../content.js";

const REGISTRY_PATH = "index/server-registry.md";

export const config = {
  name: "mcp_list",
  description:
    "List the sibling instruction and security MCP servers and what each is for, with its scope and clone URL. Use this before cloning one, to pick the server that matches the project. Does not list this server - you are already connected to it.",
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
