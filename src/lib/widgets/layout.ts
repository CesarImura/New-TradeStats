import type { Coach, ModuleId } from "@/lib/data/coaches"
import { TEMPLATES } from "@/lib/theme/templates"
import type { Density, TemplateId } from "@/lib/theme/types"

/**
 * The Home is one grid: 12 columns, rows of a fixed height. Every widget
 * covers a rectangle of cells (x, y, w, h) and snaps to the grid in both
 * directions, so a tall card can sit next to two stacked ones.
 *
 * Responsive rules (by width of the page area, not the screen):
 * - wide (≥ 60rem): the grid exactly as arranged
 * - medium (≥ 40rem): widgets keep their order and height; narrow ones take half a row, wide ones the full row
 * - narrow (phones): one column, in reading order, each widget as tall as its content
 */
export const COLS = 12
export const ROW_HEIGHT = 56
/** Space between cells follows the theme's spacing setting. */
export const GAP: Record<Density, number> = { compact: 16, comfortable: 24, airy: 32 }

/** How much a widget stands out: Quiet (no colour), Accent (one mark in the brand colour), Star (on the brand colour; one per page). */
export type Emphasis = "quiet" | "accent" | "star"
/** How much a widget shows. */
export type Detail = "compact" | "standard" | "detailed"

export type WidgetInstance = {
  id: string
  type: string
  variant?: string
  emphasis?: Emphasis
  detail?: Detail
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
}

/** One page's layouts: "default" plus optional per-tier versions. */
export type HomeLayouts = Record<string, PageLayout>

/** Every student page is a widget grid: Home, and one page per module. */
export type PageId = "home" | ModuleId
export type PageLayouts = Partial<Record<PageId, HomeLayouts>>

/** The widget holding a module page's own tool (its trades, calendar, chart…). Pinned: it can move and resize, not go. */
export const coreType = (page: ModuleId) => `page-${page}`
export const isCoreType = (type: string) => type.startsWith("page-")
/** Rows a page's core widget gets when the page is new. On the live page it grows with its content. */
export const CORE_H = 8

export const uid = () => Math.random().toString(36).slice(2, 10)

/** Reading order: top to bottom, then left to right. */
export const readingOrder = (items: WidgetInstance[]) => [...items].sort((a, b) => a.y - b.y || a.x - b.x)

/** Width on medium screens: half a row or the full row. */
export const wMd = (w: number) => (w <= 6 ? 6 : 12)

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
  if ("items" in l) return { items: oneStar(l.items.map(upgradeItem)) }
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
  return { items }
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

/** Saved layouts always keep the core widget; if one is missing, put it back on top. */
export function withCore(page: ModuleId, l: PageLayout): PageLayout {
  if (!l.items.some((w) => w.type === coreType(page))) return { items: [...defaultPage(page).items, ...l.items.map((w) => ({ ...w, y: w.y + HEADER_H + CORE_H }))] }
  // Pages saved before the title became a widget: put the title on top, so it stays where it was.
  if (!l.items.some((w) => w.type === "page-header") && !l.titleRemoved)
    return { items: [{ id: `title-${page}`, type: "page-header", x: 0, y: 0, w: COLS, h: HEADER_H }, ...l.items.map((w) => ({ ...w, y: w.y + HEADER_H }))] }
  return l
}

/**
 * The same Detail for every widget on a page (setup's "How much each widget
 * shows"). The page title and the page's own tool keep theirs. A widget that
 * shows more gets the extra rows it needs (`grow`), and everything below it in
 * the same columns moves down by as much, so the gaps and order stay.
 */
export function withDetail(l: PageLayout, detail: Detail, grow: (w: WidgetInstance, to: Detail) => number): PageLayout {
  const order = readingOrder(l.items)
  const placed: { w: WidgetInstance; delta: number; growth: number }[] = []
  const items = order.map((w) => {
    const fixed = w.type === "page-header" || isCoreType(w.type)
    const growth = fixed ? 0 : grow(w, detail)
    // Pushed down by the widgets above it that it shares columns with.
    const delta = placed
      .filter((p) => p.w.y + p.w.h <= w.y && p.w.x < w.x + w.w && w.x < p.w.x + p.w.w)
      .reduce((m, p) => Math.max(m, p.delta + p.growth), 0)
    placed.push({ w, delta, growth })
    return fixed ? { ...w, y: w.y + delta } : { ...w, detail, y: w.y + delta, h: w.h + growth }
  })
  return { ...l, items }
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
  return { items: l.items.map((w, i) => ({ ...w, id: `${prefix}-${i}` })) }
}

/**
 * Each template starts with its own Home, so coaches differ in layout as well
 * as colour from day one. Widgets for switched-off modules are skipped when
 * the page renders.
 */
export function defaultHome(template: TemplateId, coach: Coach): PageLayout {
  return templatePage(template, "home", coach) ?? { items: [] }
}
