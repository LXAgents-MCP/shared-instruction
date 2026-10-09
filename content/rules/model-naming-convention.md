---
name: model-naming-convention
description: Every stored model identifier is {platform}/{model}, lowercase — the format, the normalization, and how to build one for a direct API call.
---

# Model Naming Convention

A stored model identifier is read back by code that does not know which provider wrote
it. `model_name` in `chat_message_embeddings` is the case this rule was written for, and
it applies to every column that records which model produced a row.

The format exists so that one model has exactly one name, whichever route reached it.

## The format

```
{platform}/{model}
```

| Part | Is | Example |
|---|---|---|
| `platform` | The provider the model belongs to | `openai` |
| `/` | A single forward slash, always present | |
| `model` | The provider's own identifier for the model | `text-embedding-3-small` |

So: `openai/text-embedding-3-small`.

**The platform segment is never omitted, including on a direct integration.** A bare
`text-embedding-3-small` is not a shorter spelling of the same thing — it is a second
name for it, and the two do not compare equal.

## Lowercase before it is saved

Every `model_name` is lowercased before it reaches the database. Not on read, not in a
comparison, not in one code path — **before the write**, so the column never holds two
spellings of one model.

`OpenAI/Text-Embedding-3-Small` and `openai/text-embedding-3-small` are the same model
and must never both exist as rows. Normalizing at the write is what makes that true
without a migration later.

## The format is OpenRouter's, deliberately

Nothing here is invented. `{platform}/{model}` is how OpenRouter already addresses a
model, and matching it is the whole point rather than a coincidence:

* **A repository running OpenRouter as its core AI API passes a stored `model_name`
  straight through.** No mapping table, no translation step, no second column recording
  which spelling this row used.
* **A repository calling a provider directly produces the same string** from the values
  it already holds — which is what the construction line below is for.
* **Moving a model between the two is configuration, not migration.** Rows written by a
  direct integration and rows written through the gateway are already the same shape, so
  switching route, or adding a platform, touches no stored data.

Direct API support is therefore not an exception to the convention. It is the case the
convention is built around: one name per model, whichever route reached it, so the route
can change and the data does not have to.

## Direct API integrations

An integration that calls a provider's API directly still stores the same shape as one
routed through OpenRouter. Build the name; do not hard-code it:

```js
model = platform.toLowerCase() + "/" + platform_model.toLowerCase();
```

Constructing it from the two values the integration already holds is what keeps a direct
call and an OpenRouter call agreeing on one string. A literal typed into a direct
integration is the point at which the two routes start disagreeing.

## Why this is a rule and not a preference

* **Cross-provider compatibility.** The section above — a stored name that a gateway and
  a direct integration both accept, so the route is free to change.
* **Collision prevention.** Model identifiers are only unique within a provider. Without
  the platform segment, two providers shipping the same model name are indistinguishable
  once stored.
* **No duplicate variants.** Case is the common way one model becomes several rows.
  Lowercasing at the write is the cheapest place to stop it.

## Checklist

A stored `model_name` complies when all four hold:

1. It contains exactly one `/`.
2. Both segments are non-empty.
3. Every character is lowercase.
4. It was normalized before the write, not after.
