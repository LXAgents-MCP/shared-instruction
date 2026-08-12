# 0.0.0

**Released:** 2026-08-12

First release. The LXAgents shared agent instruction set, delivered over MCP as
`lxagents-agents-base` so a repository consumes it through a connector instead of
cloning it.

**Consumers must:** nothing. This is the initial set.

## Added

### Instruction set (`content/`, served under `agents://`)

- `AGENTS.md` — the federation contract: the consumer contract, adoption checklist,
  shared/local split, override semantics, and how to change the set.
- `rules/directories.md` — the placement authority: four trees, the two-wiki audience
  test, the federation split, and the placement algorithm.
- `rules/shared-instructions.md` — resolution, precedence, override semantics,
  promotion, and adoption.
- `rules/auto-activation.md` — the trigger table and precedence order.
- `rules/mcp-connector.md` — resolving the set through the connector, with the
  bootstrap block consuming repositories carry.
- `rules/duplicate-instruction-audit.md` — the on-request-only audit that finds and
  removes instructions a repository duplicates from this set.
- `rules/discovery-protocol.md` — propose rules, never self-apply them; the canonical
  block and every place it is copied.
- `rules/no-session-links.md` — never record an assistant or tool session link.
- `rules/memory-policy.md` — what may be written to memory, and how.
- `rules/versioning.md` — never bump a version unasked.
- `git/branching-strategy.md`, `git/commit-conventions.md`,
  `git/pull-request-template.md`.
- `planning/task-workflow.md` — intake, decomposition, stacked branches, in-order
  execution, merging.
- `prompts/agents-setup.md`, `prompts/branch-and-commit.md`.
- The five creators: instruction, information, index, memory, changelog.
- `index/root-index.md`, `index/instructions-index.md`, `index/logs-index.md`.

### Server (`src/`)

- Content registry loading the set once at boot into a frozen structure, with a sha256
  per normalized body; boot fails on missing frontmatter or a duplicate `name`.
- MCP server factory building one instance per session.
- 24 instruction resources plus `agents://manifest.json`.
- Prompts `agents-setup` and `check-duplicate-agents-instruction`.
- stdio transport for local use.
- Streamable HTTP transport in stateless and stateful modes, with a bounded, reaped
  session store, health and readiness endpoints, and origin/host guarding.
- Optional cluster workers for multi-core parallelism.
- Graceful shutdown closing sessions before the HTTP server.

### Project

- `Dockerfile`, `.dockerignore`, and `compose.yaml`.
- MIT `LICENSE` for LXAgents, 2026.
- Test suites for the registry, MCP surface, HTTP transport, concurrency, and manifest
  hashes.
- `wiki/` documentation and this repository's `AGENTS.md`.
