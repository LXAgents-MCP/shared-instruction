# 0.11.0

**Released:** 2026-08-28

Publishes the model naming convention — every stored model identifier is
`{platform}/{model}`, lowercased before the write — and adds two read-only tools that
serve it: `model_naming_convention` returns the rule, `model_name_format` builds a
compliant name.

**Consumers must:** add one trigger row to your `AGENTS.md` —
`| Store, read, or construct a model identifier — any model_name column |
{shared}/rules/model-naming-convention.md |`, placed after the "Record a release" row so
your table still mirrors `rules/auto-activation.md` in order. Then read the new rule
before writing to any `model_name` column. No file was renamed, no `name` changed, no rule
was removed, and no existing row moved, so no override needs dropping.

## Added

- `rules/model-naming-convention.md` — the format, the normalization, and the construction
  line for a direct API integration.

  ```
  {platform}/{model}          e.g. openai/text-embedding-3-small
  model = platform.toLowerCase() + "/" + platform_model.toLowerCase();
  ```

  Written for `model_name` in `chat_message_embeddings` and applying to every column that
  records which model produced a row. Three things it makes non-negotiable: the platform
  segment is never omitted, including on a direct integration; the value is lowercased
  **before the write**, not on read; and a direct call builds the name from the two values
  it already holds rather than hard-coding a literal.

  The point is cross-provider compatibility. A gateway such as OpenRouter already addresses
  models as `{platform}/{model}`, so storing that shape means a repository can move a model
  behind a gateway, or out from behind one, without rewriting stored rows — and two
  providers shipping the same model name stay distinguishable once stored.

  The rule ends in a four-point checklist, because a convention a reader cannot check
  against is a preference.

- Two read-only tools on `lxagents-agents-base`.

  | Tool | Args | Returns |
  |---|---|---|
  | `model_naming_convention` | none | The rule, whole, read from the registry. |
  | `model_name_format` | `platform`, `platform_model` | `{ model_name, platform, model, normalized }`. |

  `model_name_format` is the first read-only tool here that computes rather than returning
  text. It exists because a convention an integration can only *read* is re-implemented at
  every call site, and the re-implementations are where a direct API call and a gateway
  call stop agreeing on one string. It refuses a blank segment, and refuses a
  `platform_model` that already carries its platform prefix — composing that silently would
  store `openai/openai/text-embedding-3-small`, a name nothing downstream can compare.

## Changed

- `rules/mcp-connector.md` — two rows in the published surface table. The table is what a
  consuming repository reads to learn what the connector offers, and `0.6.1` exists because
  it once went a release out of date.
- `wiki/reference/mcp-surface.md`, `wiki/information/overview.md`, `README.md` — the tool
  and resource counts, and a section on the two tools. Not published; corrected in the same
  round so no count outlives the release that changed it.
- `test/tools.test.js` — the read-only sweep now covers every tool except `mcp_creator`,
  rather than only names beginning with `agents_`. A new tool has to declare itself a
  writer deliberately; it can no longer become one by being named outside the prefix.

## Notes for this repository

- **The tools hold no rule text.** `buildModelNamingPayload` reads
  `agents://rules/model-naming-convention.md` through `requireEntry`, exactly as the setup
  and audit payloads read theirs, so `.agents/rules/set-mirrors.md` gains no new row. That
  was the constraint the design was chosen for: `src/tools/mcp-creator.js` is in the mirror
  table because it hard-codes set text, and it has drifted because of it.
- **The rule and its implementation are pinned to each other.** One test asserts the
  payload ends with the registry entry's own text; another runs the rule's four-point
  checklist against `model_name_format`'s output across three inputs. Either one fails if
  the published rule and the code disagree.
- `src/tools/model-name.js` is a pure function — no I/O, no clock — which is what makes
  `readOnlyHint` and `idempotentHint` on that tool facts rather than claims.
- **No CLI command was added.** `lxagents-agents read model-naming-convention` already
  serves the rule from the same registry, and `cli.test.js` pins CLI/MCP parity for the
  payloads both surfaces deliver, not for every tool. A `format` command would be new
  surface rather than parity, so it was raised as an option and not taken.
- 76 tests, up from 69, all passing. The four boot invariants in `content-publishing.md`
  were enforced throughout: the new file's description is 139 of the 140 permitted
  characters.
