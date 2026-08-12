---
name: versioning-rules
description: Never bump a version on your own initiative — what counts as a version carrier, how to propose a bump, and why the shared set is included.
---

# Versioning Rules

## Never change the project version on your own initiative

Always ask the user first, and wait for an explicit answer. A version is a claim made to
everyone downstream; it is not a housekeeping detail.

## What counts as a version carrier

Every one of these that exists in the repository:

* `package.json`, `pyproject.toml`, `Cargo.toml`, `pom.xml`, `gradle.properties`,
  `composer.json`
* a `VERSION` file, a `__version__` constant, a `version` field in a chart or manifest
* container image tags, git tags, release drafts
* **a new `wiki/logs/{Major}/{Minor}/{Patch}/` directory** — creating that directory
  *is* a version claim, so it is gated exactly like the rest

## The shared set's own version is included

A change to a shared file changes behavior in every consuming repository at once, so the
shared set is versioned and logged like any release:

* A change that **breaks an existing convention** — renames a file, changes a `name`,
  removes a rule consumers rely on — is a **major** bump.
* A change that **adds** a rule or a file is a **minor** bump.
* A clarification that changes no behavior is a **patch**.
* Every bump is announced in the shared set's `wiki/logs/`, and the entry names what
  consumers must do: nothing, re-read a file, or drop an override.

## How to propose a bump

When a change looks like it warrants one, stop and present:

1. The current version, and where it is recorded.
2. The proposed version.
3. Which of major / minor / patch, and why.
4. Every file that would change.
5. For a shared-set bump: which repositories are affected and what they must do.

Then wait. Do not stage the change "ready to go" — a staged bump is a bump.

## Never rewrite a release

* Never re-tag an existing version.
* Never edit a released version's log directory to change history. Corrections go in the
  next version's log.
* Never delete a version directory.
