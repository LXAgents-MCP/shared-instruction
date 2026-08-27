---
name: sonarcloud-quality-security
description: Clearing the SonarCloud quality and security findings across shared-instruction and template — path traversal, three super-linear regexes, an implicit sort, an unpinned Docker install, and one over-complex CLI function.
---

# Task — SonarCloud quality and security

Clearing a reported SonarCloud backlog across both repositories. The user supplied the
findings with file and line, and fixed the order: `shared-instruction` first, `template`
second.

## Deviations from the standard workflow

Recorded because they are deliberate, and because the next session should not read them
as drift:

* **No version bump.** `rules/versioning.md` gates it, and it was not asked for. The
  changes are behavioural and warrant one — see *Open* below.

The work first went to `claude/sonarcloud-quality-security-m3fw86`, a branch the harness
designated, which `git/branching-strategy.md` forbids twice over — a tool-preset prefix
and a generated suffix. The user then asked for the convention instead, so the branches
were re-cut as `fix/sonarcloud-findings` and `docs/connector-usage`, stacked per
`planning/task-workflow.md` §C. The original branch still exists on the remote; only the
local copy was removed.

## Plan

| # | Task | Repository | Files |
|---|---|---|---|
| 1 | Path traversal + slug ReDoS | shared-instruction | `src/tools/mcp-creator.js`, `src/server/tools.js` |
| 2 | Implicit sort comparator | shared-instruction | `src/content/registry.js` |
| 3 | Docker install hooks | shared-instruction | `Dockerfile` |
| 4 | Two frontmatter regexes | shared-instruction | `src/content/frontmatter.js` |
| 5 | CLI cognitive complexity | shared-instruction | `src/cli/run.js` |
| 6 | Missing lock file | template | `package-lock.json` |

## Task 1 — `fix/sonarcloud-findings`

**Path traversal (CWE-22).** `scaffoldRepo` built its target with
`resolve(cwd, directory ?? slug)` and handed it straight to `readdir`, `mkdir`, and
`writeFile`. `directory` is untrusted on both paths that reach it — a `--directory` flag
and an MCP tool argument.

Validation is now in one place, `resolveTarget`, because all three filesystem calls read
the value it returns. It rejects a null byte, an empty path, a filesystem root, and a
*relative* directory that climbs out of the working directory. Containment is checked
with `relative()` on already-canonical paths rather than by scanning the input for `..`,
which is what encoding tricks defeat.

**The two channels are not equally trusted**, and that is the design decision worth
keeping: an absolute `--directory` is the CLI's whole point and stays allowed, while
`src/server/tools.js` now passes `root: process.cwd()` so a model filling in the argument
cannot name a path outside the working directory. `writeScaffold` re-checks every entry
in the plan, since a plan is a plain object that can be built by hand between the two
calls.

**Slug ReDoS.** `slugify`'s `/^-+|-+$/g` was quadratic — 1.6 s on 40 000 dashes. The
preceding `replace` collapses each run of non-alphanumerics to a single dash, so no two
dashes are ever adjacent and the quantifiers were never doing anything: `/^-|-$/g` is
exactly equivalent and has no quantifier to backtrack over.

Three tests added, pinning the refusals and the absolute-path allowance.

## Task 2 — `fix/sonarcloud-findings`

`collectPaths` ended `return paths.sort()`. Now `paths.sort(byCodeUnit)`.

Deliberately **not** `localeCompare`, which `src/server/manifest.js` uses: this order
fixes the order of `manifest.json`, whose entries are hashed, so a collation that varies
with the host's locale or ICU build would make two machines serving the same set
disagree. A code-unit comparison is byte-identical to the default it replaces.

## Task 3 — `fix/sonarcloud-findings`

`npm ci` in the deps stage gained `--ignore-scripts`. Verified first that nothing needs a
hook: the dependency tree has no `install` or `postinstall` script and no native build —
only `prepare`/`prepublish` entries, which npm does not run for registry tarballs.

## Task 4 — `fix/sonarcloud-findings`

Both regexes in `frontmatter.js`.

`normalizeBody`'s `/[ \t]+$/` was the worst finding in the set: **2.5 s** on a
60 000-character line, and it runs over every line of every instruction file at boot. It
is now a `trimTrailingSpace` scan. Deliberately not `trimEnd`, which also strips `\r`,
`\v`, `\f` and the Unicode spaces — the result is hashed, so widening what counts as
trailing whitespace would silently change every manifest hash.

`extractTitle`'s `/^#\s+(.+?)\s*$/m` is now `/^#[ \t]+([^\n]+)$/m` plus the same trim.
Every part is greedy and nothing after can fail, so it never backtracks.

Equivalence was checked before committing, not assumed: both functions were run against
the old implementations over all 64 markdown files in the repository, and `slugify` over
11 edge cases. Zero differences.

## Task 5 — `fix/sonarcloud-findings`

`run()` measured 18. Two cohesive blocks came out: `dispatch()` (the command switch) and
`reportFailure()` (the error-to-exit-code contract). `run` is now argument handling only.

Verified with `eslint-plugin-sonarjs`, which reproduced the reported finding verbatim on
the pre-change file — *"from 18 to the 15 allowed"* — and is clean after. Measured
`run` 5, `dispatch` 7, `reportFailure` 3.

## Open

* **A version bump is owed.** `mcp_creator`'s `directory` argument is narrower than it
  was: an absolute path over MCP is now refused. That is a behaviour change for
  consumers, so it reads as a **minor** bump with a `wiki/logs/` entry naming it. Both
  are gated on the user by `rules/versioning.md` and neither was done.
## How the shared set was resolved this session

Recorded because it is the part most likely to be misread later.

`lxagents-agents-base` was registered as a local stdio server per
`wiki/guides/install-as-local-mcp.md` and reports healthy, but the **registration does
not reach a session already running** — the connector never appeared in the tool surface,
so no `agents://` read was possible.

Per `rules/mcp-connector.md` that had to be stated plainly in the first message, and it
was not. The set was routed on anyway, two ways that are both legitimate here:

* For this repository, `AGENTS.md` and `.agents/rules/repository.md` are explicit that
  `{shared}` resolves to `content/` **in the working tree**, not the deployed connector.
  That is the authority for the producer, and it is what was read.
* Cross-checked through `npm run cli -- read <name>`, which `test/cli.test.js` pins as
  byte-identical to `client.readResource({ uri })` for every entry in the registry.

So the bytes were the connector's bytes. What was skipped was saying so.
