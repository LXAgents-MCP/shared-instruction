# 3.0.1

**Released:** 2026-09-29

The published container now starts the HTTP transport when the documented command asks for
it. A patch: no instruction changed, no tool added or removed, and the surface is still
**31 tools**.

**Consumers must:** nothing in your `AGENTS.md`. Every file in `content/` is byte-identical
to `3.0.0`, so there is nothing to re-read and no override to drop. If you run the
published image, pull `lxagents-shared-instruction:3.0.1` — the tag moved, and `3.0.0`
keeps the defect below.

## Fixed

- **The documented HTTP command started the stdio server, not the HTTP one.** The image set
  `ENTRYPOINT ["node", "src/index.js"]` with no `CMD`. Docker *appends* the arguments that
  follow the image name to an `ENTRYPOINT` rather than replacing it, so

      docker run --rm -p 3000:3000 lxagents-shared-instruction:3.0.0 node src/http.js

  ran `node src/index.js node src/http.js` — the **stdio** server with a stray argv entry.
  The published port never opened, the process read no stdin, and it exited `0` with no
  output at all: a container that looks healthy and serves nothing. Five copies documented
  the broken form, in `README.md`, `wiki/environments/docker.md`,
  `wiki/security/security-model.md` and `.agents/rules/repository.md`.

  The default is now `CMD ["node", "src/index.js"]`, and the Dockerfile sets no
  `ENTRYPOINT` of its own. Only `CMD` is replaced by a command that follows the image
  name, so the whole default has to live there. What the image inherits from
  `node:22-alpine` is `ENTRYPOINT ["docker-entrypoint.sh"]`, which ends in `exec "$@"` —
  the documented command replaces `CMD`, the inherited script execs it, and
  `node src/http.js` runs as written. **No documentation was changed to accommodate this**
  — the docs were already right and the image was wrong.

  It was worse than a typo. `.agents/rules/repository.md` already warns that `docker run`
  needs `-i` or "it exits immediately. It looks like a broken image and is not." Adding
  `-i` to the HTTP command makes it exit immediately too, for a different reason, with the
  same symptom — so the page had taught a plausible wrong fix for its own bug.

  All three candidate fixes were built and run rather than reasoned about:

  | Image default | `docker run … <img> node src/http.js` |
  |---|---|
  | `ENTRYPOINT ["node", "src/index.js"]` (before) | exits `0`, no listener — silent failure |
  | `ENTRYPOINT ["node"]` + `CMD ["src/index.js"]` | exits `1`, `Cannot find module '/srv/node'` |
  | `CMD ["node", "src/index.js"]` (shipped) | serves HTTP `200` on `/sse` |

  The middle row is the fix that looks right and is not: `node` as the entrypoint plus the
  documented `node src/http.js` as arguments is `node node src/http.js`. The proposed fix
  was tested and rejected on the evidence.

  Verified on the built `3.0.1` image: the documented HTTP form serves `/sse` with `200`
  and no `X-Powered-By` header, and `docker run --rm -i` still answers `initialize` on
  stdio, reporting version `3.0.1`.

## Added

- **A reading aid in the `3/0/0` log.** Rows dated before `3.0.0` still cite
  `planning/task-workflow.md`, a path that no longer exists, and each maps onto the
  `creators/plan-creator.md` section of the same letter. Release history is not rewritten,
  so those rows stay as they were written; the new section tells a reader how to follow
  them. **The `3/0/0` log was edited to carry it**, against
  `changelog-creator.md` §"Never rewrite a release" — the owner's call, and the reason it
  is also stated here is that this is the log where such a correction belongs. If the
  `3/0/0` edit is ever reverted, the guidance survives on this page.
- **`.agents/memory/findings/workflow-merge-findings.md`** — local, unpublished. The three
  instruction findings raised by the `3.0.0` merge and never applied, lifted out of the
  scratch working plan before it was deleted. `F1`, the stale per-file `version` field; `F2`,
  the merge-gate sentence restated in seven creators; `F3`, the set never stating its gates
  as a list. None is written; the discovery gate is unchanged.

## Changed

- The image tag is `3.0.1` in `README.md`, `wiki/environments/docker.md`,
  `wiki/security/security-model.md` and `.agents/rules/repository.md`.
- `package.json` and `package-lock.json` to `3.0.1`, the lock resynced rather than
  hand-edited.

## What did not change

- **No instruction file in `content/`.** The only file the set gained is this release's own
  row in `content/index/logs-index.md` — a release record, not a convention. Every served
  instruction is byte-identical to `3.0.0`, so every tool keeps its name, its description
  and its trigger, and the surface is 31 tools.
- `plan_creator`, `branching_strategy`, `commit_conventions` and `discovery_protocol` are
  untouched, so a consumer that has already migrated off `task_workflow` has nothing to do.
- The three permission gates, and the `3.0.0` release itself.

## Not done

Three instruction findings stay open, in
`.agents/memory/findings/workflow-merge-findings.md`. `F3` is the one worth attention: the
set never states its own gates as a list, so every repository rediscovers them, and the
`3.0.0` session was asked for the plan gate four separate times.
