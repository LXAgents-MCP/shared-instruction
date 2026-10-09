---
name: mcp-builder
description: How to build an MCP server that is actually usable — the four phases from research to evaluations, the transport and handshake decisions, tool declarations with schemas and annotations, and the design mistakes that make a server slow or unusable. Read before writing or reviewing an MCP server.
---

# MCP Builder

An MCP server is a **narrow contract** with a wide failure surface. The protocol itself is
small — tools, resources, and prompts over JSON-RPC — and most of the difficulty is in the
two things it does *not* do: there is no discovery beyond what you declare, and there is no
state model. Everything below is either how to use the contract well, or a specific way a
real server breaks.

**This page is about building a server.** What this workspace does when one is *handed to
it* — recorded as a page, never installed — is a different subject, and it is
[`mcp-server.md`](mcp-server.md).

---

# Phase 1 — Research and planning

## Design decisions worth making deliberately

**API coverage versus workflow tools.** Balance comprehensive endpoint coverage against
specialised workflow tools. Workflow tools are more convenient for a specific task;
comprehensive coverage gives an agent the freedom to compose operations it was not
anticipated. Performance varies by client — some benefit from code execution that combines
basic tools, others work better with higher-level workflows. **When uncertain, prioritise
comprehensive API coverage.**

**Tool naming and discoverability.** Clear, descriptive names help an agent find the right
tool quickly. Use a consistent prefix (`github_create_issue`, `github_list_repos`) and
action-oriented naming. A name without a verb — `files`, `search`, `config` — produces
ambiguous calls; `search_files`, `read_file`, `list_config` do not.

**Context management.** Every tool description sits in context, so concision is a
correctness property, not a style preference. Return focused, relevant data, and support
filtering and pagination. Some clients support code execution, which lets the agent filter
and process a large result itself instead of receiving the whole thing.

**Actionable error messages.** An error should carry the caller toward a solution: what
failed, which parameter, and what to try next. "Invalid request" costs a retry; "page must
be an integer, got 'next'" ends it.

## Reading the protocol documentation

Start at `https://modelcontextprotocol.io/sitemap.xml`, then fetch specific pages with a
`.md` suffix for markdown (`https://modelcontextprotocol.io/specification/draft.md`).
The pages that matter are the specification overview and architecture, the transport
mechanisms, and the tool/resource/prompt definitions.

> **No network egress in this sandbox.** npm, PyPI, and generic HTTPS all return 403 here, so
> these fetches fail in-session. Run them on your own machine, or work from the protocol
> knowledge already in this page.

## Framework choice

**TypeScript is the recommended stack** — high-quality SDK support, good compatibility in
execution environments such as MCPB, and models generate TypeScript well: it is widely
used, statically typed, and well linted.

**Transport:** streamable HTTP for remote servers, using stateless JSON — simpler to scale
and maintain than stateful sessions with streaming responses. stdio for local servers.

SDK documentation is a README fetch in each case:

* **TypeScript** — `https://raw.githubusercontent.com/modelcontextprotocol/typescript-sdk/main/README.md`
* **Python** — `https://raw.githubusercontent.com/modelcontextprotocol/python-sdk/main/README.md`

## Plan the implementation

Review the target service's API: which endpoints matter, how it authenticates, what its data
models look like. Then choose tools — starting from the most common operations, favouring
coverage. Write the tool list down before writing any code.

---

# Phase 2 — Implementation

## Project structure and shared infrastructure

Set up the project per the SDK's conventions, then build the shared layer before the tools:

* an API client that handles authentication
* error-handling helpers that produce the actionable messages above
* response formatting — JSON, Markdown, or both
* pagination support, applied everywhere a list endpoint exists

## Transports

| Transport | How | When |
|---|---|---|
| **stdio** | The client spawns your process and speaks over stdin/stdout | Default. One server per client. |
| **streamable HTTP** | Your process serves HTTP | Multiple clients, or a shared long-running server |
| **SSE** | HTTP with a separate event stream | Legacy; use HTTP where you can |

Prefer **stateless JSON** over a stateful session: every request carries its own JSON-RPC
envelope, so there is no session to expire, lose, or fail to route. This is also what makes
a server horizontally scalable.

**stdio has one hard rule: stdout is the protocol channel.** A single `print()` — or a
library that logs to stdout, or a progress bar — corrupts the stream and the client sees a
parse error. **Send every diagnostic to stderr.** This is the single most common way a stdio
MCP server fails, and the failure message points at JSON rather than at logging.

## The handshake

`initialize` is exchanged before anything else. The server responds with its protocol
version and its **capabilities** — which of tools, resources, and prompts it actually
offers.

**Declaring a capability you do not implement is worse than omitting it.** The client will
call it, and the call will fail at a point where the client has already trusted the server.
Advertise exactly what exists.

`notifications/initialized` follows, then normal traffic. The client may send subsequent
`initialize` calls; a server that treats the second as an error will intermittently fail
against real clients.

## Declaring a tool

```json
{
  "name": "search_files",
  "description": "Search files by content pattern. Use when you need to find where a term appears in the repository.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "pattern": { "type": "string", "description": "The text or regex to search for" }
    },
    "required": ["pattern"]
  }
}
```

Three things decide whether a tool is ever used, and all three are in that declaration:

**The description is the only trigger mechanism.** The client model reads it and decides.
Write it as *what it does* plus *when to reach for it*, and enumerate the situations — the
way the Anthropic skill format does. That is the same rule, documented in
[`../reference/anthropic-agent-skills.md`](../reference/anthropic-agent-skills.md).

**Parameter names and descriptions are the model's only guide.** `q` is unusable. Write
`pattern` and say what form it takes — regex or literal, case-sensitive or not.

**The schema is a contract.** Validate against it, and return errors that name the
offending parameter.

### Schemas

Use **Zod** in TypeScript and **Pydantic** in Python. Put constraints and clear
descriptions in the schema, and add examples in the field descriptions — an example is
often the difference between a correct call and a plausible wrong one.

Where possible, also define an **`outputSchema`** and return **`structuredContent`**
alongside the text content. That lets a client understand and process the result
programmatically instead of parsing prose.

### Annotations

Four hints tell the client what a tool will do, so it can decide whether to auto-approve it:

| Hint | Meaning |
|---|---|
| `readOnlyHint` | The tool only reads; it does not modify its environment |
| `destructiveHint` | The tool may perform destructive updates |
| `idempotentHint` | Repeated identical calls have no additional effect |
| `openWorldHint` | The tool may interact with an open world of external entities |

Annotate honestly. A `readOnlyHint: true` on a tool that deletes is worse than no hint at
all — the client is trusting it.

### Implementation

Async/await throughout for I/O. Handle errors into actionable messages rather than
exceptions. Paginate every list operation. Return both text content and structured data
when the SDK supports it. In TypeScript, register with `server.registerTool`; in Python,
with `@mcp.tool`.

## Resources and prompts

**Resources** are readable content addressed by URI, and they are *listed* — the client can
enumerate them, so they are more discoverable than tools. Use a resource when the answer is
"here is a document" and a tool when it is "do a thing." Resources may be subscribable,
meaning the server pushes updates.

**Prompts** are user-invoked templates. They are not model-invoked, so they never fire on
their own. Do not build a capability that must trigger automatically as a prompt.

**The prefix convention is a naming convention, not a namespace.** A `repo://` URI does not
make it belong to a repository, and clients treat prefixes loosely. Pick one and stay
consistent.

---

# Phase 3 — Review and test

## Code quality

* No duplicated code — one client, one error path, one formatter
* Consistent error handling everywhere, not per-endpoint improvisation
* Full type coverage; no `any` on a schema boundary
* Every tool description written for a reader who has never called it

## Build and test

**TypeScript:** `npm run build` to verify compilation.
**Python:** `python -m py_compile your_server.py` to verify syntax.

Either way, exercise it with **MCP Inspector**: `npx @modelcontextprotocol/inspector`.

## Checking a server you built

* **Run it against a real client, not just the protocol.** A server that satisfies the schema
  can still fail at the transport.
* **Confirm nothing writes to stdout** but protocol messages.
* **Call each declared tool** and confirm it does what its description promises.
* **Check the descriptions as a set.** If two tools' triggers overlap, fix it before shipping.
* **Test a truncated result** — return more than fits, and see whether the client copes.
* **Assert the tools appear in the client's tool list, not that the health check passes.**
  A reachable server is reachable; that is all `GET /healthz` answers, and a client can
  report a server connected while contributing none of its tools. That failure and its
  diagnosis are in [`mcp-server.md`](mcp-server.md) §The three-state connector diagnosis.

---

# Design mistakes

**Returning too much.** A tool that returns 50,000 characters gets truncated, and the model
reasons about a truncated result as though it were complete. Return what was asked for. If a
result is inherently large, return a summary plus an identifier and let the client fetch the
rest.

**Tool count.** Every tool's description sits in context. Fifty tools is fifty descriptions
competing for attention, and the trigger quality of each one drops. Split them into separate
servers rather than shipping one server with everything.

**Errors as exceptions.** A thrown exception becomes an opaque protocol error. Return a
structured error the model can read and act on.

**No timeouts.** A slow tool blocks the client. Bound everything, and say what happened
rather than failing silently.

**Overlapping tools.** Two tools that do nearly the same thing get chosen between
arbitrarily, and the wrong one. Merge them or make the boundary obvious.

**Treating a health check as proof the tools are published.** Covered above, and diagnosed
in [`mcp-server.md`](mcp-server.md) §The three-state connector diagnosis — it is a runtime
fact rather than a build mistake, which is why the diagnosis lives there.

---

# Phase 4 — Evaluations

An implementation is not done when it builds. An evaluation set tests whether a model can
actually *use* the server to answer realistic, complex questions — which is the thing the
server exists for.

## Ten questions

Build the set by: listing the tools and understanding what they can do; exploring the data
with **read-only** operations; writing ten complex, realistic questions; then solving each
one yourself to verify the answer.

Every question is:

* **Independent** — not dependent on any other question
* **Read-only** — requiring no destructive operation
* **Complex** — needing multiple tool calls and real exploration
* **Realistic** — something a person would actually care about
* **Verifiable** — one clear answer, checkable by string comparison
* **Stable** — an answer that will not change over time

## Output format

```xml
<evaluation>
  <qa_pair>
    <question>Find discussions about AI model launches with animal codenames. One model needed a specific safety designation that uses the format ASL-X. What number X was being determined for the model named after a spotted wild cat?</question>
    <answer>3</answer>
  </qa_pair>
</evaluation>
```

## A note on scope

Anthropic's `mcp-builder` ships four deeper reference pages — best practices, a TypeScript
guide, a Python guide, and an evaluation guide — under a `reference/` folder. **They are not
vendored into this workspace and are not linked from here.** The essentials are folded into
this page; the per-language implementation detail is shallower than those guides. Fetch the
skill from its source if you need that depth.

---

# Related

* [`mcp-server.md`](mcp-server.md) — what happens when an MCP server is handed to *this*
  workspace: recorded as a page, never installed, plus the connector diagnosis
* [`../reference/anthropic-agent-skills.md`](../reference/anthropic-agent-skills.md) — the
  description-as-trigger rule, which a tool declaration follows
* [`../../rules/repository.md`](../../rules/repository.md) §The never-install rule — the rule
  that makes an MCP server a page rather than a dependency