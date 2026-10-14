"use client"

import { useSearchParams } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { heightOf } from "@/components/widgets/registry"
import { DataModeProvider } from "@/components/widgets/shared"
import { useViewerTier } from "@/lib/data/access"
import { pageLayout } from "@/lib/theme/resolve"
import type { ModuleId } from "@/lib/data/coaches"

/** A module page as the coach laid it out in Design → Pages: its core widget plus any widgets around it, per tier. */
export function WidgetPage({ page }: { page: ModuleId }) {
  const { coach, theme } = useCoach()
  const params = useSearchParams()
  const tier = useViewerTier(coach)
  return (
    <DataModeProvider value={params.get("data") === "empty" ? "empty" : "sample"}>
      <PageRenderer page={page} layout={pageLayout(coach, page, theme.template, tier, heightOf)} />
    </DataModeProvider>
  )
}
