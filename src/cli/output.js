/**
 * The CLI's stdout channel.
 *
 * Everywhere else in `src/` writes to stderr, because on the stdio transport
 * stdout *is* the JSON-RPC channel and a stray write corrupts it. The CLI is
 * the deliberate exception: its output is the product. It is safe because the
 * two never share a process — `serve` hands off to the transport and prints
 * nothing itself.
 *
 * Routing every CLI write through this one module is what keeps that exception
 * auditable: a `console.log` anywhere else in `src/` is still a bug.
 */

/** Writes one newline-terminated chunk to stdout. */
export function write(text) {
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
}

/** Writes a diagnostic to stderr, where it cannot be piped into real output. */
export function writeError(text) {
  process.stderr.write(`${text}\n`);
}
