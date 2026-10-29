"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { GAP, ROW_HEIGHT, readingOrder, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { widgetFinishOf, widgetSetOf } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { WidgetFrame } from "./kit"
import { getWidget, heightFor } from "./registry"
import { PageIdContext, PageTitleShownContext, usePhase } from "./shared"
import { useViewerGroup } from "@/lib/data/access"

export function isAvailable(w: WidgetInstance, coach: Coach) {
  const def = getWidget(w.type)
  return !!def && (!def.module || coach.modules[def.module])
}

/** The widget's visibility rule (Who sees it): a phase of the student's life, a group, or both. Unset means everyone. */
export function isShownTo(w: WidgetInstance, phase: string, groupId: string | undefined) {
  return (!w.show?.phase || w.show.phase === phase) && (!w.show?.group || w.show.group === groupId)
}

/** Draws a page from its layout. Used by the live platform and the builder's tablet and phone views. */
export function PageRenderer({ layout, page = "home" }: { layout: PageLayout; page?: string }) {
  const { coach } = useCoach()
  const phase = usePhase()
  const groupId = useViewerGroup(coach)?.id
  const items = readingOrder(layout.items.filter((w) => isAvailable(w, coach) && isShownTo(w, phase, groupId)))
  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!items.some((w) => w.type === "page-header")}>
      <Masonry items={items} render={(w) => <WidgetView w={w} />} />
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

/**
 * A page's cards as a masonry (see `masonry`): `.g-page` with the theme's
 * widget set and gap, the columns inside it, each card in a `.g-item` at
 * exactly its own height (measured on screen, so the shortest column is
 * known). `render` draws a card; `wrap` may wrap its `.g-item` (the builder
 * adds dragging there).
 */
export function Masonry({ items, render, wrap, className }: { items: WidgetInstance[]; render: (w: WidgetInstance) => React.ReactNode; wrap?: (w: WidgetInstance, item: React.ReactNode) => React.ReactNode; className?: string }) {
  const { theme } = useCoach()
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Each card's own height, measured on screen; until then an estimate from its layout.
  const [heights, setHeights] = useState<Record<string, number>>({})
  const onHeight = useCallback((id: string, h: number) => setHeights((m) => (Math.abs((m[id] ?? -1) - h) < 1 ? m : { ...m, [id]: h })), [])
  const gap = GAP[theme.density]
  const cols = width >= 960 ? 3 : width >= 640 ? 2 : 1
  const segments = useMemo(() => masonry(items, cols, heights, gap), [items, cols, heights, gap])
  const item = (w: WidgetInstance, style?: React.CSSProperties) => {
    const node = (
      <Measured key={w.id} w={w} onHeight={onHeight} style={style}>
        {render(w)}
      </Measured>
    )
    return wrap ? <Fragment key={w.id}>{wrap(w, node)}</Fragment> : node
  }
  return (
    <div ref={box} className={cn("@container", className)}>
      <div className="g-page" data-set={widgetSetOf(theme)} data-finish={widgetFinishOf(theme)} style={{ "--gap": `${gap}px`, "--row-h": `${ROW_HEIGHT}px`, display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "var(--gap)", alignItems: "start" } as React.CSSProperties}>
        {segments.map((seg, si) =>
          seg.band ? (
            item(seg.band, { gridColumn: "1 / -1" })
          ) : (
            seg.columns.map((col, ci) => (
              <div key={`${si}-${ci}`} className="flex min-w-0 flex-col" style={{ gap: "var(--gap)" }}>
                {col.map((w) => item(w))}
              </div>
            ))
          ),
        )}
      </div>
    </div>
  )
}

/** A card's `.g-item`, as tall as its content: the grid's own placement and size containment are switched off for masonry. */
function Measured({ w, onHeight, style, children }: { w: WidgetInstance; onHeight: (id: string, h: number) => void; style?: React.CSSProperties; children: React.ReactNode }) {
  const def = getWidget(w.type)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => onHeight(w.id, el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [w.id, onHeight])
  return (
    <div
      ref={ref}
      data-widget-id={w.id}
      className={cn("g-item", def?.core && "g-core", (def?.core || w.type === "page-header") && "g-plain", w.hideOnPhone && "g-hide-phone")}
      style={{ gridColumn: "auto", gridRow: "auto", contain: "none", overflow: "visible", ...style }}
    >
      {children}
    </div>
  )
}

/**
 * A card that spans the page: the page title, a page's own tool, and a card
 * the coach made full width. Anything narrower is one column wide, so the
 * columns stay unbroken (a band closes the columns above it, whose ends can
 * differ).
 */
export const isBand = (w: WidgetInstance, cols: number) => cols > 1 && (w.type === "page-header" || !!getWidget(w.type)?.core || w.w >= 12)

/**
 * Masonry: in the coach's order, each card goes to the shortest column, at
 * exactly its own height, so no card has empty space inside and no column has
 * a hole; only the columns' ends can differ. A full-width card (see isBand)
 * closes the columns above it; the columns start again under it. One column
 * on a phone, two on a tablet, three on desktop.
 */
function masonry(items: WidgetInstance[], cols: number, heights: Record<string, number>, gap: number) {
  type Seg = { band: WidgetInstance; columns?: undefined } | { band?: undefined; columns: WidgetInstance[][] }
  const out: Seg[] = []
  let columns: WidgetInstance[][] = []
  let tops: number[] = []
  const open = () => {
    columns = Array.from({ length: cols }, () => [])
    tops = Array.from({ length: cols }, () => 0)
  }
  const flush = () => {
    if (columns.some((c) => c.length)) out.push({ columns })
    open()
  }
  open()
  for (const w of items) {
    if (isBand(w, cols)) {
      flush()
      out.push({ band: w })
      continue
    }
    const def = getWidget(w.type)
    const est = heights[w.id] ?? (def ? heightFor(def, w.variant, w.detail) * (ROW_HEIGHT + gap) - gap : 200)
    const c = tops.indexOf(Math.min(...tops))
    columns[c].push(w)
    tops[c] += est + gap
  }
  flush()
  return out
}

/** A card on the live page, at its content's height. */
function WidgetView({ w }: { w: WidgetInstance }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  return (
    <WidgetFrame emphasis={w.emphasis} detail={w.detail} header={w.header} note={w.note} core={Boolean(def.core)} fixed={false}>
      <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
    </WidgetFrame>
  )
}
