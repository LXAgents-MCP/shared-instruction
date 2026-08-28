/**
 * Building a stored model identifier.
 *
 * This module is the executable half of
 * `agents://rules/model-naming-convention.md`. A convention an integration can
 * only read has to be re-implemented at every call site, and those
 * re-implementations are exactly where a direct API call and a gateway call
 * stop agreeing on one string.
 *
 * Nothing here restates the rule — it applies it. The text stays in the
 * registry, for the reason `.agents/rules/set-mirrors.md` gives: a hard-coded
 * copy is a new mirror to maintain.
 */

/** Raised for input the caller can fix, rather than an internal fault. */
export class ModelNameError extends Error {}

const SEPARATOR = '/';

/** Trims and lowercases one segment, refusing a blank. */
function toSegment(label, value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    throw new ModelNameError(`${label} is required and cannot be blank.`);
  }
  return trimmed.toLowerCase();
}

/**
 * Composes `{platform}/{model}`, lowercased.
 *
 * Both segments are rejected when they carry their own separator. That is not
 * pedantry: passing a platform-prefixed model id alongside a platform is how
 * `openai/openai/text-embedding-3-small` gets written, and a stored name nobody
 * can compare is the failure the convention exists to prevent.
 *
 * @param {{ platform: string, platformModel: string }} input
 * @returns {Readonly<{ modelName: string, platform: string, model: string, normalized: boolean }>}
 */
export function formatModelName({ platform, platformModel }) {
  const platformSegment = toSegment('platform', platform);
  const modelSegment = toSegment('platform_model', platformModel);

  if (platformSegment.includes(SEPARATOR)) {
    throw new ModelNameError(
      `platform "${platform}" contains "${SEPARATOR}". The platform is one segment — pass the provider alone, such as "openai".`,
    );
  }

  if (modelSegment.includes(SEPARATOR)) {
    const prefix = `${platformSegment}${SEPARATOR}`;
    throw new ModelNameError(
      modelSegment.startsWith(prefix)
        ? `platform_model "${platformModel}" already carries the "${prefix}" prefix. Pass the model segment alone ("${modelSegment.slice(prefix.length)}"), or store the name you already have.`
        : `platform_model "${platformModel}" contains "${SEPARATOR}". The format is {platform}/{model} with one separator — pass the provider's own identifier alone.`,
    );
  }

  const modelName = `${platformSegment}${SEPARATOR}${modelSegment}`;

  return Object.freeze({
    modelName,
    platform: platformSegment,
    model: modelSegment,
    /** True when trimming or lowercasing changed what the caller passed. */
    normalized: modelName !== `${String(platform)}${SEPARATOR}${String(platformModel)}`,
  });
}
