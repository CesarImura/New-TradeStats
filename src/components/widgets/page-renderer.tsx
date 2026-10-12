"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { GAP, ROW_HEIGHT, readingOrder, wMd, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { getWidget } from "./registry"

export function isAvailable(w: WidgetInstance, coach: Coach) {
  const def = getWidget(w.type)
  return !!def && (!def.module || coach.modules[def.module])
}

/** Draws a page from its layout. Used by the live platform and the builder's tablet and phone views. */
export function PageRenderer({ layout }: { layout: PageLayout }) {
  const { coach, theme } = useCoach()
  const items = readingOrder(layout.items.filter((w) => isAvailable(w, coach)))
  return (
    <div className="@container">
      <div className="g-page" style={{ "--gap": `${GAP[theme.density]}px`, "--row-h": `${ROW_HEIGHT}px` } as React.CSSProperties}>
        {items.map((w, i) => (
          <WidgetView key={w.id} w={w} order={i} />
        ))}
      </div>
    </div>
  )
}

function WidgetView({ w, order }: { w: WidgetInstance; order: number }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  const style = { "--x": w.x, "--y": w.y, "--w": w.w, "--h": w.h, "--w-md": wMd(w.w), "--order": order } as React.CSSProperties
  return (
    <div className={cn("g-item", w.hideOnPhone && "g-hide-phone")} style={style}>
      <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
    </div>
  )
}
