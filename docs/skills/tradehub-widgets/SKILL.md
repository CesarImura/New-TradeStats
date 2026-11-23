---
name: tradehub-widgets
description: "Use when creating, redesigning, reviewing or adding customization options to TraderHub student dashboard widgets (src/components/widgets): enforces the vault's widget guardrails and includes the anti-AI-look review of widget screenshots. Replaces traderhub-widget-design and traderhub-anti-ai-look."
---

# TraderHub widget design

Goal: widgets that each coach can make their own, that never look like generic AI output, and that the system keeps readable whatever the coach picks.

## 1. Read first (vault "Trader Hub" through the tradehub-vault connector: search / read_note)
Read only these unless the task needs more:
- `Product/Customization principles.md` (three layers: Brand / Personality / System)
- `Updates/2026-10-14 Widgets quiet by default, one star.md`
- `Updates/2026-10-14 Widgets get an instrument anatomy and their own visuals.md`
- `Updates/2026-10-15 Widget headers are customizable.md`
- `Updates/2026-10-21 Feedback on wizard, editor, preview and widgets.md` (point 4: widgets look the same across coaches)
- `Learnings/Decorative brand effects make widgets look cheap.md`
- `Features/2026-10 Widget library.md`
If any newer Update about widgets exists, it wins over this skill.

## 2. Rules the coach can never break (System layer)
- **Type:** five sizes only: 11 / 13 / 20 / 28px, and 40px only on the page's Star widget. Medium weight, tabular digits. Use `TYPE` from `src/components/widgets/parts/tokens.tsx`.
- **Colour budget:** cards are neutral. The accent marks ONE thing per widget (current bar, latest point, progress fill, button). Brand colour covers at most 15% of the card unless Star. Series are shades of one hue. Meaning colours (profit, loss, greys) only in legends, timelines and charts, never as decoration. Profit/loss are text and thin marks, never blocks.
- **No** gradients, glows, washes, gradient text or glass. Hatching patterns for "remaining" bars are allowed. Cards, charts and tables sit on solid surfaces.
- **Contrast:** text uses the auto-adjusted readable brand colour (WCAG AA); the exact hex only on filled surfaces.
- **Geometry follows the theme:** use `--r-bar`, `--r-chip`, `--r-dot`, `--cap`; never hard-code radii.
- **One Star per page;** Star cards are flat brand colour, with profit/loss in the card's text colour plus ▲/▼ and +/−.
- **Charts:** hairlines, faint gridlines, a dot on the latest value.

## 3. How widgets are built (prototype code)
- Every widget renders through `WCard` in `src/components/widgets/parts/anatomy.tsx` (icon, title, context line, value chip, body; `Num` lives there too). Signature visuals are in `src/components/widgets/parts/visuals.tsx`: `Legend`, `TickGauge`, `TickBar`, `StepChart`, `DotStrip`, `HatchBar`, `Timeline`. Reuse them before writing new ones.
- Per-widget coach choices come from `useFrame()` (`src/components/widgets/parts/frame.tsx`): Emphasis (quiet / accent / star), Detail (compact / standard / detailed), header parts, note.
- Global choices come from the theme (`src/lib/theme/types.ts`): `widgetStyleOf` (instrument / soft / editorial), `chartStyleOf`, `widgetFontOf`, `widgetHeaderOf`.
- Catalogue, layouts, sizes: `src/components/widgets/registry.tsx` (`WIDGETS`, `lookOf`, `heightFor`). Editor controls: `src/components/admin/design/`.
- Icons are Carbon via `@/components/icons`. Our admin UI is never themed; only the student side is.
- Read `AGENTS.md`: this Next.js version differs from training data.

## 4. Making widgets more customizable: audit every new control
Before adding a control, answer each question in your plan:
1. **Anatomy or paint?** Does it change the structure (composition, hierarchy, visual type, density, header shape) or only colour/font? Prefer anatomy changes: "only colour and fonts change" is the known problem.
2. **Which layer?** Brand (free), Personality (from options), or System (ours only). Never expose System values.
3. **Good default** per template (Terminal, Atelier, Pulse) so the coach can ignore it.
4. **Plain words**, live preview, and advanced options folded under "More options" / Advanced in Design.
5. **Same place** in the setup wizard and the Design editor (the wizard is the editor's first steps).
6. **Can any combination break a rule in section 2?** If yes, the system must correct it, not the coach.
7. Old saved pages must keep working (map retired values to their replacement).

## 5. Workflow
1. Ground the look in real references (A1 Gallery skills `a1-gallery:design-reference`, `a1-gallery:tokens`, `a1-gallery:pairings`) instead of inventing values. Use `dataviz` for any chart inside a widget.
2. Run the anti-AI-look review in `references/anti-ai-look.md` on screenshots of `/bench/catalog` (or the student pages `/c/<coach>`) before changing anything, to know what to fix.
3. Write a short plan: widgets touched, controls added (with the section 4 answers), files.
4. Build. Do not use Figma unless the user asks.
5. Check `/bench/catalog` and run `npm run bench` (scripts/widget-bench, isolated copy, Gate): 0 defects; list any exception. Cover all templates, extreme coach colours, Quiet/Accent/Star, Compact/Detailed and empty data. The /lab was removed on 30/10.
6. Run the anti-AI-look review (`references/anti-ai-look.md`) again on the new screenshots. Widget copy (titles, context lines, empty states) follows `tradehub-textos`.
7. Record the decision in the vault as a dated Update using `Templates/`, link the Feature note, and update `Product/Open questions.md` if it settles one.

## Project rules
- Reply to Gustavo in Portuguese; write code, skills and vault notes in English.
- Work on a branch; commit, push, open PRs or deploy only when Gustavo asks explicitly.