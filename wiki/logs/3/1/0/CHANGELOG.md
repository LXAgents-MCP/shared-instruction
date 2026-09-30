# 3.1.0

**Released:** 2026-09-30

The set's own routing table is now complete, and a recurring Codespaces failure is
published as a tool. `content/rules/auto-activation.md` — the source of truth for *when*
each convention fires — named **23 of the 32** tools the server published. Nine were
absent, and nothing detected it: a tool can be published, servable, and unrouted, and the
suite stayed green through all of it. The table now names every tool, and a test holds it
there. `content/rules/github-token-access-guide.md` is new. The surface is **33 tools**,
was 32.

**Consumers must:** read the new tool if you hit the failure, and re-read
`auto_activation` if you route off it. **Doing nothing is otherwise correct** — no tool is
renamed, none is removed, and no gate moved.

## Added

- **`content/rules/github-token-access-guide.md`**, and its row in
  `content/index/instructions-index.md` in the same commit. `content/` is 32 markdown
  files, was 31; the surface is 33 tools, was 32.

  A Codespace holds **two** GitHub credentials for one account: a `ghu_` token in
  `GITHUB_TOKEN`, auto-provisioned and carrying **no scopes**, and a `ghp_` PAT in
  `~/.config/gh/hosts.yml` that carries `repo`. The system credential helper in
  `/etc/gitconfig` is consulted first and serves the scopeless one, so `git push` fails
  `403` and `gh pr create` fails with `Resource not accessible by integration` — while
  `gh auth status` reports correctly authenticated. The PAT was never missing; it was
  shadowed.

  The fix is `env -u GITHUB_TOKEN`, scoped to the single command. The mechanism is stated
  in full: the helper's first check is `if [ "$GITHUB_TOKEN" = "" ]; then exit 0`, so
  making the variable empty makes the system helper decline and git falls through to `gh`.
  It also carries both verification commands (`gh auth status` and `git credential fill`),
  a `pat()` wrapper, a symptoms table, and the `~/.gitconfig` approach that **does not
  work** — with the reason, which is that the system helper is read before the global file
  and wins.

  **It is published sanitized.** The author's account name and four repository names
  became `<your-account>` and `OWNER/REPO`, because the set is read by consuming
  repositories that are not the five this was hit across. The diagnosis is intact; the
  identity is not there to be leaked.

- **A test that `auto_activation` routes every published tool.** It reads the served text
  of `auto_activation` and asserts every name in the tool list appears in it. A file
  added to `content/` without a row now fails the suite.

## Changed

- **`content/rules/auto-activation.md` — the trigger table is total.** It gains ten rows:
  `root_index`, `instructions_index`, `logs_index`, `server_registry`,
  `branch_and_commit`, `memory_policy`, `agents_setup`, `task_workflow`, `auto_activation`
  itself, and `github_token_access_guide`.

  **It stays a routing file.** No body is inlined; the text of each file is fetched when
  its own trigger fires. The owner was offered the merge — one call returning the whole
  set, ~237,000 characters — and declined it, because that is the oversized payload
  `2.0.0` deleted. Every pre-existing row keeps its **exact** wording and trigger, so no
  consumer's declaration block breaks; the change is additive only.

  Two rows were written wrong on the first pass and corrected before commit. Both
  contradicted the mandatory table above them: `branch_and_commit` was pointed at the
  acts `branching_strategy` and `commit_conventions` already own, and `task_workflow` was
  described as producing the planning artifacts rather than describing what they are. A
  routing table whose rows contradict the table above it is worse than a missing row — it
  gives two answers to one question.

- The image tag is `3.1.0` in `README.md`, `wiki/environments/docker.md`,
  `wiki/security/security-model.md` and `.agents/rules/repository.md`.
- `package.json` and `package-lock.json` to `3.1.0`.
- The tool count reads 33 across `AGENTS.md`, `README.md`, `wiki/information/overview.md`,
  `wiki/information/architecture.md`, `wiki/environments/setup.md`,
  `wiki/reference/mcp-surface.md`, `wiki/security/security-model.md`,
  `wiki/guides/install-as-local-mcp.md`, `wiki/guides/connect-a-repository.md`,
  `.agents/wiki/context/repository-map.md`, `.agents/memory/state/repository-state.md`, and
  the four assertions in `test/http.test.js` that pin the surface length.

## What consumers must check

- **Read `github_token_access_guide` before your first `gh` or `git` call that writes**, if
  you work in a Codespace. It is a read; calling it costs nothing if the problem has not
  bitten you yet, and it is the difference between a correct PAT and a `403`.

- **If you route off `auto_activation`, re-read it.** Ten of the rows are new, and four of
  them name tools a repository may not have declared — including `memory_policy`, which
  governs what may be written to memory, and `auto_activation` itself, which fires when
  activation ran and the workflow still did not happen.

- **No action if you maintain your own declaration block.** A repository declares the
  subset it uses; the table growing does not oblige you to adopt the new rows, and
  `agents_update` is still on request only.

- No `name` was renamed or removed, no instruction `name` was reused, and no override
  needs dropping.

## What did not change

- **The four mandatory tools.** `plan_creator`, `branching_strategy`,
  `commit_conventions` and `discovery_protocol` keep their names, triggers, and content.
  No gate moved, and the three permission gates — approve the plan, ask before a pull
  request, ask before a merge — are untouched.
- `agents_update` and `duplicate_instruction_audit` keep their *on request only* triggers.
- **The transport.** `POST /mcp`, `GET /healthz`, the `MCP_ALLOWED_HOSTS` guard, the 4 MB
  body limit, and the `-32700` collapse are unchanged. **This release adds a file; it does
  not alter how anything is served.**
- The `Dockerfile`, which no commit in this release touched.

## Not done

- **The deployed instance still serves 32 tools.** A `tools/list` against the live Render
  endpoint on 2026-09-30 does not include `github_token_access_guide`, so it predates this
  release. `GET /healthz` answers `200` and would not have revealed this — an instance can
  be live and behind. Nothing in this repository records how a deployment gets promoted,
  which is why this had to be checked by hand.
- The per-file `version: 1.0.0` frontmatter across all 32 files is stale, and six creators
  still restate the merge gate that `plan-creator.md` owns. Both are carried forward
  unchanged from earlier releases and are recorded in
  `.agents/memory/findings/workflow-merge-findings.md` as `F1` and `F2`.
