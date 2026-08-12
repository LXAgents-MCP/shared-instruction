---
name: commit-conventions
description: Conventional Commits for commit messages only — format, scope, body, the no-session-trailer rule, and what rides in the same commit.
---

# Commit Conventions

## Format

```
type(optional scope): description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert` — the same list as
[`branching-strategy.md`](agents://git/branching-strategy.md).

Scope is a module or subsystem: `docs(wiki):`, `feat(auth):`, `chore(deps):`,
`fix(registry):`.

## Subject

* Imperative mood — "add", not "added" or "adds".
* Plain text. No links, no issue-tracker IDs, no emoji.
* No trailing period.
* Specific. "update files" describes nothing.

## Body

Optional. Short bullets explaining **what** and **why** — not how, the diff shows how.

## No session links, no session trailers

Not in the subject, not in the body, not as a trailer. See
[`../rules/no-session-links.md`](agents://rules/no-session-links.md). If your tooling
appends one by default, **strip it before committing**. A `Co-Authored-By:` line naming a
tool or model is fine; a line carrying a session identifier is not.

## Granularity

* Commit each logical change, or each group of genuinely related changes.
* **Never batch a whole session into one commit.**
* Review the diff before every commit.

## What rides along

Index and memory updates ship in the **same commit** as the change they describe, never
in a follow-up commit. A commit that adds a file and leaves its index row for later has
left the repository inconsistent.

## Worked example

```
feat(registry): load instruction content once at boot

- read every markdown file under content/ into a frozen registry so all
  sessions share one immutable copy
- hash each normalized body with sha256 so the duplicate audit can compare
  a consuming repository without re-reading the set
- fail fast when a file is missing frontmatter, rather than serving a
  resource an agent cannot route on
```

## This format is for commits only

**Pull request titles use a different format** — plain, human-readable, never a
Conventional Commit prefix. See
[`pull-request-template.md`](agents://git/pull-request-template.md).
