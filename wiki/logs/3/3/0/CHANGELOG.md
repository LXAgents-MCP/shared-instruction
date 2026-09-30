# 3.3.0

**Released:** 2026-09-30

Publishes `content/rules/gate-enforcement.md` — the rule that says a permission gate
written as instruction text is kept by the reading agent's compliance rather than by a
mechanism, and that a repository documenting one has to say which it is. It exists because
`3.2.0` shipped a gate of exactly that kind, and the disclosure lived in a release log a
consumer reads once rather than in the file an agent reads at the moment it matters. The
surface is **34 tools**, was 33.

**Consumers must:** add one row to your `AGENTS.md` declaration block, and — if you
document any permission gate of your own — say which kind it is.

## Added

- **`content/rules/gate-enforcement.md`**, and its row in
  `content/index/instructions-index.md` and its trigger row in
  `content/rules/auto-activation.md`, both in the same commit. `content/` is 33 markdown
  files, was 32; the surface is 34 tools, was 33.

  Two kinds of gate, and they are not the same thing wearing the same word. A
  **mechanical** gate is enforced by the tool refusing, the system prompting, or the
  platform blocking — a test can assert the refusal, and a violation is impossible rather
  than discouraged. A **text-borne** gate is enforced by the agent that read the sentence
  complying — a test can assert the sentence is present, and a violation is possible and
  silent.

  The rule's sharpest claim is about tests: a suite asserting over served text is a **typo
  guard, not a control.** It catches someone softening "do not clone without an explicit
  yes" into "you may wish to confirm first", which is worth catching, and it passes when
  the sentence is intact and the agent clones anyway. No assertion over a file closes that
  gap, because the gap is in the reader. **Do not cite such a suite as a guarantee.**

  It also says a text-borne gate is legitimate — a documented preference that holds for a
  caller following the set — and that naming the mechanism precisely is what lets a
  reviewer judge whether it is sufficient in a given place. An unqualified "permission
  required" does not.

## Changed

- **`test/http.test.js` — four hardcoded tool counts moved from 33 to 34.** They are not
  derived from the tool list, so adding a file to `content/` fails the suite in four places
  before the count is updated. Surfaced and corrected here; recorded in
  `.agents/memory/state/repository-state.md` as the friction cost of pinning the count
  rather than computing it.

## Notes for reviewers

- **This release is a consequence of `3.2.0`, not an independent addition.** The gate added
  there is text-borne, and `3.2.0`'s own changelog said so — but a consumer reading a
  release log once is not the same as an agent reading the registry at the moment it is
  about to clone. That gap is what this file closes.
- **The worked example is the `3.2.0` gate itself**, cited by path, so the rule is
  checkable against a real file in this set rather than abstract.
