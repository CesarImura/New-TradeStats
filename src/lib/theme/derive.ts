import { css, hexToOklch } from "./color"
import { contrast, parseColor } from "./contrast"
import { isDark } from "./css"
import { widgetSetOf, type CoachTheme, type Palette } from "./types"

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
  /** Profit and loss as text (4.5:1 and a little more). `profit` and `loss` stay exact for fills and marks. */
  profitText: string
  lossText: string
  /** The widget surface ladder (see `surfaces`): inner panel, empty track, hairline. */
  panel: string
  track: string
  hair: string
  /** The Inverted Star card: its fill, its text, and the brand as a mark on it (3:1). */
  invBg: string
  invFg: string
  invAccent: string
}

export type EngineOptions = { fixes?: boolean }

export function resolveColors(t: CoachTheme, { fixes = true }: EngineOptions = {}): ResolvedColors {
  const base = t.palettes[t.mode]
  let p: Palette = t.highlight
    ? { ...base, highlight: t.highlight, highlightForeground: isDark(t.highlight) ? "#ffffff" : "#0a0a0a" }
    : base
  // The coach's trading colours replace the palette's profit and loss in both modes.
  const own = tradingOf(t)
  if (own) p = { ...p, ...own }
  if (!fixes)
    return { ...p, brandText: t.primary, brandMark: t.primary, profitText: p.profit, lossText: p.loss, panel: p.muted, track: p.border, hair: p.border, invBg: p.foreground, invFg: p.card, invAccent: t.primary }
  if (t.highlight) p = { ...p, highlightForeground: onColor(t.highlight) }
  p = tintNeutrals(p, t.primary, t.tint ?? "brand")
  // One widget's own tone (widget-scope.tsx): its card, and the ladder, text and marks worked out on it.
  if (t.cardTone?.startsWith("#")) p = { ...p, card: t.cardTone }
  const ladder = surfaces(t, p)
  p = ladder.palette
  return {
    ...p,
    ...ladder.extra,
    brandText: readableOn(t.primary, [cardOf(t, p), p.background], 4.5),
    brandMark: readableOn(t.primary, [p.background], 3),
    // Moved to the nearest readable shade on the card the widgets really use (a grey card is darker), with a
    // little headroom (4.9) for inset panels and tints that sit a few percent darker still.
    // The inner panel counts too: figures in a ranking row or a feedback card sit on it.
    profitText: readableOn(p.profit, [cardOf(t, p), p.background, ladder.extra.panel], 4.9),
    lossText: readableOn(p.loss, [cardOf(t, p), p.background, ladder.extra.panel], 4.9),
  }
}

/** Minimum contrast between neighbouring surfaces, light and dark pages. Dark pages need more: the eye separates dark greys less well. */
const STEP = {
  light: { card: 1.1, panel: 1.06, line: 1.25 },
  dark: { card: 1.18, panel: 1.12, line: 1.35 },
}

/**
 * The surface ladder every widget uses, worked out from the template's greys:
 * page → card → inner panel, plus the empty track of bars and the hairline.
 * Each step is the smallest move toward the text colour that clears STEP, so
 * a template keeps its own greys when they already separate. Cards on a page
 * (Widget set Cards) must stand off the page: on dark pages the card gets
 * lighter, on light pages the page gets a touch darker. Secondary text is
 * moved until it reads at 4.5:1 on the darkest surface it sits on (the panel).
 * Dark pages cap the text colour a little under white: pure white glares.
 */
function surfaces(t: CoachTheme, p0: Palette) {
  const p = { ...p0 }
  const hex = (c: string) => c.startsWith("#")
  if (![p.background, p.card, p.foreground].every(hex)) return { palette: p, extra: { panel: p.muted, track: p.border, hair: p.border, invBg: p.foreground, invFg: p.card, invAccent: t.primary } }
  const dark = isDark(p.background)
  const step = dark ? STEP.dark : STEP.light
  if (dark && hexToOklch(p.foreground).l > 0.95) p.foreground = toHex({ ...hexToOklch(p.foreground), l: 0.95 })
  const surface = t.cardSurface ?? "raised"
  if (surface === "raised" && widgetSetOf(t) === "cards" && contrast(p.card, p.background) < step.card) {
    if (dark) p.card = toward(p.card, p.foreground, (c) => contrast(c, p.background) >= step.card)
    else {
      const sameSide = p.sidebar.toLowerCase() === p.background.toLowerCase()
      p.background = toward(p.background, p.foreground, (c) => contrast(p.card, c) >= step.card)
      if (sameSide) p.sidebar = p.background
    }
  }
  const card = cardOf(t, p)
  const panel = toward(card, p.foreground, (c) => contrast(c, card) >= step.panel)
  const hair = toward(card, p.foreground, (c) => contrast(c, card) >= step.line)
  const track = toward(panel, p.foreground, (c) => contrast(c, panel) >= step.line)
  const muted = flat(p.mutedForeground, card)
  if (muted && [panel, card, p.background].some((s) => contrast(p.mutedForeground, s, card) < 4.5)) p.mutedForeground = readableOn(muted, [panel, card, p.background], 4.5)
  const invBg = p.foreground
  const invFg = card
  return { palette: p, extra: { panel, track, hair, invBg, invFg, invAccent: readableOn(t.primary, [invBg], 3) } }
}

/** The colour moved in lightness toward `to` (keeping its own hue and tint) just far enough to pass `ok`. */
function toward(from: string, to: string, ok: (c: string) => boolean) {
  if (ok(from)) return from
  const a = hexToOklch(from)
  const b = hexToOklch(to)
  let lo = 0
  let hi = 1
  let best = to
  for (let i = 0; i < 18; i++) {
    const k = (lo + hi) / 2
    const cand = toHex({ l: a.l + (b.l - a.l) * k, c: a.c, h: a.h })
    if (ok(cand)) {
      best = cand
      hi = k
    } else lo = k
  }
  return best
}

/** A see-through colour (rgba) as the solid hex it shows on `over`; hex stays as it is. */
function flat(c: string, over: string) {
  if (c.startsWith("#")) return c
  const f = parseColor(c)
  const b = parseColor(over)
  if (!f || !b) return undefined
  const a = f[3] ?? 1
  return "#" + [0, 1, 2].map((i) => Math.round(Math.min(1, Math.max(0, f[i] * a + b[i] * (1 - a))) * 255).toString(16).padStart(2, "0")).join("")
}

/**
 * The card the text sits on: the palette's card, or with Card surface Grey the grey card css.ts draws
 * (the text colour mixed into the page, 5% light / 7% dark), which is darker than the card on light pages.
 */
function cardOf(t: Pick<CoachTheme, "cardSurface">, p: Palette) {
  if (t.cardSurface !== "grey" || !p.foreground.startsWith("#") || !p.background.startsWith("#")) return p.card
  const fg = hexToOklch(p.foreground)
  const bg = hexToOklch(p.background)
  const k = isDark(p.background) ? 0.07 : 0.05
  return toHex({ l: bg.l + (fg.l - bg.l) * k, c: bg.c, h: bg.h })
}

/** The coach's trading colours, if both are set. */
export function tradingOf(t: Pick<CoachTheme, "trading">) {
  const x = t.trading
  return x?.profit && x.loss ? { profit: x.profit, loss: x.loss } : null
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

/** `a` moved `k` (0–1) of the way to `b` in OKLCH, as hex. */
export function mixHex(a: string, b: string, k: number) {
  const x = hexToOklch(a)
  const y = hexToOklch(b)
  const dh = ((y.h - x.h + 540) % 360) - 180
  // A grey has no hue of its own: the mix takes the colour's.
  const h = x.c < 0.02 ? y.h : x.h + dh * k
  return toHex({ l: x.l + (y.l - x.l) * k, c: x.c + (y.c - x.c) * k, h })
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
