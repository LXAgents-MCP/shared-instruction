---
name: branch-and-commit-prompt
description: The standing branch-and-commit loop — always active, so the user never has to restate the convention.
---

# Branch and Commit

**This applies to every task in every repository that uses this instruction set. Assume
it is always active; the user does not need to repeat it.**

## The loop

1. Resolve the shared set — [`../rules/mcp-connector.md`](agents://rules/mcp-connector.md).
2. Confirm **Goal / Objective / Detail** —
   [`../planning/task-workflow.md`](agents://planning/task-workflow.md).
3. Check `.agents/index/memory-index.md` for prior state on this work.
4. Split the request into ordered tasks and get the list confirmed.
5. Create **one branch per task**, stacked in order: task 1 from the default branch, task
   `k` from task `k-1`.
6. Work tasks `1…n` strictly in order.
7. Update the owning index for anything added, moved, or removed.
8. Update `.agents/memory/` with progress.
9. Commit each logical change as `type(scope): description`.
10. **Strip any session trailer or footer your tooling appended** — before the commit, and
    before the post.
11. Push every branch with `git push -u origin {branch}`.
12. Open one pull request per branch, using the pull request template.
13. **Ask the user before merging.** Wait for an explicit yes.
14. Merge in order `1…n`.
15. Present any discovery-protocol findings at the end, each tagged `local` or `shared`.

## Branch names

`{type}/{primary-noun}`, from: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

**Never commit to the default branch. Never use tool-preset branch prefixes**
(`claude/`, `codex/`, `cursor/`, …), and never add a generated or random suffix. Full
rules: [`../git/branching-strategy.md`](agents://git/branching-strategy.md).

## Commit messages

`type(optional scope): description` — imperative subject, no trailing period, optional
bullet body explaining what and why. Full rules:
[`../git/commit-conventions.md`](agents://git/commit-conventions.md).

## Standing constraints

* **No session links** in a commit, trailer, branch, tag, pull request, or comment —
  strip whatever the tool adds by default.
  [`../rules/no-session-links.md`](agents://rules/no-session-links.md)
* **Pull request titles are human-readable**, never `feat:` / `fix:` / `chore:`.
  [`../git/pull-request-template.md`](agents://git/pull-request-template.md)
* **Index and memory updates ship in the same commit** as the change they describe.
* **Universal rules go upstream, never into a consuming repository.**
  [`../rules/shared-instructions.md`](agents://rules/shared-instructions.md)
* Anything you noticed but must not self-apply goes through
  [`../rules/discovery-protocol.md`](agents://rules/discovery-protocol.md).
