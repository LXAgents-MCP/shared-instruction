---
name: server-registry
description: The four instruction and security MCP servers, what each one is for, and which project each fits.
version: 1.0.0
author: LXAgents
---

# Server Registry

Four servers. Each one serves a **set** of instruction files over MCP, read-only, so a
repository connects one instead of copying its text.

**Every repository resolves `lxagents-agents-base`.** The other three are added on top of
it, by project type.

| Server | What it holds | Use it in |
|---|---|---|
| `LXAgents-MCP/shared-instruction` | The org-wide set — branch strategy, commit conventions, task workflow, rules, creators, pull requests | Every repository |
| `LXAgents-MCP/security` | Security review for web stacks — Python, JavaScript/TypeScript, Go | Any repository running a service |
| `RBAgents-MCP/shared-instruction` | Roblox development — Luau, Rojo, package architecture, asset submodules, data stores, auras, naming | Roblox repositories only |
| `RBAgents-MCP/security` | Roblox security — client zero-trust networking, server trust boundaries | Roblox repositories only |

## Choosing one

Read the project, then read this table:

- **Any repository** → `lxagents-agents-base`. Always.
- **A service in Python, JavaScript/TypeScript, or Go** → also
  `LXAgents-MCP/security`. The threat model is a remote client against a server that owns
  state.
- **A Roblox place** → also **both** `RBAgents-MCP` servers. A Roblox repository is never
  only one of them: the development conventions and the security conventions are
  different sets, and neither substitutes for the other.

A Roblox repository therefore resolves three servers. The org set still governs how the
branch is named and how the commit is written; the Roblox set governs what goes in it.

## Cloning

```
https://github.com/LXAgents-MCP/shared-instruction
https://github.com/LXAgents-MCP/security
https://github.com/RBAgents-MCP/shared-instruction
https://github.com/RBAgents-MCP/security
```

Register as a local stdio connector, with `command: node` and `args: ["src/index.js"]`
pointed at the checkout.

## Suggested, not installed

`mcp_list` returns this table and stops there. It does not clone a server, does not write
a configuration file, and does not choose for you. Adding a connector to a repository is
a decision about someone else's project, and it belongs to the person who owns it.

What this server can do is make the choice obvious: a caller reads the scope column and
knows whether the project it is looking at is a Roblox one, a web service, or neither.
