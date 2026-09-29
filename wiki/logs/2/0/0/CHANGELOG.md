# 2.0.0

**Released:** 2026-09-29

Every file in the shared set is now its own tool. There is no `path` argument, no
registry to look up, and no list to fall out of step with the set — adding a file to
`content/` adds its tool, and that is the whole mechanism.

Major, because **every published tool name changes**, **the connector id changes**, and one
tool is removed. A repository that ignores this keeps calling names that no longer exist,
under an id the server no longer answers to.

**Consumers must:** rename every tool you call, **and rename the connector in your client
configuration** — `lxagents-agents-base` → `lxagents-shared-instruction`. The tool mapping
is in **Removed** below. The four mandatory conventions keep their names except one —
`commit_strategy` is now `commit_conventions` — and nothing else you rely on was dropped,
because each of those procedures is a file, and every file is a tool.

## The connector id

`lxagents-agents-base` is now **`lxagents-shared-instruction`**, matching the repository
and the npm package. The old name survived two earlier renames on the theory that every
consuming repository names it in configuration, so changing it is pure cost — but that
reasoning holds only while the name is wrong for the thing it names, and it has been wrong
since `0.7.0`. The cost is one edit per consumer, paid once.

The **bin** changed with it, for coherence: `package.json` exposes one executable and it
now matches the server it starts. Anyone invoking `lxagents-agents-base` directly rather
than through `npx @lxagents-mcp/shared-instruction` has a second thing to update.

## Added

- **Thirty-one tools, one per file**, generated at boot by `src/tools/from-content.js`.
  A name is derived from the path — folder stripped, `.md` dropped, kebab to snake — so
  `creators/plan-creator.md` is `plan_creator` and `git/branching-strategy.md` is
  `branching_strategy`. The one exception is `AGENTS.md`, which would derive to `agents`
  and is `agents_entry_point`.

- **A description on every tool**, taken verbatim from that file's own frontmatter
  `description`. It is the only text a client reads before deciding to call, so it now has
  to be routing information rather than a summary. A description that stops routing well
  is a regression, and it lives in the file you already own.

- **Boot-time validation**, so a malformed set fails the process rather than surfacing as
  a wrong answer to the first caller that needed the file. The server refuses to start on
  a derived name that is not a valid MCP identifier, on two files claiming one name, on a
  file with no frontmatter `description`, or on an empty set. A name collision names both
  files; it is resolved with an explicit override, never by renaming a file to fit.

- **A `Dockerfile`**, for hosts that cannot run Node 20. Single stage on `node:22-alpine`,
  `npm ci --ignore-scripts --omit=dev` from the lockfile, ending as `USER node`. It is a
  way to pin the toolchain, **not a deployment**: there is no `EXPOSE`, no service, and no
  compose file, because stdio is a pipe and not a port. Run it with `docker run -i` — the
  flag is not optional, and without it the server sees closed stdin and exits.

## Changed

- **The `initialize` instructions** describe the routing model in terms of the real
  surface: call nothing at session start, start at `root_index`, call the one tool whose
  trigger fired.

- **`rules/auto-activation.md`** is rebuilt around the per-file table. The old
  "trigger table for everything without a tool" is now "for the rest of the set", and
  every row in it is a tool call.

- **Every local rule, wiki page, and index in this repository** that described the
  previous surface — 13 tools, MCP prompts, `agents://` resources, an `lxagents-agents`
  CLI, a streamable-HTTP transport, a Render deployment, and twelve environment variables
  — has been corrected or rewritten. Several were wholesale fiction with a few true
  sentences, so they were rewritten rather than patched. None of the removed surfaces was
  reachable on `master`; the documentation was the only thing that still described them.

- **Adding a file to `content/` is now a one-file change.** It becomes a tool on the next
  boot. There is no tool list to edit and no source file to touch. Renaming or deleting a
  file remains a breaking change, and now a visibly one.

## Removed

- **Every previously published tool name.** A repository's `AGENTS.md` must be updated:

  | `1.0.0` | `2.0.0` |
  |---|---|
  | `task_workflow` | `task_workflow` *(unchanged)* |
  | `discovery_protocol` | `discovery_protocol` *(unchanged)* |
  | `branch_strategy` | `branching_strategy` |
  | `commit_strategy` | `commit_conventions` |
  | `pull_request_strategy` | `pull_request_template` |
  | `agents_model_naming_convention` | `model_naming_convention` |
  | `setup_shared_agents_instruction` | `agents_setup` |
  | `update_shared_agents_instruction` | `agents_update` |
  | `check_duplicate_shared_agents_instruction` | `duplicate_instruction_audit` |
  | `list_shared_agents_instruction` | `mcp_list` *(different file — see below)* |
  | `read_shared_agents_instruction` | *(none — call the tool for the file you want)* |
  | `agents_model_name_format` | *(none)* |
  | `mcp_creator` | *(none)* |

  `mcp_list` and `server_registry` both serve `index/server-registry.md`. That duplication
  is deliberate and stays.

- **`agents_model_name_format`**, the only tool that computed rather than returned text.
  It applied `rules/model-naming-convention.md`'s rule — lowercase both segments, join with
  one `/` — and that rule is still published, as `model_naming_convention`. A tool that
  derived an answer from a rule is a second copy of the rule, and it was the one mirror in
  this repository that no list tracked. Read the convention and apply it.

- **`mcp_creator`**, gone with the rest of the dual-purpose build in `0.6.0`'s aftermath;
  nothing here replaces it, and nothing depended on it that was not already documented as
  withdrawn.

## The security note

Removing the `path` argument is the point of this release, and it is a structural change
rather than a checked one. A caller has nothing to traverse with, so path traversal is not
defended against — it is **unrepresentable**. The one read in the server that still takes
a path (`readSetFile`, reached by `mcp_list` with a constant) keeps its
`isSafeRelativePath` check, which is now belt-and-braces rather than the primary guard.

Nothing was served short to achieve this. The suite pins that the total text across all
tools equals the total bytes on disk, and that files and tools are a bijection in **both**
directions — 227,188 characters, 32 tools, zero taking an argument.
