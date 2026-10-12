"use client"

import { useSearchParams } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { DataModeProvider } from "@/components/widgets/shared"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { homeLayout } from "@/lib/theme/resolve"

/** STU-01. Laid out by the coach in Design → Home page, per tier. */
export function StudentHome() {
  const { coach, theme } = useCoach()
  const params = useSearchParams()
  // The demo student is in the first tier; the builder's preview can ask for another tier or for empty data.
  const tier = params.get("tier") ?? coach.tiers[0]?.id
  return (
    <DataModeProvider value={params.get("data") === "empty" ? "empty" : "sample"}>
      <div className="flex flex-col page-gap">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Monday, 12 October</span>
          <h1 className="text-3xl leading-tight md:text-4xl">Good morning, {DEMO_STUDENT.first}</h1>
        </div>
        <PageRenderer layout={homeLayout(coach, theme.template, tier)} />
      </div>
    </DataModeProvider>
  )
}
