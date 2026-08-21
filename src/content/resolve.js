/**
 * Resolving a caller-supplied identifier to a registry entry.
 *
 * Shared by the tool surface and the CLI. Both let a caller name an
 * instruction, and a name that works in one has to work in the other — keeping
 * the matching in one module is what stops the two surfaces drifting into
 * subtly different lookup rules.
 */

import { RESOURCE_SCHEME } from '../constants.js';

/**
 * Accepts whichever of the three forms the caller happens to hold — the
 * frontmatter `name`, the path, or the full URI — because an agent that has
 * read the manifest may have any of them, and guessing wrong should not cost a
 * round trip.
 *
 * @param {Readonly<object>} registry
 * @param {string} identifier
 * @returns {object|undefined}
 */
export function resolveEntry(registry, identifier) {
  const trimmed = identifier.trim();

  const candidates = [
    trimmed,
    trimmed.startsWith(`${RESOURCE_SCHEME}://`) ? trimmed : `${RESOURCE_SCHEME}://${trimmed}`,
  ];
  for (const uri of candidates) {
    const entry = registry.get(uri);
    if (entry) return entry;
  }

  return registry.getByName(trimmed);
}

/**
 * Near-misses worth suggesting when nothing resolved.
 *
 * Suggesting rather than just refusing: a near-miss on a name is the common
 * failure, and listing the whole set to recover would be wasteful.
 *
 * @param {Readonly<object>} registry
 * @param {string} identifier
 * @param {number} [limit]
 * @returns {string[]} `name (path)` for each candidate
 */
export function suggestEntries(registry, identifier, limit = 5) {
  const needle = identifier.trim().toLowerCase();
  if (!needle) return [];

  return registry.entries
    .filter((candidate) =>
      [candidate.name, candidate.path].some(
        (value) => value.toLowerCase().includes(needle) || needle.includes(value.toLowerCase()),
      ),
    )
    .slice(0, limit)
    .map((candidate) => `${candidate.name} (${candidate.path})`);
}
