"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { GAP, ROW_HEIGHT, readingOrder, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { widgetFinishOf, widgetSetOf } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { WidgetFrame } from "./kit"
import { fitWidth, getWidget, heightFor } from "./registry"
import { WidgetStyleScope } from "./widget-scope"
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

/** Draws a page from its layout. Used by the live platform (`live`: links work) and the builder's tablet and phone views. */
export function PageRenderer({ layout, page = "home", live }: { layout: PageLayout; page?: string; live?: boolean }) {
  const { coach } = useCoach()
  const phase = usePhase()
  const groupId = useViewerGroup(coach)?.id
  const items = readingOrder(layout.items.filter((w) => isAvailable(w, coach) && isShownTo(w, phase, groupId)))
  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!items.some((w) => w.type === "page-header")}>
      <WidgetGrid items={items} free={layout.free} render={(w) => <WidgetView w={w} live={live} />} />
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

/** Where a card sits: its first column, how many columns it spans, and its top (px). */
export type Spot = { col: number; span: number; top: number }
export type Placement = { spots: Map<string, Spot>; height: number }

/** Columns a card spans on a page of `cols`: the page title, a page's own tool and full-width cards span them all. */
/** The width a card draws at: its saved width, kept to the sizes its layout allows (a layout can lose a size it once had). */
export const widthOf = (w: WidgetInstance) => {
  const def = getWidget(w.type)
  return def ? fitWidth(def, w.variant, w.w) : w.w
}

export const spanOf = (w: WidgetInstance, cols: number) => Math.min(cols, isBand(w, 3) ? 3 : widthOf(w) >= 8 ? 2 : 1)

/** The height a card is drawn at before it is measured: an estimate from its layout. */
const estimate = (w: WidgetInstance, gap: number) => {
  const def = getWidget(w.type)
  return def ? heightFor(def, w.variant, w.detail) * (ROW_HEIGHT + gap) - gap : 200
}

/**
 * Places a page's cards on its columns, in order: each card goes to its own column (`free`, desktop: the coach put it
 * there) or to the column where it starts highest (tablets, phones and pages arranged before the free grid), and as
 * high as the cards above it in those columns allow. So cards fall up into any room left above them, and a card that
 * doesn't fit beside the others goes under them: the page reflows round every move and resize, like a board.
 */
export function placeItems(items: WidgetInstance[], cols: number, heights: Record<string, number>, gap: number, free: boolean): Placement {
  const tops = Array.from({ length: cols }, () => 0)
  const spots = new Map<string, Spot>()
  for (const w of items) {
    const span = spanOf(w, cols)
    let col = 0
    if (free && cols === 3) col = Math.max(0, Math.min(cols - span, Math.round(w.x / 4)))
    else {
      let best = Infinity
      for (let c = 0; c + span <= cols; c++) {
        const top = Math.max(...tops.slice(c, c + span))
        if (top < best - 0.5) {
          best = top
          col = c
        }
      }
    }
    const top = Math.max(...tops.slice(col, col + span))
    spots.set(w.id, { col, span, top })
    const bottom = top + (heights[w.id] ?? estimate(w, gap)) + gap
    for (let c = col; c < col + span; c++) tops[c] = bottom
  }
  return { spots, height: Math.max(0, ...tops.map((t) => t - gap)) }
}

/** Columns for a page this wide: three on desktop, two on a tablet, one on a phone. */
export const colsFor = (width: number) => (width >= 960 ? 3 : width >= 640 ? 2 : 1)

/**
 * A page's cards on a grid of columns (see placeItems): `.g-page` with the theme's widget set and gap, each card in a
 * `.g-item` at its spot and at exactly its own height (measured, so the cards under it know where to start). Cards
 * glide to a new spot when the page reflows. `render` draws a card; `wrap` may wrap its `.g-item` (the builder adds
 * dragging there); `onPlaced` reports where every card went and its height, for the builder's drag and drop.
 */
export function WidgetGrid({
  items,
  free,
  render,
  wrap,
  className,
  onPlaced,
  children,
}: {
  items: WidgetInstance[]
  free?: boolean
  render: (w: WidgetInstance) => React.ReactNode
  wrap?: (w: WidgetInstance, item: React.ReactNode) => React.ReactNode
  className?: string
  onPlaced?: (p: Placement & { cols: number; colWidth: number; heights: Record<string, number> }) => void
  /** Drawn over the grid, in its coordinates (the builder's drop marker). */
  children?: React.ReactNode
}) {
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
  const [heights, setHeights] = useState<Record<string, number>>({})
  const onHeight = useCallback((id: string, h: number) => setHeights((m) => (Math.abs((m[id] ?? -1) - h) < 1 ? m : { ...m, [id]: h })), [])
  const gap = GAP[theme.density]
  const cols = colsFor(width)
  // Hidden on phones: left out of the phone's columns, so it leaves no hole.
  const shown = useMemo(() => (cols === 1 ? items.filter((w) => !w.hideOnPhone) : items), [items, cols])
  const placed = useMemo(() => placeItems(shown, cols, heights, gap, !!free), [shown, cols, heights, gap, free])
  const colWidth = cols ? (width - gap * (cols - 1)) / cols : 0
  useLayoutEffect(() => onPlaced?.({ ...placed, cols, colWidth, heights }), [placed, cols, colWidth, heights, onPlaced])
  // Cards glide to a new spot only once the page has been laid out, never on its first paint.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!width) return
    const id = requestAnimationFrame(() => setSettled(true))
    return () => cancelAnimationFrame(id)
  }, [width])
  return (
    <div ref={box} className={cn("@container", className)}>
      <div className={cn("g-page relative", !width && "flex flex-col gap-(--gap)")} data-set={widgetSetOf(theme)} data-finish={widgetFinishOf(theme)} style={{ "--gap": `${gap}px`, height: width ? placed.height : undefined } as React.CSSProperties}>
        {shown.map((w) => {
          const s = placed.spots.get(w.id)!
          // Until the page has been measured (server HTML, first paint) cards stack in the flow at full width, not at width 0.
          const style: React.CSSProperties | undefined = !width ? undefined : {
            position: "absolute",
            left: s.col * (colWidth + gap),
            top: s.top,
            width: s.span * colWidth + (s.span - 1) * gap,
            transition: settled ? "left 240ms cubic-bezier(.2,.8,.2,1), top 240ms cubic-bezier(.2,.8,.2,1), width 240ms cubic-bezier(.2,.8,.2,1)" : undefined,
          }
          const node = (
            <Measured key={w.id} w={w} onHeight={onHeight} style={wrap ? undefined : style}>
              {render(w)}
            </Measured>
          )
          return wrap ? (
            <div key={w.id} className="min-w-0" style={style}>
              {wrap(w, node)}
            </div>
          ) : (
            node
          )
        })}
        {children}
      </div>
    </div>
  )
}

/** A card's `.g-item`, as tall as its content (measured, so the cards under it know where to start). */
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
    <div ref={ref} data-widget-id={w.id} className={cn("g-item", def?.core && "g-core", (def?.core || w.type === "page-header") && "g-plain")} style={style}>
      {children}
    </div>
  )
}

/** A card that spans the page: the page title, a page's own tool, and a card the coach made full width. */
export const isBand = (w: WidgetInstance, cols: number) => cols > 1 && (w.type === "page-header" || !!getWidget(w.type)?.core || widthOf(w) >= 12)

/** A card on the live page, at its content's height. */
function WidgetView({ w, live }: { w: WidgetInstance; live?: boolean }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  return (
    <WidgetStyleScope type={w.type} style={w.style} emphasis={w.emphasis}>
      <WidgetFrame emphasis={w.emphasis} detail={w.detail} header={w.header} note={w.note} core={Boolean(def.core)} fixed={false} live={live}>
        <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
      </WidgetFrame>
    </WidgetStyleScope>
  )
}
