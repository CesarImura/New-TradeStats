/**
 * Click-to-edit in the Design preview. The preview frame (the real student
 * platform) works out which design setting a clicked element belongs to and
 * tells the editor, whose inspector then shows just that setting. Hovering a setting
 * in the editor outlines what it changes in the preview.
 *
 * Elements are matched from what they already are (shadcn data-slot, headings,
 * .eyebrow, widget cards), so student pages need no extra markup. Only the
 * shell marks the logo, the menu and its items with data-edit.
 */

export type PickTarget =
  | "logo"
  | "nav"
  | `menu:${string}`
  | "buttons"
  | "headings"
  | "labels"
  | "highlight"
  | "brand-surface"
  | "cards"
  | "background"

type Rule = { target: Exclude<PickTarget, `menu:${string}`>; selector: string; label: string; fields: string[] }

/** In priority order for one element; the innermost matching element wins. */
const RULES: Rule[] = [
  { target: "buttons", selector: '[data-slot="button"]', label: "Buttons", fields: ["primary", "buttons"] },
  { target: "headings", selector: "h1, h2, h3, .font-heading", label: "Headings", fields: ["fonts", "heading-weight"] },
  { target: "labels", selector: ".eyebrow", label: "Small labels", fields: ["labels", "fonts"] },
  { target: "highlight", selector: '[data-slot="badge"], .bg-highlight', label: "Highlight colour", fields: ["highlight"] },
  { target: "brand-surface", selector: ".fx-hero", label: "Brand card", fields: ["primary", "effects"] },
  { target: "cards", selector: '[data-slot="card"], [data-slot="widget"]', label: "Cards and widgets", fields: ["widget-style", "corners", "shadows", "borders", "density"] },
]

const MARKED: Record<string, { label: string; fields: string[] }> = {
  logo: { label: "Logo and name", fields: ["logo", "name"] },
  nav: { label: "Menu layout", fields: ["nav-layout", "nav-style", "nav-logo"] },
  background: { label: "Page background", fields: ["background", "mode"] },
}

export function describe(target: PickTarget): { label: string; fields: string[] } {
  if (target.startsWith("menu:")) return { label: "Menu item", fields: [`menu-${target.slice(5)}`] }
  return MARKED[target] ?? RULES.find((r) => r.target === target)!
}

/** The setting for one element, or null if the element itself matches nothing. */
function own(el: Element): PickTarget | null {
  const marked = el.getAttribute("data-edit")
  if (marked) return marked as PickTarget
  for (const r of RULES) if (el.matches(r.selector)) return r.target
  return null
}

/** The setting for whatever is under the pointer: the closest matching element, else the page background. */
export function resolve(start: Element | null): { target: PickTarget; el: Element } | null {
  for (let el = start; el && el !== document.documentElement; el = el.parentElement) {
    const t = own(el)
    if (t) return { target: t, el }
    if (el.matches("[data-edit-root]")) return { target: "background", el }
  }
  return null
}

/** Every element in the page a setting changes, for outlining from the editor. */
export function elementsFor(targets: PickTarget[], limit = 40): Element[] {
  const selector = ["[data-edit]", ...RULES.map((r) => r.selector)].join(", ")
  const out: Element[] = []
  for (const el of document.querySelectorAll(selector)) {
    const t = own(el)
    if (t && targets.includes(t)) out.push(el)
    if (out.length >= limit) break
  }
  if (targets.includes("background")) {
    const root = document.querySelector("[data-edit-root]")
    if (root) out.unshift(root)
  }
  return out
}

/** Settings fields → the preview targets that show them (for hover in the editor). */
export function targetsForField(field: string): PickTarget[] {
  if (field.startsWith("menu-")) return [`menu:${field.slice(5)}`]
  const all = [...RULES.map((r) => r.target), ...Object.keys(MARKED)] as PickTarget[]
  return all.filter((t) => describe(t).fields.includes(field))
}

/** Messages between the editor and the preview frame (same origin). */
export type PickMessage =
  | { type: "design-pick-ready" }
  | { type: "design-pick-mode"; on: boolean }
  /** `count`: how many parts of the page this setting changes. */
  | { type: "design-pick"; target: PickTarget; count: number }
  | { type: "design-show"; targets: PickTarget[] }
