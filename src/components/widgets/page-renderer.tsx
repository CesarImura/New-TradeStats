"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { GAP, ROW_HEIGHT, readingOrder, wMd, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { WidgetFrame } from "./kit"
import { getWidget } from "./registry"
import { PageIdContext, PageTitleShownContext } from "./shared"

export function isAvailable(w: WidgetInstance, coach: Coach) {
  const def = getWidget(w.type)
  return !!def && (!def.module || coach.modules[def.module])
}

/** Draws a page from its layout. Used by the live platform and the builder's tablet and phone views. */
export function PageRenderer({ layout, page = "home" }: { layout: PageLayout; page?: string }) {
  const { coach, theme } = useCoach()
  const items = readingOrder(layout.items.filter((w) => isAvailable(w, coach)))
  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!items.some((w) => w.type === "page-header")}>
    <div className="@container">
      <div className="g-page" style={{ "--gap": `${GAP[theme.density]}px`, "--row-h": `${ROW_HEIGHT}px` } as React.CSSProperties}>
        {items.map((w, i) => (
          <WidgetView key={w.id} w={w} order={i} />
        ))}
      </div>
    </div>
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

function WidgetView({ w, order }: { w: WidgetInstance; order: number }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  const style = { "--x": w.x, "--y": w.y, "--w": w.w, "--h": w.h, "--w-md": wMd(w.w), "--order": order } as React.CSSProperties
  return (
    <div className={cn("g-item", def.core && "g-core", w.hideOnPhone && "g-hide-phone")} style={style}>
      <WidgetFrame emphasis={w.emphasis} detail={w.detail}>
        <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
      </WidgetFrame>
    </div>
  )
}
