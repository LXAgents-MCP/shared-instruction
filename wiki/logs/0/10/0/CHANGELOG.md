# 0.10.0

**Released:** 2026-08-23

Adds two steps to the merge procedure: re-target a stacked pull request **before** merging
it, and verify the default branch once the last merge lands.

**Consumers must:** re-read `planning/task-workflow.md` §F. When merging a stacked chain,
re-target pull request `k` to the default branch before merging it rather than after, and
finish by diffing the default branch against the last branch in the chain. Report that
check. No file was renamed, no `name` changed, no rule was removed, and no trigger row
changes, so no override needs dropping.

## Changed

- `planning/task-workflow.md` §F — two new bullets and an amended closing bullet.

  **Re-target before merging.** A forge only re-targets a stacked pull request when its
  base branch is deleted on merge. Where that setting is off, pull request `k` merges into
  branch `k-1` and the default branch silently stays behind — while the merge API returns
  success and the pull request page says merged. Nothing signals the gap.

  **Verify after the last merge.** Diff the default branch against the final branch in the
  chain and confirm the trees are identical. The closing bullet now names that result as
  part of the final state, so "merged" stops standing in for "landed": one is a claim
  about a pull request, the other about the default branch.

## Notes for this repository

- Not a theoretical rule. It cost a mis-merge in the `0.8.0` chain, where pull request 2
  merged into branch 1 instead of `master` and both the API and the pull request page
  reported success. Only a tree diff caught it. Applying the same steps by hand in the
  `0.9.0` chain landed all four cleanly, which is the argument for writing them down.
- `wiki/guides/install-as-local-mcp.md` ships in the same release but is human
  documentation, not part of the served set: how to run this repository as a local MCP
  server from a clone under `./mcps/{owner}/{repo}/`, with a block to paste into a
  consuming repository's `AGENTS.md`. Nothing in `content/` changed for it, so there is
  nothing for a consumer to re-read.
- The guide leads with why a clone under `./mcps/` is not vendoring: it runs the server,
  the set is still read as `agents://` resources rather than by file path, and `mcps/` is
  gitignored so it never enters the consuming repository's history. A committed `./mcps/`
  is a vendored copy and `duplicate-instruction-audit.md` should treat it as one.
- `rules/mcp-connector.md` is the natural place to name a third connection mode and was
  deliberately left alone. It is a published instruction, and `change-propagation.md`
  routes a stale instruction through `discovery-protocol.md` rather than allowing it to be
  rewritten in passing. Raised as a finding.
- 66 tests, unchanged and passing.
