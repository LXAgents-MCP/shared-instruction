/**
 * The tool surface.
 *
 * Prompts and resources are the correct primitives for an instruction set, but
 * several clients enumerate a connector by its tools alone: a server exposing
 * only prompts and resources shows up as "no tools available" and cannot be
 * enabled at all. These four tools are the compatibility layer that makes the
 * set reachable there.
 *
 * They add no content and hold no logic of their own. The two procedure tools
 * return exactly what the matching prompt returns (`payloads.js`), and the two
 * access tools read the same frozen registry the resources do. If a client
 * supports prompts and resources, prefer those — nothing is lost either way.
 *
 * On argument schemas: the SDK validates `tools/call` arguments against the
 * declared shape and an object schema rejects `undefined`, exactly as it does
 * for prompts. The risk profile differs, though — a tool is called by a model
 * that has the schema in hand and emits an arguments object, whereas a prompt is
 * invoked by a person clicking a button with nothing to send. So the two
 * zero-argument tools declare no schema at all, and the two that take arguments
 * declare one.
 */

import { z } from 'zod';

import { buildAuditPayload, buildSetupPayload, requireEntry } from './payloads.js';
import { resolveEntry, suggestEntries } from '../content/resolve.js';
import { formatScaffold, scaffoldRepo, writeScaffold } from '../tools/mcp-creator.js';

/** Wraps text in the content shape a tool result requires. */
function text(value) {
  return { content: [{ type: 'text', text: value }] };
}

/** An error a model can act on, rather than a thrown exception. */
function failure(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

/** Read-only, non-destructive, repeatable, no external world. */
const READ_ONLY = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 * @param {string} version
 */
export function registerTools(server, registry, version) {
  server.registerTool(
    'agents_setup',
    {
      title: 'Set up the agent instruction system',
      description: `Return the full AGENTS-SETUP procedure for the current repository.

Use this when asked to set up, adopt, scaffold, or re-write a repository's agent instruction system. The procedure is the authority — follow it start to finish rather than summarising it, and obey its instruction to ask the user before writing files.

Takes no arguments.

Returns: the complete procedure as markdown, roughly 27,000 characters, prefixed with a note that this connector is the shared instruction set it refers to.

Equivalent to the \`agents-setup\` prompt; use the prompt instead if your client exposes prompts.`,
      annotations: READ_ONLY,
    },
    async () => text(buildSetupPayload(registry)),
  );

  server.registerTool(
    'agents_check_duplicate_instructions',
    {
      title: 'Check for duplicated agent instructions',
      description: `Return the duplicate-instruction audit procedure, with the shared set manifest inlined.

Use this ONLY when the user explicitly asks for a duplicate check — for example "check duplicate agents instruction with the mcp server" or "audit .agents/ against the connector". It proposes deletions, so never call it on your own initiative, and never as part of session start.

Takes no arguments.

Returns: the audit procedure as markdown, followed by a JSON manifest of every shared file with its name, path, description and sha256, so no further reads are needed to classify candidates.

Deletion requires per-file user approval. Report every finding with a verdict and wait.`,
      annotations: READ_ONLY,
    },
    async () => text(buildAuditPayload(registry, version)),
  );

  const listOutput = {
    count: z.number().int().describe('Number of files returned'),
    files: z
      .array(
        z.object({
          uri: z.string(),
          path: z.string(),
          name: z.string(),
          description: z.string(),
          folder: z.string().nullable(),
          sha256: z.string(),
        }),
      )
      .describe('The matching instruction files'),
  };

  server.registerTool(
    'agents_list_instructions',
    {
      title: 'List the shared instruction files',
      description: `List every file in the shared instruction set, with the description to route on and the content hash to compare against.

Use this to discover what exists before reading anything — one call instead of opening files to find out what they cover. Route on the descriptions, then read only what you need with agents_read_instruction.

Args:
  - folder (string, optional): restrict to one folder, e.g. "rules", "git", "planning", "prompts", "creators", "index". Omit for everything.

Returns: { count, files: [{ uri, path, name, description, folder, sha256 }] }. The sha256 is taken over the body after normalization and excluding frontmatter, so it can be compared against a local file directly.

Equivalent to reading the agents://manifest.json resource.`,
      inputSchema: {
        folder: z
          .string()
          .optional()
          .describe('Restrict to one folder, e.g. "rules". Omit to list everything.'),
      },
      outputSchema: listOutput,
      annotations: READ_ONLY,
    },
    async ({ folder }) => {
      const wanted = folder?.trim().replaceAll('/', '') || null;
      const matches = registry.entries.filter((entry) => !wanted || entry.folder === wanted);

      if (matches.length === 0) {
        const folders = [...new Set(registry.entries.map((entry) => entry.folder ?? '(root)'))];
        return failure(
          `No instruction files in folder "${folder}". Available folders: ${folders.join(', ')}.`,
        );
      }

      const output = {
        count: matches.length,
        files: matches.map((entry) => ({
          uri: entry.uri,
          path: entry.path,
          name: entry.name,
          description: entry.description,
          folder: entry.folder,
          sha256: entry.sha256,
        })),
      };

      const lines = [
        `# Shared instruction set${wanted ? ` — ${wanted}/` : ''} (${output.count} files)`,
        '',
        '| Path | name | Purpose |',
        '|---|---|---|',
        ...output.files.map((file) => `| \`${file.path}\` | \`${file.name}\` | ${file.description} |`),
      ];

      return { ...text(lines.join('\n')), structuredContent: output };
    },
  );

  server.registerTool(
    'agents_read_instruction',
    {
      title: 'Read one shared instruction file',
      description: `Return the full text of a single file from the shared instruction set.

Use this after agents_list_instructions has told you which file you need. Read one file at a time; do not walk the whole set.

Args:
  - instruction (string, required): the file's frontmatter name ("directory-architecture"), its path ("rules/directories.md"), or its full URI ("agents://rules/directories.md"). All three work.

Returns: the file verbatim, including its frontmatter.

Errors: if nothing matches, returns the closest available names so you can retry without listing everything again.`,
      inputSchema: {
        instruction: z
          .string()
          .min(1)
          .describe('A frontmatter name, a path, or an agents:// URI.'),
      },
      annotations: READ_ONLY,
    },
    async ({ instruction }) => {
      const entry = resolveEntry(registry, instruction);
      if (!entry) {
        const near = suggestEntries(registry, instruction);
        return failure(
          `No instruction matches "${instruction}".` +
            (near.length
              ? ` Did you mean: ${near.join(', ')}?`
              : ' Call agents_list_instructions to see what exists.'),
        );
      }

      return text(entry.text);
    },
  );

  server.registerTool(
    'mcp_creator',
    {
      title: 'Scaffold a new MCP repository',
      description: `Create a new MCP repository, complete and runnable, from one name.

Use this to start a new MCP server rather than assembling one by hand. The generated repository is dual-purpose from the first commit — a CLI bin and a server bin over one implementation — and ships:

  - package.json declaring both bins, with no build step
  - a working MCP server over stdio and streamable HTTP, one tool registered
  - a CLI with help, version, tools, and serve
  - a test asserting the two surfaces expose the same tools
  - README.md, AGENTS.md, .gitignore
  - wiki/environments/setup.md with real install and run instructions for BOTH CLI mode and server mode, generated from this repository's own names so the commands in it are the ones that work

Args:
  - name (string, required): the repository name. A scope is accepted ("@acme/weather-mcp") and is kept for the package while the bins and server id use the last segment.
  - description (string, optional): one line describing the repository.
  - directory (string, optional): where to create it. Defaults to the slug, under the working directory.
  - write (boolean, optional, default false): actually create the files. Left false, this returns the plan and touches nothing.
  - force (boolean, optional, default false): allow writing into a directory that is not empty.

Returns: the plan — package name, server id, both bin names, target directory, and every file — as markdown and as structuredContent.

**Defaults to a dry run.** Call it once to see the plan, then again with write enabled once the user has agreed to the location.`,
      inputSchema: {
        name: z.string().min(1).describe('Repository name, optionally scoped.'),
        description: z.string().optional().describe('One line describing the repository.'),
        directory: z.string().optional().describe('Target directory. Defaults to the slug.'),
        write: z.boolean().optional().describe('Create the files. Default false — plan only.'),
        force: z.boolean().optional().describe('Allow a non-empty target directory.'),
      },
      outputSchema: {
        written: z.boolean().describe('Whether the files were created'),
        packageName: z.string(),
        serverId: z.string(),
        binCli: z.string(),
        binServer: z.string(),
        target: z.string(),
        files: z.array(z.string()),
      },
      annotations: {
        // Not read-only: with write enabled it creates files. Still not
        // destructive — it refuses a non-empty target unless forced.
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, description, directory, write = false, force = false }) => {
      let plan;
      try {
        plan = scaffoldRepo({ name, description, directory });
      } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
      }

      if (write) {
        try {
          await writeScaffold(plan, { force });
        } catch (error) {
          return failure(error instanceof Error ? error.message : String(error));
        }
      }

      const output = {
        written: write,
        packageName: plan.context.packageName,
        serverId: plan.context.serverId,
        binCli: plan.context.binCli,
        binServer: plan.context.binServer,
        target: plan.target,
        files: plan.files.map((file) => file.path),
      };

      return { ...text(formatScaffold(plan, { written: write })), structuredContent: output };
    },
  );

  // Referenced so a missing procedure fails at registration rather than on the
  // first call, matching how the registry validates content at boot.
  requireEntry(registry, 'agents://prompts/agents-setup.md');
  requireEntry(registry, 'agents://rules/duplicate-instruction-audit.md');
}
