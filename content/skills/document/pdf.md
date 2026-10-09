---
name: pdf
description: How the PDF format actually works and how to read, write, merge, split, and fill it — when a document task involves .pdf files. Covers the object model, why text extraction is lossy, and what each common operation really does.
---

# PDF

A page-description format, not a document format. That distinction causes most of the
trouble: PDF stores **instructions for drawing glyphs at coordinates**, not text, words,
or paragraphs. Anything that looks like structure is a coincidence of how the producer
laid the page out.

## The object model

A PDF is a tree of numbered objects, cross-referenced by an index at the end.

| Object | What it is |
|---|---|
| Catalog | The root. Points at the page tree. |
| Pages | The page tree — an ordered list of page objects, which may be nested. |
| Page | One page: its media box, resources, and content streams. |
| Content stream | The drawing operators — `Tj`, `TJ`, `re`, `f`, `cm`. The actual "content". |
| Font | A mapping from character codes to glyph shapes. |
| XObject | An embedded image or form. |
| Annot | A link, comment, or form field. |
| Trailer | Points at the catalog, and holds `/Root` and `/Info`. |

A page's text is a sequence of positioning operators plus show-text operators. A
"paragraph" is nothing — it is words that happen to share a y-coordinate and a font.
There is no paragraph object to ask for.

**The cross-reference table is why PDFs get "corrupted."** Byte offsets into the file are
stored there. If you concatenate or splice a file and the offsets are wrong, the file
still opens — it renders garbage, or nothing. Rewriting a PDF properly means rebuilding
the xref, not patching bytes.

## Why text extraction is lossy

There is no text layer unless the producer made one. Three cases:

**Born-digital** — a real text layer exists, usually mapped correctly. Extraction is
reliable, though multi-column layouts may need column detection, and reading order is
inferred rather than stored.

**Scanned** — pages are images. There is no text to extract at all. You need OCR, which
means the output has a confidence score you must check, and handwriting and bad scans fail
silently rather than loudly.

**Born-digital with a broken map** — text is present but the glyph→Unicode mapping is
wrong or absent, which is common with subset-embedded fonts. You get glyph codes where
you expected words. OCR over the rendered page is more reliable here than trusting the
existing layer.

## Choosing an approach

Decide before reaching for a library, because the operations differ in what they destroy.

| You want | Do this | Cost |
|---|---|---|
| Read text from a born-digital file | Extract with a real parser | Near-zero. Layout inference is approximate. |
| Read a scan | OCR, then **check the confidence** | Errors, and you must verify them |
| Merge or split | Page-level operation | Should be lossless — but check fonts and forms |
| Fill a form | Fill the AcroForm fields | See below; this is the fragile one |
| Edit existing prose | **Do not.** | See below. |

### Filling forms is the fragile case

Interactive AcroForm fields have values, appearances, and a flag saying whether a
appearance stream exists. Setting a field's value without regenerating its appearance
leaves the field showing the old text — the value is there, and it is invisible.

The reliable path is a library that rebuilds appearances: render the page, stamp the
new value, and write the appearance stream. Libraries vary widely here; check whether
yours does this rather than assuming it sets both.

**Flattening** — baking field appearances into page content and removing the fields —
makes a filled form stable for printing and for signature tools, and is irreversible.

### Do not edit prose in a PDF

There is no way to reflow a paragraph because there is no paragraph. Editing text in
place produces overlapping glyphs at best. If a PDF's content must change, regenerate it
from a source document. If there is no source, the content is effectively an image and
should be treated as one.

## Practical checks

* **Verify against the rendered page, not the extraction.** Extract, then look at page 1
  as an image. Cheap, and catches most layout failures.
* **Check the page count after every operation.** Merge or split went wrong if the count
  is not what you expected.
* **Sample the last page.** Truncation is the common silent failure, and it always happens
  at the end.
* **Fonts may not embed.** A merged file referencing a non-embedded font renders
  differently elsewhere.
* **Round-tripping is lossy.** PDF → PDF through a tool is not always identity. Verify
  visually before replacing an original.

## What this workspace does not do

No PDF tooling is installed here, and the sandbox has no network egress to install any.
If a task needs a PDF operation, hand the owner a command to run on the host.
