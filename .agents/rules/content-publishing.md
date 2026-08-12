---
name: content-publishing
description: Editing content/ publishes to every consuming repository — the boot invariants, the release obligation, and why .agents/ is not published.
---

# Content Publishing

`content/` is not a source folder. It is the **product**: every file in it is served as
an `agents://` resource and read by every repository that connects the connector.

A file added to `content/` is published on the next boot. There is no draft space and no
staging area inside it.

## The boundary

| Change to… | Effect |
|---|---|
| `content/**` | Published. Changes behaviour in every consuming repository. Is a release. |
| `.agents/**` | Local to this repository. Published to nobody. |
| `wiki/**` | This repository's human documentation. Published to nobody. |
| `src/**`, `test/**` | The server. A release only when it changes the served surface. |

Before editing anything under `content/`, ask the routing question from
[`content/rules/directories.md`](../../content/rules/directories.md): *is this true for
more than this repository?* If the answer is no, it belongs in `.agents/` and must not
go into `content/`.

## Boot invariants

The registry (`src/content/registry.js`) validates the set at startup and **refuses to
start** when it is violated. These are not style preferences; each one would break a
consuming repository silently:

| Invariant | Why it is fatal |
|---|---|
| Every file has `name` and `description` frontmatter | A resource without a description cannot be routed on. |
| `description` is ≤ 140 characters | Routing quality is capped by description quality; long ones stop being scannable. |
| Every `name` is unique within the set | `name` is the override key. An ambiguous one breaks precedence in every consumer. |
| The file sits in a declared instruction folder | A stray file in `content/` must not silently become a published rule. |

`npm test` checks all four. Run it before committing anything under `content/`.

## A content change is a release

Because consumers read the set live, they pick a change up on their next read with no
upgrade step. That makes the release log the only notice they get, so:

1. Decide the version with the user first —
   [`content/rules/versioning.md`](../../content/rules/versioning.md). Never bump
   unasked.
2. Add `wiki/logs/{Major}/{Minor}/{Patch}/CHANGELOG.md`, with the **Consumers must**
   line filled in: nothing, re-read a file, or drop an override.
3. Add the row to `content/index/logs-index.md`, newest first.
4. Update `package.json`.

Renaming or removing a `name` is a **major** bump: a consuming repository's override
silently stops matching, and its local copy quietly becomes authoritative.

## Restart to see a change

Content is read once at boot into a frozen structure, so editing `content/` has no
effect on a running process. `npm run dev` restarts on change for HTTP; restart manually
for stdio. In production the deploy is the restart.

## Keep the two surfaces identical

The prompts and the tools deliver the same procedures from `src/server/payloads.js`. A
repository set up through a tool must receive exactly what one set up through a prompt
receives. When changing a procedure, change it in `content/` — never in a surface — and
keep the tests that assert the two are byte-identical.
