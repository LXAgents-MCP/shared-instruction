/**
 * Resolves the server version from package.json, so there is exactly one place
 * to bump it. Falls back to a constant when package.json is unreadable — a
 * bundled or vendored copy should still start rather than crash on a version
 * string.
 */

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FALLBACK_VERSION } from './constants.js';

const PACKAGE_JSON = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');

let cached = null;

/** @returns {Promise<string>} */
export async function resolveVersion() {
  if (cached) return cached;
  try {
    const { version } = JSON.parse(await readFile(PACKAGE_JSON, 'utf8'));
    cached = typeof version === 'string' && version ? version : FALLBACK_VERSION;
  } catch {
    cached = FALLBACK_VERSION;
  }
  return cached;
}
