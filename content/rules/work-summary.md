---
name: work-summary
description: Finished work is reported back — what changed, what was verified, what was not done, and what still needs a decision.
---

# Work Summary

A task is not finished when the last commit lands. It is finished when the user knows
what happened without having to go and look.

## When this fires

At the end of every task, before going idle or handing back. Once per task — not once
per commit, not once per file.

It fires whether the work succeeded, partly succeeded, or was abandoned. A task that
produced nothing still produces a summary saying so; silence reads as success and is
the one outcome that misleads.

## What a summary must contain

Five things. Drop one only when it genuinely does not apply, never to save space.

1. **What changed, and where.** Real paths, real branch names, real version numbers,
   real pull request numbers. "Updated the config" names nothing; `src/config.js` does.
2. **What was verified, and how.** Name the check that ran and what it said. A test
   suite that passed, a build that succeeded, a page that rendered. If nothing was run,
   say that plainly rather than implying it.
3. **What was not done.** Anything in the original scope that was skipped, blocked,
   deferred, or turned out to be impossible — and why. Narrowing scope is the user's
   decision to make, so an unreported omission takes that decision away from them.
4. **What needs a decision.** Everything a rule gates and you therefore stopped short
   of: a version bump, a deletion, opening or merging a pull request, declaring an
   override. State the options, and make a recommendation.
5. **Findings.** Anything worth adding to either instruction set, in the shape
   [`discovery-protocol.md`](agents://rules/discovery-protocol.md) requires — at the
   end, one block per finding, never applied first.

## Report what happened, not what was hoped

* If a check failed, say it failed and show what it said.
* If a step was skipped, say it was skipped.
* If something is done and verified, say so plainly — hedging verified work is its own
  kind of inaccuracy.
* Never describe a partly finished task as finished. "Done except X" is a complete
  answer; "done" is not.

## Shape

Lead with the outcome, then the detail. The user should be able to stop reading after
the first two lines and still know whether the task succeeded.

Prefer a table when reporting more than about three changed files, a version history,
or a set of checks and their results — a scannable table beats a paragraph the reader
has to parse.

## What a summary is not

* **Not a transcript.** Do not narrate the order you did things in, the approaches you
  tried and discarded, or the files you read on the way. The diff is the record of how;
  the summary is the record of what.
* **Not the request restated.** The user wrote it; they do not need it read back.
* **Not a place for a session link.** Describe the work; never point at the
  conversation — [`no-session-links.md`](agents://rules/no-session-links.md).
* **Not a substitute for the artifacts.** Memory, indexes, and changelogs are still
  written. A summary is delivered to a person and then scrolls away; the repository is
  what remains.

## Where it goes

To the user, in the reply that ends the task. It is not a file, and it does not get
committed.

The durable record of the same work belongs in `.agents/memory/tasks/` and, for a
release, in `wiki/logs/` — see
[`../creators/memory-creator.md`](agents://creators/memory-creator.md) and
[`../creators/changelog-creator.md`](agents://creators/changelog-creator.md). The
summary and the memory entry are written from the same facts; neither replaces the
other.
