# 0.6.0

**Released:** 2026-08-21

Withdraws the `mcp_repos` tool. No change to the shared instruction set.

**Consumers must:** nothing, unless you called `mcp_repos` or the `repos` CLI command
directly — both are gone, along with the `MCP_REPOS_FILE` and `MCP_REPOS_ROOTS`
environment variables. No instruction file changed, so no rule to re-read, no trigger
row to edit, and no override to drop. If your client cached the tool list, reconnect.

## Removed

- The `mcp_repos` tool and the `repos` CLI command, with `src/tools/mcp-repos.js` and
  its test suite. The tool scanned the filesystem to find MCP repositories, but anything
  reaching this server arrived through an MCP client that already holds its own server
  list in configuration — it answered a question the caller had usually already
  answered. Nothing depended on it, and `mcp_creator` never called it.
- `MCP_REPOS_FILE` and `MCP_REPOS_ROOTS`, and the `--root` CLI flag that only the `repos`
  command used. Nothing reads them any more.

## Changed

- The tool surface is five: four read-only `agents_*` tools and `mcp_creator`.
- `test/tools.test.js` now asserts that `mcp_creator` is the **only** tool declaring
  itself non-read-only, rather than checking tools one at a time. A future tool that
  quietly starts writing fails that assertion instead of slipping past it.
- `wiki/reference/mcp-surface.md`, `wiki/environments/env.md`,
  `wiki/environments/setup.md`, and `README.md` no longer document the withdrawn surface.

## Notes

`wiki/logs/0/5/0/CHANGELOG.md` still describes `mcp_repos`. That is deliberate: it
records what `0.5.0` shipped, and a released log is never rewritten to match a later
decision.
