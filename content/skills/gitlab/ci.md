---
name: gitlab-ci
description: GitLab CI/CD — pipelines, jobs, the .gitlab-ci.yml file, pipeline sources, and why a pipeline can be structurally unable to run.
---

# GitLab CI/CD

GitLab's pipeline is roughly GitHub's workflow run, and the same cautions apply:
never cancel, re-run, or edit a CI
definition without being asked. This page covers what differs.

## The structure

```
pipeline  ──>  job  ──>  (script, artifacts)
              stage  ──>  pipeline-level ordering
```

A **job** is the unit that runs a script. **Stages** order jobs against each other
(`build` before `test` before `deploy`); jobs within a stage run in parallel. **No `needs:`
means "wait for the previous stage"** — an implicit dependency that makes a pipeline
sequential whether or not you meant it to be.

There is no third level. GitHub's run → job → step becomes pipeline → job, and a job's
`script` is the step.

## `.gitlab-ci.yml`

```yaml
stages: [build, test]

build:
  stage: build
  script:
    - make build
  artifacts:
    paths: [dist/]

test:
  stage: test
  script:
    - make test
  needs: ["build"]
```

**`script` is a list of shell commands run in sequence**, and a job fails on the first
non-zero exit. A list of `&&`-joined commands has subtly different failure behaviour and
produces worse logs.

**Jobs without a `stage` land in a default stage** (`test`), which silently changes
execution order. Say which stage.

**`rules` replaced `only`/`except`.** The old keywords still work but are deprecated.
`rules` can both decide *whether a job exists* and *what variables it gets*, in one place,
and it is evaluated top to bottom with the first match winning:

```yaml
rules:
  - if: $CI_COMMIT_BRANCH == "main"
    when: on_success
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  - when: never
```

**The trailing `when: never` is what makes it correct.** Without it the last rule matches
everything, including schedules and webhooks that should not run.

## What creates a pipeline

`pipeline source`, on `CI_PIPELINE_SOURCE`:

| Source | Triggered by |
|---|---|
| `push` | A git push |
| `merge_request_event` | An MR opened or updated |
| `web` | The **Run pipeline** button, or the API — source is `web`, and it runs on the **default branch**, not on the branch in your checkout |
| `schedule` | A pipeline schedule (cron) |
| `api` | `POST /projects/{id}/pipeline` |
| `trigger` | A downstream pipeline from a multi-project or child pipeline |

**This is the trap behind "I ran the pipeline and it tested the wrong code."** Triggering
manually runs on the default branch. To test a branch you push it and open an MR, or you
pass a ref explicitly — and passing a ref while the source is `web` is inconsistent enough
that the reliable route is the MR.

**A push and an MR on the same branch create two pipelines.** This is GitLab's equivalent of
the GitHub `push` + `pull_request` double-run, and the fix is the same — scope `rules` by
`CI_PIPELINE_SOURCE` or by branch.

## Statuses

`created`, `waiting_for_resource`, `preparing`, `pending`, `running`, `success`, `failed`,
`canceled`, `skipped`, `manual`, `scheduled`.

**`manual` is not a failure and not a pass** — it is a job waiting for a person. If a merge
rule requires that job, the MR waits indefinitely and nothing fails.

**`canceled` did not fail.** Reading it as a failure sends you hunting a bug in code that
never ran. Same trap as GitHub's `cancelled`.

## Reading pipelines

    glab ci status
    glab ci view
    glab ci trace {job-id}
    glab api "projects/{id}/pipelines?ref=main" --jq '.[].status'

`glab ci status` reads the pipeline for the **current branch** by default — which is the
right default and the reason people get confused when they run it somewhere else.

`glab ci trace` gives a job's log. `glab ci view --pipeline {id}` lists the jobs. **`--paginate`
on the pipelines endpoint** — the default page is small enough that a busy project silently
loses runs.

## Protected environments

Deployments can be gated on an environment with rules: who may deploy, which branches may
deploy, and **manual approval**. An environment with a manual action on it makes a deployment
wait for a person — permanently, if nobody is watching.

This is a real access control, not a notification. It also means **a merge can succeed and
the deploy still not happen**, which reads as a bug and is the environment working.

## Retry and cancel

    glab api -X POST "projects/{id}/jobs/{job_id}/retry"
    glab api -X POST "projects/{id}/jobs/{job_id}/cancel"
    glab api -X POST "projects/{id}/pipelines/{id}/retry"

A retry creates a **new job** against the same commit. It does not pick up new pushes.

`cancel` on a job with side effects leaves those side effects in place — cancelling is not a
rollback, exactly as on GitHub.

## Agents

**Never cancel, retry, or trigger a pipeline without being asked.** Cancelling can leave a
deployment half-applied and triggering a `web` pipeline runs on the wrong branch.

**Read `glab ci trace` before theorising.** Most failures name the cause.

**Check the pipeline on the MR's head commit**, not on the branch's latest.

**`manual` and `canceled` are not failures.** Reporting either as a failure is wrong and
sends the user looking for a nonexistent problem.

**A pipeline can be structurally unable to run** — rules excluding the source, a job in an
unreached stage, a missing runner for its tags. "No pipeline exists" is a different problem
from "the pipeline failed", and they need different responses.

**Editing `.gitlab-ci.yml` runs code on every push.** Say what it changes. It cannot be
diffed against history at the root, and a wrong edit runs for everyone.

**Sandbox:** needs the network; 403 in-session.
