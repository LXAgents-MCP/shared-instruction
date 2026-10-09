---
name: versioning-rules
description: Never bump a version on your own initiative — what counts as a version carrier, how to propose a bump, and why instruction files carry no version at all.
---

# Versioning Rules

**Instruction files in `.agents/` are not versioned.** No `version`, no `author`, no stamp
of any kind. They carry `name` and `description` and nothing else.

That is the whole rule for this tree. Everything below governs **a real project that
carries a version** — a `package.json`, a released library, a deployed service — and those
live in `orgs/{org}/{repo}/`, never at this root.

## Never change a project version on your own initiative

Always ask the user first, and wait for an explicit answer. A version is a claim made to
everyone downstream; it is not a housekeeping detail.

## What counts as a version carrier

A file that carries a version a **consumer depends on** — one where an old value still
works, or where a wrong value breaks an install:

* `package.json`, `pyproject.toml`, `Cargo.toml`, `pom.xml`, `gradle.properties`,
  `composer.json`
* a `VERSION` file, a `__version__` constant, a `version` field in a chart or manifest
* container image tags, git tags, release drafts
* **a new `wiki/logs/{Major}/{Minor}/{Patch}/` directory** in a project repository —
  creating that directory *is* a version claim, so it is gated exactly like the rest

**A field nobody reads is not a version carrier.** That is the test, and it is why
`version: 1.0.0` in an instruction file was never one: no consumer ever resolved against
it, so bumping it would have been theatre. Thirty such stamps sat at `1.0.0` through every
substantive rewrite of the files holding them.

## Why the instruction tree carries none

A version earns its cost by telling a consumer what changed. This tree has no consumer to
tell.

* **Nothing depends on it.** There is one set, it is local, and it is edited in place.
* **Nothing can recover it.** The root is not a git repository, so a version number is the
  only history a file would appear to have — and it would be a false one.
* **It cannot be kept true.** `versioning.md` gates every bump behind approval. Keeping
  honest stamps would mean gating every substantive edit to a rule file, or accepting that
  `1.0.0` has meant nothing for months.

**A version that never changes records nothing but the day it was written.** Removed from
all 30 files on 2026-10-04, along with `author` for the same reason — one workspace, many
editors, no version control to recover who wrote what.

**Do not reintroduce either key** to record that a file changed. What is worth recording
belongs in a project's memory, or for this tree in a history page —
where it says what happened rather than implying a number moved.

## How to propose a bump

For a real version carrier, stop and present:

1. The current version, and where it is recorded.
2. The proposed version.
3. Which of major / minor / patch, and why.
4. Every file that would change.
5. What consumers must do: nothing, re-read a file, or drop something.

Then wait. Do not stage the change "ready to go" — a staged bump is a bump.

**Patch** changes no behaviour. **Minor** adds a rule or a file. **Major** breaks an
existing convention — renames a file, changes a `name`, removes a rule something relies on.

## Never rewrite a release

* Never re-tag an existing version.
* Never edit a released version's log to change history. Corrections go in the next
  version's log.
* Never delete a version directory.

These apply inside a project repository, where a release exists. The root has no version
and no `wiki/logs/`, so it has nothing to re-tag.
