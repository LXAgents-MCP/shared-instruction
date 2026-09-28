import { z } from "zod";
import { readSetFile } from "../content.js";

export const config = {
  name: "instruction",
  description:
    "Read one instruction file from the shared set by path, e.g. 'rules/directories.md'. Read-only - this tool cannot write. Returns 'not found' for an unknown path.",
  schema: {
    path: z
      .string()
      .describe(
        "Path inside the set, e.g. 'git/branching-strategy.md'. Never a leading slash, never '..'.",
      ),
  },
};

export async function handler({ path }) {
  const text = await readSetFile(path);

  if (text === null) {
    return {
      content: [
        {
          type: "text",
          text: `not found: ${path}\n\nPaths are relative to the set root, without the .agents/ prefix. Call mcp_list to see the available servers, or read the index at 'index/root-index.md' to route.`,
        },
      ],
    };
  }

  return { content: [{ type: "text", text }] };
}

export default { config, handler };
