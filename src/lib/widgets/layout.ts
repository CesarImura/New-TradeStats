import type { Coach, ModuleId } from "@/lib/data/coaches"
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

export type PageLayout = { items: WidgetInstance[] }

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
/**
 * Widgets merged into others, and looks that became an Emphasis or Detail.
 * Saved pages keep working: they show the widget and look that replaced them.
 */
export const RETIRED: Record<string, { type: string; variant?: string; detail?: Detail }> = {}
export const RETIRED_LOOKS: Record<string, Record<string, { variant?: string; emphasis?: Emphasis; detail?: Detail }>> = {}

export function upgradeItem(w: WidgetInstance): WidgetInstance {
  const r = RETIRED[w.type]
  const moved = r ? { ...w, type: r.type, variant: r.variant, detail: w.detail ?? r.detail } : w
  const look = moved.variant ? RETIRED_LOOKS[moved.type]?.[moved.variant] : undefined
  return look ? { ...moved, variant: look.variant, emphasis: moved.emphasis ?? look.emphasis, detail: moved.detail ?? look.detail } : moved
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

/** A module page before the coach arranges it: just its core widget, full width. */
export function defaultPage(page: ModuleId): PageLayout {
  return { items: [{ id: `core-${page}`, type: coreType(page), x: 0, y: 0, w: COLS, h: CORE_H }] }
}

/** Saved layouts always keep the core widget; if one is missing, put it back on top. */
export function withCore(page: ModuleId, l: PageLayout): PageLayout {
  if (l.items.some((w) => w.type === coreType(page))) return l
  return { items: [...defaultPage(page).items, ...l.items.map((w) => ({ ...w, y: w.y + CORE_H }))] }
}

// ---------- template defaults

type Spec = [type: string, x: number, y: number, w: number, h: number, variant?: string]

function build(prefix: string, specs: Spec[]): PageLayout {
  return { items: specs.map(([type, x, y, w, h, variant], i) => ({ id: `${prefix}-${i}`, type, variant, x, y, w, h })) }
}

/**
 * Each template starts with its own Home, so coaches differ in layout as well
 * as colour from day one. Widgets for switched-off modules are skipped when
 * the page renders.
 */
export function defaultHome(template: TemplateId, coach: Coach): PageLayout {
  const p = `${coach.slug}-${template}`
  switch (template) {
    case "terminal":
      // Dense trading desk: a tall countdown on the right, data rows on the left.
      return build(p, [
        ["continue-lesson", 0, 0, 8, 3, "progress"],
        ["next-live", 8, 0, 4, 3, "countdown"],
        ["journal-pnl", 0, 3, 4, 3, "bars"],
        ["rules-followed", 4, 3, 4, 4, "radar"],
        ["econ-news", 8, 3, 4, 4, "impact"],
        ["course-progress", 0, 6, 4, 4, "bars"],
        ["this-week", 4, 7, 8, 3, "week"],
      ])
    case "atelier":
      // Calm and editorial: a welcome, a large lesson, the week beside it.
      return build(p, [
        ["welcome-video", 0, 0, 12, 4, "side"],
        ["continue-lesson", 0, 4, 8, 3, "cover"],
        ["first-week", 8, 4, 4, 3, "checklist"],
        ["course-progress", 0, 7, 6, 3, "rings"],
        ["this-week", 6, 7, 6, 4, "timeline"],
        ["announcement", 0, 10, 6, 3, "post"],
      ])
    case "pulse":
      // Stats on top, a tall leaderboard on the side.
      return build(p, [
        ["journal-pnl", 0, 0, 4, 3, "curve"],
        ["rules-followed", 4, 0, 4, 3, "streak"],
        ["my-rank", 8, 0, 4, 6, "leaderboard"],
        ["continue-lesson", 0, 3, 8, 3, "cover"],
        ["next-live", 0, 6, 4, 3, "block"],
        ["journal-pnl", 4, 6, 8, 3, "heatmap"],
        ["discord", 0, 9, 4, 3, "online"],
        ["econ-news", 4, 9, 4, 3, "next"],
        ["course-progress", 8, 9, 4, 3, "rings"],
        ["ai-ask", 0, 12, 12, 4, "chat"],
      ])
  }
}
