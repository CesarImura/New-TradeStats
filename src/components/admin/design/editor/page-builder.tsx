"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { verticalCompactor } from "react-grid-layout/core"
import { ArrowDownToLine, ArrowUpToLine, Copy, EyeOff, Info, LayoutGrid, Lock, Minus, Pencil, Plus, Trash2, Wand2 } from "@/components/icons"
import { toast as notify, type ExternalToast } from "sonner"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
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
import { PageRenderer, WidgetGrid, WidgetView, isAvailable, placeItems, spanOf, widthOf, type Placement } from "@/components/widgets/page-renderer"
import { fitWidth, getWidget, heightFor, heightOf, lookOf, widthsFor } from "@/components/widgets/registry"
import { DataModeProvider, PageIdContext, PageTitleShownContext, type DataMode } from "@/components/widgets/parts/shared"
import type { Coach } from "@/lib/data/coaches"
import { useGroups } from "@/lib/data/access"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { pageLayout } from "@/lib/theme/resolve"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { isPageId } from "@/lib/data/coaches"
import { COLS, GAP, ROW_HEIGHT, normalizeLayout, readingOrder, oneStar, uid, withCore, type Detail, type Emphasis, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { resolve, type PickTarget } from "@/lib/design-pick"
import { ShellEditorContext, StudentShell } from "@/components/shells/student-shell"
import { DETAIL, EMPHASIS, PHASE_LABEL, WIDTH, type AddOptions } from "../panels/builder-panels"
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
                    onPlaced={onPlaced}
                    render={(w) =>
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
                          <GridWidget w={w} selected={selected === w.id} available={isAvailable(w, coach)} onRemove={() => removeWidget(w.id)} onDuplicate={() => duplicateWidget(w.id)} onWidth={(cols) => updateItem(w.id, { w: cols }, `${w.id}-width`)} />
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
        className={cn("h-full min-w-0 overflow-auto bg-[#2b2b2e] px-12 pt-10 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", spaceDown && "cursor-grab active:cursor-grabbing")}
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
                <ShellEditorContext.Provider value={{ path: arrange.pageInfo.href, phone: device === "phone" }}>
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
  `[data-shell] :is([data-edit],h1,h2,h3,.eyebrow):not([data-slot=widget] *):hover{outline:calc(1.5px * var(--ui-zoom,1)) solid rgb(244 244 245 / .55);outline-offset:3px;border-radius:4px;cursor:pointer}`

/** A click inside a widget, its quick bar or the canvas tools: the builder's own, never click-to-edit. */
const inWidget = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-widget-id], .group\\/wrap, .no-drag, [role=toolbar]")

/** Zoom steps for − and +, as in Figma. */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 2]
/** One button of the floating canvas bar: 32px, white on near-black, a lighter fill on hover. */
const BAR = "grid h-8 min-w-8 grid-flow-col place-items-center rounded-lg text-white/70 outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.96]"

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
            <ContextMenuSubTrigger>Stand out</ContextMenuSubTrigger>
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
            <ContextMenuSubTrigger>Shows</ContextMenuSubTrigger>
            <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
              <ContextMenuRadioGroup value={w.detail ?? "standard"} onValueChange={(v) => onDetail(v as Detail)}>
                {DETAIL.map((o) => (
                  <ContextMenuRadioItem key={o.value} value={o.value}>
                    {{ compact: "Less", standard: "Standard", detailed: "More" }[o.value]}
                  </ContextMenuRadioItem>
                ))}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          {!def.core && w.type !== "page-header" && widthsFor(def, w.variant).length > 1 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Width</ContextMenuSubTrigger>
              <ContextMenuSubContent className="font-[family-name:var(--ff-geist)]">
                <ContextMenuRadioGroup value={widthOf(w)} onValueChange={(v) => onWidth(Number(v))}>
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

/** The editor's own chips on the canvas (a widget's name, its quick bar): near-black with white text and a fine light edge, the same on every theme. */
// --ui-zoom undoes the canvas's scale, so the editor's chips keep their real size (24px buttons) however small the page is drawn.
const EDITOR_CHIP = "[zoom:var(--ui-zoom,1)] bg-[#141416] text-white shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_6px_16px_-6px_rgb(0_0_0/0.7)]"
/** One button of the quick bar: 24px tall, a lighter fill on hover, the orange ring on keyboard focus. */
const QUICK = "grid h-6 min-w-6 place-items-center rounded-md outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--ts-interactive)] active:scale-[0.94]"

/** One widget on the builder grid: the real widget, plus its name and selection outline. */
function GridWidget({ w, selected, available, onRemove, onDuplicate, onWidth }: { w: WidgetInstance; selected: boolean; available: boolean; onRemove: () => void; onDuplicate: () => void; onWidth?: (cols: number) => void }) {
  const def = getWidget(w.type)
  const { coach } = useCoach()
  const groups = useGroups(coach)
  if (!def) return null
  const widths = !def.core && w.type !== "page-header" ? widthsFor(def, w.variant) : []
  // Widgets with a visibility rule stay on the canvas, tagged with who sees them.
  const rule = [w.show?.phase && PHASE_LABEL[w.show.phase], w.show?.group && (groups.find((g) => g.id === w.show?.group)?.name ?? "A group")].filter(Boolean).join(" · ")
  return (
    <div
      className={cn(
        // The editor's selection colour (white, --ts-interactive in the workspace), never a coach's: a selected widget always reads as selected.
        "group/w relative flex cursor-grab flex-col rounded-[calc(var(--radius)+2px)] outline-[calc(1.5px*var(--ui-zoom,1))] outline-offset-2 outline-transparent hover:outline-[var(--ts-interactive)]/35 active:cursor-grabbing",
        selected && "outline-[var(--ts-interactive)]",
      )}
    >
      {/* Name, rule and quick actions sit on the card's top edge, half above it, so they never cover its header. .no-drag keeps
          clicks on the actions from starting a drag; the actions also show while one of them has keyboard focus. */}
      <div className="pointer-events-none absolute inset-x-2 top-0 z-20 flex -translate-y-[60%] items-center gap-1 font-[family-name:var(--ff-geist)]">
        <span
          // Its name on hover; once selected the inspector names it, and the quick bar takes the edge.
          className={cn("min-w-0 truncate rounded-md px-1.5 py-0.5 text-[0.65rem] opacity-0 group-hover/w:opacity-100 data-[on=true]:hidden", EDITOR_CHIP)}
          data-on={selected}
          title={def.name}
        >
          {def.core && <Lock className="mr-1 inline size-2.5 align-[-1px]" />}
          {def.core ? `${def.name} · main part of the page` : def.name}
          {w.header && Object.keys(w.header).length > 0 && " · own header"}
          {w.style && Object.values(w.style).some((v) => v !== undefined) && " · own style"}
          {w.emphasis === "star" && " · Star"} · {WIDTH.find((o) => o.value === widthOf(w))?.label.toLowerCase()}
        </span>
        <span className="ml-auto" />
        {rule && <span className="max-w-[45%] shrink-0 truncate rounded-[3px] bg-[var(--ts-interactive)] px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium tracking-[0.04em] text-black uppercase">{rule}</span>}
        {/* The quick bar: the width in one click (selected only), duplicate and remove. On the card's own top edge, so it never
            covers the widget below; in the editor's colours, not the coach's, so it reads the same on every theme. */}
        <div
          role="toolbar"
          aria-label={`${def.name} quick actions`}
          className={cn("no-drag pointer-events-auto flex h-7 shrink-0 items-center gap-0.5 rounded-lg p-0.5 opacity-0 transition-opacity duration-150 group-hover/w:opacity-100 focus-within:opacity-100 data-[on=true]:opacity-100", EDITOR_CHIP)}
          data-on={selected}
          onClick={(e) => e.stopPropagation()}
        >
          {w.hideOnPhone && (
            <span className="flex items-center gap-1 px-1.5 text-white/60" title="Hidden on phones" aria-label="Hidden on phones">
              <EyeOff className="size-3.5" />
            </span>
          )}
          {selected && onWidth && widths.length > 1 && (
            <>
              <span role="radiogroup" aria-label="Width" className="flex items-center gap-0.5">
                {WIDTH.filter((o) => widths.includes(o.value)).map((o) => {
                  const on = widthOf(w) === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => onWidth(o.value)}
                      className={cn(QUICK, "w-8", on ? "bg-white text-black hover:bg-white hover:text-black" : "text-white/75")}
                    >
                      <span aria-hidden className="grid h-2.5 w-5 grid-cols-3 gap-px">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className={cn("rounded-[1px] bg-current", i >= o.value / 4 && "opacity-30")} />
                        ))}
                      </span>
                    </button>
                  )
                })}
              </span>
              <span aria-hidden className="mx-0.5 h-4 w-px bg-white/15" />
            </>
          )}
          {def.core ? (
            <span className="flex items-center gap-1 px-1.5 text-[0.65rem] text-white/75">
              <Lock className="size-3" /> Always on this page
            </span>
          ) : (
            <>
              <button type="button" aria-label={`Duplicate ${def.name}`} title="Duplicate" className={cn(QUICK, "text-white/75")} onClick={onDuplicate}>
                <Copy className="size-3.5" />
              </button>
              <button type="button" aria-label={`Remove ${def.name}`} title="Remove (⌫)" className={cn(QUICK, "text-white/75 hover:text-[#ff6b6b]")} onClick={onRemove}>
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="pointer-events-none flex flex-col select-none">
        {available ? (
          <WidgetView w={w} />
        ) : (
          <div className="grid place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its page is switched off in the Menu step.
          </div>
        )}
      </div>
    </div>
  )
}
