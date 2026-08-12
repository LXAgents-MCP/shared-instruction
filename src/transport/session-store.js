/**
 * Tracks stateful HTTP sessions.
 *
 * Only the stateful mode needs this. A session is a transport plus the
 * `McpServer` bound to it, kept alive between requests so the client can hold
 * an SSE stream open and receive server-initiated messages.
 *
 * Two things make many simultaneous sessions safe rather than merely possible:
 * a bound on how many may exist at once, so one client cannot exhaust memory
 * for every other client, and a reaper that closes idle ones, so a client that
 * disconnects without a DELETE does not leak its session forever.
 */

import { log } from '../logger.js';
import { SESSION_SWEEP_INTERVAL_MS } from '../constants.js';

export class SessionStore {
  #sessions = new Map();
  #timer = null;

  /**
   * @param {{ ttlMs: number, maxSessions: number, sweepIntervalMs?: number }} options
   */
  constructor({ ttlMs, maxSessions, sweepIntervalMs = SESSION_SWEEP_INTERVAL_MS }) {
    this.ttlMs = ttlMs;
    this.maxSessions = maxSessions;
    this.sweepIntervalMs = sweepIntervalMs;
  }

  get size() {
    return this.#sessions.size;
  }

  get isFull() {
    return this.#sessions.size >= this.maxSessions;
  }

  /**
   * @param {string} id
   * @param {{ transport: object, server: object }} session
   */
  set(id, session) {
    this.#sessions.set(id, { ...session, lastSeen: Date.now() });
    log.debug('session opened', { sessionId: id, sessions: this.#sessions.size });
  }

  /** Returns the session and marks it as active, so the reaper leaves it alone. */
  touch(id) {
    const session = this.#sessions.get(id);
    if (session) session.lastSeen = Date.now();
    return session;
  }

  has(id) {
    return this.#sessions.has(id);
  }

  /** Forgets a session without closing it — for use from a close handler. */
  forget(id) {
    if (this.#sessions.delete(id)) {
      log.debug('session forgotten', { sessionId: id, sessions: this.#sessions.size });
    }
  }

  /** Closes a session's transport and server, then forgets it. */
  async close(id) {
    const session = this.#sessions.get(id);
    if (!session) return;
    this.#sessions.delete(id);
    await closeQuietly(session, id);
  }

  /** Starts the idle reaper. The timer is unref'd so it never holds the process open. */
  start() {
    if (this.#timer) return;
    this.#timer = setInterval(() => {
      void this.sweep();
    }, this.sweepIntervalMs);
    this.#timer.unref?.();
  }

  stop() {
    if (!this.#timer) return;
    clearInterval(this.#timer);
    this.#timer = null;
  }

  /** Closes every session idle for longer than the TTL. */
  async sweep(now = Date.now()) {
    const expired = [];
    for (const [id, session] of this.#sessions) {
      if (now - session.lastSeen > this.ttlMs) expired.push(id);
    }
    if (expired.length === 0) return 0;

    log.info('reaping idle sessions', { count: expired.length, remaining: this.#sessions.size });
    await Promise.all(expired.map((id) => this.close(id)));
    return expired.length;
  }

  /** Closes every session. Used on shutdown. */
  async closeAll() {
    this.stop();
    const entries = [...this.#sessions.entries()];
    this.#sessions.clear();
    await Promise.all(entries.map(([id, session]) => closeQuietly(session, id)));
  }
}

/**
 * Closing a transport whose socket already died throws. That is not worth
 * failing a shutdown or a sweep over, so it is logged and swallowed.
 */
async function closeQuietly(session, id) {
  for (const closeable of [session.transport, session.server]) {
    try {
      await closeable?.close();
    } catch (error) {
      log.debug('error closing session', { sessionId: id, error: String(error) });
    }
  }
}
