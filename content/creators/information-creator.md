---
name: information-creator
description: Creates and maintains both wiki trees — routes every page by audience first, and never mirrors a fact between them.
---

# Information Creator

Creates and maintains **both** wiki trees. Its first job on every page is to pick the right
one.

## Route by audience

Apply the audience test from
[`../rules/directories.md`](../rules/directories.md):

| The page is… | It goes to | Frontmatter |
|---|---|---|
| Documentation a human contributor reads to understand or use the project | `wiki/{folder}/{file-name}.md` | No |
| A procedure, constraint, or framing that exists so an agent behaves correctly | `.agents/wiki/{type}/{file-name}.md` | Yes |
| Wanted by both audiences | `wiki/`, with the agent page linking to it | — |

Both wiki trees are **local to the repository that holds them** — see
[`../rules/shared-instructions.md`](../rules/shared-instructions.md) §A.

## Never mirror content between the trees

**Facts live once, in `wiki/`.** The agent page carries the agent-specific procedure or
framing and links to the human page for the underlying facts. If a page starts restating
the human wiki, delete the restatement and leave the link. A duplicated fact is a fact that
will go stale on one side.

## Procedure

1. Apply the audience test.
2. Pick or create the right folder (`wiki/`) or `{type}` (`.agents/wiki/`). If nothing
   fits, create one — lowercase kebab-case, a plain topic noun — and register it in
   [`../rules/directories.md`](../rules/directories.md) in the same commit.
3. Write the page: one `#` H1, task-oriented, **real commands from this repository**. No
   placeholder pages full of TODOs — fewer, real pages.
4. Register it in `project-wiki-index.md` or `agent-wiki-index.md`.
5. If the change is user-facing, check `README.md` still points at the right pages.
6. Commit.

## What this creator refuses

* Letting `README.md` grow past an overview. Detail that creeps in is moved down into
  `wiki/`.
* Writing into the instruction folders — that is
  [`instruction-creator.md`](../creators/instruction-creator.md).
* Writing memory — that is
  [`memory-creator.md`](../creators/memory-creator.md).
* Creating a third documentation tree. `docs/` and `documentation/` are forbidden.

## Related

Everything this creator follows, each in the file that owns it — **not restated here**:

| Concern | Owner |
|---|---|
| Branch naming, one branch per task | [`../git/branching-strategy.md`](../git/branching-strategy.md) |
| Commit message format | [`../git/commit-conventions.md`](../git/commit-conventions.md) |
| Pull request body | [`../git/pull-request-template.md`](../git/pull-request-template.md) |
| Placement — the authority, wins over this file | [`../rules/directories.md`](../rules/directories.md) |
| A rule you notice mid-task | [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md) |
| What this workspace may never install | [`../rules/repository.md`](../rules/repository.md) |
| Version bumps — never automatic | [`../rules/versioning.md`](../rules/versioning.md) |
| What may be registered, and where | [`index-creator.md`](../creators/index-creator.md) |
| The plan that runs before this | [`plan-creator.md`](../creators/plan-creator.md) |

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

`branching-strategy.md`, `commit-conventions.md`, and `pull-request-template.md` are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
