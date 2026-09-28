import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** The repository root, resolved from this file rather than from cwd. */
export const ROOT = join(here, "..");

/**
 * The published set. Every served file is read from inside this directory and
 * nowhere else, so containment is a property of the constant rather than of
 * what a caller passed in.
 */
export const CONTENT_DIR = join(ROOT, "content");

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

export const VERSION = pkg.version;
export const SERVER_NAME = "lxagents-agents-base";
