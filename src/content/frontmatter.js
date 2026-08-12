/**
 * A deliberately small frontmatter reader.
 *
 * The instruction set only ever uses `name` and `description` — two flat
 * scalars. Pulling in a YAML parser to read two strings would add a dependency
 * whose failure modes (anchors, type coercion, multi-document streams) are all
 * larger than the problem. If the format ever grows nested values, replace this
 * with a real parser rather than extending it.
 */

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Strips one layer of matching quotes from a scalar. */
function unquote(value) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/**
 * Splits a markdown document into its frontmatter fields and its body.
 *
 * @param {string} raw Full file contents.
 * @returns {{ data: Record<string, string>, body: string, hasFrontmatter: boolean }}
 */
export function parseFrontmatter(raw) {
  const match = FRONTMATTER.exec(raw);
  if (!match) {
    return { data: {}, body: raw, hasFrontmatter: false };
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    // Blank lines and comments carry nothing; a line without a colon is not a
    // field, and silently skipping it is kinder than throwing on a stray note.
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (!key) continue;
    data[key] = unquote(trimmed.slice(separator + 1).trim());
  }

  return { data, body: raw.slice(match[0].length), hasFrontmatter: true };
}

/**
 * Normalizes a body for hashing.
 *
 * Two files that differ only in line endings or trailing whitespace are the
 * same instruction, and the duplicate audit must say so — a checkout that ran
 * through a Windows editor should not read as a divergent copy.
 *
 * @param {string} body
 * @returns {string}
 */
export function normalizeBody(body) {
  return body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

/**
 * Reads the first `#` heading from a body, used as a display title.
 *
 * @param {string} body
 * @returns {string|null}
 */
export function extractTitle(body) {
  const match = /^#\s+(.+?)\s*$/m.exec(body);
  return match ? match[1] : null;
}
