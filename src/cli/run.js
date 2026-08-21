/**
 * CLI argument parsing and dispatch.
 *
 * Exported as `run(argv, { write })` rather than executed on import, so the
 * tests drive the real parser and the real commands without spawning a
 * process or capturing stdout.
 */

import { parseArgs } from 'node:util';

import {
  CommandError,
  auditProcedure,
  createCommand,
  listInstructions,
  loadContext,
  manifest,
  readInstruction,
  reposCommand,
  setupProcedure,
} from './commands.js';
import { write as writeStdout, writeError } from './output.js';
import { resolveVersion } from '../version.js';

/** Raised when the command line itself is wrong, as opposed to the request. */
class UsageError extends Error {}

export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
export const EXIT_USAGE = 2;

const OPTIONS = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  json: { type: 'boolean' },
  folder: { type: 'string' },
  http: { type: 'boolean' },
  stdio: { type: 'boolean' },
  port: { type: 'string' },
  root: { type: 'string' },
  description: { type: 'string' },
  directory: { type: 'string' },
  write: { type: 'boolean' },
  force: { type: 'boolean' },
};

export const HELP = `lxagents-agents — the LXAgents shared agent instruction set

This package is dual-purpose: the same instruction set is reachable from this
CLI and from an MCP client. "serve" is the server mode; every other command is
the CLI mode.

Usage
  lxagents-agents <command> [options]

Commands
  serve                  Run as an MCP server (stdio by default)
  list                   List every instruction file with its description
  read <instruction>     Print one file — by name, path, or agents:// URI
  setup                  Print the AGENTS-SETUP procedure
  audit                  Print the duplicate-instruction audit procedure
  manifest               Print the manifest as JSON
  repos [query]          Discover MCP repositories, narrowed by an optional query
  create <name>          Scaffold a new dual-purpose MCP repository

Options
  --http                 serve: use the streamable HTTP transport
  --stdio                serve: use the stdio transport (default)
  --port <n>             serve: HTTP port (default 3000)
  --folder <name>        list: restrict to one folder, e.g. rules, git
  --root <dir>           repos: scan this directory instead of the configured roots
  --description <text>   create: one line describing the new repository
  --directory <dir>      create: where to create it (default: the name)
  --write                create: actually write the files (default: plan only)
  --force                create: allow a target directory that is not empty
  --json                 list, read, repos, create: emit JSON instead of text
  -h, --help             Show this help
  -v, --version          Show the version

Examples
  lxagents-agents list --folder git
  lxagents-agents read branching-strategy
  lxagents-agents read agents://rules/directories.md
  lxagents-agents serve --http --port 8080
  lxagents-agents repos --root ~/src
  lxagents-agents create weather-mcp                 # show the plan
  lxagents-agents create weather-mcp --write         # create it

Environment
  Every option above has an environment equivalent for server mode; see
  wiki/environments/env.md.`;

/**
 * Boots the MCP server from the CLI.
 *
 * The transport is selected by setting the environment *before* the server
 * module is imported, because `config.js` parses the environment once at
 * import time. That is why this import is dynamic and the rest are static.
 */
async function commandServe(values) {
  if (values.http && values.stdio) {
    throw new UsageError('Pass either --http or --stdio, not both.');
  }
  if (values.http) process.env.MCP_TRANSPORT = 'http';
  if (values.stdio) process.env.MCP_TRANSPORT = 'stdio';
  if (values.port !== undefined) {
    if (!/^\d+$/.test(values.port)) {
      throw new UsageError(`--port must be an integer, received "${values.port}".`);
    }
    process.env.PORT = values.port;
  }

  const { startServer } = await import('../server/run.js');
  await startServer();
  return EXIT_OK;
}

/**
 * @param {string[]} argv arguments after the executable and script
 * @param {{ write?: (text: string) => void }} [io]
 * @returns {Promise<number>} the process exit code
 */
export async function run(argv, { write = writeStdout } = {}) {
  let values;
  let positionals;
  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      options: OPTIONS,
      allowPositionals: true,
    }));
  } catch (error) {
    writeError(`${error.message}\n\nRun "lxagents-agents --help" for usage.`);
    return EXIT_USAGE;
  }

  const [command, ...rest] = positionals;

  // Asking for help or version is a successful run; arriving with no command
  // at all is a usage error that happens to print the same text.
  if (values.version) {
    write(await resolveVersion());
    return EXIT_OK;
  }
  if (values.help) {
    write(HELP);
    return EXIT_OK;
  }
  if (!command) {
    write(HELP);
    return EXIT_USAGE;
  }

  try {
    if (command === 'serve') return await commandServe(values);
    if (command === 'help') {
      write(HELP);
      return EXIT_OK;
    }

    // Everything below reads content, so it pays for the registry once here.
    const { registry, version } = await loadContext();

    switch (command) {
      case 'list':
        write(listInstructions(registry, { folder: values.folder, json: values.json }));
        return EXIT_OK;
      case 'read': {
        const [identifier] = rest;
        if (!identifier) {
          throw new UsageError('read needs an instruction: lxagents-agents read <instruction>');
        }
        write(readInstruction(registry, identifier, { json: values.json }));
        return EXIT_OK;
      }
      case 'setup':
        write(setupProcedure(registry));
        return EXIT_OK;
      case 'audit':
        write(auditProcedure(registry, version));
        return EXIT_OK;
      case 'manifest':
        write(manifest(registry, version));
        return EXIT_OK;
      case 'repos':
        write(await reposCommand({ query: rest[0] ?? null, root: values.root, json: values.json }));
        return EXIT_OK;
      case 'create': {
        const [name] = rest;
        if (!name) {
          throw new UsageError('create needs a name: lxagents-agents create <name>');
        }
        write(
          await createCommand({
            name,
            description: values.description,
            directory: values.directory,
            write: values.write ?? false,
            force: values.force ?? false,
            json: values.json,
          }),
        );
        return EXIT_OK;
      }
      default:
        throw new UsageError(`Unknown command "${command}".`);
    }
  } catch (error) {
    if (error instanceof UsageError) {
      writeError(`${error.message}\n\nRun "lxagents-agents --help" for usage.`);
      return EXIT_USAGE;
    }
    if (error instanceof CommandError) {
      writeError(error.message);
      return EXIT_ERROR;
    }
    writeError(error instanceof Error ? error.message : String(error));
    return EXIT_ERROR;
  }
}
