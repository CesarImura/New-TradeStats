"use client"

import { useContext, useMemo } from "react"
import { CoachContext } from "@/components/coach/coach-provider"
import { pictureOf, widgetDimOf } from "@/lib/theme/backdrops"
import { themeVars } from "@/lib/theme/css"
import { mixHex, resolveColors } from "@/lib/theme/derive"
import type { CoachTheme } from "@/lib/theme/types"
import type { Emphasis, WidgetOwnStyle } from "@/lib/widgets/layout"
import { WidgetPictureContext, type WidgetPicture } from "./kit"
import { styleParts } from "./registry"

/** Numbers sets the widget font as All widgets → Numbers does: Mono figures and labels, or the heading or body font. */
const FONT_OF = { plain: "body", marked: "heading", display: "heading", mono: "mono" } as const

/** How much of the brand or highlight colour goes into the card for a tone: enough to see, little enough to stay a card. */
const TONE_MIX = { light: 0.12, dark: 0.16 }

/** The variables one widget re-sets: its card and everything worked out on it (the surface ladder, readable text and marks). */
const KEYS = ["--card", "--card-foreground", "--muted-foreground", "--w-panel", "--w-track", "--w-hair", "--card-shadow", "--card-edge", "--brand-text", "--profit-text", "--loss-text", "--inv-bg", "--inv-fg", "--inv-accent"]

/** The theme as this widget draws it: All widgets, then the widget's own style. */
export function ownTheme(theme: CoachTheme, type: string, style: WidgetOwnStyle | undefined, emphasis?: Emphasis): CoachTheme {
  if (!style) return theme
  const parts = styleParts(type)
  const t: CoachTheme = { ...theme }
  if (style.surface) t.cardSurface = style.surface
  if (style.headerForm) t.headerForm = style.headerForm
  if (style.chartStyle && parts.chart) t.chartStyle = style.chartStyle
  if (style.figureStyle && parts.figure) {
    t.figureStyle = style.figureStyle
    t.widgetFont = FONT_OF[style.figureStyle]
  }
  // The Star keeps its own surface: a tone or a picture would take away what makes it the one Star.
  const filled = emphasis !== "star" && (!!style.tone || (!!style.image && parts.image))
  // A tone or a picture fills the card, so an Outline card gets the card colour under it.
  if (filled && (t.cardSurface ?? "raised") === "outline") t.cardSurface = "raised"
  if (style.tone && emphasis !== "star") {
    // The tone starts from the card as it is drawn (a Grey card included), then fills it as a raised card does.
    const p = resolveColors(t)
    const grey = t.cardSurface === "grey" && p.foreground.startsWith("#") && p.background.startsWith("#")
    if (grey) p.card = mixHex(p.background, p.foreground, t.mode === "dark" ? 0.07 : 0.05)
    t.cardSurface = "raised"
    t.cardTone = mixHex(p.card, style.tone === "brand" ? t.primary : p.highlight, TONE_MIX[t.mode])
  }
  return t
}

/**
 * Draws one widget with its own style (WidgetInstance.style): the card, names, charts and numbers it chose
 * instead of All widgets, a tone of the theme, or a picture under the card colour. Hooks inside read the
 * widget's theme; the CSS variables of its card are re-set on a wrapper that takes no space.
 */
export function WidgetStyleScope({ type, style, emphasis, children }: { type: string; style?: WidgetOwnStyle; emphasis?: Emphasis; children: React.ReactNode }) {
  const ctx = useContext(CoachContext)
  const theme = ctx?.theme
  const own = useMemo(() => (theme ? ownTheme(theme, type, style, emphasis) : undefined), [theme, type, style, emphasis])
  const vars = useMemo(() => {
    if (!own || own === theme) return null
    const all = themeVars(own)
    const vars = Object.fromEntries(KEYS.map((k) => [k, all[k]]))
    // A tone changes the card's colour, not how it stands: shadow and edge stay those of its own surface (a Grey card stays flat).
    if (own.cardTone) {
      const surface = themeVars({ ...own, cardTone: undefined, cardSurface: style?.surface ?? theme?.cardSurface })
      vars["--card-shadow"] = surface["--card-shadow"]
      vars["--card-edge"] = surface["--card-edge"]
    }
    return vars as React.CSSProperties
  }, [own, theme, style?.surface])
  const image = style?.image
  const dim = style?.dim
  const picture = useMemo<WidgetPicture | null>(
    () => (image && emphasis !== "star" && styleParts(type).image ? { style: pictureOf(image), dim: widgetDimOf(dim) } : null),
    [image, dim, emphasis, type],
  )
  if (!ctx || !own || !vars) return <>{children}</>
  return (
    <CoachContext.Provider value={{ ...ctx, theme: own }}>
      <WidgetPictureContext.Provider value={picture}>
        <div className="contents" style={vars}>
          {children}
        </div>
      </WidgetPictureContext.Provider>
    </CoachContext.Provider>
  )
}
