#!/usr/bin/env node
/**
 * CLI entry point — what a person at a terminal runs.
 *
 * The counterpart to `src/index.js`, which is what an MCP client spawns. Both
 * reach the same registry and the same procedures; this one renders them for a
 * terminal, and `lxagents-agents serve` hands off to the server half.
 */

import { run } from './run.js';

// `serve` keeps the event loop alive on its own handles, so setting exitCode
// rather than calling process.exit() lets the server keep running while every
// other command still exits with a meaningful status.
process.exitCode = await run(process.argv.slice(2));
