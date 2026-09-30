# Task — mcp_list selection gate and org URLs

Make `mcp_list` route through an explicit user selection, and say where the servers are
published. Closes the gap where the registry argues adding a connector is the owner's
decision but gates nothing.

**Status:** in progress. Task 1 of 3.

## The problem

`content/index/server-registry.md` returned a three-row table and stopped. Nothing in the
text instructed a calling agent to stop and ask before cloning, so the decision fell to
that agent's defaults. The file already said adding a connector "belongs to the person who
owns it" — as an observation, not as a gate.

Separately, the file listed clone URLs but never named the organisations the servers are
published in, so a reader could not find the full catalogue from this file alone.

## What was decided, and what was not

**The gate is text, not mechanism.** The server is read-only and stateless.
`src/tools/mcp-list.js` is a pure `readSetFile` — no config writer, no filesystem write,
and no place to block on a caller since the SSE session map was removed. It also cannot
prompt: there is no elicitation mechanism, and one would need a dependency plus a client
that renders it. So the instruction lives in the returned text and the calling agent obeys
it, which is the pattern `auto-activation.md` already uses for its inline gates. Enforced
by a test, not by code. The owner chose this over adding elicitation.

**Org URLs only for MCAgents-MCP.** No repository list for it is known, so no server row
was invented. A guessed row in the scope column would be worse than an absent one, because
that column is the thing a caller trusts. Six org URLs across three orgs, with an explicit
sentence that the org pages may hold more than the three known servers.

**`before cloning` is load-bearing text.** `test/server.test.js` asserts the served
description contains it, so the description edit keeps the phrase.

## Tasks

| # | Title | Branch | PR |
|---|---|---|---|
| 1 | Task record | `chore/mcp-list-selection-gate-plan` | |
| 2 | Selection gate, org URLs, tests | `feat/mcp-list-selection-gate` | |
| 3 | Release 3.2.0 | `chore/release-3.2.0` | |

Stacked: each branches from the previous. Task 1 off `master`.

### Task 1 — the record

This file, plus its row in `.agents/index/memory-index.md`. Branches off `master`, because
a record is neither documentation nor memory-in-the-memory-sense — it is `chore` with a
`-plan` suffix to keep it apart from the work branches in a listing.

### Task 2 — the work

`content/index/server-registry.md` gains a *Where these servers are published* table and a
*Before you add anything* gate: report the whole list, ask which, ask again before
cloning. The existing *Suggested, not installed* section is folded in, since it argues the
same point without gating it. `src/tools/mcp-list.js` changes description only.
`test/server.test.js` gains the org URL assertions and two tests pinning the gate, so the
text cannot be softened silently.

Surface stays 33 tools — no file is added to `content/`, so `auto_activation` needs no new
row and the HTTP tool-count tests need no edit.

### Task 2 — the work

Landed. `server-registry.md` gains the *Where these servers are published* table (three
orgs, GitHub and GitLab) and the *Before you add anything* gate, which folds in the old
*Suggested, not installed* section — it argued the same point without gating it.
`mcp-list.js` changes description only; the handler was already a correct file read.
Three tests are added or extended: the org URLs are asserted at organisation level, and two
new tests pin the gate so the text cannot be softened silently.

**One test assertion was rewritten rather than worked around.** The gate assertions
matched the raw served text, and the file is hard-wrapped, so the clone-gate phrase
straddled a line break and failed. Loosening the regex would have made the test pass on a
rewording and fail on a rewrap — backwards. Whitespace is collapsed before matching, so
only wording is load-bearing. Suite: 54 pass, 0 fail.

Verified over stdio as a caller receives it, not only through the suite: six org URLs
present, the self-repository still absent from the served text, `already connected`
intact, all five gate phrases present, surface still 33 tools.

### Task 3 — release 3.2.0

Minor, approved by the owner: a rule is added and no file is renamed or removed.
`package.json`, the changelog, and both logs-index rows. Consumers must: nothing in their
`AGENTS.md`; re-read `server_registry` if they add servers, because the returned text now
carries the gate.
