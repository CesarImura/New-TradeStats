---
name: tradehub-figma-visual
description: "Use when designing or reviewing how a TradeHub Admin or Editor screen or component must look in Figma: orange and status colours, no dots as status, fonts, layout and width rules, Coming soon screens, editor shell, and component-specific visual rules (Option card, Tables, Media card, Logo, Sidebar). Replaces tradehub-figma-admin-v2."
---

# TradeHub Figma: Admin and Editor visual rules

Scope: WHAT the Admin and Editor must look like. File map, component pattern, variables and the done-checklist are in `tradehub-figma`; API tricks are in `tradehub-figma-plugin`. This skill wins over any older text elsewhere on colours, selection, dots and fonts. Add new design decisions here, each with date and who decided.

The Admin (page Screens · Admin, called "Admin v2" until 21/11/2026) and the floating Editor (page Screens · Editor) are the official references; both are also built in code (see tradehub-codigo). The old Admin page and the Dark variable mode were deleted on 21/11/2026.

## Colour and status
- Orange only on: logo, nav indicator, notification dot, ONE primary button per screen (a modal/drawer/tour over a dimmed screen may add one), toggles, checked checkbox/radio, data bars and progress (#c2561c), live bar. Hover, focus and links are neutral (white border; selected swatch = white ring). **Selected state of choice controls has the orange edge** `color/control/on` (#cf4500) and nothing else orange: Selection card, Choice chip (plus orange/soft fill), Option card, Segmented option, Sortable row (active and dragging); the radio/checkbox inside is orange too. Hover on all of them stays neutral (white border). Never an orange fill on a whole card or orange text (Gustavo, 21/11/2026). Done steps and complete progress are green. Never blue as brand.
- No dots as status. Use icons (check, warning, clock, lock, pin) or a ring loader. Tags and tabs have no dot (Show Dot off). Pinned = pin icon beside the title. Never type glyphs (●, •) in labels. Tag has no icon slot: add one only if Gustavo asks.
- Status tokens: text/icon/border use color/status/*; shapes (bars, progress, step circles) use *-fill; tints use -soft. Success #4ade80/#16a34a, danger #f35a5a/#dc2626, warning #fbbf24, info #60a5fa/#3b82f6. Upload progress ramps amber, olive #88b137, green; failed red. Step indicator: orange = guided flow; Success = done item; Warning/Error = problem step.
- Tour pill progress: ring with orange arc while running, green Checkmark when done.
- Revenue/data bars: #c2561c, hover #ff8a3d, the selected bar stays highlighted and the others use component/chart-bar/bg/dim (c2561c at 30%); no gradient.
- Fonts: Helvetica Neue only in Admin and Editor UI (no Space Mono, no Inter in UI). Themes and widgets keep their own fonts.
- Sample data: "today" in the prototype is November 2025; past dates 2024/2025, never 2026. Coach name Kairo FX. No 'TradeStats' anywhere; the brand is Traderhub (OBS URL rtmps://live.traderhub.io). Texts in English; notes in Portuguese.

## Layout rules
- Same-size siblings: stacked buttons or selects share one width (Import selects 170, Discord role selects 140, checklist actions 152); Option cards in a row of 3 use Side=Right, full-width lists Left. Siblings of one component stretch on the cross axis (self-stretch in code), equal widths = FILL on the main axis, never HUG. Check by script: heights and widths of siblings differ by at most 1 px.
- Onboarding card widths follow content: Log in, Create account, Verify code 440; Name and language 480; Design Brand 520; About you and Layout 560; Look 600. 40 px padding, centred in the 742 column. Topbar: search 36 like Help and bell (avatar 32).
- Text widows (last line with one short word): fix in order: shorten copy, widen container or lower padding, shorter synonym, manual break last. Never below 12 px, no negative tracking. Last line at least 2 words or ~40% width; card descriptions max 2 lines; code uses `text-balance`.
- Drawer section labels: Admin/Caption, upper case, text/secondary. Metric: 24 px value, Caption label with icon left. No dead space, no empty fixed spacers (wizard footers excepted).
- Hidden values (password, stream key) and Link fields: eye icon INSIDE the Field; link/URL = Field Type=Link, never an outside Copy button.
- Modals/drawers sit over the full source screen; overlays use Admin/Blur/Overlay (16).
- After resizing an instance holding nested cards, check title, description and control alignment in the screenshot.
- Product copy never mentions versions (v1, v2, "next version", "beta") anywhere in screens, tags or text. Features not available yet are shown as 'Coming soon': nav item with the grey 'Soon' badge (Nav item badge is absolute, right-anchored, 16 px margin) and a 'Coming soon' screen cloned from 'Journal · 00b Coming soon' (1680:72979): page header, Admin / Empty state with the clock icon, title 'Coming soon', one short line 'X will be available here soon.' (one line, no widow, no dates, no promises) and a secondary 'Back to Overview' button. Design notes (Portuguese) say 'indisponível por enquanto', never a version.
- Sidebar first item: 'Getting started' (send icon) ONLY in the Onboarding flow, until the user finishes it (Go live); in every other flow it is 'Overview' (Dashboard icon, same grey as the other items, never orange). Journal & feedback and AI assistant carry the grey 'Soon' badge in every sidebar.

## Editor (16/11)
- Top bar and rail fixed; panel and inspector are 336 px cards over the canvas in color/bg/page, border/default, radius lg, effect Admin/Shadow/Float; header = Admin / Logo (no wordmark) + '← Admin'; no pin, no hide-panels control. Preview, Layout for and zoom centre in the free space (360 to width-360).
- Shared illustrations are instances everywhere (Theme art Card 278x189 / Compact 147x100; Layout art Card 278x118 / Wide 216x92; Background art Editor only). Never paste loose copies.

## Specific components
- Option card: ONE component (_Base Option card + public State Default/Hover/Active/Disabled; Control Radio/Checkbox/Toggle/Step/Icon/Drag). Never draw loose choice cards. Keep toggle HUG min width 32.
- Tables: `Admin / Table` (SLOT) with Table head (+ head cell, Show Checkbox), Table row (Default/Hover/Active), Table cell (Align Start/End, SLOT), Table footer. Cell content: Cell stack, Cell person, Cell progress, or atoms. Row actions = ghost '...' icon button; student columns Avatar + name. Never a loose Table frame.
- Media card: chips with solid bg/page + border, ring loader, error alert, hidden icon, optional Scheduled icon; no dot on chips.
- File upload: Dropzone + File item (row height at least 48) + File icon. Timeline step: 24 px icon left, colour by state, action button 152, Show Skip off. Help row: ON_HOVER Dissolve Ease Out 0.3 s; Need-a-hand rows link to the Help frames. Code input only on Onboarding 02.
- Logo: only `Admin / Logo` (gradient T #FF4701 to #FF9003 via paint style Admin/Brand gradient + wordmark Traderhub). Never redraw, never flat orange T. Tones: Color on dark, Color on light, White, Gray, Black. Components in section 'Admin · Brand'. Every logo in screens is an instance. Code: src/components/brand/logo.tsx.
- Sidebar: `Admin / Sidebar` set, Size Expanded (255) / Collapsed (64, items 40x40, no invite card, groups separated by Admin / Divider). Round open/close button (Secondary, sm, icon only, radius full) ABSOLUTE at logo height in both. Nav item: Active = bg/panel + border/default + gradient icon; inactive icons color/text/nav 64%. View as student has an eye icon and sits before Settings. Collapsed nav: `children[0].setProperties({'Icon Only':'True'})` and FILL.
- Components page layout: see tradehub-figma §2.

- Sales and partners: in Partners the term is Deals (never Offers); Offers = high ticket packages. An offer package opens an existing tier (decision 20/11, no offer-only tiers). Booking link has one source: Settings > General and Editor Join. Data bars and progress use component/chart-bar/bg/default (#c2561c), never the vivid orange.

## Lessons (post-mortem, keep)
1. Fixed sizes on instances do not stick: change inside the component, re-set padding, screenshot.
2. Per-screen overrides drift from the component: change the variant, reset overrides, sweep all flows by script.
3. Fixing one screen instead of the pattern: when Gustavo points at one screen assume the same error exists elsewhere, find it by script, fix the component, sweep, report counts and what was only script-checked.
4. Change only what was asked; compare siblings; screenshot before and after.
5. Width by content, test widest and narrowest copy.
6. Thumbnails hide few-pixel errors: script audit first, then full-size screenshots. Review order: Components first, then screens.
7. When code and Figma differ decide which is right first; code defects never go into Figma (separate list). Empty states come from a fresh platform in the code, never memory. Product decisions go to Gustavo.
## Copy
All product text (titles, buttons, empty states, errors, notes) follows `tradehub-textos`: specific to the screen, no filler, no AI tells. A visual rule never justifies generic copy.
