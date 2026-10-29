import type { CSSProperties } from "react"
import type { CoachTheme } from "./types"

/** The readability minimum: the page colour always covers an image at least this much. */
export const MIN_DIM = 45

const svg = (body: string, w = 400, h = 300) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`

function candleArt() {
  let x = 6
  let p = 150
  let s = 7
  const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280)
  let out = ""
  while (x < 400) {
    const o = p
    const c = o + (rnd() - 0.48) * 26
    const hi = Math.min(o, c) - rnd() * 14
    const lo = Math.max(o, c) + rnd() * 14
    const up = c < o
    const col = up ? "#3ddc97" : "#ff5a4f"
    out += `<line x1='${x + 3}' x2='${x + 3}' y1='${hi}' y2='${lo}' stroke='${col}' stroke-width='1'/><rect x='${x}' y='${Math.min(o, c)}' width='6' height='${Math.max(2, Math.abs(c - o))}' fill='${col}'/>`
    p = Math.max(60, Math.min(240, c))
    x += 11
  }
  return out
}

function topoArt() {
  let out = ""
  for (let i = 0; i < 14; i++) {
    const y = 20 + i * 20
    out += `<path d='M0 ${y} C 80 ${y - 18}, 140 ${y + 22}, 200 ${y} S 320 ${y - 20}, 400 ${y + 4}' fill='none' stroke='#8a8f98' stroke-width='1'/>`
  }
  return out
}

/** A small library of trading-style images, so coaches without their own still get something good. */
export const BACKDROPS: { id: string; name: string; css: string; size: string }[] = [
  { id: "candles", name: "Candles", css: svg(candleArt()), size: "800px auto" },
  { id: "topo", name: "Contours", css: svg(topoArt()), size: "800px auto" },
  {
    id: "desk",
    name: "Trading desk",
    css: "repeating-linear-gradient(90deg, rgb(255 255 255 / .05) 0 1px, transparent 1px 48px), repeating-linear-gradient(0deg, rgb(255 255 255 / .05) 0 1px, transparent 1px 48px), linear-gradient(160deg, #0d1b2a, #1b263b 50%, #0b0c10)",
    size: "cover",
  },
]

/** Retired presets and what saved themes show instead: Aurora (a decorative colour wash) became Contours. */
const RETIRED: Record<string, string> = { "preset:aurora": "preset:topo" }

/** The CSS for the backdrop layer behind the platform, or null when the background is plain or a texture. */
export function backdropStyle(t: CoachTheme): CSSProperties | null {
  if (t.background === "gradient") {
    const a = t.bgAngle ?? 160
    return {
      backgroundImage: `linear-gradient(${a}deg, color-mix(in oklab, var(--primary) 26%, var(--background)), var(--background) 55%, color-mix(in oklab, var(--highlight) 18%, var(--background)))`,
    }
  }
  if (t.background === "image" && t.bgImage) {
    const id = RETIRED[t.bgImage] ?? t.bgImage
    const preset = id.startsWith("preset:") ? BACKDROPS.find((b) => `preset:${b.id}` === id) : null
    return {
      backgroundImage: preset ? preset.css : `url("${t.bgImage}")`,
      backgroundSize: preset ? preset.size : "cover",
      backgroundPosition: "center",
      filter: t.bgBlur ? `blur(${t.bgBlur}px)` : undefined,
      inset: t.bgBlur ? -t.bgBlur * 2 : 0,
    }
  }
  return null
}

/** How much page colour sits over the image, never below the readability minimum. */
export const dimOf = (t: CoachTheme) => Math.max(MIN_DIM, t.bgDim ?? 70)
