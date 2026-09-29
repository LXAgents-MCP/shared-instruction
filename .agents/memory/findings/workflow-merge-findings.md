---
name: memory-findings-workflow-merge
description: Three instruction findings raised during the plan-creator merge and never applied — the stale version field, the merge gate restated seven times, and the gates that are never stated as a list.
---

# Open findings from the `plan-creator` merge

Notices raised while merging `planning/task-workflow.md` into `creators/plan-creator.md`
(`3.0.0`). **None are written.** Each is proposed to the owner with a target set, a path,
a `name`, a `description` and a full body, and only what the owner selects gets created —
the gate at `content/rules/discovery-protocol.md`.

Lifted out of the scratch working plan, which was deleted once the work merged. `F4` and
`F5` were applied in `3.0.1` and are recorded in
[`../tasks/merge-workflow.md`](../tasks/merge-workflow.md) and the `3/0/1` changelog. These
three were not, and this file is the only copy.

---

## F1 — `plan-creator.md` claims to carry the set's version, and does not

**Set:** shared · **Path:** `content/creators/plan-creator.md` · **No change made.**

Its opening says it "is served by `lxagents-shared-instruction` and carries this set's
version". Its frontmatter says `version: 1.0.0`. The set is at `3.0.1`, and all 30 files
in `content/` say `1.0.0` — so the field is per-file and stale everywhere, and this one
file is the only place that claims otherwise.

Two ways out, and they are not the same change: either drop the sentence and let the field
mean what it actually means, or start tracking the set version in the field, which is a
release-process change touching all 30 files. Proposed separately if the owner wants
either. Not in scope for a merge.

## F2 — Seven creators repeat the same merging-gate sentence

**Set:** shared · **No change made.**

`changelog-creator.md`, `index-creator.md`, `information-creator.md`,
`instruction-creator.md`, `memory-creator.md`, `plan-creator.md` and
`security-creator.md` each end with a "Pull Requests and Versions" section saying roughly:
a pull request follows `pull-request-template.md`, merging needs user approval per the
workflow, and a version change needs user approval per `versioning.md`.

That is the same rule seven times. The iron rule is one subject per file with the
cross-cutting rule **linked, not pasted** — and the merge gate is cross-cutting. It belongs
in one place with the other six pointing at it, the way
`content/rules/no-session-links.md` is cited rather than restated.

The refactor that would do it is unrelated to merging two files, and it would touch seven
of the files the `3.0.0` change already touched, so doing both at once would make either
unreviewable. Still recorded, not proposed.

## F3 — The set never states the gates as a list

**Set:** shared · **Path:** `content/rules/auto-activation.md` · **No change made.**

`auto-activation.md` §"The four that are not optional" says the gates are written inline
in `AGENTS.md` and then lists them in one prose sentence: approve the plan, ask before
opening a pull request, ask before merging, and the discovery-protocol block. But the gates
are the most consequential thing in the set, they are enforced from the first message, and
they live in a sentence rather than in a table a repository can copy.

A consuming repository copies its declaration block from `agents-setup.md` and its gates
from the same prompt, so nothing in the set names the gates as a list with a canonical
wording. Worth a table, in `auto-activation.md` or `shared-instructions.md` §H. The
`3.0.0` session asked for exactly that gate a fourth time in a row, so the absence costs
something real.

## Applied since

- **F4** — the documented Docker HTTP command started the stdio server. Fixed in `3.0.1`
  by moving the default out of `ENTRYPOINT` and into `CMD ["node", "src/index.js"]`. The
  proposed fix at the time, `ENTRYPOINT ["node"]` with `CMD ["src/index.js"]`, was tested
  and does **not** work: Docker appends the documented arguments to an `ENTRYPOINT`, so it
  ran `node node src/http.js` and exited 1. Only `CMD` is replaced by a command, so the
  whole default has to live there.
- **F5** — rows before `3.0.0` in `content/index/logs-index.md` still cite the deleted
  `planning/task-workflow.md`. The `3/0/0` changelog now carries a section mapping those
  section letters onto `creators/plan-creator.md`.
