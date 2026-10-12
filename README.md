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

`/admin/[coach]/design/home` (Design → Home page). The students' Home is a stack of **sections**; each section has 1–3 columns (1, 1:1, 2:1, 1:2, 1:1:1) and **widgets snap into the columns**. On phones every section becomes one column.

- `src/lib/widgets/layout.ts` – the layout data (sections, columns, widgets) and each template's default Home.
- `src/components/widgets/registry.tsx` – every widget: name, group, required module, looks (variants) and settings. The settings panel is generated from this.
- `src/components/widgets/library.tsx` – the widget components.
- `src/components/widgets/page-renderer.tsx` – draws a layout; used by the live platform.
- `src/components/admin/design/home-builder.tsx` – drag and drop (dnd-kit), sections, per-tier layouts, phone view.

Only admins change the layout; students see it. No embeds or custom code.

Screen IDs (STU-01, ADM-01, …) refer to the platform map.
