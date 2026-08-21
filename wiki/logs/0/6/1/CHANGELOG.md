# 0.6.1

**Released:** 2026-08-21

Documents `mcp_creator` in the connector's published surface table. No behaviour change.

**Consumers must:** nothing. This corrects what the set *says* about the server, not
what the server does. Re-read `rules/mcp-connector.md` only if you want the complete
tool list; the table there previously showed four tools when the connector has exposed
five since `0.5.0`.

## Changed

- `rules/mcp-connector.md` — the **What the server exposes** table now lists
  `mcp_creator` alongside the four `agents_*` tools. The heading claims to describe the
  connector's surface, so a table missing a tool under-reported it, and a consuming
  repository had no way to learn the capability existed. The row states plainly that the
  tool is **not part of reading this set**, so its presence does not blur what the
  connector is for, and a following line records that it is the only tool that writes —
  and only when a call asks it to.

## Notes

`wiki/reference/mcp-surface.md` carried a matching defect: it introduced the tool table
with "All are read-only, non-destructive, and idempotent" fifteen lines above a section
headed "The one tool here that is not read-only." It now distinguishes the two
correctly. That page is this repository's own documentation and is not part of the
published set, so it is fixed here rather than announced to consumers.

Both defects came from generalising a sentence that was written when every tool was
read-only, instead of re-reading it once that stopped being true.
