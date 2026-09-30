---
name: gate-enforcement
description: A permission gate written as instruction text is kept by the reading agent's compliance, not by a mechanism — how to tell the two apart, and what to say about one when writing it.
version: 1.0.0
author: LXAgents
---

# Gate Enforcement

## A documented gate is not a mechanism

A repository documents a permission gate. A reader reasonably concludes the gate holds.
Whether it does depends on something the documentation usually does not name: **what
enforces it.**

There are two kinds, and they are not the same thing wearing the same word.

| Kind | What enforces it | What a test can do |
|---|---|---|
| **Mechanical** | The tool refuses, the system prompts, the platform blocks | Assert the refusal. A violation is impossible, not merely discouraged. |
| **Text-borne** | The agent that read the sentence complies | Assert the sentence is present. A violation is possible and silent. |

**Say which one a gate is.** A gate documented without its strength reads as mechanical,
and the reader has no way to tell they are the enforcement.

## What a test can and cannot do

A test over served text pins **wording**, not **behaviour**. It fails when someone softens
"do not clone without an explicit yes" into "you may wish to confirm first" — which is
worth catching. It passes when the sentence is intact and the agent clones anyway. No
assertion over a file closes that gap, because the gap is in the reader.

So a suite of such tests is a **typo guard, not a control.** Do not cite it as a
guarantee.

## Choosing

Prefer a mechanical gate wherever one exists: a tool that prompts, a server that refuses, a
platform that blocks. Reach for text-borne only where it is the only option — a read-only
server, a convention that has to travel as prose, a client that renders nothing.

A text-borne gate is legitimate. It is a **documented preference**, and it holds for a
caller following the set. It is not a control, and a repository that presents one as a
control has overstated it.

## Reporting it

When documenting a text-borne gate, state the strength in the same place — not in a caveat
three files away, and not only in a release log. A reader who has to assemble the caveat
has not been told.

Name the conditions under which the gate holds and the ones under which it does not. "Kept
by the calling agent's compliance" is enough; a list of every way it can be evaded is not
required, and overstating the limit is its own inaccuracy.

**This does not weaken a gate.** Naming the mechanism precisely is what lets a reviewer
judge whether text-borne is sufficient in a given place, which an unqualified "permission
required" does not.

## Worked example

[`../index/server-registry.md`](agents://index/server-registry.md) gates the clone behind an
explicit user decision, and that gate is **text-borne**: `mcp_list` reads a file and returns
it, so the calling agent is the only thing that can honour the instruction. The file says
so where an agent reads it, and its tests pin the wording — which is a typo guard on the
sentence, not a control on the clone.
