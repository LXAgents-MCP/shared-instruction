---
name: changelog-creator
description: Maintains wiki/logs/{Major}/{Minor}/{Patch}/ — version directory shape, changelog sections, and the session digest cut at each release.
---

# Changelog Creator

Creates and maintains files under `wiki/logs/`, in whichever repository the change landed
in.

## Path shape

```
wiki/logs/{Major}/{Minor}/{Patch}/{file-name}.md
```

Examples: `wiki/logs/1/0/0/CHANGELOG.md`, `wiki/logs/1/0/1/CHANGELOG.md`,
`wiki/logs/1/1/0/CHANGELOG.md`, `wiki/logs/2/0/0/CHANGELOG.md`.

* **Numeric directory segments only** — no `v` prefix, no zero padding.
* The directory shape exists so a version can hold more than one document. `CHANGELOG.md`
  is the default; `MIGRATION.md`, `BREAKING.md`, `UPGRADE.md`, and `NOTES.md` may live
  beside it in the same version directory.

## `CHANGELOG.md`

Sections, in this order, omitting empty ones: `Added`, `Changed`, `Deprecated`, `Removed`,
`Fixed`, `Security`. Include the release date and a one-line summary at the top.

## Creating a version directory requires user approval

A new version directory **is** a version claim, so it is gated exactly like bumping
`package.json` — [`../rules/versioning.md`](agents://rules/versioning.md). Ask which
version applies before creating it, and wait.

## Never rewrite a release

Never edit a released version's log to change history. Corrections go in the next version's
log. Never re-tag, never delete a version directory.

## Shared-set releases

A shared-set release is logged in `LXAgents/mcp-server`, and its entry **names what
consumers must do** — nothing, re-read a file, or drop an override. Consumers pick the
change up on their next read, so the entry is the only notice they get.

## Session digest at each release

At each release, fold that release's `.agents/memory/sessions/` files into a single digest
in the version directory, then delete the originals and their rows in `memory-index.md`.
Strip any session link the originals carried rather than copying it into the digest.

## Keep `logs-index.md` current

Every version, newest first, one row per version directory with a one-line summary and the
files it contains.

## Branch & Commit Convention

Applies to every commit this creator makes.

**Branches** — `{type}/{primary-noun}`, from `feat`, `fix`, `docs`, `style`, `refactor`,
`perf`, `test`, `build`, `ci`, `chore`, `revert`. Branch off the default branch; one task
per branch, one pull request per branch. Never commit directly to the default branch,
never use a tool-preset prefix (`claude/`, `codex/`, `cursor/`), never add a generated
suffix. Multi-task work stacks in dependency order. Canonical:
[`../git/branching-strategy.md`](agents://git/branching-strategy.md).

**Commits** — `type(optional scope): description`. Imperative subject, plain text, no
trailing period, no links, no issue IDs. Optional body of short bullets saying what and
why. Commit each logical change; never batch a session into one commit; review the diff
first. Index and memory updates ride in the **same commit** as the change they describe.
Canonical: [`../git/commit-conventions.md`](agents://git/commit-conventions.md).

## Which Set

Choose the set before the folder. Universal content goes to the shared set served by the
`lxagents-agents-base` connector; repository-specific content stays local; memory is always
local. A shared file is never copied into a repository except as a declared override
registered in `.agents/index/root-index.md`. See
[`../rules/shared-instructions.md`](agents://rules/shared-instructions.md).

## Directory Mandate

* Indexes: `.agents/index/{scope}-index.md` — never an `INDEX.md`, anywhere.
* Agent wiki: `.agents/wiki/{type}/{file}.md` (frontmatter). Human wiki:
  `wiki/{folder}/{file}.md` (no frontmatter).
* Memory: `.agents/memory/{type}/{file}.md` — local only.
* Instructions: `{set}/{folder}/{file}.md` — one subject per file, matching the filename.

Audience test: would a human contributor read it? → `wiki/`. Does it exist only so an agent
behaves correctly? → `.agents/wiki/`. Both? Facts once in `wiki/`, linked from the agent
page. When nothing fits, create a new folder rather than forcing the file into the closest
one. Placement authority: [`../rules/directories.md`](agents://rules/directories.md).

## No Session Links

Nothing this creator writes, commits, or posts may carry an assistant or tool session link
— including any trailer or footer its tooling appends by default. Strip it before the
commit or the post goes out.
[`../rules/no-session-links.md`](agents://rules/no-session-links.md)

## Registration

Every file this creator creates, moves, or removes is registered in the index that owns
that scope, **in the same commit**. See
[`index-creator.md`](agents://creators/index-creator.md).

## Pull Requests and Versions

Any pull request follows
[`../git/pull-request-template.md`](agents://git/pull-request-template.md); merging requires
user approval per
[`../planning/task-workflow.md`](agents://planning/task-workflow.md). Version changes
require user approval per [`../rules/versioning.md`](agents://rules/versioning.md).

## Discovery Protocol

Source of truth: [`../rules/discovery-protocol.md`](agents://rules/discovery-protocol.md).

```
## Discovery Protocol

While working, if you notice an instruction worth adding — a new rule, or new
content for an existing instruction file — do NOT create or edit it yourself.
Collect the findings, and when the task is done present them to the user:

* one finding per message block, each in its own code block;
* state the target set — `local` (this repository) or `shared` (the organization's
  instruction set served by the `lxagents-agents-base` connector);
* include the proposed file path, `name`, `description`, and the full proposed
  body;
* explain in one line why it is worth adding.

Then let the user select which findings to apply. Create only the selected ones.
Never batch-apply, never apply silently. A `shared` finding is never written from a
consuming repository — it is reported so it can be raised against the shared set.

**Scope of this gate:** it covers instruction files in either set. Documentation
pages under `wiki/` and `.agents/wiki/` may be written when the facts are real and
verified. Memory under `.agents/memory/` is written freely and automatically — see
`memory-policy.md`.
```
