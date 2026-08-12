---
name: directory-architecture
description: The placement authority — the four trees, the two-wiki audience test, the shared/local split, and the algorithm for placing any new file.
---

# Directory Architecture

This file decides where every file goes, in both sets. When any other rule and this
one disagree about placement, this one wins.

## A. The core mandate

All agent-related files strictly follow this centralized structure. Do **NOT** scatter
`INDEX.md` files across directories.

* **Indexes:** `.agents/index/{file-name}.md` (e.g. `root-index.md`).
  Replaces all scattered `INDEX.md` files. Acts as the centralized routing system.
* **Agent Wiki:** `.agents/wiki/{type}/{file-name}.md`.
  The static knowledge base, SOPs, and domain guidelines specifically for agents.
* **Agent Memory:** `.agents/memory/{type}/{file-name}.md`.
  Ongoing tasks, dynamic states, session logs, and agent memories.

### The human wiki stays where humans expect it

The mandate above governs **agent-related** files. Human-facing project documentation
is not an agent artifact and keeps its conventional home:

* **Project Wiki (humans):** `wiki/{folder}/{file-name}.md` — overview, architecture,
  guides, reference, environments, release logs. Plain markdown, no frontmatter,
  linked from `README.md`.

So each repository has **exactly two documentation trees, with different audiences,
and never a third**:

| Tree | Audience | Path | Frontmatter |
|---|---|---|---|
| Project Wiki | Humans — contributors, users, reviewers | `wiki/{folder}/{file-name}.md` | No |
| Agent Wiki | Agents — SOPs, domain guidelines, operating context | `.agents/wiki/{type}/{file-name}.md` | Yes |

**The audience test — apply it every time, before writing a page:**

* Would a new human contributor read this to understand or use the project? → `wiki/`.
* Is this a procedure, constraint, or framing that only exists so an agent behaves
  correctly? → `.agents/wiki/`.
* Both? Write the facts **once** in `wiki/` and have the `.agents/wiki/` page link to
  it. Never mirror content between the two trees — a duplicated fact is a fact that
  will go stale on one side.

Both trees are routed from `.agents/index/`. Neither contains an index file of its own.

### The federation split

Conventions true across the organization are written **once**, here, and served over
the `lxagents-agents-base` connector. Every repository carries only what is genuinely
its own.

```
LXAgents/mcp-server                 <- THE PRODUCER: serves the shared set over MCP
  content/                          <- THE SHARED SET ITSELF, published as agents:// resources
    AGENTS.md                       <- the federation contract
    rules/  git/  planning/  prompts/  creators/  index/
  .agents/                          <- the producer's OWN local set, published to nobody
  wiki/logs/…                       <- the shared set's own release history

{org}/{repo}                        <- A CONSUMING REPOSITORY
  AGENTS.md                         <- entry point + connector bootstrap
  .agents/
    index/                          <- this repo's routing, plus the link to the shared router
    rules/repository.md             <- this repo's own rules
    rules/{override}.md             <- only when this repo must override a shared rule
    wiki/                           <- this repo's agent knowledge
    memory/                         <- this repo's memory — never shared
  wiki/                             <- this repo's human documentation
```

Resolution is in [`mcp-connector.md`](agents://rules/mcp-connector.md). Precedence and
override semantics are in
[`shared-instructions.md`](agents://rules/shared-instructions.md). Cross-set links are
placeholders (`{shared}/…`, `{repo}/…`) or `agents://` URIs — never relative paths.

### What this mandate forbids

These are hard failures.

* **No `INDEX.md` anywhere** — not at the root, not in `.agents/`, not in `wiki/`, not
  in `.agents/wiki/`, not in any subfolder, not in a monorepo package. Every index is
  a file inside `.agents/index/` (in the shared set: `index/`).
* **No index outside the index folder.** A folder never carries its own index. When a
  scope earns an index, that index is a *new file in the index folder*, never a file
  placed inside the scope. This includes `wiki/` — the human tree is routed from
  `.agents/index/project-wiki-index.md`.
* **No copy of a shared file in a consuming repository unless it is a declared
  override**, registered in the override table with a stated reason. A silent copy is
  the failure this whole architecture exists to prevent — see
  [`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md).
* **No memory in the shared set.** Memory is per-repository, always — including the
  producer's, which lives in its own `.agents/memory/` and is never published.
* **Nothing repository-specific in the shared set.** The producer repository keeps its
  own rules in its own `.agents/`, exactly as a consumer does. A local rule published to
  everyone is the same failure as a shared rule copied into one repository, in reverse.
* **No third documentation tree.** `wiki/` and `.agents/wiki/` are the only two. Do
  not create `docs/`, `documentation/`, or a second human wiki.
* **No memory outside `.agents/memory/`.** No scratch notes, task trackers, `TODO.md`,
  `NOTES.md`, `STATE.md`, or session logs anywhere else.
* **No loose files at the root of `.agents/`, `wiki/`, `.agents/wiki/`, or
  `.agents/memory/`.** Every page and memory file lives inside a folder or `{type}`.
  The index folder is the one flat folder, and it holds index files only.
* **Only three files may be added at the repository root by the setup task:**
  `AGENTS.md`, `README.md`, `LICENSE`. `AGENTS.md` stays at the root because that is
  where agent tooling looks for it — it is an entry point, not an index.

### The four trees

| Tree | Path shape | Nature | Who writes it |
|---|---|---|---|
| Instructions | `{set}/{folder}/{file}.md` | Normative. Rules an agent must obey. | Only with user approval. |
| Index | `{set}/index/{scope}-index.md` | Routing. Pointers only. | Same commit as whatever it indexes. |
| Project Wiki | `wiki/{folder}/{file-name}.md` | Human documentation. | Freely, when the facts are real. |
| Agent Wiki | `.agents/wiki/{type}/{file-name}.md` | Agent knowledge. | Freely, when the facts are real. |
| Memory | `.agents/memory/{type}/{file-name}.md` | Dynamic state. | Freely and automatically, no approval. |

**Instructions are normative and gated, memory is dynamic and ungated, the two wikis
are descriptive and in between.** Never record dynamic task state as an instruction,
and never let a wiki or memory file assert a rule. When a wiki or memory page disagrees
with an instruction, the instruction wins, always.

## B. Instruction folders

Use only those the set needs. Each is `{set}/{folder}/{file}.md`.

| Folder | Holds | Usual set |
|---|---|---|
| `rules/` | Repository-wide rules and the directory architecture itself. | Both |
| `git/` | Branching strategy, commit format, pull request format. | Shared |
| `creators/` | The instruction / information / changelog / index / memory creators. | Shared |
| `prompts/` | Standing prompt templates and few-shot examples. | Shared |
| `planning/` | Task intake, breakdown, ordering, estimation, prioritization. | Shared |
| `docs/` | Rules for writing README, wiki, and index files. | Shared |
| `skills/` | Step-by-step procedures for recurring tasks. | Either |
| `tools/` | Tool definitions and schemas. | Either |
| `knowledge/` | Domain context an agent needs to reason correctly. | Local |
| `personas/` | Roles and behaviors to adopt. | Either |
| `ethics/` | Safety boundaries and constraints. | Shared |
| `architecture/` | System design guidelines and structural constraints. | Local |
| `api/` | API design standards and specification guidelines. | Either |
| `database/` | Schema design, migrations, query constraints. | Local |
| `security/` | Security policy, secret handling, vulnerability prevention. | Shared |
| `performance/` | Performance, memory, and bottleneck guidelines. | Local |
| `dependencies/` | Package management and version-update policy. | Either |
| `compliance/` | Licensing, legal, and privacy policy. | Shared |
| `deploy/` | Deployment, environments, containerization. | Local |
| `workflows/` | CI/CD automation rules. | Either |
| `testing/` | Test strategy, coverage, fixtures. | Either |

`index/`, `wiki/`, and `memory/` are **reserved structural folders**, not instruction
folders — never put an instruction file in them. `memory/` never exists in the shared
set.

## C. `wiki/` folders — human documentation

`wiki/{folder}/{file-name}.md`, plain markdown, no frontmatter, always local.

| Folder | Holds |
|---|---|
| `information/` | What the project is, architecture, features, concepts. |
| `environments/` | `docker.md`, `docker-compose.md`, `env.md`, local setup, CI. |
| `guides/` | Task-oriented how-tos for people. |
| `reference/` | Commands, config keys, API surface, schema. |
| `logs/` | Versioned change logs — the one folder allowed extra depth. |

## D. `.agents/wiki/` types — agent knowledge

`.agents/wiki/{type}/{file-name}.md`, frontmatter required, always local.

| Type | Holds |
|---|---|
| `context/` | Orientation an agent needs before touching code: what lives where, build/test commands, entry points, gotchas. |
| `sop/` | Standard operating procedures an agent follows step by step. |
| `domain/` | Domain vocabulary, business rules, external-system behavior an agent must respect. |

**Facts live once, in `wiki/`.** An `.agents/wiki/` page carries the agent-specific
procedure or framing and links to the human page for the underlying facts. If you catch
yourself pasting the same paragraph into both trees, the page belongs in `wiki/` and
the agent page should be a link.

## E. `.agents/memory/` types

`.agents/memory/{type}/{file-name}.md`, always local.

| Type | Holds | Lifetime |
|---|---|---|
| `tasks/` | One file per ongoing or completed task: goal, plan, status, branches, PRs. | Until the task ships, then archived. |
| `sessions/` | `{yyyy-mm-dd}-{slug}.md` — what happened in a working session. | Rolled into a digest each release. |
| `decisions/` | One file per durable decision: context, options, choice, consequence. | Permanent. |
| `state/` | Current dynamic state of an area — what is live, broken, in flight. | Overwritten in place, always current. |

## F. Placement algorithm

1. **Choose the set first.** Ask: *is this true for more than this repository?* Yes →
   shared. No → local. Memory, indexes, wikis, and `repository.md` are always local. If
   the answer is "yes" and you are in a consuming repository, you do not write the file
   — you propose it to the shared set
   ([`discovery-protocol.md`](agents://rules/discovery-protocol.md)).
2. **Classify next:** is the new file **normative** (instruction), **routing** (index),
   **human documentation** (`wiki/`), **agent knowledge** (`.agents/wiki/`), or
   **dynamic state** (memory)? The answer picks the tree, and the tree is not
   negotiable.
3. If it is documentation, apply the **audience test** from §A before choosing a tree.
   When both audiences want it, it goes in `wiki/` and the agent tree links to it.
4. Pick the existing folder or `{type}` whose topic actually contains the subject.
5. **If nothing fits, do NOT force it into the closest one and do NOT rename the file
   to pretend it fits.** Create a new folder or `{type}` that fits: lowercase
   kebab-case, a plain topic noun (e.g. `observability/`, `wiki/integrations/`,
   `.agents/wiki/playbooks/`, `.agents/memory/incidents/`), and put the file there.
6. Whenever you create a new folder, register it in this file's tables AND in the index
   that owns that scope **in the same commit**. If the new folder earns its own index,
   create it in the index folder and register that index in the set's root index too.
   The tables above are a baseline, not a closed set.
7. If an existing file already covers the subject, extend that file instead of adding a
   near-duplicate — subject to the discovery protocol for instructions: propose, do not
   self-apply. If the existing file is *shared* and you are local, you override it
   whole-file or you propose the change upstream — never both, and never a partial
   copy.
8. **One subject per file, and the subject must match the filename.** A rule that
   applies across several topics is its own file, linked from the files it affects —
   never a section bolted onto a file about something else. If you are about to add a
   section whose heading has nothing to do with the file's `name`, that section is a
   new file.
9. Never place a loose file at the root of an instruction set, `wiki/`, `.agents/wiki/`,
   or `.agents/memory/`. Every file sits inside a folder or `{type}`.
10. Depth is `{set}/{folder}/{file}.md`, `wiki/{folder}/{file}.md`, and
    `.agents/{tree}/{type}/{file}.md`. The only exception is `wiki/logs/`, which has its
    own required shape.
11. Never create an `INDEX.md`. Never create a third documentation tree. Never copy a
    shared file into a consuming repository except as a declared override.
