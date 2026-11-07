"use client"

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { animate, cancelFrame, frame, motion, motionValue, useReducedMotion, type MotionValue } from "motion/react"
import { Info, LayoutGrid, Minus, Plus } from "@/components/icons"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { Toaster } from "@/components/ui/sonner"
import { GRID_NUDGE, GRID_SPRING, PageRenderer, WidgetGrid, isAvailable, type CellMV, type Placed } from "@/components/widgets/page-renderer"
import { setGridResizing } from "@/components/widgets/parts/resizing"
import { dropAt, gapRects, planTiles, resizeCard, slotAt, type Edges, type PlanOptions, type Target } from "@/components/widgets/page-grid"
import { getWidget, heightFor } from "@/components/widgets/registry"
import { DataModeProvider, PageIdContext, PageTitleShownContext, type DataMode } from "@/components/widgets/parts/shared"
import type { Coach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { widgetFinishOf, widgetSetOf, type CoachTheme } from "@/lib/theme/types"
import { GAP, ROW_HEIGHT, stackOrder, uid, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { resolve, type PickTarget } from "@/lib/design-pick"
import { ShellEditorContext, StudentShell } from "@/components/shells/student-shell"
import type { AddOptions } from "../panels/builder-panels"
import { CANVAS_TOASTS } from "./canvas-toast"
import { GridWidget } from "./grid-widget"
import { DropRect, GapAreas, GapStore, SizePill, SnapGrid, type Rect } from "./drag-marks"
import { useArrange, type Arrange } from "./use-arrange"
import { WidgetMenu } from "./widget-menu"

export { useArrange, type Arrange }

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
const PAD = { desktop: 32, tablet: 24, phone: 16 }

export type Device = "desktop" | "tablet" | "phone"

/** Where a moving or arriving card would land, and the exact rectangle it will take (px on the page). */
type Mark = { at: Target; rect: Rect }
/** What a drag says on the card being resized. */
const colsLabel = (n: number) => `${n} ${n === 1 ? "column" : "columns"}`
/** Rows count in halves: "1 row", "4½ rows", "½ row". */
const rowsLabel = (n: number) => {
  const whole = Math.floor(n + 1e-6)
  const half = n - whole > 0.25
  return `${whole || !half ? whole : ""}${half ? "½" : ""} ${n === 1 ? "row" : "rows"}`
}
/** How long the pointer rests on a spot before the cards in the way move aside (ms). */
const REST = 350
/** The motion values of a card being carried: its box, and how much it is lifted. */
type Carried = { x: MotionValue<number>; y: MotionValue<number>; w: MotionValue<number>; h: MotionValue<number>; s: MotionValue<number> }
/** The pointer while something is dragged. */
const setCursor = (c: string) => {
  document.body.style.cursor = c
}
/** A card that has not been saved yet (a widget on its way in from the library). */
const NEW = "__new"
/** Whether two arrangements are the same cards in the same rectangles. */
const same = (a: WidgetInstance[], b: WidgetInstance[]) => JSON.stringify(a.map((c) => [c.id, c.x, c.y, c.w, c.h])) === JSON.stringify(b.map((c) => [c.id, c.x, c.y, c.w, c.h]))

/**
 * The page as students see it (free cards, see planTiles and WidgetGrid) in the
 * coach's draft theme, at real device width and scaled to fit. Drag a card's edge or
 * corner to resize it: only that card changes, and a card it grows into slides down. Drag a card
 * to move it (a marker shows the rectangle it takes), drop widgets in from the library,
 * right-click for more. "Fill gaps" closes the empty space.
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
  const { page, layout, selected, setSelected, updateItem, removeWidget, duplicateWidget, moveTo, setMeasure } = arrange
  const gap = GAP[theme.density]
  // The empty areas of the page as last laid out (drawn for the coach only).
  const [gapStore] = useState(() => new GapStore())
  // The page as last laid out (where each card is, the tiles it is made of, how it was planned), for dragging and resizing.
  const placed = useRef<Placed | null>(null)
  // The page as it is saved, as last laid out: what a drag starts from. While a move or a drop previews where the cards would go, the page
  // on screen is the preview, so this is not updated then.
  const committed = useRef<WidgetInstance[]>([])
  const previewing = useRef(false)
  const onPlaced = useCallback(
    (p: Placed) => {
      placed.current = p
      if (!previewing.current) committed.current = p.layout
      if (p.cols === 3) setMeasure(p.opts.width)
      const g = p.cols === 3 ? gapRects(p.layout, p, p.opts) : []
      gapStore.set(g)
    },
    [setMeasure, gapStore],
  )
  const grid = useRef<HTMLDivElement>(null)
  // A card being moved: it follows the pointer (a transform, written every frame; no render per pointer move), a rectangle shows what it would
  // take and the cards it would push spring out of the way (`preview`). Dropped, it springs into its rectangle (`settling`). A widget coming in
  // from the library does the same without a card to carry.
  // The top of the block being dragged in: while it is set, the grid shows (the rows are counted from it).
  const [snapTop, setSnapTop] = useState<number | null>(null)
  const [moving, setMoving] = useState<{ id: string; card: WidgetInstance; mv: Carried; mark: Mark | null; preview: WidgetInstance[] | null; settling: boolean } | null>(null)
  const [arriving, setArriving] = useState<{ mark: Mark; preview: WidgetInstance[] | null } | null>(null)
  // A resize: the page is drawn from `live` meanwhile (the cards it pushes spring out of its way); `held` is the card the pointer drives.
  const [live, setLive] = useState<{ id: string; items: WidgetInstance[] } | null>(null)
  // The size of the card being resized, in a pill at the corner being dragged (moved by the pointer through `pillEl`).
  const [pill, setPill] = useState<{ edges: Edges; label: string; atMin: boolean } | null>(null)
  const pillEl = useRef<HTMLDivElement | null>(null)
  const pillAt = useRef("")
  const pillRef = useCallback((el: HTMLDivElement | null) => {
    pillEl.current = el
    if (el) el.style.transform = pillAt.current
  }, [])
  const cells = useRef(new Map<string, CellMV>())
  // The canvas scale is held for the length of any drag: nothing the drag does may rescale the page under the pointer.
  const [hold, setHold] = useState<number | null>(null)
  const scaleNow = useRef(1)
  // A click that ends a drag is not a click on the card.
  const dragged = useRef(false)
  const reduce = !!useReducedMotion()
  // A card on its way out fades before its neighbours take the room.
  const [leaving, setLeaving] = useState<string | null>(null)
  // Cards that arrive after the page was first drawn fade in; the ones it opened with just are there.
  const [known, setKnown] = useState<ReadonlySet<string> | null>(null)
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set())

  /** Px (canvas scale undone) of one twelfth of the page, gap included. */
  const unitPx = () => ((placed.current?.opts.width ?? 0) + gap) / 12 || 1
  /** Grid coordinates (the canvas is scaled) of a pointer. */
  const local = (clientX: number, clientY: number) => {
    const r = grid.current!.getBoundingClientRect()
    const k = r.width / (grid.current!.offsetWidth || 1)
    return { x: (clientX - r.left) / k, y: (clientY - r.top) / k, k }
  }
  /** The canvas scale: screen px per page px. */
  const scaleK = () => (grid.current ? grid.current.getBoundingClientRect().width / (grid.current.offsetWidth || 1) : 1)
  /** Where a card is drawn, px on the page, in these tiles. */
  const rectOf = (items: WidgetInstance[], id: string, o: PlanOptions) => {
    const s = planTiles(items, o).spots.get(id)
    const unit = (o.width + o.gap) / 12
    return s ? { left: s.x * unit, top: s.top, width: s.w * unit - o.gap, height: s.height ?? 0 } : null
  }
  /**
   * What dropping `card` with the pointer at (px, py) does. Over an empty slot (see slotAt) the card takes exactly that slot, and nothing else
   * moves (`slot`). Anywhere else it lands at its own size with its top left where the card's top left is, snapped to a column and a half row,
   * in the block under the pointer (the nearest one); cards it overlaps slide down, but only once the pointer has rested (see `rest`).
   * `grab`: where in the card the pointer holds it. The marker is the exact rectangle the card will take; `preview` is the page with it there.
   */
  const aim = (card: WidgetInstance, px: number, py: number, grab: { x: number; y: number }): { mark: Mark; preview: WidgetInstance[]; slot: boolean } | null => {
    const p = placed.current
    const base = committed.current
    if (!p) return null
    const unit = unitPx()
    const blocks = p.blocks.filter((b) => !b.band)
    let at: Target = { end: true }
    if (blocks.length) {
      const dist = (b: (typeof blocks)[number]) => (py < b.top ? b.top - py : py > b.top + b.height ? py - b.top - b.height : 0)
      const bi = blocks.reduce((best, b, i) => (dist(b) < dist(blocks[best]) ? i : best), 0)
      const b = blocks[bi]
      const slot = dist(b) === 0 ? slotAt(base, card, { block: bi, x: Math.min(11, Math.max(0, Math.floor(px / unit))), y: Math.floor(((py - b.top) / (ROW_HEIGHT + gap)) * 2) / 2 }, p.opts) : null
      at = slot ? { block: bi, x: slot.x, y: slot.y, slot: { w: slot.w, h: slot.h } } : { block: bi, x: Math.round((px - grab.x) / unit), y: Math.round(((py - grab.y - b.top) / (ROW_HEIGHT + gap)) * 2) / 2 }
    }
    const next = dropAt(base, card, at, p.opts)
    const rect = next && rectOf(next, card.id, p.opts)
    return rect && next ? { mark: { at, rect }, preview: next, slot: "slot" in at && !!at.slot } : null
  }
  /** Saves `card` dropped at `mark`. */
  const land = (card: WidgetInstance, mark: Mark | null, key: string) => {
    const p = placed.current
    const base = committed.current
    const next = p ? dropAt(base, card, mark?.at ?? { end: true }, p.opts) : null
    if (!p || !next || same(base, next)) return false
    arrange.commitTiles(next, key)
    return true
  }

  // Moving a card: press and drag; it follows the pointer, a rectangle shows where it lands and the cards in its way spring aside. A click
  // that doesn't drag selects it (a drag does not: picking a card up must not open the inspector and rescale the page).
  const startMove = (e: React.PointerEvent, w: WidgetInstance) => {
    if (e.button !== 0 || (e.target as Element).closest(".no-drag") || !getWidget(w.type)) return
    const cardEl = e.currentTarget as HTMLElement
    const p0 = placed.current
    const mine = committed.current.find((c) => c.id === w.id)
    if (!mine || !p0) return
    const start = { x: e.clientX, y: e.clientY }
    let ptr = { ...start }
    let mv: Carried | null = null
    let dx = 0
    let dy = 0
    let key = ""
    let last: ReturnType<typeof aim> = null
    const own = { width: cardEl.offsetWidth, height: cardEl.offsetHeight }
    // Where the page is on the screen, read once: asking for it every frame would force a layout every frame (the canvas doesn't move during a
    // drag; if the workspace scrolls, the scroll since is taken off).
    const g0 = grid.current!.getBoundingClientRect()
    const k0 = g0.width / (grid.current!.offsetWidth || 1)
    const sc0 = { x: area.current?.scrollLeft ?? 0, y: area.current?.scrollTop ?? 0 }
    const at = (cx: number, cy: number) => ({ x: (cx - g0.left + ((area.current?.scrollLeft ?? 0) - sc0.x)) / k0, y: (cy - g0.top + ((area.current?.scrollTop ?? 0) - sc0.y)) / k0 })
    // The cards in the way only move aside once the pointer has rested on the same spot for REST ms (and come back when it moves on): sweeping
    // across the page moves nothing. An empty slot needs no wait: the card takes it and no other card moves.
    let rest: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      if (!mv) return
      const p = at(ptr.x, ptr.y)
      const a = aim(mine, p.x, p.y, { x: dx, y: dy })
      last = a
      // Over the page the card clicks from grid spot to grid spot (and takes the size of a slot); off it, it follows the pointer at its own size.
      if (!a) {
        mv.x.stop()
        mv.y.stop()
        mv.x.set(p.x - dx)
        mv.y.set(p.y - dy)
        for (const [v, to] of [[mv.w, own.width], [mv.h, own.height]] as const) animate(v, to, reduce ? { duration: 0 } : GRID_NUDGE)
      }
      const k = a ? JSON.stringify(a.mark.at) : ""
      if (k === key) return
      key = k
      clearTimeout(rest)
      if (a) {
        const r = a.mark.rect
        // A step at the same size nudges to the next grid spot. A change of size (into or out of a slot) does not grow the card from where it
        // is towards the slot: it appears in its new rectangle at the new size, with a small pop.
        const resized = Math.abs(mv.w.get() - r.width) > 1 || Math.abs(mv.h.get() - r.height) > 1
        if (resized || reduce) {
          for (const [v, to] of [[mv.x, r.left], [mv.y, r.top], [mv.w, r.width], [mv.h, r.height]] as const) {
            v.stop()
            v.set(to)
          }
          if (resized && !reduce) {
            mv.s.set(0.97)
            animate(mv.s, 1.01, GRID_NUDGE)
          }
        } else for (const [v, to] of [[mv.x, r.left], [mv.y, r.top]] as const) animate(v, to, GRID_NUDGE)
      }
      previewing.current = !!a && a.slot
      setMoving((m) => (m ? { ...m, mark: a?.mark ?? null, preview: a && a.slot ? a.preview : null } : m))
      if (a && !a.slot)
        rest = setTimeout(() => {
          if (key !== k) return
          previewing.current = true
          setMoving((m) => (m ? { ...m, preview: a.preview } : m))
        }, REST)
    }
    const move = (ev: PointerEvent) => {
      ptr = { x: ev.clientX, y: ev.clientY }
      if (mv || Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return
      const p = local(ev.clientX, ev.clientY)
      const r = cardEl.getBoundingClientRect()
      dx = (start.x - r.left) / p.k
      dy = (start.y - r.top) / p.k
      mv = { x: motionValue(p.x - dx), y: motionValue(p.y - dy), w: motionValue(cardEl.offsetWidth), h: motionValue(cardEl.offsetHeight), s: motionValue(1) }
      dragged.current = true
      setHold(scaleNow.current)
      // A slot resizes the carried card: what its widget measures waits, as in a resize, and runs once on release.
      setGridResizing(true)
      document.body.style.cursor = "grabbing"
      setMoving({ id: w.id, card: mine, mv, mark: null, preview: null, settling: false })
      setSnapTop(rectOf(committed.current, w.id, p0.opts)?.top ?? null)
      if (!reduce) animate(mv.s, 1.01, GRID_SPRING)
      frame.update(tick, true)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      document.body.style.cursor = ""
      cancelFrame(tick)
      if (!mv) return
      const m = mv
      setTimeout(() => setGridResizing(false), 380)
      tick()
      clearTimeout(rest)
      // The card springs into the rectangle it takes (or back where it was, if it is dropped nowhere); the real one shows when it is there.
      const a = last
      const to = a?.mark.rect ?? rectOf(committed.current, w.id, p0.opts)
      previewing.current = false
      if (a) land(mine, a.mark, `move-${w.id}-${uid()}`)
      setSnapTop(null)
      setMoving((cur) => (cur ? { ...cur, settling: true } : cur))
      setTimeout(() => (dragged.current = false), 60)
      if (!to) return setMoving(null)
      const done = [animate(m.x, to.left, reduce ? { duration: 0 } : GRID_SPRING), animate(m.y, to.top, reduce ? { duration: 0 } : GRID_SPRING), animate(m.w, to.width, reduce ? { duration: 0 } : GRID_SPRING), animate(m.h, to.height, reduce ? { duration: 0 } : GRID_SPRING), animate(m.s, 1, reduce ? { duration: 0 } : GRID_SPRING)]
      Promise.all(done.map((c) => c.finished)).then(() => {
        setMoving(null)
        setHold(null)
      })
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // A card's edge or corner: press and drag, no need to select first. Only that card changes. The card under the pointer is glued to it: its box
  // is written straight to its motion values every frame (no render per pointer move), clamped where the card can't go (its minimum, the page,
  // the card above). Only when the snapped size changes does React draw the page again, with the cards it pushes springing out of the way. Let
  // go, it springs from where it is to the snapped size. One drag is one undo step.
  const startResize = (e: React.PointerEvent, w: WidgetInstance, edges: Edges) => {
    e.preventDefault()
    e.stopPropagation()
    const p0 = placed.current
    const base = committed.current
    const c0 = base.find((c) => c.id === w.id)
    const r0 = rectOf(base, w.id, p0?.opts ?? ({} as PlanOptions))
    if (!p0 || !c0 || !r0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    const k = scaleK()
    const unit = unitPx()
    const pitch = ROW_HEIGHT + gap
    const x0 = e.clientX
    const y0 = e.clientY
    let next = base
    let key = ""
    let atMin = false
    setSnapTop(r0.top)
    setHold(scaleNow.current)
    setGridResizing(true)
    setCursor(edges.l || edges.r ? (edges.t || edges.b ? (edges.l === edges.t ? "nwse-resize" : "nesw-resize") : "ew-resize") : "ns-resize")
    const tick = () => {
      const m = cells.current.get(w.id)
      if (!m) return
      const left = m.x.get()
      const top = m.y.get()
      const width = m.w.get()
      const height = m.h.get()
      pillAt.current = `translate3d(${edges.r ? left + width : edges.l ? left : left + width / 2}px, ${edges.b ? top + height : edges.t ? top : top + height / 2}px, 0)`
      if (pillEl.current) pillEl.current.style.transform = pillAt.current
    }
    const move = (ev: PointerEvent) => {
      const res = resizeCard(base, w.id, edges, { dx: (ev.clientX - x0) / k / unit, dy: (ev.clientY - y0) / k / pitch }, p0.opts)
      if (!same(res.items, next)) {
        next = res.items
        setLive({ id: w.id, items: next })
        // The card goes from grid step to grid step, in small nudges: the grid is what it snaps to, so it should feel it.
        const m = cells.current.get(w.id)
        const r = rectOf(next, w.id, p0.opts)
        if (m && r) for (const [v, to] of [[m.x, r.left], [m.y, r.top], [m.w, r.width], [m.h, r.height]] as const) {
          if (reduce) v.set(to)
          else animate(v, to, GRID_NUDGE)
        }
      }
      const c = next.find((x) => x.id === w.id)!
      const label = `${colsLabel(c.w)} · ${rowsLabel(c.h)}`
      if (`${label}|${res.atMin}` !== key) {
        key = `${label}|${res.atMin}`
        atMin = res.atMin
        setPill({ edges, label, atMin })
      }
    }
    frame.update(tick, true)
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      cancelFrame(tick)
      setSnapTop(null)
      setCursor("")
      setLive(null)
      setPill(null)
      setHold(null)
      dragged.current = true
      setTimeout(() => (dragged.current = false), 60)
      if (!same(base, next)) arrange.commitTiles(next, `${w.id}-resize-${uid()}`)
      // The measuring hooks of the widgets (what fits, which Detail) run once now, with the card at its snapped size.
      setTimeout(() => setGridResizing(false), 380)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // A widget from the library: a rectangle follows the pointer over the page; dropping adds it there.
  /** What the incoming widget will be as a card: the layout and detail chosen in its details, or the widget's defaults. */
  const incomingCard = (): WidgetInstance | null => {
    const def = incoming && getWidget(incoming.type)
    if (!incoming || !def) return null
    const o = incoming.opts
    const variant = o?.variant ?? def.variants[0].value
    return { id: NEW, type: incoming.type, variant, detail: o?.detail === "standard" ? undefined : o?.detail, props: o && Object.keys(o.props).length ? o.props : undefined, x: 0, y: 0, w: o?.w ?? 12, h: heightFor(def, variant, o?.detail, o?.w ?? 12) }
  }
  const arriveKey = useRef("")
  const arriveRest = useRef<ReturnType<typeof setTimeout>>(undefined)
  const overGrid = (e: React.DragEvent) => {
    if (!incoming) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    const p = local(e.clientX, e.clientY)
    const like = incomingCard()
    if (!like) return
    const a = aim(like, p.x, p.y, { x: (like.w * unitPx()) / 2, y: 24 })
    const k = JSON.stringify(a?.mark.at ?? null)
    if (k === arriveKey.current) return
    arriveKey.current = k
    clearTimeout(arriveRest.current)
    previewing.current = !!a && a.slot
    setArriving(a && { mark: a.mark, preview: a.slot ? a.preview : null })
    // Same wait as for a carried card: the cards in the way move aside once the pointer rests.
    if (a && !a.slot)
      arriveRest.current = setTimeout(() => {
        if (arriveKey.current !== k) return
        previewing.current = true
        setArriving({ mark: a.mark, preview: a.preview })
      }, REST)
  }
  const dropOnGrid = (e: React.DragEvent) => {
    e.preventDefault()
    const mark = arriving?.mark ?? null
    previewing.current = false
    arriveKey.current = ""
    clearTimeout(arriveRest.current)
    setArriving(null)
    const like = incomingCard()
    if (!like) return
    onDropped()
    const w: WidgetInstance = { ...like, id: uid() }
    // Dropped where no card would take it, it goes to the end of the page.
    if (land(w, mark, `drop-${w.id}`)) setSelected(w.id)
  }
  // What the grid draws right now: the page, or while a line is dragged, the page as the line has it.
  // A move or a drop in progress shows the page with the card at its landing spot (the cards it pushes spring aside); a card from the library is not drawn there.
  const preview = moving?.preview ?? arriving?.preview ?? null
  const shown = live ? live.items : preview ? preview.filter((c) => c.id !== NEW) : stackOrder(layout)
  const onTiles = !!layout.tiles || !!live || !!preview
  // The rectangle that shows where a card or widget would land.
  const mark = moving && !moving.settling ? moving.mark : arriving?.mark ?? null
  // What a card's menu and actions read besides the card itself (the grid draws a card again only when this or its content changes).
  const rev = [selected, leaving, allWidgets, moving?.id, [...fresh].join("."), coach.slug, JSON.stringify(coach.modules)].join("|")

  // A card that wasn't on the page when it was first drawn (added, duplicated, put back by undo) fades and scales in. Noticed while rendering,
  // so it never shows a frame at full size first.
  if (known === null) {
    if (shown.length) setKnown(new Set(shown.map((c) => c.id)))
  } else if (shown.length !== known.size || shown.some((c) => !known.has(c.id))) {
    const add = shown.filter((c) => !known.has(c.id)).map((c) => c.id)
    setKnown(new Set(shown.map((c) => c.id)))
    if (add.length) setFresh(new Set([...fresh, ...add]))
  }
  /** Removes a card after it has faded out; its neighbours take the room then. */
  const removeAnimated = (id: string) => {
    if (reduce || arrange.pinned(id) || leaving) return removeWidget(id)
    setLeaving(id)
    setTimeout(() => {
      setLeaving(null)
      removeWidget(id)
    }, 150)
  }

  // What a card's menu and quick bar call: always the latest, so a card that was not drawn again (it only moved) never acts on an old layout.
  const act = useRef({ updateItem, duplicateWidget, moveTo, removeAnimated, startMove, startResize })
  const removeNow = useRef(removeAnimated)
  useEffect(() => {
    act.current = { updateItem, duplicateWidget, moveTo, removeAnimated, startMove, startResize }
    removeNow.current = removeAnimated
  })
  // Delete / Backspace removes the selected widget, Escape deselects. Only while the page has the keyboard: with focus
  // on a control (a button in the inspector, a dropdown, a dialog) those keys belong to it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      // A widget on the canvas can hold the keyboard itself (Tab to it): Delete and Esc act on it.
      const onWidget = t instanceof Element && t.hasAttribute("data-widget-wrap")
      const onPage = t === document.body || onWidget || (t instanceof Node && !!area.current?.contains(t) && !(t instanceof Element && t.closest("input, textarea, select, button, [role], [contenteditable=true]")))
      if (!selected || !onPage) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeNow.current(selected)
      } else if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, setSelected])

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
  const scale = hold ?? (zoom === "fit" ? fit : zoom)
  useEffect(() => {
    scaleNow.current = scale
  })
  // The right panel opening or closing changes the width "fit" fills: the page eases to its new size instead of jumping. Only on fit (a
  // pinch or wheel zoom follows the fingers), only once the page has been drawn (not on load), and not while a line is dragged.
  const [drawn, setDrawn] = useState(false)
  const measured = areaWidth > 0
  useEffect(() => {
    if (!measured) return
    const id = setTimeout(() => setDrawn(true), 800)
    return () => clearTimeout(id)
  }, [measured])
  const easeScale = zoom === "fit" && drawn && hold === null
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
  const canvasCtx = useMemo(() => ({ ...ctx, coach, theme, base: `/c/${coach.slug}` }), [ctx, coach, theme])
  const css = useMemo(() => themeToCss(theme, scope) + SHELL_CSS, [theme])
  const shellCtx = useMemo(() => ({ path: arrange.pageInfo.href, phone: device === "phone", tablet: device === "tablet" }), [arrange.pageInfo.href, device])

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
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      previewing.current = false
                      arriveKey.current = ""
                      clearTimeout(arriveRest.current)
                      setArriving(null)
                    }
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
                  {/* The page as students see it: every card exactly its rectangle. */}
                  <WidgetGrid
                    items={shown}
                    tiles={onTiles}
                    held={live?.id ?? null}
                    jump={moving?.id ?? null}
                    busy={!!live || !!moving || !!arriving}
                    cells={cells}
                    rev={rev}
                    phoneOrder={layout.phoneOrder}
                    onPlaced={onPlaced}
                    render={(w, fixed) => (
                      <WidgetMenu
                        w={w}
                        onOpen={() => setSelected(w.id)}
                        onLook={(variant) => act.current.updateItem(w.id, { variant }, `${w.id}-variant`)}
                        onEmphasis={(emphasis) => act.current.updateItem(w.id, { emphasis }, `${w.id}-emphasis`)}
                        onDetail={(detail) => act.current.updateItem(w.id, { detail }, `${w.id}-detail`)}
                        onDuplicate={() => act.current.duplicateWidget(w.id)}
                        onMove={(where) => act.current.moveTo(w.id, where)}
                        onPhone={(hideOnPhone) => act.current.updateItem(w.id, { hideOnPhone }, `${w.id}-phone`)}
                        onRemove={() => act.current.removeAnimated(w.id)}
                      >
                        <GridWidget w={w} fixed={fixed} selected={selected === w.id} available={isAvailable(w, coach)} onRemove={() => act.current.removeAnimated(w.id)} onDuplicate={() => act.current.duplicateWidget(w.id)} />
                      </WidgetMenu>
                    )}
                    wrap={(w, item, info) => (
                      <div
                        data-widget-wrap
                        role="group"
                        tabIndex={0}
                        aria-label={`${getWidget(w.type)?.name ?? "Widget"}${selected === w.id ? ", selected" : ""}. Press Enter to select, Delete to remove.`}
                        className={cn(
                          "group/wrap relative h-full touch-none rounded-(--radius) outline-none transition-[opacity,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                          fresh.has(w.id) && "hb-enter",
                          leaving === w.id && "scale-[0.98] opacity-0",
                          // The real card is hidden while its copy is carried and settles into its rectangle; the spot it left shows as a quiet empty area.
                          moving?.id === w.id && "[&>[data-hold]]:opacity-0",
                        )}
                        onPointerDown={(e) => act.current.startMove(e, w)}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return
                          e.preventDefault()
                          setSelected(w.id)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!dragged.current) setSelected(w.id)
                        }}
                      >
                        <div data-hold className="h-full">
                          {item}
                        </div>
                        {allWidgets && (
                          <span aria-hidden className="pointer-events-none absolute -inset-[4px] z-20 rounded-[calc(var(--radius)+4px)] border border-dashed border-[var(--ts-interactive)]/50" />
                        )}
                        {/* The card's edges and corners: hit zones inside its own edge and on half the gap around it, so it resizes without being
                            selected first and neighbours' zones never overlap. Not for the page title and tool (as tall as their content). */}
                        {!info.band &&
                          HANDLES.map((hd) => (
                            <span
                              key={hd.name}
                              role="presentation"
                              data-handle={hd.name}
                              className={cn("no-drag absolute", hd.corner ? "z-[32]" : "z-30")}
                              style={{ ...hd.style, cursor: hd.cursor }}
                              onPointerDown={(e) => act.current.startResize(e, w, hd.edges)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ))}
                      </div>
                    )}
                  >
                    {/* The empty areas of the page, very quiet (the coach's view only), and the size of the card being resized. */}
                    {!live && <GapAreas store={gapStore} />}
                    <SnapGrid top={snapTop ?? mark?.rect.top ?? null} gap={gap} pitch={ROW_HEIGHT + gap} />
                    {pill && <SizePill {...pill} pillRef={pillRef} />}
                    {/* The rectangle a card or widget would take where it is dropped. */}
                    <DropRect rect={mark?.rect ?? null} />
                    {/* The card being moved, under the pointer (a transform, written every frame), a little lifted; dropped, it springs into its rectangle. */}
                    {moving && (
                      <motion.div
                        key="carried"
                        data-carried
                        className="pointer-events-none absolute top-0 left-0 z-50 shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)]"
                        style={{ x: moving.mv.x, y: moving.mv.y, width: moving.mv.w, height: moving.mv.h, scale: moving.mv.s, borderRadius: "var(--radius)", willChange: "transform" }}
                      >
                        <GridWidget w={moving.card} fixed selected={false} available={isAvailable(moving.card, coach)} onRemove={() => {}} onDuplicate={() => {}} />
                      </motion.div>
                    )}
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
      <style dangerouslySetInnerHTML={{ __html: css }} />
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
        <div className="relative mx-auto" style={{ width: logicalWidth * scale, height: canvasHeight * scale, minWidth: logicalWidth * scale, transition: easeScale ? "width 180ms var(--ease-out), min-width 180ms var(--ease-out)" : undefined }}>
          {/* The frame's outline is drawn here, at screen size, with no drop shadow: a blurred shadow on a dark grey shows as banded strips beside the frame. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.08]" style={{ borderRadius: device === "desktop" ? 12 : 28 }} />
          <DataModeProvider value={data}>
            <BodyCtx.Provider value={body}>
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
              className={cn(canvasClass, "origin-top-left overflow-hidden bg-background font-sans text-foreground", spaceDown && "pointer-events-none")}
              // The same corners as the preview frame (12px on screen, 28px on a tablet or phone), whatever the zoom.
              style={{ width: logicalWidth, transform: `scale(${scale})`, transition: easeScale ? "transform 180ms var(--ease-out)" : undefined, padding: shellOn ? 0 : PAD[device], borderRadius: (device === "desktop" ? 12 : 28) / (scale || 1), "--ui-zoom": scale ? Math.min(2.5, 1 / scale) : 1 } as React.CSSProperties}
            >
              {shellOn ? (
                <ShellEditorContext.Provider value={shellCtx}>
                  <ShellFrame>{BODY}</ShellFrame>
                </ShellEditorContext.Provider>
              ) : (
                BODY
              )}
            </div>
            </BodyCtx.Provider>
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
        {/* Only when the page has empty space: one click closes it (one undo step). */}
        {arrange.gaps && device === "desktop" && (
          <>
            <span aria-hidden className="mx-1 h-5 w-px bg-white/12" />
            <button type="button" data-fill-gaps className={cn(BAR, "px-2.5 text-xs")} title="Close the empty space between cards" onClick={arrange.fillAll}>
              Fill gaps
            </button>
          </>
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
  // A card that arrives fades and scales in (0.98 to 1); reduced motion zeroes it in globals.css.
  `@keyframes hb-in{from{opacity:0;scale:.98}to{opacity:1;scale:1}}.hb-enter{animation:hb-in 180ms var(--ease-out)}` +
  `[data-shell] [data-slot=sidebar-container]{height:auto!important}[data-shell] .min-h-svh{min-height:0!important}` +
  // Click to edit shows itself: a part that opens a setting (the logo, the menu, a heading, a label) is outlined under the pointer, as in the preview.
  // Only the innermost part: pointing at a menu item outlines the item, not also the whole side menu around it.
  `[data-shell] :is([data-edit],h1,h2,h3,.eyebrow):not([data-slot=widget] *):not(:has([data-edit]:hover)):hover{outline:calc(1.5px * var(--ui-zoom,1)) solid rgb(244 244 245 / .55);outline-offset:3px;border-radius:4px;cursor:pointer}`

/** A click inside a widget, its quick bar or the canvas tools: the builder's own, never click-to-edit. */
const inWidget = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-widget-id], .group\\/wrap, .no-drag, [role=toolbar]")

/** Hit zones of a card: inside its edge (6px on the screen) and half the gap outside it; corners are squares over both edges. */
const IN = "calc(6px * var(--ui-zoom,1))"
const OUT = "calc(var(--gap) / 2)"
const OUTN = `calc(${OUT} * -1)`
const EDGE = `calc(${IN} + ${OUT})`
const CORNER = `calc(12px * var(--ui-zoom,1) + ${OUT})`
const HANDLES: { name: string; edges: Edges; cursor: string; corner?: boolean; style: React.CSSProperties }[] = [
  { name: "right", edges: { r: true }, cursor: "ew-resize", style: { top: 0, bottom: 0, right: OUTN, width: EDGE } },
  { name: "left", edges: { l: true }, cursor: "ew-resize", style: { top: 0, bottom: 0, left: OUTN, width: EDGE } },
  { name: "top", edges: { t: true }, cursor: "ns-resize", style: { left: 0, right: 0, top: OUTN, height: EDGE } },
  { name: "bottom", edges: { b: true }, cursor: "ns-resize", style: { left: 0, right: 0, bottom: OUTN, height: EDGE } },
  { name: "top-left", edges: { t: true, l: true }, cursor: "nwse-resize", corner: true, style: { top: OUTN, left: OUTN, width: CORNER, height: CORNER } },
  { name: "top-right", edges: { t: true, r: true }, cursor: "nesw-resize", corner: true, style: { top: OUTN, right: OUTN, width: CORNER, height: CORNER } },
  { name: "bottom-left", edges: { b: true, l: true }, cursor: "nesw-resize", corner: true, style: { bottom: OUTN, left: OUTN, width: CORNER, height: CORNER } },
  { name: "bottom-right", edges: { b: true, r: true }, cursor: "nwse-resize", corner: true, style: { bottom: OUTN, right: OUTN, width: CORNER, height: CORNER } },
]

/**
 * The page's content is handed to the platform's shell through a context: the shell (side menu, top bar) draws again only when it changes
 * itself, not at every step of a drag. `BODY` is the same element every time, so the shell is skipped, and `Body` draws what the editor says.
 */
const BodyCtx = createContext<React.ReactNode>(null)
function Body() {
  return useContext(BodyCtx)
}
const BODY = <Body />
const ShellFrame = memo(function ShellFrame({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>
})

/** Zoom steps for − and +, as in Figma. */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 2]
/** One button of the floating canvas bar: 32px, white on near-black, a lighter fill on hover. */
const BAR = "grid h-8 min-w-8 grid-flow-col place-items-center rounded-lg text-white/70 outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.96]"

