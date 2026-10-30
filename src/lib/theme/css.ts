import { FONT_LIBRARY } from "@/lib/fonts"
import { brandVisuals } from "./color"
import { resolveColors, type EngineOptions } from "./derive"
import type { CoachTheme } from "./types"

const DENSITY = { compact: 0.85, comfortable: 1, airy: 1.3 } as const
const PAGE_GAP = { compact: "1rem", comfortable: "1.5rem", airy: "2rem" } as const

/** Is a hex colour dark? Used to pick readable text on coloured surfaces. */
export function isDark(hex: string) {
  const m = hex.replace("#", "").match(/.{2}/g)
  if (!m || m.length < 3) return false
  const [r, g, b] = m.map((x) => parseInt(x, 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110
}

/**
 * The theme's text goes into a <style> tag as is. In the prototype it comes from the
 * coach's own browser; once it comes from the server and is sent to every student,
 * a value must not be able to close a rule or the tag. No colour, font id or length
 * needs these characters, so they are dropped (the background picture isn't written
 * here: see backdropStyle).
 */
function cssSafe<T>(value: T): T {
  if (typeof value === "string") return value.replace(/[<>{};\\]/g, "") as T
  if (Array.isArray(value)) return value.map(cssSafe) as T
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "bgImage" ? v : cssSafe(v)])) as T
  return value
}

/**
 * Turns a coach theme into CSS. It writes shadcn's own variables, so every
 * shadcn component takes the coach's look without being touched, plus a few
 * rules for the settings shadcn has no variable for (button shape, shadow,
 * density, label style).
 *
 * `scope` is `:root` for the student platform and a class for live previews.
 */
export function themeToCss(theme: CoachTheme, scope = ":root", engine?: EngineOptions) {
  const t = cssSafe(theme)
  const p = resolveColors(t, engine)
  const sidebarDark = isDark(p.sidebar)
  const sidebarFg = sidebarDark ? "#f5f6fb" : p.foreground
  // On a dark page a 5% shadow can't be seen, so dark themes get deeper ones: Soft and Strong must look different there too.
  const darkPage = isDark(p.background)
  const shadow =
    t.shadow === "none"
      ? "none"
      : t.shadow === "soft"
        ? darkPage
          ? "0 1px 2px rgb(0 0 0 / 0.35), 0 6px 18px rgb(0 0 0 / 0.4)"
          : "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.05)"
        : darkPage
          ? `0 2px 4px rgb(0 0 0 / 0.45), 0 16px 40px color-mix(in oklab, ${t.primary} 22%, rgb(0 0 0 / 0.55))`
          : `0 2px 4px rgb(0 0 0 / 0.06), 0 14px 36px color-mix(in oklab, ${t.primary} 16%, transparent)`
  // Card surface: raised (the palette's card), grey (a flat grey card on the page) or outline (no fill, a hairline).
  const surface = t.cardSurface ?? "raised"
  const card = surface === "grey" ? `color-mix(in oklab, ${p.foreground} ${isDark(p.background) ? 7 : 5}%, ${p.background})` : surface === "outline" ? p.background : p.card
  // The hairline is an inset outline, not a 1px shadow ring: a ring sits outside the card and on rounded
  // corners the page shows through between the two, so the corners read as a different colour.
  // Outline on cards draws the widgets' hairline round every card (derive.ts makes it read on the card's own fill, grey included);
  // off, raised and grey cards stand on their fill (derive.ts keeps a raised card apart from the page). An outline card always
  // has it. Open widgets draw their own line (globals.css).
  const cardEdge = t.borders || surface === "outline" ? p.hair : "transparent"
  const cardShadow = shadow === "none" || surface !== "raised" ? "none" : shadow
  const buttonRadius =
    t.buttonShape === "pill" ? "9999px" : t.buttonShape === "square" ? `${Math.min(t.radius, 3)}px` : `${Math.max(6, t.radius * 0.7)}px`

  const fx = brandVisuals(t.primary, t.mode)
  const geometric = t.radius <= 3
  // Is the brand's own text colour light (white-ish) or dark?
  const onLight = !isDark(t.primaryForeground) || /^#f/i.test(t.primaryForeground)
  const vars: Record<string, string> = {
    "--background": p.background,
    "--foreground": p.foreground,
    "--card": card,
    "--card-foreground": p.foreground,
    "--popover": p.card,
    "--popover-foreground": p.foreground,
    "--primary": t.primary,
    "--primary-foreground": t.primaryForeground,
    "--secondary": p.muted,
    "--secondary-foreground": p.foreground,
    "--muted": p.muted,
    "--muted-foreground": p.mutedForeground,
    "--accent": p.muted,
    "--accent-foreground": p.foreground,
    "--border": p.border,
    "--input": p.border,
    "--ring": p.brandMark,
    "--radius": `${t.radius}px`,
    "--chart-1": t.primary,
    "--chart-2": p.highlight,
    "--chart-3": p.profit,
    "--chart-4": p.loss,
    "--chart-5": p.mutedForeground,
    "--sidebar": p.sidebar,
    // The ground a floating page sits on: the menu's colour, or a step off the page colour when they are the same.
    "--ground": p.sidebar.toLowerCase() !== p.background.toLowerCase() ? p.sidebar : `color-mix(in oklab, ${p.foreground} ${isDark(p.background) ? 5 : 4}%, ${p.background})`,
    "--sidebar-foreground": sidebarFg,
    "--sidebar-primary": t.primary,
    "--sidebar-primary-foreground": t.primaryForeground,
    "--sidebar-accent": sidebarDark ? "rgba(255,255,255,0.08)" : p.muted,
    "--sidebar-accent-foreground": sidebarFg,
    "--sidebar-border": sidebarDark ? "rgba(255,255,255,0.08)" : p.border,
    "--sidebar-ring": p.brandMark,
    // The brand colour where it is read rather than filled: links, icons, selected outlines.
    "--brand-text": p.brandText,
    "--brand-mark": p.brandMark,
    "--highlight": p.highlight,
    "--highlight-foreground": p.highlightForeground,
    "--profit": p.profit,
    "--loss": p.loss,
    // Profit and loss read as text: the same colour, moved to a readable shade when the coach picked their own.
    "--profit-text": p.profitText,
    "--loss-text": p.lossText,
    // The widget surface ladder (derive.ts surfaces): inner panel, empty track, hairline.
    "--w-panel": p.panel,
    "--w-track": p.track,
    "--w-hair": p.hair,
    // The Inverted Star card: the text colour as the card, the brand only as one mark.
    "--inv-bg": p.invBg,
    "--inv-fg": p.invFg,
    "--inv-accent": p.invAccent,
    "--coach-font-heading": FONT_LIBRARY[t.fonts.heading].css,
    "--coach-font-body": FONT_LIBRARY[t.fonts.body].css,
    "--coach-font-label": FONT_LIBRARY[t.fonts.label].css,
    "--coach-heading-weight": String(t.headingWeight),
    // Widgets follow the heading weight too: their big figures take it as is, their small titles at most semibold.
    "--w-value-weight": String(t.headingWeight),
    "--w-title-weight": String(Math.min(t.headingWeight, 600)),
    // Corner brackets (Widget finish Corners) are a square-card detail: on a rounded card they would sit on the curve as a seam.
    "--w-corners": t.radius <= 4 ? "block" : "none",
    "--label-transform": t.labelStyle === "caps" ? "uppercase" : "none",
    "--label-tracking": t.labelStyle === "caps" ? "0.06em" : "0",
    "--label-size": t.labelStyle === "caps" ? "0.6875rem" : "0.8125rem",
    "--density": String(DENSITY[t.density]),
    "--page-gap": PAGE_GAP[t.density],
    "--button-radius": buttonRadius,
    "--card-shadow": cardShadow,
    "--card-edge": cardEdge,
    // Brand visuals: a natural gradient ramp, a harmonious series palette, glow and texture.
    // The brand colour and its own text colour, kept separate so brand surfaces can re-tint --primary.
    "--brand": t.primary,
    // Figures in widgets: the label font when it is a mono, otherwise Geist Mono (the Instrument style uses it).
    "--font-figures": FONT_LIBRARY[t.fonts.label].kind === "mono" ? FONT_LIBRARY[t.fonts.label].css : FONT_LIBRARY["geist-mono"].css,
    "--on-brand": t.primaryForeground,
    // Shades of the brand away from its text colour (darker under white text, lighter under black),
    // for chips, avatars and pictures on a brand card: they keep or gain contrast instead of losing it.
    "--brand-shade": `color-mix(in oklab, ${t.primary} 84%, ${onLight ? "black" : "white"})`,
    "--brand-deep": `color-mix(in oklab, ${t.primary} 62%, ${onLight ? "black" : "white"})`,
    "--brand-b": fx.b,
    "--s1": fx.series[0],
    "--s2": fx.series[1],
    "--s3": fx.series[2],
    "--s4": fx.series[3],
    "--s5": fx.series[4],
    // Geometry for elements inside widgets, so they follow the coach's corner style:
    // square themes get square bars, dots and ring ends; pill themes get round ones.
    "--r-bar": geometric ? "0px" : t.buttonShape === "pill" ? "9999px" : `${Math.min(t.radius * 0.25, 4)}px`,
    "--r-chip": t.buttonShape === "pill" ? "9999px" : geometric ? `${t.radius}px` : `${Math.max(4, Math.round(t.radius * 0.45))}px`,
    "--r-dot": geometric ? "1px" : "9999px",
    "--r-inner": geometric ? `${t.radius}px` : `${Math.max(6, Math.round(t.radius * 0.6))}px`,
    "--cap": geometric ? "butt" : "round",
    // Menus (nav items, dropdowns, tabs, switchers) follow the corners but never go fully square:
    // a square theme keeps crisp cards and charts, with softer menus.
    "--r-menu": `${Math.max(6, Math.min(Math.round(t.radius * 0.8), 12))}px`,
    "--r-panel": `${Math.max(10, Math.min(t.radius + 4, 18))}px`,
  }

  const body = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join("")
  const within = (sel: string) =>
    scope === ":root" ? sel : scope.split(",").map((p) => `${p.trim()} ${sel}`).join(", ")
  return `
${scope}{${body}color-scheme:${t.mode};}
${within(".text-primary")}{color:var(--brand-text);}
${within(".text-profit")}{color:var(--profit-text);}
${within(".text-loss")}{color:var(--loss-text);}
${within("[data-slot=badge].text-destructive")}{color:color-mix(in oklab,var(--loss-text) 80%,var(--foreground));}
${within(".border-primary")}{border-color:var(--brand-mark);}
${within("[data-slot=button]")}{border-radius:var(--button-radius)!important;}
${within(':is([data-slot=card],[style*="var(--card-shadow)"])')}{outline:1px solid var(--card-edge);outline-offset:-1px;}
${within("[data-slot=card]")}{box-shadow:var(--card-shadow);--card-spacing:calc(var(--spacing) * 4 * var(--density))!important;}
${within(":is([data-slot=sidebar-menu-button],[data-slot=sidebar-menu-sub-button],[data-slot=tabs-trigger],[data-slot=dropdown-menu-item],[data-slot=dropdown-menu-sub-trigger],[data-slot=select-item],[data-slot=context-menu-item],[data-slot=command-item])")}{border-radius:var(--r-menu)!important;}
${within(":is([data-slot=dropdown-menu-content],[data-slot=dropdown-menu-sub-content],[data-slot=popover-content],[data-slot=select-content],[data-slot=context-menu-content],[data-slot=tooltip-content])")}{border-radius:var(--r-panel)!important;}
${within("[data-slot=tabs-list]:not([data-variant=line])")}{border-radius:calc(var(--r-menu) + 3px)!important;}
${within("[data-slot=card][data-size=sm]")}{--card-spacing:calc(var(--spacing) * 3 * var(--density))!important;}
`
}
