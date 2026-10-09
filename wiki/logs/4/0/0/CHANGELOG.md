# 4.0.0

**Released:** 2026-10-09

The published set is replaced. `content/` now holds the owner's re-created 47 files plus one
new tool, **`automation`**, which every session reads first and which lists every other tool
with the condition that activates it. Every other tool is complete on its own: none links to,
names, or sends the reader to another. The surface goes from **35 tools to 48** — 13 removed,
26 added, 22 kept under the same id with new text. This is a major release because tools are
removed.

**Consumers must:**

1. **Read `automation` once at the start of every session**, and add it as the first row of the
   Shared instruction tools block in your `AGENTS.md`. The old rule "call nothing at session
   start" now has one exception; the sentence in your `AGENTS.md` that says otherwise is wrong.
2. **Delete every row and every call that names a removed tool**: `agents_entry_point`,
   `root_index`, `instructions_index`, `logs_index`, `server_registry`, `mcp_list`,
   `task_workflow`, `agents_setup`, `agents_update`, `auto_activation`,
   `duplicate_instruction_audit`, `mcp_connector`, `mcp_tool_availability`. An override named
   after one now matches nothing, so drop it.
3. **Re-read the tools you use.** All 22 that kept their id changed: links to other tools are
   gone and the facts they carried are written in; frontmatter is `name` and `description`
   only. `plan_creator`, `branching_strategy` and `branch_and_commit` also gain the release
   branch form below.
4. **Restart any session that was open**, so the client reloads the connector and sees the
   new tools. A server that reports healthy is not a server whose tools are published.
5. **Do not rely on `shared_instructions` §H.** The mandate is §C and the three gates are §D.

## Added

- **`automation`** — the hub. About 6 KB, 47 rows in eight groups, each
  `` `id` — the condition that activates it ``. It is a manifest, not a copy: no tool's text
  is in it. Its frontmatter name is "Read this tool every session", its description opens with
  the same words, it is the first tool a client lists, and the server's `initialize`
  instructions send a session to it. A test fails if it omits a tool, names one that does not
  exist, or exceeds 10 KB.
- **Twenty-five more tools**: `skill_creator`, `repository`, and 23 skills pages — document
  formats (`docx`, `pdf`, `xlsx`), `mcp_builder`, `mcp_server`, `anthropic_agent_skills`,
  `technical_writing`, `web_interface`, `code_review`, `git_hosting_common`, and 13 for the two
  forges: `github_actions`, `github_api`, `github_authentication`, `github_issues`,
  `github_pull_requests`, `github_releases`, `github_repositories`, `gitlab_api`,
  `gitlab_authentication`, `gitlab_ci`, `gitlab_issues`, `gitlab_merge_requests`,
  `gitlab_repositories`.
- **The release branch form, `release/{version}`** — for example `release/4.0.0`, with no `v`,
  because the git tag already carries it. Stated in `plan_creator`, `branching_strategy` and
  `branch_and_commit`. `release` is a branch type for this form alone; a release commit stays
  `chore(release): …`. Each repository's release branch carries its own version.
- **Tests**: the hub is first, total, honest and small; no tool but `automation` points at
  another; every `NAME_OVERRIDES` key names a file; forge pages are named for their forge; the
  release branch wording is present.

## Changed

- **Every tool ends in itself.** 321 links and about 60 filename mentions are gone. Where a
  sentence leaned on another tool for a fact, the fact is now stated in it; where the pointer
  was only navigation, it was deleted, along with the `Related` and `See also` sections.
- **`instruction_creator` now says the opposite about linking.** It said "Facts live once, and
  every other file links to them", "Link, do not inline", and refused inlining another file's
  content. A tool that needs a neighbour's fact now states it in a sentence of its own, and
  still does not copy the neighbour's procedure.
- **`plan_creator`** states the branch and commit formats it used to defer to a section that
  did not exist, and the pull request title and body shape.
- **Tool ids for the 13 forge pages** are explicit overrides in `src/tools/from-content.js`,
  because four filenames exist on both forges and boot refuses a collision. A stale override
  is now a startup error.
- **Frontmatter is two fields.** The set carries no `version` or `author`, and the test that
  required them now requires `name` and `description`.
- **`src/server.js`** `instructions`: read `automation` first, once; call nothing else until
  its condition is true.
- **`AGENTS.md` and the local set.** Session start reads `automation`; the shared trigger table
  is no longer copied into `AGENTS.md`, because `content/automation.md` is its one authority.
  `README.md`, the wiki, the local indexes and rules, and the agent wiki are corrected.

## Removed

- **Thirteen tools**, listed above under *Consumers must*. Twelve were files; `mcp_list` was
  hand-written. With it go `src/tools/mcp-list.js` and the two modules only it used,
  `src/tools/instruction.js` and `src/content.js`. Sibling-server discovery no longer exists
  here.
- **The `AGENTS.md` override.** `AGENTS.md` is no longer served.
- **The shared-procedure test** that required every creator to carry an identical section.
  That section is not in the new creators, and a self-contained set cannot share text by
  reference.

## Notes for reviewers

- **The contents were written for a plain-files workspace and are now served by an MCP
  server.** `shared_instructions`, `repository`, `mcp_server`, `instruction_creator` and five
  other creators say, in places, that no server serves them, that there is "no second
  instruction set", or that routing lives only in `AGENTS.md`. Their meaning was not changed.
  The full list is in `.agents/memory/tasks/replace-tool-contents.md`, Task 4. It is the
  owner's to resolve.
- **The `automation` read is text, not mechanism.** A read-only server cannot make a client
  call a tool. The description, the `initialize` instructions, `AGENTS.md` and a test that pins
  the wording are all there is, and the test proves the sentences exist, not that anyone
  obeys them.
- **One allowlist entry in the self-containment test.** `anthropic_agent_skills` names
  Anthropic's own `skill-creator` and `mcp-builder` skills, which share a name with two tools
  here. They are facts about another vendor, not pointers.
- **No git tag was created.** A tag is a version carrier and needs its own approval.
- **Three links were already broken on `master` and are left alone**: two in
  `.agents/rules/repository.md` and one in `.agents/index/memory-index.md`.
