import { css, hexToOklch } from "./color"
import { contrast, parseColor } from "./contrast"
import { isDark } from "./css"
import type { CoachTheme, Palette } from "./types"

/**
 * The colours a theme actually uses, worked out from the coach's choices.
 *
 * The coach's brand colour is always used as it is on filled surfaces
 * (buttons, banners, covers). Where it has to be read — links, icons, focus,
 * selected outlines — the platform uses the nearest version of the same
 * colour that is readable on that surface. The template's greys are tinted
 * towards the brand colour, so they match any brand.
 *
 * `fixes: false` gives the engine as it was before both, for comparison in the theme lab.
 */
export type ResolvedColors = Palette & {
  /** The brand colour as text on cards and the page (4.5:1). */
  brandText: string
  /** The brand colour as a mark on the page: focus rings, selected outlines (3:1). */
  brandMark: string
}

export type EngineOptions = { fixes?: boolean }

export function resolveColors(t: CoachTheme, { fixes = true }: EngineOptions = {}): ResolvedColors {
  const base = t.palettes[t.mode]
  let p: Palette = t.highlight
    ? { ...base, highlight: t.highlight, highlightForeground: isDark(t.highlight) ? "#ffffff" : "#0a0a0a" }
    : base
  if (!fixes) return { ...p, brandText: t.primary, brandMark: t.primary }
  if (t.highlight) p = { ...p, highlightForeground: onColor(t.highlight) }
  p = tintNeutrals(p, t.primary, t.tint ?? "brand")
  return {
    ...p,
    brandText: readableOn(t.primary, [p.card, p.background], 4.5),
    brandMark: readableOn(t.primary, [p.background], 3),
  }
}

/** White or near-black, whichever reads better on this colour. */
export function onColor(hex: string) {
  return contrast("#ffffff", hex) >= contrast("#0a0a0a", hex) ? "#ffffff" : "#0a0a0a"
}

const NEUTRALS = ["background", "card", "muted", "border", "sidebar", "mutedForeground", "foreground"] as const
/** Greys never get more colourful than this, so a tint reads as warmth, not as colour. */
const MAX_TINT = 0.035

/**
 * Keeps each grey's lightness (the template's structure) and its strength of
 * tint, but turns the tint to the brand's hue. A colourless brand (black,
 * white, grey) gives pure greys. See-through greys (rgba) are left alone.
 */
function tintNeutrals(p: Palette, primary: string, tint: "brand" | "template" | "none"): Palette {
  if (tint === "template") return p
  const brand = hexToOklch(primary)
  const out = { ...p }
  for (const key of NEUTRALS) {
    const v = p[key]
    if (!v.startsWith("#")) continue
    const g = hexToOklch(v)
    const strength = tint === "none" || brand.c < 0.03 ? 0 : Math.min(g.c, MAX_TINT) * Math.min(1, brand.c / 0.1)
    out[key] = toHex({ l: g.l, c: strength, h: brand.h })
  }
  return out
}

/**
 * The brand colour, or the closest colour of the same hue that reaches
 * `min` contrast on every surface given. Moves away from the surfaces:
 * darker on light pages, lighter on dark ones.
 */
export function readableOn(color: string, surfaces: string[], min: number) {
  const ok = (c: string) => surfaces.every((s) => contrast(c, s, surfaces[surfaces.length - 1]) >= min)
  if (ok(color)) return color
  const c0 = hexToOklch(color)
  const darkPage = isDark(toHex(hexToOklch(surfaces[surfaces.length - 1])))
  // Search lightness only; chroma is reduced as far as needed to stay a real colour.
  let lo = darkPage ? c0.l : 0
  let hi = darkPage ? 1 : c0.l
  let best = darkPage ? "#ffffff" : "#000000"
  for (let i = 0; i < 18; i++) {
    const l = (lo + hi) / 2
    const cand = toHex({ l, c: c0.c, h: c0.h })
    if (ok(cand)) {
      best = cand
      if (darkPage) hi = l
      else lo = l
    } else if (darkPage) lo = l
    else hi = l
  }
  return best
}

/** OKLCH to hex, pulling chroma in until the colour fits in sRGB. */
function toHex(o: { l: number; c: number; h: number }) {
  let c = o.c
  for (let i = 0; i < 24; i++) {
    const rgb = parseColor(css({ l: o.l, c, h: o.h }))
    const raw = rawRgb(o.l, c, o.h)
    if (raw.every((v) => v >= -0.001 && v <= 1.001) || c < 0.001) {
      const [r, g, b] = rgb ?? [0, 0, 0]
      return "#" + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("")
    }
    c *= 0.85
  }
  return "#808080"
}

function rawRgb(l: number, c: number, hDeg: number) {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}
