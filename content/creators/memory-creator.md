---
name: memory-creator
description: Maintains a repository's .agents/memory/ — the one creator exempt from the approval gate, because memory that waits for permission never gets written.
---

# Memory Creator

Creates and maintains files under `{repo}/.agents/memory/`.

## Step 0 — where is the work?

**Before anything else, name the repository doing the work.** This creator writes only into
a project's memory.

**At a workspace root, this creator does not run.** There is no memory tree there, and
creating one is refused — see [`../rules/memory-policy.md`](../rules/memory-policy.md) §A and
[`../rules/directories.md`](../rules/directories.md) §A.1.

If you are at a root and believe state must be recorded, the work belongs in a project.
**Name the project and go there.** If the subject is not project work at all, it is not
memory — use the routing table at the bottom of this file.

## No approval gate

**This creator is exempt from the discovery protocol's approval requirement for its own
writes.** The reason is practical: memory that waits for permission is memory that never
gets written, and a session that records nothing forces the next session to start over.

The exemption covers memory only. The moment this creator wants to write a rule or a wiki
page, the normal gates apply.

## Memory is local to its repository

It lives in the repository doing the work, at `{repo}/.agents/memory/`. This creator never
copies memory between repositories, never uses memory to carry a convention, and never
writes outside the repository the work is in.

## Procedure

1. Pick the right `{type}`, under `{repo}/.agents/memory/`:

   | Situation | File |
   |---|---|
   | Ongoing work | `tasks/{slug}.md` — created as **task 1** of the work it plans, then appended to by every task after it. See [`plan-creator.md`](plan-creator.md) §B. |
   | What happened in a session | `sessions/{yyyy-mm-dd}-{slug}.md` |
   | A choice with consequences | `decisions/{slug}.md` |
   | Current live state of an area | `state/{area}.md`, overwritten in place |

2. Check `{repo}/.agents/index/memory-index.md` for an existing file on the same subject and
   **extend it rather than creating a near-duplicate**.
3. Write or update the file: frontmatter, one `#` H1, dated entries newest-first under
   `## {YYYY-MM-DD}` headings.
4. Register it in `{repo}/.agents/index/memory-index.md`.
5. Commit — **in the same commit as the work it describes**.

## When to write, without being asked

* **Before** the work, as task 1 — the task record, holding the confirmed list.
* At the end of every task, as that task's own entry in the record, in the same commit as
  its work.
* When a decision is made that a future session would otherwise re-litigate.
* When work is left unfinished.
* When something surprising is learned about the codebase.
* When a branch or pull request is opened.
* When an override is added or dropped.

## Never write

* **At a workspace root — never, for any type.** Step 0 stops it; this is the refusal.
* Secrets, tokens, credentials, private keys.
* Customer data or personal data.
* Full file dumps.
* Assistant or tool session links. **A session log records *what happened*; it never
  records the URL of the session it happened in.**
* Anything you would not put in a public commit — memory is committed to git like
  everything else.
* **A path outside the repository** — an absolute path, a home directory, or a machine's
  folder name. Memory is read on other machines. See
  [`../rules/repository.md`](../rules/repository.md) §No file names a location outside
  itself.

## Memory is never normative

A memory file may say "we currently do X". It may never say "always do X".

## Staleness

Before trusting a memory file, check its newest entry date against the repository's current
state. **If they disagree, the repository wins** — correct the memory file in the same
commit as your work.

## Retention

* When a task ships, mark its `tasks/` file `status: done` with a closing entry. For a
  multi-task request this happens in the **release task**, which also fills the record's
  `PR` column — see [`plan-creator.md`](plan-creator.md)
  §F.
* At each release, fold `sessions/` files older than that release into one digest under the
  release's log directory, then delete the originals and their rows in `memory-index.md` —
  see [`changelog-creator.md`](changelog-creator.md).

Full policy: [`../rules/memory-policy.md`](../rules/memory-policy.md).

## Boundaries

This creator never writes rules and never writes wiki pages in either tree.

* If a memory entry starts sounding like a permanent rule, route it through
  [`instruction-creator.md`](instruction-creator.md) and
  [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md).
* If it is a durable fact, route it through
  [`information-creator.md`](information-creator.md).

**And it never runs at a workspace root** — step 0, and the refusal above.

## Related

Everything this creator follows, each in the file that owns it — **not restated here**:

| Concern | Owner |
|---|---|
| Branch naming, one branch per task | [`../git/branching-strategy.md`](../git/branching-strategy.md) |
| Commit message format | [`../git/commit-conventions.md`](../git/commit-conventions.md) |
| Pull request body | [`../git/pull-request-template.md`](../git/pull-request-template.md) |
| Placement — the authority, wins over this file | [`../rules/directories.md`](../rules/directories.md) §A.1 |
| Why the root has no memory | [`../rules/memory-policy.md`](../rules/memory-policy.md) §A |
| A rule you notice mid-task | [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md) |
| What this workspace may never install | [`../rules/repository.md`](../rules/repository.md) |
| Version bumps — never automatic | [`../rules/versioning.md`](../rules/versioning.md) |
| What may be registered, and where | [`index-creator.md`](../creators/index-creator.md) |
| The plan that runs before this | [`plan-creator.md`](../creators/plan-creator.md) |

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

`branching-strategy.md`, `commit-conventions.md`, and `pull-request-template.md` are written
for a repository with a default branch. **A workspace root has no git at all**, so there is
no branch to create and no commit to make there — and no memory either. Root work is written
directly, planned in `.agents/plans/`, and described in `.agents/wiki/context/`. The
conventions here, and this creator, apply inside `orgs/{org}/{repo}/`.
