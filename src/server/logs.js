/**
 * The shared set's release history, read out of the published log index.
 *
 * A consuming repository picks up a content change on its next read, with no
 * install step — which means the only thing that ever tells it to *edit*
 * something on its own side is the **Consumers must** column of
 * `index/logs-index.md`. This module turns that column into a delta a
 * repository can act on.
 *
 * Parsing published markdown is the fragile part of this file, so it fails
 * loudly rather than skipping what it cannot read: a row that does not have
 * exactly four cells throws, and `test/logs.test.js` runs the parser over the
 * real index. A malformed row therefore breaks the suite instead of quietly
 * disappearing from an update payload, which is the failure mode that would
 * matter — a repository told about four releases when five happened has no way
 * to notice the fifth.
 */

import { LOGS_INDEX_URI } from '../constants.js';

/** Matches the version cell: `0/14/0`, backticks included. */
const VERSION_CELL = /^`(\d+)\/(\d+)\/(\d+)`$/;

/** Accepts a version as `1.0.0` or `1/0/0`, with or without backticks. */
const VERSION_INPUT = /^(\d+)[./](\d+)[./](\d+)$/;

/**
 * Parses `1.0.0` or `1/0/0` into comparable parts.
 *
 * @param {string} value
 * @returns {{ major: number, minor: number, patch: number, label: string }|null}
 */
export function parseVersion(value) {
  const match = VERSION_INPUT.exec(String(value ?? '').trim().replaceAll('`', ''));
  if (!match) return null;

  const [, major, minor, patch] = match.map(Number);
  return { major, minor, patch, label: `${major}.${minor}.${patch}` };
}

/** Negative when `a` is older, positive when newer, zero when equal. */
export function compareVersions(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/**
 * Splits one markdown table row into its cells.
 *
 * Rows are written by hand, so the count is checked rather than assumed. Four
 * cells is the shape `changelog-creator.md` fixes for this table; anything else
 * is a row nobody can route on.
 *
 * @param {string} line
 * @returns {string[]}
 */
function cellsOf(line) {
  const trimmed = line.trim();
  const inner = trimmed.slice(1, -1);
  return inner.split('|').map((cell) => cell.trim());
}

/**
 * Every release in the log index, newest first, as the index writes them.
 *
 * @param {string} text the log index, verbatim
 * @returns {{ version: string, major: number, minor: number, patch: number, date: string, summary: string, consumersMust: string }[]}
 */
export function parseReleaseRows(text) {
  const releases = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = cellsOf(trimmed);
    // The header and its separator are table rows too, and neither carries a
    // version cell. Skipping on that test rather than on position keeps this
    // working if the table gains a note above it.
    if (!VERSION_CELL.test(cells[0] ?? '')) continue;

    if (cells.length !== 4) {
      throw new Error(
        `malformed release row in the log index: expected 4 cells, found ${cells.length} — ${trimmed}`,
      );
    }

    const [, major, minor, patch] = VERSION_CELL.exec(cells[0]).map(Number);
    releases.push({
      version: `${major}.${minor}.${patch}`,
      major,
      minor,
      patch,
      date: cells[1],
      summary: cells[2],
      consumersMust: cells[3],
    });
  }

  if (releases.length === 0) {
    throw new Error('the log index published no release rows');
  }

  return releases;
}

/**
 * Reads the log index out of the registry.
 *
 * @param {Readonly<object>} registry
 * @returns {ReturnType<typeof parseReleaseRows>}
 */
export function readReleases(registry) {
  const entry = registry.get(LOGS_INDEX_URI);
  if (!entry) throw new Error(`content missing from the registry: ${LOGS_INDEX_URI}`);
  return parseReleaseRows(entry.text);
}

/**
 * The releases a repository on `fromVersion` has not applied, **oldest first**.
 *
 * Oldest first is not cosmetic. The lines compose — a file added in one release
 * and changed in a later one is left half-applied if the newer line lands first,
 * and nothing about the result signals it. `prompts/agents-update.md` §2 states
 * the same requirement to the agent following it.
 *
 * @param {Readonly<object>} registry
 * @param {string} fromVersion
 * @returns {{ releases: ReturnType<typeof parseReleaseRows>, current: string, ahead: boolean }}
 */
export function releasesSince(registry, fromVersion) {
  const all = readReleases(registry);
  // Seeded explicitly. `readReleases` throws on an empty index, so `first`
  // always exists — but an unseeded reduce leans on a guarantee made in another
  // function, and would throw "Reduce of empty array" here rather than the
  // message that says what is actually wrong with the index.
  const [first, ...rest] = all;
  const newest = rest.reduce((a, b) => (compareVersions(a, b) >= 0 ? a : b), first);
  const from = parseVersion(fromVersion);
  if (!from) throw new Error(`not a version: "${fromVersion}". Use 1.0.0 or 1/0/0.`);

  const releases = all
    .filter((release) => compareVersions(release, from) > 0)
    .sort(compareVersions);

  return { releases, current: newest.version, ahead: compareVersions(from, newest) > 0 };
}
