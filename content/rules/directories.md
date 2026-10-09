---
name: directory-architecture
description: The placement authority — the trees (instructions, indexes, the two wikis, skills, tools, and a repository's memory), the two-wiki audience test, and the algorithm for placing any new file.
---

# Directory Architecture

This file decides where every file goes, in every repository. When any other rule and this
one disagree about placement, this one wins.

## A. The core mandate

All agent-related files strictly follow this centralized structure. Do **NOT** scatter
`INDEX.md` files across directories.

* **Indexes:** `.agents/index/{file-name}.md` (e.g. `root-index.md`).
  Replaces all scattered `INDEX.md` files. Acts as the centralized routing system.
* **Agent Wiki:** `.agents/wiki/{type}/{file-name}.md`.
  The static knowledge base, SOPs, and domain guidelines specifically for agents.
* **Agent Memory:** `{repo}/.agents/memory/{type}/{file-name}.md`.
  Ongoing tasks, dynamic states, session logs, and agent memories. **A repository's, never
  a workspace root's** — see §A.1.
* **Agent Skills:** `.agents/skills/{type}/{file-name}.md`.
  What an external capability **is and how it works** — a document format, a skill
  standard, an API surface. Knowledge, not instruction. See §G.

### The human wiki stays where humans expect it

The mandate above governs **agent-related** files. Human-facing project documentation
is not an agent artifact and keeps its conventional home:

* **Project Wiki (humans):** `wiki/{folder}/{file-name}.md` — overview, architecture,
  guides, reference, environments, release logs. Plain markdown, no frontmatter,
  linked from `README.md`.

So each repository has **exactly two documentation trees, with different audiences,
and never a third**. (`.agents/skills/` is not a third — it documents things that live
outside the repository, not this repository. See §G.)

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

### One set, one repository

**Every repository carries its own instruction set, and that set is the whole
architecture.** There is no producer repository, no published set, no federation, and
nothing to resolve at runtime. Each `{repo}/.agents/` is authoritative for `{repo}` and is
edited in place.

```
<root>/                            <- A WORKSPACE ROOT: a container, not a project
  AGENTS.md                         <- the activation contract, and the entry point
  .agents/                          <- everything, editable in place
    index/  rules/  git/  prompts/  creators/
    skills/  tools/  plans/  wiki/        <- NO memory/ here
  wiki/                             <- human documentation

orgs/{org}/{repo}                   <- A PROJECT: the same shape, PLUS memory/
  AGENTS.md
  .agents/                          <- its own set, not a copy of the root's
    memory/{tasks,state,sessions,decisions}/
  wiki/
```

The one structural difference is `memory/`, and it is not an oversight — see §A.1.

A rule that would apply everywhere is still written **once, in the repository it applies
to.** If another project needs it, that project holds its own copy — and the honest move
when the two diverge is to say which file differs, not to open a release process across
repositories. There is no upstream to release to.

Precedence between the kinds of file is in the root `AGENTS.md`.
Editing these files means editing the file that owns the convention; there is no other
copy to reconcile.

### What this mandate forbids

These are hard failures.

* **No `INDEX.md` anywhere** — not at the root, not in `.agents/`, not in `wiki/`, not
  in `.agents/wiki/`, not in any subfolder, not in a monorepo package. Every index is
  a file inside `.agents/index/`.
* **No index outside the index folder.** A folder never carries its own index. When a
  scope earns an index, that index is a *new file in the index folder*, never a file
  placed inside the scope. This includes `wiki/` — the human tree is routed from
  `.agents/index/project-wiki-index.md`.
* **No memory outside a repository's own `.agents/memory/`.** Memory is per-repository,
  always, and never published anywhere.
* **No `.agents/memory/` at a workspace root.** See §A.1 — the root has no memory tree at
  all, not an empty one.
* **No third documentation tree.** `wiki/` and `.agents/wiki/` are the only two. Do
  not create `docs/`, `documentation/`, or a second human wiki. **An org folder inside
  `.agents/wiki/` is not a third tree** — it is the second level of the agent wiki, and a
  sub-org folder is not a separate tree either. Placement is by the trees table above.
* **No memory outside `.agents/memory/`.** No scratch notes, task trackers, `TODO.md`,
  `NOTES.md`, `STATE.md`, or session logs anywhere else.
* **No loose files at the root of `.agents/`, `wiki/`, `.agents/wiki/`,
  `.agents/skills/`, `.agents/tools/`, or `.agents/plans/`** — and, inside a repository,
  `.agents/memory/`. Every page and memory file lives inside a folder or `{type}`. The
  index folder and the plans folder are the two flat folders; the plans folder holds plan
  files only, and the index folder holds index files only.
* **`.agents/wiki/` has two levels, and both folders are named.** A folder directly inside it
  is either `{type}` (the default level) or `{org}` (the org level) — never a loose page, and
  never a name that is neither. Inside an `{org}` folder, one `README.md` at its root is
  expected and required; everything else lives under a `{type}/`. See §The trees.
* **Only three files may be added at the repository root by the setup task:**
  `AGENTS.md`, `README.md`, `LICENSE`. `AGENTS.md` stays at the root because that is
  where agent tooling looks for it — it is an entry point, not an index.

### The trees

| Tree | Path shape | Nature | Who writes it |
|---|---|---|---|
| Instructions | `{repo}/.agents/{folder}/{file}.md` | Normative. Rules an agent must obey. | Only with user approval. |
| Index | `{repo}/.agents/index/{scope}-index.md` | Routing. Pointers only. | Same commit as whatever it indexes. |
| Project Wiki | `wiki/{folder}/{file-name}.md` | Human documentation. **Per machine — never copied**. | Freely, when the facts are real. |
| Agent Wiki | `.agents/wiki/{type}/{file-name}.md` | Agent knowledge about **this workspace**. | Freely, when the facts are real. |
| Org Wiki | `.agents/wiki/{org}/README.md`, then `.agents/wiki/{org}/{type}/{file-name}.md` | Agent knowledge about **one organization**. Never another org's content. Folder always lowercase. | Freely, when the facts are real. |
| Skills | `.agents/skills/{type}/{file-name}.md` | Capability knowledge about an external thing. Descriptive, never normative. | Freely, and it is the correct response to being handed a skill, a plugin, or an MCP server. |
| Tools | `.agents/tools/{type}/{file-name}.{md,py}` | Runnable capability. The only executable code in `.agents/`. | The `.md` + `.py` pair, written together. |
| Memory | `{repo}/.agents/memory/{type}/{file-name}.md` | Dynamic state. **Repositories only** — §A.1. | Freely and automatically, no approval. |
| Plans | `.agents/plans/{file-name}.md` | A plan written **before** work, describing intent. | Written before any work that is more than one step. |

**A plan and a task record are different files.** A **plan** is written before the work and
says what is *about to happen* — `.agents/plans/`, one file per piece of work, and it
exists only while the work is in flight. A **task record** is written before and updated
during, then kept as history — `{repo}/.agents/memory/tasks/`. Past task records do not
migrate to `.agents/plans/`.

**A finished plan is deleted, not moved.** The plans folder is flat and holds only what is
in flight, so a plan left sitting in it is indistinguishable from work under way — the next
session reads it as current. Moving one is the same defect wearing a different name: it
puts history in the place that means *now*. What remains after the work is the record the
plan produced, which is written before the work and outlives it.

**`.agents/plans/` must exist before any work that needs a plan.** It is created on demand
and is authorized here whether or not it currently holds anything.

**Instructions are normative and gated, memory is dynamic and ungated, the two wikis
are descriptive and in between.** Never record dynamic task state as an instruction,
and never let a wiki or memory file assert a rule. When a wiki or memory page disagrees
with an instruction, the instruction wins, always. A skills page is a **record of how
something external works** — it is a fourth kind of descriptive page, sitting beside the
two wikis, and it is *never* a place to write a rule about this workspace. If a skills
page starts saying "always do X", that is an instruction and it belongs in `rules/`.

### A.1. Memory is a repository's, and the root's is gone

**`.agents/memory/` exists in a project, never at a workspace root.** Not empty — absent.

A root is a **container**: it holds projects and the instruction set they are built from.
Nothing is worked on there. Memory records work in progress, decisions, and live state, and
at the root there is none to record — the only thing ever "worked on" at the root is the
instruction set itself, and that history is descriptive, so it belongs in
`.agents/wiki/context/`.

**Why the distinction holds.** Memory is a record of *this machine's work*. A root is
exactly the place that has no work of its own, so a root memory tree could only ever hold
one thing: notes about the workspace's own construction. Those notes are worth keeping —
they are not worthless — but they are **history**, not state, and `wiki/` is where history
goes.

**What to do instead, per need:**

| You want to record | Not memory — this |
|---|---|
| What exists in this workspace | `.agents/wiki/context/repository-map.md` |
| How the instruction set got this way | `.agents/wiki/context/instruction-set-history.md` |
| Work in progress on a project | `{repo}/.agents/memory/tasks/{slug}.md` — in the project |
| The plan for work about to start | `.agents/plans/` — **which the root does have** |

**A plan is not a record, and the root has plans.** The exemption is deliberate: a plan
exists only while the work is in flight and is deleted when it lands, so it cannot go stale
the way a memory file can. That is also why the plan for work on the instruction set itself
lives at the root.

**Never create `.agents/memory/` here.** If you are at a root and believe state must be
recorded, the work belongs in a project — name the project and move there.

## B. Instruction folders

Use only those the repository needs. Each is `{repo}/.agents/{folder}/{file}.md`.

| Folder | Holds |
|---|---|
| `rules/` | Repository-wide rules and the directory architecture itself. |
| `git/` | Branching strategy, commit format, pull request format. |
| `creators/` | The instruction / information / changelog / index / memory creators. |
| `prompts/` | Standing prompt templates and few-shot examples. |
| `docs/` | Rules for writing README, wiki, and index files. |
| `skills/` | Normative step-by-step procedures for recurring tasks — an instruction, so it is gated like any other. **Not** `.agents/skills/`; see §G. |
| `tools/` | Normative rules about tools — schemas, contracts, what a tool may do. **Not** `.agents/tools/`; see §H. |
| `knowledge/` | Domain context an agent needs to reason correctly. |
| `personas/` | Roles and behaviors to adopt. |
| `ethics/` | Safety boundaries and constraints. |
| `architecture/` | System design guidelines and structural constraints. |
| `api/` | API design standards and specification guidelines. |
| `database/` | Schema design, migrations, query constraints. |
| `security/` | Security policy, secret handling, vulnerability prevention. |
| `performance/` | Performance, memory, and bottleneck guidelines. |
| `dependencies/` | Package management and version-update policy. |
| `compliance/` | Licensing, legal, and privacy policy. |
| `deploy/` | Deployment, environments, containerization. |
| `workflows/` | CI/CD automation rules. |
| `testing/` | Test strategy, coverage, fixtures. |

`index/`, `wiki/`, and — inside a repository — `memory/` are **reserved structural folders**,
not instruction folders. Never put an instruction file in any of them.

**Register a folder in the table above when you create it**, and in the index that owns that
scope in the same change. That is the only reason a folder needs registering anywhere: there
is no server collecting files by walking a directory, so a new folder is invisible until the
tables say it exists.

**The one thing that can still go wrong is a `name` collision** — two files with the same
frontmatter `name`, in different folders. Nothing refuses to start now that no server reads
these files, so the failure is silent: one file shadows the other and nothing says which won.
**Treat a `name` collision as a finding.**

## C. `wiki/` folders — human documentation

`wiki/{folder}/{file-name}.md`, plain markdown, no frontmatter, always local.

| Folder | Holds |
|---|---|
| `information/` | What the project is, architecture, features, concepts. |
| `environments/` | `docker.md`, `docker-compose.md`, `env.md`, local setup, CI. |
| `guides/` | Task-oriented how-tos for people. |
| `reference/` | Commands, config keys, API surface, schema. |
| `security/` | This repository's own security model — trust boundaries, attack surface, posture. |
| `logs/` | Versioned change logs — the one folder allowed extra depth. |

## D. `.agents/wiki/` types — agent knowledge

`.agents/wiki/{type}/{file-name}.md`, frontmatter required, always local.

| Type | Holds |
|---|---|
| `context/` | Orientation an agent needs before touching code: what lives where, build/test commands, entry points, gotchas. |
| `sop/` | Standard operating procedures an agent follows step by step. |
| `domain/` | Domain vocabulary, business rules, external-system behavior an agent must respect. |
| `security/` | The security procedure and constraints for **this** repository — never carried to another. |

**Facts live once, in `wiki/`.** An `.agents/wiki/` page carries the agent-specific
procedure or framing and links to the human page for the underlying facts. If you catch
yourself pasting the same paragraph into both trees, the page belongs in `wiki/` and
the agent page should be a link.

## E. `.agents/memory/` types — in a repository only

`{repo}/.agents/memory/{type}/{file-name}.md`, always local. **Not at a workspace root** —
§A.1 is the rule and this section is the shape.

| Type | Holds | Lifetime |
|---|---|---|
| `tasks/` | One file per ongoing or completed task: goal, plan, status, branches, PRs. | Until the task ships, then archived. |
| `sessions/` | `{yyyy-mm-dd}-{slug}.md` — what happened in a working session. | Rolled into a digest each release. |
| `decisions/` | One file per durable decision: context, options, choice, consequence. | Permanent. |
| `state/` | Current dynamic state of an area — what is live, broken, in flight. | Overwritten in place, always current. |

## F. Placement algorithm

1. **Name the repository.** The file goes in `{repo}/.agents/`, where `{repo}` is the
   repository doing the work — the root workspace, or `orgs/{org}/{repo}`. **There is one
   set.**
   If the answer is *the root* and the subject is **dynamic state**, stop — see §A.1.
   Ask only whether the rule is *over-fitted to one situation*, which is a quality question
   about the rule and not about where the file goes.
2. **Classify next:** is the new file **normative** (instruction), **routing** (index),
   **human documentation** (`wiki/`), **agent knowledge** (`.agents/wiki/`), **capability
   knowledge** (`.agents/skills/`), **runnable** (`.agents/tools/`), or **dynamic state**
   (memory — a repository only, §A.1)? The answer picks the tree, and the tree is not
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
7. **If an existing file covers the subject, extend it — but only when the extension shares
   that file's `name`.** "Covers the subject" is not enough; a new rule about a new topic is
   a **new file**, whatever the old file happens to mention. The test is step 8: if the
   section heading has nothing to do with the file's `name`, it is a new file. This rule
   outranks any instinct against near-duplicates — a rule that reads as a near-duplicate
   but has a different subject is not one. For instructions, extending is subject to the
   discovery protocol: propose, do not self-apply.
8. **One subject per file, and the subject must match the filename.** A rule that
   applies across several topics is its own file, linked from the files it affects —
   never a section bolted onto a file about something else. If you are about to add a
   section whose heading has nothing to do with the file's `name`, that section is a
   new file.
9. Never place a loose file at the root of `.agents/`, `wiki/`, `.agents/wiki/`, or
   `.agents/plans/` — and, in a repository, `.agents/memory/`. Every file sits inside a
   folder or `{type}`.
10. Depth is `{repo}/.agents/{folder}/{file}.md`, `wiki/{folder}/{file}.md`,
    `.agents/{tree}/{type}/{file}.md`, `.agents/skills/{type}/{file}.md`,
    `.agents/tools/{type}/{file}.{md,py}`, and `.agents/plans/{file}.md`. A type may hold
    one folder deeper when a
    subject needs several pages (§G). The only exception is `wiki/logs/`, which has its own
    required shape.
11. Never create an `INDEX.md`. Never create a third documentation tree. Never create a
    second instruction set.
12. Handed a skill, a plugin, a marketplace, or an MCP server — **record it in
    `.agents/skills/{type}/`, never install it.** §G here only decides the path.

## G. `.agents/skills/` types — capability knowledge

`.agents/skills/{type}/{file-name}.md`, frontmatter required, always local.

This tree answers one question: **what is this external capability, and how does it
actually work?** It is a written record, not an install. Nothing in it is executed, no
row in the instruction tools block routes to it, and creating a file here adds no
capability to the session.

| Type | Holds |
|---|---|
| `document/` | A document or file format: how it is structured, what a valid file looks like, what the tooling rejects. |
| `visual-design/` | How to make something look right: layout systems, type scales, colour, component form. |
| `engineering/` | Building against the capability: APIs, SDKs, protocols, CLI surfaces, build and deploy mechanics. |
| `authoring/` | Producing the artifact itself: writing, editing, generating, publishing. |
| `guidance/` | How to work with the capability well: practice, conventions, review criteria, known traps. |
| `reference/` | The specification as published — fields, limits, and rules quoted or cited from upstream. |

**A type may hold a folder, not only files.** When a subject needs more than a handful of
pages, nest them — `.agents/skills/{service}/{operation}.md` rather than one
`{service}.md` covering everything. The reason is loading, not tidiness: an agent doing one
`gh pr create` should read one file, not the whole service. One subject per file still
holds inside the folder; there are simply more subjects. Register the folder here when you
create it.

**A service folder occupies a type-level slot.** When a service is big enough to need its
own folder, that folder sits beside the six types rather than inside one — it is *what* is
being documented, where `github/` is *how* it works. Registered service folders:

| Folder | Holds | Shared with |
|---|---|---|
| `github/` | One file per GitHub operation: authentication, pull requests, issues, repositories, releases, actions, API. | `gitlab/` — concepts both forges share go in `reference/`, never duplicated across the two. |

The same slot serves any future forge: `bitbucket/`, `gitea/`. A new forge is a new
**service folder**, never a new type — the six types describe the *kind* of knowledge, and
they do not change because a new tool exists. This mirrors §H, where a service nests under
a type (`tools/vcs/github-pr-create.py`) rather than becoming one.

**What does not go here.** Anything about *this workspace* — those are instructions
(`rules/`) or knowledge (`.agents/wiki/`). A skills page describes something that lives
outside the repository; a wiki page describes the repository.

**Authoring.** One subject per
file, filename matching the subject, frontmatter `name` and `description` where the
upstream format calls for them, and a link from the page that referred to the
capability.

**These pages are not gated.** Unlike an instruction, a skills page asserts nothing about
how an agent must behave, so writing one is not a rule change. The never-install rule is still absolute and is a different thing:
it is about what may exist in the workspace, not about what may be written down.

## H. `.agents/tools/` — runnable capabilities

`.agents/tools/{type}/{file-name}.{md,py}`, always local.

This tree answers a different question from §G: **what does an agent run when no built-in
tool does the job?** It exists because the honest answer is sometimes "write a script" — and
that script should land somewhere reviewable rather than being improvised inline, lost, and
repeated.

### The pair is mandatory

A tool is **always two files sharing a base name**:

```
.agents/tools/{type}/{file-name}.md    what it does, when to use it, how to run it
.agents/tools/{type}/{file-name}.py    the executable
```

Both or neither. **A `.md` with no `.py` is not an unfinished tool — it is a skill**, and
it belongs in `.agents/skills/` where nothing is expected to run. A `.py` with no `.md` is
worse: executable code nobody has read, which is the one thing this tree must never hold.

### Skills and tools

| | Skills | Tools |
|---|---|---|
| Used by | being read | being run |
| Files | `.md` | `.md` + `.py`, same base name |
| Answers | how does this work | do this, now |

Both trees carry prose. Only `tools/` is executable. **Never use a skills page as a stub
for a tool you decided not to write** — that inverts the pair rule and leaves a `.md` that
promises a capability it does not have.

### Types

| Type | Holds |
|---|---|
| `vcs/` | Version control and forges — GitHub, GitLab. API and CLI wrappers. |
| `http/` | Fetching, polling, calling an arbitrary endpoint. |
| `data/` | Parsing, reshaping, converting JSON, CSV, YAML. |
| `text/` | Extracting, reformatting, diffing, bulk-rewriting prose. |
| `file/` | Walking, renaming, inspecting, batch operations on trees. |
| `sys/` | Environment inspection and process control. |

**A service nests under a type, never at the tree root.** `.agents/tools/vcs/github.py`,
not `.agents/tools/github.py`. The type says what kind of thing the tool is and the leaf
says which service, so a new forge is a new file in an existing folder rather than a new
branch needing its own routing row and type-table entry. A top-level `gitlab/` would also
be ambiguous — a folder named for a service, holding files named for the same thing.

### The `.md` must say three things

1. **What it does**, in one line, and **when to reach for it** — the situation, not the
   command.
2. **Whether it needs the network.** The sandbox has no egress; a tool that needs it
   cannot run in-session, and the `.md` must say so and give the user a command to run on
   the host.
3. **What it changes.** A tool that writes, deletes, or rewrites says so explicitly, in
   terms of what a wrong run would cost.

That third one is not boilerplate. The root is not a git repository, so **there is no
version history for a `.py` here** — it cannot be diffed, rolled back, or reviewed before
it lands. Executable code is the highest-blast-radius content in this workspace, and these
three lines are the only review most tools will get.

### Rules

* **One tool, one operation.** No subcommand dispatchers, no 400-line scripts with modes.
  Small single-purpose files are individually testable and individually deletable.
* **`--help` before anything else.** Every tool prints usage and exits 0 on `--help`.
* **Argument parsing with `argparse`.** Invented parsing is where the bugs live.
* **Exit non-zero on failure, and print the reason to stderr.** A tool that exits 0 having
  failed is worse than one that crashes.
* **Dry-run by default where the tool writes.** Require `--apply` to make a change
  destructive enough that asking twice is cheaper.
* **Never write a session link.** No tool's output may carry one.
* **A tool is not installed, so the never-install rule does not forbid it.** That rule
  stops a *third-party* capability entering the workspace; a script written here is the
  opposite case. Copying someone else's script into this tree **is** forbidden — write
  your own, or record what theirs does in `.agents/skills/`.

### Authoring

A tool is registered in the tool index.

**Writing a tool is not gated** — it is code, not a rule about behaviour. But if writing
it reveals a **missing rule**, stop and propose it to the owner rather than writing it.
