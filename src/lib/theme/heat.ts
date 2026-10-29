import { contrast, parseColor } from "./contrast"
import type { ResolvedColors } from "./derive"

/**
 * A heat-map cell with a number in it: profit or loss as the fill, stronger for
 * a bigger day, and the number in the page's text or page colour, whichever
 * reads better. If neither reaches 4.5:1 on that fill (mid-tone trading colours),
 * the fill is made a little lighter until one does, so every number stays
 * readable on any card the theme uses.
 */
export function heatCell(p: ResolvedColors, value: number, strength: number) {
  const rgba = parseColor(value > 0 ? p.profit : p.loss) ?? [0, 0, 0, 1]
  const fill = (a: number) => `rgb(${rgba.slice(0, 3).map((v) => Math.round(v * 255)).join(" ")} / ${a.toFixed(2)})`
  // The weakest contrast of a text colour on this fill, over the card and the page.
  const worst = (text: string, a: number) => Math.min(...[p.card, p.background].map((under) => contrast(text, fill(a), under)))
  for (let a = strength; a > 0.1; a -= 0.05) {
    const text = [p.foreground, p.background].reduce((x, y) => (worst(y, a) > worst(x, a) ? y : x))
    if (worst(text, a) >= 4.6) return { background: fill(a), color: text }
  }
  return { background: fill(0.1), color: p.foreground }
}
