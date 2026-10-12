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

The **Prototype** button (bottom right) switches coach, template, navigation and light/dark. Changes are kept in localStorage per coach.

## How theming works

- `src/lib/theme/types.ts` – everything a coach can change (`CoachTheme`).
- `src/lib/theme/templates.ts` – the starting templates: Terminal, Atelier, Pulse.
- `src/lib/theme/css.ts` – turns a theme into shadcn's CSS variables plus a few rules (button shape, shadow, density, label style). shadcn components are not modified.
- `src/lib/theme/resolve.ts` – template → coach's saved changes → unpublished edits.
- `src/lib/fonts.ts` – the font library.

Coach data (wording, modules, menu, home widgets, tiers) is in `src/lib/data/coaches.ts`; sample content in `src/lib/data/sample.ts`.

Screen IDs (STU-01, ADM-01, …) refer to the platform map.
