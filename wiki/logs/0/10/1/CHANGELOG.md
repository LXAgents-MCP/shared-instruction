# 0.10.1

**Released:** 2026-08-28

The two-sets table in `rules/shared-instructions.md` addresses the shared set as
`agents://` alone, instead of offering `{shared}` and `agents://` as alternatives in the
same cell.

**Consumers must:** nothing. `{shared}` is unchanged everywhere it is defined and used —
`AGENTS.md`, `rules/mcp-connector.md`, `rules/directories.md`, the `rules/auto-activation.md`
trigger table, and `prompts/agents-setup.md` — so the placeholder is still valid in prose
and every existing reference to it still resolves. No file was renamed, no `name` changed,
no rule was removed, and no trigger row changed, so no override needs dropping.

## Changed

- `rules/shared-instructions.md` §A — the **Shared** row of the two-sets table.

  ```
  - | **Shared** | The `lxagents-agents-base` MCP server, addressed as `{shared}` / `agents://` | …
  + | **Shared** | The `lxagents-agents-base` MCP server, addressed as `agents://` | …
  ```

  The table is read to answer "where does this live?", and it answered with two notations
  for one thing. `agents://` is the one that is real: it is the URI a client resolves,
  while `{shared}` is a prose placeholder that has to be defined elsewhere before it means
  anything. A table that is the first thing an unsure agent opens should not require a
  second lookup to be read.

## Notes for this repository

- **This narrows the table, it does not retire `{shared}`.** The placeholder keeps its
  definition in `AGENTS.md` and `rules/mcp-connector.md`, and the `rules/auto-activation.md`
  trigger table still addresses every file as `{shared}/…`. Reading this release as a
  deprecation would be reading more into it than it says — and would strand fifteen trigger
  rows.
- Line 25 of the same file keeps its `{shared}`. It is prose about what a
  repository-specific convention does once it is in the shared set, not a statement about
  how the set is addressed, so the reason for this change does not reach it.
- Not a mirror. `.agents/rules/set-mirrors.md` requires checking whether changed set text
  is reproduced outside `content/`; the string `addressed as` appears only on this line and
  in `rules/mcp-connector.md`, which is a different sentence and was left alone. Nothing
  else had to move in the same commit.
- 69 tests, unchanged and passing. The four boot invariants in `content-publishing.md` were
  never at risk — frontmatter, `name`, and the file's folder are all untouched — so the run
  confirms the change rather than clearing it.
