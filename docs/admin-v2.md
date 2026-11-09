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
- Helvetica Neue only renders on Apple devices; others fall back to Arial.

## Checks
`npx tsc --noEmit`, `npx eslint src`, `npx next build`; screenshots at 1920 / 1024 / 390 (and 320 for overflow).
After adding Tailwind classes in new files, restart `next dev` if utilities do not appear (stale cache).

## Known gaps
- Areas 02–15 inherit the v2 look through the legacy layer; their layouts are not yet rebuilt screen by screen from Figma.
- Journal overflows by about 50 px at 320 px; Content > course page overflows 8 px at 1024 px.
- Search in the topbar is hidden below 1280 px.

## Status 09/11 (final round)
Rebuilt to Figma: Overview, Students, Journal (stats), Content, Calendar, Downloads, Livestreams, Community, AI, Sales overview, Ranking, Partners (stats + tags). Charts and Settings already match the Figma layout via the v2 layer. Modals and internal screens inherit the v2 look only.
Tests: tsc ok, next build ok, eslint only the old frame.tsx:92, sweep 15 routes x 1920/1024/390 without overflow (console errors only from blocked external network), 320 px only Journal overflows (50 px).
Open: Journal 320 px, topbar search hidden below 1280 px, Onboarding flow not redone.
