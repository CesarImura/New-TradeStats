/**
 * Automatic quality checks for one rendered widget (prototype only, used by
 * the widget wall at /lab/widgets). Everything is measured in the DOM after
 * render, so it checks what the student actually sees, whatever the widget's
 * code looks like. The rules come from the header of components/widgets/kit.tsx.
 */

export type RuleId = "type" | "contrast" | "brand" | "overflow"
export type RuleResult = { id: RuleId; label: string; pass: boolean; value: string; detail?: string }
export type WidgetCheckOptions = { star: boolean }

export const RULES: { id: RuleId; label: string }[] = [
  { id: "type", label: "Type size" },
  { id: "contrast", label: "Text contrast" },
  { id: "brand", label: "Brand coverage" },
  { id: "overflow", label: "Overflow" },
]

/** Thresholds, in one place so the page can show them. */
export const LIMITS = {
  /** Largest type size, px: 28 normally, 40 only on the page's star widget. */
  maxFont: 28,
  maxFontStar: 40,
  /** WCAG AA: 4.5:1 for text under 18px, 3:1 from 18px up. */
  contrastSmall: 4.5,
  contrastLarge: 3,
  largeTextPx: 18,
  /** Share of the widget's area painted in the brand colour. */
  maxBrandShare: 0.15,
  /** Pixels of overflow tolerated (sub-pixel rounding). */
  overflowSlack: 2,
  /** How many text elements the contrast rule samples per widget. */
  contrastSample: 80,
} as const

/* ---------- colour helpers ---------- */

type Rgba = [number, number, number, number] // r,g,b 0–255, a 0–1

const colorCache = new Map<string, Rgba | null>()
let ctx2d: CanvasRenderingContext2D | null = null

/**
 * Any computed CSS colour (rgb(), oklab(), oklch(), color(srgb …), color-mix
 * results) to RGBA. Fast path for rgb()/rgba(); everything else goes through a
 * 1×1 canvas, which understands every colour syntax the browser does.
 */
export function toRgba(css: string): Rgba | null {
  const key = css.trim()
  if (colorCache.has(key)) return colorCache.get(key)!
  let out: Rgba | null = null
  const m = key.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/)
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    out = [+m[1], +m[2], +m[3], a]
  } else if (key === "transparent" || key === "none" || key === "") {
    out = [0, 0, 0, 0]
  } else if (typeof document !== "undefined") {
    if (!ctx2d) {
      const c = document.createElement("canvas")
      c.width = c.height = 1
      ctx2d = c.getContext("2d", { willReadFrequently: true })
    }
    if (ctx2d) {
      ctx2d.clearRect(0, 0, 1, 1)
      ctx2d.fillStyle = "rgba(1, 2, 3, 0)" // sentinel: an invalid colour leaves it unchanged
      ctx2d.fillStyle = key
      ctx2d.fillRect(0, 0, 1, 1)
      const d = ctx2d.getImageData(0, 0, 1, 1).data
      out = [d[0], d[1], d[2], d[3] / 255]
    }
  }
  colorCache.set(key, out)
  return out
}

/** Lay `top` over an opaque `bottom`. */
const over = (top: Rgba, bottom: Rgba): Rgba => {
  const a = top[3]
  return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1]
}

const luminance = ([r, g, b]: Rgba) => {
  const f = (v: number) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function ratio(fg: Rgba, bg: Rgba) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The solid colour behind an element: walk up, stacking see-through
 * backgrounds until one is opaque (white if none is). Returns null when a
 * background image sits in the way, since its colour can't be known.
 */
function backdrop(el: Element): Rgba | null {
  const layers: Rgba[] = []
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (cs.backgroundImage && cs.backgroundImage !== "none") return null
    const c = toRgba(cs.backgroundColor)
    if (c && c[3] > 0) {
      layers.push(c)
      if (c[3] >= 0.99) break
    }
  }
  return layers.reduceRight<Rgba>((acc, l) => over(l, acc), [255, 255, 255, 1])
}

/** Product of opacities from the element up to (and including) the widget root. */
function opacityWithin(el: Element, root: Element) {
  let o = 1
  for (let n: Element | null = el; n && n !== root.parentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || "1")
  return o
}

/** Elements that directly hold visible text (HTML elements and SVG <text>). */
function textElements(root: Element) {
  const out: Element[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const seen = new Set<Element>()
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.textContent?.trim()) continue
    const el = t.parentElement
    if (!el || seen.has(el)) continue
    seen.add(el)
    out.push(el)
  }
  return out
}

const visibleIn = (r: DOMRect, box: DOMRect) => r.width > 0 && r.height > 0 && r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom

const snippet = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 28)

/* ---------- the rules ---------- */

/**
 * Type size: the largest font-size of any text in the widget. Five sizes only
 * (11/13/20/28px); 40px is allowed only when the widget's Emphasis is Star.
 */
function checkType(texts: Element[], box: DOMRect, o: WidgetCheckOptions): RuleResult {
  let max = 0
  let who: Element | null = null
  for (const el of texts) {
    if (!visibleIn(el.getBoundingClientRect(), box)) continue
    const px = parseFloat(getComputedStyle(el).fontSize)
    if (px > max) [max, who] = [px, el]
  }
  const limit = o.star ? LIMITS.maxFontStar : LIMITS.maxFont
  return {
    id: "type",
    label: "Type size",
    pass: max <= limit + 0.5,
    value: `${Math.round(max * 10) / 10}px`,
    detail: who ? `largest: “${snippet(who)}” (limit ${limit}px)` : "no text",
  }
}

/**
 * Text contrast (WCAG 2): each sampled text's computed colour, faded by any
 * opacity on the way up, against the solid colour behind it. Needs 4.5:1
 * under 18px and 3:1 from 18px. Text over images is skipped.
 */
function checkContrast(texts: Element[], root: Element, box: DOMRect): RuleResult {
  let worst: { r: number; need: number; el: Element } | null = null
  let sampled = 0
  for (const el of texts) {
    if (sampled >= LIMITS.contrastSample) break
    if (!visibleIn(el.getBoundingClientRect(), box)) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === "hidden") continue
    const isSvg = el instanceof SVGElement
    const fg = toRgba(isSvg ? cs.fill : cs.color)
    if (!fg) continue
    const alpha = fg[3] * opacityWithin(el, root) * (isSvg ? parseFloat(cs.fillOpacity || "1") : 1)
    if (alpha < 0.05) continue // invisible on purpose
    const bg = backdrop(el)
    if (!bg) continue
    sampled++
    const r = ratio(over([fg[0], fg[1], fg[2], alpha], bg), bg)
    const need = parseFloat(cs.fontSize) >= LIMITS.largeTextPx ? LIMITS.contrastLarge : LIMITS.contrastSmall
    if (!worst || r / need < worst.r / worst.need) worst = { r, need, el }
  }
  if (!worst) return { id: "contrast", label: "Text contrast", pass: true, value: "–", detail: "no text sampled" }
  return {
    id: "contrast",
    label: "Text contrast",
    pass: worst.r >= worst.need,
    value: `${worst.r.toFixed(2)}:1`,
    detail: `worst: “${snippet(worst.el)}” (needs ${worst.need}:1, ${sampled} texts sampled)`,
  }
}

/**
 * Brand coverage: the share of the widget's box painted in the brand colour
 * (--primary): elements whose background colour (or SVG fill) is the brand at
 * half opacity or more, by bounding box clipped to the widget. Nested matches
 * count once. An estimate: soft tints (and SVG shapes with a faint
 * fill-opacity) don't count, rounded corners and bar gaps make it run a little
 * high. Buttons don't count: the button is the widget's one sanctioned accent,
 * and in a one-row widget it is naturally a large share. Max 15% unless the
 * widget is the Star.
 */
function checkBrand(root: Element, box: DOMRect, o: WidgetCheckOptions): RuleResult {
  // The brand as the theme defines it, read from the widget's box without touching the DOM.
  const brand = toRgba(getComputedStyle(root.parentElement ?? root).getPropertyValue("--primary"))
  const area = box.width * box.height
  if (!brand || !area) return { id: "brand", label: "Brand coverage", pass: true, value: "–" }

  const near = (c: Rgba | null) => !!c && c[3] >= 0.5 && Math.abs(c[0] - brand[0]) <= 6 && Math.abs(c[1] - brand[1]) <= 6 && Math.abs(c[2] - brand[2]) <= 6
  const counted: Element[] = []
  let painted = 0
  for (const el of [root, ...root.querySelectorAll("*")]) {
    if (counted.some((c) => c.contains(el))) continue
    if (el.closest("[data-slot=button]")) continue
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") continue
    const isShape = el instanceof SVGGeometryElement
    const raw = isShape ? toRgba(cs.fill) : toRgba(cs.backgroundColor)
    const c: Rgba | null = raw && isShape ? [raw[0], raw[1], raw[2], raw[3] * parseFloat(cs.fillOpacity || "1")] : raw
    if (!near(c)) continue
    const r = el.getBoundingClientRect()
    const w = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left))
    const h = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top))
    if (!w || !h) continue
    painted += w * h * c![3] * opacityWithin(el, root)
    counted.push(el)
  }
  const share = Math.min(1, painted / area)
  return {
    id: "brand",
    label: "Brand coverage",
    pass: o.star || share <= LIMITS.maxBrandShare,
    value: `${Math.round(share * 100)}%`,
    detail: o.star ? "Star: a brand block is allowed" : `limit ${LIMITS.maxBrandShare * 100}% of the box`,
  }
}

/**
 * Overflow: the content must fit the widget's box at this size. Checks the
 * box and the widget's root (scrollHeight/scrollWidth vs client size, 2px
 * slack), and large inner containers that clip their content (overflow other
 * than visible, not an ellipsis, line clamp or fade-out mask).
 */
function checkOverflow(cell: HTMLElement, box: DOMRect): RuleResult {
  const s = LIMITS.overflowSlack
  const spill = (el: Element) => {
    const dy = el.scrollHeight - el.clientHeight
    const dx = el.scrollWidth - el.clientWidth
    return dy > s || dx > s ? { dx: Math.max(0, dx), dy: Math.max(0, dy) } : null
  }
  const candidates: { el: Element; what: string }[] = [{ el: cell, what: "widget box" }]
  if (cell.firstElementChild) candidates.push({ el: cell.firstElementChild, what: "widget root" })
  for (const el of cell.querySelectorAll("*")) {
    if (!(el instanceof HTMLElement)) continue
    const cs = getComputedStyle(el)
    if (cs.overflowX === "visible" && cs.overflowY === "visible") continue
    if (cs.textOverflow === "ellipsis" || (cs.webkitLineClamp && cs.webkitLineClamp !== "none")) continue
    if (cs.maskImage && cs.maskImage !== "none") continue // a deliberate fade-out row
    if (cs.flexDirection === "column" && cs.flexWrap === "wrap") continue // a "whole rows only" list: rows that don't fit wrap out of sight on purpose
    const r = el.getBoundingClientRect()
    if (r.width * r.height < box.width * box.height * 0.25) continue
    candidates.push({ el, what: "inner area" })
  }
  for (const { el, what } of candidates) {
    const o = spill(el)
    if (o)
      return {
        id: "overflow",
        label: "Overflow",
        pass: false,
        value: [o.dy && `+${o.dy}px tall`, o.dx && `+${o.dx}px wide`].filter(Boolean).join(", "),
        detail: `${what} clips its content`,
      }
  }
  return { id: "overflow", label: "Overflow", pass: true, value: "fits" }
}

/**
 * Runs every rule on one rendered widget. `cell` is the box the widget fills
 * (its grid cell); the widget's own element is its first child.
 */
export function checkWidget(cell: HTMLElement, o: WidgetCheckOptions): RuleResult[] | null {
  const box = cell.getBoundingClientRect()
  if (!box.width || !box.height) return null // not laid out (hidden)
  const root = (cell.firstElementChild as HTMLElement | null) ?? cell
  const texts = textElements(root)
  return [checkType(texts, box, o), checkContrast(texts, root, box), checkBrand(root, box, o), checkOverflow(cell, box)]
}
