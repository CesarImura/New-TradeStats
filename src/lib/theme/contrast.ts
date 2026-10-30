import { resolveColors } from "./derive"
import type { CoachTheme } from "./types"

/**
 * Readability checks for a coach theme (WCAG 2 contrast). Colours can be hex,
 * rgb()/rgba() or oklch(); see-through colours are laid over what sits under them.
 */

type Rgba = [number, number, number, number] // 0–1

function oklchToRgb(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return lin.map((v) => {
    const x = Math.min(1, Math.max(0, v))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
  }) as [number, number, number]
}

export function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase()
  if (s.startsWith("#")) {
    let h = s.slice(1)
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("")
    const n = h.match(/.{2}/g)?.map((x) => parseInt(x, 16) / 255)
    if (!n || n.length < 3) return null
    return [n[0], n[1], n[2], n[3] ?? 1]
  }
  const fn = s.match(/^(rgba?|oklch)\((.*)\)$/)
  if (!fn) return null
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean).map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p)))
  if (fn[1] === "oklch") {
    const [l, c, h, alpha = 1] = parts
    return [...oklchToRgb(l, c, h), alpha]
  }
  const [r, g, b, alpha = 1] = parts
  return [r / 255, g / 255, b / 255, alpha]
}

/** Lays a colour over an opaque one. */
function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3]
  return [top[0] * a + under[0] * (1 - a), top[1] * a + under[1] * (1 - a), top[2] * a + under[2] * (1 - a), 1]
}

function luminance([r, g, b]: Rgba) {
  const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** Contrast between a colour and the surface it sits on (which may itself sit on `page`). */
export function contrast(fg: string, bg: string, page = "#ffffff") {
  const p = parseColor(page) ?? [1, 1, 1, 1]
  const b = over(parseColor(bg) ?? [1, 1, 1, 1], over(p, [1, 1, 1, 1]))
  const f = over(parseColor(fg) ?? [0, 0, 0, 1], b)
  const [hi, lo] = [luminance(f), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export type Check = {
  id: string
  label: string
  fg: string
  bg: string
  ratio: number
  /** 4.5 for text, 3 for large numbers and things you need to see (focus, active item). */
  min: number
  pass: boolean
}

/** The colour pairs every student screen depends on. */
export function auditTheme(t: CoachTheme): Check[] {
  const base = resolveColors(t)
  const page = base.background
  const pairs: Omit<Check, "ratio" | "pass">[] = [
    { id: "text", label: "Text on page", fg: base.foreground, bg: page, min: 4.5 },
    { id: "text-card", label: "Text on cards", fg: base.foreground, bg: base.card, min: 4.5 },
    { id: "muted", label: "Secondary text on cards", fg: base.mutedForeground, bg: base.card, min: 4.5 },
    { id: "button", label: "Button text", fg: t.primaryForeground, bg: t.primary, min: 4.5 },
    { id: "link", label: "Brand colour as text (links)", fg: base.brandText, bg: base.card, min: 4.5 },
    { id: "brand-ui", label: "Brand colour as a mark (active, focus)", fg: base.brandMark, bg: page, min: 3 },
    { id: "highlight", label: "Text on highlight", fg: base.highlightForeground, bg: base.highlight, min: 4.5 },
    { id: "profit", label: "Profit numbers", fg: base.profit, bg: base.card, min: 3 },
    { id: "loss", label: "Loss numbers", fg: base.loss, bg: base.card, min: 3 },
  ]
  return pairs.map((p) => {
    const ratio = contrast(p.fg, p.bg, page)
    return { ...p, ratio, pass: ratio >= p.min }
  })
}
