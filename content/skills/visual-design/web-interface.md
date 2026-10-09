---
name: web-interface
description: How to make a web interface look decided rather than defaulted — type scale, spacing rhythm, colour, and the few structural choices that carry most of the quality. Read before building or reviewing any UI.
---

# Web Interface

The goal is that nothing on the page looks **accidental.** Most interfaces fail not
because they are ugly but because they look unconsidered — default sizes, arbitrary
spacing, colour applied without a reason. That is a cheaper problem to fix than taste.

## The three decisions that carry most of it

Before any detail, commit to these. They set everything else.

**A type scale.** Not font sizes — a *scale*: a small set of sizes with a fixed ratio
between them, used consistently. Two families at most: one for headings, one for body,
or one for everything. A page with six sizes has no scale; it has drift.

| Role | Typical | Note |
|---|---|---|
| Display | 32–48px | Rare. One per page. |
| Heading 1 | 28–32px | The page's subject |
| Heading 2 | 20–24px | Section |
| Heading 3 | 16–18px | Subsection |
| Body | 15–17px | Never below 15 |
| Small | 12–13px | Metadata only, never body copy |

Line height follows the size. Large text needs proportionally **less** relative leading
(about 1.1–1.2); body text needs more (1.5); small text needs the most (1.6+). Setting
one line-height globally is the common error — it is right for exactly one of those three.

**A spacing rhythm.** Every gap is a multiple of one base unit — 4px or 8px. Not
approximately. The value is not mathematical; it is that *8px and 12px next to each other
look like an accident* even when both are reasonable in isolation. When everything is on
the rhythm, alignment appears without anyone aligning anything.

Related: **space between related things must be smaller than space between unrelated
things.** Proximity is the cheapest hierarchy available and it beats borders, arrows, and
labels.

**A restrained palette.** Two or three hues, not twelve. Most of a good interface is
greys, and the accent is reserved for the one thing that matters most on the screen. An
interface where everything is highlighted highlights nothing.

## Colour

Most of the palette is not colour, it is **neutral**: near-black text on near-white, or
the reverse. Choose the neutral first and get the contrast right; most "colour problems"
are contrast problems.

For anything that carries meaning — success, warning, error — pick colours that differ in
**lightness**, not only hue. Roughly 10% of people cannot reliably distinguish a red
meaning from a green one; a lightness difference works for everyone.

**Never encode meaning in colour alone.** An error needs text or an icon too. This is not
an aesthetic preference; it is the requirement for anything that must be perceivable.

Dark mode is not an inversion. Light text on a dark background appears to bloom and
needs *less* weight than the same text on white — bold-on-dark reads heavier than
bold-on-light at the same size.

## Structure and space

**Optical alignment beats mathematical alignment.** A play triangle centred in a box
looks off-centre; nudge it. Icons next to text need aligning to the text's cap height,
not its bounding box.

**Whitespace is not emptiness.** It is what makes the content readable. Cramped
interfaces read as amateur regardless of how good the components are.

**One primary action per view.** If everything is emphasised, nothing is. Secondary
actions should look secondary — not disabled, just quieter.

**Width constrains reading.** Body text wants 45–75 characters. Beyond that the eye
loses the line on return; below it, lines break awkwardly.

## The details that separate passable from good

* **Tabular numbers** for anything numeric that has to align in a column. Proportional
  digits make columns look broken.
* **Real states.** Hover, focus, active, disabled, loading, empty, and error. An interface
  designed only in its happy state is half-designed, and the empty state is the one users
  see first.
* **Visible focus.** Never `outline: none` without a replacement. Keyboard users are
  users.
* **Motion is brief and purposeful.** 150–300ms for state changes. Anything slower feels
  sluggish on repeat use; anything decorative should be removable without loss.
* **Consistent corner radii and border weights,** chosen once.

## Reviewing an interface

Three questions, in order, and stop at the first that fails:

1. **Is there a visible hierarchy?** Squint — you should see structure, not a uniform
   grid of text.
2. **Does everything align to something?** View with developer guides on. Misalignment
   shows up instantly.
3. **What is the one thing this screen is for?** If there is no clear answer, the
   hierarchy is not doing its job, and no amount of polish fixes that.

Then check the states, then check the contrast, then the responsive behaviour.

## What this workspace does not do

This page records how to make an interface look considered. It is not a component library
and carries no code — if a task needs an actual UI, that is a project under
`orgs/{org}/{repo}/` or `Personal/{project}/`, where it can have real dependencies.

## See also

* [`../authoring/technical-writing.md`](../authoring/technical-writing.md) — the same
  principle applied to prose: structure before polish
* [`../guidance/code-review.md`](../guidance/code-review.md) — checking for these in review