# Admin v2

The Admin follows the Figma file Tradehub (XWHeEdjEiY6gWmrsg0vFIZ), collection `Admin` (541:2).

## How Figma maps to code
- Variable path → CSS variable: `component/button/primary/bg/default` → `--admin-component-button-primary-bg-default`. All 271 live in `src/app/admin-tokens.css` (on `:root`, so portalled popups inherit). Regenerate that file from the Figma collection when tokens change; never edit values by hand.
- Same file maps tokens to Tailwind: `bg-a-panel`, `text-a-text-2`, `border-a-border`, `rounded-a-md`, `font-a-mono`.
- Figma text styles → utilities `t-display`, `t-title-l`, `t-heading-m`, `t-body-m`, `t-mono-label` … (they take variants: `md:t-display`). Do not write `text-[13px]`.
- Figma component name → React: `Admin / Button` → `AdminButton`, `Panel`, `Tag`, `Metric`, `AdminPageHeader`, `AdminTabs` in `src/components/admin/ui/`.

## Layers
1. `admin-tokens.css`: tokens + utilities.
2. `src/lib/theme/admin-v2.ts`: remaps the shadcn tokens and legacy selectors (card, button, input, badge, tabs, table, overlays) so pages not rebuilt yet already look v2. Appended after `TS_ADMIN_CSS` in the shell.
3. `src/components/shells/admin-shell.tsx`: floating 255 px sidebar card, 56 px topbar. Below 1280 px the sidebar is a drawer.
4. `src/components/admin/kit.tsx` (PageHeader, Field, SettingRow, Empty) now renders v2.
5. Rebuilt from Figma: Overview. New pages should use the kit in `admin/ui/`.

## Rules
- Dark only. UI text in English. No gradients except media fades. States: Default / Hover / Disabled (opacity 0.4); hover transitions 0.3 s ease-out.
- Editor (`admin/design`), Terminal and the student area are not touched by v2.
- Inter is first in the font stack on every device (substitute for Helvetica Neue, which the web cannot ship); mono is Space Mono.

## Checks
`npx tsc --noEmit`, `npx eslint src`, `npx next build`; screenshots at 1920 / 1024 / 390 (and 320 for overflow).
After adding Tailwind classes in new files, restart `next dev` if utilities do not appear (stale cache).

## Known gaps
- Areas 02–15 inherit the v2 look through the legacy layer; their layouts are not yet rebuilt screen by screen from Figma.
- Journal overflows by about 50 px at 320 px; Content > course page overflows 8 px at 1024 px.
- Search in the topbar is hidden below 1280 px.

## Status 09/11 (final round)
Rebuilt to Figma: Overview, Students, Journal (stats), Content, Calendar, Downloads, Livestreams, Community, AI, Sales overview, Ranking, Partners. Charts, Settings, Livestream detail and the course builder follow the v2 look. Onboarding wizard (/signup, /setup) keeps its own frame and was not touched.
Tests (09/11): tsc ok, next build ok, eslint only the old frame.tsx:92. Sweep 15 routes x 1920/1024/390 and 320 px: 0 overflow, console errors only from blocked external hosts (TradingView). Click-through of every visible button/tab on 14 screens at 1440/1024/390: 0 crashes. Drawer opens/closes, 0.3 s transitions, hover and focus ring checked at 3 breakpoints.
Fixed in the last round: Journal overflow at 320 px, course builder 8 px at 1024 px, search icon in the topbar below 1280 px.
Later 09/11: side sheets (calendar event, student profile, tiers, groups, help) are full width on phones (`data-[side=right]:w-full`, the shared Sheet has `w-3/4` that wins over `w-full`). Calendar event form stacks on narrow screens. Dialogs and sheets of Students, Calendar, Content, Downloads, Sales checked at 1440/1024/390 with no clipping. Onboarding wizard (/signup/*, /setup/*, 8 routes) checked at 3 widths: 0 overflow, 0 errors.

## Code review 09/11 (applied)
Page is always 1200 px (Figma Stack; `wide` removed). Mono rule scoped with `:is()`, icon button size rule fixed, dead sidebar-inset rule removed. Admin CSS string hoisted to a module constant, Inter no longer preloaded globally, admin wrapper renders `dark` on the server (no light flash), invite card dismissal shared between sidebar and drawer. AdminTabs: Home/End, fallback roving index, sr-only status text. Payouts timer cleaned on unmount; Sales money figures consistent. Ranking criteria are a radiogroup. Sales split per tab (revenue, tiers, groups, access, coupons, transactions, payouts).
Not done (backlog): split overview.tsx (data, banner, chart), one shared highlight bar chart for Overview and Sales revenue (hover state re-renders the whole tab), one Empty component, tabpanel roles for AdminTabs callers, kit files as const arrows.

## Passe 1:1 com o Figma (10/11)

Ordem de trabalho: shell, Overview, Students, Journal, Content, Downloads, Calendar, Charts, Community, AI, Sales, Partners, Ranking, Settings.

- Shell: texto do menu 14 px, item ativo com borda + ícone laranja, ícone de recolher ao lado do logo, ícone do convite, papel "Owner".
- Overview: banner em gradiente, chip "23 Online" e Go live dividido, 4 métricas do Figma, gráfico combo (barras + linha) com legenda, conteúdo em 3 colunas com queda por aula, "Needs you today" com botões de ação. Checklist de setup e aviso de amostra saíram desta tela.
- Journal: tabela de pedidos (Student, Question, Trade, Rules, Waiting, Answer). A resposta abre numa sheet com o mesmo editor de antes.
- Students, Content, Downloads, Calendar, Charts, Community, AI, Sales, Partners, Ranking, Settings: subtítulos, rótulos, colunas e botões do Figma.
- Diferenças que ficaram de propósito: nome "TradeStats" no logo (Figma diz "Traderhub"), "View as student" no menu, botão "Bulk upload" em Content, aba "Affiliates" em Sales, Partners e Livestreams em tabela, Personality da AI em layout de formulário (Figma tem dois cartões).

## Tabs, filters and buttons pass (10/11)
- Tabs: bordered group, 2 px inside, 26 px tabs, open tab on `bg-raised`, counts in tertiary (Figma Toolbar > Tabs). One rule in `admin-v2.ts` for the legacy `TabsList` plus `AdminTabs` (now with `count`, `dot`).
- New in `admin/ui/toolbar.tsx`: `AdminToolbar` (tabs left, controls right), `AdminSearch` (⌘K), `AdminFilter` ("Label | value"), `AdminViewToggle`. Used in Journal, Content, Students, Downloads, Livestreams, Charts, Sales > Transactions, Calendar (News).
- Tab sets now as Figma: Students All / Needs help / Invited / Paused; Content All / Needs attention / Published / Scheduled / Draft / Archived (+ grid/list); Community Announcements / Spaces & rules / Discord; Sales "Transactions".
- Buttons: Calendar Today, ‹ ›, Week, Month in the tabs row (admin only; List stays on the student side); Ranking period buttons in the toolbar; AI "Test it" and "Publish changes"; Livestreams "Open studio"; Journal Rules "Preview as student"; Transactions "Invoice" / "Answer the dispute"; Community "New announcement" in the header; Students "Import or invite" with plus.
- Left as is: Group filter in Ranking (no data), Type / date filters in Journal Answered, month filter in Transactions, card cover art in Content (the sample covers carry their own text).

## Content flow 07 to 13 (10/11)
The course builder was the old tree + lesson editor; it now follows Figma Content 07 to 13 (`src/components/admin/content/`): `course-builder.tsx` (header, state, upload simulation, upload tray), `curriculum.tsx` (modules as thumbnail grids, drag to reorder, drop videos on a module, Attention strip), `lesson-page.tsx` (course outline + tabs Lesson / Chapters / Quiz / Files, Visibility), `course-settings.tsx` (drawer: course, access with "N students lose access", status, danger zone), `publish-review.tsx` (blocks, heads up, when, tell students), `student-preview.tsx` (viewing as a tier). `lesson-editor.tsx` and `course-tree.tsx` were removed. New optional field `Lesson.freePreview` (Visibility = Free preview); the student side does not read it yet. The pass mark is still stored as a count of right answers; the 70/80/90 % buttons pick the nearest.
Not in the prototype data: the Figma failed upload (needs a real connection loss; the UI handles `failed` when the browser goes offline mid-upload).

Also (10/11): Content 01 to 06. `content-board.tsx` has the card grid (status tag and attention strip over a quiet tint cover, "Edited" line, bigger numbers), the table (select, thumbnail, Attention, Access, Lessons, Students, Done, Edited, menu; footer with Publish / Archive for the selection) and the empty state; the "Bulk upload" button and old dialogs were removed. `new-course.tsx` is the three-step New course modal (Course, Access, Content: start blank, upload a folder, import links). Videos from a folder wait in `uploadQueue` (course-parts.tsx) and start uploading when the builder opens. New optional `Course.edited` (sample values) and `Course.soldSeparately`.

Journal 02 and 03 (10/11): the answer is a page (`journal/journal-answer.tsx`), not a sheet; Video and Voice note open the recording screen. Sales 03: the tier editor is a centred dialog with Plan and Sales page tabs (`sales/tiers.tsx`); new optional `TierExtra.waitlist`. Content polish: lesson thumbnails tinted by state (failed red, hidden or no video grey), tabs dot is amber, "All changes saved" shows at rest, settings drawer floats with a compact cover row.

## Design-system pass (10/11)
Foundations checked against Figma collection Admin (541:2): 271 variables, names and values in sync with `admin-tokens.css`; text styles match the `t-*` utilities; Figma has no effect styles, the shadows live on the components (Modal and Drawer: 0 30 60 black 60%, Menu: 0 16 40 black 50%) and are now in the legacy layer (`admin-v2.ts`) so every dialog, sheet and menu follows them: radius 16 and 12, strong hairline, padding 6 and item 32 px, checkbox 16, toggle 32 x 18, progress 4 px, table padding 20 and 8.
New kit components in `components/admin/ui/` from the Figma Components page: `Callout`, `AdminSegmented`, `AdminUnderlineTabs`, `OptionCard`, `EmptyState`, `AdminProgress`, `AdminField` + `adminControl`, `AdminModal`, `AdminDrawer`. Content, Sales tier editor and New course use them. Still to build as components and move screens onto: Table family (head, row, cells), Media and Lesson card, Sortable row, Calendar event, Day chip, Time slot, Dropzone and File item, Avatar, Step indicator, Chart bar.

## Consolidation pass (10/11, later)
One component per Figma component, no copies:
- Buttons: every admin screen outside the Design editor now uses `AdminButton` (codemod over 23 files, 118 buttons; shadcn variant outline/ghost/destructive → secondary/ghost/danger, size sm → md, xs → sm, icon sizes → iconOnly). `PreviewAsMenu` lost its `size` prop.
- Tags and progress: shadcn Badge and Progress in admin screens are now `Tag` and `AdminProgress` (students, AI, journal, calendar, groups, student profile, setup tips).
- Fields and empty states: kit `Field` and `Empty` were duplicates of `AdminField` and `EmptyState`; `kit.tsx` now only re-exports them (`Field`, `EmptyState`), `Empty` is gone. `AdminField` takes either the control as children (label wraps it) or a render function with ids.
- New in `ui/`: `Dropzone`, `FileItem`, `SortableRow`, `StepIndicator`, `MediaCard` (used by Content cards, New course, the lesson page and the student preview). Calendar event colours follow the Figma types (Live accent, 1:1 success, News danger, the rest neutral). Day chip and Time slot are student-booking components and have no admin screen yet.
- Removed dead code: `SetupChecklist` and `TaskRow`, `LEVEL_COLOR`, `lesson-editor.tsx`, `course-tree.tsx`.
- Layer fixes (`admin-v2.ts`): menu item hover is the selected fill, avatars on the track fill with a hairline, active segmented/option cards use `border-active` (token alias `--color-a-border-active` added to the Tailwind mapping block).
Checks: `tsc` clean, ESLint 0 errors in admin (the old `frame.tsx:92` is the only one), 15 routes x 390 and 320 px without horizontal overflow or console errors, 194 clicks through every visible control without a page error.

## Component review and test pass (10/11)
- `/admin/<coach>/kit` is a dev-only gallery (not linked): every kit component in its states. It is also the test bench: Playwright asserts 65 values against the Figma specs (heights, radii, paddings, gaps, fills, edges, hover, focus, error, disabled, keyboard, focus trap, Esc), all passing; and overflow is 0 from 1920 down to 320 px.
- New: `CellStack`, `CellPerson`, `CellProgress`, `CellDot` (table cells), `LessonCard`. Students and Journal tables, and the Content curriculum, use them. Tables themselves stay shadcn Table styled by the admin layer (header fill, padding 20 and 8, hairlines), which is the single source for every table.
- 13 dialogs and sheets moved to `AdminModal` and `AdminDrawer` (Downloads, Community, Partners x2, Coupons, Ranking, Settings x3, Messages, Import, Charts, Groups, Calendar event). Left on the shadcn Sheet on purpose: the student profile and the calendar booking sheet, which have their own headers; they follow the layer for radius and shadow. Livestreams keeps its form dialog.
- The old `.border-dashed` colour overrides in `admin-v2.ts` and `ts-system.ts` are gone: they blocked hover and active edges on dashed components.
- Touch: with a coarse pointer buttons, tabs, segmented options, filters and search are at least 40 px (`pointer-coarse:`), checked with a touch emulation.
