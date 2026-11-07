/**
 * Colour maths for brand-derived visuals. Everything is computed in OKLCH,
 * where lightness and hue behave the way people expect, so a ramp built from
 * any brand colour looks natural: orange becomes amber → orange → red-orange,
 * green becomes lime → green → teal.
 */

export type Oklch = { l: number; c: number; h: number }

export function hexToOklch(hex: string): Oklch {
  const m = hex.replace("#", "").match(/.{2}/g)
  if (!m || m.length < 3) return { l: 0.6, c: 0.15, h: 40 }
  const [r, g, b] = m.slice(0, 3).map((x) => {
    const v = parseInt(x, 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360
  return { l: L, c: C, h: H }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function css({ l, c, h }: Oklch, alpha?: number) {
  const base = `${clamp(l, 0, 1).toFixed(3)} ${clamp(c, 0, 0.37).toFixed(3)} ${(((h % 360) + 360) % 360).toFixed(1)}`
  return alpha === undefined ? `oklch(${base})` : `oklch(${base} / ${alpha})`
}

/**
 * The brand colour and five harmonious colours for multi-series charts, brand first, for one mode.
 * (Brand depth used to add a lighter and a deeper tone for gradients; brand surfaces are flat brand colour now.)
 */
export function brandVisuals(primary: string, mode: "light" | "dark") {
  const p = hexToOklch(primary)
  const chroma = Math.max(p.c, 0.04)
  const b = { l: p.l, c: chroma, h: p.h }
  // Series: brand, then neighbours either side, then a softened complement and a split.
  const sl = mode === "dark" ? 0.72 : 0.62
  const sc = clamp(chroma * 0.8, 0.07, 0.13)
  const series = [p.h, p.h + 50, p.h - 50, p.h + 180, p.h + 105].map((h, i) => (i === 0 ? css(b) : css({ l: sl, c: i === 3 ? sc * 0.7 : sc, h })))
  return { b: css(b), series }
}
