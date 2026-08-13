---
name: duplicate-instruction-audit
description: On request only — find instructions a repository duplicates from the shared set, and remove them so the connector stays the single source.
---

# Duplicate Instruction Audit

Some repositories were set up before the shared set was served over MCP, or were
scaffolded by copying another repository. They carry local copies of files this
server already provides. Those copies are drift: they are read with local precedence,
they never receive shared fixes, and nothing signals that they have fallen behind.

This audit finds them and removes them.

## When this runs

**On request only. Never automatically, and never as part of session start.**

This is a deliberate exception to
[`auto-activation.md`](agents://rules/auto-activation.md): every other rule in this
set fires without being asked, and this one does the opposite. Comparing a repository
against the full shared set costs a read per file and proposes deletions, so it runs
when the user asks for it and at no other time.

Run it when the user says something like:

* "Check duplicate agents instruction with the mcp server"
* "Check for duplicated agent instructions"
* "Does this repo duplicate the shared set?"
* "Audit `.agents/` against the connector"

Do **not** run it because you noticed a suspicious file while doing something else.
Note the observation, finish the task, and mention it at the end — the user decides
whether to run the audit.

## Procedure

### 1. Resolve and inventory

Read `agents://manifest.json`. It gives you every shared file's `name`, path,
description, and `sha256` of its normalized body. This is one read; do not walk the
shared set file by file.

If the connector is unavailable, **stop**. Report that the audit cannot run without
it. Never guess at what the shared set contains — a deletion driven by a guess is
unrecoverable in a way a missing audit is not.

### 2. Collect local candidates

Walk the consuming repository's `.agents/` tree and collect every `.md` file. Then
remove from the candidate list everything the audit must never touch:

| Never a candidate | Why |
|---|---|
| `.agents/memory/**` | Memory is always local and never shared. |
| `.agents/wiki/**` | Agent knowledge is repository-specific. |
| `.agents/index/**` | Indexes are per-repository routing, never overridden. |
| Any `INDEX.md`, at any depth | A legacy index from a setup that predates `.agents/index/`. Still routing, still never an override. |
| `.agents/rules/repository.md` | This repository's own rules, by definition local. |
| `wiki/**`, `README.md`, `AGENTS.md` | Not part of the shared set. |

The `INDEX.md` row matters more than it looks. A repository scaffolded before indexes
moved to `.agents/index/` keeps them at `.agents/INDEX.md`, `wiki/INDEX.md`, and the
repository root — paths the `.agents/index/**` exclusion does not cover. Those files
are the repository's routing tables, so an audit that treats them as candidates
proposes deleting the map. They are replaced during adoption, by
[`../prompts/agents-setup.md`](agents://prompts/agents-setup.md), and never by this
audit.

What remains is the real candidate set: instruction files under `.agents/` that
plausibly shadow a shared file.

### 3. Classify each candidate

Match in this order, and stop at the first match:

1. **By `name`.** Read the candidate's frontmatter `name`. If it equals a shared
   file's `name`, this file shadows that shared file. This is the authoritative
   match — override is by `name`, so a `name` collision is the thing that actually
   changes behavior.
2. **By content.** Normalize the body (strip frontmatter, collapse trailing
   whitespace, normalize line endings) and hash it. If the hash equals a shared
   file's `sha256`, it is a byte-identical copy that was renamed.
3. **By path.** If the candidate sits at a path that mirrors a shared path
   (`.agents/git/commit-conventions.md` against `agents://git/commit-conventions.md`),
   flag it even when `name` and content differ — it is almost always a stale copy.

Then assign one of four verdicts:

| Verdict | Condition | Action |
|---|---|---|
| **Exact duplicate** | Matches a shared file, and the normalized body hash is identical | Propose deletion. It contributes nothing. |
| **Stale copy** | Matches by `name` or path, body differs, and no override row exists in `.agents/index/root-index.md` | Propose deletion, and show the diff so the user can see what is being given up. |
| **Declared override** | Matches by `name`, **and** has a row in the override table with a stated reason | Keep. Report it, and note whether the reason still holds. |
| **Local-only** | Matches nothing shared | Keep. Not a finding. |

### 4. Report before you delete

Deletion is destructive, so present the findings and wait. One block per file:

```
{verdict}  .agents/{path}
  name:      {frontmatter name}
  shadows:   agents://{shared path}
  identical: yes | no ({n} lines differ)
  override:  none | row present — "{reason}"
  proposal:  delete | keep | promote to declared override
```

Then ask which to apply. Never batch-delete, never delete silently, and never delete
a file whose verdict you could not determine.

### 5. Apply what the user selected

For each approved deletion, in one commit per logical group:

1. Delete the file.
2. Remove its row from the index that owned it — same commit, always.
3. If it had an override row, remove that too.
4. If the repository's `AGENTS.md` trigger table pointed at the local path, re-point
   that row at `{shared}/…`.
5. Record the audit in `.agents/memory/tasks/` — what was found, what was removed,
   what was kept and why.

Commit as `chore(agents): remove instructions duplicated from the shared set`, per
[`../git/commit-conventions.md`](agents://git/commit-conventions.md).

### 6. When a stale copy holds something worth keeping

A stale copy sometimes contains a genuinely better rule that never made it upstream.
Do not delete that silently and do not keep it as an undeclared copy. Either:

* **Promote it** — propose the change against this shared set through
  [`discovery-protocol.md`](agents://rules/discovery-protocol.md), then delete the
  local copy once it lands; or
* **Declare it** — keep the file, and add its row to the override table with the
  reason. An override with a stated reason is a decision; an undeclared copy is an
  accident.

## What this audit never does

* It never deletes memory, wiki pages, indexes, or `repository.md`.
* It never deletes without explicit per-file approval.
* It never runs on its own initiative.
* It never edits the shared set. Findings against the shared set are proposals, not
  writes.
