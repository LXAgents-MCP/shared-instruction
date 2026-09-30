# 3.2.0

**Released:** 2026-09-30

`mcp_list` now routes through an explicit user selection instead of returning a table and
stopping. `content/index/server-registry.md` already argued that adding a connector to a
repository "belongs to the person who owns it" — but it argued it as an observation, and
nothing in the text told a calling agent to stop and ask. The decision was left to that
agent's defaults, which is not a gate. The file now carries one, and it also names the
organisations the servers are published in. The surface is **33 tools**, unchanged: no file
was added, renamed, or removed.

**Consumers must:** nothing in your `AGENTS.md` — no tool is renamed, removed, or added.
Re-read `server_registry`, or call `mcp_list`, if you add servers to a repository, because
the text it returns now instructs the calling agent to report the whole list and to ask
before cloning.

## Added

- **A selection and permission gate in `content/index/server-registry.md`.** Three
  numbered steps: report the whole list to the user, ask which they want, and ask again
  before cloning. Followed by the clause that makes the third step real — **silence is not
  permission**, and neither is a request that happened to name a server. "Add the Roblox
  servers" tells a caller *which*; it does not tell it to clone, and those are two separate
  gates because only the second writes to the user's disk. Permission already given, for
  the task or as a standing instruction, counts as the yes, and is not asked for twice.

  **The gate is text, not mechanism, and that is deliberate.** `mcp_list` is a pure
  `readFile` against `content/` — no config writer, no filesystem write, and no place to
  block on a caller since the SSE session map was replaced by a stateless `POST /mcp`. It
  also cannot prompt: MCP elicitation would need a dependency and a client that renders it,
  neither of which exists here. So the instruction lives in the returned text and the
  calling agent is the thing that honours it — the same pattern `auto-activation.md` uses
  for its inline gates. **Enforcement is by test, not by code.**

- **A *Where these servers are published* table.** The three LXAgents organisations on both
  forges: `LXAgents-MCP`, `RBAgents-MCP`, and `MCAgents-MCP`, each at
  `https://github.com/{org}` and `https://gitlab.com/{org}`. The file closes by saying the
  organisations may hold more than the table above and that the org pages are the index —
  so six URLs and three known servers are not presented as one list.

- **Four tests.** The org URLs are asserted at the **organisation** level, never the
  repository level; one test pins the gate's five phrases; one pins the self-reference
  guard and the "already connected" warning against the new table displacing them.

## Changed

- **`src/tools/mcp-list.js` — description only.** The handler was already a correct file
  read, and `content-publishing.md` says to change the file rather than the surface. The
  description now names the publishing organisations and the gate, and keeps the literal
  phrase `before cloning` that an existing test asserts on.

- **`content/index/server-registry.md` — frontmatter `version:` 1.0.0 → 1.1.0.** The
  `name:` is deliberately unchanged, so a local override keyed on it keeps matching. The
  `description:` now names the selection step, since a description is the only text a
  client reads before deciding whether to call.

- **The *Suggested, not installed* section is folded into the gate.** It said `mcp_list`
  "does not clone a server, does not write a configuration file, and does not choose for
  you" — all true, and all of it passive. Those clauses are now the opening of the
  *Before you add anything* section, where they are followed by what the caller must do.

## Notes for reviewers

- **MCAgents-MCP has no server rows.** No repository list for it is known, so none was
  invented. A guessed row in the *Use it in* column would be worse than an absent one,
  because that column is what a caller trusts to choose correctly. Add the rows when the
  repositories exist; the org table already points there.
- **The self-repository is still unnamed.** The org table includes `LXAgents-MCP`, and a
  test asserts the served text never contains `LXAgents-MCP/shared-instruction` — a full
  clone URL for the set the caller already resolves would invite exactly the vendoring the
  connector exists to prevent. Org URLs carry no repository segment, so they pass.
- **One assertion was rewritten, not worked around.** The gate tests first matched the raw
  served text; the file is hard-wrapped, so the clone-gate phrase straddled a line break and
  failed. Loosening the regex would have made the test pass on a reword and fail on a
  rewrap — backwards. Whitespace is collapsed before matching, so only wording is
  load-bearing.
