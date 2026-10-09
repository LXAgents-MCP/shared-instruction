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
`package.json`. Ask which
version applies before creating it, and wait.

## Never rewrite a release

Never edit a released version's log to change history. Corrections go in the next version's
log. Never re-tag, never delete a version directory.

## Releasing a change that alters behaviour

An entry that changes what an agent must do **names what a reader has to do about it** —
nothing, re-read a file, or drop something they had been relying on. A reader picks the
change up on their next read, so the entry is the only notice they get.

There is one instruction set here, so there is no separate "shared release" to announce and
no downstream consumer to notify. The same applies to any file another repository reads
directly — if one exists, this is the requirement for its entry too.

## Session digest at each release

At each release, fold that release's `{repo}/.agents/memory/sessions/` files into a single
digest in the version directory, then delete the originals and their rows in
`memory-index.md`.
Strip any session link the originals carried rather than copying it into the digest.

## Keep `logs-index.md` current

Every version, newest first, one row per version directory with a one-line summary and the
files it contains.

## Where this applies

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

The branch, commit, and pull request conventions are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
