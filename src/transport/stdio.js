/**
 * stdio transport — one client, one process.
 *
 * This is the local path: an editor or CLI spawns the server as a subprocess
 * and speaks JSON-RPC over the pipe. There is exactly one client by
 * construction, so none of the session machinery applies.
 *
 * Nothing here may write to stdout. See logger.js.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { SERVER_ID } from '../constants.js';
import { log } from '../logger.js';
import { createServer } from '../server/create-server.js';

/**
 * @param {{ registry: object, version: string }} options
 * @returns {Promise<{ shutdown: () => Promise<void> }>}
 */
export async function startStdio({ registry, version }) {
  const server = createServer({ registry, version });
  const transport = new StdioServerTransport();

  await server.connect(transport);
  log.info('serving over stdio', { server: SERVER_ID, version, resources: registry.size });

  return {
    shutdown: async () => {
      await server.close();
    },
  };
}
