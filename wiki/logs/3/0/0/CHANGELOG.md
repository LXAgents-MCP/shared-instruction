# 3.0.0

**Released:** 2026-09-29

The task workflow and the plan creator are one file. `planning/task-workflow.md` is gone
and its procedure lives in `creators/plan-creator.md`, which takes its place among the
four tools every repository declares.

Major, because **`task_workflow` no longer exists**. It was one of the four mandatory
tools, so a repository that ignores this is calling a tool the server does not publish,
and its `AGENTS.md` declares a name that resolves to nothing. A consuming repository
that carried an override for the `task-workflow` name does not get an error — its local
copy silently becomes the only copy of the rule there is.

**Consumers must:** rename `task_workflow` to `plan_creator` in your Shared instruction
tools block, and **drop any override registered against the `task-workflow` name**. The
trigger on that row widens, so re-read the file rather than assuming the swap is a
rename. `agents_update` does both.

## Changed

- **`creators/plan-creator.md` now carries the whole workflow.** It has two parts: *The
  workflow* (§A–§F, unchanged in substance and unchanged in lettering) and *The working
  plan* (what the creator writes). Sections kept their letters, so every `§A` / `§B` /
  `§E` / `§F` cross-reference elsewhere in the set still resolves to the same place.
- **The two files overlapped and neither said so.** `task-workflow.md` owned the plan
  gate; `plan-creator.md` had its own "the gate comes before the plan" section covering
  the same gate at plan granularity. A session taking in a multi-step request had to
  guess which to read. There is now one gate, stated once, with the plan files named as
  the first thing it authorises.
- **`plan_creator`'s trigger widened.** It was "plan a task of more than one step, before
  any file is written", which is narrower than the work it does. It is now "take in any
  request of more than one step", the trigger `task_workflow` carried.
- **Six creators point at the new home for the merge gate.** `changelog`, `index`,
  `information`, `instruction`, `memory` and `security` each said "merging requires user
  approval per `../planning/task-workflow.md`"; all six now say `plan-creator.md` §F.
- **`rules/auto-activation.md` has one row per tool.** It carried a `task_workflow` row
  and a narrower `plan_creator` row for the same job. The `plan_creator` row absorbed
  the other.

## Removed

- **`planning/task-workflow.md`.** The tool `task_workflow` goes with it, and the surface
  is 31 tools — 30 generated plus `mcp_list` — where it was 32.
- **The `planning/` folder.** It held that one file, and git does not track an empty
  directory, so the folder leaves the tree. `index/instructions-index.md` keeps the
  section, worded the way `security/` already is: empty, served, and the place a file
  added there would be published from on the next boot.

## What did not change

- The three permission gates, and that they live **inline** in your `AGENTS.md` rather
  than behind a trigger. Plan approval, pull request, and merge are stated exactly as
  they were.
- Every gate's terms. What counts as approval, what does not, what is not gated, and the
  rule that the gate re-arms when the plan changes are all as they were — they moved
  files, not wording.
- `branching_strategy`, `commit_conventions` and `discovery_protocol` keep their names,
  their triggers, and their content.
- No instruction `name` outside `task-workflow` was renamed, and no rule was removed.
  The procedure that `task-workflow` carried is intact in `plan-creator.md`.

## One cost, named

`creators/plan-creator.md` is now **21,321 bytes**, against 11,573 for `task-workflow.md`
and 8,419 for `plan-creator.md` alone — the largest file in the set, served by the tool
every repository must declare. The four mandatory tools together go from 20,697 bytes to
30,447.

The number that matters is smaller than that. What a session reads at intake at `1.0.0` was
two calls totalling 19,992 bytes, which it had to reconcile into one plan. It is now one
call of 21,321 bytes. The merge costs 1,329 bytes on that call and removes the
reconciliation, which is the entire reason it is one file rather than two.

All of these are byte counts of the published files, measured on the committed blobs at
this release and at `1.0.0`.

## Not fixed here

Two things were noticed while doing this and are recorded as findings, not applied:
`plan-creator.md` claims in its body to "carry this set's version" while its frontmatter
sits at `1.0.0` and so do all 31 files, and six creators still restate the merge gate
that `plan-creator.md` now owns. Neither is a defect this release introduced.
