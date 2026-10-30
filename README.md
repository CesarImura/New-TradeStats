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
| `/admin/[coach]` | Admin area: the same dark TradeStats look in every community (near-square corners, yellow main action) |
| `/setup` | Setup wizard (7 steps: Brand · Look · Menu · Pages · Membership · Videos · Get paid, the first four identical to Design): every Design option is reachable here too, folded under “More” |
| `/c/[coach]/p/[page]` | A page the coach added in Design → Menu (name, icon, built from widgets like every other page) |
| `/site/[coach]` | Public pages in the coach's brand: sales page, checkout, account code, thank you, student onboarding, login, free join, invite, waiting list, legal (PUB-01 to PUB-12, STO-01 to STO-03) |

The **Admin | Student** switch (bottom right) flips between views; the flask icon next to it changes community, template, navigation and light/dark.

**Design editor:** `/admin/[coach]/design`. Settings on the left, the real student platform on the right (an iframe with `?preview=draft`). Changes stay a draft until **Publish**; earlier versions can be restored. Published design, draft and versions are kept in localStorage per community (`src/lib/prototype-store.ts`) in place of a backend.

## Sections

Every section has an admin page and a student page; prototype data per community lives in localStorage (`useCommunityData` in `src/components/admin/kit.tsx`).

| Admin | Student | Notes |
|---|---|---|
| Students | – | List, profile sheet, import, messages |
| Journal & feedback | Journal | Feedback written in the admin shows up on the student's trade (`src/lib/data/feedback.ts`) |
| Charts | Charts | One TradingView chart with the coach's view: game plan list, levels legend, my trades, the coach's note, Log a trade / Ask the coach. Free widget: no exchange futures (samples use CFD symbols), no candle colours |
| Downloads | Downloads | Files beyond lessons: indicators, templates, checklists; categories, versions, tier access (`src/lib/data/downloads.ts`) |
| Partners | Partners | Partner offers from our catalogue or the coach's own links, and the coach's affiliate program (`src/lib/data/partners.ts`) |
| Community | Community | Announcements and the Discord connection |
| AI assistant | AI assistant | Canned answers in `src/lib/data/ai.ts` |
| Sales & payments | Profile → Subscription, My group; the public site | Tiers, groups, access, sales page, coupons, payments, payouts, affiliates |
| Ranking | Ranking | Leaderboard, competitions, points and badges |
| Settings | Profile | Domain, e-mails, legal, student onboarding, team, our plan |

## Tiers, groups and access

`src/lib/data/access.ts` holds tiers (with every edit from the tier editor), groups, access and “Preview as”, per community in localStorage.

- **Access** (Sales & payments → Access, ADM-14): areas, courses and modules × tiers and groups. Course access is the course's own `tiers` list, so the course builder, the tier editor and the grid show the same thing. A module can differ from its course. Each group decides when its members get a course: with their tier, on the start date, or 7/14/21 days after. Locked content is shown with “Unlock with …” or hidden.
- **Preview as** (ADM-15): pick a tier, a group or a student; the student side opens with a banner until you stop it. `?tier=` still works for one page.

## Selling and joining (visual only)

The prototype takes no payments: the card form is a picture of the provider's form, any six-digit code works, nothing is sent. The flow is real to click through:

Sales page (`/site/[coach]`, blocks edited in Sales & payments → Sales page) → Checkout (plan, group, coupon or invite code such as `WELCOME10` or `JONAS`) → Account code → Thank you → Student onboarding (welcome, short profile, Discord) → Home with the tour, the Start here card and the first-week checklist. The coach sets the onboarding up in Settings → Student onboarding; “Try it as a new student” there, or “Be a new student” in the Prototype menu, starts it again.

Data: `src/lib/data/sales-page.ts` (blocks, the purchase handed from page to page), `src/lib/data/student-start.ts` (onboarding settings and the new student's progress).

## How theming works

- `src/lib/theme/types.ts` – everything a coach can change (`CoachTheme`).
- `src/lib/theme/templates.ts` – the starting templates: Terminal, Atelier, Pulse.
- Trading colours (up/down) are set in Design → Brand; `derive.ts` keeps the exact hex for fills and an AA-adjusted shade for text (`--profit-text`, `--loss-text`).
- `src/lib/theme/css.ts` – turns a theme into shadcn's CSS variables plus a few rules (button shape, shadow, density, label style). shadcn components are not modified.
- `src/lib/theme/resolve.ts` – template → coach's published changes (or the draft in preview); also applies name, logo, words, menu and modules.
- `src/lib/fonts.ts` – the font library.
- `src/lib/theme/backdrops.ts` – platform background: gradient or image (own upload or library), with a minimum overlay so text stays readable. The same control (`background-control.tsx`) is used in Design and in the setup wizard.

Coach data (wording, modules, menu, home widgets, tiers) is in `src/lib/data/coaches.ts`; sample content in `src/lib/data/sample.ts`.

## Page builder

Design → Pages (`/admin/[coach]/design?step=pages`; the old `/design/home` and `/design/pages` links land there). Every student page, Home included, is a **masonry** of widgets (`Masonry` in `src/components/widgets/page-renderer.tsx`): each card is as tall as its content and goes into the shortest column, in the order the coach set. 3 columns from 960px of page width, 2 from 640px, 1 below. The page header, the page's core widget and full-width widgets span every column. So there are no holes between cards; only the column ends differ.

The canvas in Design uses the same masonry: dragging a widget only reorders it (the order is saved as `y` = position, `x` = 0), and its menu sets how wide it is (columns or full width), its look (Compact, Standard, Detailed) and the rest of its settings.

- `src/lib/widgets/layout.ts` – layout data and each template's default pages.
- `src/components/widgets/registry.tsx` – every widget: group, module, layouts (each with `h`, `minH`, `maxH`, `minW`, `maxW`, used to estimate a card before it is measured and by the Library), settings.
- `src/components/widgets/` – the widgets, each with its empty state, and the only copy of them: the Library, the admin and the student side all import from here. `content.tsx` is the "Your content" group: Text, Image, Button, Banner, Embed, Hero, filled by the coach.
- Every widget can carry the coach's own text, button and picture (`note` on the instance, shown under the header) and a visibility rule (`show`: a phase such as first week, inactive or finished a course, or a group). The builder shows rules as an orange tag; `?data=empty|inactive|finished` previews a phase.
- `src/components/admin/design/page-builder.tsx` – the canvas, per-tier layouts, desktop/tablet/phone, sample or empty data. On screens under 900px the editor says it needs a larger screen and offers the preview.

Only admins change the layout; students see it. No embeds or custom code. `?data=empty` on a student page shows what a brand-new student sees.

## Checks

```bash
npm run typecheck
npm run lint
```

There are no automated tests. Code style: no semicolons, long lines (`.prettierrc.json`); don't reformat whole files.

**Saving in the prototype:** localStorage holds about 5 MB per site. A change that doesn't fit shows "Couldn't save" and isn't kept; Publish keeps the draft if the published design doesn't fit, and drops the oldest versions first. Versions store each picture once (`proto:images:<coach>`).

Screen IDs (STU-01, ADM-01, …) refer to the platform map.
