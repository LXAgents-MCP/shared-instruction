---
name: project-wiki-index
description: Index of the human documentation in wiki/ — what this server is, how it is built, and how to run it.
---

# Project Wiki Index

**Scope:** `wiki/` (except `logs/`)
**Parent:** [`root-index.md`](root-index.md)

Plain markdown, no frontmatter, written for people. Any page added or removed is
reflected here in the same commit.

## information/

| File | Purpose |
|---|---|
| [`../../wiki/information/overview.md`](../../wiki/information/overview.md) | What the server delivers, why it is served rather than cloned, why prompts rather than tools. |
| [`../../wiki/information/architecture.md`](../../wiki/information/architecture.md) | The frozen registry, one server per client, both transports, parallelism, shutdown. |

## reference/

| File | Purpose |
|---|---|
| [`../../wiki/reference/mcp-surface.md`](../../wiki/reference/mcp-surface.md) | Every prompt, resource, tool, HTTP endpoint, and error response. |

## environments/

| File | Purpose |
|---|---|
| [`../../wiki/environments/setup.md`](../../wiki/environments/setup.md) | Installing, running, and testing both modes — CLI and MCP server. |
| [`../../wiki/environments/env.md`](../../wiki/environments/env.md) | Every environment variable. |
| [`../../wiki/environments/docker.md`](../../wiki/environments/docker.md) | Container image, compose, and scaling. |

## guides/

| File | Purpose |
|---|---|
| [`../../wiki/guides/connect-a-repository.md`](../../wiki/guides/connect-a-repository.md) | Putting a repository onto the shared set, including one that already has instructions. |
| [`../../wiki/guides/install-as-local-mcp.md`](../../wiki/guides/install-as-local-mcp.md) | Running the set from a clone under `./mcps/{owner}/{repo}/` when the deployed connector is not the right answer. |

## Child Indexes

| Index | Scope | Load when |
|---|---|---|
| [`logs-index.md`](logs-index.md) | `wiki/logs/` | You need release history or must record a release. |
