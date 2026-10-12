import type { Coach } from "@/lib/data/coaches"
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

export type WidgetInstance = {
  id: string
  type: string
  variant?: string
  x: number
  y: number
  w: number
  h: number
  props?: Record<string, string | boolean>
  hideOnPhone?: boolean
}

export type PageLayout = { items: WidgetInstance[] }

/** Home layouts per community: "default" plus optional per-tier versions. */
export type HomeLayouts = Record<string, PageLayout>

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
export function normalizeLayout(l: PageLayout | { sections: LegacySection[] }, heightOf: (w: LegacyWidget) => number = () => 4): PageLayout {
  if ("items" in l) return l
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
      // A tall countdown on the right, dense rows of data on the left.
      return build(p, [
        ["continue-lesson", 0, 0, 8, 2, "card"],
        ["next-live", 8, 0, 4, 4, "countdown"],
        ["journal-pnl", 0, 2, 4, 3, "chart"],
        ["rules-followed", 4, 2, 4, 3, "breakdown"],
        ["econ-news", 8, 4, 4, 4, "impact"],
        ["course-progress", 0, 5, 8, 4, "list"],
        ["announcement", 8, 8, 4, 3, "highlight"],
      ])
    case "atelier":
      // Calm and editorial: a welcome, a large lesson, a tall checklist beside it.
      return build(p, [
        ["welcome-video", 0, 0, 12, 5, "side"],
        ["continue-lesson", 0, 5, 8, 4, "hero"],
        ["first-week", 8, 5, 4, 4, "checklist"],
        ["course-progress", 0, 9, 12, 5, "cards"],
        ["this-week", 0, 14, 6, 4, "timeline"],
        ["announcement", 6, 14, 6, 3, "pinned"],
      ])
    case "pulse":
      // Stats on top, a tall leaderboard on the side.
      return build(p, [
        ["journal-pnl", 0, 0, 4, 3, "number"],
        ["rules-followed", 4, 0, 4, 3, "ring"],
        ["my-rank", 8, 0, 4, 6, "leaderboard"],
        ["continue-lesson", 0, 3, 8, 3, "spotlight"],
        ["next-live", 0, 6, 4, 3, "banner"],
        ["this-week", 4, 6, 8, 3, "days"],
        ["course-progress", 0, 9, 6, 4, "rings"],
        ["econ-news", 6, 9, 6, 4, "next"],
        ["ai-ask", 0, 13, 12, 4, "chat"],
      ])
  }
}
