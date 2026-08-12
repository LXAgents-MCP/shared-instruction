/**
 * Publishes every instruction file as an MCP resource.
 *
 * Each file is registered individually rather than behind a URI template, so
 * `resources/list` carries a real name and description per entry. That is what
 * lets an agent choose one file to read instead of walking the set — the whole
 * point of the index tree, enforced at the protocol layer.
 */

import { log } from '../logger.js';

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 */
export function registerInstructionResources(server, registry) {
  for (const entry of registry.entries) {
    server.registerResource(
      entry.name,
      entry.uri,
      {
        title: entry.title,
        description: entry.description,
        mimeType: entry.mimeType,
        size: entry.bytes,
      },
      // The registry is frozen and already in memory, so a read is a lookup.
      // No I/O here means a slow or hostile client cannot make reads queue
      // behind each other.
      async (uri) => {
        const requested = uri.href;
        const match = registry.get(requested) ?? entry;
        return {
          contents: [
            {
              uri: requested,
              mimeType: match.mimeType,
              text: match.text,
            },
          ],
        };
      },
    );
  }

  log.debug('registered instruction resources', { count: registry.size });
}
