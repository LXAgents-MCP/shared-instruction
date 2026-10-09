---
name: docx
description: How .docx actually works — the OOXML package, why Word reports a file as corrupt, and how to build, read, and modify documents without breaking them. Read before writing code that produces or edits Word files.
---

# docx

A `.docx` is a **ZIP archive of XML files**, not a document. Almost every "Word file is
corrupt" problem is one malformed or missing part in that archive.

## The package

```
[Content_Types].xml      required — declares every part's type
_rels/.rels               required — the root relationships
word/document.xml        the body
word/styles.xml          style definitions
word/_rels/document.xml.rels   document's relationships
word/media/              images
word/numbering.xml       list definitions
word/footnotes.xml       optional
docProps/core.xml        optional metadata
```

**`[Content_Types].xml` and `_rels/.rels` are not optional.** A zip missing either is not
a Word document, whatever else it contains.

**Relationships are the part everyone forgets.** A paragraph references a style; a run
references a font and a hyperlink references a URL — each through a relationship ID into
the `.rels` file, not inline. A `r:id` pointing at a relationship that does not exist is
the single most common cause of "the file is corrupt and cannot be opened." It produces no
useful error message; Word just refuses.

**A content type must be declared for every part.** An image added to the zip without a
matching entry in `[Content_Types].xml` is invisible to Word — no error, just nothing
rendering.

## Building

Do not assemble the zip by hand. Use a library that manages content types and
relationships for you, and let it write the package. Hand-built packages work until they
do not, and the failure is always in a part you were not thinking about.

The body is a flat sequence of block elements — paragraphs, tables — and almost nothing
else:

* A paragraph's real structure is **runs**, and a run's formatting is per-character. There
  is no "bold this sentence" — there are separate runs around it, which is why text can
  appear to lose formatting when a tool rewrites it.
* A **style** is a named bundle of formatting. Applying a style is a reference, so
  redefining the style in `styles.xml` changes every paragraph using it.
* Section properties (page size, margins, orientation) live at the end of the body. This
  is why a new section is a paragraph plus a sectPr, not a tagged block.

## Modifying an existing file

The reliable approach is to **unzip, edit the XML, rezip** — preserving every part you
did not touch, including ones you have never heard of.

The unreliable approach is parse-and-reserialize with a library. It drops parts it does
not model — tracked changes, comments, custom XML, embedded objects, some fields — and
the result opens fine but has quietly lost content. **If a document has anything unusual
in it, do not round-trip it through a model that does not know about it.**

### Tracked changes and comments

These live inside the body XML as `w:ins`, `w:del`, and `w:commentRangeStart` elements.
They survive a hand edit; they do not survive a lossy reserialize. Text in `w:del` is
stored with `w:delText`, not `w:t` — a common cause of deleted text reappearing.

## Practical checks

* **Open the result, do not just save it.** A valid zip can be an invalid document.
* **Re-zip with the right structure.** `[Content_Types].xml` should ideally be first and
  stored, though most readers tolerate any order. Do not add a parent folder — the archive
  must contain the parts at its root.
* **Verify text survives a round-trip.** Extract the plain text before and after; a diff
  that is not empty means something was lost, usually formatting or fields.
* **Fonts are named, not embedded,** unless the document embeds them. Rendering differs
  across machines.
