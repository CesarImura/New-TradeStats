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

`/admin/[coach]/design/home` (Design → Home page). The students' Home is a stack of **sections**. Inside a section, widgets sit on a **12-column grid**: each has a width (span) that snaps to the grid, set by dragging its right edge or from the settings panel, and never narrower than its content allows (`minSpan`). Widgets wrap onto the next line when a row is full.

Responsive by the width of the page area (`.w-grid` / `.w-cell` in `globals.css`): ≥ 60rem spans apply as set; ≥ 40rem narrow widgets take half a row; below that every widget is full width. Widgets adapt inside using container queries.

- `src/lib/widgets/layout.ts` – layout data and each template's default Home.
- `src/components/widgets/registry.tsx` – every widget: group, module, **three looks**, settings, default and minimum width.
- `src/components/widgets/{learning,calendar,journal,progress,community,brand}.tsx` – the widgets, each with its empty state.
- `src/components/widgets/shared.tsx` – sample/empty data switch, empty state, cover art, rings.
- `src/components/admin/design/home-builder.tsx` – drag and drop, resize, sections, per-tier layouts, desktop/tablet/phone, sample or empty data.

Only admins change the layout; students see it. No embeds or custom code. `?data=empty` on a student page shows what a brand-new student sees.

Screen IDs (STU-01, ADM-01, …) refer to the platform map.
