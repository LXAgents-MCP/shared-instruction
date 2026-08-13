---
name: shared-instructions-index
description: Index of the shared instruction set — every rule, git convention, planning file, standing prompt, and creator.
---

# Shared Instructions Index

**Scope:** `rules/`, `git/`, `planning/`, `prompts/`, `creators/`
**Parent:** [`root-index.md`](agents://index/root-index.md)

Any file added to or removed from these folders is reflected here in the same commit. This
index lists shared files only; a consuming repository's files are routed from its own
`root-index.md`.

## rules/

| File | Purpose |
|---|---|
| [`directories.md`](agents://rules/directories.md) | Where every file goes — the four trees, the audience test, the placement algorithm. |
| [`shared-instructions.md`](agents://rules/shared-instructions.md) | How shared and local combine — precedence, override, promotion, adoption. |
| [`auto-activation.md`](agents://rules/auto-activation.md) | When each instruction fires without being asked, and what outranks what. |
| [`mcp-connector.md`](agents://rules/mcp-connector.md) | Resolving this set through the connector instead of cloning it. |
| [`no-session-links.md`](agents://rules/no-session-links.md) | Never record an assistant or tool session link. |
| [`change-propagation.md`](agents://rules/change-propagation.md) | A change updates the documentation describing it, in the same commit. |
| [`discovery-protocol.md`](agents://rules/discovery-protocol.md) | Propose new rules; never self-apply them. |
| [`duplicate-instruction-audit.md`](agents://rules/duplicate-instruction-audit.md) | On request only — find and remove instructions a repository duplicates from this set. |
| [`memory-policy.md`](agents://rules/memory-policy.md) | What may be written to memory, and how. |
| [`work-summary.md`](agents://rules/work-summary.md) | Report finished work back — what changed, what was verified, what was not done. |
| [`versioning.md`](agents://rules/versioning.md) | Never bump a version without asking. |

## git/

| File | Purpose |
|---|---|
| [`branching-strategy.md`](agents://git/branching-strategy.md) | Branch naming, one task per branch, stacking order. |
| [`commit-conventions.md`](agents://git/commit-conventions.md) | Conventional Commits for commit messages only. |
| [`pull-request-template.md`](agents://git/pull-request-template.md) | Human-readable titles and the required body sections. |

## planning/

| File | Purpose |
|---|---|
| [`task-workflow.md`](agents://planning/task-workflow.md) | Intake, decomposition, stacked branches, in-order execution, merging. |

## prompts/

| File | Purpose |
|---|---|
| [`agents-setup.md`](agents://prompts/agents-setup.md) | The full setup procedure, also served as the `agents-setup` prompt. |
| [`branch-and-commit.md`](agents://prompts/branch-and-commit.md) | The standing branch-and-commit loop. |

## creators/

| File | Purpose |
|---|---|
| [`instruction-creator.md`](agents://creators/instruction-creator.md) | Writes normative rules, in the correct set. |
| [`information-creator.md`](agents://creators/information-creator.md) | Writes both wiki trees, routed by audience. |
| [`index-creator.md`](agents://creators/index-creator.md) | Owns the shape of every index file. |
| [`memory-creator.md`](agents://creators/memory-creator.md) | Writes `.agents/memory/` — the ungated creator. |
| [`changelog-creator.md`](agents://creators/changelog-creator.md) | Writes `wiki/logs/{Major}/{Minor}/{Patch}/`. |
