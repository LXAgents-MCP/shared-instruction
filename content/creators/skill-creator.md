---
name: skill-creator
description: Creates and maintains the skills tree — writes capability records to .agents/skills/{type}/{file-name}.md, and refuses to install anything it is handed. Use when the user supplies an MCP server, a skill, a plugin, a marketplace, or a clone of one, or asks this workspace to know how an external tool works.
---

# Skill Creator

Writes **records of how external capabilities work** into `.agents/skills/{type}/{file-name}.md`.

It has one hard rule, and it comes first because it decides whether this creator has
anything to do at all.

## The rule this creator exists to enforce

**You never install what you are given. You write it down.**

| What you were handed | What you do |
|---|---|
| An MCP server — repo, zip, or pasted source | Write a page describing it |
| A skill — one `SKILL.md`, or a skills repository | Write a page describing it |
| A plugin, or a plugin marketplace | Write a page describing it |
| A clone already sitting in the workspace | Delete it, then write the page |

The path is always `.agents/skills/{type}/{file-name}.md`. The prohibition is absolute: nothing
handed over is installed, cloned, or vendored.

### Why, in one paragraph

A checkout at a non-git root cannot be versioned, so it drifts silently with no way to see
what changed or roll it back. It brings a dependency tree, a build system, and a license
position this workspace never chose. And it changes what an agent does here from outside
the instruction set — a file nobody reviewed decides behaviour. A written page delivers
the same knowledge as something reviewable, editable, and small enough to update in one
paragraph when upstream moves.

### The boundary is provenance, not usefulness

Something you built in `orgs/{org}/{repo}/` or `Personal/{project}/` is **a project**, and it
belongs there. That folder is a real repository and can carry dependencies. What is
forbidden is a capability sourced from outside this workspace being brought into the
root. Judge by where it came from, not by how useful it is.

### What is already installed is not this rule's business

Claude Code may load plugin skills from your **user-level** configuration. Those live
outside this workspace's root and this rule does not reach them. It governs what
enters the workspace, not what you already have.

## Procedure

1. **Confirm you are recording, not installing.** If the user asked you to install,
   register, or clone something *into this workspace*, say what the rule is in one
   sentence and record it instead. If they genuinely want the repo on their machine, hand
   them the clone command to run on the host, **outside** this workspace's root.
2. **Pick the type.**

   | The capability is a… | Type |
   |---|---|
   | Document or file format | `document/` |
   | Visual or design system | `visual-design/` |
   | API, SDK, protocol, CLI, build tooling | `engineering/` |
   | How to produce the artifact | `authoring/` |
   | Practice, review criteria, known traps | `guidance/` |
   | The specification as published | `reference/` |

   If nothing fits, create the type — lowercase kebab-case, a plain topic noun — and
   register it in the folder tables **and** in the index that owns this scope, together.
3. **Name the file after the subject**, in kebab-case, and put the same word in
   `name`. One subject per file; if the page wants two headings, it is two files.
4. **Write the page** (below).
5. **Link it in.** From the page that referred to the capability, and from the index
   that owns this scope.
6. **Check nothing was installed.** `git status` will not help — the root is not a
   repository. Look at the root listing instead. If a folder appeared that should not
   have, that is the bug to fix.

## Writing the page

**Frontmatter** — `name` and `description`, in the house style used across `.agents/`:

```yaml
---
name: example-capability
description: What the capability is, the limits that actually bind, and what goes wrong
  when they are ignored. Read before using or reviewing anything that depends on it.
---
```

A workspace page is **not** a `SKILL.md` and is never run through Anthropic's
`quick_validate.py`, so the key allowlist that validator enforces does not constrain one. Frontmatter in
`.agents/` is `name` and `description` only — no `version`, no `author` — and the
allowlist applies when writing a real skill for a real installation.

**The body, in this order:**

* **Lead with the answer.** Someone opening this file has a specific question. The first
  paragraph should settle it.
* **The rules that actually bind**, not the ones that sound right. If a limit exists,
  give the value. If a constraint is only sometimes enforced, say so — a rule presented as
  absolute that turns out to be a lint wastes an hour.
* **A table per shape.** Fields, limits, layout, differences. Tables beat prose for
  anything a reader will look up rather than read.
* **A worked example**, in the target format, when the format is fiddly.
* **The why**, once, where it changes what someone would otherwise do.
* **The source**, with the version or commit. Upstream moves, and an undated fact about
  someone else's system is worth little in a year.

**What not to write:**

* Rules about this workspace. Those are instructions (`rules/`) or knowledge
  (`.agents/wiki/`). A skills page describes something that lives *outside* the
  repository. If a page starts saying "always do X", it is in the wrong tree.
* A copy of the thing. Recording a format means writing the rules and showing one example
  — not reproducing the source.
* A placeholder page. A page with no real content is worse than no page: it looks like
  coverage and delivers nothing. If you do not know enough to write something real, say
  so instead of writing something empty.

## What this creator refuses

* Cloning, installing, or vendoring an MCP server, a skill, a plugin, or a marketplace
  into this workspace. Recording one is the whole job.
* Writing an instruction. If the finding is "a rule should say X", propose it to the
  owner; do not write it.
* Writing into `wiki/` or `.agents/wiki/`, or writing memory. Those belong to other
  creators.
* Creating a skill *tree* that installs anything. This tree is documentation. Nothing in
  it is executed, and no row in the instruction tools block routes to it.

## Gating

A skills page asserts nothing about how an agent must behave, so **writing one is not a
rule change and is not gated** — no plan approval, no discovery proposal. That is
different from the never-install rule, which is about what may exist in the workspace
rather than what may be written down.

If recording a capability reveals a **missing rule**, stop: propose it to the owner, do not
write it.
