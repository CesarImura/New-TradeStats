"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import type { ColumnSplit, PageLayout, Section, WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { getWidget } from "./registry"

/** Column templates, applied only when the page area is wide enough (container query). */
export const GRID: Record<ColumnSplit, string> = {
  "1": "",
  "1:1": "@3xl:grid-cols-2",
  "2:1": "@3xl:grid-cols-[2fr_1fr]",
  "1:2": "@3xl:grid-cols-[1fr_2fr]",
  "1:1:1": "@3xl:grid-cols-3",
}

export const SECTION_BG = {
  none: "",
  muted: "rounded-(--radius) bg-muted/60 p-[var(--page-gap)]",
  brand: "rounded-(--radius) bg-primary/10 p-[var(--page-gap)]",
} as const

export function isAvailable(w: WidgetInstance, coach: Coach) {
  const def = getWidget(w.type)
  return !!def && (!def.module || coach.modules[def.module])
}

/** Draws a page from its layout. Used by the live platform and the preview. */
export function PageRenderer({ layout }: { layout: PageLayout }) {
  const { coach } = useCoach()
  return (
    <div className="@container flex flex-col page-gap">
      {layout.sections.map((s) => (
        <SectionView key={s.id} section={s} coach={coach} />
      ))}
    </div>
  )
}

function SectionView({ section, coach }: { section: Section; coach: Coach }) {
  const slots = section.slots.map((col) => col.filter((w) => isAvailable(w, coach)))
  if (slots.every((c) => c.length === 0)) return null
  return (
    <section className={cn("grid grid-cols-1 page-gap", GRID[section.columns], SECTION_BG[section.background ?? "none"])}>
      {slots.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-col page-gap">
          {col.map((w) => (
            <WidgetView key={w.id} w={w} />
          ))}
        </div>
      ))}
    </section>
  )
}

export function WidgetView({ w }: { w: WidgetInstance }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  return (
    <div className={cn("flex min-w-0 flex-col last:flex-1 *:flex-1", w.hideOnPhone && "@max-3xl:hidden")}>
      <C variant={w.variant ?? def.variants?.[0]?.value} props={w.props ?? {}} />
    </div>
  )
}
