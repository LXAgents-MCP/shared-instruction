---
name: information-creator
description: Creates and maintains both wiki trees — routes every page by audience first, and never mirrors a fact between them.
---

# Information Creator

Creates and maintains **both** wiki trees. Its first job on every page is to pick the right
one.

## Route by audience

Apply the audience test:

| The page is… | It goes to | Frontmatter |
|---|---|---|
| Documentation a human contributor reads to understand or use the project | `wiki/{folder}/{file-name}.md` | No |
| A procedure, constraint, or framing that exists so an agent behaves correctly | `.agents/wiki/{type}/{file-name}.md` | Yes |
| Wanted by both audiences | `wiki/`, with the agent page linking to it | — |

Both wiki trees are **local to the repository that holds them**.

## Never mirror content between the trees

**Facts live once, in `wiki/`.** The agent page carries the agent-specific procedure or
framing and links to the human page for the underlying facts. If a page starts restating
the human wiki, delete the restatement and leave the link. A duplicated fact is a fact that
will go stale on one side.

## Procedure

1. Apply the audience test.
2. Pick or create the right folder (`wiki/`) or `{type}` (`.agents/wiki/`). If nothing
   fits, create one — lowercase kebab-case, a plain topic noun — and list it wherever the repository's folder layout is documented, in the same commit.
3. Write the page: one `#` H1, task-oriented, **real commands from this repository**. No
   placeholder pages full of TODOs — fewer, real pages.
4. Register it in `project-wiki-index.md` or `agent-wiki-index.md`.
5. If the change is user-facing, check `README.md` still points at the right pages.
6. Commit.

## What this creator refuses

* Letting `README.md` grow past an overview. Detail that creeps in is moved down into
  `wiki/`.
* Writing into the instruction folders, or writing memory — those belong to other
  creators.
* Creating a third documentation tree. `docs/` and `documentation/` are forbidden.

## Where this applies

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

The branch, commit, and pull request conventions are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
