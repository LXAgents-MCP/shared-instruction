---
name: memory-tasks-fix-sonar-issues
description: Clearing the two remaining SonarCloud findings in LXAgents-MCP/shared-instruction — a super-linear regex in frontmatter parsing, and Express framework version disclosure.
---

# Two Remaining SonarCloud Findings

**Goal.** Clear the last two SonarCloud findings in this repository.

1. `src/tools/from-content.js:66` — super-linear regex (performance).
2. `src/http.js:72` — Express framework version disclosure (security hotspot).

**Objective.** Both are small, independent, and each owns exactly one file, so each
becomes its own commit on one branch rather than a batched session commit.

**Pre-work, outside the branch.** The working tree carried CRLF while the repository
stores LF, so all 110 tracked files read as modified with no real change. `master` now
carries `.gitattributes` pinning `text=auto eol=lf` (`d45a99a`), which collapsed the
churn before this branch was cut. `npm install` was also required before `npm test` would
run at all — a fresh checkout otherwise looks like broken code.

## Tasks

| # | Branch | Scope | PR |
|---|---|---|---|
| 1 | `chore/fix-sonar-issues-plan` | This file, and its `memory-index.md` row. | — |
| 2 | `chore/fix-sonar-issues-plan` | `src/tools/from-content.js` — the frontmatter field regex. | — |
| 3 | `chore/fix-sonar-issues-plan` | `src/http.js` — disable the `x-powered-by` header. | — |

Tasks 2 and 3 share this branch deliberately. Run in sequence, not in parallel: they
touch different files but the same git index, and two agents staging and committing at
once race for it.

## Per-task record

Each task appends its own entry below, in the same commit as its work.

### Task 1 — `chore/fix-sonar-issues-plan`

Created this file and registered it in `.agents/index/memory-index.md`. No shared file
touched, so nothing is published by this task.

### Task 2 — `chore/fix-sonar-issues-plan`

Cleared the super-linear regex finding at `src/tools/from-content.js:66`, the field
matcher inside `parseFrontmatter`:

    - /^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(.*)$/
    + /^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(\S.*|)$/

The value went from `.*` to `\S.*`, so the run of spaces before it and the value
behind it are now different character classes. `[ \t]*` and `.*` both accept a
space, so the two greedy runs overlapped and the engine could give a space from the
first run to the second, retrying the pair from every split point on a line that
never matches. With `\S` in front, giving a space back can never turn a failure into
a match, and each giveback now fails on its first character instead of being a
usable split. The key run is unchanged: `:` is not in `[A-Za-z0-9_]`, so its longest
match is the only position where the colon can follow and there was never a
successful backtrack to find there either.

Captures are unchanged, which is what makes this safe to land on its own. `[ \t]*`
still swallows the whole whitespace run and `\S.*` takes the value from the first
non-space to the end of the line, so group 1 is the same key and group 2 is the same
string as `.*` produced — the two differ only in which internal path the engine
walks. The `|` branch covers the value-less case (`name:` with nothing after it),
which `.*` matched as the empty string and `\S.*` alone would have rejected. The
`+ / -` above is the whole diff; `parseFrontmatter`'s callers see identical `fields`.

The cases that must not start matching are unchanged because nothing about *when*
the pattern matches was touched: a folded multi-line value still fails, a line not
starting with a letter or underscore still fails, and a missing `description` still
lands as the empty-string falsy value that `buildContentTools` rejects at startup.
No shared file touched, so nothing is published by this task.
