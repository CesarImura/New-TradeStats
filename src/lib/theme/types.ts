import type { FontId } from "@/lib/fonts"

export type Mode = "light" | "dark"

/** One colour set. Every template ships a light and a dark one. */
export type Palette = {
  background: string
  card: string
  foreground: string
  muted: string // subtle surfaces: hover, tracks, secondary buttons
  mutedForeground: string
  border: string
  sidebar: string
  /** Second brand colour for highlights, e.g. TradeStats yellow. */
  highlight: string
  highlightForeground: string
  profit: string
  loss: string
}

export type ButtonShape = "square" | "rounded" | "pill"
export type Shadow = "none" | "soft" | "strong"
export type Density = "compact" | "comfortable" | "airy"
export type NavLayout = "side" | "top"
export type NavStyle = "labels" | "icons"
export type BackgroundStyle = "plain" | "grid" | "glow"

/** Everything a coach can change about the look of their platform. */
export type CoachTheme = {
  template: TemplateId
  mode: Mode
  palettes: Record<Mode, Palette>
  primary: string
  primaryForeground: string
  /** Replaces the template's highlight colour. */
  highlight?: string
  radius: number // px, for cards, inputs, menus
  buttonShape: ButtonShape
  shadow: Shadow
  borders: boolean
  density: Density
  fonts: { heading: FontId; body: FontId; label: FontId }
  /** Small labels above headings: plain, or mono uppercase like TradeStats. */
  labelStyle: "plain" | "caps"
  headingWeight: 400 | 500 | 600 | 700
  background: BackgroundStyle
  nav: { layout: NavLayout; style: NavStyle; logo: "left" | "center" }
}

export type TemplateId = "terminal" | "atelier" | "pulse"
