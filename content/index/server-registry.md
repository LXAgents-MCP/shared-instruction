---
name: server-registry
description: The sibling instruction and security MCP servers, what each is for, where they are published, and the selection and permission gate to follow before adding one.
version: 1.1.0
author: LXAgents
---

# Server Registry

Three servers. Each one serves a **set** of instruction files over MCP, read-only, so a
repository connects one instead of copying its text.

**You are already connected to this one.** The server reading you this page is
`lxagents-shared-instruction` — the org-wide set. It is not listed below, because you do not
install the server you are already talking to. What follows is what you may *add*.

| Server | What it holds | Use it in |
|---|---|---|
| `LXAgents-MCP/security` | Security review for web stacks — Python, JavaScript/TypeScript, Go | Any repository running a service |
| `RBAgents-MCP/shared-instruction` | Roblox development — Luau, Rojo, package architecture, asset submodules, data stores, auras, naming | Roblox repositories only |
| `RBAgents-MCP/security` | Roblox security — client zero-trust networking, server trust boundaries | Roblox repositories only |

## Where these servers are published

Every server above is published to both GitHub and GitLab, under one of three
organisations:

| Organisation | GitHub | GitLab |
|---|---|---|
| LXAgents-MCP | `https://github.com/LXAgents-MCP` | `https://gitlab.com/LXAgents-MCP` |
| RBAgents-MCP | `https://github.com/RBAgents-MCP` | `https://gitlab.com/RBAgents-MCP` |
| MCAgents-MCP | `https://github.com/MCAgents-MCP` | `https://gitlab.com/MCAgents-MCP` |

The table above is the servers that exist today. The organisations may hold more, and this
file does not claim to be a complete index of them — the organisation pages are.

## Choosing one

Read the project, then read this table:

- **Any repository** → nothing to add. You already have the org set; that is the
  baseline every repository resolves.
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
https://github.com/LXAgents-MCP/security
https://github.com/RBAgents-MCP/shared-instruction
https://github.com/RBAgents-MCP/security
```

Register as a local stdio connector, with `command: node` and `args: ["src/index.js"]`
pointed at the checkout.

A clone is for a server you are **adding**. Cloning this one into a repository that
already resolves it vendors the set, which is the drift the connector exists to prevent —
see [`../AGENTS.md`](../AGENTS.md).

## Before you add anything

This list is a menu, not a set of instructions. Adding a server to someone's repository is
their decision, and this server does not make it: it does not clone, does not write a
configuration file, and does not choose for you.

1. **Report the whole list to the user first.** Every server in the table above, with what
   it holds and which project it fits. Do not pre-select, do not filter, and do not
   recommend one and then act on that recommendation.
2. **Ask the user which they want.** Wait for the answer. If they do not pick, add nothing.
3. **Ask again before cloning.** For each server the user chose, ask explicitly whether to
   clone it and register it as a connector. Do not clone, write a config file, or register
   a connector without an explicit yes.

**Silence is not permission**, and neither is a request that happened to name a server. A
user asking "add the Roblox servers" has told you *which*; it has not told you to clone.
Those are two separate gates, and the second is the one that writes to their disk.

Permission already given — for this task or as a standing instruction — is that yes. Do
not ask twice.

What this server can do is make the choice obvious: a caller reads the scope column and
knows whether the project it is looking at is a Roblox one, a web service, or neither.
