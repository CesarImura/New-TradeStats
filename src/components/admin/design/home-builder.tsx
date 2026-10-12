"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import { ArrowDown, ArrowUp, Database, EyeOff, ExternalLink, Monitor, Plus, Smartphone, Tablet, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SECTION_BG, cellStyle, effectiveSpan, isAvailable } from "@/components/widgets/page-renderer"
import { getWidget } from "@/components/widgets/registry"
import { DataModeProvider, type DataMode } from "@/components/widgets/shared"
import { getCoach, type Coach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { SPAN_STEPS, defaultHome, normalizeLayout, uid, type PageLayout, type Section, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { NothingSelected, SectionSettings, WidgetLibrary, WidgetSettings } from "./builder-panels"
import { Segmented } from "./controls"
import { EditorBar, useDraftEditor } from "./editor-shell"

type Selection = { kind: "widget"; id: string } | { kind: "section"; id: string } | null
type Device = "desktop" | "tablet" | "phone"
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1180, tablet: 820, phone: 390 }

const clone = (l: PageLayout): PageLayout => JSON.parse(JSON.stringify(l))

function locate(l: PageLayout, id: string) {
  for (let si = 0; si < l.sections.length; si++) {
    const wi = l.sections[si].widgets.findIndex((w) => w.id === id)
    if (wi >= 0) return { si, wi }
  }
  return null
}

/** Prefer dropping before a widget, then at the end of a section. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const before = hits.filter((h) => String(h.id).startsWith("before:"))
  if (before.length) return before
  const end = hits.filter((h) => String(h.id).startsWith("end:"))
  if (end.length) return end
  return hits.length ? hits : rectIntersection(args)
}

const spanLabel = (span: number) => SPAN_STEPS.find((s) => s.span === span)?.label ?? `${span}/12`

/** ADM-37 / ADM-39: build the students' Home from widgets, per tier, by drag and drop. */
export function HomeBuilder() {
  const ctx = useCoach()
  const slug = ctx.coach.slug
  const original = getCoach(slug)!
  const editor = useDraftEditor(slug)
  const { working, commit } = editor

  const coach = useMemo(() => resolveCoach(original, working.content), [original, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])

  const [tier, setTier] = useState("default")
  const [device, setDevice] = useState<Device>("desktop")
  const [data, setData] = useState<DataMode>("sample")
  const [selected, setSelected] = useState<Selection>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [resizing, setResizing] = useState<{ id: string; span: number } | null>(null)

  // Give the canvas room: fold the admin menu to icons while building, and restore it on leaving.
  const { open: menuOpen, setOpen: setMenuOpen } = useSidebar()
  const menuWasOpen = useRef(menuOpen)
  useEffect(() => {
    const restore = menuWasOpen.current
    setMenuOpen(false)
    return () => setMenuOpen(restore)
  }, [setMenuOpen])

  // The canvas is laid out at real device width and scaled to fit.
  const area = useRef<HTMLDivElement>(null)
  const [areaWidth, setAreaWidth] = useState(0)
  useEffect(() => {
    const el = area.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAreaWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const logicalWidth = DEVICE_WIDTH[device]
  const zoom = areaWidth ? Math.min(1, (areaWidth - 32) / logicalWidth) : 1

  const layouts = coach.home ?? {}
  const baseLayout = layouts.default ? normalizeLayout(layouts.default) : defaultHome(theme.template, coach)
  const inherits = tier !== "default" && !layouts[tier]
  const layout = tier === "default" ? baseLayout : layouts[tier] ? normalizeLayout(layouts[tier]) : baseLayout
  const tierName = coach.tiers.find((t) => t.id === tier)?.name

  const save = (next: PageLayout, key: string) => {
    commit({ ...working, content: { ...working.content, home: { ...layouts, [tier]: next } } }, `${tier}-${key}`)
    if (inherits) toast(`${tierName} now has its own Home. Other tiers keep the default.`)
  }
  const edit = (key: string, fn: (l: PageLayout) => void) => {
    const next = clone(layout)
    fn(next)
    save(next, key)
  }
  const newWidget = (type: string): WidgetInstance => ({ id: uid(), type, span: getWidget(type)?.defaultSpan ?? 6 })

  // ---------- operations

  const addWidget = (type: string) => {
    const w = newWidget(type)
    edit(`add-${w.id}`, (l) => {
      const at = selected?.kind === "widget" ? locate(l, selected.id) : null
      const si = at?.si ?? (selected?.kind === "section" ? l.sections.findIndex((s) => s.id === selected.id) : l.sections.length - 1)
      if (si < 0 || !l.sections[si]) l.sections.push({ id: uid(), widgets: [w] })
      else if (at) l.sections[si].widgets.splice(at.wi + 1, 0, w)
      else l.sections[si].widgets.push(w)
    })
    setSelected({ kind: "widget", id: w.id })
  }

  const addSection = (index: number) => {
    const id = uid()
    edit(`section-${id}`, (l) => l.sections.splice(index, 0, { id, widgets: [] }))
    setSelected({ kind: "section", id })
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const src = String(e.active.id)
    const target = e.over ? String(e.over.id) : null
    if (!target || target === `before:${src}`) return
    const next = clone(layout)
    let w: WidgetInstance
    if (src.startsWith("new:")) w = newWidget(src.slice(4))
    else {
      const at = locate(next, src)
      if (!at) return
      ;[w] = next.sections[at.si].widgets.splice(at.wi, 1)
    }
    if (target.startsWith("before:")) {
      const at = locate(next, target.slice(7))
      if (!at) return
      next.sections[at.si].widgets.splice(at.wi, 0, w)
    } else {
      const s = next.sections.find((x) => x.id === target.slice(4))
      if (!s) return
      s.widgets.push(w)
    }
    save(next, `move-${w.id}-${uid()}`)
    setSelected({ kind: "widget", id: w.id })
  }

  /** Drag a widget's right edge: the width snaps to the 12-column grid and stops at the widget's minimum. */
  const startResize = (w: WidgetInstance, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const grid = (e.currentTarget as HTMLElement).closest(".w-grid") as HTMLElement | null
    if (!grid) return
    const def = getWidget(w.type)!
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0
    const step = (grid.getBoundingClientRect().width + gap) / 12
    const startX = e.clientX
    const startSpan = effectiveSpan(w)
    let span = startSpan
    setResizing({ id: w.id, span })
    setSelected({ kind: "widget", id: w.id })
    const move = (ev: PointerEvent) => {
      span = Math.min(12, Math.max(def.minSpan, Math.round(startSpan + (ev.clientX - startX) / step)))
      setResizing({ id: w.id, span })
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      setResizing(null)
      if (span !== startSpan) edit(`resize-${w.id}-${uid()}`, (l) => {
        const at = locate(l, w.id)
        if (at) l.sections[at.si].widgets[at.wi].span = span
      })
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))

  const selAt = selected?.kind === "widget" ? locate(layout, selected.id) : null
  const selWidget = selAt ? layout.sections[selAt.si].widgets[selAt.wi] : null
  const selSection = selected?.kind === "section" ? layout.sections.find((s) => s.id === selected.id) : null
  const dragType = dragging?.startsWith("new:") ? dragging.slice(4) : dragging ? (() => { const at = locate(layout, dragging); return at ? layout.sections[at.si].widgets[at.wi].type : "" })() : ""

  const scope = ".hb-canvas"
  const canvasClass = cn("hb-canvas", theme.mode === "dark" && "dark")
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${slug}` }
  const previewHref = `/c/${slug}?preview=draft${tier !== "default" ? `&tier=${tier}` : ""}${data === "empty" ? "&data=empty" : ""}`

  return (
    <div className="-m-4 grid min-h-[calc(100svh-3.5rem)] grid-rows-[auto_auto_1fr] md:-m-6 lg:-m-8 lg:h-[calc(100svh-3.5rem)]">
      <EditorBar
        slug={slug}
        active="home"
        editor={editor}
        guide={{ title: "Building your Home page", text: "Drag widgets onto the page, drag their right edge to resize, pick one of three looks for each, and make a different Home per tier if you like." }}
      />

      {/* Tier, data, device and preview */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2 text-sm">
        <span className="text-muted-foreground">Home for</span>
        <select value={tier} onChange={(e) => { setTier(e.target.value); setSelected(null) }} className="h-8 rounded-lg border bg-background px-2" aria-label="Which tier's Home">
          <option value="default">Everyone (default)</option>
          {coach.tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {layouts[t.id] ? " · own layout" : ""}
            </option>
          ))}
        </select>
        {inherits && <span className="text-xs text-muted-foreground">Uses the default. Changing it here makes a separate Home for {tierName}.</span>}
        {tier !== "default" && !inherits && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const rest = { ...layouts }
              delete rest[tier]
              commit({ ...working, content: { ...working.content, home: rest } }, `reset-${tier}`)
              toast(`${tierName} uses the default Home again.`)
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
              { value: "empty", label: "Empty (new student)" },
            ]}
          />
          <Segmented
            label="Canvas size"
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: <><Monitor className="size-3.5" /> Desktop</> },
              { value: "tablet", label: <><Tablet className="size-3.5" /> Tablet</> },
              { value: "phone", label: <><Smartphone className="size-3.5" /> Phone</> },
            ]}
          />
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href={previewHref} target="_blank" rel="noreferrer" />}>
            <ExternalLink /> Preview
          </Button>
        </div>
      </div>

      <CoachContext.Provider value={canvasCtx}>
        <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />
        <DndContext
          id="home-builder"
          sensors={sensors}
          collisionDetection={collision}
          onDragStart={(e) => setDragging(String(e.active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
            <aside className="min-h-0 overflow-y-auto border-r bg-background">
              <WidgetLibrary coach={coach} canvasClass={canvasClass} onAdd={addWidget} />
            </aside>

            {/* Canvas: the real Home in the coach's draft theme */}
            <div ref={area} className="min-h-[70svh] min-w-0 overflow-x-hidden overflow-y-auto bg-muted/50 p-4 lg:min-h-0" onClick={() => setSelected(null)}>
              <DataModeProvider value={data}>
                <div
                  data-canvas={device}
                  className={cn(canvasClass, "mx-auto bg-background font-sans text-foreground shadow-xl ring-1 ring-black/10", device === "desktop" ? "rounded-xl" : "rounded-[28px]")}
                  style={{ width: logicalWidth, zoom }}
                >
                  <div className={cn("@container flex flex-col page-gap", device === "phone" ? "p-4" : device === "tablet" ? "p-6" : "p-8")}>
                    <div className="pointer-events-none flex flex-col gap-1 opacity-80">
                      <span className="eyebrow">Monday, 12 October</span>
                      <h1 className="text-3xl leading-tight">Good morning, {DEMO_STUDENT.first}</h1>
                    </div>
                    <AddSection onAdd={() => addSection(0)} />
                    {layout.sections.map((s, si) => (
                      <div key={s.id} className="flex flex-col page-gap">
                        <SectionEditor
                          section={s}
                          coach={coach}
                          first={si === 0}
                          last={si === layout.sections.length - 1}
                          device={device}
                          dragging={dragging}
                          resizing={resizing}
                          selected={selected}
                          onSelect={setSelected}
                          onResizeStart={startResize}
                          onMove={(by) => edit(`move-s-${uid()}`, (l) => { const [x] = l.sections.splice(si, 1); l.sections.splice(si + by, 0, x) })}
                          onRemove={() => { edit(`del-s-${s.id}`, (l) => l.sections.splice(si, 1)); setSelected(null) }}
                        />
                        <AddSection onAdd={() => addSection(si + 1)} />
                      </div>
                    ))}
                  </div>
                </div>
              </DataModeProvider>
            </div>

            <aside className="min-h-0 overflow-y-auto border-l bg-background">
              {selWidget ? (
                <WidgetSettings
                  key={selWidget.id}
                  w={selWidget}
                  canvasClass={canvasClass}
                  onChange={(patch, key) => edit(key, (l) => { const at = locate(l, selWidget.id)!; Object.assign(l.sections[at.si].widgets[at.wi], patch) })}
                  onDuplicate={() => {
                    const copy = { ...selWidget, id: uid() }
                    edit(`dup-${copy.id}`, (l) => { const at = locate(l, selWidget.id)!; l.sections[at.si].widgets.splice(at.wi + 1, 0, copy) })
                    setSelected({ kind: "widget", id: copy.id })
                  }}
                  onRemove={() => { edit(`del-${selWidget.id}`, (l) => { const at = locate(l, selWidget.id)!; l.sections[at.si].widgets.splice(at.wi, 1) }); setSelected(null) }}
                />
              ) : selSection ? (
                <SectionSettings
                  key={selSection.id}
                  section={selSection}
                  onChange={(patch, key) => edit(key, (l) => Object.assign(l.sections.find((x) => x.id === selSection.id)!, patch))}
                  onRemove={() => { edit(`del-s-${selSection.id}`, (l) => { l.sections = l.sections.filter((x) => x.id !== selSection.id) }); setSelected(null) }}
                />
              ) : (
                <NothingSelected />
              )}
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>{dragType && <DragChip type={dragType} />}</DragOverlay>
        </DndContext>
      </CoachContext.Provider>
    </div>
  )
}

function DragChip({ type }: { type: string }) {
  const def = getWidget(type)
  if (!def) return null
  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2 rounded-lg border bg-background p-2 font-[family-name:var(--ff-geist)] text-sm shadow-xl">
      <def.icon className="size-4" /> {def.name}
    </div>
  )
}

function AddSection({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="group/add relative -my-[calc(var(--page-gap)/2)] flex h-[var(--page-gap)] items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/add:bg-primary/40" />
      <button
        onClick={onAdd}
        className="relative z-10 flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 font-[family-name:var(--ff-geist)] text-[0.7rem] text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/add:opacity-100 focus-visible:opacity-100"
        aria-label="Add a section here"
      >
        <Plus className="size-3" /> Section
      </button>
    </div>
  )
}

type CanvasProps = {
  coach: Coach
  device: Device
  dragging: string | null
  resizing: { id: string; span: number } | null
  selected: Selection
  onSelect: (s: Selection) => void
  onResizeStart: (w: WidgetInstance, e: React.PointerEvent) => void
}

function SectionEditor({
  section,
  first,
  last,
  onMove,
  onRemove,
  ...canvas
}: CanvasProps & { section: Section; first: boolean; last: boolean; onMove: (by: number) => void; onRemove: () => void }) {
  const isSel = canvas.selected?.kind === "section" && canvas.selected.id === section.id
  const { setNodeRef: setEndRef, isOver: endOver } = useDroppable({ id: `end:${section.id}` })
  return (
    <section
      onClick={(e) => {
        e.stopPropagation()
        canvas.onSelect({ kind: "section", id: section.id })
      }}
      className={cn("group/sec relative rounded-[calc(var(--radius)+4px)] outline-2 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-primary/25", isSel && "outline-primary")}
    >
      <div
        className="absolute -top-3 right-2 z-20 flex items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 font-[family-name:var(--ff-geist)] text-foreground opacity-0 shadow-sm transition-opacity group-hover/sec:opacity-100 data-[on=true]:opacity-100"
        data-on={isSel}
      >
        <span className="px-1.5 text-[0.7rem] text-muted-foreground">Section</span>
        <Button variant="ghost" size="icon-xs" disabled={first} aria-label="Move section up" onClick={(e) => { e.stopPropagation(); onMove(-1) }}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon-xs" disabled={last} aria-label="Move section down" onClick={(e) => { e.stopPropagation(); onMove(1) }}>
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Remove section" onClick={(e) => { e.stopPropagation(); onRemove() }}>
          <Trash2 />
        </Button>
      </div>
      <div className={cn("w-grid", SECTION_BG[section.background ?? "none"])}>
        {section.widgets.map((w) => (
          <EditableWidget key={w.id} w={w} {...canvas} />
        ))}
        <div
          ref={setEndRef}
          style={{ gridColumn: "1 / -1" }}
          className={cn(
            "grid place-items-center rounded-(--radius) border-2 border-dashed font-[family-name:var(--ff-geist)] text-xs text-muted-foreground transition-colors",
            section.widgets.length ? (canvas.dragging ? "min-h-12" : "hidden") : "min-h-28",
            endOver ? "border-primary bg-primary/5 text-primary" : "border-foreground/15",
          )}
        >
          {section.widgets.length ? "Drop here to add at the end" : "Drop a widget here"}
        </div>
      </div>
    </section>
  )
}

function EditableWidget({ w, coach, device, dragging, resizing, selected, onSelect, onResizeStart }: CanvasProps & { w: WidgetInstance }) {
  const def = getWidget(w.type)
  const drag = useDraggable({ id: w.id })
  const drop = useDroppable({ id: `before:${w.id}` })
  const isSel = selected?.kind === "widget" && selected.id === w.id
  const live = resizing?.id === w.id ? { ...w, span: resizing.span } : w
  if (!def) return null
  const C = def.Component
  const available = isAvailable(w, coach)
  const showInsert = drop.isOver && dragging && dragging !== w.id
  const hiddenHere = device === "phone" && w.hideOnPhone
  return (
    <div
      ref={(n) => {
        drag.setNodeRef(n)
        drop.setNodeRef(n)
      }}
      style={cellStyle(live)}
      {...drag.attributes}
      {...drag.listeners}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({ kind: "widget", id: w.id })
      }}
      aria-label={`${def.name}. Click to edit, drag to move.`}
      className={cn(
        "w-cell group/w relative cursor-grab rounded-[calc(var(--radius)+2px)] outline-2 outline-offset-2 outline-transparent hover:outline-primary/40 active:cursor-grabbing",
        isSel && "outline-primary",
        drag.isDragging && "opacity-30",
        hiddenHere && "opacity-40",
      )}
    >
      {showInsert && <span className="absolute top-0 bottom-0 -left-[calc(var(--page-gap)/2+1px)] z-10 w-0.5 rounded-full bg-primary" />}
      <span
        className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 font-[family-name:var(--ff-geist)] text-[0.65rem] text-background opacity-0 group-hover/w:opacity-100 data-[on=true]:opacity-100"
        data-on={isSel || resizing?.id === w.id}
      >
        {def.name} · {spanLabel(effectiveSpan(live))}
      </span>
      {hiddenHere && (
        <Badge variant="secondary" className="absolute top-2 right-2 z-10 gap-1">
          <EyeOff className="size-3" /> Hidden on phones
        </Badge>
      )}
      <div className="pointer-events-none flex flex-1 flex-col select-none [&>*]:flex-1">
        {available ? (
          <C variant={w.variant ?? def.variants[0].value} props={w.props ?? {}} />
        ) : (
          <div className="grid min-h-24 place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its module is switched off in Look and feel → Menu and words.
          </div>
        )}
      </div>
      {/* Resize handle: only on desktop, where spans apply as set */}
      {device === "desktop" && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${def.name}`}
          onPointerDown={(e) => onResizeStart(w, e)}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-1/2 -right-[calc(var(--page-gap)/2+3px)] z-20 flex h-12 w-2.5 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border bg-background opacity-0 shadow-sm group-hover/w:opacity-100",
            (isSel || resizing?.id === w.id) && "opacity-100",
          )}
        >
          <span className="h-5 w-0.5 rounded-full bg-primary" />
        </span>
      )}
    </div>
  )
}
