# 0.2.0

**Released:** 2026-08-12

Separates the producer repository's own instruction set from the set it publishes, and
teaches the shared set that the distinction exists.

**Consumers must:** nothing. No `name` was renamed or removed and no consumer-facing
convention changed. The clarification matters only to a repository that *publishes* a
shared set.

## Changed

- `rules/directories.md` — the federation diagram now shows the producer repository
  correctly: `content/` is the published set, `.agents/` is the producer's own local set,
  and the two are not the same thing. Adds a prohibition on repository-specific rules in
  the shared set, alongside the existing one on shared files copied into a consumer.
- `rules/shared-instructions.md` — states that "memory, indexes, wikis and
  `repository.md` are always local" applies to the producer repository too. Producing the
  set is not a licence to keep local rules in it.
- `prompts/agents-setup.md` — Mode A renamed from "Shared" to "Producer", and clarified:
  Mode A means the repository *publishes* the set, not that it lacks a local one. The
  producer is also an ordinary software project and carries `.agents/` like any consumer.

## Fixed

- The earlier description of Mode A implied the producer had no local instruction set.
  That assumption held only for a pure-content repository; `LXAgents/mcp-server` has
  source, tests and a container image, so it needs local rules and memory like any other
  codebase. Following the old wording left repository-specific conventions with nowhere
  to live except the published set.
