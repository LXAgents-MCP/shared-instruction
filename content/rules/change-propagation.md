---
name: change-propagation
description: A change to code or structure updates the documentation describing it, in the same commit, and proposes the instructions it made stale.
---

# Change Propagation

## The rule

**When code or project structure changes, every document that describes it changes
too.**

A commit that leaves a page describing the old state is not finished. It is a commit
plus a defect, and the defect is worse than a stale comment: the next agent routes on
these documents and acts on what they say.

This is not a cleanup pass for later. It is part of the change.

## What is in scope

Work outward from what you touched, and stop where the change stops. A page is in scope
only when the change actually invalidated it — an untouched page is not a chore, and a
diff that rewrites half the wiki to look thorough is its own defect.

Ask it as one question: **would a reader who trusted this page now be wrong?**

That resolves against whatever trees the repository actually has. In practice it reaches
the human `wiki/` page covering the module, command, public surface, or usage you
changed; `README.md`, when the change makes its summary wrong; the agent orientation
page in `.agents/wiki/`, when layout, commands, entry points, or gotchas moved; and
`.agents/memory/state/`, when what is live, broken, or in flight changed.

Indexes and memory are already governed elsewhere — a file added, moved, or removed
updates its owning index in the same commit
([`../creators/index-creator.md`](agents://creators/index-creator.md)), and memory is
written as you work ([`memory-policy.md`](agents://rules/memory-policy.md)). This rule
covers the pages that describe **behaviour**, which nothing else does.

## Which commit

**The same one.** Not a follow-up commit, not the end of the branch, not a separate pull
request. Reviewers read the diff to decide whether a change is right, and a diff that
changes behaviour without changing its documentation reads as though nothing was
documented in the first place.

The one thing that may lag is a `wiki/logs/` entry, which is a version claim and belongs
to [`versioning.md`](agents://rules/versioning.md).

## When the stale file is an instruction

Documentation you fix yourself. **An instruction you do not.**

When a change makes a rule wrong, do not rewrite it — that is exactly what the discovery
protocol exists to prevent, and it applies no less when the rule is provably stale.
Collect the finding and present it, per
[`discovery-protocol.md`](agents://rules/discovery-protocol.md). Then say in the pull
request body which instructions you left stale and why, so the next reader knows the gap
is known rather than missed.

## Before you commit

Ask, and answer honestly:

1. Does any page in either wiki tree still describe the behaviour I just changed?
2. Does `README.md` still summarise a project that no longer works that way?
3. Does an instruction now assert something untrue?
4. Would a reader who trusted these documents be misled by this commit?

A "yes" to 1 or 2 means the commit is not ready. A "yes" to 3 means a discovery finding
to present. A "yes" to 4 means say so out loud rather than hoping it is noticed.

## This is a convention, not automation

Nothing enforces this mechanically. It holds because auto-activation
([`auto-activation.md`](agents://rules/auto-activation.md)) puts it in front of an agent
before the work starts, and because pull request review catches what slips past. If it
ever needs teeth — a check that fails a commit touching source without touching
documentation — that is a real change to propose, not something this file can assert
into being.
