/**
 * Minimal structured logger.
 *
 * Everything is written to stderr, never stdout. On the stdio transport stdout
 * *is* the JSON-RPC channel, so a stray console.log there corrupts the stream
 * and the client drops the connection. Writing to stderr unconditionally means
 * the same logging code is safe under both transports.
 */

import { config } from './config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[config.logLevel] ?? LEVELS.info;

function emit(level, message, fields) {
  if (LEVELS[level] > threshold) return;
  const line = {
    time: new Date().toISOString(),
    level,
    pid: process.pid,
    msg: message,
    ...fields,
  };
  process.stderr.write(`${JSON.stringify(line)}\n`);
}

export const log = {
  error: (message, fields) => emit('error', message, fields),
  warn: (message, fields) => emit('warn', message, fields),
  info: (message, fields) => emit('info', message, fields),
  debug: (message, fields) => emit('debug', message, fields),
};
