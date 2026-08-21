# 0.5.0

**Released:** 2026-08-21

Makes the task and git workflow apply to every request without a trigger phrase, adds a
permission gate before opening a pull request, and turns this repository into a
dual-purpose package that serves the set as a CLI as well as an MCP server.

**Consumers must:** re-read `rules/shared-instructions.md` — it has a new section H —
and `planning/task-workflow.md`. Two things change how you work: the task workflow,
branching strategy, and commit conventions now load on **every** request rather than on
a trigger row, and **opening a pull request now requires the user's permission**, on the
same terms as merging. No file was renamed, no `name` changed, and no rule was removed,
so no override needs dropping and no `AGENTS.md` trigger row needs editing.

## Added

- `rules/shared-instructions.md` §H — the always-on mandate. States that the procedure
  applies to every request with no trigger phrase and no opt-in, names the three
  mandatory standard files, and carries the two permission gates. It is a mandate and a
  router, not a procedure: each clause points at the file that owns it, so branching,
  commits, and the workflow keep a single source of truth rather than being restated in
  a second place that will drift.
- `planning/task-workflow.md` §F — a pull request permission gate beside the merge gate
  that already existed. Both accept permission the user has already given, for the task
  or as a standing instruction, so neither becomes a ritual.
- `planning/task-workflow.md` §A — refine, then plan, then execute. Restating a request
  is not refining it: name what will change, what will not, and what you are assuming
  where the request is silent, before anything runs or is written.
- `rules/auto-activation.md` — names the three files that load on every request rather
  than on a trigger row, and points at §H for the mandate behind them.
- `AGENTS.md` (the federation contract) — a short pointer section, so the mandate is
  reachable from the contract every consuming repository already relies on.

## Changed

- Every reference to the repository slug now reads `LXAgents-MCP/shared-instruction`,
  following the repository move. This touches prose only — no `name`, no path, and no
  `agents://` URI changed, so nothing a consumer routes on is affected.
- `planning/task-workflow.md` and `rules/shared-instructions.md` carry new frontmatter
  descriptions naming what they now cover.

## Notes for this repository

Not part of the published set, but shipped in the same release:

- The package is now dual-purpose. `lxagents-agents` is a CLI over the same frozen
  registry the MCP surface reads; `lxagents-agents-base` is unchanged for existing
  client configurations. The boot sequence moved to `src/server/run.js` so both entry
  points start one server rather than two implementations that drift, and identifier
  resolution moved to `src/content/resolve.js` so a name that resolves in one surface
  resolves in the other. Tests pin that as an invariant: every file, both procedures,
  and the manifest must come back identical through either surface.
- Two new tools, each reachable from MCP and from the CLI. `mcp_repos` discovers MCP
  repositories from a registry file or a filesystem scan — offline, at call time, since
  the set of repositories changes far more often than this server is released. It
  returns a shortlist rather than a winner. `mcp_creator` scaffolds a new dual-purpose
  MCP repository, and every repository it creates ships a `wiki/environments/setup.md`
  documenting installation for both CLI mode and server mode, generated from that
  repository's own names. It plans by default and writes only when asked.
- `mcp_creator` is the first tool here that is not read-only, and says so in its
  annotations. It is still non-destructive: it refuses a target directory that is not
  empty unless forced.
- `wiki/environments/setup.md` now documents both modes separately, and the local
  stdout rule records the CLI carve-out — stdout is still the JSON-RPC channel
  everywhere except `src/cli/output.js`.
- Tests went from 46 to 73.
