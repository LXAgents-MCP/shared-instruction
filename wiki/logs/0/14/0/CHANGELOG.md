# 0.14.0

**Released:** 2026-09-01

Adds `creators/security-creator.md` and makes `security/` a folder the connector actually
serves. Before this release a file at `content/security/` was not rejected — it was never
collected, and nothing said so.

**Consumers must:** add one row to your `AGENTS.md` trigger table, after the "Write
documentation" row, mirroring the new row in `rules/auto-activation.md`:

```
| Write or change a security file — a policy, a threat model, or a security SOP | {shared}/creators/security-creator.md |
```

Nothing was renamed or removed and no existing row changed, so no override needs dropping.
If you have security pages already, `security-creator.md` §A tells you which of the three
places each belongs in; nothing forces you to move them today.

## Fixed

- **`content/security/` was declared but unservable.** `rules/directories.md` §B has listed
  `security/` as a shared instruction folder since the placement authority was written, but
  `INSTRUCTION_FOLDERS` in the server did not include it, and `collectPaths` walks that list
  and nothing else. A file placed there was absent from `agents://manifest.json`, absent
  from every resource, and absent from every test — **no error, no warning, no failing
  build**. `security/` is now served.

- **`rules/directories.md` §B did not say a shared folder must also be served.** It now
  does, naming the seven folders the connector walks and stating that a shared file outside
  them is never collected rather than rejected. Local folders under `{repo}/.agents/` are
  unaffected, since nothing serves them.

  **This gap is wider than security.** §B lists 21 instruction folders; 7 are served. The
  other 14 — `ethics/`, `compliance/`, `testing/`, `api/`, and the rest — still fail
  silently if used in the shared set. Closing that is a separate change to the published
  surface and was deliberately not bundled here.

## Added

- **`creators/security-creator.md`** — the sixth creator, and the first organized by
  subject rather than by artifact kind.

  **§A routes to three destinations, not two**, because security has an extra way to go
  wrong: universal policy to `{shared}/security/`, this repository's threat model to
  `{repo}/wiki/security/`, the agent procedure to `{repo}/.agents/wiki/security/`. A local
  threat model published to the shared set tells every repository that your attack surface
  is theirs — and security guidance is obeyed rather than evaluated, so it gets applied
  where it does not fit.

  **A security context never crosses repositories.** A conclusion learned in one is
  re-derived in the next, never copied.

  **§B: one concern per file.** Two concerns that are both security are two files. A second
  surface for a concern already documented is a row in that file's table.

  **§C fixes one structure** — Overview, `In this project`, `Surfaces`, `Verifying`,
  `Escalate, do not decide`, `Not a finding here`, `Open`, `Summary — with a table naming
  the failure each section prevents. `Exposure` and `Guard` are separate columns so a
  surface with **no** guard stays visible instead of dissolving into prose. An `Open`
  section may never read "none known"; it is deleted instead.

  **§D: write from the code, never from memory.** Added because writing `0.13.0`'s security
  pages turned up a default that contradicted what the surrounding code implied. A
  remembered guard and an assumed default both read exactly like knowledge.

- `security/` in the shared instructions index and root index, with the folder marked
  served-but-empty. No universal security policy ships in this release.

## Notes for this repository

- **A test caught the thing a careful reading would have missed.** `registry: the
  discovery-protocol block is byte-identical in every copy` failed at `6 !== 5` the moment
  the sixth creator landed. `rules/discovery-protocol.md` §F owns the bounded list of files
  that reproduce the gate block; a new creator carrying the block without being added to
  that list leaves the authority wrong while every copy stays right. §F now names
  `security-creator.md`.
- **Two mutation-proven tests** on the folder change. Removing `security` from
  `INSTRUCTION_FOLDERS` takes the suite from 86 to 84. The first builds a **fixture**
  content directory rather than reading the shipped set — deliberate, because this release
  adds no file under `content/security/`, so a test against the real set would find nothing
  and pass either way.
- **27 → 28 instruction resources**, updated by hand in `README.md`,
  `wiki/information/overview.md`, `wiki/reference/mcp-surface.md`, and the state file. The
  connector's own count needed nothing: `src/server/create-server.js` builds it from
  `registry.size`. That is the shape `.agents/rules/repository.md` asks for, and the reason
  that particular mirror has never gone stale.
- 86 tests, up from 84, all passing.
