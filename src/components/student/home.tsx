"use client"

import { useSearchParams } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { heightOf } from "@/components/widgets/registry"
import { StartHere } from "./getting-started"
import { DataModeProvider, dataModeOf } from "@/components/widgets/shared"
import { useViewerTier } from "@/lib/data/access"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { pageLayout } from "@/lib/theme/resolve"

/** STU-01. Laid out by the coach in Design → Home page, per tier. */
export function StudentHome() {
  const { coach, theme, preview } = useCoach()
  const params = useSearchParams()
  // The demo student is in the first tier; the builder's preview can ask for another tier or for empty data.
  const tier = useViewerTier(coach)
  // Design's style sections preview the Everyone layout (layout=everyone): a widget clicked there is the one Pages opens.
  const layoutTier = preview && params.get("layout") === "everyone" ? undefined : tier
  return (
    <DataModeProvider value={dataModeOf(params.get("data"))}>
      <div className="flex flex-col page-gap">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Monday, 12 October</span>
          <h1 className="text-3xl leading-tight md:text-4xl">Good morning, {DEMO_STUDENT.first}</h1>
        </div>
        <StartHere />
        <PageRenderer layout={pageLayout(coach, "home", theme.template, layoutTier, heightOf)} live={!preview} />
      </div>
    </DataModeProvider>
  )
}
