# TradeStats Coach Platform · Prototype

Clickable prototype of the white-label coach platform. For design and functionality only: placeholder data, no backend.

```bash
npm install
npm run dev
```

## Where things are

| URL | What |
|---|---|
| `/` | Launcher with the three demo coaches |
| `/c/[coach]` | Student side, in the coach's theme (`northline`, `sophia`, `kairo`) |
| `/admin/[coach]` | Admin area: fixed layout, coach's logo and colour |

The **Admin | Student** switch (bottom right) flips between views; the flask icon next to it changes community, template, navigation and light/dark.

**Design editor:** `/admin/[coach]/design`. Settings on the left, the real student platform on the right (an iframe with `?preview=draft`). Changes stay a draft until **Publish**; earlier versions can be restored. Published design, draft and versions are kept in localStorage per community (`src/lib/prototype-store.ts`) in place of a backend.

## How theming works

- `src/lib/theme/types.ts` – everything a coach can change (`CoachTheme`).
- `src/lib/theme/templates.ts` – the starting templates: Terminal, Atelier, Pulse.
- `src/lib/theme/css.ts` – turns a theme into shadcn's CSS variables plus a few rules (button shape, shadow, density, label style). shadcn components are not modified.
- `src/lib/theme/resolve.ts` – template → coach's published changes (or the draft in preview); also applies name, logo, words, menu and modules.
- `src/lib/fonts.ts` – the font library.

Coach data (wording, modules, menu, home widgets, tiers) is in `src/lib/data/coaches.ts`; sample content in `src/lib/data/sample.ts`.

## Home page builder

`/admin/[coach]/design/home` (Design → Home page). The students' Home is **one grid**: 12 columns and rows of 56px. Every widget covers a rectangle of cells (x, y, w, h) and **snaps to the grid in both directions**, so a tall card can sit beside two stacked ones. There are no preset sizes: drag a widget's right edge, bottom edge or corner. Each widget has a minimum width, and each of its looks a minimum height, so content never breaks.

Built on react-grid-layout v2: while dragging or resizing, the grid cells show and a highlighted placeholder marks exactly where the widget will land. Widgets are dropped straight from the library onto the grid.

Responsive by the width of the page area (`.g-page` / `.g-item` in `globals.css`): ≥ 60rem the grid exactly as arranged; ≥ 40rem in reading order, half or full rows, heights kept; phones one column in reading order.

- `src/lib/widgets/layout.ts` – layout data, responsive rules and each template's default Home.
- `src/components/widgets/registry.tsx` – every widget: group, module, three looks (each with a height and minimum height), settings, default and minimum width.
- `src/components/widgets/{learning,calendar,journal,progress,community,brand}.tsx` – the widgets, each with its empty state.
- `src/components/admin/design/home-builder.tsx` – the grid editor, per-tier layouts, desktop/tablet/phone, sample or empty data.

Note: react-grid-layout 2.2.4's `createScaledStrategy` measures drags from the page edge; the builder uses the standard strategy with `scale` instead, and corrects drop offsets for the scaled canvas.

Only admins change the layout; students see it. No embeds or custom code. `?data=empty` on a student page shows what a brand-new student sees.

Screen IDs (STU-01, ADM-01, …) refer to the platform map.
