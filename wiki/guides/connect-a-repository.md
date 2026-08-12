# Connect a Repository

How to put a repository onto the shared instruction set.

## 1. Add the connector

**Remote** — the normal case:

1. Open **Settings → Connectors → Add custom connector**.
2. Name it `lxagents-agents-base`.
3. Set the URL to the deployed server's MCP endpoint, **including the `/mcp` path**:
   `https://<host>/mcp`.

If the connector fails with a sign-in or registration error, check the path before
anything else. A URL without `/mcp` reaches a route that speaks no MCP, and clients
read that failure as "this server must need authentication".

**Local over stdio** — for working on the instruction set itself:

```json
{
  "mcpServers": {
    "lxagents-agents-base": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/path/to/mcp-server"
    }
  }
}
```

## 2. Run the setup prompt

Invoke the **`agents-setup`** prompt in the repository you are adopting — or call the
**`agents_setup`** tool if your client surfaces tools rather than prompts. They deliver
identical instructions. It runs the
whole procedure: discovery, the batched question round, the instruction-set selection,
then the files.

It asks before writing anything — license, initial version, project intent — and never
invents an answer.

## 3. What you end up with

```
AGENTS.md                     entry point + connector bootstrap + trigger table
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

Do not merge it by hand. Invoke **`check-duplicate-agents-instruction`** (or the
**`agents_check_duplicate_instructions`** tool), which:

1. Compares every local instruction file against the manifest — by `name` first, since
   that is the override key, then by content hash, then by path.
2. Classifies each as an exact duplicate, a stale copy, a declared override, or
   local-only.
3. Reports each with a verdict and waits.
4. Deletes only what you approve, removing the index rows in the same commit.

It runs only when you invoke it. It never deletes memory, wiki pages, indexes, or
`repository.md`.

## 5. Verify

Ask the agent to confirm:

- `AGENTS.md` carries the connector bootstrap block verbatim.
- No `INDEX.md` exists anywhere.
- The override table in `.agents/index/root-index.md` is present — empty is a valid and
  meaningful state.
- Nothing served by the connector exists as a local file.

## When the connector is unavailable

The agent should say so plainly and continue on the repository's local set alone. It
must not reconstruct the missing rules from memory, and must not clone or paste the
shared set in as a workaround.

## Related pages

- [Overview](../information/overview.md)
- [MCP surface](../reference/mcp-surface.md)
