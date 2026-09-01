---
name: memory-tasks-security-creator
description: Publishing security/ as a real instruction folder and adding the security-creator that fixes the shape of every security file in either set.
---

# The Security Creator, and the Folder It Writes Into

## 2026-09-01 — planned

**Goal.** The previous round gave this repository a security context but left the
organization without one. The user asked why there is no `content/security/`, and whether
security was already covered by the auto-activation protocol. Both answers turned out to
be worth writing down, and the second one is a defect rather than a gap.

**Objective.** `content/security/` is a folder the server will actually serve;
`content/creators/security-creator.md` fixes the shape of every security file in either
set; the creator fires from the shared trigger table. `npm test` green, mirrors updated in
the same commit, `0.14.0` released.

**Detail — what the two questions actually turned up.**

* **`directories.md` already declares `security/`** as a shared instruction folder, and has
  since the placement authority was written. So the architecture always allowed it and
  nobody had used it.
* **The server could not have published it.** `INSTRUCTION_FOLDERS` in `src/constants.js`
  is frozen to six folders, and `collectPaths` (`src/content/registry.js:77`) loops over
  only those. A file at `content/security/foo.md` is not rejected — it is **never
  collected**: absent from the manifest, absent from `agents://`, and absent from every
  test. `content-publishing.md` lists "the file sits in a declared instruction folder"
  among the boot invariants that fail loudly, and for a stray file at the content *root*
  it does. For an undeclared *folder* the failure is silence.
* **The gap is wider than security.** `directories.md` §B advertises 21 instruction
  folders; the registry serves 6. Fixing all of them changes the published surface far
  beyond this round, so the user chose to add `security` alone and take the rest as a
  finding.
* **Security is not in the auto-activation protocol.** No row in
  `content/rules/auto-activation.md` mentions it. The row added last round was **local**,
  and pointed at a wiki page — agent knowledge, not a rule. So security existed in the
  organization as exactly one repository's local documentation.
* **The creator's trigger row is shared, unlike last round's.** `security-creator.md` is a
  published creator, so `instruction-creator.md` step 6 applies: the row goes in the shared
  table and every consuming repository mirrors it. This is the opposite call from the
  security *pages* last round, for a different reason — a creator is universal, a
  repository's threat model is not.

## Tasks

| # | Title | Scope | Repository | Branch | Files / areas | PR |
|---|---|---|---|---|---|---|
| 1 | The record | This file, its index row, and a stale state correction. | `shared-instruction` | `chore/security-creator-plan` | `.agents/memory/` | |
| 2 | Make `security/` publishable | One constant, one mutation-proven test, the scope lines and surface docs that name the folders. | `shared-instruction` | `feat/security-folder` | `src/constants.js`, `test/`, `content/index/`, `wiki/reference/` | |
| 3 | The creator | The file, its index row, and the shared trigger row plus its mirror. | `shared-instruction` | `feat/security-creator` | `content/creators/`, `content/index/`, `content/rules/auto-activation.md`, `AGENTS.md` | |
| 4 | The release | `0.14.0`, changelog, both logs indexes, closing entry. | `shared-instruction` | `chore/release-0-14-0` | `package.json`, `wiki/logs/0/14/0/`, both logs indexes, `.agents/memory/` | |

**This chain stacks on the previous one.** Task 1 branches from `chore/release-0-13-0`
rather than from `master`, because `0.13.0` is pushed and unmerged and its content is a
dependency: the plan gate this round ran under is defined there.

## The structure the creator fixes

The user supplied a draft and asked for it to be made professional. Seven changes, each
for a stated reason rather than taste:

| Draft | Why it fails | Replaced with |
|---|---|---|
| No frontmatter | The registry **refuses to boot** without `name` and a `description` ≤ 140 characters. A `content/security/` file without it takes the server down. | Required frontmatter |
| `## Fix` | Names every file a defect report. Most security files describe controls that are working. | `## Surfaces` for the standing map, `## Open` only when something is genuinely unfixed |
| `\|{file-path}\|{reason}\|` | Not valid markdown — no header row. And "reason" conflates *why it is exposed* with *what protects it*, which is the distinction the table exists to draw. | `\| File \| Exposure \| Guard \|` |
| `{Table Name1}` as a bare line | Not a heading, so it does not appear in an outline and cannot be linked. | `### {Group}` |
| `### Summary` nested under `## Fix` | Makes a whole-file summary a subsection of one part of the file. | Lifted to `##` |
| No verification section | `instruction-creator.md` requires a rule a reader can check compliance against. A security file that cannot be verified is a claim. | `## Verifying` |
| No escalation, no out-of-scope | Last round proved both earn their place — *Not a finding here* already stops the cold start and the unauthenticated endpoint being re-raised. | `## Escalate, do not decide` and `## Not a finding here` |

**Overview and Summary must not collapse into each other.** Overview says what the file is
about and is read first; Summary is the conclusion a reviewer quotes without opening the
file. Written carelessly they become the same paragraph twice, which is the duplication
this repository treats as a defect rather than a style choice. The creator states the
distinction explicitly, because it is the failure a template invites.

## Per-task record

### Task 1 — `chore/security-creator-plan`

Created this file, registered it in `.agents/index/memory-index.md`, and **corrected a
state claim that went stale within the hour**.

`repository-state.md` said `origin/master` was at `dd87eee` carrying `0.10.0`, 49 commits
behind the stacked line. That was true when it was written and is now false: master has
advanced to `83b6f3d` and carries `0.12.0`, so this round's chain bases directly on it with
nothing in between.

Worth noting rather than quietly overwriting, because the paragraph was added **last
round** specifically to stop a session planning a branch point from a stale claim — and it
went stale immediately. The lesson is not that the correction was wrong. It is that a
state file naming a specific commit has a short half-life, and the next session should
re-verify with `git fetch` rather than trust the recorded SHA. That instruction is now in
the file beside the fact.

### Task 2 — `feat/security-folder`

`security` added to `INSTRUCTION_FOLDERS`, **above `index`**, so the shared set can now
serve `content/security/`. One line of code and four documentation changes, because the
line of code was never the hard part — knowing it was needed was.

| File | Change |
|---|---|
| `src/constants.js` | `security` inserted before `index` |
| `test/registry.test.js` | Two tests, both mutation-proven |
| `content/index/instructions-index.md` | Scope line, and a `## security/` section stating the folder is served but empty |
| `content/index/root-index.md` | The child-index scope row |
| `content/rules/directories.md` | §B: the caveat that would have prevented this round |

**The caveat is the durable part of this task.** `directories.md` §B lists 21 instruction
folders and reads as if all of them work. Seven are served. The new paragraph says
plainly that a shared file in any other folder is **not rejected — it is never
collected**, names `INSTRUCTION_FOLDERS` as the second authority, and notes that local
folders under `.agents/` are unaffected because nothing serves them. Without it the next
person to reach for `ethics/` or `compliance/` hits exactly the silence this round hit.

**Ordering is pinned, not incidental.** `index/` holds routers rather than instructions
and reads last in every listing built from the constant. The natural way to add a folder
is to append, which would have put `security` after it — so a test pins `index` last.

**Both tests were mutation-proven.** Removing `security` from the constant: **86 → 84
pass, 2 fail**. Restored, 86 pass.

| Test | Fails when |
|---|---|
| `a file under content/security/ is collected and served` | The folder stops being walked. Builds a temp content dir with `AGENTS.md` and `security/secret-handling.md`, then asserts the entry resolves with `folder === 'security'` and the expected `agents://` URI. |
| `INSTRUCTION_FOLDERS keeps index last, so a new folder is added above it` | A folder is appended after `index`, or `security` is dropped. |

The first test builds a **fixture registry** rather than asserting against the shipped
set, and that is deliberate: this round adds no file under `content/security/`, so a test
reading the real set would have nothing to find and would pass whether or not the folder
works. `loadRegistry({ contentDir })` already supported this; no production code changed
to make the test possible.

**No counts moved.** 27 instruction resources before and after — the folder is served and
empty, so `README.md`, `wiki/information/overview.md`, and `wiki/reference/mcp-surface.md`
stay correct and were deliberately not touched.

### Task 3 — `feat/security-creator`

`content/creators/security-creator.md`, the sixth creator and the first organized by
**subject** rather than by artifact kind. That is a new axis in the set — the other five
split by what is being written (instruction, information, index, memory, changelog), this
one by what it is about. It was flagged to the user at the plan gate as a door being
opened knowingly rather than by accident, and it is defensible because security files have
a genuinely distinct required shape that no artifact-kind creator supplies.

**Three destinations, not two.** The creator's first section is routing, because security
has an extra place to go wrong compared with documentation: `{shared}/security/` for
universal policy, `{repo}/wiki/security/` for this repository's threat model,
`{repo}/.agents/wiki/security/` for the agent procedure. Both wrong answers are named with
their consequence — a local threat model published tells every repository your attack
surface is theirs, and a universal policy kept local means every other repository
rediscovers it after an incident.

**The structure carries a per-section rationale table.** Not decoration: each row names the
failure that section prevents, so a writer deleting a section knows what they are giving
up. The two rows that do the most work are `Surfaces` — `Exposure` and `Guard` are separate
columns precisely so a surface with **no** guard is visible rather than smoothed into a
prose "reason" — and `Open`, which the creator forbids from ever reading "none known",
because that claims a completeness nobody established.

**§D exists because of last round.** *Write from the code, never from memory.* Writing the
security pages in `0.13.0` turned up `MCP_DNS_REBINDING_PROTECTION` defaulting to `false`,
which contradicted what the surrounding code implied. A remembered guard, an assumed
default, and a control true in another codebase all read exactly like knowledge, so the
creator requires the file be opened and the default checked.

**The trigger row is shared this time**, and the contrast with last round is the point:

| Round | Row | Where | Why |
|---|---|---|---|
| `0.13.0` | Load the security SOP on security work | **Local** `AGENTS.md` only | It names a local wiki page. A shared row would be broken in every repository without that tree. |
| `0.14.0` | Load the security creator when writing a security file | **Shared** `auto-activation.md` + mirror | It names a published file every consumer can resolve. |

**A test caught what a reading would not have.** `registry: the discovery-protocol block is
byte-identical in every copy` asserts the creator count and failed at 6 !== 5. That is the
test doing exactly its job: `discovery-protocol.md` §F owns the bounded list of files
reproducing the gate block, and a sixth creator that carries the block without being added
to that list would have left the authority wrong while every copy stayed correct. §F now
names `security-creator.md`, and the assertion counts six.

**Counts moved for the first time in three rounds.** 27 → 28 instruction resources.
`README.md`, `wiki/information/overview.md`, `wiki/reference/mcp-surface.md` (which
enumerates every URI), and `repository-state.md` all updated. The connector's own
"(N files)" line needed nothing — `src/server/create-server.js:32` builds it from
`registry.size`, which is the shape `repository.md` asks for and the reason that one
mirror has never gone stale.

86 tests pass.
