import type { ThemeDraft } from "@/lib/prototype-store"
import { TEMPLATES } from "@/lib/theme/templates"
import { widgetStyleOf, type CoachTheme, type TemplateId } from "@/lib/theme/types"
import { LOOKS, type Look } from "./looks"

/**
 * The ready-made choices the setup wizard and the Design editor share: the three themes (Terminal, Atelier, Pulse) with
 * their pictures, the four layouts, and what picking either writes. One owner for each setting (Figma, 16/11):
 * a theme sets the personality (fonts, corners, buttons, shadow, borders, labels, heading weight, widget style);
 * a layout sets the structure (menu, frame, cards or blended widgets, spacing). A theme never touches spacing.
 */

export const THEMES = [
  { id: "terminal", name: "Terminal", text: "Dense, data first, dark", summary: "Mono labels, sharp corners, compact", img: "/onboarding/look-terminal.webp" },
  { id: "atelier", name: "Atelier", text: "Editorial, calm, light", summary: "Serif headings, soft cards, airy", img: "/onboarding/look-atelier.webp" },
  { id: "pulse", name: "Pulse", text: "Bold, community first", summary: "Bold type, pill buttons, deep shadows", img: "/onboarding/look-pulse.webp" },
] as const satisfies readonly { id: TemplateId; name: string; text: string; summary: string; img: string }[]

/** The two ready-made looks of a theme (its variations). */
export const looksOf = (template: TemplateId) => LOOKS.filter((l) => l.template === template)

/** What picking a look writes: the template and the personality, never the spacing (that is the layout's). */
export function lookPatch(look: Look, withSpacing = false): ThemeDraft {
  const { density, ...rest } = look.set
  return { template: look.template, ...rest, ...(withSpacing ? { density } : {}) }
}

/** The look the theme matches in everything a theme owns, or none: the coach changed something by hand (Custom). */
export function matchLook(t: CoachTheme): Look | undefined {
  return LOOKS.find(
    (l) =>
      l.template === t.template &&
      l.set.radius === t.radius &&
      l.set.buttonShape === t.buttonShape &&
      l.set.shadow === t.shadow &&
      l.set.borders === t.borders &&
      l.set.labelStyle === t.labelStyle &&
      l.set.headingWeight === t.headingWeight &&
      l.set.widgetStyle === widgetStyleOf(t) &&
      l.set.fonts.heading === t.fonts.heading &&
      l.set.fonts.body === t.fonts.body &&
      l.set.fonts.label === t.fonts.label,
  )
}

export type Layout = { id: string; name: string; text: string; img: string; nav: "side" | "top"; floating: boolean; set: "cards" | "open"; density?: CoachTheme["density"] }
export const LAYOUTS: Layout[] = [
  { id: "side", name: "Side menu · Cards", text: "Menu on the left, widgets in cards", img: "/onboarding/layout-side.webp", nav: "side", floating: false, set: "cards" },
  { id: "top", name: "Top menu · Cards", text: "Menu in the header, cards", img: "/onboarding/layout-top.webp", nav: "top", floating: false, set: "cards" },
  { id: "floating", name: "Floating · Compact", text: "Floating page, dense widgets", img: "/onboarding/layout-floating.webp", nav: "side", floating: true, set: "cards", density: "compact" },
  { id: "blended", name: "Top menu · Blended", text: "Header menu, open widgets, airy", img: "/onboarding/layout-blended.webp", nav: "top", floating: false, set: "open", density: "airy" },
]

/** The layout the theme matches: the menu, whether the page floats, and how widgets sit. */
export const layoutOf = (t: CoachTheme) => LAYOUTS.find((l) => l.nav === t.nav.layout && l.floating === (t.nav.frame === "floating") && l.set === (t.widgetSet === "open" ? "open" : "cards"))?.id

/** What picking a layout writes. Cards layouts go back to the theme's own spacing; the other two set theirs. A header menu always names its pages. */
export function layoutPatch(l: Layout, theme: CoachTheme): ThemeDraft {
  const density = l.density ?? looksOf(theme.template)[0]?.set.density ?? theme.density
  const style = l.nav === "top" ? "labels" : (TEMPLATES[theme.template]?.theme.nav.style ?? theme.nav.style)
  return { nav: { layout: l.nav, style, frame: l.floating ? "floating" : "classic" }, widgetSet: l.set, density }
}
