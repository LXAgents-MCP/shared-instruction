/**
 * Multi-process workers.
 *
 * Node runs one event loop per process, so a single process serves concurrent
 * clients by interleaving — fine for this workload, since every request is an
 * in-memory lookup, but it uses one core. `MCP_WORKERS` forks N processes that
 * share the listening socket, giving genuine parallelism across cores.
 *
 * This composes with the stateless session mode for free: no shared state means
 * any worker can serve any request. In stateful mode a session lives in the
 * worker that created it, so either run a single worker or put a
 * session-affinity load balancer in front.
 */

import cluster from 'node:cluster';

import { log } from '../logger.js';

/** Backoff before replacing a worker, so a crash loop cannot spin the CPU. */
const RESPAWN_DELAY_MS = 1000;

/**
 * Runs the primary process: forks workers and replaces them when they die.
 *
 * @param {{ workers: number }} options
 * @returns {boolean} true if this process is the primary and has forked
 */
export function runPrimary({ workers }) {
  if (workers <= 1 || !cluster.isPrimary) return false;

  log.info('forking workers', { workers });

  for (let index = 0; index < workers; index += 1) cluster.fork();

  let shuttingDown = false;

  cluster.on('exit', (worker, code, signal) => {
    if (shuttingDown) return;
    log.warn('worker exited, replacing', { pid: worker.process.pid, code, signal });
    setTimeout(() => {
      if (!shuttingDown) cluster.fork();
    }, RESPAWN_DELAY_MS).unref?.();
  });

  const stop = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info('primary shutting down', { signal });
    for (const worker of Object.values(cluster.workers ?? {})) {
      worker?.process.kill(signal);
    }
  };

  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));

  return true;
}
