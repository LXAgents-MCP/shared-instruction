---
name: github-actions
description: Reading and triggering GitHub Actions — run status, workflow files, re-running, and why "all checks passed" is not the same as mergeable.
---

# GitHub Actions

## Reading runs

    gh run list --limit 20
    gh run list --workflow ci.yml --branch main --json databaseId,conclusion,status
    gh run view {id}
    gh run view {id} --log-failed

`--log-failed` is the one that matters when something breaks: it prints only the failed
steps' logs, instead of thousands of lines. `--log` for a run with many jobs is large
enough to be unhelpful.

**`conclusion` values:** `success`, `failure`, `cancelled`, `skipped`, `timed_out`,
`action_required`, `neutral`, `stale`. A run that is `cancelled` did not pass because it
failed to run — treating `cancelled` as `failure` sends you looking for a bug in code that
never ran. `skipped` and `neutral` are not passes either, though branch protection may treat
them as acceptable.

**`status`** is the phase (`queued`, `in_progress`, `completed`); **`conclusion`** is the
result and is null until status is `completed`. Reading a null conclusion as success is a
classic mistake — it means "still running".

### The three-level structure

```
workflow run  ──>  job  ──>  step
```

`gh run view --json jobs` gives jobs; each has `steps`. CI status on a PR is per-job, and a
required check is a **job name**, not a workflow name. Renaming a job breaks every branch
protection rule requiring it.

## Re-running

    gh run rerun {id}                       # failed jobs only
    gh run rerun {id} --failed
    gh run rerun {id} --failed --debug      # with runner debug logging

Re-running reuses the original commit — it does not pick up new pushes. Pushing a fix
creates a **new** run; rerunning re-tests the old code.

`--debug` enables step-by-step debug logging and is slow and verbose. Use it when a step
fails silently or its output is unhelpful, not as a default.

**Cancelling** is `gh run cancel {id}`. On a workflow with deployment side effects, a
half-cancelled run may have already done the deploying — cancelling is not a rollback.

## Workflow files

`.github/workflows/{name}.yml`. Structure:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make test
```

**`on:` is the trigger block, and YAML parses bare `on` as the boolean `true`.** A parser
that does not special-case it looks for a key called `True` and finds none — a real and
confusing failure in tooling that reads workflow files generically.

**`pull_request` and `push` both fire on a branch push**, so a workflow on both runs twice
for a branch with a PR. The usual fix is to scope `push` to `branches: [main]`.

**Actions are pinned by tag (`@v4`) or SHA.** A tag is mutable — it can be repointed at new
content, which is a supply-chain risk rather than a theoretical one. SHA pinning is
`uses: actions/checkout@<40-char-sha> # v4.2.2`. This is the single most common security
review finding on a workflow file.

**`GITHUB_TOKEN` inside a workflow is not a user's token.** It is scoped to the repository
and its permissions default to read-only or whatever the workflow declares under `permissions:`.
A workflow that pushes to another repository needs an explicit secret — this is the same
shadowing trap as a read-only token taking precedence over your login, in a different place.

**Secrets are not available to workflows triggered by `pull_request` from a fork.** That is
the point of the restriction, not a bug.

## Agents

**Never cancel or re-run a workflow without being asked.** Both touch shared CI, and a
cancel can leave a deployment half-applied.

**Check the run on the PR's head commit, not on the branch's latest state.** A green run on
an older commit is not evidence about the current code.

**"Checks green" ≠ "mergeable".** Required reviews are separate from required checks.

**Read `--log-failed` before theorising.** Most CI failures name the cause in the output.

**Never edit a workflow file without saying what it changes.** The Proxy Rule applies: a
workflow is code with side effects, it cannot be diffed against history at the root, and a
wrong edit runs on every subsequent push for everyone.

**Sandbox:** needs the network; 403 in-session.
