---
name: tradehub-figma
description: "Use before creating, moving, renaming or reviewing anything in the TradeHub Figma file (XWHeEdjEiY6gWmrsg0vFIZ): screens, flows, notes, components, variables. Holds the file map, the naming and layout convention for flows, the component and variable patterns, the proportional checks and the done-checklist."
---

# TradeHub Figma: structure, conventions and process

One of three Figma skills, each fact in one place: this one (structure, naming, process), `tradehub-figma-visual` (what Admin and Editor must look like) and `tradehub-figma-plugin` (Plugin API behaviour). On visuals `tradehub-figma-visual` wins, on API behaviour `tradehub-figma-plugin` wins, on structure and process this skill wins. For copy (titles, buttons, errors, notes) also load `tradehub-textos`.

Talk to Gustavo in Portuguese; product text in English; notes on the canvas in Portuguese. Only one thread edits the Figma file at a time: ask the coordinator before writing.

## 1. Sources of truth
- File: https://www.figma.com/design/XWHeEdjEiY6gWmrsg0vFIZ/Tradehub. Read-only reference, never edit: Gta78xMTIFPTbVK3oZB3AX.
- **Admin = page `Screens · Admin` (1466:2), the only Admin.** Since 21/11/2026 it is just "Admin": the former "Admin v2" (the old Admin page 285:24530 was deleted, the named version "Antes da reorganização 21/11" keeps it). Don't write "v2" in new names, notes or docs. **Editor = page `Screens · Editor` (286:8501).**
- The Admin and the Editor exist in Figma **and** in code (`_worktrees/admin-v2`, branch `mac-admin-v2`). Figma is the visual reference, code is the behaviour reference (see `tradehub-codigo`).
- Maps (generated, in the repo): `docs/maps/screens.md` (every screen, id, route), `docs/maps/components.md` (component × code × usage), `docs/maps/tokens.md` (variables × CSS), `docs/maps/CHANGELOG.md`. Regenerate with `scripts/maps/*.mjs` after exporting data with the scripts in `scripts/maps/`. The old `docs/figma-component-map-2026-11-17.md` is history, not a source.
- Full guide (read once per thread): project library `figma-tradehub/guia-figma-padroes-2026-11-07.md`; scripts in `figma-tradehub/scripts/`.

## 2. File map
Pages: Cover 24:2 · `-----` · Guide & Foundations 178:2 · Icons 109:10745 · Components 283:9649 · `-----` · Screens · Admin 1466:2 · Screens · Editor 286:8501 · `-----` · Drafts 285:9649 (history: do not reorganize or delete). Separators are pages named `-----`.

Components page (283:9649), same pattern as the screen pages: three columns, each opening with a map. Admin (x 0) | Editor + Public (x 9000) | Terminal + Widgets (x 17500). Each column starts at y 0 with `<System> · 00 Component map` (clone of the Sales flow map: one group per section, every public component with `N var · N usos · CodeExport`, links to `docs/maps/components.md` and the code folder) and its note; sections follow, stacked in numeric order, 400 px apart, never overlapping. Sections: `Admin · 01 Brand`, `02 Actions`, `03 Forms`, `04 Navigation`, `05 Layout`, `06 Cards & lists`, `07 Tables`, `08 Data display`, `09 Charts`, `10 Files`, `11 Scheduling`, `12 Covers`; `Editor · 01 Shell`, `02 Controls`, `03 Preview`; `Public · 01 Join`; `Terminal · 01 Actions`, `02 Forms`, `03 Navigation`, `04 Rows & layout`, `05 Data display`; `Widgets · 06 Journal` (13 reference frames, not components: keep). Inside a section: one family per row, `_Base` left, public right. A new component goes in the right section, gets a line in the column map (update its counts when you regenerate `components.md`) and the code comment cites `Figma '<section>'`. Moving or renaming a section never breaks instances; renaming a component does change what code comments and the maps cite.

Collections: **Admin** (541:2, one mode `Admin`, modeId 1466:0) and **Terminal** (43:50). There is no third collection: Editor tokens live in Admin (`component/editor/*`). **Terminal is never edited or deleted** (student themes and widgets). The legacy Dark mode was removed on 21/11/2026 (Gustavo); with one mode there is nothing to set on new frames. Don't create a second Admin mode without Gustavo's ok.

## 3. Naming and layout of flows and screens (Sales & payments pattern, 21/11/2026)
Model: `Admin · 12 Sales & payments` (1485:116216). Every Admin flow follows it; the Editor uses the same rules for names, columns and notes.
- Section: `Admin · NN <Flow>` (01 Onboarding … 15 Settings), `Editor · NN <Group>` (01 Menu, 02 Style, 03 Pages, 04 Join, 05 Menus and dialogs). Numbers follow the Admin sidebar order.
- **Every section starts with `<Flow> · 00 Flow map`** (column 0, same size as a screen, cloned from `Sales · 00 Flow map` 1947:77406): title `<FLOW> · MAPA DO FLUXO`, one line on the order, 1 to 4 groups (`N · <goal>` + one line + items `NN  <step>` with its states underneath), and a box with the links to other sections and the code folder. Text in Portuguese, bound text styles. It cites screen numbers, so update it whenever a screen is renumbered. Editor · 05 is a catalogue: its map lists the groups, not steps.
- A feature that is not live yet keeps the designed flow and shows the live screen as `<Flow> · 00b Coming soon`, under the Flow map (Journal, AI assistant).
- Screen = step: `<Flow> · NN <Step>`, one column per step, in the order the coach meets them in the code (page tab order, then actions). A modal, drawer or sub-page opened by an action is a step. A page with tabs: each tab is its own step (Journal, Calendar, Charts, Community, Partners, Ranking, Sales).
- State or variant of a step: `<Flow> · NNx <Step> · <State>` with letters **b, c, d…** in row order, stacked in its base column. States are: empty (`No … yet`), no results, selection, view toggle (`As table`), tabs inside a drawer, errors and edge cases. The step name repeats inside the state name (`Students · 01b List · No students yet`), so the list reads well when sorted.
- Parallel branches with no base (Onboarding course tour: Folder / Links / Blank): `NNa, NNb, NNc`, one row per branch. The only place where `a` is used.
- Labels (frames `Label · <Type> · <text>`, cloned from an existing one, text styles bound):
  - **Column labels**, 120 px above the first frame of the column, text in English: `Label · Tab · <tab name>` for page tabs; `Label · Stage N · <stage>` for stages of a long flow (Sales 1–4, Content 1–4, Settings 1–4, Onboarding 1–8). Every flow with tabs or more than ~6 steps has them; the stage groups match the groups of the Flow map.
  - **Row labels**, at the left of the row: `Branch`, `Variant`, `Edge case`, `Help`, `Group`, `Public`.
  - The type never goes in the screen name. No "· Variant ·" in names.
- Every screen has `Note · <exact screen name>`, 40 px under it, same x, in Portuguese, 1 to 3 bullets on purpose, state and context (template: clone an existing note; text styles are bound).
- Layout: steps left to right (Admin x = 100 + i·2020; Onboarding 611 + i·2118; Editor 80 + i·2040); states under their base, next row = previous y + height + 620. Sections 400 px apart, in numeric order, never overlapping; section = content + 300 px at the bottom. Exception: Editor · 05 Menus and dialogs is a catalogue, one row per group with a `Label · Group`.
- Known limitation: the layer list order can't be changed through the MCP (insertChild needs Helvetica Neue). On the canvas the order is right; in the Layers panel `Admin · 01 Onboarding` is last and the Editor shows 01, 03, 04, 05, 02. Don't try again by script.
- Renaming a screen: also rename its note, then search the old name in `src/`, `docs/`, skills, the flow map and the maps; record old → new in `docs/maps/CHANGELOG.md`. `src/components/prototype/flows.ts` (`figma:` fields) and code comments cite screen names.
- Audit after any reorganization (script, `scripts/maps/figma-export-components.js` style): 0 screens without a note, 0 notes misaligned, 0 unnumbered screens, 0 duplicate numbers, 0 frames out of their column or section, 0 overlapping frames or sections, 0 broken instances.

## 4. Component pattern (mandatory)
- `System / _Base X` (no fill; structure: Size, Icon Only; props `Show X`, `X Text`, `X Icon`) + public `System / X` (HUG wrapper with one exposed _Base instance; visual variants only: Hierarchy or Tone × State). Colours are overrides bound to `component/*` tokens.
- States: Default, Hover, Disabled (opacity 0.4). Selection = Active. Specific states only where real (Focus, Filled, Error, Open, Locked, Done/Current/Upcoming). Hover prototype: ON_HOVER, Dissolve, Ease Out, 0.3 s. Inputs md 44, sm 32.
- Icons: instance swap from the Icons page (Carbon 16). Never glyph texts as icons.
- Use the library piece, never imitate (Field, Filter, Option card, Panel, Media card, Tag, Tab, Table…). Before creating a component, search `docs/maps/components.md`; extend with a variant instead of a new family. Every component has an English description.
- No duplicates and no `· old` / `· v1`. Swap instances first; delete the old set only after Gustavo's ok. A set with no page parent ("main component" missing) can be re-attached by appending it to a section of Components: ids and overrides stay.

## 5. Variables and styles (mandatory)
- `primitive/*` (hidden, scopes []) → `color/*` → `component/<comp>/<layer>[/<state>]`; plus `font/*`, `space/N`, `radius/2xs…full`, `layout/*`. Off-palette colour: `primitive/extra/<hex>[-alpha]` + a named component token.
- Explicit scopes; WEB code syntax always (Terminal `var(--name)`, Admin `var(--admin-name)`). A new Admin variable needs a Foundations row (Admin sheet 622:36350) and a line in `src/app/admin-tokens.css`.
- Nothing loose: every colour, text, gap, padding and radius bound (allowed leftovers: radii 1/5/7/14, spacing 22/30/44, #9966FF frame strokes).
- Delete a variable only after listing its users (Figma and code, see `docs/maps/tokens.md`) and Gustavo's ok.

## 6. Proportional checks (do only what the change needs)
| Change | Check |
|---|---|
| New screen | name (§3), section, column/row, note, line in the Flow map; add to `docs/maps/data/figma-screens.tsv` and regenerate `screens.md` |
| New flow | new section NN in order, `00 Flow map` in column 0, Tab/Stage labels per column, row labels, sections re-stacked without overlap |
| New state/variant | letter in sequence, stacked under its base, note |
| New component or variant | search the column map and `components.md` first; right numbered section; description; bound variables; line in the column map; regenerate `components.md` |
| New variable | collection Admin, group, scopes, code syntax, Foundations row, CSS line, regenerate `tokens.md` |
| Rename / move | note follows, old name searched in code/docs/skills, CHANGELOG line |
| Delete anything | list users, Gustavo's ok, CHANGELOG line |

## 7. Before you say done
1. Script audit of touched nodes: names, positions, no overlap, notes aligned, 0 raw colours, 0 unstyled texts.
2. Screenshot what changed (and the "before" when the change is visual).
3. Maps regenerated when screens, components or variables changed; CHANGELOG updated.
4. Reply in Portuguese: what changed, counts, what was only checked by script, what is left. Tell the coordinator.
