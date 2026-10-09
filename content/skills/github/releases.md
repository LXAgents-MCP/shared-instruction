---
name: github-releases
description: Cutting and inspecting GitHub releases with the gh CLI — tags, drafts, prereleases, and generated assets.
---

# GitHub releases

## Cutting one

    gh release create v1.2.0 --title "v1.2.0" --generate-notes
    gh release create v1.2.0 ./dist/*.zip --notes-from-tag

**A release requires the tag to exist** — on the remote, not locally. If the tag is not
pushed, the release points at nothing. Push first.

    git tag -a v1.2.0 -m "v1.2.0"
    git push origin v1.2.0

**`--generate-notes`** builds the notes from merged PRs and commits since the last release.
It needs the tag to be on the remote and the previous release to be findable — without one,
the notes span the repository's entire history, which is noise rather than a changelog.

**`--notes-from-tag`** uses the annotated tag's message. `--notes-file` reads from a file;
`--notes` from a string. Prefer the file for anything long — same quoting problem as issue
bodies.

## Drafts and prereleases

Two independent flags, and the difference matters:

* `--draft` — visible only to those with write access. **Not** a prerelease; it can be
  published later as a normal release.
* `--prerelease` — published and visible to everyone, marked as a prerelease, and excluded
  from the "latest release" pointer.

A draft that is published without `--prerelease` set is a full release. Editing a published
release to add `--prerelease` is allowed and changes what people get from "latest".

## Assets

    gh release upload v1.2.0 ./dist/app.tar.gz --clobber
    gh release download v1.2.0 --pattern "*.zip"

`--clobber` overwrites an existing asset. Without it, uploading the same filename **fails**
— which is the safe default and worth keeping: an asset with the same name as a previously
published binary may have been downloaded by people already.

Deleting an asset is `gh release delete-asset v1.2.0 name.zip`. Assets are the one part of a
release that can be replaced after the fact, and a replaced binary with the same name is
indistinguishable from the original to anyone who already downloaded it.

## Reading

    gh release list --limit 10
    gh release view v1.2.0
    gh release view --json tagName,isDraft,isPrerelease,publishedAt,assets

**`isDraft` and `isPrerelease` are separate booleans**, and neither implies the other. A
common bug is treating the newest tag as the current release — it may be a draft, a
prerelease, or a tag with no release at all. Use `latest` rather than a tag lookup when you
want what users actually get.

## Deleting

    gh release delete v1.2.0 --yes

Deletes the **release**, and by default not the git tag — so the tag survives pointing at
history with no release describing it. That is recoverable; `git push --delete origin
v1.2.0` is not.

**Never delete or replace a published release to "fix" it.** Cut a new version. The
`versioning.md` rule in this workspace says the same thing: never re-tag, never rewrite a
release.

## Agents

**Never cut a release without being asked.** It is public, it notifies watchers, and it
makes a version claim.

**Never delete a release or a tag.** Both are irreversible from the forge.

**Assets are the sharp edge.** Replacing a binary under an existing name means anyone who
downloaded the old one has a file that claims to be the new one. If the content must change,
it needs a new version or a new asset name.

**`--draft` first when unsure.** A draft is publishable later and visible to nobody; a
published release is out. When the tag and notes are not confirmed, draft is the reversible
choice.

**Sandbox:** needs the network; 403 in-session.

## Related

* [`api.md`](api.md) — release assets and the endpoints behind them
* [`actions.md`](actions.md) — releases are usually triggered by a tag workflow
* [`../../rules/versioning.md`](../../rules/versioning.md) — never re-tag, never rewrite a
  release
