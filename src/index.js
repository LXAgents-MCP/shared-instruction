#!/usr/bin/env node
/**
 * Server entry point — what an MCP client spawns.
 *
 * This repository is dual-purpose. This file is the *server* half: it does
 * nothing but boot the MCP server, so a client config that points `node` at
 * `src/index.js` behaves exactly as it always has. The *CLI* half is
 * `src/cli/index.js`, reached through the `lxagents-agents` bin.
 *
 * Both halves share one boot sequence in `server/run.js` and one content
 * registry, so neither can serve content the other would not.
 */

import { log } from './logger.js';
import { startServer } from './server/run.js';

startServer().catch((error) => {
  log.error('failed to start', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
