---
name: git-hosting-common
description: The concepts every git host shares — forges, refs, review requests, CI status, and the vocabulary differences between GitHub and GitLab. Read before either forge's per-operation pages, and whenever the words mean different things on the two.
---

# Git-hosting common

The parts of a forge that are the same everywhere, and the small number of places where
the same word means something else. Read this once; the per-operation pages under
[`../github/`](../github/) and [`../gitlab/`](../gitlab/) assume it.

## The vocabulary is not shared

This is the single most common source of confusion, and it is a naming problem, not a
conceptual one.

| GitHub | GitLab | Same idea? |
|---|---|---|
| **Pull request** (PR) | **Merge request** (MR) | Yes — both request merging a branch. The *name* differs; nothing else does. |
| **Issue** | **Issue** | Yes, but GitLab issues live inside a **project** and GitHub issues live in a **repository**. A GitLab issue is closer to a GitHub issue *plus* a category. |
| **Milestone** | **Milestone** | Yes. |
| **Project** | Group / Project | **No.** A GitHub *project* is a kanban board over issues. A GitLab *project* is the repository itself. This is the worst collision — see below. |
| **Label** | Label | Yes. |
| **Draft** | Draft | Yes. |
| **Protected branch** | Protected branch | Yes. |
| **Environment** | Environment | Yes. |
| — | **Pipeline** | GitLab's word for CI. GitHub calls a workflow run a **workflow run**, or informally an "action run". |
| **Run** | **Job** | Different granularity: GitHub Actions has runs containing jobs; a GitLab pipeline contains jobs directly. A GitLab *pipeline* ≈ GitHub *workflow run*. |

### "Project" means two different things

A **GitHub project** is a board. A **GitLab project** is a repository. Conflating them
produces sentences that are true of neither. When writing about either, name the thing
explicitly — "GitLab project `owen/app`" is unambiguous; "project" alone is not.

## Forks

Both forges have forks and both make the same distinction, which trips people up on one of
them and not the other: **a fork is a copy you own, a remote branch is a branch you pushed**.
GitHub supports both, and its UI blurs them. GitLab has no separate fork concept in the
same place — forking is always a fork, and branching from a fork requires the fork's URL.

## The review vocabulary

Both forges distinguish **state** from **decision**, and conflating them is the other big
trap.

* **State** — `open`, `closed`, `merged`, `draft`.
* **Decision** — `approved`, `changes requested`, `commented`.

`approved` is a decision, not a state. A review request is neither; it is a *request for a
decision*, and it can be outstanding while the change sits `open` with zero decisions.
Anything reading a forge programmatically has to check the decision, not the state.

**Blocking vs non-blocking.** Both forges let a reviewer mark a review as blocking. A
change-requested review blocks; a comment review does not. An agent that counts "reviews"
will over-count comments as approvals.

## Refs and the pull/merge ref

Both forges synthesise a **merge ref** for a review — `refs/pull/{n}/head` on GitHub,
`refs/merge-requests/{iid}/head` on GitLab.

**GitLab's is `iid`, not `id`.** The internal id is a global counter across all of GitLab;
the *iid* is the per-project number shown in the UI, in URLs, and in cross-references.
An agent that fetches by `id` when a document named `iid` gets a plausible-looking wrong
answer. This is the single most common GitLab mistake.

## CI status

Both attach status to a commit, and both distinguish the head commit from the merge
result. The practical rule for both: **check the status on the commit being proposed, not
on the target branch**, or you will read a passing main as evidence your change passed.

Both use a **mergeability** concept distinct from status: a check can be *passing* and the
change still be *unmergeable* because of conflicts, a required review missing, or a branch
protection rule. "All checks green" and "this can be merged" are different claims, and
only the second one is what anyone cares about.

## What is not shared

* **No cross-forge vocabulary for permissions.** A GitHub role (`maintain`, `triage`) and a
  GitLab role (`Maintainer`, `Developer`, `Reporter`) do not map cleanly. There are
  mappings; none of them is an identity. Never translate a role between forges
  programmatically.
* **No cross-forge "topic" concept.** GitLab has both labels *and* topics; GitHub has
  labels and treats them as both. They are not interchangeable.
* **Different review rules.** GitHub's branch protection, required reviews, and required
  status checks are configured per rule-set; GitLab's are per project, with push rules and
  approval rules that can be overridden locally in ways GitHub does not allow. Any
  statement about "you can't push" is forge-specific and must be checked, not assumed.

## Why this page exists

Both service folders need all of the above. Duplicating it into `github/` and `gitlab/`
would give two copies that drift apart, and a reader would have no way to know which one
to believe. Shared concept here, per-forge specifics in the service folder, one link
between them.

## Related

* [`../github/`](../github/) — GitHub, one file per operation
* [`../gitlab/`](../gitlab/) — GitLab, mirroring it
* [`anthropic-agent-skills.md`](anthropic-agent-skills.md) — the Agent Skills format, and
  why `description` is the only trigger mechanism
