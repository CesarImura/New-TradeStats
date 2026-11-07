import type { Coach, ModuleId } from "@/lib/data/coaches"
import { TEMPLATES } from "@/lib/theme/templates"
import type { CardSurface, ChartStyle, Density, FigureStyle, HeaderForm, TemplateId, WidgetHeader } from "@/lib/theme/types"

/**
 * A page's layout is saved as free cards (`tiles: true`): every card has its own rectangle on the page, `x` and `w` in 12ths of the
 * page width, `y` and `h` in rows of ROW_HEIGHT (half rows count), top to bottom. Between two bands (the page title, a page's own
 * tool) the cards of a block never overlap and may leave empty space; a block is as tall as its lowest card. The desktop page draws
 * exactly those numbers (widgets/page-grid.ts, page-renderer.tsx). The coach drags a card's edge or corner and only that card changes:
 * a card it grows into slides down, as little as needed, and nothing else moves; shrinking leaves empty space, which "Fill gaps"
 * closes. A student who doesn't see a card (phase, group, module) gets its block closed up. Tablets and phones stack the cards in the
 * order of `items` when `ordered` (see stackOrder), each as tall as its content.
 *
 * Layouts saved before (and the TEMPLATES) have no `tiles` flag: they were a masonry, their h only steered estimates and a w of 4 to
 * 7 drew as one column. They are turned into tiles when drawn, and the editor saves `tiles: true` on its first edit.
 */
export const COLS = 12
export const ROW_HEIGHT = 56
/** Space between cells follows the theme's spacing setting. */
export const GAP: Record<Density, number> = { compact: 16, comfortable: 24, airy: 32 }

/** How much a widget stands out: Quiet (no colour), Accent (one mark in the brand colour), Star (on the brand colour; one per page). */
export type Emphasis = "quiet" | "accent" | "star"
/** How much a widget shows. */
export type Detail = "compact" | "standard" | "detailed"

/** The coach's own content on a widget: a short text with a button, and a picture. */
export type WidgetNote = {
  text?: string
  button?: string
  /** A page id ("courses", "calendar", …) or "url" (then `url` holds the address). */
  target?: string
  url?: string
  /** A data URL. */
  image?: string
}

/** Who sees a widget. Unset means everyone. */
export type WidgetPhase = "first-week" | "inactive" | "finished"
export type WidgetShow = { phase?: WidgetPhase; group?: string }

/** A tone of the theme a widget's card can take instead of the card colour: a touch of the brand or of the highlight. */
export type WidgetTone = "brand" | "highlight"

/**
 * This widget's own style (Design → Pages → This widget → Style). Unset parts follow All widgets. A tone or a
 * picture fills the card; a picture only on content widgets (registry canHaveImage) and always under the card
 * colour (dim, never below MIN_WIDGET_DIM), so text stays readable. The Star widget keeps its own surface.
 */
export type WidgetOwnStyle = {
  /** A card surface, or "blended": this widget sits straight on the page (no box, no line) whatever All widgets says. */
  surface?: CardSurface | "blended"
  headerForm?: HeaderForm
  chartStyle?: ChartStyle
  figureStyle?: FigureStyle
  tone?: WidgetTone
  /** A data URL or a library picture ("preset:<id>"). */
  image?: string
  /** How much the card colour covers the picture, 0–100. */
  dim?: number
}

export type WidgetInstance = {
  id: string
  type: string
  variant?: string
  emphasis?: Emphasis
  detail?: Detail
  /** This widget's own header parts (icon, title, description, value); unset parts follow Design → Look. */
  header?: Partial<WidgetHeader>
  /** The coach's own text, button and picture, shown with the widget's data. */
  note?: WidgetNote
  /** Show it only to a phase of the student's life, or to one group. */
  show?: WidgetShow
  /** This widget's own style; unset parts follow All widgets. */
  style?: WidgetOwnStyle
  x: number
  y: number
  w: number
  h: number
  props?: Record<string, string | boolean>
  hideOnPhone?: boolean
}

export type PageLayout = {
  items: WidgetInstance[]
  /** The coach removed the Page title on purpose; don't add it back. */
  titleRemoved?: boolean
  /** Saved as tiles (see the top of this file): x, y, w and h are exact. Unset: a masonry or an earlier grid, turned into tiles when drawn. */
  tiles?: boolean
  /** The phone's own order (widget ids). Unset: phones follow the desktop order. */
  phoneOrder?: string[]
  /** `items` is in the order tablets and phones stack the cards (see stackOrder). Unset: that order is reading order (y, then x), as layouts saved before. */
  ordered?: boolean
}

/** One page's layouts: "default" plus optional per-tier versions. */
export type HomeLayouts = Record<string, PageLayout>

/** Every student page is a widget grid: Home, and one page per module. */
export type PageId = "home" | ModuleId | `page:${string}`
export type PageLayouts = Partial<Record<PageId, HomeLayouts>>

/** The widget holding a module page's own tool (its trades, calendar, chart…). Pinned: it can move and resize, not go. */
export const coreType = (page: ModuleId) => `page-${page}`
/** Rows a page's core widget gets when the page is new. On the live page it grows with its content. */
export const CORE_H = 8

/** A width saved before the half width existed: 4 to 7 drew as one column, 8 to 11 as two, 12 as the page. */
export const legacyWidth = (w: number) => (w >= COLS ? COLS : w >= 8 ? 8 : 4)
/** The cards of a masonry layout with the widths they drew at, so a legacy 6 stays one column now that 6 is a half. */
export const legacyWidths = (items: WidgetInstance[]) => items.map((w) => (w.w === legacyWidth(w.w) ? w : { ...w, w: legacyWidth(w.w) }))

export const uid = () => Math.random().toString(36).slice(2, 10)

/** Reading order: top to bottom, then left to right. */
export const readingOrder = (items: WidgetInstance[]) => [...items].sort((a, b) => a.y - b.y || a.x - b.x)

/**
 * The order tablets and phones stack the cards. A layout saved with `ordered` keeps it in `items`: resizing a card changes y and x
 * but never this order; moving, adding or removing a card does (see placeInOrder). Layouts saved before follow reading order.
 */
export const stackOrder = (l: Pick<PageLayout, "items" | "ordered">) => (l.ordered ? l.items : readingOrder(l.items))

/** The order a phone shows: the phone's own list first, then any widget it doesn't name (new ones) in the stacked order. `items` are already in it (see stackOrder). */
export const phoneSequence = (items: WidgetInstance[], order?: string[]) => {
  if (!order?.length) return items
  const rank = new Map(order.map((id, i) => [id, i]))
  const named = items.filter((w) => rank.has(w.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
  return [...named, ...items.filter((w) => !rank.has(w.id))]
}

/** `items` with card `id` (just moved or added) taken to where reading order puts it: right after the card that comes before it, the others keeping their order. */
export const placeInOrder = (items: WidgetInstance[], id: string) => {
  const card = items.find((w) => w.id === id)
  if (!card) return items
  const rest = items.filter((w) => w.id !== id)
  const before = readingOrder(items).filter((w) => w.id !== id && (w.y < card.y || (w.y === card.y && w.x < card.x)))
  const prev = before[before.length - 1]
  const at = prev ? rest.findIndex((w) => w.id === prev.id) + 1 : 0
  return [...rest.slice(0, at), card, ...rest.slice(at)]
}

type LegacyWidget = { id: string; type: string; variant?: string; span?: number; props?: Record<string, string | boolean>; hideOnPhone?: boolean }
type LegacySection = { widgets?: LegacyWidget[]; slots?: LegacyWidget[][]; columns?: string }

/**
 * Older saved layouts were sections with widths only. Lay their widgets out
 * left to right, wrapping onto new rows, with a standard height.
 */
type Move = { type?: string; variant?: string; emphasis?: Emphasis; detail?: Detail; minW?: number }

/**
 * Widgets merged into others ("*" = any look), so saved pages keep working:
 * they show the widget and look that replaced them.
 */
export const RETIRED: Record<string, Record<string, Move>> = {
  "this-week": { week: { type: "next-live", variant: "week" }, timeline: { type: "next-live", variant: "week" }, list: { type: "next-live", variant: "countdown", detail: "detailed" }, "*": { type: "next-live", variant: "week" } },
  "next-unlock": { countdown: { type: "course-progress", variant: "unlocks", detail: "standard", minW: 4 }, schedule: { type: "course-progress", variant: "unlocks", detail: "detailed", minW: 4 }, card: { type: "course-progress", variant: "unlocks", detail: "compact", minW: 4 }, "*": { type: "course-progress", variant: "unlocks", minW: 4 } },
  "market-sessions": { status: { type: "econ-news", variant: "sessions", detail: "detailed" }, "*": { type: "econ-news", variant: "sessions" } },
  "r-spread": { "*": { type: "journal-pnl", variant: "curve", detail: "detailed" } },
  setups: { "*": { type: "journal-pnl", variant: "curve", detail: "detailed" } },
  "ai-insight": { chart: { type: "ai-ask", variant: "insight", detail: "standard" }, card: { type: "ai-ask", variant: "insight", detail: "detailed" }, compact: { type: "ai-ask", variant: "insight", detail: "compact" }, "*": { type: "ai-ask", variant: "insight" } },
}

/** Looks that were only a colour (now Emphasis) or folded into another look (now Detail). */
export const RETIRED_LOOKS: Record<string, Record<string, Move>> = {
  "course-progress": { dots: { variant: "bars", detail: "standard" } },
  "my-rank": { brand: { variant: "trend", emphasis: "star" } },
  "rules-followed": { ring: { variant: "rules", detail: "compact" } },
  "next-live": { block: { variant: "countdown", emphasis: "star" } },
  "econ-news": { impact: { variant: "week" }, list: { variant: "week" } },
  "book-call": { brand: { variant: "next", emphasis: "star" } },
  announcement: { highlight: { variant: "plain" }, brand: { variant: "plain", emphasis: "star" } },
  discord: { brand: { variant: "online", emphasis: "star" } },
  banner: { brand: { variant: "headline", emphasis: "star" }, highlight: { variant: "headline" }, plain: { variant: "headline" } },
  text: { centered: { variant: "plain" } },
  "ai-ask": { quota: { variant: "search", detail: "detailed" }, brand: { variant: "search", emphasis: "star" } },
}

const apply = (w: WidgetInstance, m: Move): WidgetInstance => ({
  ...w,
  type: m.type ?? w.type,
  variant: m.variant ?? (m.type ? undefined : w.variant),
  emphasis: w.emphasis ?? m.emphasis,
  detail: w.detail ?? m.detail,
  w: Math.max(w.w, m.minW ?? 0),
})

export function upgradeItem(w: WidgetInstance): WidgetInstance {
  const r = RETIRED[w.type]
  const moved = r ? apply(w, r[w.variant ?? ""] ?? r["*"]) : w
  const look = moved.variant ? RETIRED_LOOKS[moved.type]?.[moved.variant] : undefined
  return look ? apply(moved, look) : moved
}

/** Only one Star per page: the newest one wins, earlier ones become Accent. */
export function oneStar(items: WidgetInstance[], keep?: string): WidgetInstance[] {
  const stars = items.filter((w) => w.emphasis === "star")
  if (stars.length <= 1) return items
  const winner = keep ?? stars[stars.length - 1].id
  return items.map((w) => (w.emphasis === "star" && w.id !== winner ? { ...w, emphasis: "accent" } : w))
}

export function normalizeLayout(l: PageLayout | { sections: LegacySection[] }, heightOf: (w: LegacyWidget) => number = () => 4): PageLayout {
  if ("items" in l) {
    const items = oneStar(l.items.map(upgradeItem))
    return { ...l, items: l.tiles ? items : legacyWidths(items) }
  }
  const items: WidgetInstance[] = []
  let x = 0
  let y = 0
  let rowH = 0
  for (const s of l.sections) {
    const widgets = s.widgets ?? (s.slots ?? []).flat()
    if (x > 0) {
      y += rowH
      x = 0
      rowH = 0
    }
    for (const w of widgets) {
      const width = Math.min(COLS, w.span ?? 6)
      if (x + width > COLS) {
        y += rowH
        x = 0
        rowH = 0
      }
      const h = heightOf(w)
      items.push({ id: w.id, type: w.type, variant: w.variant, props: w.props, hideOnPhone: w.hideOnPhone, x, y, w: width, h })
      x += width
      rowH = Math.max(rowH, h)
    }
  }
  return { items: legacyWidths(items) }
}

/** Rows the Page title widget gets on a new page: one, it turns compact to fit (see widgets/page.tsx). */
const HEADER_H = 1

/** A module page before the coach arranges it: its title as a widget, then its core widget, full width. */
export function defaultPage(page: ModuleId): PageLayout {
  // Courses: the "pick up where you left off" card is its own widget, so the gallery leaves its copy out.
  if (page === "courses")
    return {
      items: [
        { id: "title-courses", type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H },
        { id: "resume-courses", type: "continue-lesson", variant: "cover", x: 0, y: HEADER_H, w: COLS, h: 3 },
        { id: "core-courses", type: coreType(page), x: 0, y: HEADER_H + 3, w: COLS, h: CORE_H, props: { resume: false } },
      ],
    }
  // Community: the coach's feed and Discord are separate widgets, side by side (the coach can move or remove either).
  if (page === "community")
    return {
      items: [
        { id: "title-community", type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H },
        { id: "core-community", type: coreType(page), x: 0, y: HEADER_H, w: 8, h: CORE_H },
        { id: "discord-community", type: "discord", variant: "join", x: 8, y: HEADER_H, w: 4, h: 5 },
      ],
    }
  return {
    items: [
      { id: `title-${page}`, type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H },
      { id: `core-${page}`, type: coreType(page), x: 0, y: HEADER_H, w: COLS, h: CORE_H },
    ],
  }
}

/** A page the coach added, before they arrange it: its title, then a text to write in. No core widget. */
export function defaultCustomPage(id: string): PageLayout {
  return {
    items: [
      { id: `title-${id}`, type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H },
      { id: `text-${id}`, type: "text", variant: "plain", x: 0, y: HEADER_H, w: 12, h: 4 },
    ],
  }
}

/** Saved layouts always keep the core widget; if one is missing, put it back on top. */
export function withCore(page: ModuleId, l: PageLayout): PageLayout {
  if (!l.items.some((w) => w.type === coreType(page))) return { ...l, items: [...defaultPage(page).items, ...l.items.map((w) => ({ ...w, y: w.y + HEADER_H + CORE_H }))] }
  // Pages saved before the title became a widget: put the title on top, so it stays where it was.
  if (!l.items.some((w) => w.type === "page-header") && !l.titleRemoved)
    return { ...l, items: [{ id: `title-${page}`, type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H }, ...l.items.map((w) => ({ ...w, y: w.y + HEADER_H }))] }
  return l
}

// ---------- template defaults

/**
 * A template's starting layout for a page, with ids made unique per coach.
 * Undefined when the template has none for that page (module pages then
 * start as their title and tool).
 */
export function templatePage(template: TemplateId, page: PageId, coach: Pick<Coach, "slug">): PageLayout | undefined {
  const l = TEMPLATES[template]?.pages?.[page]
  if (!l) return undefined
  const prefix = page === "home" ? `${coach.slug}-${template}` : `${coach.slug}-${template}-${page}`
  const items = l.items.map((w, i) => ({ ...w, id: `${prefix}-${i}` }))
  return { ...l, items: l.tiles ? items : legacyWidths(items) }
}

/**
 * Each template starts with its own Home, so coaches differ in layout as well
 * as colour from day one. Widgets for switched-off modules are skipped when
 * the page renders.
 */
export function defaultHome(template: TemplateId, coach: Coach): PageLayout {
  return templatePage(template, "home", coach) ?? { items: [] }
}
