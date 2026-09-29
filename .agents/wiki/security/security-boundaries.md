---
name: security-boundaries
description: The security SOP for this repository — the isolation rule that keeps repositories from sharing a security context, and the checks each surface needs.
---

# Security Boundaries

The agent-facing half of this repository's security posture. The facts — attack surface,
deployment, what is and is not a secret — live once, in
[`../../../wiki/security/security-model.md`](../../../wiki/security/security-model.md).
Read that first. This page carries only what an agent must *do*, and the one rule that
exists because agents work across repositories and people mostly do not.

## A. The isolation rule

**A security context belongs to exactly one repository. Never carry one across.**

This is not a style preference. Security conclusions are the ones that look most
transferable and travel worst: "the path check is handled upstream", "auth is enforced at
the gateway", "that input is already validated", "secrets come from the vault here". Each
of those may be true where you learned it and false here, and the failure mode is silent —
you skip a check because you remember it being unnecessary somewhere else.

In practice, in a session that touches more than one repository:

* **State which repository a security claim is about, every time.** An unqualified claim
  is the one that migrates.
* **Never apply a mitigation from another repository without re-deriving it here.** The
  guard may belong somewhere else in this codebase, or be unnecessary, or be insufficient.
* **Never copy a threat model, a checklist, or a security page between repositories.** If
  the content is genuinely universal it is a shared-set proposal under
  [`discovery-protocol.md`](../../../content/rules/discovery-protocol.md), not a copy —
  and copies are what
  [`directories.md`](../../../content/rules/directories.md) forbids anyway.
* **Never assume this repository's posture applies outward.** This one has no
  authentication and no secrets *by design*. Carrying "there is nothing to protect here"
  into a repository that holds credentials is the worst version of this mistake, and it is
  the easy one to make, because it feels like context rather than a claim.

The trigger row in [`AGENTS.md`](../../../AGENTS.md) loads this page on security,
authentication, and deployment work so the rule is in front of you *before* the reasoning
that would violate it, not after.

## B. Before you change these, check this

| About to touch… | Verify before committing |
|---|---|
| Anything under `content/` | It cannot direct another repository's agent to run a command, weaken a convention, or skip a permission gate. This is the highest-reach change in the repository — see the trust boundary in the human page. |
| A tool's shape in `src/tools/from-content.js` | It still takes **no argument**. A path parameter is the single change that would reopen traversal, and it is the one to argue against hardest. |
| `src/content.js` or the read path | No filesystem or network I/O was introduced. Reads are in-memory lookups, and that is what stops a read being steered at the disk. |
| `Dockerfile` | `--ignore-scripts` survives, the runtime stage still ends as `USER node`, and any `EXPOSE` still matches the port the entrypoint actually binds. Either of the first two dropped turns a pinned, non-root image into one that runs install hooks as root. |
| `src/http.js`, or anything touching a transport | `MCP_ALLOWED_HOSTS` still defaults to unset rather than to a permissive list, sessions are still deleted when their stream closes, and no `McpServer` is shared between them. |
| A new dependency | It is genuinely needed — [`../../rules/repository.md`](../../rules/repository.md) names the three in the runtime tree and requires a recorded decision for a fourth. Each one is transitive attack surface. |
| Any config default | Loosening a default is a posture change affecting every consumer, not a convenience. Raise it rather than take it. |

## C. What to escalate rather than decide

Ask the user; do not resolve these on your own initiative.

* **A client configured with a URL that this server did not expect to serve.** An earlier
  revision of this page listed that case under *What is **not** a security finding here*,
  on the grounds that no HTTP transport existed and a URL pointed at nothing. That is no
  longer true, and leaving the entry would have told you to **dismiss** the first thing
  worth investigating whenever a connector is misconfigured — an anti-detection rule
  rather than a convenience. A URL that reaches an unexpected endpoint, a client pointed
  at someone else's host, or a connector that resolves where you did not configure it is
  now a finding: stop and say so.
* **Making any served content non-public.** Authentication becomes a prerequisite of that
  change, not a follow-up, and the change is bigger than it looks. Note that the HTTP
  transport made this a live question rather than a structural impossibility — the content
  can now be served selectively to a network, which it previously could not.
* **Deploying the HTTP transport on a routable interface without `MCP_ALLOWED_HOSTS`.** The
  allow-list is off unless set, and the previous implementation's equivalent guard also
  defaulted to off — see `activation-security.md`. Turning it on is the decision; taking
  it on is a posture change affecting every deployment.
* **Loosening a guard to make something work** — adding a `path` argument to a tool,
  widening `isSafeRelativePath`, or relaxing a boot-time throw to get past a failing
  checkout. The guard is the feature; a test that needs it off is a test to rewrite.
* **A finding in content already published.** It reaches every consumer on their next
  read, so the fix is a release with an explicit *Consumers must* line, and
  [`versioning.md`](../../../content/rules/versioning.md) gates the version.
* **Anything that would put a credential in this repository.** There are none today, and
  the first one is a decision, not a commit.

## D. What is not a security finding here

Named because each one has cost a round of investigation before:

* **A registered server that reports healthy but has no tools.** The client loads its
  connector list at session start, so a server added mid-session is absent until the
  session restarts. A stale session, not a broken or hijacked server.
* **The process exiting at boot with a frontmatter or name-collision error.** Failing at
  boot is the design: the alternative is serving a set that is quietly wrong. The message
  names the file and the invariant it broke.
* **An edit to `content/` not appearing in a running server.** The set is read once at
  boot. Restart, do not go looking for a cache to invalidate.
* **There being no authentication.** Deliberate, and reasoned through in the human page.
  Re-raising it as a vulnerability is not a finding; proposing to publish something
  confidential through it would be.
