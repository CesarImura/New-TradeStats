"use client"

import { SizeObserver } from "./parts/resizing"
import { useCoach } from "@/components/coach/coach-provider"
import type { Coach } from "@/lib/data/coaches"
import { GAP, ROW_HEIGHT, phoneSequence, stackOrder, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { widgetFinishOf, widgetSetOf } from "@/lib/theme/types"
import { DENSITY } from "@/lib/theme/css"
import { cn } from "@/lib/utils"
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "motion/react"
import { WidgetFrame } from "./parts/frame"
import { getWidget, heightFor, type CardBox } from "./registry"
import { isBand, ownHeight, planGrid, placeStacked, type PlanOptions, type Placement } from "./page-grid"
import { WidgetStyleScope } from "./parts/widget-scope"
import { PageIdContext, PageTitleShownContext, usePhase } from "./parts/shared"
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
  // The cards this student doesn't see (phase, group, module) are still in the page: the desktop grid takes them out of the tiling, so the cards beside them grow over their room.
  const items = stackOrder(layout)
  const hide = new Set(items.filter((w) => !(isAvailable(w, coach) && isShownTo(w, phase, groupId))).map((w) => w.id))
  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!items.some((w) => w.type === "page-header" && !hide.has(w.id))}>
      <WidgetGrid items={items} hide={hide} tiles={layout.tiles} phoneOrder={layout.phoneOrder} render={(w, fixed) => <WidgetView w={w} live={live} fixed={fixed} />} />
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

export { isBand }
export type { Placement }

/** Columns a card spans on a tablet or phone of `cols`: the page title, a page's own tool and full-width cards span them all, 8 twelfths or more take two (a tile's width is whatever the coach dragged it to). */
export const spanOf = (w: WidgetInstance, cols: number) => Math.min(cols, isBand(w, 3) ? 3 : w.w >= 8 ? 2 : 1)

/** The height a card is drawn at before it is measured: an estimate from its layout (`box`: the card's px, when the page's width is known). */
export const estimate = (w: WidgetInstance, gap: number, box?: CardBox) => {
  const def = getWidget(w.type)
  return def ? heightFor(def, w.variant, w.detail, w.w, box, { note: w.note, row: ROW_HEIGHT + gap }) * (ROW_HEIGHT + gap) - gap : 200
}

/**
 * The one spring every card of the page moves on (pushed out of the way, a card dropped, Fill gaps, undo, add): soft and critically
 * damped (no visible overshoot), settled in about 250ms. A card moved again mid-flight carries its speed over to the new target.
 */
export const GRID_SPRING = { type: "spring", stiffness: 560, damping: 48, mass: 1, restDelta: 0.1, restSpeed: 0.5 } as const
/** One grid step while dragging: quick and almost without overshoot, so the card reads as clicking from cell to cell. */
export const GRID_NUDGE = { type: "spring", stiffness: 900, damping: 52, mass: 1, restDelta: 0.1, restSpeed: 0.5 } as const

/** Where a card is drawn (px of the page), as motion values: its position goes out as a transform, only its size is layout. */
export type CellMV = { x: MotionValue<number>; y: MotionValue<number>; w: MotionValue<number>; h: MotionValue<number> }

/** What the page reports after every layout: where each card went, how many columns the page has, and what it was planned with. On desktop `layout` has the tiles the page is made of (hidden cards taken out). */
export type Placed = Placement & { cols: number; opts: PlanOptions; layout: WidgetInstance[] }
/** What the builder needs to know of a card on the desktop page: whether it is a band, and whether a line runs along its right edge. */
export type TileInfo = { band: boolean; right: boolean }

/** Columns for a page this wide: three on desktop, two on a tablet, one on a phone. */
export const colsFor = (width: number) => (width >= 960 ? 3 : width >= 640 ? 2 : 1)

/**
 * A page's cards as tiles (see planGrid; tablets and phones stack them in columns, see placeStacked): `.g-page` with the
 * theme's widget set and gap, each card in a `.g-item` at its spot. On desktop a card is exactly its rectangle (tiles),
 * except the page title and a page's own tool, which are as tall as their content (measured, so the cards under them know
 * where to start); on tablets and phones every card is measured. Cards glide to a new spot when the page reflows. `render`
 * draws a card; `wrap` may wrap its `.g-item` (the builder adds dragging there); `onPlaced` reports the placement, for the
 * builder's drag, drop and resize.
 */
export function WidgetGrid({
  items,
  tiles,
  hide,
  held,
  jump,
  busy,
  rev,
  cells,
  phoneOrder,
  render,
  wrap,
  className,
  onPlaced,
  children,
}: {
  items: WidgetInstance[]
  /** The layout was saved as tiles: x, y, w and h are exact. Unset: a masonry or an earlier grid, turned into tiles here. */
  tiles?: boolean
  /** Cards the viewer doesn't see: taken out of the tiling (desktop) or left out of the columns (tablet, phone). */
  hide?: ReadonlySet<string>
  /** A card the caller moves itself, straight to the pointer (it is being resized): the grid leaves its position and size alone until it is let go, then springs it to its spot. */
  held?: string | null
  /** A card that goes to its spot at once, with no spring (a card carried to a new place: it is hidden until it lands). */
  jump?: string | null
  /** Something is being dragged: cards that may move tell the browser (will-change). */
  busy?: boolean
  /** Everything `render` and `wrap` read that is not in the card itself (selection, the layout they act on…): a card is drawn again only when its content, this or its place in the grid changes. */
  rev?: string
  /** Receives the motion values of every card, by id (for the caller that drives a card itself). */
  cells?: React.RefObject<Map<string, CellMV>>
  /** The phone's own order, if the coach set one. */
  phoneOrder?: string[]
  render: (w: WidgetInstance, fixed: boolean) => React.ReactNode
  wrap?: (w: WidgetInstance, item: React.ReactNode, info: TileInfo) => React.ReactNode
  className?: string
  onPlaced?: (p: Placed) => void
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
  const visible = useMemo(() => (hide?.size ? items.filter((w) => !hide.has(w.id)) : items), [items, hide])
  const stacked = useMemo(() => (cols === 1 ? (phoneOrder?.length ? phoneSequence(visible, phoneOrder) : visible).filter((w) => !w.hideOnPhone) : visible), [visible, cols, phoneOrder])
  // On the three-column page every card is as tall as its row, so neighbours line up and the content adapts inside; tablets and
  // phones keep each card as tall as its content.
  const fixed = cols === 3
  // A card's px, from the layout alone: its width and its body's padding at this density.
  const pad = 16 * DENSITY[theme.density]
  const ownPx = useCallback((w: WidgetInstance) => heights[w.id] ?? estimate(w, gap, width > 0 ? { width, pad } : undefined), [heights, gap, width, pad])
  const opts = useMemo<PlanOptions>(() => ({ tiles: !!tiles, gap, width, pad, ownPx }), [tiles, gap, width, pad, ownPx])
  const placed = useMemo(() => {
    if (fixed) return planGrid(items, opts, hide)
    return { ...placeStacked(stacked, cols, heights, gap, (w) => spanOf(w, cols), (w) => estimate(w, gap)), layout: [] as WidgetInstance[] }
  }, [fixed, items, hide, opts, stacked, cols, heights, gap])
  const shown = fixed ? placed.layout : stacked
  useLayoutEffect(() => onPlaced?.({ ...placed, cols, opts }), [placed, cols, opts, onPlaced])
  const tileInfo = useMemo(() => {
    const m = new Map<string, TileInfo>()
    for (const c of placed.layout) m.set(c.id, { band: ownHeight(c), right: !ownHeight(c) && c.x + c.w < 12 - 1e-6 })
    return m
  }, [placed.layout])
  // Cards glide to a new spot only once the page has been laid out and its heights have stopped changing (fonts,
  // pictures, measured cards replacing estimates). Gliding while it loads counted as layout shift (CLS 0.1–0.5 on Home).
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!width || settled) return
    const id = setTimeout(() => setSettled(true), 300)
    return () => clearTimeout(id)
  }, [width, heights, settled])
  // A change of column count re-lays the whole page at once (heights switch between measured and designed on the spot), so
  // the cards must not glide from their old spots then: they would cross the new heights on the way. The change is noticed
  // during render, so the new spots are painted with no transition, and gliding comes back two frames later.
  const [regime, setRegime] = useState(cols)
  const [snapping, setSnapping] = useState(false)
  if (regime !== cols) {
    setRegime(cols)
    if (width) setSnapping(true)
  }
  useEffect(() => {
    if (!snapping) return
    let b = 0
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setSnapping(false)) })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [snapping])
  // Going back to measured heights (2 or 1 columns), the heights held are the designed ones of the three-column page. Read the
  // real ones in the same commit, before paint: otherwise the first frame is laid out with the old heights and cards overlap.
  useLayoutEffect(() => {
    if (cols === 3 || !box.current) return
    const real: Record<string, number> = {}
    box.current.querySelectorAll<HTMLElement>("[data-widget-id]").forEach((el) => { real[el.dataset.widgetId!] = el.offsetHeight })
    setHeights((m) => (Object.entries(real).some(([id, h]) => Math.abs((m[id] ?? -1) - h) >= 1) ? { ...m, ...real } : m))
  }, [cols])
  return (
    <div ref={box} className={cn("@container", className)}>
      {/* Before it is measured (server HTML, first paint) the page keeps its cards stacked but invisible: shown stacked, they
          jumped to their columns on hydration, the largest layout shift on every page of widgets. */}
      <div className={cn("g-page relative", !width && "invisible flex flex-col gap-(--gap)")} data-set={widgetSetOf(theme)} data-bg={theme.background} data-finish={widgetFinishOf(theme)} style={{ "--gap": `${gap}px`, height: width ? placed.height : undefined } as React.CSSProperties}>
        {shown.map((w) => {
          const s = placed.spots.get(w.id)!
          // Until the page has been measured (server HTML, first paint) cards stack in the flow at full width, not at width 0.
          const unit = (width + gap) / 12
          const rect = width ? { x: s.x * unit, y: s.top, w: s.w * unit - gap, h: s.height } : null
          return (
            <Cell
              key={w.id}
              w={w}
              rect={rect}
              spring={settled && !snapping}
              held={held === w.id}
              jump={jump === w.id}
              busy={!!busy}
              fixed={fixed}
              info={tileInfo.get(w.id) ?? { band: false, right: false }}
              rev={rev ?? ""}
              onHeight={onHeight}
              render={render}
              wrap={wrap}
              cells={cells}
            />
          )
        })}
        {children}
      </div>
    </div>
  )
}

type CellProps = {
  w: WidgetInstance
  rect: { x: number; y: number; w: number; h: number | undefined } | null
  spring: boolean
  held: boolean
  jump: boolean
  busy: boolean
  fixed: boolean
  info: TileInfo
  rev: string
  onHeight: (id: string, h: number) => void
  render: (w: WidgetInstance, fixed: boolean) => React.ReactNode
  wrap?: (w: WidgetInstance, item: React.ReactNode, info: TileInfo) => React.ReactNode
  cells?: React.RefObject<Map<string, CellMV>>
}

/** Two versions of a card's content are the same when nothing but its place on the page differs (its content never reads x, y, w or h: it adapts to the box it is in). */
const sameContent = (a: WidgetInstance, b: WidgetInstance) => {
  if (a === b) return true
  const ka = Object.keys(a) as (keyof WidgetInstance)[]
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => k === "x" || k === "y" || k === "w" || k === "h" || a[k] === b[k] || (typeof a[k] === "object" && JSON.stringify(a[k]) === JSON.stringify(b[k])))
}

/** A card's content (`render`): drawn again only when the card's own content, `rev` or `fixed` change, not when it only moves or is resized. */
const Content = memo(
  function Content({ w, fixed, render }: { w: WidgetInstance; fixed: boolean; rev: string; render: CellProps["render"] }) {
    return render(w, fixed)
  },
  (a, b) => sameContent(a.w, b.w) && a.rev === b.rev && a.fixed === b.fixed,
)

/**
 * A card's cell: where it is drawn, and the card in it. The position is a transform (compositor only) and the size a width and height, all
 * motion values, so a card that has to move goes there on GRID_SPRING and one moved again mid-flight carries its speed over; nothing
 * animates until the page has settled (no load animation on a student's page). Drawn again only when its content, `rev` or its place changes,
 * so a drag does not draw every widget of the page at every step.
 */
const Cell = memo(function Cell({ w, rect, spring, held, jump, busy, fixed, info, rev, onHeight, render, wrap, cells }: CellProps) {
  void rev
  const reduce = !!useReducedMotion()
  const ready = rect !== null
  // The values start where the card is first drawn (no flash at 0,0, no glide in from nowhere).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mv = useMemo<CellMV | null>(() => (rect ? { x: motionValue(rect.x), y: motionValue(rect.y), w: motionValue(rect.w), h: motionValue(rect.h ?? 0) } : null), [ready])
  const last = useRef<(number | undefined)[]>([])
  const el = useRef<HTMLElement | null>(null)
  const setEl = useCallback((n: HTMLElement | null) => {
    el.current = n
  }, [])
  useEffect(() => {
    if (!mv || !cells) return
    const m = cells.current
    m.set(w.id, mv)
    return () => {
      m.delete(w.id)
    }
  }, [mv, cells, w.id])
  const rx = rect?.x
  const ry = rect?.y
  const rw = rect?.w
  const rh = rect?.h
  useLayoutEffect(() => {
    if (!mv || held) {
      last.current = []
      return
    }
    const to = [rx, ry, rw, rh]
    const vals = [mv.x, mv.y, mv.w, mv.h]
    let now = false
    to.forEach((t, i) => {
      if (t === undefined || last.current[i] === t) return
      last.current[i] = t
      const v = vals[i]
      if (!spring || reduce || jump) {
        v.stop()
        v.set(t)
        now = true
      } else if (v.get() !== t) animate(v, t, GRID_SPRING)
    })
    // A card that goes to its place at once (the page was just laid out, or its columns changed) is there in this commit, not a frame later: the
    // values below are written to the element too (the same ones motion writes next frame), so nothing measures it, or paints it, at its old place.
    const e = el.current
    if (now && e) {
      const x = mv.x.get()
      const y = mv.y.get()
      e.style.transform = [x && `translateX(${x}px)`, y && `translateY(${y}px)`].filter(Boolean).join(" ") || "none"
      e.style.width = `${mv.w.get()}px`
      if (rh !== undefined) e.style.height = `${mv.h.get()}px`
    }
  }, [mv, held, spring, reduce, jump, rx, ry, rw, rh])
  const node = (
    <Measured key={w.id} w={w} onHeight={onHeight} outer={wrap ? undefined : setEl} fill={!!wrap && fixed} style={wrap || !mv ? undefined : { position: "absolute", left: 0, top: 0, x: mv.x, y: mv.y, width: mv.w, ...(rh !== undefined && { height: mv.h }), willChange: busy ? "transform" : undefined }}>
      <Content w={w} fixed={fixed} rev={rev} render={render} />
    </Measured>
  )
  if (!wrap) return node
  return (
    <motion.div
      ref={setEl}
      // Each cell is its own layer (a transform): the one under the pointer or selected is above its neighbours, so its quick bar and edges are never covered.
      className="min-w-0 focus-within:z-[2] hover:z-[2] has-[[data-selected=true]]:z-[3]"
      style={mv ? { position: "absolute", left: 0, top: 0, x: mv.x, y: mv.y, width: mv.w, ...(rh !== undefined && { height: mv.h }), willChange: busy ? "transform" : undefined } : undefined}
    >
      {wrap(w, node, info)}
    </motion.div>
  )
}, (a, b) => sameContent(a.w, b.w) && a.rev === b.rev && a.held === b.held && a.jump === b.jump && a.busy === b.busy && a.spring === b.spring && a.fixed === b.fixed && a.info.band === b.info.band && a.info.right === b.info.right && a.rect?.x === b.rect?.x && a.rect?.y === b.rect?.y && a.rect?.w === b.rect?.w && a.rect?.h === b.rect?.h && a.cells === b.cells && a.onHeight === b.onHeight)

/** A card's `.g-item`: on tablets and phones, and the page title and tool, as tall as its content (measured, so the cards under it know where to start); on the desktop grid the height is set on it. */
function Measured({ w, onHeight, style, fill, outer, children }: { w: WidgetInstance; /** The element, for the cell that places it. */ outer?: (n: HTMLElement | null) => void; onHeight: (id: string, h: number) => void; style?: React.ComponentProps<typeof motion.div>["style"]; /** Fill the cell it is in (the builder wraps it) instead of sizing itself. */ fill?: boolean; children: React.ReactNode }) {
  const def = getWidget(w.type)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new SizeObserver(() => onHeight(w.id, el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [w.id, onHeight])
  return (
    <motion.div
      ref={(n) => {
        ref.current = n
        outer?.(n)
      }}
      data-widget-id={w.id} className={cn("g-item", fill && "h-full", def?.core && "g-core", (def?.core || w.type === "page-header") && "g-plain")} style={style}>
      {children}
    </motion.div>
  )
}

/**
 * One widget as it is drawn everywhere: the live page, the editor's canvas and every thumbnail. Its own style
 * (WidgetStyleScope), then its frame (emphasis, detail, header, the coach's own content), then the widget. One path,
 * so a thumbnail can never differ from the page. `fixed`: the cell gives it its height (a thumbnail of a long widget).
 */
export function WidgetView({ w, live, fixed = false }: { w: WidgetInstance; live?: boolean; fixed?: boolean }) {
  const def = getWidget(w.type)
  if (!def) return null
  const C = def.Component
  return (
    <WidgetStyleScope type={w.type} style={w.style} emphasis={w.emphasis}>
      <WidgetFrame emphasis={w.emphasis} detail={w.detail} header={w.header} note={w.note} core={Boolean(def.core)} fixed={fixed} live={live}>
        <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
      </WidgetFrame>
    </WidgetStyleScope>
  )
}
