import type { LucideIcon } from "@/components/icons"
import { isPageId, type ModuleId } from "@/lib/data/coaches"
import { COLS, type PageId } from "@/lib/widgets/layout"
import type { WidgetProps } from "./parts/shared"
import { BASE_WIDGETS } from "./registry-widgets"
import { CORE_WIDGETS } from "./registry-core"
import { NOTE_IGNORED, noteExtraPx } from "./note-extra"
import type { WidgetNote } from "@/lib/widgets/layout"

export type WidgetGroup = "Learning" | "Calendar" | "Journal" | "Coaching" | "Progress" | "Community" | "Your content" | "Coach and brand" | "AI" | "Page"

export type Setting = (
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "textarea"; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "toggle"; defaultOn?: boolean }
  /** An uploaded picture: `props[key]` is a data URL, or empty for the sample picture. */
  | { key: string; label: string; type: "image" }
  /** A list of cards or slides the coach adds, edits, hides and orders (catalog/media-data.ts MediaEntry, as JSON in `props[key]`). */
  | { key: string; label: string; type: "cards"; kind: "shelf" | "hero"; max: number }
) & {
  /** Only offered for these layouts. */
  variants?: string[]
  /** Drawn only when the widget shows More (Detailed), in these layouts: the inspector offers it there and then. */
  more?: string[]
  /** Offered only while another setting of this widget has this value ("Time on each step" only when the cards move on their own). */
  when?: { key: string; value: string }
}

/** Whether a setting's `when` holds for these props (an unset setting counts as its first option). */
export const settingApplies = (def: WidgetDef, s: Setting, props: Record<string, string | boolean> = {}) => {
  if (!s.when) return true
  const w = s.when
  const other = (def.settings ?? []).find((o) => o.key === w.key)
  const fallback = other?.type === "select" ? other.options[0].value : ""
  return String(props[w.key] ?? fallback) === w.value
}

/** The settings a layout offers. */
export const settingsFor = (def: WidgetDef, variant?: string) => (def.settings ?? []).filter((s) => !s.variants || s.variants.includes(variant ?? def.variants[0].value))

export type WidgetDef = {
  type: string
  name: string
  description: string
  group: WidgetGroup
  icon: LucideIcon
  /** Only offered, and only shown to students, when this module is on. */
  module?: ModuleId
  /** A page's core widget: always on that page, never in the library, can't be removed or duplicated. */
  core?: ModuleId
  /**
   * Three or more designs per widget; the first is the default. Each has its own height in rows and the box it
   * looks right in: the shortest and narrowest before it gets squeezed, the tallest and widest before it only
   * stretches. Measured on the old stress bench (every width at its height, every height at its default
   * width, sample and long content), then judged; the builder keeps it inside.
   */
  variants: { value: string; label: string; h: number; minH: number; maxH: number; minW: number; maxW: number; /** More rows when narrower than `below` columns (a layout that stacks there). */ narrow?: { below: number; minH: number; /** Measured in px, when the card's width is known (see CardBox): applies when the card is narrower than this. `below` (columns) is the fallback when it is not known. */ cardBelow?: number; /** Same, for the width the content has (the card less its padding). */ contentBelow?: number; /** Rows at Compact and Detailed when they differ from `minH` (as `hd` does for the layout). */ hd?: { compact?: number; detailed?: number } }; /** Fewer rows from `from` columns up (a layout that lies flat there). */ wide?: { from: number; maxH: number; /** Rows at Compact and Detailed when they differ from `maxH`. */ hd?: { compact?: number; detailed?: number } }; /** Fewer rows when narrower than `below` columns (a part, like a picture, is dropped there). */ slim?: { below: number; maxH: number }; /** Rows at Compact and Detailed when they differ from `h` and `h + DETAILED_EXTRA_ROWS`: measured so the card is as tall as what it shows. */ hd?: { compact?: number; detailed?: number } }[]
  settings?: Setting[]
  /** Width in columns when added, and the narrowest it can go before its content breaks. */
  defaultW: number
  minW: number
  Component: (p: WidgetProps) => React.ReactNode
}


/** Every widget: the originals, those added in the library, then each page's own tool. */
export const WIDGETS: WidgetDef[] = [...BASE_WIDGETS, ...CORE_WIDGETS]

/** Widgets offered first on each module page; Home offers every widget. */
export const PAGE_WIDGETS: Record<ModuleId, string[]> = {
  courses: ["continue-lesson", "course-progress", "shelf"],
  calendar: ["next-live", "econ-news", "watchlist", "book-call"],
  charts: ["econ-news", "journal-pnl", "watchlist", "open-positions"],
  journal: ["journal-pnl", "rules-followed", "drawdown", "recent-trades", "open-positions", "r-distribution", "pnl-by-instrument", "pnl-by-weekday", "win-rate-trend", "check-in", "goals", "trading-streak", "coach-feedback", "ai-ask"],
  community: ["discord", "community-feed", "announcement", "my-rank"],
  ranking: ["my-rank", "leaderboard", "first-week"],
  ai: ["ai-ask"],
  downloads: ["latest-downloads"],
  partners: ["partner-links"],
}
/** Widgets that make sense on any page. */
export const ANYWHERE = ["page-header", "text", "image", "button", "banner", "embed", "hero", "faq", "links", "countdown", "welcome-video", "announcement", "upgrade", "partner-links", "latest-downloads", "coach-profile", "book-call", "shelf"]

/** The library for a page, in sections. Home: by group, as before. */
export function librarySections(page: PageId): { title: string; types: string[] }[] {
  const all = WIDGETS.filter((w) => !w.core)
  if (page === "home") return WIDGET_GROUPS.map((g) => ({ title: g, types: all.filter((w) => w.group === g).map((w) => w.type) }))
  if (isPageId(page)) {
    const mine = all.filter((w) => w.group === "Your content").map((w) => w.type)
    const anywhere = ANYWHERE.filter((t) => !mine.includes(t))
    const shown = new Set([...mine, ...anywhere])
    return [
      { title: "Your content", types: mine },
      { title: "Anywhere", types: anywhere },
      ...WIDGET_GROUPS.filter((g) => g !== "Your content").map((g) => ({ title: g, types: all.filter((w) => w.group === g && !shown.has(w.type)).map((w) => w.type) })),
    ]
  }
  const own = PAGE_WIDGETS[page]
  return [
    { title: "For this page", types: own },
    { title: "Anywhere", types: ANYWHERE.filter((t) => !own.includes(t)) },
  ]
}

export const WIDGET_GROUPS: WidgetGroup[] = ["Your content", "Learning", "Calendar", "Journal", "Coaching", "Progress", "Community", "Coach and brand", "AI"]

export const getWidget = (type: string) => WIDGETS.find((w) => w.type === type)

/** Height rules for a widget in a given look. */
export function lookOf(def: WidgetDef, variant?: string) {
  return def.variants.find((v) => v.value === variant) ?? def.variants[0]
}

/** The widths a page offers, in grid columns: one column, two of three, the whole page. */
export const PAGE_WIDTHS = [4, 8, COLS]

/** The page width a saved `w` draws at: 4 to 7 is one column, 8 to 11 two of three, 12 the whole page. */
export const pageWidth = (w: number) => (w >= COLS ? COLS : w >= 8 ? 8 : 4)

const nearest = (list: number[], to: number) => list.reduce((a, b) => (Math.abs(b - to) < Math.abs(a - to) ? b : a))

/** The page widths a widget's layout allows (its minW to maxW), or the nearest one when none falls inside. */
export function widthsFor(def: WidgetDef, variant?: string) {
  const { minW, maxW } = lookOf(def, variant)
  const ok = PAGE_WIDTHS.filter((w) => w >= minW && w <= maxW)
  return ok.length ? ok : [nearest(PAGE_WIDTHS, minW)]
}

/** The page width closest to `w` that the layout allows. Adding, dropping, resizing and changing layout all go through it. */
export const fitWidth = (def: WidgetDef, variant: string | undefined, w: number) => {
  const ok = widthsFor(def, variant)
  return ok.includes(pageWidth(w)) ? pageWidth(w) : nearest(ok, pageWidth(w))
}

/** Standard height for a widget's look, used when converting older layouts. */
export function heightOf(w: { type: string; variant?: string }) {
  const def = getWidget(w.type)
  return def ? lookOf(def, w.variant).h : 4
}

/** Rows a Detailed widget gets on top of its layout's height: room for the extra list or stats. */
export const DETAILED_EXTRA_ROWS = 2

/**
 * The card a height is asked for, in px: its outer width (what the container queries see) and the padding of its body
 * (1rem × the theme's density). Worked out from the page's layout (span × column width + gaps), never measured on the card.
 */
export type CardBox = { width: number; pad: number }

/** Whether a layout that stacks when narrow is stacked in this card: by its measured width when it has `cardBelow` or `contentBelow` and the box is known, else by the preset's columns. */
const isNarrow = (n: NonNullable<WidgetDef["variants"][number]["narrow"]>, cols: number, box?: CardBox) => {
  if (box && (n.cardBelow !== undefined || n.contentBelow !== undefined)) return (n.cardBelow !== undefined && box.width < n.cardBelow) || (n.contentBelow !== undefined && box.width - 2 * box.pad < n.contentBelow)
  return cols < n.below
}

/**
 * Rows a coach's note adds to a card (`note`), in half rows of `row` px (a row plus its gap): the note's px (note-extra.ts)
 * rounded up to the half row, so the card keeps the grid's rhythm. Nothing for the page's own tools and for layouts that draw no note.
 */
export function noteRows(def: WidgetDef, variant: string | undefined, note: WidgetNote | undefined, width: number, row: number) {
  if (def.core || NOTE_IGNORED.has(`${def.type}|${lookOf(def, variant).value}`)) return 0
  const px = noteExtraPx(note, width)
  return px > 0 ? Math.ceil(px / (row / 2)) / 2 : 0
}

/** Standard height for a widget's layout at a given Detail. `withNote`: the card's own note and the px of a row, to make room for the note (the three-column page, where `box` is known). */
export function heightFor(def: WidgetDef, variant?: string, detail?: "compact" | "standard" | "detailed", cols?: number, box?: CardBox, withNote?: { note?: WidgetNote; row: number }) {
  return heightWithoutNote(def, variant, detail, cols, box) + (box && withNote ? noteRows(def, variant, withNote.note, box.width, withNote.row) : 0)
}

function heightWithoutNote(def: WidgetDef, variant?: string, detail?: "compact" | "standard" | "detailed", cols?: number, box?: CardBox) {
  const v = lookOf(def, variant)
  const rows = detail === "detailed" ? (v.hd?.detailed ?? v.h + DETAILED_EXTRA_ROWS) : detail === "compact" ? (v.hd?.compact ?? v.h) : v.h
  // A layout that stacks when narrow needs more rows there, and one that lies flat when wide needs fewer (`cols` = the card's width in grid columns).
  if (cols !== undefined && v.narrow && isNarrow(v.narrow, cols, box)) return Math.max(rows, (detail === "detailed" ? v.narrow.hd?.detailed : detail === "compact" ? v.narrow.hd?.compact : undefined) ?? v.narrow.minH)
  if (cols !== undefined && v.wide && cols >= v.wide.from) {
    const own = detail === "detailed" ? v.wide.hd?.detailed : detail === "compact" ? v.wide.hd?.compact : undefined
    return own ?? Math.min(rows, v.wide.maxH)
  }
  if (cols !== undefined && v.slim && cols < v.slim.below) return Math.min(rows, v.slim.maxH)
  return rows
}

/**
 * Which parts of a widget's own style apply to it (Design → This widget → Style). A picture behind the card only on
 * content widgets: on charts, tables and figures it would fight the data, so data widgets take a tone only. Image,
 * Embed and Welcome video are a picture or a player already. Charts and Numbers show only where the widget draws a
 * bar or gauge, or a headline figure.
 */
const IMAGE_OK = new Set(["page-header", "banner", "hero", "text", "button", "countdown", "faq", "links", "announcement", "continue-lesson", "course-progress", "latest-downloads", "partner-links", "coach-profile", "upgrade", "discord"])
const HAS_CHART = new Set(["continue-lesson", "course-progress", "next-live", "econ-news", "rules-followed", "first-week", "announcement", "discord", "welcome-video", "ai-ask", "book-call", "drawdown", "coach-feedback", "upgrade"])
const HAS_FIGURE = new Set(["course-progress", "next-live", "econ-news", "journal-pnl", "rules-followed", "my-rank", "discord", "book-call", "drawdown", "coach-feedback", "upgrade", "coach-profile"])
export const styleParts = (type: string) => ({ image: IMAGE_OK.has(type), chart: HAS_CHART.has(type), figure: HAS_FIGURE.has(type) })

