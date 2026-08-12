/**
 * The manifest — `agents://manifest.json`.
 *
 * This is what makes the duplicate audit exact rather than a guess. Without it,
 * comparing a repository against the shared set means reading every shared file
 * and diffing prose; with it, one read yields every file's `name`, path and
 * content hash, and the comparison becomes a lookup.
 *
 * It is deliberately deterministic — no timestamps, entries sorted by path — so
 * two reads of the same version produce identical bytes and a client can cache
 * or diff it meaningfully.
 */

import {
  JSON_MIME,
  MANIFEST_URI,
  SERVER_ID,
} from '../constants.js';

/** How `sha256` was computed, stated so a client can reproduce it exactly. */
export const NORMALIZATION = [
  'strip YAML frontmatter',
  'convert CRLF to LF',
  'strip trailing whitespace from each line',
  'trim leading and trailing blank lines',
].join('; ');

/**
 * @param {Readonly<object>} registry
 * @param {string} version
 * @returns {object}
 */
export function buildManifest(registry, version) {
  const files = registry.entries
    .map((entry) => ({
      uri: entry.uri,
      path: entry.path,
      name: entry.name,
      description: entry.description,
      folder: entry.folder,
      bytes: entry.bytes,
      sha256: entry.sha256,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    server: SERVER_ID,
    version,
    count: files.length,
    hashAlgorithm: 'sha256',
    hashedOver: 'the file body after normalization, excluding frontmatter',
    normalization: NORMALIZATION,
    overrideKey: 'name',
    usage:
      'Compare a repository against this list to find instructions it duplicates. Match on `name` first — that is the override key — then on `sha256`, then on `path`. Procedure: agents://rules/duplicate-instruction-audit.md',
    files,
  };
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 * @param {string} version
 */
export function registerManifestResource(server, registry, version) {
  // Serialized once per server instance rather than per read: the registry is
  // frozen, so the bytes cannot change underneath us.
  const text = `${JSON.stringify(buildManifest(registry, version), null, 2)}\n`;

  server.registerResource(
    'manifest',
    MANIFEST_URI,
    {
      title: 'Shared instruction set manifest',
      description:
        'Every shared file with its name, path, description, and content hash — one read instead of walking the set.',
      mimeType: JSON_MIME,
      size: Buffer.byteLength(text, 'utf8'),
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: JSON_MIME, text }],
    }),
  );
}
