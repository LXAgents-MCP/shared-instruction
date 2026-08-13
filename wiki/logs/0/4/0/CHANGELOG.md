# 0.4.0

**Released:** 2026-08-13

Adds a rule that finished work is reported back to the user, and closes two gaps found
by running the duplicate audit against two real consuming repositories.

**Consumers must:** re-read `rules/auto-activation.md` and add the new trigger row to
your `AGENTS.md` — `Report finished work back to the user` →
`{shared}/rules/work-summary.md`. While you are there, check that your trigger table
also carries a row for each of your own local instruction files; that was always
intended and is now stated.

## Added

- `rules/work-summary.md` — a task is finished when the user knows what happened
  without going to look. Fixes the five things a summary must carry: what changed and
  where, what was verified and how, what was **not** done, what still needs a decision,
  and any findings. Says plainly that an unreported omission takes a scoping decision
  away from the user, and that silence reads as success. Also fixes what a summary is
  not — a transcript, the request restated, or a place for a session link.
- `rules/auto-activation.md` — the matching trigger row, so the summary is owed before
  the work starts rather than remembered afterwards.

## Changed

- `rules/auto-activation.md` — "mirrors it row-for-row" is now stated as a floor rather
  than a closed set. A consuming repository reproduces every shared row unchanged and
  **appends** rows for its own local instructions. Removing, reordering, or repointing a
  mirrored row is still forbidden, and repointing is named as what it actually is: an
  override, which belongs in the override table rather than in a quietly edited trigger.
- `rules/duplicate-instruction-audit.md` — the "never a candidate" table now excludes
  any `INDEX.md` at any depth, not only `.agents/index/**`.

## Fixed

- The audit's exclusion list assumed every repository keeps its indexes under
  `.agents/index/`. A repository scaffolded before that move keeps them at
  `.agents/INDEX.md`, `wiki/INDEX.md`, and the repository root, where the exclusion did
  not reach — so the audit classified a repository's own routing tables by path and
  proposed deleting the map. Both `JetsadaWijit/jwz` and `JetsadaWijit/jwz-website` hit
  this.
- Read literally, "mirrors it row-for-row" described a closed table, which left a
  consuming repository's own instruction files with no trigger and therefore no way to
  auto-activate. Both repositories above have local instruction folders that this would
  have silently stranded.
- Nothing in the set said work had to be reported back. Every obligation it carried
  produced an artifact — a commit, an index row, a memory entry, a changelog — and none
  of them reach the person who asked for the work.
