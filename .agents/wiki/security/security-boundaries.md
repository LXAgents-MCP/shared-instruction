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
| `src/tools/mcp-creator.js` | Every filesystem call still consumes a path from `resolveTarget`, and the MCP caller still passes `root`. A new call site that resolves its own path has removed the chokepoint. |
| `src/transport/http.js` | The body limit, the origin guard, and the session cap are intact, and any new route is behind the same middleware. |
| `src/content/registry.js` or the read path | No filesystem or network I/O was introduced. Reads are in-memory lookups, and that is what stops a read being steered at the disk. |
| `Dockerfile` | `--ignore-scripts` survives, and the runtime stage still ends as `USER node`. |
| A new dependency | It is genuinely needed — [`../../rules/repository.md`](../../rules/repository.md) caps the runtime tree at three and requires a recorded decision for a fourth. Each one is transitive attack surface. |
| Any config default | Loosening a default is a posture change affecting every deployment, not a convenience. Raise it rather than take it. |

## C. What to escalate rather than decide

Ask the user; do not resolve these on your own initiative.

* **Making any served content non-public.** Authentication becomes a prerequisite of that
  change, not a follow-up, and the change is bigger than it looks.
* **Loosening a guard to make something work** — widening `resolveTarget`, raising the
  body limit, disabling the origin guard to get past a local error. The guard is the
  feature; a test that needs it off is a test to rewrite.
* **A finding in content already published.** It reaches every consumer on their next
  read, so the fix is a release with an explicit *Consumers must* line, and
  [`versioning.md`](../../../content/rules/versioning.md) gates the version.
* **Anything that would put a credential in this repository.** There are none today, and
  the first one is a decision, not a commit.

## D. What is not a security finding here

Named because each one has cost a round of investigation before:

* **A 50+ second first response.** Render's free tier spins down when idle. Cold start,
  not denial of service.
* **A sign-in error when connecting the connector.** Almost always a URL missing the
  `/mcp` path — [`mcp-connector.md`](../../../content/rules/mcp-connector.md).
* **The endpoint being unauthenticated.** Deliberate, and reasoned through in the human
  page. Re-raising it as a vulnerability is not a finding; proposing to publish something
  confidential through it would be.
