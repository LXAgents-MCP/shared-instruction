---
name: code-review
description: How to review code for what actually goes wrong — correctness, boundaries, and silent failures — rather than for style a formatter already owns. Read before reviewing a change or asking for one.
---

# Code Review

Review exists to catch what the author could not see, not to restate what the diff
already says. A review that comments on formatting is noise that makes the real finding
easy to miss.

## What is worth your attention

In roughly this order:

**1. Correctness at the boundaries.** Off-by-one, empty input, the last element, the
zero case, the concurrent case. The interior of a function is usually right; the edges
are where bugs live because they are where the author stopped thinking.

**2. Silent failure.** The highest-value class of finding. Anything that catches an
exception and continues, returns a default on failure, logs and moves on, or swallows an
error. It looks like success to the caller, so the failure surfaces somewhere unrelated
later — which is the expensive kind of bug to trace.

Look for the same shape in data: a parse that returns empty on malformed input, a lookup
that returns `None` treated as falsy, a truncated response read as complete.

**3. The assumption that no longer holds.** The code is correct and the premise is gone.
A cached value from a file that is no longer written, a config key that was renamed, a
contract that now has a second client. Nothing looks wrong and everything is.

**4. Error messages a person can act on.** Does the failure say what was expected, what
was found, and where? An error naming a parameter is worth ten that say "invalid input."

**5. Naming and boundaries.** Does the name say what it does? Is there one obvious place
to look for a given behaviour?

**6. Tests that would catch the bug you are thinking of.** A test that asserts the code ran
is not a test. Ask what would fail.

## What to leave alone

Style a formatter owns. Import order. Comment wording, unless the comment is now wrong.
Naming preferences you would have made differently and can live with.

**Strong opinions, loosely held.** A reviewer who blocks a change on a preference they
cannot justify is costing more than the preference saves. Say it as a question and move on.

## What not to do

**Do not rewrite.** A review that rewrites the change has taken it over, and the author
has learned nothing. Point at it.

**Do not review what you did not read.** Skimming produces a review that says nothing
about the code and something about the reviewer.

**Do not approve to be agreeable.** An approval you do not believe in is worse than a
refusal, because it removes the last check.

**Do not pad.** Three real findings beat fifteen with twelve that are style.

## How to write the review

**Lead with the blocking findings**, most important first. If nothing blocks, say that in
the first line rather than making the reader hunt.

Distinguish clearly between:

| Kind | Meaning |
|---|---|
| **Blocking** | Wrong, unsafe, or will break something. Say why, concretely. |
| **Should fix** | Correct now, expensive later, or inconsistent with the codebase. |
| **Optional** | An idea. Explicitly optional, and the author may decline it. |
| **Question** | You did not understand something, which may be your gap or the code's. |

A blocking finding needs the consequence, not just the rule: not "this doesn't handle
empty," but "this returns an empty list for empty input, and the caller treats that as
'no results' rather than an error — so a truncated response looks like a clean search."

**Quote the line.** A finding anchored to a line number survives contact with the author,
who may read the code differently than you did.

## Reviewing your own work

The dangerous moment is reviewing code you just wrote. You remember the intent, and the
intent is exactly what the code does not do.

**Re-read it as if someone else wrote it, with no access to your reasoning.** Ask what you
were assuming. Specifically: what happens on the second call, the empty input, the
timeout, and the version of the dependency that is one major behind?

## Before asking for a review

The reviewer is not a spellchecker. If the change is unclear, has a mixed diff, or lacks a
statement of what it was trying to do, the review will be about clarity rather than
correctness — and you will get a long list of small notes instead of one that matters.

Write the "what and why" first, and split a change that does two things.

## See also

* [`../authoring/technical-writing.md`](../authoring/technical-writing.md) — the same
  discipline for prose: state the consequence, not just the rule
* [`../engineering/mcp-server.md`](../engineering/mcp-server.md) — where silent failure is
  most likely in this workspace's history
* [`../../rules/repository.md`](../../rules/repository.md) §The Proxy Rule — shared
  infrastructure with two clients, the case where reviewing one client's change means
  checking the other's