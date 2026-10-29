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
/** How widgets are drawn: Instrument (mono figures, tick charts, inset panels), Soft (rounded, one surface), Editorial (heading font, hairlines). */
export type WidgetStyle = "instrument" | "soft" | "editorial"
/** How bars and gauges are drawn: Ticks (segments), Solid (one filled bar), Thin (a hairline), Blocks (a few thick rounded segments), Dots (a row of small squares). */
export type ChartStyle = "ticks" | "solid" | "thin" | "blocks" | "dots"
/** The font for widget figures and small labels: mono, the heading font, or the body ("normal") font. */
export type WidgetFont = "mono" | "heading" | "body"
/** Which parts of a widget's header show: the icon, the title, the grey description line under it, and the value chip on the right. */
export type WidgetHeader = { icon: boolean; title: boolean; description: boolean; value: boolean }
/** How widgets sit on the page: Cards (one card each), Sheet (one surface split by hairlines), Open (no box, a hairline above each). */
export type WidgetSet = "cards" | "sheet" | "open"
/**
 * Where the widget's name sits and how it reads: Top (icon, title, chip), Label (a small label line, no icon tile),
 * Caption (under the content, like a caption), Tag (the icon in a tile and the name in a pill) or Path
 * ("Journal / Performance", a hairline under it).
 */
export type HeaderForm = "top" | "label" | "caption" | "tag" | "path"
/** How the headline number is drawn: Plain, Marked (a bar in the accent beside it, the change in two lines), Mono, or Display (the heading font, the change under it). */
export type FigureStyle = "plain" | "marked" | "mono" | "display"
/** Whether a widget's chart and small stats sit on an inner panel: None, Filled (a step darker or lighter than the card) or Outline (a hairline box). */
export type PanelStyle = "none" | "filled" | "outline"
/** The Star widget: on the brand colour, or Inverted (the text colour as the card, the brand only as one mark). */
export type StarStyle = "brand" | "inverted" | "spotlight"
/** A fine finishing touch: none, corner brackets on each widget, or a grid of crosses on the page behind the widgets. */
export type WidgetFinish = "none" | "corners" | "grid"
/** Cards: Raised (the card colour, as the template has it), Grey (a grey card on the page), Outline (no fill, a hairline). */
export type CardSurface = "raised" | "grey" | "outline"
/** Plain, a texture (grid, glow, dots), a gradient from the brand colours, or an image. */
export type BackgroundStyle = "plain" | "grid" | "glow" | "dots" | "gradient" | "image"

/** Everything a coach can change about the look of their platform. */
export type CoachTheme = {
  template: TemplateId
  mode: Mode
  palettes: Record<Mode, Palette>
  primary: string
  primaryForeground: string
  /** Replaces the template's highlight colour. */
  highlight?: string
  /** Greys: tinted towards the brand colour (default), the template's own, or pure grey. */
  tint?: "brand" | "template" | "none"
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
  /** Image background: an uploaded image (data URL) or a library one ("preset:<id>"). */
  bgImage?: string
  /** How much the page colour covers the image or gradient, 0–100. Never below the readability minimum. */
  bgDim?: number
  bgBlur?: number
  /** Where the image or gradient shows. */
  bgWhere?: "all" | "home" | "login"
  bgAngle?: number
  /** How much depth widgets get from the brand colour: gradients, glow, texture. */
  effects: "flat" | "soft" | "vivid"
  /** frame: classic (the menu and the page are one surface) or floating (the page sits on a rounded canvas on the menu's ground, like the admin). */
  nav: { layout: NavLayout; style: NavStyle; logo: "left" | "center"; frame?: "classic" | "floating" }
  /** Widget style; each template has a default (widgetStyleOf). */
  widgetStyle?: WidgetStyle
  /** Defaults from the widget style (chartStyleOf). */
  chartStyle?: ChartStyle
  /** Defaults from the widget style (widgetFontOf). */
  widgetFont?: WidgetFont
  /** Header parts for every widget; each widget can override them. Defaults: all on, but no icon in Editorial. */
  widgetHeader?: Partial<WidgetHeader>
  /** Defaults from the widget style (widgetSetOf). */
  widgetSet?: WidgetSet
  /** Defaults from the widget style (headerFormOf). */
  headerForm?: HeaderForm
  /** Defaults from the widget style (figureStyleOf). */
  figureStyle?: FigureStyle
  /** Defaults from the widget style (panelStyleOf). */
  panelStyle?: PanelStyle
  /** Defaults from the widget style (starStyleOf). */
  starStyle?: StarStyle
  /** Defaults from the widget style (widgetFinishOf). */
  widgetFinish?: WidgetFinish
  cardSurface?: CardSurface
  /**
   * The coach's own profit and loss colours (hex). They replace the template palette's in both modes.
   * Empty strings mean "not set" (that is how the editor resets them, so the reset survives a save).
   */
  trading?: { profit: string; loss: string }
}

const WIDGET_STYLE_DEFAULT: Record<TemplateId, WidgetStyle> = { terminal: "instrument", atelier: "editorial", pulse: "soft" }
export const widgetStyleOf = (t: Pick<CoachTheme, "template" | "widgetStyle">): WidgetStyle => t.widgetStyle ?? WIDGET_STYLE_DEFAULT[t.template]

const CHART_STYLE_DEFAULT: Record<WidgetStyle, ChartStyle> = { instrument: "ticks", soft: "blocks", editorial: "thin" }
export const chartStyleOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "chartStyle">): ChartStyle => t.chartStyle ?? CHART_STYLE_DEFAULT[widgetStyleOf(t)]

const WIDGET_FONT_DEFAULT: Record<WidgetStyle, WidgetFont> = { instrument: "mono", soft: "heading", editorial: "heading" }
export const widgetFontOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "widgetFont">): WidgetFont => t.widgetFont ?? WIDGET_FONT_DEFAULT[widgetStyleOf(t)]

const WIDGET_SET_DEFAULT: Record<WidgetStyle, WidgetSet> = { instrument: "sheet", soft: "cards", editorial: "open" }
/** Open widgets have no surface of their own, so on an image or gradient background they sit on a sheet: text never sits on a picture. */
export const widgetSetOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "widgetSet" | "background">): WidgetSet => {
  const set = t.widgetSet ?? WIDGET_SET_DEFAULT[widgetStyleOf(t)]
  return set === "open" && (t.background === "image" || t.background === "gradient") ? "sheet" : set
}

const HEADER_FORM_DEFAULT: Record<WidgetStyle, HeaderForm> = { instrument: "path", soft: "tag", editorial: "caption" }
export const headerFormOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "headerForm">): HeaderForm => t.headerForm ?? HEADER_FORM_DEFAULT[widgetStyleOf(t)]

const FIGURE_STYLE_DEFAULT: Record<WidgetStyle, FigureStyle> = { instrument: "mono", soft: "marked", editorial: "display" }
/** A theme saved before Figure style existed keeps its Widget font: mono figures stay mono. */
export const figureStyleOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "widgetFont" | "figureStyle">): FigureStyle =>
  t.figureStyle ?? (t.widgetFont === "mono" ? "mono" : FIGURE_STYLE_DEFAULT[widgetStyleOf(t)])

const PANEL_STYLE_DEFAULT: Record<WidgetStyle, PanelStyle> = { instrument: "outline", soft: "filled", editorial: "none" }
export const panelStyleOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "panelStyle">): PanelStyle => t.panelStyle ?? PANEL_STYLE_DEFAULT[widgetStyleOf(t)]

const STAR_STYLE_DEFAULT: Record<WidgetStyle, StarStyle> = { instrument: "spotlight", soft: "spotlight", editorial: "inverted" }
export const starStyleOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "starStyle">): StarStyle => t.starStyle ?? STAR_STYLE_DEFAULT[widgetStyleOf(t)]

const FINISH_DEFAULT: Record<WidgetStyle, WidgetFinish> = { instrument: "corners", soft: "none", editorial: "none" }
export const widgetFinishOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "widgetFinish">): WidgetFinish => t.widgetFinish ?? FINISH_DEFAULT[widgetStyleOf(t)]

/** The header parts a widget shows: the style's default, then the coach's choice for all widgets, then the widget's own. */
export const widgetHeaderOf = (t: Pick<CoachTheme, "template" | "widgetStyle" | "widgetHeader">, own?: Partial<WidgetHeader>): WidgetHeader => ({
  icon: widgetStyleOf(t) !== "editorial",
  title: true,
  description: true,
  value: true,
  ...t.widgetHeader,
  ...own,
})

export type TemplateId = "terminal" | "atelier" | "pulse"
