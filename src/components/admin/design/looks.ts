import type { ThemeDraft } from "@/lib/prototype-store"
import type { CoachTheme, TemplateId } from "@/lib/theme/types"

/**
 * Ready-made looks: one choice that sets the template, fonts, shape, depth and
 * spacing together, so a coach gets a finished design without touching
 * individual settings. The coach's colours, logo, light/dark, menu and
 * background stay as they are. Fine-tuning and Advanced change the parts.
 */
export type Look = {
  id: string
  name: string
  blurb: string
  template: TemplateId
  set: Required<Pick<ThemeDraft, "radius" | "buttonShape" | "shadow" | "borders" | "density" | "labelStyle" | "headingWeight" | "widgetStyle">> & {
    fonts: CoachTheme["fonts"]
  }
}

export const LOOKS: Look[] = [
  {
    id: "terminal",
    name: "Terminal",
    blurb: "Crisp, dense, mono labels",
    template: "terminal",
    set: { widgetStyle: "instrument", radius: 6, buttonShape: "rounded", shadow: "none", borders: true, density: "compact", labelStyle: "caps", headingWeight: 400, fonts: { heading: "archivo", body: "archivo", label: "space-mono" } },
  },
  {
    id: "desk",
    name: "Trading desk",
    blurb: "Sharp and clean, plain labels",
    template: "terminal",
    set: { widgetStyle: "instrument", radius: 4, buttonShape: "square", shadow: "none", borders: true, density: "compact", labelStyle: "plain", headingWeight: 500, fonts: { heading: "barlow-condensed", body: "plex", label: "jetbrains-mono" } },
  },
  {
    id: "atelier",
    name: "Atelier",
    blurb: "Calm, serif headings, soft cards",
    template: "atelier",
    set: { widgetStyle: "editorial", radius: 12, buttonShape: "rounded", shadow: "soft", borders: false, density: "airy", labelStyle: "plain", headingWeight: 400, fonts: { heading: "fraunces", body: "schibsted", label: "schibsted" } },
  },
  {
    id: "elegant",
    name: "Elegant",
    blurb: "Fine serif, lots of air",
    template: "atelier",
    set: { widgetStyle: "editorial", radius: 8, buttonShape: "rounded", shadow: "none", borders: true, density: "airy", labelStyle: "caps", headingWeight: 400, fonts: { heading: "instrument-serif", body: "schibsted", label: "fragment-mono" } },
  },
  {
    id: "pulse",
    name: "Pulse",
    blurb: "Bright, pill buttons, deep shadows",
    template: "pulse",
    set: { widgetStyle: "soft", radius: 16, buttonShape: "pill", shadow: "strong", borders: false, density: "comfortable", labelStyle: "plain", headingWeight: 700, fonts: { heading: "familjen", body: "schibsted", label: "familjen" } },
  },
  {
    id: "friendly",
    name: "Friendly",
    blurb: "Round and soft, easy to read",
    template: "pulse",
    set: { widgetStyle: "soft", radius: 14, buttonShape: "rounded", shadow: "soft", borders: false, density: "comfortable", labelStyle: "plain", headingWeight: 600, fonts: { heading: "schibsted", body: "schibsted", label: "schibsted" } },
  },
]

/** The look the theme currently matches exactly, if any (after fine-tuning it's "Custom"). */
export function currentLook(t: CoachTheme): Look | undefined {
  return LOOKS.find(
    (l) =>
      l.template === t.template &&
      l.set.radius === t.radius &&
      l.set.buttonShape === t.buttonShape &&
      l.set.shadow === t.shadow &&
      l.set.density === t.density &&
      l.set.fonts.heading === t.fonts.heading &&
      l.set.fonts.body === t.fonts.body,
  )
}

