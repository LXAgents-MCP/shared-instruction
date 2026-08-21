/**
 * Values that are fixed for the lifetime of the process and shared by every
 * client session. Nothing here is mutable — the registry, the server factory
 * and both transports read these concurrently without synchronisation.
 */

/** MCP server id. Clients see this as the connector's name. */
export const SERVER_ID = 'lxagents-agents-base';

/**
 * Human-facing title, shown by clients that render one.
 *
 * Distinct from SERVER_ID above, which is the wire identifier every consuming
 * repository names in its client configuration. The title may be rebranded;
 * the id may not, without breaking every one of those configurations.
 */
export const SERVER_TITLE = 'LXAgents Shared Instruction';

/**
 * Fallback version, used only when package.json cannot be read (for example a
 * single-file bundle). The real version comes from package.json so there is
 * one place to bump it.
 */
export const FALLBACK_VERSION = '0.0.0';

/** URI scheme every instruction resource is published under. */
export const RESOURCE_SCHEME = 'agents';

/** URI of the manifest resource — the entry point for a duplicate audit. */
export const MANIFEST_URI = `${RESOURCE_SCHEME}://manifest.json`;

/** URI of the federation contract served to consuming repositories. */
export const CONTRACT_URI = `${RESOURCE_SCHEME}://AGENTS.md`;

/** Mime type used for every markdown instruction resource. */
export const MARKDOWN_MIME = 'text/markdown';

/** Mime type used for the manifest. */
export const JSON_MIME = 'application/json';

/**
 * Folders inside the content root that hold instruction files, in the order a
 * reader should meet them. Anything outside this list is ignored by the loader,
 * so dropping a stray file into content/ cannot silently become a rule.
 */
export const INSTRUCTION_FOLDERS = Object.freeze([
  'rules',
  'git',
  'planning',
  'prompts',
  'creators',
  'index',
]);

/** Files allowed to sit at the content root rather than inside a folder. */
export const ROOT_CONTENT_FILES = Object.freeze(['AGENTS.md']);

/** Prompt names. Kept here so prompts and docs cannot drift apart. */
export const PROMPT_AGENTS_SETUP = 'agents-setup';
export const PROMPT_DUPLICATE_AUDIT = 'check-duplicate-agents-instruction';

/** Default HTTP settings. Overridable through the environment — see config.js. */
export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = '0.0.0.0';
export const DEFAULT_MCP_PATH = '/mcp';

/** How long an idle stateful session is kept before it is reaped. */
export const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;

/** How often the reaper runs. */
export const SESSION_SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Upper bound on concurrent stateful sessions. Reaching it returns a 503 rather
 * than letting one client exhaust memory for every other client.
 */
export const DEFAULT_MAX_SESSIONS = 1000;

/** Largest JSON-RPC body accepted on the HTTP transport. */
export const MAX_REQUEST_BODY = '4mb';
