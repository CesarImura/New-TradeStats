"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import ReactGridLayout from "react-grid-layout"
import { transformStrategy, verticalCompactor, type Layout, type LayoutItem, type PositionStrategy } from "react-grid-layout/core"
import { GridBackground } from "react-grid-layout/extras"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { ArrowDownToLine, ArrowUpToLine, Copy, Database, EyeOff, Info, LayoutGrid, Lock, Monitor, Pencil, Smartphone, Tablet, Trash2 } from "@/components/icons"
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
import { useSidebar } from "@/components/ui/sidebar"
import { PageRenderer, isAvailable } from "@/components/widgets/page-renderer"
import { getWidget, heightOf, lookOf } from "@/components/widgets/registry"
import { DataModeProvider, type DataMode } from "@/components/widgets/shared"
import { getCoach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { pageLayout, resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { COLS, GAP, ROW_HEIGHT, normalizeLayout, uid, withCore, type PageId, type PageLayout, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { NothingSelected, WidgetLibrary, WidgetSettings } from "./builder-panels"
import { Segmented } from "./controls"
import { EditorBar, useDraftEditor } from "./editor-shell"

type Device = "desktop" | "tablet" | "phone"
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }
const PAD = { desktop: 32, tablet: 24, phone: 16 }
const DROP_ID = "__dropping__"

/**
 * The canvas is scaled down with a CSS transform. The library's own scaled
 * strategy measures drags from the page edge (moving widgets too far), so use
 * the standard strategy and only tell it the scale.
 */
const scaled = (scale: number): PositionStrategy => ({ ...transformStrategy, scale })

/**
 * ADM-37 / ADM-39: build any student page on a snap-to-grid canvas, per tier.
 * Home is all widgets; a module page also has its core widget (the page's own
 * tool), which can move and resize but not be removed.
 */
export function PageBuilder() {
  const ctx = useCoach()
  const slug = ctx.coach.slug
  const original = getCoach(slug)!
  const editor = useDraftEditor(slug)
  const { working, commit } = editor

  const coach = useMemo(() => resolveCoach(original, working.content), [original, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])
  const gap = GAP[theme.density]

  // Which page: ?page=journal. Pages for switched-off modules aren't offered.
  const params = useSearchParams()
  const router = useRouter()
  const pages = studentNav(coach, `/c/${slug}`)
  const asked = params.get("page") ?? "home"
  const page = (pages.some((p) => p.id === asked) ? asked : "home") as PageId
  const pageInfo = pages.find((p) => p.id === page)!
  const goTo = (id: string) => {
    const q = new URLSearchParams(params)
    q.set("page", id)
    router.replace(`?${q}`, { scroll: false })
    setSelected(null)
  }

  const [tier, setTier] = useState("default")
  const [device, setDevice] = useState<Device>("desktop")
  const [data, setData] = useState<DataMode>("sample")
  const [selected, setSelected] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<string | null>(null) // widget type being dragged in from the library
  const [active, setActive] = useState(false) // a drag or resize is in progress on the grid

  // Give the canvas room: fold the admin menu to icons while building, and restore it on leaving.
  const { open: menuOpen, setOpen: setMenuOpen } = useSidebar()
  const menuWasOpen = useRef(menuOpen)
  useEffect(() => {
    const restore = menuWasOpen.current
    setMenuOpen(false)
    return () => setMenuOpen(restore)
  }, [setMenuOpen])

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
  const gridWidth = logicalWidth - PAD[device] * 2

  const layouts = coach.pages?.[page] ?? {}
  const baseLayout = pageLayout(coach, page, theme.template, undefined, heightOf)
  const inherits = tier !== "default" && !layouts[tier]
  const own = (l: PageLayout) => (page === "home" ? l : withCore(page, l))
  const layout = tier === "default" || !layouts[tier] ? baseLayout : own(normalizeLayout(layouts[tier], heightOf))
  const tierName = coach.tiers.find((t) => t.id === tier)?.name
  const savePages = (next: typeof layouts, key: string) =>
    commit({ ...working, content: { ...working.content, pages: { ...coach.pages, [page]: next } } }, `${page}-${key}`)

  const save = (next: PageLayout, key: string) => {
    savePages({ ...layouts, [tier]: next }, `${tier}-${key}`)
    if (inherits) toast(`${tierName} now has its own ${pageInfo.label} page. Other tiers keep the default.`)
  }
  const pinned = (id: string) => !!getWidget(layout.items.find((w) => w.id === id)?.type ?? "")?.core
  const updateItem = (id: string, patch: Partial<WidgetInstance>, key: string) =>
    save({ items: layout.items.map((w) => (w.id === id ? { ...w, ...patch } : w)) }, key)

  /** Take positions from the grid after a move, resize or drop. */
  const fromGrid = (grid: Layout, extra?: WidgetInstance) => {
    const pos = new Map(grid.map((g) => [g.i, g]))
    const items = layout.items.map((w) => {
      const g = pos.get(w.id)
      return g ? { ...w, x: g.x, y: g.y, w: g.w, h: g.h } : w
    })
    return { items: extra ? [...items, extra] : items }
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
    const copy = { ...w, id: uid(), y: w.y + w.h }
    saveCompacted([...layout.items, copy], `dup-${copy.id}`)
    setSelected(copy.id)
  }
  const moveTo = (id: string, where: "top" | "bottom") =>
    saveCompacted(layout.items.map((w) => (w.id === id ? { ...w, y: where === "top" ? -1 : 9999 } : w)), `order-${uid()}`)

  // Delete / Backspace removes the selected widget, Escape deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest("input, textarea, select, [contenteditable=true]")) return
      if (!selected) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removeWidget(selected)
      } else if (e.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

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

  const selWidget = layout.items.find((w) => w.id === selected) ?? null
  const scope = ".hb-canvas"
  const canvasClass = cn("hb-canvas", theme.mode === "dark" ? "dark" : "light")
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${slug}` }
  const previewHref = `${pageInfo.href}?preview=draft${tier !== "default" ? `&tier=${tier}` : ""}${data === "empty" ? "&data=empty" : ""}`

  return (
    <div className="-m-4 grid min-h-[calc(100svh-3.5rem)] grid-rows-[auto_auto_1fr] md:-m-6 lg:-m-8 lg:h-[calc(100svh-3.5rem)]">
      <EditorBar
        slug={slug}
        active="pages"
        editor={editor}
        previewHref={previewHref}
        guide={{
          title: "Building your pages",
          text: "Every page is a grid of widgets. Pick a page at the top, drag widgets onto the grid, drag their edges to resize them, pick one of three looks for each, and make a different version per tier if you like. A page's main part stays; move or resize it.",
        }}
      />

      {/* Which page */}
      <div className="flex items-center gap-1 overflow-x-auto border-b bg-background px-4 py-1.5" role="tablist" aria-label="Page to build">
        {pages.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === page}
            onClick={() => goTo(p.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground",
              p.id === page && "bg-muted font-medium text-foreground",
            )}
          >
            <p.icon className="size-4" />
            {p.label}
            {Object.keys(coach.pages?.[p.id as PageId] ?? {}).length > 1 && <span className="size-1.5 rounded-full bg-primary" title="Has a layout per tier" />}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto shrink-0" nativeButton={false} render={<Link href={`/admin/${slug}/design/pages/all${params.get("from") === "setup" ? "?from=setup" : ""}`} />}>
          <LayoutGrid /> All pages
        </Button>
      </div>

      {/* Tier, data, device and preview */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2 text-sm">
        <span className="text-muted-foreground">{pageInfo.label} for</span>
        <select value={tier} onChange={(e) => { setTier(e.target.value); setSelected(null) }} className="h-8 rounded-lg border bg-background px-2" aria-label={`Which tier's ${pageInfo.label} page`}>
          <option value="default">Everyone (default)</option>
          {coach.tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {layouts[t.id] ? " · own layout" : ""}
            </option>
          ))}
        </select>
        {inherits && <span className="text-xs text-muted-foreground">Uses the default. Changing it here makes a separate {pageInfo.label} page for {tierName}.</span>}
        {tier !== "default" && !inherits && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const rest = { ...layouts }
              delete rest[tier]
              savePages(rest, `reset-${tier}`)
              toast(`${tierName} uses the default ${pageInfo.label} page again.`)
            }}
          >
            Use the default instead
          </Button>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="size-3.5" /> Preview with
          </span>
          <Segmented
            label="Preview data"
            value={data}
            onChange={setData}
            options={[
              { value: "sample", label: "Sample data" },
              { value: "empty", label: "New student" },
            ]}
          />
          <Segmented
            label="Canvas size"
            value={device}
            onChange={(d) => { setDevice(d); setActive(false) }}
            options={[
              { value: "desktop", label: <><Monitor className="size-3.5" /> Desktop</> },
              { value: "tablet", label: <><Tablet className="size-3.5" /> Tablet</> },
              { value: "phone", label: <><Smartphone className="size-3.5" /> Phone</> },
            ]}
          />
        </div>
      </div>

      <CoachContext.Provider value={canvasCtx}>
        <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
          <aside className="min-h-0 overflow-y-auto border-r bg-background">
            <WidgetLibrary
              key={page}
              page={page}
              coach={coach}
              canvasClass={canvasClass}
              onAdd={addWidget}
              onDragType={(t) => {
                setIncoming(t)
                if (!t) setActive(false)
              }}
            />
          </aside>

          {/* Canvas: the real Home in the coach's draft theme, at real width, scaled to fit */}
          <div ref={area} className="min-h-[70svh] min-w-0 overflow-x-hidden overflow-y-auto bg-muted/50 p-4 lg:min-h-0" onClick={() => setSelected(null)}>
            {device !== "desktop" && (
              <div className="mx-auto mb-3 flex max-w-xl items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground shadow-sm">
                <Info className="size-4 shrink-0" />
                This is how the page reflows on {device === "tablet" ? "tablets" : "phones"}. Arrange widgets in the desktop view; the order here follows it, top to bottom and left to right.
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
                            <LayoutGrid className="size-4" /> Drag widgets from the left onto this grid
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
                          setIncoming(null)
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

          <aside className="min-h-0 overflow-y-auto border-l bg-background">
            {selWidget ? (
              <WidgetSettings
                key={selWidget.id}
                w={selWidget}
                pinned={pinned(selWidget.id)}
                canvasClass={canvasClass}
                onChange={(patch, key) => updateItem(selWidget.id, patch, key)}
                onDuplicate={() => duplicateWidget(selWidget.id)}
                onRemove={() => removeWidget(selWidget.id)}
              />
            ) : (
              <NothingSelected />
            )}
          </aside>
        </div>
      </CoachContext.Provider>
    </div>
  )
}

/** One widget on the builder grid: the real widget, plus its name and selection outline. */
/** Right-click menu for a widget on the grid. */
function WidgetMenu({
  w,
  children,
  onOpen,
  onLook,
  onDuplicate,
  onMove,
  onPhone,
  onRemove,
}: {
  w: WidgetInstance
  children: React.ReactNode
  onOpen: () => void
  onLook: (variant: string, minH: number) => void
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
          <ContextMenuSub>
            <ContextMenuSubTrigger>Look</ContextMenuSubTrigger>
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
        {def.core ? `${def.name} · main part of the page` : def.name} · {w.w}×{w.h}
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
          <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
        ) : (
          <div className="grid place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its module is switched off in Look and feel → Menu and words.
          </div>
        )}
      </div>
    </div>
  )
}
