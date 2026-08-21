/**
 * The read-only CLI commands.
 *
 * Each returns a string rather than printing it, so the same function backs
 * the terminal output and the tests. They read the same frozen registry the
 * MCP resources do and reuse the same payload builders, which is what makes
 * "CLI mode" and "server mode" two doors onto one instruction set instead of
 * two copies of it.
 */

import { loadRegistry } from '../content/registry.js';
import { resolveEntry, suggestEntries } from '../content/resolve.js';
import { manifestJson } from '../server/manifest.js';
import { buildAuditPayload, buildSetupPayload } from '../server/payloads.js';
import { discoverRepos, formatRepos, selectRepos } from '../tools/mcp-repos.js';
import { resolveVersion } from '../version.js';

/** Raised for a condition the user can fix; the CLI prints it without a stack. */
export class CommandError extends Error {}

/**
 * Loads the registry and version once for a single command run.
 *
 * @param {{ contentDir?: string|null }} [options]
 */
export async function loadContext({ contentDir = null } = {}) {
  const [registry, version] = await Promise.all([loadRegistry({ contentDir }), resolveVersion()]);
  return { registry, version };
}

/**
 * Lists the instruction set, optionally restricted to one folder.
 *
 * @returns {string}
 */
export function listInstructions(registry, { folder = null, json = false } = {}) {
  const wanted = folder?.trim().replaceAll('/', '') || null;
  const matches = registry.entries.filter((entry) => !wanted || entry.folder === wanted);

  if (matches.length === 0) {
    const folders = [...new Set(registry.entries.map((entry) => entry.folder ?? '(root)'))];
    throw new CommandError(
      `No instruction files in folder "${folder}". Available folders: ${folders.join(', ')}.`,
    );
  }

  const files = matches.map((entry) => ({
    uri: entry.uri,
    path: entry.path,
    name: entry.name,
    description: entry.description,
    folder: entry.folder,
    sha256: entry.sha256,
  }));

  if (json) return JSON.stringify({ count: files.length, files }, null, 2);

  const width = Math.max(...files.map((file) => file.path.length));
  return [
    `Shared instruction set${wanted ? ` — ${wanted}/` : ''} (${files.length} files)`,
    '',
    ...files.map((file) => `  ${file.path.padEnd(width)}  ${file.description}`),
  ].join('\n');
}

/**
 * Returns one instruction file verbatim, frontmatter included.
 *
 * @returns {string}
 */
export function readInstruction(registry, identifier, { json = false } = {}) {
  const entry = resolveEntry(registry, identifier);
  if (!entry) {
    const near = suggestEntries(registry, identifier);
    throw new CommandError(
      `No instruction matches "${identifier}".` +
        (near.length
          ? ` Did you mean: ${near.join(', ')}?`
          : ' Run "lxagents-agents list" to see what exists.'),
    );
  }

  if (json) {
    return JSON.stringify(
      {
        uri: entry.uri,
        path: entry.path,
        name: entry.name,
        description: entry.description,
        folder: entry.folder,
        sha256: entry.sha256,
        text: entry.text,
      },
      null,
      2,
    );
  }

  return entry.text;
}

/** The AGENTS-SETUP procedure — the same text the prompt and tool deliver. */
export function setupProcedure(registry) {
  return buildSetupPayload(registry);
}

/** The duplicate-instruction audit, manifest inlined — as the prompt delivers it. */
export function auditProcedure(registry, version) {
  return buildAuditPayload(registry, version);
}

/** The machine-readable manifest, byte-identical to the served resource. */
export function manifest(registry, version) {
  return manifestJson(registry, version);
}

/**
 * `mcp-repos` — discovers MCP repositories and narrows them to a query.
 *
 * Returns the shortlist rather than a winner, for the same reason the tool
 * does: silently picking one of several plausible matches is how you end up
 * working in the wrong repository.
 */
export async function reposCommand({ query = null, root = null, json = false } = {}) {
  const discovery = await discoverRepos(root ? { roots: [root] } : {});
  const { matches, exact } = selectRepos(discovery.repositories, query);

  if (json) {
    return JSON.stringify(
      {
        count: matches.length,
        query,
        exact: exact?.name ?? null,
        roots: discovery.roots,
        registryFile: discovery.registryFile,
        repositories: matches,
      },
      null,
      2,
    );
  }

  return formatRepos({ ...discovery, repositories: matches }, query);
}
