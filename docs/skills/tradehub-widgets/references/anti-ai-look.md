
# Anti "AI look" review for TraderHub widgets

The team's own finding: brand gradients, glows and washes made widgets look "very vibe coded" (vault: `Learnings/Decorative brand effects make widgets look cheap.md`), and widgets still "look the same across coaches" (`Updates/2026-10-21 Feedback on wizard, editor, preview and widgets.md`, point 4). This skill makes that judgement repeatable.

## 1. Get the screens
- Start the app (use the `run` skill) and screenshot `/bench/catalog`, or the student pages `/c/<coach>`, for at least two templates (Terminal, Atelier, Pulse) and one extreme coach colour.
- Put two different coaches side by side: the main question is whether they look like different products.
- If available, pull 2 to 3 real references (A1 Gallery: `a1-gallery:design-reference`) for the same kind of widget to compare against.

## 2. Checklist (mark each: pass / weak / fail, with the widget name)
**Decoration**
- Gradients, glows, blurred blobs, glass, gradient text, coloured shadows.
- Big soft shadows and the same large radius on everything regardless of the theme's geometry.
- Sparkle or emoji icons, "AI" badges, decorative pills with no data.

**Sameness**
- Every card has the same skeleton: icon + title + big number + chart/badge.
- Same icon style and size in every widget; icons that say nothing about the content.
- A uniform grid of equal cards with no hierarchy (no Star, nothing leads).
- Two coaches differ only in colour and font.

**Type and colour**
- One default sans (Inter/Geist-like) for headings, numbers and body with no character from the coach's pairing.
- Too many sizes or weights; sizes outside 11/13/20/28/40px.
- Brand colour used on many things instead of one mark; rainbow series; red/green blocks.

**Data and copy**
- Fake data that looks fake: round numbers, perfect curves, "John Doe", lorem ipsum.
- Generic labels ("Overview", "Stats", "Analytics") instead of a context line from the student's and coach's own data ("Journal · last 20 days · 19 trades").
- Marketing tone inside a tool ("Unlock your potential").

**Craft**
- Misaligned baselines, uneven padding, numbers not tabular, overflow or truncation, empty states that are just "No data".

## 3. Output
- A table: widget · finding · severity (high / medium / low) · suggested fix.
- For each fix, say which layer it touches (Brand / Personality / System from `Product/Customization principles.md`) and confirm it keeps the guardrails in `tradehub-widgets` (type sizes, ≤15% brand coverage, one Star, no gradients, solid surfaces, theme geometry, AA contrast). A fix that breaks a guardrail is not allowed.
- Finish with the three changes that would most make two coaches look like different products.
- Do not change code during the review; hand the list to the workflow in `tradehub-widgets`.

## Project rules
- Reply to Gustavo in Portuguese; write reports for the vault in English.
- Do not create anything in Figma unless asked.
