---
name: memory-tasks-model-naming-convention-tools
description: Publishing the {platform}/{model} naming convention as a shared rule, and the two read-only tools that serve it to an Agents IDE.
---

# Model Naming Convention and Its Tools

## 2026-08-28 — planned

**Goal.** The shared set says nothing about how a stored model identifier is formed. A
repository that writes `model_name` into `chat_message_embeddings` therefore invents its
own shape, and the shapes disagree: `text-embedding-3-small` from a direct OpenAI call and
`openai/text-embedding-3-small` from an OpenRouter call are the same model under two names,
and nothing downstream can tell. Publishing the convention is what lets an Agents IDE build
multi-platform support — OpenRouter as a core, or a direct API call — without guessing.

**Objective.** Two new **read-only** tools on the `lxagents-agents-base` connector, named
for the content they serve, backed by a new published rule in `content/rules/`. `npm test`
green. Every place that lists the tool surface updated in the same round.

**Detail.**

* The rule is **shared**. The routing question in `directories.md` is *is this true for more
  than this repository?* — a cross-provider naming format is true for every repository that
  stores one, so it goes in `content/` and is published, not into `.agents/`.
* The tools **read the rule from the frozen registry**. `repository.md` requires it and
  `set-mirrors.md` explains the cost of the alternative: hard-coded set text is a new mirror
  to maintain, and `src/tools/mcp-creator.js` is the standing example of one that drifted.
* `model_name_format` is the second tool and it is not a text tool: it applies the rule's
  construction logic to a `platform` and a `platform_model` and returns the normalized name.
  That is deliberate. A convention an IDE can only *read* still has to be re-implemented at
  every call site; one it can *call* has a single answer. It stays read-only — no I/O, no
  writes, same output for the same input.
* A change under `content/**` is published on the next boot and is a release
  (`content-publishing.md`), so task 5 is a real release with a version, a changelog, and a
  row in both logs indexes.

**Branches.** The session was configured to develop on `claude/model-naming-convention-tools-rzudan`.
The user overrode that mid-round and asked for the repository convention instead, so the
work is stacked across five `{type}/{primary-noun}` branches per `branching-strategy.md`.
The tool-preset branch carries no commits and is left where it is.

**Version.** `0.11.0` proposed — a **minor** bump, because this adds a rule and a file and
removes nothing. Not staged until the user approves it; `versioning.md` treats a staged bump
as a bump.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/model-naming-convention-tools-plan` | This file, and its `memory-index.md` row. | |
| 2 | `feat/model-naming-convention` | `content/rules/model-naming-convention.md`, its index row, its trigger row, and both `AGENTS.md` mirrors. | |
| 3 | `feat/model-naming-tools` | `model_naming_convention` and `model_name_format`, the payload builder behind them, and their tests. | |
| 4 | `docs/model-naming-surface` | Every place that lists the tool surface: the connector rule, `mcp-surface.md`, `overview.md`, `README.md`, the state file. | |
| 5 | `chore/release-0-11-0` | Version, changelog, both logs indexes, and the closing entry here. | |

## Per-task record

### Task 1 — `chore/model-naming-convention-tools-plan`

Created this file and registered it in `.agents/index/memory-index.md`. Nothing published.

Recorded here because it decided the shape of everything after it: **the rule is written
first and the tools are written second**, not the other way round. The request asked for
tools; the tools cannot be built correctly without deciding where their text lives, and the
answer that keeps them from drifting is "in `content/`, read at boot". Task 2 therefore
publishes a file that nothing calls yet, and task 3 calls it.
