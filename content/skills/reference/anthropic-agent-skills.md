---
name: anthropic-agent-skills
description: How Anthropic's Agent Skills format works — the frontmatter fields a skill may and may not carry, the naming and length limits, the on-disk layout, and how a skill actually gets triggered. Read before writing or reviewing any SKILL.md.
---

# Anthropic Agent Skills

The format Claude Code and Claude Desktop use for installed capabilities. This page
records what the format actually is, so a skill can be written correctly without the
upstream repository being present.

Upstream: <https://github.com/anthropics/skills> — 19 skills, plus a specification at
<https://agentskills.io/specification>.

## The rules that actually bind

The prose documentation drifts. `skills/skill-creator/scripts/quick_validate.py` is what
enforces, and it is short enough to read in full. Every limit below comes from that
script, not from a description of it.

### Frontmatter may contain exactly six keys

```python
ALLOWED_PROPERTIES = {
    'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'
}
```

Any other top-level key is a hard failure, and the validator names it:

```
Unexpected key(s) in SKILL.md frontmatter: author, version.
Allowed properties are: allowed-tools, compatibility, description, license, metadata, name
```

This is the rule people get wrong most often. A skill that looks reasonable — with
`version:` and `author:` in the header — does not validate. Note that this validator
enforces the **upstream** format, and a workspace page here is not a `SKILL.md` and is
never run through this script. See [This workspace's layout](#this-workspaces-layout)
below.

`metadata` is the escape hatch. Anything you genuinely need to record that has no
allowed key — an upstream URL, a commit, a version — goes inside it, where the check
ignores nested keys.

### `name`

Required, a string, and the single most failure-prone field.

| Rule | Value |
|---|---|
| Pattern | `^[a-z0-9-]+$` — lowercase letters, digits, hyphens. Nothing else. |
| Leading `-` | Rejected |
| Trailing `-` | Rejected |
| Consecutive `--` | Rejected |
| Maximum | 64 characters |

`skill-creator` passes. `Skill-Creator`, `skill_creator`, `skill creator`, and
`skill--creator` all fail. So does any name over 64 characters.

### `description`

Required, a string, and the **only** mechanism that triggers the skill. Claude does not
read the body to decide whether a skill applies — it reads the description, decides, and
only then loads the file.

| Rule | Value |
|---|---|
| Angle brackets | Rejected — no `<` or `>` anywhere in the text |
| Maximum | 1024 characters |

The angle-bracket ban is a prompt-injection guard: a description is fed to the model's
context, and `<`/`>` are how tool-call syntax is smuggled in. When a description
genuinely needs to name a tag or an element, write the words instead of the brackets.

The consequence for authoring is that **every "when to use this" sentence belongs in the
description.** A "Use when…" section in the body is too late — by the time the body is
read, the decision has already been made. Look at how upstream does it:

```yaml
description: Create new skills, modify and improve existing skills, and measure skill
  performance. Use when users want to create a skill from scratch, edit, or optimize an
  existing skill, run evals to test a skill, benchmark skill performance with variance
  analysis, or optimize a skill's description for better triggering accuracy.
```

Three kinds of information packed into one field: what it does, and an exhaustive list of
the situations that should fire it. That enumeration is doing the work — it is what makes
the trigger reliable.

### `compatibility`

Optional, a string, maximum 500 characters. Everything else about it is unconstrained by
the validator.

### `license`

Optional and unchecked — present in the allowlist, no type or length check.

### `allowed-tools` and `metadata`

Optional and unchecked beyond the allowlist. `allowed-tools` is a list of tool names the
skill may use; `metadata` takes arbitrary nested keys.

## Layout on disk

Upstream, a skill is a **directory** named after the skill, with `SKILL.md` at its root:

```
{skill-name}/
  SKILL.md          required — frontmatter plus body
  scripts/          executable code the skill runs
  references/       documentation loaded on demand
  assets/           files used in the output, not read
  agents/           subagent definitions
  LICENSE.txt       optional
```

The four optional folders are the interesting part. Progressive disclosure is the design:
`SKILL.md` stays small, and the heavy material lives in a file that is only opened when
the task actually needs it. A 2,000-line reference document in the body is loaded on
every trigger whether it is needed or not.

Inside the repository, the marketplace is declared in
`.claude-plugin/marketplace.json`, which groups skills into named plugins:

```json
{
  "name": "anthropic-agent-skills",
  "plugins": [
    {
      "name": "document-skills",
      "description": "Collection of document processing suite including Excel, Word, PowerPoint, and PDF capabilities",
      "source": "./",
      "strict": false,
      "skills": ["./skills/xlsx", "./skills/docx", "./skills/pptx", "./skills/pdf"]
    }
  ]
}
```

It is a **plugin marketplace, not an MCP server.** There is nothing to put in
`claude_desktop_config.json`; installation is `/plugin marketplace add <path>` followed
by `/plugin install <plugin>@anthropic-agent-skills` from inside Claude Code. Confusing
the two is the most common mistake people make with this repository.

## How a skill is discovered

Not by a router table. There is no manifest that says "use this skill when X."

1. A plugin makes skills available, and each `SKILL.md` is parsed.
2. Its `name` and `description` go into the model's context.
3. When the user says something the description covers, Claude reads that skill's body.
4. The body then drives the work, and the skill may read from its own `references/` and
   run its own `scripts/` as needed.

Step 3 is a model judgement, not a lookup. That is why the description is the only
trigger mechanism, and why a vague description produces a skill that is installed and
never fires.

## The 19 upstream skills

19 skills, grouped into the five plugins the marketplace declares:

| Plugin | Skills |
|---|---|
| `document-skills` (4) | `xlsx`, `docx`, `pptx`, `pdf` |
| `example-skills` (12) | `skill-creator`, `mcp-builder`, `frontend-design`, `canvas-design`, `algorithmic-art`, `brand-guidelines`, `doc-coauthoring`, `internal-comms`, `slack-gif-creator`, `theme-factory`, `web-artifacts-builder`, `webapp-testing` |
| `claude-api` (1) | `claude-api` |
| `academy-guide` (1) | `academy-guide` |
| `discernment-nudge` (1) | `discernment-nudge` |

All 19 are declared and all 19 are present. `discernment-nudge` is a plugin of its own
with a single skill.

**One of them fails its own validator.** Running
`skills/skill-creator/scripts/quick_validate.py` over the repository as it stands:

| Skill | Result |
|---|---|
| 18 of 19 — including `skill-creator`, `docx`, `xlsx`, `pptx`, `pdf`, `mcp-builder` | `Skill is valid!` |
| `claude-api` | **`Description is too long (1068 characters). Maximum is 1024 characters.`** |

So the 1024-character limit is not a theoretical constraint — a shipped Anthropic skill
exceeds it by 44 characters, and the plugin still installs, because nothing runs this
script at install time. **The validator is a lint, not a gate.** Write to it anyway; just
do not assume passing is what makes a skill load.

`skill-creator` is the one to read first if you are writing a skill — it is the format's
own worked example, and it carries an eval harness (`scripts/run_eval.py`,
`run_loop.py`, `aggregate_benchmark.py`) for measuring whether a description triggers
reliably.

## This workspace's layout

Deliberately different, and not a mistake.

| | Upstream | `.agents/skills/` |
|---|---|---|
| Path | `{skill-name}/SKILL.md` | `{type}/{file-name}.md` |
| Depth | directory + fixed filename | one level, no directory per subject |
| Trigger | Claude auto-loads and self-selects | an agent reads it when a rule says to |
| Frontmatter | the six allowed keys only | `name` + `description`, in the house style |
| Capability gained | real — the skill runs | none — it is a written record |

Two reasons for the divergence:

**Flat, to match house style.** Every other tree here is `.agents/{tree}/{type}/{file}.md`.
A directory per skill would be the only place in the workspace shaped differently, for no
gain — these files are documentation, and documentation does not need a directory to
justify itself.

**Not auto-loaded, and that is fine.** Claude loads installed skills from `.claude/skills/`
or a plugin marketplace, not from `.agents/`. A page here is reached because a rule points
at it, the same as every other file in `.agents/`. In exchange, nothing in this tree can
change what an agent does without going through a rule someone can read and edit.

**The consequence to keep in mind:** a page in `.agents/skills/` is *not* valid against
`quick_validate.py` and is never checked against it. The six-key allowlist applies when
writing a real `SKILL.md` for a real installation. A workspace page here carries
`name` and `description` and nothing else — the validator's rejection of `version:` and
`author:` is not a conflict to work around, it is the same answer this tree already
gives.

## Writing one

* One subject per file, and the filename is the subject in kebab-case.
* Frontmatter `name` and `description`, matching the file's subject.
* The description says what the capability **is** and **when it applies** — that is the
  whole trigger mechanism.
* Lead with the answer. A reader who opens this file has a specific question.
* Cite the source for anything factual about an external format, and say which version
  it was read from. Upstream moves.
* Link to it from the page that referred to the capability, so it is reachable.

The procedure is [`../../creators/skill-creator.md`](../../creators/skill-creator.md).
