/**
 * The tool surface.
 *
 * Prompts and resources are the correct primitives for an instruction set, but
 * several clients enumerate a connector by its tools alone: a server exposing
 * only prompts and resources shows up as "no tools available" and cannot be
 * enabled at all. The read-only tools here are the compatibility layer that
 * makes the set reachable there.
 *
 * They add no content. The procedure tools return exactly what the matching
 * prompt returns (`payloads.js`), and the access tools read the same frozen
 * registry the resources do.
 *
 * **One convention, one tool.** Until 1.0.0 a single `agents_auto_activation`
 * returned the activation rule, four whole instruction files and a routing
 * table — about 31,000 characters, charged to every session before the request
 * was known. It is gone. Each convention is now its own call, and which of them
 * a repository uses is declared in that repository's own `AGENTS.md` rather
 * than fixed here. Nothing is called at session start.
 *
 * `agents_model_name_format` is the one read-only tool that computes rather than
 * returns. It applies the published naming convention instead of reprinting it,
 * so an integration gets one answer rather than re-deriving the rule at every
 * call site — but its text still lives in `content/`, not here.
 *
 * On argument schemas: the SDK validates `tools/call` arguments against the
 * declared shape and an object schema rejects `undefined`, exactly as it does
 * for prompts. The risk profile differs, though — a tool is called by a model
 * that has the schema in hand and emits an arguments object, whereas a prompt is
 * invoked by a person clicking a button with nothing to send. So the
 * zero-argument tools declare no schema at all, and the ones that take
 * arguments declare one.
 */

import { z } from 'zod';

import { AUTO_ACTIVATION_URI, CONVENTION_TOOLS, MANDATORY_TOOLS } from '../constants.js';

import {
  buildAuditPayload,
  buildConventionPayload,
  buildSetupPayload,
  buildUpdatePayload,
  requireEntry,
} from './payloads.js';
import { resolveEntry, suggestEntries } from '../content/resolve.js';
import { formatScaffold, scaffoldRepo, writeScaffold } from '../tools/mcp-creator.js';
import { formatModelName } from '../tools/model-name.js';

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
 * How each convention tool presents itself, keyed by the names `constants.js`
 * pins. Prose about the *tool*; the convention's own text stays in `content/`.
 *
 * `lead` is the imperative line the payload opens with, and it matters more
 * than it looks: a model that fetched a procedure and did not act on it is the
 * failure `auto-activation.md` calls activation running while the workflow does
 * not.
 */
const CONVENTION_PROSE = Object.freeze({
  task_workflow: {
    title: 'Read the task workflow',
    lead: 'Follow the workflow below for this request, starting with the intake in §A.',
    description: `Return the task workflow: intake, the plan gate, the reserved record and release slots, one branch per task stacked in order, and the pull request and merge gates.

Call this when a request needs more than one step — before planning it, not after. It is the authority for how a request becomes tasks, and it is one of the four tools every repository declares.

Takes no arguments.

Returns: the full procedure as markdown, roughly 11,500 characters, §A through §F.

**It does not carry the gates, it explains them.** Approving the plan, asking before a pull request, and asking before merging stand from the first message of the session, written inline in your repository's AGENTS.md. If they are not there, that is a defect to report — not a reason to skip them until this call.`,
  },
  branch_strategy: {
    title: 'Read the branching strategy',
    lead: 'Name and create the branch for this task according to the rules below.',
    description: `Return the branching strategy: \`{type}/{primary-noun}\` naming, the allowed types, one task per branch, and how branches stack in dependency order.

Call this before creating a branch. One of the four tools every repository declares.

Takes no arguments.

Returns: the full convention as markdown, roughly 2,300 characters, with worked good and bad examples.

Note what it forbids, because a harness commonly supplies exactly these: tool-preset prefixes such as \`claude/\` or \`codex/\`, generated suffixes, and session identifiers. A branch name handed to you by your tooling does not outrank this convention.`,
  },
  commit_strategy: {
    title: 'Read the commit conventions',
    lead: 'Write this commit message according to the conventions below.',
    description: `Return the commit conventions: Conventional Commits for commit messages, the subject and body rules, granularity, and what must ride in the same commit.

Call this before writing a commit message. One of the four tools every repository declares.

Takes no arguments.

Returns: the full convention as markdown, roughly 2,200 characters, with a worked example.

Two rules are easy to miss: index and memory updates ship in the **same** commit as the change they describe, and a session trailer your tooling appends must be stripped before the commit lands. Pull request titles use a different format — see \`pull_request_strategy\`.`,
  },
  discovery_protocol: {
    title: 'Read the discovery protocol',
    lead: 'Handle the finding below according to this protocol. Propose it; do not apply it.',
    description: `Return the discovery protocol: how to handle a rule you think should exist — propose it, never write it into either set yourself — plus how to choose the target set and what counts as a finding.

Call this when you notice something that ought to be a rule. One of the four tools every repository declares.

Takes no arguments.

Returns: the full protocol as markdown, roughly 4,500 characters, §A through §F.

**The gate itself does not wait for this call.** Its canonical block is written inline in your repository's AGENTS.md precisely because this trigger fires only once you have recognised a finding — the moment at which writing the rule yourself is one edit away. This call supplies the rest of the procedure.`,
  },
  pull_request_strategy: {
    title: 'Read the pull request conventions',
    lead: 'Write this pull request title and body according to the template below.',
    description: `Return the pull request conventions: human-readable titles and the required body sections.

Call this before opening or updating a pull request — after the user has said yes to opening one, which is a separate gate this does not satisfy.

Takes no arguments.

Returns: the full template as markdown, roughly 2,900 characters.

Pull request titles are **not** Conventional Commits: \`feat:\` belongs on a commit, never on a pull request title. No session link and no generated-by footer carrying one.`,
  },
  agents_model_naming_convention: {
    title: 'Read the model naming convention',
    lead: 'Apply the convention below to every model identifier this repository stores, on every platform it integrates.',
    description: `Return the convention every stored model identifier follows: \`{platform}/{model}\`, lowercased before the write.

Call this before adding a platform, storing an embedding, or writing anything into a model_name column — and when adding multi-platform support, so a direct API integration and a gateway such as OpenRouter produce the same string for the same model rather than two names nothing downstream can compare.

Takes no arguments.

Returns: the full rule as markdown, ending in the four-point checklist a stored name must satisfy.

Call \`agents_model_name_format\` to build a compliant name instead of assembling one by hand.`,
  },
});

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {Readonly<object>} registry
 * @param {string} version
 */
export function registerTools(server, registry, version) {
  // One registration per convention. A name in CONVENTION_TOOLS without prose
  // here throws at boot rather than publishing a tool with no description,
  // which several clients will not surface at all.
  for (const { name, uri } of CONVENTION_TOOLS) {
    const prose = CONVENTION_PROSE[name];
    if (!prose) throw new Error(`convention tool has no description: ${name}`);
    // Fails now, not on the first call, if content/ moved underneath it.
    requireEntry(registry, uri);

    server.registerTool(
      name,
      { title: prose.title, description: prose.description, annotations: READ_ONLY },
      async () => text(buildConventionPayload(registry, uri, prose.lead)),
    );
  }

  server.registerTool(
    'setup_shared_agents_instruction',
    {
      title: 'Set up the agent instruction system',
      description: `Return the full AGENTS-SETUP procedure for the current repository.

Use this when asked to set up, adopt, scaffold, or re-write a repository's agent instruction system. The procedure is the authority — follow it start to finish rather than summarising it, and obey its instruction to ask the user before writing files.

Takes no arguments.

Returns: the complete procedure as markdown, roughly 28,000 characters, prefixed with the connector's current version — §4.1(d) has you write that version into the repository's Shared instruction tools block, and it is what \`update_shared_agents_instruction\` later reads back.

Equivalent to the \`agents-setup\` prompt; use the prompt instead if your client exposes prompts.`,
      annotations: READ_ONLY,
    },
    async () => text(buildSetupPayload(registry, version)),
  );

  server.registerTool(
    'update_shared_agents_instruction',
    {
      title: 'Update this repository against the shared set',
      description: `Return what this repository must do to move from the shared-set version it adopted to the current one: the Consumers must line for every release since, oldest first, plus the re-sync procedure.

Use this ONLY when the user asks to update, re-sync, or adopt a newer version of the shared instruction set. It edits AGENTS.md, so never call it on your own initiative, never as part of session start, and never because you noticed a version difference — note it, finish the task, and mention it at the end.

Args:
  - from_version (string, optional): the value on the \`Adopted shared-set version:\` line in this repository's AGENTS.md. Accepts 1.0.0 or 1/0/0.

Returns: with a version, the delta — every release newer than it, oldest first, because the lines compose and applying a newer one first leaves an older edit silently unmade. Without one, the re-sync path instead: the current state to reconcile against, with no history. Read the stamp before calling; passing nothing when a stamp exists throws away the reasons things changed.

Errors: refuses a value that is not a version. A stamp ahead of this connector is reported rather than applied.`,
      inputSchema: {
        from_version: z
          .string()
          .optional()
          .describe('The Adopted shared-set version from this repository\'s AGENTS.md, e.g. "0.14.0".'),
      },
      annotations: READ_ONLY,
    },
    async ({ from_version: fromVersion }) => {
      try {
        return text(buildUpdatePayload(registry, version, fromVersion ?? null));
      } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
      }
    },
  );

  server.registerTool(
    'check_duplicate_shared_agents_instruction',
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
    'list_shared_agents_instruction',
    {
      title: 'List the shared instruction files',
      description: `List every file in the shared instruction set, with the description to route on and the content hash to compare against.

Use this to discover what exists before reading anything — one call instead of opening files to find out what they cover. Route on the descriptions, then read only what you need with read_shared_agents_instruction.

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
    'read_shared_agents_instruction',
    {
      title: 'Read one shared instruction file',
      description: `Return the full text of a single file from the shared instruction set.

Use this after list_shared_agents_instruction has told you which file you need. Read one file at a time; do not walk the whole set.

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
              : ' Call list_shared_agents_instruction to see what exists.'),
        );
      }

      return text(entry.text);
    },
  );

  server.registerTool(
    'agents_model_name_format',
    {
      title: 'Build a compliant model name',
      description: `Compose a stored model identifier from a platform and that platform's own model id, applying the naming convention: lowercase both, join with a single "/".

Use this at every call site that writes a model_name, on a direct API integration as much as on a gateway route — one platform means one spelling only if the same function produces it. Read agents_model_naming_convention first if you need the reasoning.

Args:
  - platform (string, required): the provider, e.g. "OpenAI". One segment, no "/".
  - platform_model (string, required): that provider's own identifier, e.g. "text-embedding-3-small". No platform prefix.

Returns: { model_name, platform, model, normalized } — normalized is true when trimming or lowercasing changed what you passed.

Errors: refuses a blank segment, and refuses a platform_model that already carries its platform prefix rather than silently doubling it.`,
      inputSchema: {
        platform: z.string().min(1).describe('The provider, e.g. "openai". One segment, no "/".'),
        platform_model: z
          .string()
          .min(1)
          .describe('The provider\'s own model id, e.g. "text-embedding-3-small". No prefix.'),
      },
      outputSchema: {
        model_name: z.string().describe('The value to store, {platform}/{model}, lowercased'),
        platform: z.string().describe('The normalized platform segment'),
        model: z.string().describe('The normalized model segment'),
        normalized: z.boolean().describe('Whether trimming or lowercasing changed the input'),
      },
      annotations: READ_ONLY,
    },
    async ({ platform, platform_model: platformModel }) => {
      let composed;
      try {
        composed = formatModelName({ platform, platformModel });
      } catch (error) {
        return failure(error instanceof Error ? error.message : String(error));
      }

      const output = {
        model_name: composed.modelName,
        platform: composed.platform,
        model: composed.model,
        normalized: composed.normalized,
      };

      const lines = [
        output.model_name,
        '',
        output.normalized
          ? 'Normalized from the values given. Store this string as it stands — the convention lowercases before the write, not on read.'
          : 'The values given were already normalized. Store this string as it stands.',
      ];

      return { ...text(lines.join('\n')), structuredContent: output };
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
  - directory (string, optional): where to create it, relative to the working directory. Defaults to the slug. It must resolve inside the working directory — a path that climbs out of it is refused.
  - write (boolean, optional, default false): actually create the files. Left false, this returns the plan and touches nothing.
  - force (boolean, optional, default false): allow writing into a directory that is not empty.

Returns: the plan — package name, server id, both bin names, target directory, and every file — as markdown and as structuredContent.

**Defaults to a dry run.** Call it once to see the plan, then again with write enabled once the user has agreed to the location.`,
      inputSchema: {
        name: z.string().min(1).describe('Repository name, optionally scoped.'),
        description: z.string().optional().describe('One line describing the repository.'),
        directory: z
          .string()
          .optional()
          .describe('Target directory, inside the working directory. Defaults to the slug.'),
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
        // `root` pins the target inside the working directory. The CLI may
        // scaffold anywhere the operator names; a model filling in this
        // argument may not.
        plan = scaffoldRepo({
          name,
          description,
          directory,
          root: process.cwd(),
          sharedSetVersion: version,
        });
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
  requireEntry(registry, 'agents://prompts/agents-update.md');
  requireEntry(registry, AUTO_ACTIVATION_URI);

  // The four every repository declares must exist as tools, not merely as
  // content. Dropping one from CONVENTION_TOOLS would otherwise leave
  // auto-activation.md promising a call nothing publishes.
  const published = new Set(CONVENTION_TOOLS.map((tool) => tool.name));
  for (const name of MANDATORY_TOOLS) {
    if (!published.has(name)) throw new Error(`mandatory tool is not published: ${name}`);
  }
}
