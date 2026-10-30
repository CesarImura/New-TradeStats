"use client"

import { useEffect, useRef, useState } from "react"
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
import { Masonry, PageRenderer, isAvailable } from "@/components/widgets/page-renderer"
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
    savePages({ ...layouts, [tier]: { ...next, items, titleRemoved } }, `${tier}-${key}`)
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
  const { page, layout, selected, setSelected, save, updateItem, removeWidget, duplicateWidget, moveTo, expanded, setExpanded } = arrange
  const gap = GAP[theme.density]
  // The card being dragged, and where it would land (before or after a card).
  const [dragging, setDragging] = useState<string | null>(null)
  const [target, setTarget] = useState<{ id: string; after: boolean } | null>(null)
  // Resizing from a card's corner: sideways sets the width, one column at a time, within what the widget's layout allows.
  const [resizing, setResizing] = useState<{ id: string; w: number } | null>(null)
  const startResize = (e: React.PointerEvent, w: WidgetInstance) => {
    e.preventDefault()
    e.stopPropagation()
    const card = (e.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>("[data-widget-id]") ?? null
    const def = getWidget(w.type)
    if (!card || !def) return
    // The card's wrapper is draggable (for reordering): switch that off at once, or the browser starts a drag and eats the pointer.
    const handle = e.currentTarget as HTMLElement
    const wrapper = handle.closest<HTMLElement>("[draggable]")
    wrapper?.setAttribute("draggable", "false")
    handle.setPointerCapture(e.pointerId)
    const k = card.getBoundingClientRect().width / (card.offsetWidth || 1) // the canvas scale
    const colPx = (DEVICE_WIDTH.desktop - PAD.desktop * 2 - gap * 2) / 3
    const startW = card.offsetWidth
    const x0 = e.clientX
    let next = { id: w.id, w: pageWidth(w.w) }
    setResizing(next)
    setSelected(w.id)
    const move = (ev: PointerEvent) => {
      const cols = Math.max(1, Math.min(3, Math.round((startW + (ev.clientX - x0) / k + gap) / (colPx + gap))))
      next = { id: w.id, w: fitWidth(def, w.variant, cols * 4) }
      setResizing(next)
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      wrapper?.setAttribute("draggable", "true")
      setResizing(null)
      if (next.w !== pageWidth(w.w)) updateItem(w.id, { w: next.w }, `${w.id}-resize`)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }
  /** Saves the page in a new order: a card moved to `at`, or a widget from the library inserted there. */
  const drop = (e: React.DragEvent, at: number) => {
    e.preventDefault()
    e.stopPropagation()
    const order = readingOrder(layout.items)
    const moved = e.dataTransfer.getData("text/x-widget")
    const type = incoming?.type
    const o = incoming?.opts
    setDragging(null)
    setTarget(null)
    let next = order
    let key = `order-${uid()}`
    if (moved) {
      const from = order.findIndex((o) => o.id === moved)
      if (from < 0) return
      next = [...order]
      const [m] = next.splice(from, 1)
      next.splice(at > from ? at - 1 : at, 0, m)
    } else if (type) {
      onDropped()
      const def = getWidget(type)
      if (!def) return
      // From its details: the size, layout, detail and options chosen there; from the gallery: its defaults.
      const w: WidgetInstance = o
        ? { id: uid(), type, x: 0, y: 0, w: o.w, h: heightFor(def, o.variant, o.detail), variant: o.variant, detail: o.detail === "standard" ? undefined : o.detail, props: Object.keys(o.props).length ? o.props : undefined }
        : { id: uid(), type, x: 0, y: 0, w: fitWidth(def, def.variants[0].value, def.defaultW), h: def.variants[0].h }
      next = [...order]
      next.splice(at, 0, w)
      key = `drop-${w.id}`
      setSelected(w.id)
    } else return
    // Order is the layout now: one row per card, top to bottom (the masonry places them).
    save({ items: next.map((w, i) => ({ ...w, x: 0, y: i })) }, key)
  }

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
                <div className="hb-set relative" data-set={widgetSetOf(theme)} data-finish={widgetFinishOf(theme)} style={{ minHeight: 6 * (ROW_HEIGHT + gap), "--gap": `${gap}px` } as React.CSSProperties}>
                  {layout.items.length === 0 && (
                    <div
                      className="grid min-h-48 place-items-center rounded-(--radius) border-2 border-dashed text-sm text-muted-foreground"
                      onDragOver={(e) => incoming && e.preventDefault()}
                      onDrop={(e) => drop(e, layout.items.length)}
                    >
                      <span className="pointer-events-none flex items-center gap-2">
                        <LayoutGrid className="size-4" /> Drag widgets from Add widget onto the page
                      </span>
                    </div>
                  )}
                  {/* The page as students see it (a masonry: every card at its own height); dragging a card only changes the order. */}
                  <Masonry
                    items={readingOrder(layout.items)}
                    onExpanded={setExpanded}
                    emptySide={(band) => (
                      // Nothing beside this two-column card: a place to drop a widget (students see the column empty).
                      <div
                        className="grid h-full min-h-24 place-items-center rounded-(--radius) border-2 border-dashed border-foreground/15 p-4 text-center font-[family-name:var(--ff-geist)] text-xs text-muted-foreground"
                        onDragOver={(e) => (incoming || dragging) && e.preventDefault()}
                        onDrop={(e) => drop(e, readingOrder(layout.items).findIndex((o) => o.id === band.id) + 1)}
                      >
                        <span className="pointer-events-none flex flex-col items-center gap-1.5">
                          <LayoutGrid className="size-4" />
                          Drop a one-column widget here
                        </span>
                      </div>
                    )}
                    render={(w) => (
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
                        <GridWidget w={w} selected={selected === w.id} expanded={expanded.includes(w.id)} available={isAvailable(w, coach)} onRemove={() => removeWidget(w.id)} onDuplicate={() => duplicateWidget(w.id)} />
                      </WidgetMenu>
                    )}
                    wrap={(w, item) => (
                      <div
                        draggable={!resizing}
                        className={cn("group/wrap relative", dragging === w.id && "opacity-40")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(w.id)
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/x-widget", w.id)
                          e.dataTransfer.effectAllowed = "move"
                          setDragging(w.id)
                          setSelected(w.id)
                        }}
                        onDragEnd={() => {
                          setDragging(null)
                          setTarget(null)
                        }}
                        onDragOver={(e) => {
                          if (!dragging && !incoming) return
                          e.preventDefault()
                          const r = e.currentTarget.getBoundingClientRect()
                          const after = e.clientY > r.top + r.height / 2
                          setTarget({ id: w.id, after })
                        }}
                        onDrop={(e) => {
                          const order = readingOrder(layout.items)
                          const at = order.findIndex((o) => o.id === w.id) + (target?.id === w.id && target.after ? 1 : 0)
                          drop(e, at)
                        }}
                      >
                        {target?.id === w.id && (
                          <span aria-hidden className={cn("pointer-events-none absolute inset-x-0 z-30 h-1 rounded-full bg-primary", target.after ? "-bottom-[calc(var(--gap)/2+2px)]" : "-top-[calc(var(--gap)/2+2px)]")} />
                        )}
                        {item}
                        {allWidgets && (
                          <span aria-hidden className="pointer-events-none absolute -inset-[4px] z-20 rounded-[calc(var(--radius)+4px)] border-[1.5px] border-dashed border-[#ff5500]/75" />
                        )}
                        {/* The selected widget's bar, under it: how to move it, and its width in one click. */}
                        {selected === w.id && !dragging && !resizing && (
                          <div
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onClick={(e) => e.stopPropagation()}
                            className="no-drag absolute top-full left-0 z-40 mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-[#18181b] py-1 pr-1 pl-3 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap text-white shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]"
                          >
                            <span>Drag to set position.</span>
                            {!getWidget(w.type)?.core && w.type !== "page-header" && widthsFor(getWidget(w.type)!, w.variant).length > 1 && (
                              <span className="flex items-center gap-1.5 border-l border-white/15 pl-3 text-white/70">
                                Size
                                <SizeIcons value={pageWidth(w.w)} allowed={widthsFor(getWidget(w.type)!, w.variant)} onChange={(cols) => updateItem(w.id, { w: cols }, `${w.id}-width`)} />
                              </span>
                            )}
                          </div>
                        )}
                        {/* Resize: sideways picks the width (one, two or three columns). Only for widgets with more than one width. */}
                        {!getWidget(w.type)?.core && w.type !== "page-header" && widthsFor(getWidget(w.type)!, w.variant).length > 1 && (
                          <span
                            role="presentation"
                            draggable={false}
                            title="Drag sideways to change the width"
                            className="no-drag absolute right-1 bottom-1 z-30 grid size-5 cursor-ew-resize place-items-center rounded-md border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/wrap:opacity-100 data-[on=true]:opacity-100"
                            data-on={selected === w.id || resizing?.id === w.id}
                            onDragStart={(e) => e.preventDefault()}
                            onPointerDown={(e) => startResize(e, w)}
                          >
                            <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                              <path d="M9 3 3 9M9 6.5 6.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </span>
                        )}
                        {resizing?.id === w.id && (
                          <span className="pointer-events-none absolute top-2 left-1/2 z-40 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 font-[family-name:var(--ff-geist)] text-xs whitespace-nowrap text-background shadow">
                            {WIDTH.find((o) => o.value === resizing.w)?.label}
                          </span>
                        )}
                      </div>
                    )}
                  />
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

function GridWidget({ w, selected, expanded, available, onRemove, onDuplicate }: { w: WidgetInstance; selected: boolean; expanded: boolean; available: boolean; onRemove: () => void; onDuplicate: () => void }) {
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
          {w.emphasis === "star" && " · Star"} · {expanded ? "full width: nothing fits beside it" : WIDTH.find((o) => o.value === pageWidth(w.w))?.label.toLowerCase()}
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
