---
name: tradehub-componentes
description: "Use when changing one of these TradeHub components in Figma or code: Selection card, the choice controls with the orange selected edge (Option card, Segmented option, Choice chip, Sortable row), Admin tables, Timeline step and Step indicator of Getting started, coachmark progress, the primary-button rule of forms, sliding tabs and tab panels. Each has a reference file with the approved decision, tokens, traps and the test script."
---

# TradeHub components with fixed decisions

Gustavo approved these on 19/11/2026. Read the reference file of the component you touch before editing, then the general rules in `docs/components.md` (code) and `tradehub-figma` (Figma).

| Component | Figma | Code | Reference | Test |
|---|---|---|---|---|
| Selection card | `Admin / Selection card` 934:2287 | `src/components/admin/design/fields/choice-cards.tsx` (`SelectionCard`) | `references/selection-card.md` | `scripts/selection-card.mjs` |
| Timeline step / Step indicator (Getting started) | `Admin / Timeline step` 957:2923, `Admin / Step indicator` 590:600 | `src/components/admin/ui/timeline-step.tsx`, `step-indicator.tsx` | `references/timeline-getting-started.md` | `scripts/getting-started-order.mjs` |
| Coachmark progress | `Coachmark/Header/Progress` in the Admin tour frames | `src/components/admin/tour/tour.tsx` | `references/coachmark-progress.md` | `scripts/tours-smoke.mjs` |
| Primary button of forms | every form in Admin, Editor and onboarding | per form | `references/forms-regra-botao.md` | `scripts/forms-rule.mjs` |
| Choice controls: orange selected edge (21/11) | `Admin / Option card` 674:2167, `Admin / Segmented option` 580:480, `Admin / Choice chip` 945:2318, `Admin / Sortable row` 748:38223, plus Selection card | `ui/option-card.tsx`, `ui/segmented.tsx`, `onboarding/signup-frame.tsx` (`ChoiceChip`), `ui/sortable-row.tsx` | this file, section below | `scripts/visual-diff.mjs` on Calendar, Ranking, Community |
| Admin table head (21/11) | `Admin / Table head` (34 px, Admin/Micro 11/14) | `ui/data-table.tsx` (`AdminTh`) | this file, section below | `scripts/visual-diff.mjs` on Students, Ranking, Community |
| Sliding tabs and tab panels | `Admin / Tab`, `Admin / Segmented` | `src/components/admin/ui/slide-thumb.tsx`, `tab-panel.tsx` | `references/tabs-motion.md` | `scripts/tabs-motion.mjs`, `scripts/tab-content-motion.mjs` |

## Always
- These are decisions, not suggestions: don't "fix" the documented differences (e.g. Figma shows the primary button Default, code keeps it disabled until the form is valid).
- Before changing one, list its users: `docs/maps/components.md` (Figma usage per section) and `rg` for the code export.
- After changing one, run its test at 390, 768 and 1440 px, then `scripts/visual-diff.mjs` on the affected routes, and update the reference file if the decision changed (with date and who decided).
- Copy inside these components follows `tradehub-textos`.


## Orange on choice controls (Gustavo, 21/11/2026)
- Selected = 1 px edge `color/control/on` (#cf4500, 3.9:1 on the ink background), plus the orange radio/checkbox inside. Choice chip also keeps its `orange/soft` fill. Sortable row: Active and Dragging (`component/sortable-row/border/active`).
- Hover = neutral (stronger white edge) on all of them; `component/choice-chip/border/hover` is `color/border/strong`.
- Never an orange fill on a whole card, never orange text. One selected item per group.
- Screens: an instance whose Active stroke was overridden keeps the old white. After touching these components, audit Active instances on both screen pages and re-bind overrides (script in the 21/11 CHANGELOG entry). Hidden groups can be ignored.
- Code: never copy the look with `border-a-border-active` for a selected choice; use the component or the token (`border-[var(--admin-color-control-on)]`). Known copies already aligned: settings-parts, charts-admin markets, student-preview, sales/groups, settings-account, student-message radio, design-steps look chips. `TILE_ON` (Editor art tiles) is still white on purpose.

## Tab panels and tables (21/11/2026)
- `TabPanel` is `flex flex-col gap-4`: blocks inside a tab get 16 px, like Figma. Don't add wrappers to fake the gap; pass `className` only to change it.
- `AdminTh`: Admin/Micro 11/14 (`t-micro`), head 34 px, same as the 52 Figma tables.
- Compare screens in the browser at the same width as the Figma frame and measure (`getBoundingClientRect` vs the node's y); this is how the Community gap and the 4 px table head were found.
