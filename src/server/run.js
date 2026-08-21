/**
 * Starting the MCP server, independent of how the process was invoked.
 *
 * Two entry points land here: `src/index.js`, which an MCP client spawns
 * directly, and `lxagents-agents serve` on the CLI. Keeping the boot sequence
 * in one place is what makes the two modes the same server rather than two
 * implementations that drift.
 *
 * Boot order matters: the content registry is loaded and validated *before* a
 * transport starts accepting anything. A server that answers `initialize` and
 * then fails on the first resource read is worse than one that never came up —
 * so a content error is a startup failure, not a runtime surprise.
 */

import { config } from '../config.js';
import { SERVER_ID } from '../constants.js';
import { loadRegistry } from '../content/registry.js';
import { log } from '../logger.js';
import { createHttpApp } from '../transport/http.js';
import { runPrimary } from '../transport/cluster.js';
import { startStdio } from '../transport/stdio.js';
import { resolveVersion } from '../version.js';

/** Wires SIGTERM/SIGINT to a shutdown function, once. */
function onShutdown(shutdown) {
  let running = false;
  const handle = async (signal) => {
    if (running) return;
    running = true;
    log.info('shutting down', { signal });
    try {
      await shutdown();
    } catch (error) {
      log.error('shutdown failed', { error: String(error) });
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void handle('SIGTERM'));
  process.on('SIGINT', () => void handle('SIGINT'));
}

async function startHttp({ registry, version }) {
  const { app, sessions } = createHttpApp({ registry, version, config });

  const httpServer = await new Promise((resolve, reject) => {
    const server = app.listen(config.port, config.host);
    server.once('listening', () => resolve(server));
    server.once('error', reject);
  });

  log.info('serving over streamable http', {
    server: SERVER_ID,
    version,
    endpoint: `http://${config.host}:${config.port}${config.mcpPath}`,
    sessionMode: config.sessionMode,
    resources: registry.size,
  });

  onShutdown(async () => {
    // Sessions first: closing the HTTP server waits for open connections, and
    // an SSE stream never closes on its own.
    await sessions.closeAll();
    await new Promise((resolve) => httpServer.close(resolve));
  });
}

/**
 * Boots the server on the transport `config` selected.
 *
 * The CLI selects a transport by setting the environment before importing this
 * module, so there is exactly one place a transport is chosen — `config.js`.
 *
 * @returns {Promise<void>} resolves once the transport is accepting traffic
 */
export async function startServer() {
  // Forking happens before any content is read, so workers each load their own
  // copy rather than inheriting a half-initialised one.
  if (config.transport === 'http' && runPrimary({ workers: config.workers })) return;

  const [registry, version] = await Promise.all([
    loadRegistry({ contentDir: config.contentDir }),
    resolveVersion(),
  ]);

  if (config.transport === 'stdio') {
    const { shutdown } = await startStdio({ registry, version });
    onShutdown(shutdown);
    return;
  }

  await startHttp({ registry, version });
}
