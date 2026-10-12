import type { Coach } from "@/lib/data/coaches"
import type { TemplateId } from "@/lib/theme/types"

/**
 * A page is a stack of sections. Each section splits into columns, and
 * widgets snap into the columns. Heights follow the content; on phones every
 * section becomes one column.
 */
export type ColumnSplit = "1" | "1:1" | "2:1" | "1:2" | "1:1:1"
export type SectionBackground = "none" | "muted" | "brand"

export type WidgetInstance = {
  id: string
  type: string
  variant?: string
  props?: Record<string, string | boolean>
  hideOnPhone?: boolean
}

export type Section = {
  id: string
  columns: ColumnSplit
  background?: SectionBackground
  /** One list of widgets per column. */
  slots: WidgetInstance[][]
}

export type PageLayout = { sections: Section[] }

/** Home layouts per community: "default" plus optional per-tier versions. */
export type HomeLayouts = Record<string, PageLayout>

export const COLUMN_SPLITS: { value: ColumnSplit; label: string }[] = [
  { value: "1", label: "One column" },
  { value: "1:1", label: "Two equal" },
  { value: "2:1", label: "Wide + narrow" },
  { value: "1:2", label: "Narrow + wide" },
  { value: "1:1:1", label: "Three equal" },
]

export const columnCount = (c: ColumnSplit) => c.split(":").length

/** Change a section's columns, moving widgets from removed columns into the last one kept. */
export function resizeSlots(slots: WidgetInstance[][], columns: ColumnSplit) {
  const n = columnCount(columns)
  const next = Array.from({ length: n }, (_, i) => [...(slots[i] ?? [])])
  for (let i = n; i < slots.length; i++) next[n - 1].push(...slots[i])
  return next
}

export const uid = () => Math.random().toString(36).slice(2, 10)

// ---------- template defaults

type Spec = [ColumnSplit, ...(string | [string, string])[][]] | [ColumnSplit, SectionBackground, ...(string | [string, string])[][]]

function build(prefix: string, specs: Spec[]): PageLayout {
  return {
    sections: specs.map((spec, si) => {
      const [columns, maybeBg, ...rest] = spec
      const background = typeof maybeBg === "string" ? (maybeBg as SectionBackground) : undefined
      const cols = (typeof maybeBg === "string" ? rest : [maybeBg, ...rest]) as (string | [string, string])[][]
      return {
        id: `${prefix}-s${si}`,
        columns,
        background,
        slots: cols.map((col, ci) =>
          col.map((w, wi) => {
            const [type, variant] = Array.isArray(w) ? w : [w, undefined]
            return { id: `${prefix}-w${si}${ci}${wi}`, type, variant }
          }),
        ),
      }
    }),
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
        ["2:1", [["continue-lesson", "card"]], [["next-live", "card"]]],
        ["1:1:1", [["journal-pnl", "chart"]], ["this-week"], ["econ-news"]],
        ["2:1", [["course-progress", "list"]], [["announcement", "highlight"]]],
      ])
    case "atelier":
      return build(p, [
        ["1", [["continue-lesson", "hero"]]],
        ["1:1", ["first-week"], [["next-live", "card"]]],
        ["1", "muted", [["course-progress", "cards"]]],
        ["2:1", [["announcement", "plain"]], ["partner-links"]],
      ])
    case "pulse":
      return build(p, [
        ["1:1:1", ["my-rank"], [["journal-pnl", "number"]], ["rules-followed"]],
        ["2:1", [["continue-lesson", "hero"]], [["next-live", "banner"]]],
        ["1:2", ["econ-news"], [["course-progress", "cards"]]],
        ["1", "brand", ["ai-ask"]],
      ])
  }
}
