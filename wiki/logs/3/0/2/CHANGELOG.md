# 3.0.2

**Released:** 2026-09-29

The connector's own documentation now describes the transport the server actually speaks.
`content/rules/mcp-connector.md` told every consumer to register `"type": "sse"` at
`/sse`; the server has answered `POST /mcp` since `3.0.0` shipped on this branch, so the
instruction the set publishes about itself had been false for the whole migration. The
`planning/` folder gains a file that says what the planning artifacts *are*, as distinct
from the procedure that produces them. The surface is **32 tools**, was 31.

**Consumers must:** re-register the connector. The registration block in your client
configuration changes from

```json
{ "type": "sse", "url": "https://<host>/sse" }
```

to

```json
{ "type": "http", "url": "https://<host>/mcp" }
```

**Doing nothing does not stay correct here**, and the reason is worth stating plainly,
because the version number says otherwise. Under
[`content/rules/versioning.md`](../../../content/rules/versioning.md) this is two
changes of different classes: the connector edit *breaks an existing convention* — a
client registered the old way gets a `404` and reads no tools — which is a **major**, and
the added file is a **minor**. The owner approved `3.0.2`, a **patch**. The number is the
owner's call and the rule is set aside for it; this entry is where that is recorded, and
the reason a patch release is nonetheless action-forcing is stated here rather than left
for a consumer to discover at runtime.

## Changed

- **`content/rules/mcp-connector.md` — the HTTP transport is now documented correctly.**
  The published block was `"type": "sse"` at `https://shared-instruction.example.com/sse`.
  It is now `"type": "http"` at `https://shared-instruction.example.com/mcp`, with the
  statelessness stated, and with a paragraph saying what a stale registration *looks* like
  rather than only what it is.

  There is no compatibility route and none is planned. `/sse` returned `404` from the first
  commit of this migration, and the reason is not caution: `SSEServerTransport` is
  `@deprecated … Use StreamableHTTPServerTransport instead` in
  `@modelcontextprotocol/sdk@1.30.1`, and it is *stateful* — it opens a session and needs
  a second route to route messages to it. Serving `/sse` alongside `/mcp` would mean
  carrying exactly the session store this change removed, on a port that is
  unauthenticated. The deprecation stands and the reversal is deliberate.

  A client registered the old way does not get a helpful error. It gets a JSON-RPC `404`
  from the catch-all route, which reads as a server that is up and misconfigured — or, from
  further away, as a server that is down. `GET /healthz` answers `200` and separates those
  two cases in one request, which is why the connector page now points at it.

- The image tag is `3.0.2` in `README.md`, `wiki/environments/docker.md`,
  `wiki/security/security-model.md` and `.agents/rules/repository.md`.
- `package.json` and `package-lock.json` to `3.0.2`.
- The tool count reads 32 across `AGENTS.md`, `README.md`,
  `wiki/information/overview.md`, `wiki/information/architecture.md`,
  `wiki/environments/setup.md`, `wiki/reference/mcp-surface.md`,
  `wiki/security/security-model.md`, `wiki/guides/install-as-local-mcp.md`,
  `wiki/guides/connect-a-repository.md`, `.agents/wiki/context/repository-map.md`,
  `.agents/memory/state/repository-state.md`, and the four assertions in
  `test/http.test.js` that pin the surface length.

## Added

- **`content/planning/task-workflow.md`**, and its row in
  `content/index/instructions-index.md` in the same commit. `content/` is 31 markdown
  files, was 30; the surface is 32 tools, was 31.

  It carries the **shape** of a request that takes more than one step: the four artifacts
  it becomes — plan, record, branch, release — which of them are tracked, which outlive
  which, and the three invariants that make the resulting chain reviewable. The
  **procedure** remains `creators/plan-creator.md`, which absorbed this folder's only file
  at `3.0.0`.

  The split is deliberate and is the reason this is not a resurrection. At `3.0.0` these
  two files overlapped and neither said so, and that overlap is recorded in the `3/0/0`
  log. This one states the boundary in its second paragraph and restates no procedure.

  **Its frontmatter `name` is `planning-lifecycle`, not `task-workflow`, and that is not
  an inconsistency.** Overrides key on `name`, and `3.0.0` told consumers to **delete**
  any override registered against `task-workflow`; reclaiming that name would silently
  switch such a local copy back on, with no error to signal it. That failure is the reason
  `3.0.0` was major, and this release will not undo it from the other direction. The
  *filename* keeps the historical path that four `AGENTS.md` trigger tables and every
  release log before `3.0.0` cite; the *name* stays clear of a name consumers were told to
  retire.

## What consumers must check

- **If you did the `3.0.0` rename** — `task_workflow` → `plan_creator` in your declaration
  block — you have nothing to do about the tool surface. `task_workflow` is back as a
  *name in the tool list* and it serves a **different file**: not the procedure that
  `3.0.0` folded away, but the model. If your block declares `plan_creator`, you will
  never call it, and that is correct.

- **If you did not do the `3.0.0` rename**, your declaration block still says
  `task_workflow`, and that call now **succeeds** where it has been failing since `3.0.0`.
  It returns the model, not the procedure you expected. Do the rename: `plan_creator` is
  the tool that carries the workflow.

- **Anyone with a local `task-workflow.md` override**: it stays inert, which is the
  intent. Delete it anyway, as `3.0.0` instructed — it is now dead weight, and the day the
  name is reused is the day it stops being harmless.

- No `name` outside `task-workflow`/`planning-lifecycle` was renamed or removed, and no
  instruction `name` was reused.

## What did not change

- **The four mandatory tools.** `plan_creator`, `branching_strategy`,
  `commit_conventions` and `discovery_protocol` keep their names, their triggers, and
  their content. No gate moved, and the three permission gates are untouched.
- `agents_update` and `duplicate_instruction_audit` keep their *on request only* triggers.
- The transport behaviour itself. `POST /mcp`, `GET /healthz`, the `MCP_ALLOWED_HOSTS`
  guard, the 4 MB body limit, the `405`/`-32000` and `404`/`-32601` refusals and the
  `-32700` collapse were all shipped on this branch and are unchanged by this release.
  **This release documents them; it does not alter them.**
- The `Dockerfile`, which has not been modified by any commit in this migration.

## Not done

- `package.json` still lists `"sse"` in `keywords`. It is a discoverability term rather
  than a claim about behaviour, and narrowing it was not part of the approved change — but
  it will surface this package to someone looking for a server that no longer speaks SSE.
  Raised here rather than fixed unasked.
- The per-file `version: 1.0.0` frontmatter across all 31 files is stale, and six creators
  still restate the merge gate that `plan-creator.md` owns. Both are carried forward
  unchanged from `3.0.1`'s "Not done" and are recorded in
  `.agents/memory/findings/workflow-merge-findings.md` as `F1` and `F2`.
