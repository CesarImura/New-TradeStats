"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { verticalCompactor } from "react-grid-layout/core"
import { ArrowDownToLine, ArrowUpToLine, Copy, EyeOff, Info, LayoutGrid, Lock, Pencil, Trash2 } from "@/components/icons"
import { toast as notify, type ExternalToast } from "sonner"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { PageRenderer, WidgetGrid, isAvailable, placeItems, type Placement } from "@/components/widgets/page-renderer"
import { WidgetFrame } from "@/components/widgets/kit"
import { WidgetStyleScope } from "@/components/widgets/widget-scope"
import { fitWidth, getWidget, heightFor, heightOf, lookOf, pageWidth, widthsFor } from "@/components/widgets/registry"
import { DataModeProvider, PageIdContext, PageTitleShownContext, type DataMode } from "@/components/widgets/shared"
import type { Coach } from "@/lib/data/coaches"
import { useGroups } from "@/lib/data/access"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { pageLayout } from "@/lib/theme/resolve"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { isPageId } from "@/lib/data/coaches"
import { COLS, GAP, ROW_HEIGHT, normalizeLayout, readingOrder, oneStar, uid, withCore, type Detail, type Emphasis, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { DETAIL, EMPHASIS, PHASE_LABEL, SizeIcons, WIDTH, type AddOptions } from "./builder-panels"
import type { useDraftEditor } from "./editor-shell"

/**
 * The canvas's notices ("added at the bottom", "removed"…) have their own toaster, top right under the editor's bar,
 * so while they show they never sit over the cards' resize handles or quick actions at the bottom of the canvas.
 */
const CANVAS_TOASTS = "canvas"
const toast = (message: string, data?: ExternalToast) => notify(message, { ...data, toasterId: CANVAS_TOASTS })

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
 * ADM-37 / ADM-39: the layout of one student page, per tier, and every edit
 * to it. Home is all widgets; a module page also has its core widget (the
 * page's own tool), which can move and resize but not be removed.
 */
export function useArrange({
  coach,
  theme,
  editor,
  page,
  tier,
  selected,
  setSelected,
}: {
  coach: Coach
  theme: CoachTheme
  editor: ReturnType<typeof useDraftEditor>
  page: PageId
  tier: string
  selected: string | null
  setSelected: (id: string | null) => void
}) {
  const { working, commit } = editor
  // Two-column widgets the canvas draws at the whole width right now (nothing fits beside them), reported by its masonry.
  const [expanded, setExpanded] = useState<string[]>([])
  const pages = studentNav(coach, `/c/${coach.slug}`)
  const pageInfo = pages.find((p) => p.id === page) ?? pages[0]
  const layouts = coach.pages?.[page] ?? {}
  const baseLayout = pageLayout(coach, page, theme.template, undefined, heightOf)
  const inherits = tier !== "default" && !layouts[tier]
  const own = (l: PageLayout) => (page === "home" || isPageId(page) ? l : withCore(page, l))
  const layout = tier === "default" || !layouts[tier] ? baseLayout : own(normalizeLayout(layouts[tier], heightOf))
  const tierName = coach.tiers.find((t) => t.id === tier)?.name
  const savePages = (next: typeof layouts, key: string) =>
    commit({ ...working, content: { ...working.content, pages: { ...coach.pages, [page]: next } } }, `${page}-${key}`)

  /**
   * Every edit goes through here. Only one Star per page: `keep` names the
   * widget that just became the star; any other star becomes Accent in the
   * same commit, so one undo brings both back.
   */
  const save = (next: PageLayout, key: string, keep?: string) => {
    const items = oneStar(next.items, keep)
    const demoted = next.items.filter((w, i) => w.emphasis === "star" && items[i].emphasis !== "star")
    // Keep "title removed on purpose", and set it when this save drops the Page title.
    const titleRemoved = page !== "home" && !items.some((w) => w.type === "page-header") ? true : undefined
    // An edit that doesn't touch the arrangement keeps it free (each widget in the column it was put in).
    const free = next.free ?? layout.free
    savePages({ ...layouts, [tier]: { ...next, items, titleRemoved, free } }, `${tier}-${key}`)
    if (demoted.length) {
      const names = demoted.map((w) => getWidget(w.type)?.name ?? "A widget").join(", ")
      toast(`${names} gave up ${demoted.length > 1 ? "their" : "its"} star.`, { description: "Only one Star per page; it is Accent now." })
    }
    if (inherits) toast(`${tierName} now has its own ${pageInfo.label} page. Other tiers keep the default.`)
  }
  const pinned = (id: string) => !!getWidget(layout.items.find((w) => w.id === id)?.type ?? "")?.core
  const updateItem = (id: string, patch: Partial<WidgetInstance>, key: string) => {
    const cur = layout.items.find((w) => w.id === id)
    const def = cur && getWidget(cur.type)
    // A new layout keeps the width only if the layout allows it (its minW to maxW), else the nearest it allows.
    if (cur && def && patch.variant) patch = { ...patch, w: fitWidth(def, patch.variant, patch.w ?? cur.w) }
    // Detailed shows more, so it gets more rows (and back); widgets below move down to make room.
    if (cur && def && patch.detail && patch.detail !== (cur.detail ?? "standard")) {
      const grow = heightFor(def, cur.variant, patch.detail) - heightFor(def, cur.variant, cur.detail)
      const next = { ...cur, ...patch, h: Math.max(lookOf(def, cur.variant).minH, cur.h + grow) }
      saveCompacted(layout.items.map((w) => (w.id === id ? next : w)), key)
      return
    }
    save({ items: layout.items.map((w) => (w.id === id ? { ...w, ...patch } : w)) }, key, patch.emphasis === "star" ? id : undefined)
  }

  const addWidget = (type: string) => {
    const def = getWidget(type)!
    const look = def.variants[0]
    const bottom = layout.items.reduce((m, w) => Math.max(m, w.y + w.h), 0)
    const w: WidgetInstance = { id: uid(), type, x: 0, y: bottom, w: fitWidth(def, look.value, def.defaultW), h: look.h }
    save({ items: [...layout.items, w] }, `add-${w.id}`)
    setSelected(w.id)
    toast(`${def.name} added at the bottom. Drag it where you want it.`)
  }

  /** Save with the grid compacted upward, so the live page never has overlaps. */
  const saveCompacted = (items: WidgetInstance[], key: string) => {
    const packed = verticalCompactor.compact(items.map((w) => ({ i: w.id, x: w.x, y: w.y, w: w.w, h: w.h })), COLS)
    const pos = new Map(packed.map((g) => [g.i, g]))
    save({ items: items.map((w) => ({ ...w, x: pos.get(w.id)!.x, y: pos.get(w.id)!.y })) }, key)
  }
  const removeWidget = (id: string) => {
    if (pinned(id)) {
      toast(`${pageInfo.label} is the main part of this page, so it stays. Move or resize it instead.`)
      return
    }
    const def = getWidget(layout.items.find((w) => w.id === id)?.type ?? "")
    saveCompacted(layout.items.filter((w) => w.id !== id), `del-${id}`)
    if (selected === id) setSelected(null)
    toast(`${def?.name ?? "Widget"} removed.`, { description: "Press ⌘Z to undo." })
  }
  const duplicateWidget = (id: string) => {
    const w = layout.items.find((x) => x.id === id)
    if (!w || pinned(id)) return
    // A copy of the star is Accent: the original keeps the star.
    const copy: WidgetInstance = { ...w, id: uid(), y: w.y + w.h, emphasis: w.emphasis === "star" ? "accent" : w.emphasis }
    saveCompacted([...layout.items, copy], `dup-${copy.id}`)
    setSelected(copy.id)
  }
  const moveTo = (id: string, where: "top" | "bottom") =>
    saveCompacted(layout.items.map((w) => (w.id === id ? { ...w, y: where === "top" ? -1 : 9999 } : w)), `order-${uid()}`)
  const useDefault = () => {
    const rest = { ...layouts }
    delete rest[tier]
    savePages(rest, `reset-${tier}`)
    toast(`${tierName} uses the default ${pageInfo.label} page again.`)
  }

  return {
    page,
    tier,
    pageInfo,
    layout,
    layouts,
    inherits,
    tierName,
    selected,
    setSelected,
    selWidget: layout.items.find((w) => w.id === selected) ?? null,
    expanded,
    setExpanded,
    pinned,
    save,
    updateItem,
    addWidget,
    removeWidget,
    duplicateWidget,
    moveTo,
    useDefault,
  }
}

export type Arrange = ReturnType<typeof useArrange>

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
    if (e.button !== 0 || (e.target as Element).closest(".no-drag") || getWidget(w.type)?.core === undefined && !getWidget(w.type)) return
    const card = e.currentTarget as HTMLElement
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
      const span = placed.current?.spots.get(w.id)?.span ?? 1
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
    let next = { id: w.id, w: pageWidth(w.w), col: spot.col, base }
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
      if (next.w === pageWidth(w.w) && next.col === spot.col) return
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

  // Delete / Backspace removes the selected widget, Escape deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable=true]")) return
      if (!selected) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeWidget(selected)
      } else if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

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
  const logicalWidth = DEVICE_WIDTH[device]
  const scale = areaWidth ? Math.min(1, (areaWidth - 32) / logicalWidth) : 1

  const scope = ".hb-canvas"
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${coach.slug}` }

  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!layout.items.some((w) => w.type === "page-header")}>
    <CoachContext.Provider value={canvasCtx}>
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
      <Toaster id={CANVAS_TOASTS} position="top-right" offset={{ top: 60, right: 16 }} />
      {/* Stacked (narrow screens) the prototype bar sits over the bottom right: room at the foot lets the last cards scroll clear of it. */}
      <div ref={area} className="h-full min-h-[60svh] min-w-0 overflow-x-hidden overflow-y-auto p-4 pb-32 md:pb-20 lg:min-h-0 lg:pb-4" onClick={() => setSelected(null)}>
        {device !== "desktop" && (
          <div className="mx-auto mb-3 flex max-w-xl items-center gap-2 rounded-[6px] border bg-card px-3 py-2 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0" />
            This is how the page reflows on {device === "tablet" ? "tablets" : "phones"}. Arrange widgets on desktop; the order here follows it, top to bottom and left to right.
          </div>
        )}
        <div className="mx-auto" style={{ width: logicalWidth * scale, height: canvasHeight * scale }}>
          <DataModeProvider value={data}>
            <div
              ref={canvas}
              data-canvas={device}
              className={cn(canvasClass, "origin-top-left bg-background font-sans text-foreground shadow-xl ring-1 ring-black/10", device === "desktop" ? "rounded-xl" : "rounded-[28px]")}
              style={{ width: logicalWidth, transform: `scale(${scale})`, padding: PAD[device] }}
            >
              {page === "home" && (
                <div className="pointer-events-none mb-[var(--page-gap)] flex flex-col gap-1 opacity-80">
                  <span className="eyebrow">Monday, 12 October</span>
                  <h1 className="text-3xl leading-tight">Good morning, {DEMO_STUDENT.first}</h1>
                </div>
              )}

              {device === "desktop" ? (
                <div
                  ref={grid}
                  className="hb-set relative"
                  data-set={widgetSetOf(theme)}
                  data-finish={widgetFinishOf(theme)}
                  style={{ minHeight: 6 * (ROW_HEIGHT + gap), "--gap": `${gap}px` } as React.CSSProperties}
                  onDragOver={overGrid}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setArriving(null)
                  }}
                  onDrop={dropOnGrid}
                >
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
                    onPlaced={onPlaced}
                    render={(w) =>
                      w.id === SLOT ? (
                        // Where the card lands: the page has already made room for it.
                        <div
                          className="rounded-(--radius) border-2 border-dashed border-[#ff5500]/70 bg-[#ff5500]/[0.06]"
                          style={{ height: slotHeight(w), transition: "height 200ms" }}
                        />
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
                          <GridWidget w={w} selected={selected === w.id} available={isAvailable(w, coach)} onRemove={() => removeWidget(w.id)} onDuplicate={() => duplicateWidget(w.id)} />
                        </WidgetMenu>
                      )
                    }
                    wrap={(w, item) =>
                      w.id === SLOT ? (
                        item
                      ) : (
                        <div
                          className="group/wrap relative touch-none"
                          onPointerDown={(e) => startMove(e, w)}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(w.id)
                          }}
                        >
                          {item}
                          {allWidgets && (
                            <span aria-hidden className="pointer-events-none absolute -inset-[4px] z-20 rounded-[calc(var(--radius)+4px)] border-[1.5px] border-dashed border-[#ff5500]/75" />
                          )}
                          {/* The selected widget's bar, under it: how to move it, and its width in one click. */}
                          {selected === w.id && !moving && !resizing && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="no-drag absolute top-full left-0 z-40 mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-[#18181b] py-1 pr-1 pl-3 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap text-white shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]"
                            >
                              <span>Drag to move. Pull a side to resize.</span>
                              {!getWidget(w.type)?.core && w.type !== "page-header" && widthsFor(getWidget(w.type)!, w.variant).length > 1 && (
                                <span className="flex items-center gap-1.5 border-l border-white/15 pl-3 text-white/70">
                                  Size
                                  <SizeIcons value={pageWidth(w.w)} allowed={widthsFor(getWidget(w.type)!, w.variant)} onChange={(cols) => updateItem(w.id, { w: cols }, `${w.id}-width`)} />
                                </span>
                              )}
                            </div>
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
            </div>
          </DataModeProvider>
        </div>
      </div>
    </CoachContext.Provider>
    </PageTitleShownContext.Provider>
    </PageIdContext.Provider>
  )
}

/** One widget on the builder grid: the real widget, plus its name and selection outline. */
/** Right-click menu for a widget on the grid. */
function WidgetMenu({
  w,
  children,
  onOpen,
  onLook,
  onEmphasis,
  onDetail,
  onWidth,
  onDuplicate,
  onMove,
  onPhone,
  onRemove,
}: {
  w: WidgetInstance
  children: React.ReactNode
  onOpen: () => void
  onLook: (variant: string, minH: number) => void
  onEmphasis: (emphasis: Emphasis) => void
  onDetail: (detail: Detail) => void
  /** Columns: 4 (one), 8 (two) or 12 (the page's full width), as the layout allows (widthsFor). */
  onWidth: (cols: number) => void
  onDuplicate: () => void
  onMove: (where: "top" | "bottom") => void
  onPhone: (hide: boolean) => void
  onRemove: () => void
}) {
  const def = getWidget(w.type)
  if (!def) return <>{children}</>
  const look = lookOf(def, w.variant)
  return (
    <ContextMenu onOpenChange={(open) => open && onOpen()}>
      <ContextMenuTrigger render={<div className="size-full select-auto" />}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 font-[family-name:var(--ff-geist)]">
        <ContextMenuGroup>
          <ContextMenuLabel className="text-xs text-muted-foreground">{def.name}</ContextMenuLabel>
          <ContextMenuItem onClick={onOpen}>
            <Pencil /> Edit settings
          </ContextMenuItem>
          {def.variants.length > 1 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Layout</ContextMenuSubTrigger>
              <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
                <ContextMenuRadioGroup value={look.value} onValueChange={(v) => onLook(String(v), def.variants.find((x) => x.value === v)?.minH ?? 1)}>
                  {def.variants.map((v) => (
                    <ContextMenuRadioItem key={v.value} value={v.value}>
                      {v.label}
                    </ContextMenuRadioItem>
                  ))}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger>Emphasis</ContextMenuSubTrigger>
            <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
              <ContextMenuRadioGroup value={w.emphasis ?? "accent"} onValueChange={(v) => onEmphasis(v as Emphasis)}>
                {EMPHASIS.map((o) => (
                  <ContextMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Detail</ContextMenuSubTrigger>
            <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
              <ContextMenuRadioGroup value={w.detail ?? "standard"} onValueChange={(v) => onDetail(v as Detail)}>
                {DETAIL.map((o) => (
                  <ContextMenuRadioItem key={o.value} value={o.value}>
                    {o.label}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          {!def.core && w.type !== "page-header" && widthsFor(def, w.variant).length > 1 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Width</ContextMenuSubTrigger>
              <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
                <ContextMenuRadioGroup value={pageWidth(w.w)} onValueChange={(v) => onWidth(Number(v))}>
                  {WIDTH.map((o) => (
                    <ContextMenuRadioItem key={o.value} value={o.value} disabled={!widthsFor(def, w.variant).includes(o.value)}>
                      {o.label}
                    </ContextMenuRadioItem>
                  ))}
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          {!def.core && (
            <ContextMenuItem onClick={onDuplicate}>
              <Copy /> Duplicate
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onMove("top")}>
            <ArrowUpToLine /> Bring to top
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onMove("bottom")}>
            <ArrowDownToLine /> Send to bottom
          </ContextMenuItem>
          {!def.core && (
            <ContextMenuCheckboxItem checked={!!w.hideOnPhone} onCheckedChange={(v) => onPhone(!!v)}>
              Hide on phones
            </ContextMenuCheckboxItem>
          )}
        </ContextMenuGroup>
        {!def.core && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 /> Remove
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

function GridWidget({ w, selected, available, onRemove, onDuplicate }: { w: WidgetInstance; selected: boolean; available: boolean; onRemove: () => void; onDuplicate: () => void }) {
  const def = getWidget(w.type)
  const { coach } = useCoach()
  const groups = useGroups(coach)
  if (!def) return null
  const C = def.Component
  // Widgets with a visibility rule stay on the canvas, tagged with who sees them.
  const rule = [w.show?.phase && PHASE_LABEL[w.show.phase], w.show?.group && (groups.find((g) => g.id === w.show?.group)?.name ?? "A group")].filter(Boolean).join(" · ")
  return (
    <div
      className={cn(
        // The admin's own orange, never the coach's colour: a selected widget always reads as the editor's selection.
        "group/w relative flex cursor-grab flex-col rounded-[calc(var(--radius)+2px)] outline-2 outline-offset-2 outline-transparent hover:outline-[#ff5500]/40 active:cursor-grabbing",
        selected && "outline-[#ff5500]",
      )}
    >
      {/* Name, rule and quick actions sit on the card's top edge, half above it, so they never cover its header. .no-drag keeps
          clicks on the actions from starting a drag; the actions also show while one of them has keyboard focus. */}
      <div className="pointer-events-none absolute inset-x-2 top-0 z-20 flex -translate-y-[60%] items-center gap-1 font-[family-name:var(--ff-geist)]">
        <span
          className="min-w-0 truncate rounded-md bg-foreground px-1.5 py-0.5 text-[0.65rem] text-background opacity-0 group-hover/w:opacity-100 data-[on=true]:opacity-100"
          data-on={selected}
          title={def.name}
        >
          {def.core && <Lock className="mr-1 inline size-2.5 align-[-1px]" />}
          {def.core ? `${def.name} · main part of the page` : def.name}
          {w.header && Object.keys(w.header).length > 0 && " · own header"}
          {w.style && Object.values(w.style).some((v) => v !== undefined) && " · own style"}
          {w.emphasis === "star" && " · Star"} · {WIDTH.find((o) => o.value === pageWidth(w.w))?.label.toLowerCase()}
        </span>
        <span className="ml-auto" />
        {rule && <span className="max-w-[45%] shrink-0 truncate rounded-[3px] bg-[#ff5500] px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium tracking-[0.04em] text-black uppercase">{rule}</span>}
        <div
          className="no-drag pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-lg border bg-background p-0.5 text-foreground opacity-0 shadow-sm transition-opacity group-hover/w:opacity-100 focus-within:opacity-100 data-[on=true]:opacity-100"
          data-on={selected}
        >
          {w.hideOnPhone && (
            <span className="flex items-center gap-1 px-1.5 text-[0.65rem] text-muted-foreground" title="Hidden on phones">
              <EyeOff className="size-3" />
            </span>
          )}
          {def.core ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
              <Lock className="size-3" /> Always on this page
            </span>
          ) : (
            <>
              <Button variant="ghost" size="icon-xs" aria-label={`Duplicate ${def.name}`} onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
                <Copy />
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label={`Remove ${def.name}`} className="hover:text-destructive" onClick={(e) => { e.stopPropagation(); onRemove() }}>
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="pointer-events-none flex flex-col select-none">
        {available ? (
          <WidgetStyleScope type={w.type} style={w.style} emphasis={w.emphasis}>
            <WidgetFrame emphasis={w.emphasis} detail={w.detail} header={w.header} note={w.note} core={Boolean(def.core)} fixed={false}>
              <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
            </WidgetFrame>
          </WidgetStyleScope>
        ) : (
          <div className="grid place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its page is switched off in the Menu step.
          </div>
        )}
      </div>
    </div>
  )
}
