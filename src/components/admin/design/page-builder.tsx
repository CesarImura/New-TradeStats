"use client"

import { useEffect, useRef, useState } from "react"
import ReactGridLayout from "react-grid-layout"
import { transformStrategy, verticalCompactor, type Layout, type LayoutItem, type PositionStrategy } from "react-grid-layout/core"
import { GridBackground } from "react-grid-layout/extras"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { ArrowDownToLine, ArrowUpToLine, Copy, EyeOff, Info, LayoutGrid, Lock, Pencil, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { studentNav } from "@/components/coach/nav"
import { Button } from "@/components/ui/button"
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
import { PageRenderer, isAvailable } from "@/components/widgets/page-renderer"
import { WidgetFrame } from "@/components/widgets/kit"
import { getWidget, heightFor, heightOf, lookOf } from "@/components/widgets/registry"
import { DataModeProvider, PageIdContext, PageTitleShownContext, type DataMode } from "@/components/widgets/shared"
import type { Coach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { pageLayout } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"
import { COLS, GAP, ROW_HEIGHT, normalizeLayout, oneStar, uid, withCore, type Detail, type Emphasis, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { DETAIL, EMPHASIS } from "./builder-panels"
import type { useDraftEditor } from "./editor-shell"

const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
const PAD = { desktop: 32, tablet: 24, phone: 16 }
const DROP_ID = "__dropping__"

/**
 * The canvas is scaled down with a CSS transform. The library's own scaled
 * strategy measures drags from the page edge (moving widgets too far), so use
 * the standard strategy and only tell it the scale.
 */
const scaled = (scale: number): PositionStrategy => ({ ...transformStrategy, scale })

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
  const pages = studentNav(coach, `/c/${coach.slug}`)
  const pageInfo = pages.find((p) => p.id === page) ?? pages[0]
  const layouts = coach.pages?.[page] ?? {}
  const baseLayout = pageLayout(coach, page, theme.template, undefined, heightOf)
  const inherits = tier !== "default" && !layouts[tier]
  const own = (l: PageLayout) => (page === "home" ? l : withCore(page, l))
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
    const w: WidgetInstance = { id: uid(), type, x: 0, y: bottom, w: def.defaultW, h: look.h }
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
 * The page as a snap-to-grid canvas in the coach's draft theme, at real device
 * width and scaled to fit. Drag to move, drag edges to resize, drop widgets in
 * from the library, right-click for more.
 */
export function ArrangeCanvas({
  arrange,
  coach,
  theme,
  device,
  data,
  incoming,
  onDropped,
}: {
  arrange: Arrange
  coach: Coach
  theme: CoachTheme
  device: Device
  data: DataMode
  /** Widget type being dragged in from the library. */
  incoming: string | null
  onDropped: () => void
}) {
  const ctx = useCoach()
  const { page, layout, selected, setSelected, save, updateItem, removeWidget, duplicateWidget, moveTo } = arrange
  const gap = GAP[theme.density]
  const [active, setActive] = useState(false) // a drag or resize is in progress on the grid

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
  // A new screen size ends any drag in progress.
  const [lastDevice, setLastDevice] = useState(device)
  if (lastDevice !== device) {
    setLastDevice(device)
    setActive(false)
  }
  const logicalWidth = DEVICE_WIDTH[device]
  const scale = areaWidth ? Math.min(1, (areaWidth - 32) / logicalWidth) : 1
  const gridWidth = logicalWidth - PAD[device] * 2

  /** Take positions from the grid after a move, resize or drop. */
  const fromGrid = (grid: Layout, extra?: WidgetInstance) => {
    const pos = new Map(grid.map((g) => [g.i, g]))
    const items = layout.items.map((w) => {
      const g = pos.get(w.id)
      return g ? { ...w, x: g.x, y: g.y, w: g.w, h: g.h } : w
    })
    return { items: extra ? [...items, extra] : items }
  }

  // Grid items. Hidden-module widgets stay on the grid (marked) so their place is kept.
  const gridLayout: LayoutItem[] = layout.items.map((w) => {
    const def = getWidget(w.type)
    const look = def ? lookOf(def, w.variant) : undefined
    return { i: w.id, x: w.x, y: w.y, w: w.w, h: w.h, minW: def?.minW ?? 2, minH: look?.minH ?? 2, maxW: COLS }
  })
  const incomingDef = incoming ? getWidget(incoming) : undefined
  const incomingSize = incomingDef ? { w: incomingDef.defaultW, h: incomingDef.variants[0].h } : { w: 4, h: 3 }
  const rows = layout.items.reduce((m, w) => Math.max(m, w.y + w.h), 0) + 4
  // The library centres a dropped widget on the pointer but subtracts half its
  // width before undoing the canvas scale; compensate so it lands under the pointer.
  const colWidth = (gridWidth - gap * (COLS - 1)) / COLS
  const itemPx = { w: incomingSize.w * colWidth + (incomingSize.w - 1) * gap, h: incomingSize.h * ROW_HEIGHT + (incomingSize.h - 1) * gap }
  const dropOffset = { dragOffsetX: (itemPx.w / 2) * (1 - scale), dragOffsetY: (itemPx.h / 2) * (1 - scale) }

  const scope = ".hb-canvas"
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${coach.slug}` }

  return (
    <PageIdContext.Provider value={page}>
    <PageTitleShownContext.Provider value={!layout.items.some((w) => w.type === "page-header")}>
    <CoachContext.Provider value={canvasCtx}>
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
      <div ref={area} className="h-full min-h-[60svh] min-w-0 overflow-x-hidden overflow-y-auto p-4 lg:min-h-0" onClick={() => setSelected(null)}>
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
                <div className="relative" style={{ minHeight: 6 * (ROW_HEIGHT + gap) }}>
                  {(active || incoming) && (
                    <GridBackground
                      width={gridWidth}
                      cols={COLS}
                      rowHeight={ROW_HEIGHT}
                      margin={[gap, gap]}
                      containerPadding={[0, 0]}
                      rows={rows}
                      color="color-mix(in oklab, var(--primary) 9%, transparent)"
                      borderRadius={6}
                      className="pointer-events-none absolute inset-0"
                    />
                  )}
                  {layout.items.length === 0 && !incoming && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-(--radius) border-2 border-dashed text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <LayoutGrid className="size-4" /> Drag widgets from Add widget onto this grid
                      </span>
                    </div>
                  )}
                  <ReactGridLayout
                    width={gridWidth}
                    layout={gridLayout}
                    gridConfig={{ cols: COLS, rowHeight: ROW_HEIGHT, margin: [gap, gap], containerPadding: [0, 0] }}
                    positionStrategy={scaled(scale)}
                    dragConfig={{ enabled: true, threshold: 4, cancel: ".react-resizable-handle, .no-drag" }}
                    resizeConfig={{ enabled: true, handles: ["n", "e", "s", "w", "ne", "nw", "se", "sw"] }}
                    dropConfig={{ enabled: true, defaultItem: incomingSize, onDragOver: () => ({ ...incomingSize, ...dropOffset }) }}
                    droppingItem={{ i: DROP_ID, x: 0, y: 0, ...incomingSize }}
                    style={{ minHeight: 6 * (ROW_HEIGHT + gap) }}
                    onDragStart={(_l, _o, item) => {
                      setActive(true)
                      if (item) setSelected(item.i)
                    }}
                    onResizeStart={(_l, _o, item) => {
                      setActive(true)
                      if (item) setSelected(item.i)
                    }}
                    onDragStop={(l) => {
                      setActive(false)
                      save(fromGrid(l), `move-${uid()}`)
                    }}
                    onResizeStop={(l) => {
                      setActive(false)
                      save(fromGrid(l), `resize-${uid()}`)
                    }}
                    onDrop={(l, item) => {
                      const type = incoming
                      onDropped()
                      // The library treats a drop as a drag that never "stops"; end it here.
                      setActive(false)
                      if (!type || !item) return
                      const w: WidgetInstance = { id: uid(), type, x: item.x, y: item.y, w: item.w, h: item.h }
                      save(fromGrid(l.filter((g) => g.i !== DROP_ID), w), `drop-${w.id}`)
                      setSelected(w.id)
                    }}
                  >
                    {layout.items.map((w) => (
                      <div key={w.id} onClick={(e) => { e.stopPropagation(); setSelected(w.id) }}>
                        <WidgetMenu
                          w={w}
                          onOpen={() => setSelected(w.id)}
                          onLook={(variant, minH) => updateItem(w.id, { variant, h: Math.max(w.h, minH) }, `${w.id}-variant`)}
                          onEmphasis={(emphasis) => updateItem(w.id, { emphasis }, `${w.id}-emphasis`)}
                          onDetail={(detail) => updateItem(w.id, { detail }, `${w.id}-detail`)}
                          onDuplicate={() => duplicateWidget(w.id)}
                          onMove={(where) => moveTo(w.id, where)}
                          onPhone={(hideOnPhone) => updateItem(w.id, { hideOnPhone }, `${w.id}-phone`)}
                          onRemove={() => removeWidget(w.id)}
                        >
                          <GridWidget w={w} selected={selected === w.id} available={isAvailable(w, coach)} onRemove={() => removeWidget(w.id)} onDuplicate={() => duplicateWidget(w.id)} />
                        </WidgetMenu>
                      </div>
                    ))}
                  </ReactGridLayout>
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
  if (!def) return null
  const C = def.Component
  return (
    <div
      className={cn(
        "group/w relative flex size-full cursor-grab flex-col rounded-[calc(var(--radius)+2px)] outline-2 outline-offset-2 outline-transparent hover:outline-primary/40 active:cursor-grabbing",
        selected && "outline-primary",
      )}
    >
      <span
        className="absolute top-2 left-2 z-10 rounded-md bg-foreground px-1.5 py-0.5 font-[family-name:var(--ff-geist)] text-[0.65rem] text-background opacity-0 group-hover/w:opacity-100 data-[on=true]:opacity-100"
        data-on={selected}
      >
        {def.core && <Lock className="mr-1 inline size-2.5 align-[-1px]" />}
        {def.core ? `${def.name} · main part of the page` : def.name}
        {w.emphasis === "star" && " · Star"} · {w.w}×{w.h}
      </span>
      {/* Quick actions; .no-drag keeps clicks here from starting a drag */}
      <div
        className="no-drag absolute top-2 right-2 z-20 flex items-center gap-0.5 rounded-lg border bg-background p-0.5 font-[family-name:var(--ff-geist)] text-foreground opacity-0 shadow-sm transition-opacity group-hover/w:opacity-100 data-[on=true]:opacity-100"
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
      <div className="pointer-events-none flex min-h-0 flex-1 flex-col overflow-hidden select-none [&>*]:flex-1">
        {available ? (
          <WidgetFrame emphasis={w.emphasis} detail={w.detail}>
            <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
          </WidgetFrame>
        ) : (
          <div className="grid place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its page is switched off in the Menu step.
          </div>
        )}
      </div>
    </div>
  )
}
