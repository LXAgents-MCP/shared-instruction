# MCP Surface

Everything `lxagents-agents-base` exposes: prompts, resources, and tools.

Prompts and resources are the primary surface. The tools deliver the same content and
exist because some clients enumerate a connector by its tools alone — such a client
shows a prompts-and-resources-only server as "no tools available" and will not let you
enable it. Prefer prompts and resources where your client exposes them.

## Server identity

| Field | Value |
|---|---|
| `name` | `lxagents-agents-base` |
| `title` | `LXAgents Agents Base` |
| `version` | from `package.json` |

`initialize` also returns `instructions`, telling a client to route into the set rather
than read all of it, and warning that the duplicate audit runs only on request.

## Prompts

### `agents-setup`

Delivers the full AGENTS-SETUP procedure as one user message, with the connector named
as the shared set. Takes no arguments.

### `check-duplicate-agents-instruction`

Delivers the duplicate-instruction audit, with `agents://manifest.json` inlined so the
procedure's first step is already done. Takes no arguments.

Reports every finding with a verdict and waits for per-file approval before anything is
deleted.

**Neither prompt declares arguments, deliberately.** `prompts/get` may omit `arguments`
under the MCP spec, but the SDK validates whatever arrives against the declared shape,
and an object schema rejects `undefined` even when every field is optional. Declaring
arguments would make the server's primary entry point fail for spec-compliant clients
that leave them out.

## Tools

All four are read-only, non-destructive, and idempotent.

| Tool | Arguments | Returns |
|---|---|---|
| `agents_setup` | none | The AGENTS-SETUP procedure — identical to the `agents-setup` prompt. |
| `agents_check_duplicate_instructions` | none | The duplicate audit with the manifest inlined — identical to the audit prompt. **On request only.** |
| `agents_list_instructions` | `folder` (optional) | Every file with its description and `sha256`, as text and as `structuredContent`. |
| `agents_read_instruction` | `instruction` (required) | One file verbatim. Accepts a frontmatter `name`, a path, or an `agents://` URI. |

`agents_read_instruction` returns near-match suggestions when nothing resolves, and
`agents_list_instructions` names the real folders when given an unknown one, so a wrong
guess costs one call rather than a full listing.

The two zero-argument tools declare no input schema, for the same reason the prompts
declare none — see the note below.

## Resources

All markdown resources are `text/markdown`; the manifest is `application/json`.

### `agents://manifest.json`

Every file with its `uri`, `path`, `name`, `description`, `folder`, `bytes`, and
`sha256`. Deterministic — no timestamp, entries sorted by path — so a client can cache
and diff it.

`sha256` is taken over the body **after** normalization and **excluding** frontmatter:
strip frontmatter, convert CRLF to LF, strip trailing whitespace from each line, trim
leading and trailing blank lines. The manifest states this so a consumer can reproduce
a hash exactly rather than guess at it.

### Instruction files

| URI | `name` |
|---|---|
| `agents://AGENTS.md` | `shared-agents-entry-point` |
| `agents://index/root-index.md` | `shared-root-index` |
| `agents://index/instructions-index.md` | `shared-instructions-index` |
| `agents://index/logs-index.md` | `shared-logs-index` |
| `agents://rules/directories.md` | `directory-architecture` |
| `agents://rules/shared-instructions.md` | `shared-instructions` |
| `agents://rules/auto-activation.md` | `auto-activation` |
| `agents://rules/mcp-connector.md` | `mcp-connector-resolution` |
| `agents://rules/no-session-links.md` | `no-session-links` |
| `agents://rules/change-propagation.md` | `change-propagation` |
| `agents://rules/discovery-protocol.md` | `discovery-protocol` |
| `agents://rules/duplicate-instruction-audit.md` | `duplicate-instruction-audit` |
| `agents://rules/memory-policy.md` | `memory-policy` |
| `agents://rules/versioning.md` | `versioning-rules` |
| `agents://git/branching-strategy.md` | `branching-strategy` |
| `agents://git/commit-conventions.md` | `commit-conventions` |
| `agents://git/pull-request-template.md` | `pull-request-template` |
| `agents://planning/task-workflow.md` | `task-workflow` |
| `agents://prompts/agents-setup.md` | `agents-setup-prompt` |
| `agents://prompts/branch-and-commit.md` | `branch-and-commit-prompt` |
| `agents://creators/instruction-creator.md` | `instruction-creator` |
| `agents://creators/information-creator.md` | `information-creator` |
| `agents://creators/index-creator.md` | `index-creator` |
| `agents://creators/memory-creator.md` | `memory-creator` |
| `agents://creators/changelog-creator.md` | `changelog-creator` |

Each is listed with a `description` short enough to route on without opening the body.
That is the point of the index tree, enforced at the protocol layer.

## HTTP endpoints

Present on the streamable HTTP transport only.

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/mcp` | JSON-RPC. The MCP endpoint. |
| `GET` | `/mcp` | SSE stream — stateful mode only; `405` otherwise. |
| `DELETE` | `/mcp` | Terminate a session — stateful mode only; `405` otherwise. |
| `GET` | `/healthz` | Liveness: pid and uptime. |
| `GET` | `/readyz` | Readiness: `200` once content is loaded, `503` otherwise. |
| `GET` | `/` | Server name, version, session mode, resource count. |

`/mcp` is configurable with `MCP_PATH`.

## Error responses

| Condition | Status | JSON-RPC code |
|---|---|---|
| Malformed JSON body | 400 | -32700 |
| Missing `mcp-session-id` on a non-initialize request (stateful) | 400 | -32000 |
| Unknown or expired session | 404 | -32001 |
| `GET`/`DELETE` in stateless mode | 405 | -32000 |
| Origin or host not allowed | 403 | -32600 |
| At session capacity | 503 | -32000 |
| Unhandled failure | 500 | -32603 |
