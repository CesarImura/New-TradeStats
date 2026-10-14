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
 * Turns a coach theme into CSS. It writes shadcn's own variables, so every
 * shadcn component takes the coach's look without being touched, plus a few
 * rules for the settings shadcn has no variable for (button shape, shadow,
 * density, label style).
 *
 * `scope` is `:root` for the student platform and a class for live previews.
 */
export function themeToCss(t: CoachTheme, scope = ":root", engine?: EngineOptions) {
  const p = resolveColors(t, engine)
  const sidebarDark = isDark(p.sidebar)
  const sidebarFg = sidebarDark ? "#f5f6fb" : p.foreground
  const shadow =
    t.shadow === "none"
      ? "none"
      : t.shadow === "soft"
        ? "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.05)"
        : `0 2px 4px rgb(0 0 0 / 0.06), 0 14px 36px color-mix(in oklab, ${t.primary} 16%, transparent)`
  const ring = t.borders ? `0 0 0 1px ${p.border}` : ""
  const cardShadow = [ring, shadow === "none" ? "" : shadow].filter(Boolean).join(", ") || "none"
  const buttonRadius =
    t.buttonShape === "pill" ? "9999px" : t.buttonShape === "square" ? `${Math.min(t.radius, 3)}px` : `${Math.max(6, t.radius * 0.7)}px`

  const fx = brandVisuals(t.primary, t.mode, t.effects ?? "soft")
  const geometric = t.radius <= 3
  // Is the brand's own text colour light (white-ish) or dark?
  const onLight = !isDark(t.primaryForeground) || /^#f/i.test(t.primaryForeground)
  const vars: Record<string, string> = {
    "--background": p.background,
    "--foreground": p.foreground,
    "--card": p.card,
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
    "--coach-font-heading": FONT_LIBRARY[t.fonts.heading].css,
    "--coach-font-body": FONT_LIBRARY[t.fonts.body].css,
    "--coach-font-label": FONT_LIBRARY[t.fonts.label].css,
    "--coach-heading-weight": String(t.headingWeight),
    "--label-transform": t.labelStyle === "caps" ? "uppercase" : "none",
    "--label-tracking": t.labelStyle === "caps" ? "0.06em" : "0",
    "--label-size": t.labelStyle === "caps" ? "0.6875rem" : "0.8125rem",
    "--density": String(DENSITY[t.density]),
    "--page-gap": PAGE_GAP[t.density],
    "--button-radius": buttonRadius,
    "--card-shadow": cardShadow,
    // Brand visuals: a natural gradient ramp, a harmonious series palette, glow and texture.
    // The brand colour and its own text colour, kept separate so brand surfaces can re-tint --primary.
    "--brand": t.primary,
    "--on-brand": t.primaryForeground,
    // Shades of the brand away from its text colour (darker under white text, lighter under black),
    // for chips, avatars and pictures on a brand card: they keep or gain contrast instead of losing it.
    "--brand-shade": `color-mix(in oklab, ${t.primary} 84%, ${onLight ? "black" : "white"})`,
    "--brand-deep": `color-mix(in oklab, ${t.primary} 62%, ${onLight ? "black" : "white"})`,
    "--brand-a": fx.a,
    "--brand-b": fx.b,
    "--brand-c": fx.c,
    "--brand-grad": `linear-gradient(135deg, ${fx.a}, ${fx.b} 55%, ${fx.c})`,
    "--brand-grad-h": `linear-gradient(90deg, ${fx.a}, ${fx.b} 60%, ${fx.c})`,
    "--brand-grad-v": `linear-gradient(to top, ${fx.c}, ${fx.b} 55%, ${fx.a})`,
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
  }

  const body = Object.entries(vars).map(([k, v]) => `${k}:${v};`).join("")
  const within = (sel: string) =>
    scope === ":root" ? sel : scope.split(",").map((p) => `${p.trim()} ${sel}`).join(", ")
  return `
${scope}{${body}color-scheme:${t.mode};}
${within(".text-primary")}{color:var(--brand-text);}
${within(".border-primary")}{border-color:var(--brand-mark);}
${within("[data-slot=button]")}{border-radius:var(--button-radius)!important;}
${within("[data-slot=card]")}{box-shadow:var(--card-shadow);--card-spacing:calc(var(--spacing) * 4 * var(--density))!important;}
${within("[data-slot=card][data-size=sm]")}{--card-spacing:calc(var(--spacing) * 3 * var(--density))!important;}
`
}
