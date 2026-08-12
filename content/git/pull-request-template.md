---
name: pull-request-template
description: Pull request title rules (human-readable, never a commit prefix) and the required Overview / Added / Modified / Deleted / Summary body.
---

# Pull Request Template

## Title rules

A pull request title is written **for a human scanning a list of pull requests**, not for
a parser.

* **Never** use a Conventional Commit prefix — no `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`. That convention belongs to commits alone.
* Write a plain, capitalized phrase, verb-first where it reads naturally.
* No trailing period, no issue IDs, no emoji, no branch names, no session or run URLs.
* Say what the change *is*, specifically. "Update files" is not a title.
* Lead with `Breaking Change` when the PR breaks an existing contract — including a
  shared-set change that alters a convention consumers already follow.

Examples of the expected shape:

* `Breaking Change: replace the session token format`
* `Add new API for identity lookup`
* `Delete the legacy migration scripts`
* `Update the Docker environment to Node 22`
* `Fundamental rework of the storage layer`

## Body

Use exactly these sections, in this order:

```
# Overview

{contents}

# Added

- {contents}
- {contents}

# Modified

- {contents}
- {contents}

# Deleted

- {contents}
- {contents}

# Summary

{contents}
```

## Body rules

* **Overview** — two to five sentences: what this pull request does, and why it exists.
  Enough that a reviewer who has not read the task can follow it.
* **Added / Modified / Deleted** — one bullet per real change, each naming the file,
  module, endpoint, or surface it touches, then what changed about it. No vague bullets
  ("various fixes"), no bullet that restates the heading.
* Keep the heading order. Drop a section only when it is genuinely empty — do not keep a
  heading with "None" or "N/A" under it.
* **Summary** — the reviewer's takeaway: blast radius, risk, what to test, and what
  follows this pull request. For a shared-set change, name which repositories are
  affected.
* Never leave a `{contents}` placeholder, and never ship an empty section.
* **No session links anywhere** in the title, the body, or a review comment — and no
  generated-by footer carrying one. Strip whatever your tooling appends before posting.
  Provenance names the tool, never the conversation. See
  [`../rules/no-session-links.md`](agents://rules/no-session-links.md).
* Add the merge-order line required by
  [`../planning/task-workflow.md`](agents://planning/task-workflow.md) when the PR is
  part of an ordered chain — including a chain that spans repositories. For example:
  `Merge order: 2 of 4 — merges after #17`.
* If a repository also has a `.github/pull_request_template.md`, **this file stays the
  source of truth for wording**; mirror these headings there rather than maintaining two
  different shapes.
