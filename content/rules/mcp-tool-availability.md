---
name: mcp-tool-availability
description: The state where the connector is reachable and healthy but this session has none of its tools — why there is no fallback reading path, why a restart may not help, and what to do instead.
version: 1.0.0
author: LXAgents
---

# MCP Tool Availability

[`mcp-connector.md`](agents://rules/mcp-connector.md) says what to do when the
connector is unavailable. This file is about the one state its guidance does not
name, and the one that costs the most: **the connector is fine, and this session
still cannot read the set.**

## The three states

Two failures look like this one and are fixed differently. Tell them apart before
concluding anything.

| State | What you see | Cause | Fixed by |
|---|---|---|---|
| **Not registered** | No entry in the client's connector list. | Never added. | Register it, then restart the session. |
| **Registered, wrong transport** | `404` from the old `GET /sse` / `POST /message` pair. | A client registered `"type": "sse"` against a server that no longer serves it. | Re-register with `"type": "http"` and the `/mcp` URL. |
| **Registered, healthy, no tools** | The client's own health check reports the server connected — and **not one of its tools is in your tool list.** | The client enumerated the server and did not publish the tools it serves. | **Nothing, in-session.** |

**A health check answers reachability, not tool publication.** A server can be
reachable, named, and reported connected by the client that owns the connection
list, and still contribute no tools to the session you are working in. This is
the third state, and treating it as the first is what makes it expensive: the
remedy for the first state is a restart, and a session that has already restarted
has no reason to try it again — but also no rule telling it that the restart is
not coming.

## There is no fallback reading path

**When the tools are absent, this set is unreadable. There is no second way in.**

`agents://{folder}/{file}.md` is **prose notation** — the form this set uses in
its own links and in a consuming repository's `AGENTS.md`. It is not a fetchable
URI. The server publishes tools, not a resource endpoint, so a session resolves a
file by calling the tool named after it, never by reading the URI
([`mcp-connector.md`](agents://rules/mcp-connector.md)).

This matters because the cost of the third state is otherwise invisible. A
declaration block lists conventions by name; the names are still there; nothing
about reading that list says the bodies behind it are unreachable. A session can
spend a whole planning phase reconstructing `plan_creator` from memory and never
notice it did so — which is precisely the outcome
[`discovery-protocol.md`](agents://rules/discovery-protocol.md) exists to prevent,
arrived at by a route nothing warns about.

## What to do

1. **Say it plainly, once, in the first message.** Name the server, the symptom,
   and that you are continuing on this repository's local set alone.
2. **Say that a restart may not help.** This is the sentence that saves the user
   the most time when it is true, and omitting it costs them a session when it
   is not. Restating the existing recovery without qualifying it is what produces
   a second fruitless restart.
3. **Do** work from `{repo}/.agents/` and the user's explicit instructions.
4. **Do not** invent replacements for the conventions you could not read, and do
   not clone or vendor this set as a workaround. An unreachable connector is a
   temporary condition; a reconstructed rule set is permanent drift.
5. **Report it** as a finding under
   [`discovery-protocol.md`](agents://rules/discovery-protocol.md), so the next
   session sees it in memory rather than rediscovering it.

## What this failure is not

* **Not "no convention applied."** A session where activation silently did not
  happen and a session where it was impossible to act on look identical from the
  inside — the workflow did not occur either way. §When activation runs but the
  workflow does not in [`auto-activation.md`](agents://rules/auto-activation.md)
  covers the first; this covers the second, and the diagnostic report it asks for
  is owed here too.
* **Not a reason to lower the bar.** Nothing here permits improvising a
  convention, and the user answering a question about the work is not approval of
  a plan you built without one.

## Why this is a rule

Reproduced three times across two sessions in one consuming repository. Each
time the connector reported connected and no tools were callable; `plan_creator`,
`branching_strategy`, `commit_conventions` and `discovery_protocol` were all named
in that repository's declaration block and none of them could be called. Nothing
in the set distinguished this from a connector that had never been registered, and
[`auto-activation.md`](agents://rules/auto-activation.md) at the time told a
session with no tools to read each convention as its `agents://` resource
instead — a reading path the server does not serve. That sentence is corrected in
[`auto-activation.md`](agents://rules/auto-activation.md); this file is what takes
its place.