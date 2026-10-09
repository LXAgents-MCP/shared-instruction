---
name: branch-and-commit-prompt
description: The standing branch-and-commit loop — always active, so the user never has to restate the convention.
---

# Branch and Commit

**This applies to every task in every repository that uses this instruction set. Assume
it is always active; the user does not need to repeat it.**

## The loop

1. Confirm which project folder you are in, and say so before starting. The root is
   not a project — branches, commits and pull requests apply inside a project folder
   only.
2. Confirm **Goal / Objective / Detail** —
   [`../creators/plan-creator.md`](../creators/plan-creator.md) §A.
3. Check `{repo}/.agents/index/memory-index.md` for prior state on this work — in a
   project; a workspace root has no memory.
4. Split the request into ordered tasks and get the list confirmed. **Task 1 is always
   the task record. Task `n` is always the release. The work goes between them.**
5. Create **one branch per task**, stacked in order: task 1 from the default branch, task
   `k` from task `k-1`. Task 1's branch is `chore/{slug}-plan`.
6. **Task 1: write the confirmed list to `{repo}/.agents/memory/tasks/{slug}.md` before any of
   it is built.** Leave its `PR` column empty; step 13 and task `n` fill it.
7. Work tasks `2…n-1` strictly in order.
8. Update the owning index for anything added, moved, or removed.
9. **Append this task's own entry to the task record, in the same commit as its work** —
   one `### Task k — {branch}` heading each, never batched at the end.
10. Commit each logical change as `type(scope): description`.
11. **Strip any session trailer or footer your tooling appended** — before the commit, and
    before the post.
12. Push every branch with `git push -u origin {branch}`.
13. Open one pull request per branch, using the pull request template. Then **edit task
    1's pull request body to carry the whole chain** — it is the record, so its pull
    request is the index of the work. A body edit, never a commit: pushing to branch 1
    here invalidates every branch above it.
14. **Ask the user before merging.** Wait for an explicit yes.
15. Merge in order `1…n`.
16. In the release task, fill the record's `PR` column and mark it done.
17. Present any discovery-protocol findings at the end, each tagged `local`.

## Branch names

`{type}/{primary-noun}`, from: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

**Never commit to the default branch. Never use tool-preset branch prefixes**
(`claude/`, `codex/`, `cursor/`, …), and never add a generated or random suffix. Full
rules: [`../git/branching-strategy.md`](../git/branching-strategy.md).

## Commit messages

`type(optional scope): description` — imperative subject, no trailing period, optional
bullet body explaining what and why. Full rules:
[`../git/commit-conventions.md`](../git/commit-conventions.md).

## Standing constraints

* **No session links** in a commit, trailer, branch, tag, pull request, or comment —
  strip whatever the tool adds by default.
  [`../rules/no-session-links.md`](../rules/no-session-links.md)
* **Pull request titles are human-readable**, never `feat:` / `fix:` / `chore:`.
  [`../git/pull-request-template.md`](../git/pull-request-template.md)
* **Index and memory updates ship in the same commit** as the change they describe.
* **A rule true beyond this workspace gets proposed, not written** — and it is written
  here, not upstream. [`../rules/shared-instructions.md`](../rules/shared-instructions.md) §E
* Anything you noticed but must not self-apply goes through
  [`../rules/discovery-protocol.md`](../rules/discovery-protocol.md).
