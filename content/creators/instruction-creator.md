---
name: instruction-creator
description: Writes instruction files in either set — decide the set, confirm it is new, write it testable, register it, wire its trigger.
---

# Instruction Creator

Creates and maintains **normative** files: rules an agent must obey. It writes nothing
else.

## Procedure

1. **Name the repository.** The rule goes in `{repo}/.agents/`, where `{repo}` is the
   repository doing the work. There is **one set** — this workspace is plain `.md` files,
   with no server serving them and no second set to reconcile against.
2. **Confirm it does not already exist.** Check `agents-index.md`. If something already
   covers the subject, extend that file — **but only when the extension shares that file's
   `name`** (step 4). A new rule about a new topic is a **new file**, whatever the old file
   happens to mention nearby.
3. **Choose or create the folder.** Use the tables in
   [`../rules/directories.md`](../rules/directories.md). If nothing fits, create a
   new folder — lowercase kebab-case, a plain topic noun — and register it in that file's
   tables in the same commit.
4. **Write the file.** Frontmatter is **`name` and `description` only** — see below.
   **One topic**, one `#` H1, and only what belongs to that topic. Rules in the imperative
   and testable: a reader must be able to tell whether they complied. Replace "should
   generally" with the actual condition.
5. **Register it** in the index that owns that scope, in the same commit.
6. **If it introduces a new automatic behavior**, add its trigger row to the
   Instruction tools block in the root [`AGENTS.md`](../../AGENTS.md).
7. **Commit.**

## Frontmatter is `name` and `description`. Nothing else.

```yaml
---
name: one-kebab-case-name
description: What it covers, and when it applies — one or two lines.
---
```

**No `version`. No `author`.** Those keys were carried from the served-set model, where a
file's version told a consumer which release it had adopted. That model is gone, so they
were 30 identical `1.0.0` stamps that had never once been bumped — **a version that never
changes records nothing but the day it was written.** Removed from every file in
`.agents/` on 2026-10-04.

Three reasons they are worse than useless here:

**They cannot be maintained honestly.** Every one was `1.0.0` while the files changed
substantially beneath them, which is the exact failure a version number exists to prevent —
a `1.0.0` that means nothing is worse than no number, because something reading it trusts
it. And `versioning.md` requires approval for every bump, so keeping them would mean either
gating every substantive edit or leaving them permanently stale.

**`author` is noise for a single-author workspace.** `LXAgents` on 29 files and `RBZagan`
on one recorded who typed the first version of a file, which stops being true the moment the
file is edited — and **every one of them has been edited since.** There is no version
control at the root to recover the authorship.

**There is no consumer to serve.** A version is a claim made to someone downstream. There
is no downstream.

**What still matters is provenance, and it is recorded elsewhere** — in
[`../rules/memory-policy.md`](../rules/memory-policy.md) for what a *project* may remember,
and in
[`../wiki/context/instruction-set-history.md`](../wiki/context/instruction-set-history.md)
for how this tree reached its current shape. A file's history is a memory concern, not a
frontmatter key.

**Do not reintroduce either key** to record that a file changed. If a change is worth
announcing, that is a memory record or the tree's history, not a number in a header.

## One file holds one subject

This is the rule the rest of this creator exists to enforce, and it is worth being exact
about, because two defensible-sounding instincts pull against it.

**A file holds the information that belongs to its own subject, and nothing else.** Not a
related section, not a shared preamble, not a copy of another rule for convenience. If the
content belongs to a different `name`, it belongs in a different file.

**New scope means a new file.** If a rule you are about to add does not share the file's
`name`, it is a new file — regardless of how close the subject feels. The test is the
heading, not the topic area.

The two instincts that pull against it:

**"This would duplicate what's already there."** Sometimes. A rule that reads as a
near-duplicate but has a different subject is not one. **Duplication is the lesser problem
here**, and this workspace has the receipts: a block copied into six creator files on
purpose, registered as an allowed exception, and then drifted into a claim about a server
that no longer existed — six identical copies, all wrong in the same direction, because
nobody edits six places when one rule changes. **Facts live once, and every other file links
to them.**

**"It makes this file unusable on its own."** It does, and that is correct. A creator that
also carried the commit format, the session-link rule, the placement mandate, and the
discovery gate was 85 lines of somebody else's rules wrapped around 45 lines of its own —
and the part an agent actually needed was the smaller share. **Link, do not inline.** The
files it points at are one hop away and are the ones that get updated.

## What this creator refuses

* Writing documentation into an instruction folder — that is
  [`information-creator.md`](../creators/information-creator.md).
* Writing state — that is
  [`memory-creator.md`](../creators/memory-creator.md).
* Writing a plan — that is [`plan-creator.md`](../creators/plan-creator.md), and it
  happens before this creator runs.
* Putting rules in `AGENTS.md` or in any index. Those are entry points and routers.
* Appending a rule to a file whose `name` it does not share. **That is a new file.**
* Adding a `version` or an `author` to frontmatter. **`name` and `description` only.**
* **Inlining another file's content** so this one reads on its own.
* **Writing anything that assumes an MCP server, a plugin, or a second instruction set.**
  This workspace is plain `.md`. If content is served from somewhere else, that is a
  finding under [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md), not a
  new rule.
## Related

Everything this creator follows, each in the file that owns it — **not restated here**:

| Concern | Owner |
|---|---|
| Branch naming, one branch per task | [`../git/branching-strategy.md`](../git/branching-strategy.md) |
| Commit message format | [`../git/commit-conventions.md`](../git/commit-conventions.md) |
| Pull request body | [`../git/pull-request-template.md`](../git/pull-request-template.md) |
| Placement — the authority, wins over this file | [`../rules/directories.md`](../rules/directories.md) |
| A rule you think should exist | [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md) |
| What this workspace may never install | [`../rules/repository.md`](../rules/repository.md) |
| Version bumps — never automatic | [`../rules/versioning.md`](../rules/versioning.md) |
| Registering the file in an index | [`index-creator.md`](../creators/index-creator.md) |
| The plan that runs before this | [`plan-creator.md`](../creators/plan-creator.md) |
| A rule you notice mid-task | [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md) |

`branching-strategy.md`, `commit-conventions.md`, and `pull-request-template.md` are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — the root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
