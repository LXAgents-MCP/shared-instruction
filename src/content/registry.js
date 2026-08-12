/**
 * The instruction registry.
 *
 * Every markdown file under the content root is read once, at boot, into a
 * frozen structure. That single decision is what makes the server safe under
 * concurrency: sessions, requests and worker processes all read the same
 * immutable object, so there is no cache to invalidate, no lock to take, and no
 * interleaving that can produce a torn read. A client connecting during another
 * client's request sees exactly the same bytes.
 *
 * The cost is that content changes require a restart. For an instruction set
 * that is versioned and released, that is the correct trade.
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  INSTRUCTION_FOLDERS,
  MARKDOWN_MIME,
  RESOURCE_SCHEME,
  ROOT_CONTENT_FILES,
} from '../constants.js';
import { extractTitle, normalizeBody, parseFrontmatter } from './frontmatter.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Default content root: `content/` beside the package, not beside this module. */
export const DEFAULT_CONTENT_DIR = resolve(HERE, '..', '..', 'content');

/** sha256 of a string, hex-encoded. */
function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Turns a path relative to the content root into an `agents://` URI. */
function toUri(relativePath) {
  return `${RESOURCE_SCHEME}://${relativePath.split(sep).join(posix.sep)}`;
}

/**
 * Lists the markdown files the loader is willing to serve.
 *
 * Only the declared instruction folders and the declared root files are walked.
 * A stray markdown file dropped into the content root is therefore ignored
 * rather than silently published as a rule.
 */
async function collectPaths(contentDir) {
  const paths = [];

  for (const file of ROOT_CONTENT_FILES) {
    const absolute = join(contentDir, file);
    try {
      const info = await stat(absolute);
      if (info.isFile()) paths.push(absolute);
    } catch {
      // A missing root file is a content bug, caught by validation below.
    }
  }

  for (const folder of INSTRUCTION_FOLDERS) {
    const absolute = join(contentDir, folder);
    let entries;
    try {
      entries = await readdir(absolute, { withFileTypes: true });
    } catch {
      continue; // Folder is optional; the set does not have to use all of them.
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        paths.push(join(absolute, entry.name));
      }
    }
  }

  return paths.sort();
}

/** Reads and validates one instruction file into a frozen entry. */
async function readEntry(contentDir, absolutePath) {
  const raw = await readFile(absolutePath, 'utf8');
  const relativePath = relative(contentDir, absolutePath);
  const { data, body, hasFrontmatter } = parseFrontmatter(raw);

  if (!hasFrontmatter || !data.name || !data.description) {
    // Failing at boot is the point. A resource without a description cannot be
    // routed on, and an agent that reads it has already paid for the mistake.
    throw new Error(
      `${relativePath}: every instruction file needs frontmatter with "name" and "description"`,
    );
  }

  const normalized = normalizeBody(body);

  return Object.freeze({
    uri: toUri(relativePath),
    path: relativePath.split(sep).join(posix.sep),
    folder: relativePath.includes(sep) ? relativePath.split(sep)[0] : null,
    name: data.name,
    description: data.description,
    title: extractTitle(body) ?? data.name,
    text: raw,
    mimeType: MARKDOWN_MIME,
    bytes: Buffer.byteLength(raw, 'utf8'),
    /** Hash of the normalized body — what a duplicate audit compares. */
    sha256: sha256(normalized),
  });
}

/**
 * Loads the content root into a frozen registry.
 *
 * @param {{ contentDir?: string|null }} [options]
 * @returns {Promise<Readonly<object>>}
 */
export async function loadRegistry({ contentDir = null } = {}) {
  const root = contentDir ? resolve(contentDir) : DEFAULT_CONTENT_DIR;
  const paths = await collectPaths(root);

  if (paths.length === 0) {
    throw new Error(`no instruction content found under ${root}`);
  }

  const entries = [];
  for (const path of paths) {
    entries.push(await readEntry(root, path));
  }

  const byUri = new Map();
  const byName = new Map();
  for (const entry of entries) {
    if (byUri.has(entry.uri)) {
      throw new Error(`duplicate resource URI: ${entry.uri}`);
    }
    if (byName.has(entry.name)) {
      // Names are the override key. Two shared files sharing one would make
      // "local overrides shared" ambiguous, so it is a boot failure.
      throw new Error(
        `duplicate name "${entry.name}" in ${entry.path} and ${byName.get(entry.name).path}`,
      );
    }
    byUri.set(entry.uri, entry);
    byName.set(entry.name, entry);
  }

  const frozenEntries = Object.freeze(entries);

  return Object.freeze({
    root,
    entries: frozenEntries,
    /** @param {string} uri */
    get: (uri) => byUri.get(uri),
    /** @param {string} name */
    getByName: (name) => byName.get(name),
    has: (uri) => byUri.has(uri),
    get size() {
      return frozenEntries.length;
    },
  });
}
