---
name: set-mirrors
description: Every place in this repository that reproduces published set text outside content/ — the mirror list, and the same-commit obligation.
---

# Set Mirrors

`content/` is the product, but this repository holds copies of its text outside it. A
change to the set that misses one does not just leave a stale page: it ships a
contradiction, because both copies are read as instructions.

This rule is local. Only a repository that **produces** the shared set can hold a mirror
of it — a consuming repository is forbidden from copying shared files at all, which is
[`content/rules/shared-instructions.md`](../../content/rules/shared-instructions.md)
§A. It is the producer's version of the copy problem.

## The mirrors

| Mirror | What it reproduces |
|---|---|
| [`AGENTS.md`](../../AGENTS.md) (repository root) | The trigger table, row-for-row, and the always-on paragraph. This repository consumes its own set, so its entry point goes stale exactly like a consumer's. |
| [`src/tools/mcp-creator.js`](../../src/tools/mcp-creator.js) | `buildAgentsDoc` hard-codes the always-on paragraph into every `AGENTS.md` the tool scaffolds. |
| [`content/prompts/agents-setup.md`](../../content/prompts/agents-setup.md) | Dictates the auto-activation contract a new consuming repository writes into its own `AGENTS.md`. Published, but a mirror all the same. |

The discovery-protocol block has its own bounded copy list, owned by
[`content/rules/discovery-protocol.md`](../../content/rules/discovery-protocol.md) §F
and enforced by `test/registry.test.js`. This table covers everything that list does
not.

## Not a mirror

`src/server/payloads.js` reads from the registry instead of restating it, which is why
it has never drifted. **Prefer that shape.** New code that needs set text reads it from
the registry; hard-coding is what puts a file in the table above.

## The obligation

A change to [`content/rules/auto-activation.md`](../../content/rules/auto-activation.md),
to `shared-instructions.md` §H, or to any text a mirror reproduces updates every affected
mirror **in the same commit** — the rule
[`content/rules/change-propagation.md`](../../content/rules/change-propagation.md)
applies to documentation, extended to the source and prompt copies nothing else covers.

Before committing a change under `content/`, grep for a distinctive sentence you
changed. If it appears outside `content/`, it is a mirror and it is in scope.

## Why this exists

The `0.8.0` request named four files to edit. Three more carried the same text and would
have shipped the old count — one of them into every repository `mcp_creator` creates,
and one into every repository set up from the `agents-setup` prompt. Nothing written down
would have caught it.
