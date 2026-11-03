"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Info, LayoutGrid, Minus, Plus, Wand2 } from "@/components/icons"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { Toaster } from "@/components/ui/sonner"
import { PageRenderer, WidgetGrid, isAvailable, placeItems, spanOf, widthOf, type Placement } from "@/components/widgets/page-renderer"
import { fitWidth, getWidget, heightFor, widthsFor } from "@/components/widgets/registry"
import { DataModeProvider, PageIdContext, PageTitleShownContext, type DataMode } from "@/components/widgets/parts/shared"
import type { Coach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { COLS, GAP, ROW_HEIGHT, readingOrder, uid, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { resolve, type PickTarget } from "@/lib/design-pick"
import { ShellEditorContext, StudentShell } from "@/components/shells/student-shell"
import { WIDTH, type AddOptions } from "../panels/builder-panels"
import { CANVAS_TOASTS, toast } from "./canvas-toast"
import { GridWidget } from "./grid-widget"
import { useArrange, type Arrange } from "./use-arrange"
import { WidgetMenu } from "./widget-menu"

export { useArrange, type Arrange }

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
const PAD = { desktop: 32, tablet: 24, phone: 16 }

export type Device = "desktop" | "tablet" | "phone"

/** The grid as laid out: each card's spot and height, and the column width. */
type GridPlaced = Placement & { cols: number; colWidth: number; heights: Record<string, number> }
/** Where a moving or arriving card would land: its first column, its width in columns, its place in the order. */
type Slot = { col: number; span: number; index: number }
/** The id of the spot drawn where a card would land. */
const SLOT = "__slot"


/**
 * The page as students see it (a masonry, see Masonry in page-renderer) in
 * the coach's draft theme, at real device width and scaled to fit. Drag a card
 * to change the order, drop widgets in from the library, right-click for more
 * (look, detail, width: one column or full width).
 */
export function ArrangeCanvas({
  arrange,
  coach,
  theme,
  device,
  data,
  incoming,
  onDropped,
  allWidgets,
  shell,
  onPick,
}: {
  arrange: Arrange
  coach: Coach
  theme: CoachTheme
  device: Device
  data: DataMode
  /** Widget type being dragged in from the library. */
  incoming: { type: string; opts?: AddOptions } | null
  onDropped: () => void
  /** The panel edits every widget's style: every widget gets the group outline, so the scope shows on the page too. */
  allWidgets?: boolean
  /** Draw the platform's menu and header round the page (desktop): the editor's one screen. */
  shell?: boolean
  /** A click on a part of the platform that is not a widget: the setting that changes it. */
  onPick?: (target: PickTarget) => void
}) {
  const ctx = useCoach()
  const { page, layout, selected, setSelected, save, updateItem, removeWidget, duplicateWidget, moveTo } = arrange
  const gap = GAP[theme.density]
  // The grid as last laid out (where each card is, its height, the column width), for dragging and resizing.
  const placed = useRef<GridPlaced | null>(null)
  const onPlaced = useCallback((p: GridPlaced) => {
    placed.current = p
  }, [])
  const grid = useRef<HTMLDivElement>(null)
  // A card being moved (it follows the pointer; its spot shows where it lands), a widget coming in from the library
  // (its spot shows where it lands), or a card being resized sideways (the page reflows round its new width).
  // Each keeps the page as it was when it started (`base`, every widget with its column), so the page drawn meanwhile never reads the grid back.
  const [moving, setMoving] = useState<{ id: string; x: number; y: number; dx: number; dy: number; width: number; h: number; slot: Slot; base: WidgetInstance[] } | null>(null)
  const [arriving, setArriving] = useState<(Slot & { base: WidgetInstance[] }) | null>(null)
  const [resizing, setResizing] = useState<{ id: string; w: number; col: number; base: WidgetInstance[] } | null>(null)

  /** The page in reading order with every widget's column (pages arranged before the free grid get the columns they show). */
  const frozen = () => {
    const order = readingOrder(layout.items)
    const p = placed.current
    if (layout.free || !p) return order
    return order.map((w) => ({ ...w, x: (p.spots.get(w.id)?.col ?? 0) * 4 }))
  }
  /** Saves an arrangement: positions in the order they read on the page (top to bottom, then left to right). */
  const saveArranged = (items: WidgetInstance[], key: string) => {
    const p = placed.current
    const gapPx = GAP[theme.density]
    const at = placeItems(items, 3, p?.heights ?? {}, gapPx, true)
    const order = [...items].sort((a, b) => at.spots.get(a.id)!.top - at.spots.get(b.id)!.top || at.spots.get(a.id)!.col - at.spots.get(b.id)!.col)
    save({ items: order.map((w, i) => ({ ...w, x: at.spots.get(w.id)!.col * 4, y: i })), free: true }, key)
  }
  /**
   * Arrange automatically: packs the page so it has as few holes as it can. The page title stays first. Then, one card at
   * a time, the card (and its columns) that leaves the least room unused above it goes next, starting as high as it can;
   * on a tie the card that came first in reading order. So a full-width card waits until the columns are about level,
   * and short cards fill the gaps beside the tall ones.
   */
  const tidy = () => {
    const p = placed.current
    const heightOf = (w: WidgetInstance) => p?.heights[w.id] ?? 200
    const tops = [0, 0, 0]
    const out: WidgetInstance[] = []
    const put = (w: WidgetInstance, col: number) => {
      const span = spanOf(w, 3)
      const top = Math.max(...tops.slice(col, col + span))
      for (let c = col; c < col + span; c++) tops[c] = top + heightOf(w) + gap
      out.push({ ...w, x: col * 4 })
    }
    const order = readingOrder(layout.items)
    const left = order.filter((w) => w.type !== "page-header")
    order.filter((w) => w.type === "page-header").forEach((w) => put(w, 0))
    while (left.length) {
      let best: { i: number; col: number; waste: number; top: number } | null = null
      left.forEach((w, i) => {
        const span = spanOf(w, 3)
        for (let c = 0; c + span <= 3; c++) {
          const top = Math.max(...tops.slice(c, c + span))
          const waste = tops.slice(c, c + span).reduce((n, t) => n + top - t, 0)
          if (!best || waste < best.waste - 1 || (Math.abs(waste - best.waste) <= 1 && top < best.top - 1)) best = { i, col: c, waste, top }
        }
      })
      const { i, col } = best!
      put(left.splice(i, 1)[0], col)
    }
    saveArranged(out, `tidy-${uid()}`)
    toast("Page arranged", { description: "Undo puts it back the way it was." })
  }
  /**
   * Where a card `span` columns wide lands with its top left corner at (left, top) on the grid: the column nearest
   * to it, and its place in the order: before the first card in those columns whose middle is below the pointer.
   */
  const slotAt = (items: WidgetInstance[], span: number, left: number, pointerY: number): Slot => {
    const p = placed.current
    const colW = p?.colWidth ?? 300
    const col = Math.max(0, Math.min(3 - span, Math.round(left / (colW + gap))))
    const at = placeItems(items, 3, p?.heights ?? {}, gap, true)
    const index = items.findIndex((w) => {
      const s = at.spots.get(w.id)!
      const h = p?.heights[w.id] ?? 0
      return s.col < col + span && col < s.col + s.span && s.top + h / 2 > pointerY
    })
    return { col, span, index: index < 0 ? items.length : index }
  }
  /** Grid coordinates (the canvas is scaled) of a pointer. */
  const local = (clientX: number, clientY: number) => {
    const r = grid.current!.getBoundingClientRect()
    const k = r.width / (grid.current!.offsetWidth || 1)
    return { x: (clientX - r.left) / k, y: (clientY - r.top) / k, k }
  }
  /** The page with a spot (`__slot`) where the moving or arriving card would land. */
  const withSlot = (items: WidgetInstance[], slot: Slot, like: Partial<WidgetInstance>): WidgetInstance[] => {
    const next = [...items]
    next.splice(slot.index, 0, { ...like, id: SLOT, type: like.type ?? "text", x: slot.col * 4, y: 0, w: slot.span === 3 ? COLS : slot.span * 4, h: like.h ?? 4 } as WidgetInstance)
    return next
  }

  // Moving a card: press and drag; it follows the pointer and the page makes room where it would land.
  const startMove = (e: React.PointerEvent, w: WidgetInstance) => {
    if (e.button !== 0 || (e.target as Element).closest(".no-drag") || !getWidget(w.type)) return
    const card = e.currentTarget as HTMLElement
    // Read once: after the first move the card is out of the grid (its slot stands in), so placed.current no longer has it.
    const span = spanOf(w, 3)
    const start = { x: e.clientX, y: e.clientY }
    let live: typeof moving = null
    const base = frozen().filter((o) => o.id !== w.id)
    const move = (ev: PointerEvent) => {
      if (!live && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return
      const p = local(ev.clientX, ev.clientY)
      if (!live) {
        const r = card.getBoundingClientRect()
        live = { id: w.id, x: 0, y: 0, dx: (start.x - r.left) / p.k, dy: (start.y - r.top) / p.k, width: card.offsetWidth, h: placed.current?.heights[w.id] ?? 160, slot: { col: 0, span: 1, index: 0 }, base }
        setSelected(w.id)
        document.body.style.cursor = "grabbing"
      }
      live = { ...live, x: p.x - live.dx, y: p.y - live.dy, slot: slotAt(base, span, p.x - live.dx, p.y) }
      setMoving(live)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      document.body.style.cursor = ""
      setMoving(null)
      if (!live) return
      const next = [...base]
      next.splice(live.slot.index, 0, { ...w, x: live.slot.col * 4 })
      saveArranged(next, `move-${w.id}-${uid()}`)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // Resizing from a card's side: sideways sets the width (one, two or three columns, as its layout allows); the page reflows as it goes.
  const startResize = (e: React.PointerEvent, w: WidgetInstance, side: "left" | "right") => {
    e.preventDefault()
    e.stopPropagation()
    const def = getWidget(w.type)
    const p0 = placed.current
    const spot = p0?.spots.get(w.id)
    if (!def || !p0 || !spot) return
    const handle = e.currentTarget as HTMLElement
    handle.setPointerCapture(e.pointerId)
    const k = local(e.clientX, e.clientY).k
    const x0 = e.clientX
    const startW = spot.span * p0.colWidth + (spot.span - 1) * gap
    const base = frozen()
    let next = { id: w.id, w: widthOf(w), col: spot.col, base }
    setResizing(next)
    setSelected(w.id)
    const move = (ev: PointerEvent) => {
      const d = ((ev.clientX - x0) / k) * (side === "left" ? -1 : 1)
      const cols = Math.max(1, Math.min(3, Math.round((startW + d + gap) / (p0.colWidth + gap))))
      const width = fitWidth(def, w.variant, cols * 4)
      const span = width >= COLS ? 3 : width >= 8 ? 2 : 1
      // From the left side the card grows to the left: its right edge stays.
      const col = side === "left" ? Math.max(0, spot.col + spot.span - span) : Math.min(spot.col, 3 - span)
      next = { id: w.id, w: width, col, base }
      setResizing(next)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      setResizing(null)
      if (next.w === widthOf(w) && next.col === spot.col) return
      saveArranged(base.map((o) => (o.id === w.id ? { ...o, w: next.w, x: next.col * 4 } : o)), `${w.id}-resize`)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // A widget from the library: its spot follows the pointer over the page; dropping adds it there.
  const incomingSpan = () => {
    const def = incoming && getWidget(incoming.type)
    if (!def) return 1
    const w = incoming.opts?.w ?? fitWidth(def, def.variants[0].value, def.defaultW)
    return w >= COLS ? 3 : w >= 8 ? 2 : 1
  }
  const overGrid = (e: React.DragEvent) => {
    if (!incoming) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    const p = local(e.clientX, e.clientY)
    const span = incomingSpan()
    const colW = placed.current?.colWidth ?? 300
    const base = arriving?.base ?? frozen()
    const slot = slotAt(base, span, p.x - (span * colW) / 2, p.y)
    if (!arriving || slot.col !== arriving.col || slot.index !== arriving.index || slot.span !== arriving.span) setArriving({ ...slot, base })
  }
  const dropOnGrid = (e: React.DragEvent) => {
    e.preventDefault()
    const slot = arriving
    setArriving(null)
    const type = incoming?.type
    const o = incoming?.opts
    if (!type) return
    onDropped()
    const def = getWidget(type)
    if (!def) return
    // From its details: the size, layout, detail and options chosen there; from the gallery: its defaults.
    const w: WidgetInstance = o
      ? { id: uid(), type, x: 0, y: 0, w: o.w, h: heightFor(def, o.variant, o.detail), variant: o.variant, detail: o.detail === "standard" ? undefined : o.detail, props: Object.keys(o.props).length ? o.props : undefined }
      : { id: uid(), type, x: 0, y: 0, w: fitWidth(def, def.variants[0].value, def.defaultW), h: def.variants[0].h }
    const next = frozen()
    const at = slot ?? { col: 0, span: 1, index: next.length }
    next.splice(at.index, 0, { ...w, x: at.col * 4 })
    saveArranged(next, `drop-${w.id}`)
    setSelected(w.id)
  }
  // What the grid draws right now: the page, with the spot of a card being moved or added, or a card at its new width.
  const shown = (() => {
    if (moving) return withSlot(moving.base, moving.slot, { type: layout.items.find((o) => o.id === moving.id)?.type })
    if (arriving && incoming) {
      const def = getWidget(incoming.type)
      const h = def ? heightFor(def, incoming.opts?.variant ?? def.variants[0].value, incoming.opts?.detail) : 4
      return withSlot(arriving.base, arriving, { type: incoming.type, h })
    }
    if (resizing) return resizing.base.map((o) => (o.id === resizing.id ? { ...o, w: resizing.w, x: resizing.col * 4 } : o))
    return readingOrder(layout.items)
  })()
  const free = layout.free || !!moving || !!(arriving && incoming) || !!resizing
  // The spot is as tall as the card it stands for: the moving card's own height, or the new widget's estimate.
  const slotHeight = (w: WidgetInstance) => (moving ? moving.h : (w.h * (ROW_HEIGHT + gap) - gap))

  // Delete / Backspace removes the selected widget, Escape deselects. Only while the page has the keyboard: with focus
  // on a control (a button in the inspector, a dropdown, a dialog) those keys belong to it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      const onPage = t === document.body || (t instanceof Node && !!area.current?.contains(t) && !(t instanceof Element && t.closest("input, textarea, select, button, [role], [contenteditable=true]")))
      if (!selected || !onPage) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeWidget(selected)
      } else if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, removeWidget, setSelected])

  // The canvas is laid out at real device width and scaled to fit the space.
  const area = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const [areaWidth, setAreaWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)
  useEffect(() => {
    const a = area.current
    const c = canvas.current
    if (!a || !c) return
    const ro = new ResizeObserver(() => {
      setAreaWidth(a.clientWidth)
      setCanvasHeight(c.offsetHeight)
    })
    ro.observe(a)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  // The page is drawn inside the platform's menu and header (StudentShell): at a laptop's width on desktop, at the
  // device's on tablet and phone (where the shell takes its phone layout from the editor, not from the window).
  const shellOn = !!shell
  const logicalWidth = shellOn && device === "desktop" ? 1440 : DEVICE_WIDTH[device]
  // Zoom, as in Framer and Figma: "fit" fills the width; a number is a fixed scale and the workspace scrolls both ways.
  const [zoom, setZoom] = useState<number | "fit">("fit")
  const fit = areaWidth ? Math.min(1, (areaWidth - 96) / logicalWidth) : 1
  const scale = zoom === "fit" ? fit : zoom
  const stepZoom = (dir: 1 | -1) => setZoom((z) => {
    const now = z === "fit" ? fit : z
    const next = dir > 0 ? ZOOMS.find((v) => v > now + 0.001) : [...ZOOMS].reverse().find((v) => v < now - 0.001)
    return next ?? now
  })
  // ⌘/Ctrl + scroll and pinch zoom round the pointer; ⌘ + / − / 0 step and fit. Space + drag (or the middle button) moves the page.
  useEffect(() => {
    const a = area.current
    if (!a) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => Math.min(2, Math.max(0.25, (z === "fit" ? fit : z) * Math.exp(-e.deltaY / 300))))
    }
    a.addEventListener("wheel", onWheel, { passive: false })
    return () => a.removeEventListener("wheel", onWheel)
  }, [fit])
  const [spaceDown, setSpaceDown] = useState(false)
  useEffect(() => {
    const typing = (t: EventTarget | null) => t instanceof Element && !!t.closest("input, textarea, select, [contenteditable=true]")
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      if (e.code === "Space" && !e.repeat) {
        setSpaceDown(true)
        e.preventDefault()
      }
      if (!(e.metaKey || e.ctrlKey)) return
      const act = { "=": () => stepZoom(1), "+": () => stepZoom(1), "-": () => stepZoom(-1), "0": () => setZoom("fit") }[e.key]
      if (!act) return
      e.preventDefault()
      act()
    }
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpaceDown(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  })
  const startPan = (e: React.PointerEvent) => {
    if (!(spaceDown || e.button === 1)) return
    e.preventDefault()
    e.stopPropagation()
    const a = area.current!
    const start = { x: e.clientX, y: e.clientY, l: a.scrollLeft, t: a.scrollTop }
    const move = (ev: PointerEvent) => {
      a.scrollLeft = start.l - (ev.clientX - start.x)
      a.scrollTop = start.t - (ev.clientY - start.y)
    }
    const end = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
  }

  const scope = ".hb-canvas"
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${coach.slug}` }

  // The page as students get it: on desktop inside the platform's own menu and header (the shell), so the editor is one screen.
  const body = (
    <>
              {page === "home" && (
                <div className={cn("mb-[var(--page-gap)] flex flex-col gap-1 opacity-80", !shellOn && "pointer-events-none")}>
                  <span className="eyebrow">Monday, 12 October</span>
                  <h1 className="text-3xl leading-tight">Good morning, {DEMO_STUDENT.first}</h1>
                </div>
              )}

              {device === "desktop" ? (
                <div
                  ref={grid}
                  className="hb-set relative"
                  data-set={widgetSetOf(theme)}
                  data-bg={theme.background}
                  data-finish={widgetFinishOf(theme)}
                  style={{ minHeight: 6 * (ROW_HEIGHT + gap), "--gap": `${gap}px` } as React.CSSProperties}
                  onDragOver={overGrid}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setArriving(null)
                  }}
                  onDrop={dropOnGrid}
                >
                  {/* A widget is on its way from the gallery: the whole page takes it. */}
                  {incoming && (
                    <span aria-hidden className="pointer-events-none absolute -inset-3 z-0 rounded-[calc(var(--radius)+12px)] border-2 border-dashed border-[var(--ts-interactive)]/35 transition-opacity" />
                  )}
                  {layout.items.length === 0 && !arriving && (
                    <div className="pointer-events-none grid min-h-48 place-items-center rounded-(--radius) border-2 border-dashed text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <LayoutGrid className="size-4" /> Drag widgets from the gallery onto the page
                      </span>
                    </div>
                  )}
                  {/* The page as students see it: each card in the column it was put in, as high as the cards above it allow. */}
                  <WidgetGrid
                    items={shown}
                    free={free}
                    phoneOrder={layout.phoneOrder}
                    onPlaced={onPlaced}
                    render={(w, fixed) =>
                      w.id === SLOT ? (
                        // Where the card lands: the page has already made room for it.
                        <div
                          className="grid place-items-center rounded-(--radius) border-2 border-dashed border-[var(--ts-interactive)]/70 bg-[var(--ts-interactive)]/[0.06] font-[family-name:var(--ff-geist)] text-xs font-medium text-[var(--ts-interactive)]"
                          style={{ minHeight: slotHeight(w), flex: "none", transition: "min-height 200ms" }}
                        >
                          {!moving && `Drop here · ${WIDTH.find((o) => o.value === widthOf(w))?.label}`}
                        </div>
                      ) : (
                        <WidgetMenu
                          w={w}
                          onOpen={() => setSelected(w.id)}
                          onLook={(variant, minH) => updateItem(w.id, { variant, h: Math.max(w.h, minH) }, `${w.id}-variant`)}
                          onEmphasis={(emphasis) => updateItem(w.id, { emphasis }, `${w.id}-emphasis`)}
                          onDetail={(detail) => updateItem(w.id, { detail }, `${w.id}-detail`)}
                          onWidth={(cols) => updateItem(w.id, { w: cols }, `${w.id}-width`)}
                          onDuplicate={() => duplicateWidget(w.id)}
                          onMove={(where) => moveTo(w.id, where)}
                          onPhone={(hideOnPhone) => updateItem(w.id, { hideOnPhone }, `${w.id}-phone`)}
                          onRemove={() => removeWidget(w.id)}
                        >
                          <GridWidget w={w} fixed={fixed} selected={selected === w.id} available={isAvailable(w, coach)} onRemove={() => removeWidget(w.id)} onDuplicate={() => duplicateWidget(w.id)} onWidth={(cols) => updateItem(w.id, { w: cols }, `${w.id}-width`)} />
                        </WidgetMenu>
                      )
                    }
                    wrap={(w, item) =>
                      w.id === SLOT ? (
                        item
                      ) : (
                        <div
                          className="group/wrap relative h-full touch-none"
                          onPointerDown={(e) => startMove(e, w)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(w.id)
                          }}
                        >
                          {item}
                          {allWidgets && (
                            <span aria-hidden className="pointer-events-none absolute -inset-[4px] z-20 rounded-[calc(var(--radius)+4px)] border border-dashed border-[var(--ts-interactive)]/50" />
                          )}
                          {/* Resize: pull either side to set the width (one, two or three columns). Only for widgets with more than one width. */}
                          {!getWidget(w.type)?.core &&
                            w.type !== "page-header" &&
                            widthsFor(getWidget(w.type)!, w.variant).length > 1 &&
                            (["left", "right"] as const).map((side) => (
                              <span
                                key={side}
                                role="presentation"
                                title="Drag sideways to change the width"
                                className={cn(
                                  "no-drag absolute top-1/2 z-30 flex h-16 max-h-[60%] w-3 -translate-y-1/2 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/wrap:opacity-100 data-[on=true]:opacity-100",
                                  side === "left" ? "-left-1.5" : "-right-1.5",
                                )}
                                data-on={selected === w.id || resizing?.id === w.id}
                                onPointerDown={(e) => startResize(e, w, side)}
                              >
                                <span className="h-full w-1.5 rounded-full border border-black/20 bg-white shadow-sm" />
                              </span>
                            ))}
                          {resizing?.id === w.id && (
                            <span className="pointer-events-none absolute top-2 left-1/2 z-40 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap text-background shadow">
                              {WIDTH.find((o) => o.value === resizing.w)?.label}
                            </span>
                          )}
                        </div>
                      )
                    }
                  >
                    {/* The card being moved, under the pointer, a little lifted. */}
                    {moving &&
                      (() => {
                        const w = layout.items.find((o) => o.id === moving.id)
                        if (!w) return null
                        return (
                          <div className="pointer-events-none absolute z-50 rotate-[0.6deg] opacity-95 drop-shadow-[0_18px_30px_rgb(0_0_0/0.35)]" style={{ left: moving.x, top: moving.y, width: moving.width }}>
                            <GridWidget w={w} selected available={isAvailable(w, coach)} onRemove={() => {}} onDuplicate={() => {}} />
                          </div>
                        )
                      })()}
                  </WidgetGrid>
                </div>
              ) : (
                <div className="pointer-events-none">
                  <PageRenderer layout={layout} />
                </div>
              )}
    </>
  )

  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!layout.items.some((w) => w.type === "page-header")}>
    <CoachContext.Provider value={canvasCtx}>
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) + SHELL_CSS }} />
      <Toaster id={CANVAS_TOASTS} position="top-right" offset={{ top: 60, right: 16 }} />
      {/* Stacked (narrow screens) the prototype bar sits over the bottom right: room at the foot lets the last cards scroll clear of it. */}
      <div className="relative h-full min-h-[60svh] lg:min-h-0">
      {/* The workspace: a mid grey round the page, so the page (in the coach's colours) always stands out from the editor's black panels. */}
      <div
        ref={area}
        className={cn("h-full min-w-0 overflow-auto bg-[#2b2b2e] px-12 pt-16 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", spaceDown && "cursor-grab active:cursor-grabbing")}
        onClick={() => setSelected(null)}
        onPointerDownCapture={startPan}
      >
        {device !== "desktop" && (
          <div className="mx-auto mb-3 flex max-w-xl items-center gap-2 rounded-[6px] border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0" />
            This is how the page reflows on {device === "tablet" ? "tablets" : "phones"}. Arrange widgets on desktop; the order here follows it, top to bottom and left to right.
          </div>
        )}
        <div className="mx-auto" style={{ width: logicalWidth * scale, height: canvasHeight * scale, minWidth: logicalWidth * scale }}>
          <DataModeProvider value={data}>
            <div
              ref={canvas}
              data-canvas={device}
              data-shell={shellOn || undefined}
              // Click to edit (one screen): the platform's own links and menus never act; a click on anything that is not a widget
              // opens the setting that changes it (the logo, the menu, a heading, the background), as the preview did.
              onPointerDownCapture={(e) => {
                if (!shellOn || inWidget(e.target)) return
                e.stopPropagation()
              }}
              onClickCapture={(e) => {
                if (!shellOn || inWidget(e.target)) return
                e.preventDefault()
                e.stopPropagation()
                // Empty space only clears the selection; the background is set from Theme, never by a stray click.
                const hit = resolve(e.target as Element)?.target
                if (!hit || hit === "background") setSelected(null)
                else onPick?.(hit)
              }}
              className={cn(canvasClass, "origin-top-left overflow-hidden bg-background font-sans text-foreground shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)]", spaceDown && "pointer-events-none")}
              // The same corners as the preview frame (12px on screen, 28px on a tablet or phone), whatever the zoom.
              style={{ width: logicalWidth, transform: `scale(${scale})`, padding: shellOn ? 0 : PAD[device], borderRadius: (device === "desktop" ? 12 : 28) / (scale || 1), "--ui-zoom": scale ? Math.min(2.5, 1 / scale) : 1 } as React.CSSProperties}
            >
              {shellOn ? (
                <ShellEditorContext.Provider value={{ path: arrange.pageInfo.href, phone: device === "phone", tablet: device === "tablet" }}>
                  <StudentShell>{body}</StudentShell>
                </ShellEditorContext.Provider>
              ) : (
                body
              )}
            </div>
          </DataModeProvider>
        </div>
      </div>
      {/* The floating bar under the page (Framer, Figma): zoom, fit, and arranging the page. */}
      <div role="toolbar" aria-label="Canvas" className="absolute bottom-4 left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/10 bg-[#141416] p-1 text-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)]">
        <button type="button" className={BAR} aria-label="Zoom out" title="Zoom out (⌘ −)" onClick={() => stepZoom(-1)}>
          <Minus className="size-4" />
        </button>
        <button type="button" className={cn(BAR, "w-14 text-xs tabular-nums")} title="Fit to screen (⌘ 0)" aria-label={`Zoom ${Math.round(scale * 100)}%. Fit to screen`} onClick={() => setZoom("fit")}>
          {Math.round(scale * 100)}%
        </button>
        <button type="button" className={BAR} aria-label="Zoom in" title="Zoom in (⌘ +)" onClick={() => stepZoom(1)}>
          <Plus className="size-4" />
        </button>
        <span aria-hidden className="mx-1 h-5 w-px bg-white/12" />
        <button type="button" className={cn(BAR, "px-2.5 text-xs", zoom === "fit" && "text-white")} aria-pressed={zoom === "fit"} title="Fit the page to the screen (⌘ 0)" onClick={() => setZoom("fit")}>
          Fit
        </button>
        {device === "desktop" && layout.items.length > 1 && (
          <button type="button" className={cn(BAR, "gap-1.5 px-2.5 text-xs")} title="Moves the widgets so the page has no gaps. Undo puts them back." onClick={tidy}>
            <Wand2 className="size-4" /> Arrange
          </button>
        )}
      </div>
      </div>
    </CoachContext.Provider>
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

/**
 * The platform's shell drawn inside the canvas: the canvas is scaled (a transform), so the shell's fixed parts (the side
 * menu, the backdrop) are placed in it already; they just must not take the window's height.
 */
const SHELL_CSS =
  `[data-shell] [data-slot=sidebar-container]{height:auto!important}[data-shell] .min-h-svh{min-height:0!important}` +
  // Click to edit shows itself: a part that opens a setting (the logo, the menu, a heading, a label) is outlined under the pointer, as in the preview.
  // Only the innermost part: pointing at a menu item outlines the item, not also the whole side menu around it.
  `[data-shell] :is([data-edit],h1,h2,h3,.eyebrow):not([data-slot=widget] *):not(:has([data-edit]:hover)):hover{outline:calc(1.5px * var(--ui-zoom,1)) solid rgb(244 244 245 / .55);outline-offset:3px;border-radius:4px;cursor:pointer}`

/** A click inside a widget, its quick bar or the canvas tools: the builder's own, never click-to-edit. */
const inWidget = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-widget-id], .group\\/wrap, .no-drag, [role=toolbar]")

/** Zoom steps for − and +, as in Figma. */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 2]
/** One button of the floating canvas bar: 32px, white on near-black, a lighter fill on hover. */
const BAR = "grid h-8 min-w-8 grid-flow-col place-items-center rounded-lg text-white/70 outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.96]"

