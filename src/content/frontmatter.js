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

// The first `# ` heading.
//
// The title class excludes blanks at its first character so that it cannot
// overlap the `[ \t]+` before it. Two adjacent quantifiers whose classes
// intersect — `[ \t]+` then `[^\n]+`, where a space is both — leave the
// boundary between them ambiguous, and the engine explores every way to split
// a run of blanks. Disjoint classes give it exactly one, so the match is
// linear; after the first title character `[^\n]*` is greedy with nothing
// after it that can fail.
//
// It replaces `\s+(.+?)\s*$`, which was worse: a lazy group grown one
// character at a time against a trailing `\s*`, retried at every line.
const HEADING = /^#[ \t]+([^ \t\n][^\n]*)$/m;

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
 * Drops trailing spaces and tabs from one line.
 *
 * A scan rather than `/[ \t]+$/`, which is quadratic: the engine retries the
 * match at every position in the line, and at each one it consumes the whole
 * run of blanks before `$` fails and it gives them back one at a time. This
 * runs over every line of every instruction file at boot, so the difference is
 * not academic.
 *
 * Deliberately not `trimEnd`, which would also strip `\r`, `\v`, `\f` and the
 * Unicode spaces. The result is hashed, so widening what counts as trailing
 * whitespace would silently change every manifest hash.
 *
 * @param {string} line
 * @returns {string}
 */
function trimTrailingSpace(line) {
  let end = line.length;
  while (end > 0) {
    const code = line.charCodeAt(end - 1);
    if (code !== 32 && code !== 9) break;
    end -= 1;
  }
  return end === line.length ? line : line.slice(0, end);
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
    .map(trimTrailingSpace)
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
  const match = HEADING.exec(body);
  return match ? trimTrailingSpace(match[1]) : null;
}
