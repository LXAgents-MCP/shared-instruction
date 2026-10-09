---
name: security-creator
description: Writes security files in either set — the three destinations, one concern per file, and the structure every security page follows.
---

# Security Creator

Creates and maintains **security** files: what a threat means *here*, which surfaces carry
it, and how a reader checks they complied. Its first job on every page is to decide which
of three places it belongs, because a security file in the wrong one is either invisible
or broadcast to repositories it does not describe.

## A. Route first — three destinations, not two

| The page is… | It goes to | Set |
|---|---|---|
| A security **policy** true of every repository — secret handling, dependency policy, what never goes in a commit | `{shared}/security/{file}.md` | Shared, **published** |
| **This repository's** threat model — its surfaces, its guards, its deployment posture | `{repo}/wiki/security/{file-name}.md` | Local, human |
| A **procedure or constraint** that exists so an agent behaves correctly here | `{repo}/.agents/wiki/security/{file-name}.md` | Local, agent |

The routing question is: *is this true for more than
this repository?* Applied to security it has a sharper edge than usual, because both
wrong answers are expensive:

* **One repository's threat model presented as another's** tells every repository that
  your attack surface is theirs. Security guidance is obeyed rather than evaluated, so a
  mismatched control gets applied where it does not fit and skipped where it does.
* **A universal policy kept in one repository** leaves every other repository to
  rediscover it, which for security means rediscovering it after an incident.

There is no upstream to publish to. **A rule that would apply everywhere is written once,
in the repository it applies to**, and another repository that needs it holds its own copy.

From a consuming repository you never write the shared file. Propose it to the owner instead.

**A security context never crosses repositories.** A threat model, a checklist, or a
conclusion learned in one repository is re-derived in the next, never copied. "The path
check is handled upstream" and "there is nothing to protect here" are true somewhere and
false elsewhere, and both read as context rather than as claims. This is the one rule this
creator will not let a page skip.

## B. One concern per file

**Each security concern gets its own file.** Put it in an existing file only when it is
genuinely the same concern — not merely adjacent, not merely also-security.

The test: if the
heading you are about to add has nothing to do with the file's `name`, it is a new file.
"Secret handling" and "dependency policy" are both security and are two files. A second
surface for a concern already documented is a **row in that file's table**, not a new file.

This matters more here than elsewhere. Security files are read under time pressure, by
someone checking one thing; a file that covers four concerns is one a reader skims past
the relevant part of.

## C. The structure

Every security file, in either set, uses this shape. Sections that do not apply are
**deleted, not left empty** — an empty heading reads as "nothing to worry about here",
which is the one message a security file must never send by accident.

````
---
name: {kebab-case, unique within the set}
description: {what it protects and where — one line, 140 characters maximum}
---

# {Security Name}

{Overview: one to three sentences. What this protects, and the single line worth
keeping if the reader keeps nothing else.}

## In this project

{How the concern actually appears HERE — named surfaces, named files, named callers.
Never a definition of the threat in general: a reader who wants that has the internet,
and a page that spends its first screen on one buries what is specific to you.}

## Surfaces

### {Group}

| File | Exposure | Guard |
|---|---|---|
| `{path}` | {who can reach it} | {what stops them — or `none`, which sends it to Open} |

## Verifying

| Check | How | Passing looks like |
|---|---|---|
| {what is being checked} | {command, test, or grep} | {the observable result} |

## Escalate, do not decide

* {what to ask the user about rather than resolve alone}

## Not a finding here

* {what is commonly mistaken for this concern, and why it is not}

## Open

{Anything genuinely unfixed, with what it would take. Delete this section when
nothing is open — never leave it saying "none known".}

## Summary

{Two to four sentences: the version a reviewer quotes without opening the file.}
````

### What each section is for, and the mistake it prevents

| Section | Its job | The failure it prevents |
|---|---|---|
| **Frontmatter** | `name` and `description`, 140 characters maximum | A security file with no `name` and `description` has nothing an agent can route on — the page exists and is never found. |
| **Overview** | Orientation, read first | — |
| **In this project** | The concern as it exists *here* | A page that explains the threat generically and never lands on a real file. The reader cannot act on it and stops trusting the folder. |
| **Surfaces** | The map: what is exposed and what guards it | "Exposure" and "Guard" are separate columns because collapsing them into one "reason" hides the case that matters — a surface with no guard. A `none` in that column is a finding, and it goes to Open. |
| **Verifying** | How a reader confirms compliance | An instruction must be one a reader can check. A security claim nobody can verify is an assertion, and it decays without anyone noticing. |
| **Escalate, do not decide** | The boundary of your own authority | Loosening a guard to make something work, made unilaterally. The guard is the feature; a test that needs it off is a test to rewrite. |
| **Not a finding here** | Closes the same false alarm permanently | The same non-issue re-investigated every few months. Each line here is a round somebody does not repeat. |
| **Open** | Honest unfinished business | An `Open` section reading "none known" is worse than none: it claims a completeness nobody established. |
| **Summary** | The conclusion, for a reviewer | — |

**Overview and Summary must not become the same paragraph.** Overview says *what this file
is about* and is read first. Summary says *what the posture actually is* and is read by
someone who will not open the file. If you can swap them without loss, one of them is not
doing its job — and duplicated text is the defect
the one-subject-per-file rule exists to prevent, not a style
preference.

## D. Write from the code, never from memory

Every claim in a security file names something a reader can open. A remembered guard, an
assumed default, and a control that was true in another codebase are the three ways these
pages go wrong, and all three read exactly like knowledge.

* **Open the file before you describe it.** Cite the path, and the symbol where it helps.
* **Check the default rather than assuming it.** A protection that ships off by default is
  a very different claim from one that ships on, and the difference is one line in a config
  file.
* **A control you cannot point at does not go in the table.** It goes in `Open`.

## E. Procedure

1. Route by §A. Decide the set before the folder.
2. Confirm it is a new concern by §B, not a row in a file that already exists.
3. **Shared only:** confirm the folder is served. `content/security/` is in
   `INSTRUCTION_FOLDERS`; a file in a shared folder that is not there is never collected.
4. Write the file to §C, from the code, per §D.
5. Register it in the index that owns that scope, **in the same commit**.
6. If it introduces a new automatic behavior, add its trigger row to the Instruction
   tools block in the root `AGENTS.md` — and note that a
   row naming a local file is added to *your* repository's appended rows, never to the
   shared table every consumer mirrors.
7. **Shared only:** a change under `{shared}/` is a release, and a version change needs the user's approval.
8. Commit.

## What this creator refuses

* **Writing a threat model as if it were another repository's.** That is the local tree,
  always.
* **Copying a security page between repositories.** Each repository derives its own; the
  point of a security page is that it was written against a real surface.
* **A `Surfaces` row with a guard nobody can point at.** It goes to `Open` instead.
* **An `Open` section that says "none known".** Delete the section.
* **Bundling two concerns into one file** because they are both security.
* Writing normative rules outside a security subject, or general documentation — those
  belong to other creators.

## Where this applies

**There is no second instruction set.** This workspace is plain `.md` files under
`.agents/` — no server serving them, no plugin, no connector, nothing to override.

The branch, commit, and pull request conventions are written
for a repository with a default branch. **The root here has no git at all**, so there is no
branch to create and no commit to make — root work is written directly and recorded in
memory. The conventions apply inside `orgs/{org}/{repo}/`.
