/**
 * `mcp-repos` — discovering and selecting other MCP repositories.
 *
 * Discovery is done at call time rather than from a list baked into this
 * package, because the set of MCP repositories in an organization changes far
 * more often than this server is released. A hardcoded list would be wrong
 * within a week.
 *
 * Two sources, both cheap and offline:
 *
 *   - a **registry file**, when one is configured — the authoritative list an
 *     organization maintains by hand
 *   - a **filesystem scan** of one or more roots, which finds repositories a
 *     developer already has checked out
 *
 * There is deliberately no network call. Discovery runs while an agent is
 * waiting, and reaching a forge API would make it slow, credentialed, and
 * unavailable exactly when someone is working offline.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

/** Env var naming a JSON file that lists known MCP repositories. */
export const REGISTRY_FILE_ENV = 'MCP_REPOS_FILE';

/** Env var naming directories to scan, separated by the path delimiter. */
export const ROOTS_ENV = 'MCP_REPOS_ROOTS';

/** Directories never worth descending into. */
const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.cache']);

/** How deep a scan descends below a root. One level covers `~/src/<repo>`. */
const MAX_DEPTH = 2;

/**
 * Signals that a directory is an MCP repository.
 *
 * Weighted rather than boolean: a repository that merely depends on the SDK is
 * a weaker match than one that declares an `mcpServers` block, and a caller
 * choosing between candidates needs to see which.
 */
const SIGNALS = Object.freeze({
  sdkDependency: 'depends on @modelcontextprotocol/sdk',
  mcpConfig: 'has an MCP client config file',
  mcpKeyword: 'declares an mcp keyword',
  mcpBin: 'ships a bin that looks like an MCP server',
  agentsFile: 'has an AGENTS.md',
});

/** Reads and parses JSON, returning null rather than throwing. */
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

/** True when the path exists and is a file. */
async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Expands a leading `~` and makes the path absolute. */
export function expandPath(input, { cwd = process.cwd() } = {}) {
  const trimmed = input.trim();
  const expanded = trimmed === '~' || trimmed.startsWith('~/')
    ? join(homedir(), trimmed.slice(1))
    : trimmed;
  return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
}

/**
 * Inspects one directory and decides whether it is an MCP repository.
 *
 * @returns {Promise<object|null>} a repository record, or null when it is not one
 */
export async function inspectDirectory(path) {
  const pkg = await readJson(join(path, 'package.json'));
  const signals = [];

  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
    ...(pkg?.peerDependencies ?? {}),
  };
  if (Object.keys(deps).some((name) => name.startsWith('@modelcontextprotocol/'))) {
    signals.push(SIGNALS.sdkDependency);
  }
  if ((pkg?.keywords ?? []).some((word) => String(word).toLowerCase().includes('mcp'))) {
    signals.push(SIGNALS.mcpKeyword);
  }
  if (Object.keys(pkg?.bin ?? {}).some((name) => name.toLowerCase().includes('mcp'))) {
    signals.push(SIGNALS.mcpBin);
  }

  for (const candidate of ['.mcp.json', 'mcp.json']) {
    if (await isFile(join(path, candidate))) {
      signals.push(SIGNALS.mcpConfig);
      break;
    }
  }

  const hasAgents = await isFile(join(path, 'AGENTS.md'));
  if (hasAgents) signals.push(SIGNALS.agentsFile);

  // An AGENTS.md alone means "an agent repository", not "an MCP repository" —
  // it is recorded as a signal but never enough to qualify on its own.
  const qualifying = signals.filter((signal) => signal !== SIGNALS.agentsFile);
  if (qualifying.length === 0) return null;

  return Object.freeze({
    name: pkg?.name ?? path.split('/').filter(Boolean).at(-1),
    path,
    description: pkg?.description ?? null,
    version: pkg?.version ?? null,
    source: 'scan',
    signals: Object.freeze(signals),
    confidence: qualifying.length >= 2 ? 'high' : 'low',
  });
}

/** Walks one root, breadth-first, to MAX_DEPTH. */
async function scanRoot(root, found) {
  const queue = [[root, 0]];

  while (queue.length > 0) {
    const [current, depth] = queue.shift();

    const record = await inspectDirectory(current);
    if (record && !found.has(record.path)) found.set(record.path, record);

    if (depth >= MAX_DEPTH) continue;

    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue; // Unreadable or missing roots are skipped, not fatal.
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORED.has(entry.name) || entry.name.startsWith('.')) continue;
      queue.push([join(current, entry.name), depth + 1]);
    }
  }
}

/** Normalises one entry of a registry file into a repository record. */
function fromRegistry(entry, registryPath) {
  if (!entry || typeof entry !== 'object') return null;
  const name = entry.name ?? entry.repo ?? entry.id;
  if (!name) return null;

  return Object.freeze({
    name: String(name),
    path: entry.path ? expandPath(String(entry.path), { cwd: dirname(registryPath) }) : null,
    description: entry.description ?? null,
    version: entry.version ?? null,
    url: entry.url ?? null,
    transport: entry.transport ?? null,
    endpoint: entry.endpoint ?? null,
    command: entry.command ?? null,
    source: 'registry',
    signals: Object.freeze(['listed in the registry file']),
    confidence: 'high',
  });
}

/**
 * Discovers MCP repositories from every configured source.
 *
 * @param {{ roots?: string[], registryFile?: string|null, env?: object, cwd?: string }} [options]
 * @returns {Promise<{ repositories: object[], roots: string[], registryFile: string|null }>}
 */
export async function discoverRepos({
  roots = null,
  registryFile = null,
  env = process.env,
  cwd = process.cwd(),
} = {}) {
  const found = new Map();

  const resolvedRegistry = registryFile ?? env[REGISTRY_FILE_ENV] ?? null;
  if (resolvedRegistry) {
    const path = expandPath(resolvedRegistry, { cwd });
    const data = await readJson(path);
    const listed = Array.isArray(data) ? data : (data?.repositories ?? []);
    for (const entry of listed) {
      const record = fromRegistry(entry, path);
      // Keyed by name here: a registry entry may have no local path at all.
      if (record && !found.has(record.name)) found.set(record.name, record);
    }
  }

  const configuredRoots =
    roots ??
    (env[ROOTS_ENV] ? env[ROOTS_ENV].split(/[:;]/).filter(Boolean) : [cwd]);
  const resolvedRoots = configuredRoots.map((root) => expandPath(root, { cwd }));

  for (const root of resolvedRoots) {
    await scanRoot(root, found);
  }

  const repositories = [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { repositories, roots: resolvedRoots, registryFile: resolvedRegistry };
}

/**
 * Selects among discovered repositories.
 *
 * Returns the whole shortlist rather than only a winner: "select" here means
 * narrowing for a caller who then decides, and silently picking one of four
 * plausible matches is how an agent ends up in the wrong repository.
 *
 * @returns {{ matches: object[], exact: object|null }}
 */
export function selectRepos(repositories, query) {
  const needle = (query ?? '').trim().toLowerCase();
  if (!needle) return { matches: repositories, exact: null };

  const exact =
    repositories.find((repo) => repo.name.toLowerCase() === needle) ??
    repositories.find((repo) => repo.path && repo.path.toLowerCase() === needle) ??
    null;

  const matches = repositories.filter((repo) =>
    [repo.name, repo.path, repo.description]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle)),
  );

  return { matches: exact && !matches.includes(exact) ? [exact, ...matches] : matches, exact };
}

/** Renders discovery results as markdown for a terminal or a tool result. */
export function formatRepos({ repositories, roots, registryFile }, query = null) {
  if (repositories.length === 0) {
    const where = [
      registryFile ? `registry file ${registryFile}` : null,
      roots.length ? `roots ${roots.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('; ');
    return [
      query
        ? `No MCP repository matches "${query}".`
        : 'No MCP repositories discovered.',
      where ? `Searched: ${where}.` : '',
      `Set ${REGISTRY_FILE_ENV} to a JSON list, or ${ROOTS_ENV} to directories to scan.`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  const lines = [
    `# MCP repositories (${repositories.length}${query ? ` matching "${query}"` : ''})`,
    '',
    '| Name | Where | Confidence | Why it matched |',
    '|---|---|---|---|',
    ...repositories.map((repo) => {
      const where = repo.path ?? repo.endpoint ?? repo.url ?? '—';
      return `| \`${repo.name}\` | ${where} | ${repo.confidence} | ${repo.signals.join(', ')} |`;
    }),
  ];

  return lines.join('\n');
}
