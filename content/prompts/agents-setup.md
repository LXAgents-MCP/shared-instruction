---
name: agents-setup-prompt
description: The full AGENTS-SETUP procedure — build a repository's instruction, knowledge, and memory system against the set this connector serves.
---

# AGENTS-SETUP

You are setting up the agent instruction system, knowledge system, and memory system for
this repository.

This procedure is **project-agnostic**. Do not assume a language, framework, or domain —
detect them, then write instructions that match what this project actually is. It must
work equally well on an empty repository containing only `README.md` and on an existing
codebase.

It is also **repository-agnostic within the organization**: the shared instruction set is
served by the `lxagents-agents-base` connector you are reading this from, and every
repository carries only what is genuinely its own.

---

## 0. Ground rules

* **Work on a new branch**, created from the default branch before touching any file.
  Name it `docs/agents-setup` — `{type}/{primary-noun}`, per
  [`git/branching-strategy.md`](agents://git/branching-strategy.md). Never commit
  directly to `main`/`master`. Never use a tool-preset prefix such as `claude/`,
  `codex/`, `cursor/`, and never add a generated suffix.
* **Ask before you assume.** Batch every open question into ONE message before you start
  writing files (§1). Do not invent a license, a version number, an author, or an
  organization name.
* **Do not invent instructions.** Every rule you write must be traceable to something
  real in this repository, or to the shared set.
* **Never bump a project version yourself** —
  [`rules/versioning.md`](agents://rules/versioning.md).
* **Obey the directory mandate** in
  [`rules/directories.md`](agents://rules/directories.md) without exception. It overrides
  any habit, template, or convention you would otherwise apply — including the habit of
  dropping an `INDEX.md` into every folder.
* **Never duplicate a shared instruction into this repository.** If a rule is true for
  more than this repository, it belongs in the shared set —
  [`rules/shared-instructions.md`](agents://rules/shared-instructions.md).
* **No session links in anything you produce** — not in a file, a commit message, a
  commit trailer, a branch name, or a pull request. If your tooling appends one by
  default, strip it before you commit or post.
  [`rules/no-session-links.md`](agents://rules/no-session-links.md)
* **Finish by pushing. Do not open a pull request unless the user says so** (§8).

### 0.1 Determine the mode first

State which mode you picked in your first message.

| Mode | You are in | You build |
|---|---|---|
| **A — Producer** | `LXAgents/mcp-server` itself | A change to the shared set: edit `content/`, version it, log it. Not this procedure — see [`rules/shared-instructions.md`](agents://rules/shared-instructions.md) §F. The producer **also** keeps its own `.agents/` for what is local to it. |
| **B — Consumer** | Any other repository, with this connector available | This repository's `AGENTS.md` + `.agents/` (local content only), resolving the shared set through the connector. |
| **C — Standalone** | Any other repository, with no connector and none planned | Everything locally, as a single self-contained repository. |

How to decide: if the repository's remote is `LXAgents/mcp-server`, you are in Mode A —
stop deciding. Note that Mode A is not "no local set": the producer repository is also a
software project, so it carries `.agents/` for its own rules, indexes, agent wiki and
memory exactly as a consumer does. What makes it Mode A is that it *publishes* the
shared set, not that it lacks a local one. Otherwise, if you can read `agents://manifest.json`, propose **Mode B**.
If you cannot, ask the user in §1 whether they intend to add the connector (Mode B) or
want everything local (**Mode C**).

---

## 1. Discover, then ask (one batched message)

1. Read `README.md` and list the repository root. Inspect manifests and build files that
   actually exist: `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`,
   `build.gradle`, `composer.json`, `Gemfile`, `*.csproj`, `Makefile`, `Dockerfile`,
   `compose.yaml`, CI workflows.
2. Derive: project name, purpose, language(s), package manager, build/test/run commands,
   entry points, deployment target, whether it is a monorepo, the remote owner, and the
   repository name.
3. Then ask the user — in a single message, one question per bullet, and **only for what
   you could not determine**:
   * **Mode** — confirm A, B, or C.
   * **Project intent** — what will be built here? The kind of project (web app, API
     service, CLI, library, plugin, mobile app, data pipeline, infrastructure, …), the
     stack, the target runtime, and anything notable (database, auth, external services,
     deployment target). Say that this answer only decides *which* instruction files are
     worth creating, and that skipping it is fine.
   * **License** — which license (MIT / Apache-2.0 / GPL-3.0 / BSD-3-Clause /
     proprietary / none), the **organization or copyright holder name**, and the **year**.
     Do not pick one yourself; a LICENSE file is a legal statement.
   * **Initial version** — e.g. `0.1.0` or `1.0.0`. This decides the first log directory
     `wiki/logs/{Major}/{Minor}/{Patch}/`.
   * **Default branch name** — if it is not obvious from the remote.
   * **Project summary** — one paragraph, if `README.md` does not state the purpose
     clearly.
   * Anything else genuinely blocking. Nothing else.
4. Wait for the answers. Then run §1.5, then build.

### 1.5 Propose the instruction set, let the user select

**If the user did NOT answer the project-intent question**, do not guess a domain. Create
the mandatory core set for your mode (§2) and nothing more. Do not scaffold speculative
instruction files.

**If the user DID answer**, derive the instruction files the project actually needs and
present them for selection *before* creating anything:

* **Route every proposal to a set first.** Ask: *is this true for more than this
  repository?* Yes → **shared**; no → **local**. In Mode B a shared proposal is never
  created here — it is reported as a discovery to be raised against
  `LXAgents/mcp-server`.
* Group by target, one line each:
  `[ ] {set} {folder}/{file}.md — name: {name-id} — {one-line description}`.
* Keep each description to one line. Do not write file bodies yet.
* Propose only what the stated project needs — a REST service earns `api/`, `security/`,
  `database/`; a published library earns `dependencies/`, `compliance/`; a containerized
  app earns `deploy/`, `workflows/`. Do not propose the full baseline list reflexively.
* If a needed topic has no matching baseline folder, propose a new folder — that is
  expected.
* Wait for the selection. Create the mandatory core set plus exactly what was selected.
  Anything not selected goes into your §8 report as a discovery, not into the repository.

---

## 2. What you will produce

### Mode B — a consuming repository

```
AGENTS.md                          <- entry point + connector bootstrap + trigger table
README.md                          <- overview only, no detailed docs
LICENSE                            <- per the user's answer
.agents/
  index/
    root-index.md                  <- local router; links the shared router; carries the override table
    agents-index.md                <- this repo's instruction folders
    agent-wiki-index.md            <- indexes .agents/wiki/
    project-wiki-index.md          <- indexes wiki/
    memory-index.md                <- indexes .agents/memory/
    logs-index.md                  <- version list, newest first
    {scope}-index.md               <- only when a scope crosses the split threshold
  rules/
    repository.md                  <- rules specific to THIS project
    {shared-name}.md               <- only when overriding a shared rule, same `name`
  wiki/
    context/repository-map.md      <- agent orientation: what lives where
    {sop,domain,…}/…
  memory/
    state/repository-state.md
    tasks/agents-setup.md
wiki/
  information/…
  environments/…
  logs/{Major}/{Minor}/{Patch}/CHANGELOG.md
```

A consuming repository does **not** contain `git/`, `planning/`, `prompts/`, or
`creators/`. Those are served by the connector. Creating them here is the duplication
this architecture exists to eliminate.

### Mode C — standalone

The Mode B tree **plus** the shared-only folders (`git/`, `planning/`, `prompts/`,
`creators/`, and the shared `rules/` files) inside `.agents/`, and no bootstrap block in
`AGENTS.md`. Every `{shared}/…` in this procedure resolves to `.agents/…`. State in
`.agents/rules/repository.md` that the repository is standalone, so a later migration to
the connector is a mechanical move rather than an archaeology exercise.

Everything listed for your mode is the **mandatory core set** — always created. Anything
beyond it comes from the §1.5 selection only. Do not scaffold empty folders, do not create
`.gitkeep` placeholders, and do not create a scope index the split threshold does not
justify.

---

## 3. File format

**Every `.md` file in an instruction set — instructions, indexes, agent wiki pages, memory
files — and the root `AGENTS.md` MUST start with:**

```
---
name: {name-id}
description: {short description}
---
```

* `name` — kebab-case, unique **within its set**.
* `description` — one line, ≤ 140 chars, written so an agent can route on it **without
  opening the file body**. Routing quality is capped by description quality.
* Immediately after the frontmatter: one `#` H1 title, then the body.

**Files under the human `wiki/` tree are plain documentation — no frontmatter.** They start
directly with a `#` H1 and are routed from `.agents/index/project-wiki-index.md`.

### Names are scoped to a set

A `name` is unique within its set. **Across sets, an identical `name` is not a collision —
it is an override**, whole-file, per
[`rules/shared-instructions.md`](agents://rules/shared-instructions.md).

| File | `name` pattern | Example |
|---|---|---|
| Root router (local) | `root-index` | `root-index` |
| Scope index | `{scope}-index` | `agents-index`, `agent-wiki-sop-index` |
| Instruction | `{topic}` (bare) | `repository-rules` |
| Agent wiki page | `agent-wiki-{type}-{topic}` | `agent-wiki-context-repository-map` |
| Memory file | `memory-{type}-{topic}` | `memory-state-repository-state` |
| Human wiki page | — (no frontmatter) | — |

### Naming and shape

* All file and folder names are **kebab-case**, lowercase, no spaces.
* `CHANGELOG.md` and its siblings in a version directory (`MIGRATION.md`, `BREAKING.md`,
  `UPGRADE.md`, `NOTES.md`) are the only uppercase filenames permitted. `INDEX.md` is
  **never** permitted.
* Index filenames always end in `-index.md`.
* One topic per file. If a file needs two H1-level subjects, it is two files.
* Links are relative and clickable **within** a set. Cross-set references use `{shared}` /
  `{repo}` placeholders or `agents://` URIs.

---

## 4. Root files

### 4.1 `AGENTS.md` (`name: agents-entry-point`)

An entry point and an activation contract — **never a rule body, never an index**. In this
order:

**a)** One paragraph on what this repository is.

**b) Connector bootstrap (Mode B only).** Reproduce the block from
[`rules/mcp-connector.md`](agents://rules/mcp-connector.md) verbatim.

**c) Auto-activation contract:**

> ## Auto-Activation
>
> The instruction set is **always active** — the local `.agents/` set and the shared set
> together. It applies to every task in this repository whether or not the user mentions
> it, links to it, or asks for it. Treat these files as standing orders, not as optional
> reference material.
>
> At the start of every session, before doing any work:
>
> 1. Read `AGENTS.md` (this file).
> 2. Resolve the shared set per the bootstrap above.
> 3. Read [`.agents/index/root-index.md`](.agents/index/root-index.md).
> 4. Read [`.agents/index/memory-index.md`](.agents/index/memory-index.md) and load only
>    the memory rows whose scope matches the current request, so you continue prior work
>    instead of restarting it.
> 5. Match the request against the trigger table below and load the instruction files it
>    names, local first, shared second.
>
> If a rule conflicts with a habit, a default, or a template you would otherwise follow,
> the rule wins. If it conflicts with an explicit instruction from the user in this
> session, the user wins — and you say out loud which rule you are setting aside.

**d) Trigger table.** Mirror
[`rules/auto-activation.md`](agents://rules/auto-activation.md) row-for-row, filled with
the files that actually exist after §1.5. Name that file as the authority behind the
table. In Mode C, replace every `{shared}` with `.agents`.

**e) Reading order:** `AGENTS.md` → resolve the shared set →
`.agents/index/root-index.md` and nothing else at this stage → the ONE index whose scope
matches → one child branch if it delegates → only then the specific files.

**f) Routing protocol:** route by reading index tables, not by reading files. Do NOT load
every index. Do NOT bulk-scan either set to build a registry — `agents://manifest.json`
already is one. Do NOT read an instruction body until it has been selected. The standing
exception is `memory-index.md`, read every session because continuity depends on it.

**g) Iron rule:** reproduce the Iron rule from
[`AGENTS.md`](agents://AGENTS.md), phrased for this repository.

**h) Placement:** restate the directory mandate in four lines — local instructions to
`.agents/{folder}/{file}.md`, human documentation to `wiki/{folder}/{file-name}.md`, agent
knowledge to `.agents/wiki/{type}/{file-name}.md`, memory to
`.agents/memory/{type}/{file-name}.md`, indexes to `.agents/index/{scope}-index.md`, and
anything universal to the shared set. No `INDEX.md`, anywhere, ever.

**i) Discovery protocol:** reproduce the canonical block from
[`rules/discovery-protocol.md`](agents://rules/discovery-protocol.md) verbatim, and name
that file as its source of truth.

**j) Version rule:** never change the project version without explicit user approval.

**k) No session links:** the one-line rule, pointing at
[`rules/no-session-links.md`](agents://rules/no-session-links.md).

Nothing else. No rule bodies. `AGENTS.md` links to the local root index, names the shared
set, and points at the few standing files above — it does not enumerate the instruction
set.

### 4.2 `.agents/index/root-index.md` (`name: root-index`)

The single entry point to every index this repository can reach. Its entire body is two
tables plus, at most, a two-line note.

**Table 1 — indexes**, with a **Load when** column:

| Index | Scope | Load when |
|---|---|---|
| [`agents-index.md`](agents-index.md) | This repository's instruction set | You need a rule specific to this repository. |
| `{shared}/index/root-index.md` | The shared instruction set | You need a branching, commit, pull request, planning, or creator convention. |
| [`agent-wiki-index.md`](agent-wiki-index.md) | `.agents/wiki/` agent knowledge | You need an SOP, domain guideline, or operating context written for agents. |
| [`project-wiki-index.md`](project-wiki-index.md) | `wiki/` human documentation | You need to read or write documentation a person will read. |
| [`memory-index.md`](memory-index.md) | `.agents/memory/` dynamic state | You need prior task state or must record progress. |
| [`logs-index.md`](logs-index.md) | `wiki/logs/` versioned change logs | You need release history or must record a change. |

**Table 2 — shared overrides**, one row per local file that replaces a shared one:

| `name` | Local file | Replaces | Why |
|---|---|---|---|

If there are none, keep the heading and write: *No overrides — this repository uses the
shared set unchanged.* An empty override table is a meaningful statement, not a
placeholder.

State in the file: it lists indexes only, never rules, never leaf content; adding,
removing, or renaming any index updates this table **in the same commit**; adding or
dropping an override updates the override table in the same commit; read exactly one
branch per task, plus `memory-index.md`.

### 4.3 `README.md`

Rewrite as an **overview only**, preserving existing content by *moving* detail into
`wiki/` pages — never delete information, relocate it.

* Project name, one-paragraph description, key features (short list).
* Quick start: the minimum commands to install and run.
* A "Documentation" section linking the two or three `wiki/` pages a newcomer needs first,
  plus one line pointing at `.agents/index/project-wiki-index.md` as the full map.
* A one-line "Working with agents" note pointing at `AGENTS.md`, and in Mode B one more
  line naming the connector.
* License line pointing at `LICENSE`.

### 4.4 `LICENSE`

Always create this file.

* **If the user supplied license type, holder, and year:** write the exact, full, standard
  text of that license with the holder and year filled in verbatim. Do not paraphrase and
  do not substitute a different holder.
* **If the user declines, answers "none"/"skip"/"later", or does not answer:** create
  `LICENSE` containing exactly `# License` and nothing else.
* Never invent a license type, an organization name, or a year. If only some values are
  missing, ask once more for those; if still not given, use the placeholder.

---

## 5. Local content

### 5.1 `.agents/rules/repository.md` (`name: repository-rules`)

Rules specific to THIS project, derived from your §1 discovery: module and folder
boundaries, build and test commands, what must not be introduced, where generated files
live, coding conventions the codebase already follows. Keep it a hub — link out rather
than restating, and **never restate a shared rule here**. If the project is currently just
a README, say so plainly and keep the file minimal; do not fabricate architecture.

State in one short section: which mode this repository is in, that the shared set comes
from the `lxagents-agents-base` connector, and — in Mode C — that the repository is
standalone.

### 5.2 The index system

A consuming repository always creates:

| File | `name` | Owns |
|---|---|---|
| `.agents/index/root-index.md` | `root-index` | Every local index, the shared router, the override table. |
| `.agents/index/agents-index.md` | `agents-index` | The local instruction folders. |
| `.agents/index/agent-wiki-index.md` | `agent-wiki-index` | `.agents/wiki/`. |
| `.agents/index/project-wiki-index.md` | `project-wiki-index` | `wiki/` (except `logs/`). |
| `.agents/index/memory-index.md` | `memory-index` | `.agents/memory/`. |
| `.agents/index/logs-index.md` | `logs-index` | `wiki/logs/`, newest version first. |

Each scope index carries one `##` section per folder or `{type}` it owns, with a
`| File | Purpose |` table of relative links, and states that any file added to or removed
from its scope is reflected in the same commit. **No index lists files from the other
set** — it points at that set's router instead.

**Split threshold:** a folder or `{type}` earns its own `{scope}-index.md` when it holds
more than ~10 files, or when it has subfolders of its own. Below that, the parent lists
files inline. Child index filenames are the scope path, kebab-joined
(`.agents/wiki/sop/` → `agent-wiki-sop-index.md`). When a scope crosses the threshold, move
its rows into the new child, replace them with a single "Child Indexes" row, and add the
child to the root index — all in one commit.

Full template and maintenance rules:
[`creators/index-creator.md`](agents://creators/index-creator.md).

### 5.3 Both wiki trees

**`wiki/` — humans.** Seed only pages you can fill with real content from this repository:
typically `wiki/information/overview.md`, `wiki/information/architecture.md` (only if
there is architecture to describe), `wiki/environments/setup.md`, and
`wiki/environments/env.md` if the project reads environment variables. If it ships
containers, add `wiki/environments/docker.md`. Plain markdown, no frontmatter. **Do not
create placeholder pages full of TODOs.** Fewer, real pages.

**`.agents/wiki/` — agents.** Mandatory:
`.agents/wiki/context/repository-map.md` (`name: agent-wiki-context-repository-map`) — the
orientation page an agent reads before touching anything: what lives where, build/test/run
commands, entry points, generated paths to leave alone, known gotchas, and that the shared
set resolves through the connector. Fill it from your §1 discovery. If the project is
currently just a README, say exactly that and list what does exist.

Everything else here comes from the §1.5 selection. Every page links out to `wiki/` for
underlying facts instead of restating them.

### 5.4 Memory seed

Exactly two real memory files, both registered in `.agents/index/memory-index.md`:

* `.agents/memory/state/repository-state.md` (`name: memory-state-repository-state`) — the
  repository's current known state after setup: what exists, the stack, what is not yet
  built, which shared set it consumes and how, and the next obvious step.
* `.agents/memory/tasks/agents-setup.md` (`name: memory-tasks-agents-setup`) — this task's
  record: goal, mode, what was created, the branch, decisions made (license, version,
  connector, selected instruction files), and what was proposed but not selected. **No
  session link** — describe the work, do not point at the conversation.

No other memory files. No empty `{type}` folders.

### 5.5 First log entry

After the user confirms the initial version, create
`wiki/logs/{Major}/{Minor}/{Patch}/CHANGELOG.md` for that version, documenting this
scaffold under `Added`, and list it in `logs-index.md`. Do not create any other version
directory.

---

## 6. Duplicate check

If the repository already has an `.agents/` tree from an earlier setup, **do not silently
merge it**. Point the user at
[`rules/duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md) and
offer to run the audit. Do not run it unasked — it proposes deletions, and it is an
on-request procedure by design.

---

## 7. Verify

Report each item.

* The mode you built is stated, and the tree matches §2.
* **No shared content duplicated** — no `git/`, `planning/`, `prompts/`, or `creators/`
  folder in a consuming repository, and every local file whose `name` matches a shared file
  has a row in the override table with a reason.
* `AGENTS.md` carries the connector bootstrap block verbatim, including the "do not vendor"
  and "do not invent missing rules" lines.
* **No shared checkout is committed** — there is nothing to clone, so there must be nothing
  vendored.
* `grep -r` finds **no file named `INDEX.md`** anywhere in the repository.
* **No session link anywhere** — scan the working tree and this branch's commit messages
  (`git log <default-branch>..HEAD --format=%B`) for session, conversation, thread, run, or
  trace identifiers and trailers. Every hit is either ordinary prose or must be removed
  before pushing.
* Every index file lives in `.agents/index/`, is named `{scope}-index.md`, and no index
  file exists outside it — including inside `wiki/`.
* No index lists files from the other set.
* Both wiki trees exist: `wiki/` (plain markdown) and `.agents/wiki/` (frontmatter
  required); no third documentation tree; no page duplicated between them.
* The only root files added are `AGENTS.md`, `README.md`, `LICENSE`.
* Every page is at `wiki/{folder}/{file}.md`, `.agents/wiki/{type}/{file}.md`, or
  `.agents/memory/{type}/{file}.md` — nothing loose at any of those roots.
* Every file's sections belong to its subject; the one permitted duplication is the
  discovery-protocol block.
* Every `.md` in a set and the root `AGENTS.md` has valid `name` + `description`
  frontmatter; every `name` is unique within its set; every cross-set name match is an
  intentional override.
* `AGENTS.md` contains the auto-activation contract, the trigger table, the reading order,
  the routing protocol, the discovery-protocol block with its source-of-truth link, and the
  no-session-links line — and no rule bodies.
* The trigger table matches `rules/auto-activation.md` row-for-row, and every file it names
  exists in the set the row states.
* `README.md` is overview only and points at the wiki index for the full map.
* The root index lists every local index, links to no leaf file, contains no rules, and
  carries the override table even when empty.
* Every index is reachable from the root, names its parent (except the root), and follows
  the index-creator template.
* Every file in an indexed scope appears in exactly one index; no index row points at a
  missing file.
* No scope index exists below the split threshold, and no scope above it is missing one.
* `.agents/rules/repository.md` exists and names the mode and the connector.
* `.agents/wiki/context/repository-map.md` exists and is filled with real discovery output.
* The two seed memory files exist and are indexed.
* The first changelog exists and is indexed.
* `LICENSE` exists — full text with the user's holder and year, or the `# License`
  placeholder.
* Every file selected in §1.5 exists in the set it was selected for, and nothing unselected
  was created.
* All internal links resolve; every cross-set reference uses a placeholder or an `agents://`
  URI rather than a relative path.

---

## 8. Finish

1. Commit in logical groups per
   [`git/commit-conventions.md`](agents://git/commit-conventions.md) — e.g.
   `docs(agents): add agent instruction architecture`,
   `docs(index): add centralized index router and scope indexes`,
   `docs(wiki): add project documentation structure and overview pages`,
   `docs(agent-wiki): add agent knowledge base and repository map`,
   `chore(memory): seed agent memory state and task record`,
   `chore(license): add {LICENSE-ID} license`.
   Strip any session trailer your tooling appends before each commit lands.
2. Push: `git push -u origin docs/agents-setup`. Retry on network failure with backoff
   (2s, 4s, 8s, 16s).
3. **Then stop and ask whether the user wants a pull request opened.** Do not open one on
   your own. If they say yes, use
   [`git/pull-request-template.md`](agents://git/pull-request-template.md) — a
   human-readable title such as
   `Adopt the shared agent instruction set and add repository-local content`, and the full
   Overview / Added / Modified / Deleted / Summary body, with no session link and no
   generated-by footer carrying one.
4. Report the mode, the branch name, the file tree you created, how the shared set
   resolves, and — per
   [`rules/discovery-protocol.md`](agents://rules/discovery-protocol.md) — any instructions
   you noticed or proposed but did not create, each tagged `local` or `shared` and each in
   its own code block, for the user to select from.
