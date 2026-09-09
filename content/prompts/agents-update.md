---
name: agents-update-prompt
description: Move a repository from the shared-set version it adopted to the current one — read the stamp, apply each Consumers must line, re-sync.
---

# AGENTS-UPDATE

You are updating this repository's adoption of the shared agent instruction set.

Consumers read the set **live**, so a shared change reaches them on their next read with no
install step. What does *not* update itself is everything the repository wrote down at setup:
its tool declaration table, its trigger rows, its override table, and the version stamp
recording what it adopted. This procedure closes that gap.

It is **on request only**. It edits `AGENTS.md`, so it never runs as part of session start
and never fires because you noticed a version difference.

---

## 0. Ground rules

* **Work on a new branch**, `docs/agents-update`, created from the default branch before
  touching a file. [`git/branching-strategy.md`](agents://git/branching-strategy.md).
* **The plan gate applies.** This procedure changes `AGENTS.md`. Present what you intend to
  change and wait for approval before writing —
  [`planning/task-workflow.md`](agents://planning/task-workflow.md) §B.
* **Apply, do not improvise.** Every edit here traces to a **Consumers must** line or to the
  current tool list. A convention you think should also change is a finding for
  [`rules/discovery-protocol.md`](agents://rules/discovery-protocol.md), not an edit.
* **Never bump this repository's own version** because the shared set moved. They are
  unrelated numbers — [`rules/versioning.md`](agents://rules/versioning.md).
* **No session links** in anything you write or post —
  [`rules/no-session-links.md`](agents://rules/no-session-links.md).

---

## 1. Find the adopted version

Read the `Adopted shared-set version:` line in this repository's root `AGENTS.md`, inside
the **Shared instruction tools** block.

**If there is no stamp**, this repository was adopted before stamping existed. Do not guess a
version. Say so, and treat the whole of §3 as a full re-sync: compare the declaration table
against the current tool list directly rather than against a delta.

---

## 2. Get the delta

Call `update_shared_agents_instruction` with `from_version` set to the stamp. It returns the
**Consumers must** line for every version released since, newest first, and this procedure.

Called with no `from_version`, it returns the re-sync path instead of a delta. That is the
correct call when there is no stamp; it is the wrong call when there is one, because a
re-sync sees the current state and not the reasons it changed.

**Read the lines oldest first**, whatever order they arrive in. They compose: `0.9.0` may
introduce a file that `0.13.0` then changes, and applying the newer one first leaves the
older edit unmade with nothing to signal it.

---

## 3. Apply, in this order

**a) Each Consumers must line, oldest to newest.** Each names exactly what to do: nothing,
re-read a named file, add or delete a trigger row, or drop an override. Do them literally. A
line that says "nothing" is done when you have read it.

**b) The tool declaration table.** Call `list_shared_agents_instruction` and reconcile:

| Situation | What to do |
|---|---|
| A tool this repository declares no longer exists | Remove the row. Check first whether a **Consumers must** line renamed it — if so, the row is renamed, not deleted. |
| A tool exists that this repository needs and does not declare | Add the row, with the trigger the shared table gives it. |
| A tool exists that this repository does not need | Leave it out. A narrower table is the point of declaring one — it is not drift. |
| The four mandatory tools are not all present | Add the missing ones. `task_workflow`, `branch_strategy`, `commit_strategy` and `discovery_protocol` are not optional in any repository. |

**c) The override table** in `.agents/index/root-index.md`. An override matches a shared
file by `name`. A rename or removal upstream leaves it matching nothing, at which point the
local copy silently becomes the only rule the repository has — the exact failure overriding
is supposed to be a deliberate, visible cost. For each row: confirm the shared `name` still
exists, and confirm the incompatibility that justified the override still holds. Drop the
ones that fail either test, and say which and why.

**d) The version stamp.** Rewrite it to the version the tool reported as current. **Do this
last.** A stamp moved before the edits land claims work that has not happened, and the next
update computes its delta from that claim.

---

## 4. Verify

* The stamp names the current shared-set version, and every **Consumers must** line up to it
  has been applied.
* Every tool named in the declaration table exists in `list_shared_agents_instruction`, and
  the four mandatory tools are among them.
* Every override row names a shared `name` that still exists, with a reason that still holds.
* No shared file has been copied into this repository —
  [`rules/duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md)
  finds those, on request.
* `AGENTS.md` still carries no rule bodies: the gates and the tables, nothing more.

---

## 5. Finish

1. Commit per [`git/commit-conventions.md`](agents://git/commit-conventions.md), e.g.
   `docs(agents): adopt shared instruction set {version}`. Strip any session trailer your
   tooling appends.
2. Push. **Ask before opening a pull request, and ask again before merging.**
3. Report: the version moved from and to, each **Consumers must** line and what you did
   about it, every declaration row added or removed, every override dropped, and anything a
   line asked for that you could not do — with the reason.

A version you moved past without applying its line is worse than not updating: the stamp
now says the work is done.
