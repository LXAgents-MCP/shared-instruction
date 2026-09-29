# Connect a Repository

How to put a repository onto the shared instruction set.

## 1. Add the connector

The server is **stdio only**, so this is a local command:

```json
{
  "mcpServers": {
    "lxagents-agents-base": {
      "command": "npx",
      "args": ["-y", "@lxagents-mcp/shared-instruction"]
    }
  }
}
```

To run it from a checkout instead, point `command: node` at `src/index.js` with `cwd` set
to the clone — the full procedure, including where to put the clone, is in
[Install as a local MCP server](install-as-local-mcp.md).

There is no remote form. A client configured with a URL is pointed at nothing this package
provides, because `src/index.js` connects a stdio transport and nothing else.

**Registering does not reach a running session.** A client loads its connector list at
session start, so a server added mid-session reports healthy and is still absent from the
tool surface until the session restarts. That is the most common cause of "the connector
is not resolving", and it looks like a broken server rather than a stale session.

## 2. Run the setup procedure

Call the **`agents_setup`** tool in the repository you are adopting. It delivers the whole
procedure as one message: discovery, the batched question round, the instruction-set
selection, then the files.

It asks before writing anything — license, initial version, project intent — and never
invents an answer.

## 3. What you end up with

```
AGENTS.md                     entry point + connector bootstrap
                              + the Shared instruction tools block
README.md                     overview only
LICENSE
.agents/
  index/                      root, agents, agent-wiki, project-wiki, memory, logs
  rules/repository.md         this repository's own rules
  wiki/context/repository-map.md
  memory/state/…  memory/tasks/…
wiki/
  information/…  environments/…
  logs/{Major}/{Minor}/{Patch}/CHANGELOG.md
```

What you do **not** end up with: any copy of `git/`, `planning/`, `prompts/`, or
`creators/`. Those are served. A copy would override the shared original by `name` and
then go stale.

## 4. If the repository already has an `.agents/` tree

Do not merge it by hand. Call **`duplicate_instruction_audit`**, which:

1. Compares every local instruction file against the set — by `name` first, since that is
   the override key, then by content.
2. Classifies each as an exact duplicate, a stale copy, a declared override, or local-only.
3. Reports each with a verdict and waits.
4. Deletes only what you approve, removing the index rows in the same commit.

It runs only when you call it. It never deletes memory, wiki pages, indexes, or
`repository.md`.

## 5. Verify

Ask the agent to confirm:

- `AGENTS.md` carries the connector bootstrap block from
  `content/rules/mcp-connector.md` verbatim. That block is what every consuming
  repository pastes, so it is worth diffing against the current set rather than trusting an
  older copy.
- `AGENTS.md` declares the **four mandatory tools** in its Shared instruction tools block —
  `task_workflow`, `branching_strategy`, `commit_conventions`, `discovery_protocol` — and
  carries the three permission gates **inline**, not deferred to a tool.
- **Every tool name in that block is one the connector actually publishes.** Tool names
  are derived from filenames, so a block copied from an older set will name tools that no
  longer exist. Enumerating `tools/list` and diffing is the check.
- No `INDEX.md` exists anywhere.
- The override table in `.agents/index/root-index.md` is present — empty is a valid and
  meaningful state.
- Nothing served by the connector exists as a local file.

## When the connector is unavailable

The agent should say so plainly, in its first message, and name which conventions it could
not read. It must not reconstruct the missing rules from memory, and must not clone or
paste the shared set in as a workaround.

## Related pages

- [Install as a local MCP server](install-as-local-mcp.md) — running it from a clone
  under `./mcps/`.
- [Overview](../information/overview.md)
- [MCP surface](../reference/mcp-surface.md)
