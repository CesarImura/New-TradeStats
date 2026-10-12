"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { spanMd, type PageLayout, type Section, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { getWidget } from "./registry"

export const SECTION_BG = {
  none: "",
  muted: "rounded-(--radius) bg-muted/60 p-[var(--page-gap)]",
  brand: "rounded-(--radius) bg-primary/10 p-[var(--page-gap)]",
} as const

export function isAvailable(w: WidgetInstance, coach: Coach) {
  const def = getWidget(w.type)
  return !!def && (!def.module || coach.modules[def.module])
}

/** Width a widget actually gets: never narrower than its content allows. */
export function effectiveSpan(w: WidgetInstance) {
  const def = getWidget(w.type)
  return Math.min(12, Math.max(w.span ?? def?.defaultSpan ?? 12, def?.minSpan ?? 1))
}

/** Grid placement for one widget. See `.w-cell` in globals.css for the responsive rules. */
export function cellStyle(w: WidgetInstance) {
  const span = effectiveSpan(w)
  return { "--span": span, "--span-md": spanMd(span) } as React.CSSProperties
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
  const widgets = section.widgets.filter((w) => isAvailable(w, coach))
  if (!widgets.length) return null
  return (
    <section className={cn("w-grid", SECTION_BG[section.background ?? "none"])}>
      {widgets.map((w) => (
        <WidgetView key={w.id} w={w} />
      ))}
    </section>
  )
}

export function WidgetView({ w }: { w: WidgetInstance }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  return (
    <div className={cn("w-cell", w.hideOnPhone && "w-hide-phone")} style={cellStyle(w)}>
      <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
    </div>
  )
}
