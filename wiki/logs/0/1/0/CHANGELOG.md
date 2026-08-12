# 0.1.0

**Released:** 2026-08-12

Adds a tool surface alongside the existing prompts and resources, so the connector is
usable in clients that enumerate a server by its tools alone.

**Consumers must:** nothing. No instruction content changed meaning, and no `name` was
renamed or removed. If your client previously showed the connector as having no tools
and would not let you enable it, reconnect and it becomes usable.

## Added

- Four read-only tools, all delivering the same content the prompts and resources
  already served:
  - `agents_setup` — the AGENTS-SETUP procedure, identical to the `agents-setup` prompt.
  - `agents_check_duplicate_instructions` — the duplicate audit with the manifest
    inlined, identical to the `check-duplicate-agents-instruction` prompt. On request
    only.
  - `agents_list_instructions` — every file with its description and content hash,
    optionally filtered to one folder, with structured output.
  - `agents_read_instruction` — one file, resolved from a frontmatter `name`, a path, or
    an `agents://` URI, with near-match suggestions on a miss.
- `src/server/payloads.js` — the procedure text, built once and shared by both surfaces
  so a repository set up through a tool receives exactly what one set up through a
  prompt receives.
- `wiki/reference/mcp-surface.md` now documents the tools.

## Changed

- `rules/mcp-connector.md` — the connector URL must include the `/mcp` path, with a note
  that omitting it surfaces as a sign-in or registration error rather than a wrong
  address. Also lists the tool surface and states that prompts and resources are
  preferred where a client exposes them.
- `initialize` instructions now name both surfaces, state that they deliver the same
  text, and repeat that the duplicate audit runs only when the user asks.
- `manifest.js` — one serializer shared by the manifest resource and the copy inlined
  into the audit, so the two are byte for byte identical.

## Fixed

- Nothing. No defect in 0.0.0; the tools close a client-compatibility gap.
