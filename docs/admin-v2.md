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
