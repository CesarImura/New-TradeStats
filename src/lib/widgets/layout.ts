import type { Coach } from "@/lib/data/coaches"
import type { TemplateId } from "@/lib/theme/types"

/**
 * A page is a stack of sections. Inside a section, widgets sit on a
 * 12-column grid: each widget has a width (span) that snaps to the grid, and
 * widgets wrap onto the next line when a row is full.
 *
 * Responsive rules (applied by width of the page area, not the screen):
 * - wide (≥ 60rem): widgets use their span
 * - medium (≥ 40rem): narrow widgets take half the row, wide ones the full row
 * - narrow (phones): every widget takes the full row
 */
export type SectionBackground = "none" | "muted" | "brand"

export type WidgetInstance = {
  id: string
  type: string
  variant?: string
  /** Width in twelfths of the row, 1–12. */
  span: number
  props?: Record<string, string | boolean>
  hideOnPhone?: boolean
}

export type Section = {
  id: string
  background?: SectionBackground
  widgets: WidgetInstance[]
}

export type PageLayout = { sections: Section[] }

/** Home layouts per community: "default" plus optional per-tier versions. */
export type HomeLayouts = Record<string, PageLayout>

export const SPAN_STEPS = [
  { span: 3, label: "¼" },
  { span: 4, label: "⅓" },
  { span: 6, label: "½" },
  { span: 8, label: "⅔" },
  { span: 9, label: "¾" },
  { span: 12, label: "Full" },
]

/** Width on medium screens (tablets, narrow laptops). */
export const spanMd = (span: number) => (span <= 6 ? 6 : 12)

export const uid = () => Math.random().toString(36).slice(2, 10)

/** Older saved layouts used fixed columns ("slots"); turn them into spans. */
export function normalizeLayout(l: PageLayout): PageLayout {
  return {
    sections: l.sections.map((s) => {
      const legacy = s as Section & { columns?: string; slots?: { id: string; type: string; variant?: string }[][] }
      if (legacy.widgets) return s
      const parts = (legacy.columns ?? "1").split(":").map(Number)
      const total = parts.reduce((a, b) => a + b, 0)
      const widgets = (legacy.slots ?? []).flatMap((col, i) => col.map((w) => ({ ...w, span: Math.round((12 * parts[i]) / total) })))
      return { id: s.id, background: s.background, widgets }
    }),
  }
}

// ---------- template defaults

type Spec = { bg?: SectionBackground; w: [type: string, span: number, variant?: string][] }

function build(prefix: string, specs: Spec[]): PageLayout {
  return {
    sections: specs.map((spec, si) => ({
      id: `${prefix}-s${si}`,
      background: spec.bg,
      widgets: spec.w.map(([type, span, variant], wi) => ({ id: `${prefix}-w${si}${wi}`, type, span, variant })),
    })),
  }
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
      return build(p, [
        { w: [["continue-lesson", 8, "card"], ["next-live", 4, "countdown"]] },
        { w: [["journal-pnl", 4, "chart"], ["rules-followed", 4, "breakdown"], ["econ-news", 4, "impact"]] },
        { w: [["course-progress", 8, "list"], ["announcement", 4, "highlight"]] },
      ])
    case "atelier":
      return build(p, [
        { w: [["welcome-video", 12, "side"]] },
        { w: [["continue-lesson", 8, "hero"], ["first-week", 4, "checklist"]] },
        { bg: "muted", w: [["course-progress", 12, "cards"]] },
        { w: [["this-week", 6, "timeline"], ["announcement", 6, "pinned"]] },
      ])
    case "pulse":
      return build(p, [
        { w: [["my-rank", 4, "podium"], ["journal-pnl", 4, "number"], ["rules-followed", 4, "ring"]] },
        { w: [["continue-lesson", 8, "spotlight"], ["next-live", 4, "banner"]] },
        { w: [["course-progress", 6, "rings"], ["this-week", 6, "days"]] },
        { bg: "brand", w: [["ai-ask", 12, "chat"]] },
      ])
  }
}
