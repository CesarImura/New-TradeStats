"use client"

import { useSearchParams } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { PageRenderer } from "@/components/widgets/page-renderer"
import { heightOf } from "@/components/widgets/registry"
import { DataModeProvider, dataModeOf } from "@/components/widgets/shared"
import { useViewerTier } from "@/lib/data/access"
import { pageLayout } from "@/lib/theme/resolve"
import type { PageId } from "@/lib/widgets/layout"

/** A module page as the coach laid it out in Design → Pages: its core widget plus any widgets around it, per tier. */
export function WidgetPage({ page }: { page: PageId }) {
  const { coach, theme } = useCoach()
  const params = useSearchParams()
  const tier = useViewerTier(coach)
  return (
    <DataModeProvider value={dataModeOf(params.get("data"))}>
      <PageRenderer page={page} layout={pageLayout(coach, page, theme.template, tier, heightOf)} />
    </DataModeProvider>
  )
}
