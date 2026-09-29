---
name: memory-tasks-per-file-tools
description: Replacing the single path-taking instruction tool with one generated tool per content file, across all four instruction MCP servers; the 2.0.0 release.
---

# One Tool Per File

## 2026-09-29 — planned

**Goal.** Every one of the four instruction MCP servers exposed its whole `content/` set
through a **single tool that took a `path` argument** — `instruction`,
`security_instruction`, `roblox_instruction`, `roblox_security_instruction`. A model had to
already know a path string before it could ask for anything, so the surface could not be
navigated by the thing that navigates surfaces: the tool list.

Invert it. **One tool per file**, so each convention is a callable a client can route to
from its description, and the tool list *is* the index.

**Objective.** In all four repositories: `src/tools/from-content.js` generating the whole
surface from `content/` at boot, the path tool removed, `test/server.test.js` rewritten
around the properties that survive its removal, and every document that describes a
different surface corrected. One branch per repository, `feat/per-file-tools`, pushed with
**no pull request and no merge**, per the user's standing instruction.

**Why a generated surface and not a hand-written list.** The previous surface was a
hand-maintained table in `src/constants.js` beside a matching prose block in
`src/server/tools.js` — two lists that had to agree, with a boot-time throw when they did
not, and a release every time a convention was added. Deriving the name from the path makes
the second list unnecessary: adding a file to `content/` adds its tool, and there is nothing
else to edit. That is the actual defect being fixed. The per-file shape is the means.

**Why the zero-argument design is the security property, not a side effect.** Removing the
`path` argument is what makes traversal *unrepresentable* rather than *checked*. The old
tool needed `isSafeRelativePath` because a caller had something to traverse with. A
reviewer should read "no tool takes an argument" as load-bearing, and the suite pins it
explicitly for that reason — an argument creeping back in is a security regression, not a
convenience.

**Not a rename.** Every published tool name changes, so this is major, and the
**Consumers must** column is the whole release note. `branch_strategy` →
`branching_strategy`, `commit_strategy` → `commit_conventions`, `read_shared_agents_instruction`
and `agents_model_name_format` are gone with nothing replacing them. A repository that
ignores the release keeps calling names that do not exist — the same failure `1.0.0` had,
one level down.

**Two pre-existing bugs found and fixed in the new code, both worth remembering.** The
generator's `TOOL_FILES` map stored a file's *text* under its tool name where its own doc
comment said it stored the *path*. And the reachability test re-derived tool names inline,
so it could not catch a mistake *in the derivation* — it now reads the names from the map
the generator built. A test that repeats the thing it is checking is a second
implementation, and two implementations disagree quietly.

**The documentation was the bigger job.** PR #63 (`31daa86`) removed `src/constants.js`,
`src/server/`, `src/cli.js`, `src/logger.js`, `src/transport/`, and `src/content/`, and left
`README.md`, `wiki/**`, `.agents/rules/**` and much of `content/` describing all of it:
13 tools, MCP prompts, `agents://` resources, an `lxagents-agents` CLI, a streamable-HTTP
transport, twelve environment variables, and a Render deployment. Twenty files, most of them
wholesale fiction with a few true sentences — which is why they were rewritten rather than
patched, since repairing sentences inside a fiction leaves a fiction. Verified rather than
assumed: `grep process.env src/` returns nothing, and there is no `Dockerfile`,
`compose.yaml` or `render.yaml` in the tree.

**Left deliberately.** `src/content.js` survives, because `mcp_list` is a live caller of
`readSetFile` with a constant path. Its `isSafeRelativePath` check is now
belt-and-braces rather than the primary guard, and it still earns its place.

**`plan_creator` gained a step, per an explicit user instruction.** It now checks
`.gitignore` for `/.agents/plans/` before writing a plan, and if the rule is absent it
**asks the owner to add it** — naming the line and the reason — and does not edit
`.gitignore` itself. A rule added unasked is a change nobody approved, and the creator's
own file is not the repository's. The `Branch & Commit Convention` section was left
untouched: a test pins it byte-identical across all seven creators, and it is not what was
asked about.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `feat/per-file-tools` | `LXAgents-MCP/shared-instruction` — the whole change. | *none, by instruction* |
| 2 | `feat/per-file-tools` | `LXAgents-MCP/security` | *none, by instruction* |
| 3 | `feat/per-file-tools` | `RBAgents-MCP/shared-instruction` | *none, by instruction* |
| 4 | `feat/per-file-tools` | `RBAgents-MCP/security` | *none, by instruction* |

The three smaller repositories are separate packages at `0.1.0`, and a major from a `0.x` is
`1.0.0` per `versioning.md`.

## Per-task record

### Task 1 — `feat/per-file-tools`, `LXAgents-MCP/shared-instruction`

**Code.** `src/tools/from-content.js` walks `content/` at import, derives a name per file,
takes the description from that file's own frontmatter, and reads the file once into a
frozen `Map`. It throws at boot on a name that is not a valid MCP identifier, on two files
claiming one name, on a missing `description`, or on an empty set. `src/server.js` spreads
the result into `TOOL_MODULES` alongside the hand-written `mcp_list`.

**The override.** `AGENTS.md` would derive to `agents`, which says nothing about which
document it is, so it is `agents_entry_point`. It is the only exception, and it is an
explicit list rather than a rule, because a rule that guesses is a rule that guesses wrong
sometimes.

**Tests.** 17 → **19**. The path-based cases — traversal, unknown path, set root, path
schema — were **deleted, not ported**: there is no path to attack, and a test asserting a
guard exists is a test that survives the guard being removed. In their place: bijection in
both directions, name derivation, no tool declaring an input schema, byte-for-byte fidelity
per file, and total-served equal to total-on-disk.

**Docs.** Nine `wiki/` and `README.md` files rewritten; nine `content/` files corrected;
six local rule, wiki and state files rewritten. Every one of them described a surface the
server stopped serving in #63.

**Release.** `1.0.0` → **`2.0.0`**, with the full old-to-new tool mapping in the
**Consumers must** column, because a rename release is unreadable without one. Approved by
the user before the work started.

**Open, and needing the owner:**

* `src/tools/instruction.js` is dead — nothing imports it. Deleting a pre-existing file
  was refused by the permission layer, and it was not worked around. It is inert, so it is
  not urgent, but it is still on disk and still on the default branch:

  ```
  git -C C:\Users\owen\MyProjects\LXAgents-MCP\shared-instruction rm src/tools/instruction.js
  ```

* `.dockerignore` and `wiki/environments/docker.md` are the only trace of a build setup
  that no longer exists. Both are deletion candidates; neither was removed unilaterally,
  for the same reason.

* Every per-file `version:` in `content/` is still `1.0.0`. The set-level bump was
  approved; per-file bumps were not, and `versioning.md` gates them on the owner. Say so
  and they move.

## Record closed

Not yet. Tasks 2–4 are outstanding.
