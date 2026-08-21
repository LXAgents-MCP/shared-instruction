# 0.7.0

**Released:** 2026-08-21

Renames the published package to `@lxagents-mcp/shared-instruction`, following the
repository move. The MCP connector id is unchanged.

**Consumers must:** nothing. The connector is still named `lxagents-agents-base`, so
every existing client configuration keeps resolving and no instruction file changed.
Only a repository that installs this from npm needs to know the package now lives at
`@lxagents-mcp/shared-instruction` rather than `@lxagents/agents-base`.

## Changed

- The npm package is `@lxagents-mcp/shared-instruction`, matching the repository it
  ships from. `package-lock.json` follows.
- The container image is `lxagents-mcp/shared-instruction`, in `compose.yaml` and in the
  Docker guide. Its `0.0.0` tag is unchanged — a local build placeholder that has never
  tracked the package version.
- `SERVER_TITLE` is "LXAgents Shared Instruction". Clients that render a title show the
  new one; clients that key on the id see no difference.

## Deliberately unchanged

- **`SERVER_ID` is still `lxagents-agents-base`.** It is the wire identifier every
  consuming repository names in its client configuration, and 25 files in this set
  reference it. Renaming it would have made this a major release that broke every
  connector in the organization, for a cosmetic gain. `src/constants.js` now records
  that reasoning next to the constant, so the id is not swept along by the next
  rebrand.
- **Both bins**, `lxagents-agents` and `lxagents-agents-base`, for the same reason: an
  existing client config that spawns one keeps working.
- **Everything under `content/`.** No published instruction file changed in this
  release, which is why there is nothing for consumers to re-read.
