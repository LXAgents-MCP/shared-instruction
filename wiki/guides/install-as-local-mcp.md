# Install as a Local MCP Server

How to run the shared instruction set from a clone on your own disk, instead of reaching
the deployed connector over the network.

The remote connector is still the normal case — see
[Connect a repository](connect-a-repository.md). Use this when it is not the right
answer:

* **The host is cold.** The deployment is on a free tier that spins down when idle, so
  the first request after a pause takes 50+ seconds.
* **You are offline**, or behind a network that will not reach the deployment.
* **Your client cannot add a remote connector**, only a local command.
* **You are working on the instruction set itself** and want your edits live.

## The one rule that makes this safe

**The clone is a runtime, not a copy of the instruction set.**

That distinction is the whole reason this is allowed. `rules/mcp-connector.md` and
`rules/shared-instructions.md` both forbid vendoring the shared set into a repository,
and they still mean it. What you are cloning here is the **server that serves** the set.
Three conditions keep the two apart, and all three are required:

1. **`mcps/` is gitignored.** It never enters your repository's history. A committed
   `./mcps/` *is* a vendored copy, and `check-duplicate-agents-instruction` should flag
   it as one.
2. **Instructions are still read as `agents://` resources**, through the connector.
   Never open `./mcps/LXAgents-MCP/shared-instruction/content/…` by file path — that is
   reading a snapshot, which is exactly the drift the connector exists to remove.
3. **Nothing is copied out of it** into `.agents/`. The adoption rules are unchanged: if
   you can read it from `agents://`, it must not exist in your repository as a file.

Get those wrong and you have not installed a server, you have vendored the set with
extra steps.

## The layout

Clones live under `./mcps/`, one directory per owner, one per repository:

```
./mcps/{org or owner name}/{repo name}/
```

For this repository that is exactly:

```
./mcps/LXAgents-MCP/shared-instruction/
```

The shape is fixed. It is predictable for tooling, it namespaces by owner so two
repositories with the same name do not collide, and it keeps every local MCP server in
one place you can delete in one command.

## 1. Clone it

```bash
mkdir -p ./mcps/LXAgents-MCP
git clone https://github.com/LXAgents-MCP/shared-instruction ./mcps/LXAgents-MCP/shared-instruction
```

## 2. Install and verify

```bash
cd ./mcps/LXAgents-MCP/shared-instruction
npm install
npm test
```

Node 20 or newer. There is no build step. `npm test` should report 66 passing — if the
registry refuses to start, the error names the file and the invariant it broke.

## 3. Ignore it — do this before your next commit

Add to your repository's `.gitignore`:

```gitignore
# Local MCP server clones — runtimes, never vendored content
mcps/
```

This is step 3 of 5 and the one that actually matters. Everything else is convenience;
this is what keeps a runtime from becoming a permanent copy.

## 4. Point your client at it

Register it as a local stdio server. The connector id stays `lxagents-agents-base` —
every consuming repository names it in configuration, so it does not change just because
the transport did.

```json
{
  "mcpServers": {
    "lxagents-agents-base": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "./mcps/LXAgents-MCP/shared-instruction"
    }
  }
}
```

If your client needs an absolute path, give it one — the relative form above is what the
layout is for, but nothing depends on it.

Prefer HTTP? `npm run start:http` serves streamable HTTP on `:3000`, and the connector
URL is `http://localhost:3000/mcp` — **including the `/mcp` path**. Without it the
handshake fails and most clients report that as a sign-in error rather than a wrong
address.

## 5. Paste this into your `AGENTS.md`

Drop this block in as-is. It tells an agent how to bring the set up when the connector is
not already resolving.

```markdown
## Shared Instruction Set — Local Install

The conventions this repository follows live in the shared instruction set served by the
**`lxagents-agents-base`** MCP server. Resolve it before doing any work.

If the connector is already available in this session, use it and ignore the rest of this
block. If it is not, install it locally:

    mkdir -p ./mcps/LXAgents-MCP
    git clone https://github.com/LXAgents-MCP/shared-instruction ./mcps/LXAgents-MCP/shared-instruction
    cd ./mcps/LXAgents-MCP/shared-instruction && npm install

Then register it as a stdio MCP server named `lxagents-agents-base`, with
`command: node`, `args: ["src/index.js"]`, and
`cwd: ./mcps/LXAgents-MCP/shared-instruction`.

**`mcps/` must be in this repository's `.gitignore`.** The clone is a runtime, not
content. It is never committed.

Once it resolves, read `agents://manifest.json` once, then `agents://index/root-index.md`,
and route from there. Address every shared file as `agents://{folder}/{file}.md` — never
by a path into `./mcps/`. Never copy a shared file into this repository: if you can read
it from `agents://`, it must not exist here as a file.
```

## Keeping it current

A clone is a snapshot, so it goes stale — that is the cost you accepted by not using the
deployment.

```bash
cd ./mcps/LXAgents-MCP/shared-instruction && git pull && npm install
```

Then **restart the server**. Content is read once at boot into a frozen registry, so a
`git pull` does nothing to a process that is already running.

Check what you are running against what is published:

```bash
npm run cli -- read versioning-rules   # any file, to confirm the clone answers
cat package.json | grep '"version"'    # against the latest wiki/logs/ entry
```

## Removing it

```bash
rm -rf ./mcps/LXAgents-MCP/shared-instruction
```

Nothing else to undo — that is the point of keeping it out of git. Then add the remote
connector per [Connect a repository](connect-a-repository.md).

## Related pages

- [Connect a repository](connect-a-repository.md) — the normal, remote path.
- [Local setup](../environments/setup.md) — running both modes in detail.
- [MCP surface](../reference/mcp-surface.md) — every prompt, resource, and tool.
