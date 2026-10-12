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
  type DragStartEvent,
} from "@dnd-kit/core"
import { ArrowDown, ArrowUp, EyeOff, ExternalLink, Monitor, Plus, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CoachContext, useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { GRID, SECTION_BG, isAvailable } from "@/components/widgets/page-renderer"
import { getWidget } from "@/components/widgets/registry"
import { getCoach, type Coach } from "@/lib/data/coaches"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import {
  COLUMN_SPLITS,
  columnCount,
  defaultHome,
  resizeSlots,
  uid,
  type ColumnSplit,
  type PageLayout,
  type Section,
  type WidgetInstance,
} from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { NothingSelected, SectionSettings, SplitIcon, WidgetLibrary, WidgetSettings } from "./builder-panels"
import { Segmented } from "./controls"
import { EditorBar, useDraftEditor } from "./editor-shell"

type Selection = { kind: "widget"; id: string } | { kind: "section"; id: string } | null

const clone = (l: PageLayout): PageLayout => JSON.parse(JSON.stringify(l))

function locate(l: PageLayout, id: string) {
  for (let si = 0; si < l.sections.length; si++)
    for (let ci = 0; ci < l.sections[si].slots.length; ci++) {
      const wi = l.sections[si].slots[ci].findIndex((w) => w.id === id)
      if (wi >= 0) return { si, ci, wi }
    }
  return null
}

/** Prefer dropping before a widget, then the end of a column, then anything under the pointer. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const before = hits.filter((h) => String(h.id).startsWith("before:"))
  if (before.length) return before
  const end = hits.filter((h) => String(h.id).startsWith("end:"))
  if (end.length) return end
  return hits.length ? hits : rectIntersection(args)
}

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
  const [device, setDevice] = useState<"desktop" | "phone">("desktop")
  const [selected, setSelected] = useState<Selection>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  // The canvas is laid out at real desktop width and scaled to fit, so
  // columns behave exactly as students will see them.
  const area = useRef<HTMLDivElement>(null)
  const [areaWidth, setAreaWidth] = useState(0)
  useEffect(() => {
    const el = area.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setAreaWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const logicalWidth = device === "phone" ? 390 : 1180
  const zoom = areaWidth ? Math.min(1, (areaWidth - 32) / logicalWidth) : 1

  const layouts = coach.home ?? {}
  const baseLayout = layouts.default ?? defaultHome(theme.template, coach)
  const inherits = tier !== "default" && !layouts[tier]
  const layout = tier === "default" ? baseLayout : (layouts[tier] ?? baseLayout)
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

  // ---------- operations

  const addWidget = (type: string) => {
    const w: WidgetInstance = { id: uid(), type }
    edit(`add-${w.id}`, (l) => {
      const at = selected?.kind === "widget" ? locate(l, selected.id) : null
      const si = at?.si ?? (selected?.kind === "section" ? l.sections.findIndex((s) => s.id === selected.id) : l.sections.length - 1)
      if (si < 0 || !l.sections[si]) l.sections.push({ id: uid(), columns: "1", slots: [[w]] })
      else l.sections[si].slots[at?.ci ?? 0].push(w)
    })
    setSelected({ kind: "widget", id: w.id })
  }

  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const src = String(e.active.id)
    const target = e.over ? String(e.over.id) : null
    if (!target || target === `before:${src}`) return
    const next = clone(layout)
    let w: WidgetInstance
    if (src.startsWith("new:")) w = { id: uid(), type: src.slice(4) }
    else {
      const at = locate(next, src)
      if (!at) return
      ;[w] = next.sections[at.si].slots[at.ci].splice(at.wi, 1)
    }
    if (target.startsWith("before:")) {
      const at = locate(next, target.slice(7))
      if (!at) return
      next.sections[at.si].slots[at.ci].splice(at.wi, 0, w)
    } else {
      const [, sid, ci] = target.split(":")
      const s = next.sections.find((x) => x.id === sid)
      if (!s) return
      s.slots[Number(ci)].push(w)
    }
    save(next, `move-${w.id}-${Date.now()}`)
    setSelected({ kind: "widget", id: w.id })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))

  const selWidget = selected?.kind === "widget" ? (() => { const at = locate(layout, selected.id); return at && layout.sections[at.si].slots[at.ci][at.wi] })() : null
  const selSection = selected?.kind === "section" ? layout.sections.find((s) => s.id === selected.id) : null

  const scope = ".hb-canvas"
  const canvasCtx = { ...ctx, coach, theme, base: `/c/${slug}` }
  const previewHref = `/c/${slug}?preview=draft${tier !== "default" ? `&tier=${tier}` : ""}`

  return (
    <div className="-m-4 grid min-h-[calc(100svh-3.5rem)] grid-rows-[auto_auto_1fr] md:-m-6 lg:-m-8 lg:h-[calc(100svh-3.5rem)]">
      <EditorBar
        slug={slug}
        active="home"
        editor={editor}
        guide={{ title: "Building your Home page", text: "Drag widgets into sections, pick how many columns each section has, and make a different Home per tier if you like." }}
      />

      {/* Tier, device and preview */}
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
        <div className="ml-auto flex items-center gap-2">
          <Segmented
            label="Canvas size"
            value={device}
            onChange={setDevice}
            options={[
              { value: "desktop", label: <><Monitor className="size-3.5" /> Desktop</> },
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
      <DndContext id="home-builder" sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="min-h-0 overflow-y-auto border-r bg-background">
            <WidgetLibrary coach={coach} canvasClass={cn("hb-canvas", theme.mode === "dark" && "dark")} onAdd={addWidget} />
          </aside>

          {/* Canvas: the real Home in the coach's draft theme */}
          <div ref={area} className="min-h-[70svh] min-w-0 overflow-x-hidden overflow-y-auto bg-muted/50 p-4 lg:min-h-0" onClick={() => setSelected(null)}>
              <div
                className={cn(
                  "hb-canvas mx-auto bg-background font-sans text-foreground shadow-xl ring-1 ring-black/10 transition-[max-width]",
                  theme.mode === "dark" && "dark",
                  device === "phone" ? "rounded-[28px]" : "rounded-xl",
                )}
                style={{ width: logicalWidth, zoom }}
              >
                <div className={cn("flex flex-col page-gap @container", device === "phone" ? "p-4" : "p-6 lg:p-8")}>
                  <div className="pointer-events-none flex flex-col gap-1 opacity-80">
                    <span className="eyebrow">Monday, 12 October</span>
                    <h1 className="text-3xl leading-tight">Good morning, {DEMO_STUDENT.first}</h1>
                  </div>
                  <AddSection index={0} onAdd={(i, c) => { edit(`section-${Date.now()}`, (l) => l.sections.splice(i, 0, { id: uid(), columns: c, slots: Array.from({ length: columnCount(c) }, () => []) })) }} />
                  {layout.sections.map((s, si) => (
                    <div key={s.id} className="flex flex-col page-gap">
                      <SectionEditor
                        section={s}
                        coach={coach}
                        first={si === 0}
                        last={si === layout.sections.length - 1}
                        phone={device === "phone"}
                        dragging={dragging}
                        selected={selected}
                        onSelect={setSelected}
                        onMove={(by) => edit(`move-s-${Date.now()}`, (l) => { const [x] = l.sections.splice(si, 1); l.sections.splice(si + by, 0, x) })}
                        onRemove={() => { edit(`del-s-${s.id}`, (l) => l.sections.splice(si, 1)); setSelected(null) }}
                      />
                      <AddSection index={si + 1} onAdd={(i, c) => { edit(`section-${Date.now()}`, (l) => l.sections.splice(i, 0, { id: uid(), columns: c, slots: Array.from({ length: columnCount(c) }, () => []) })) }} />
                    </div>
                  ))}
                </div>
              </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-l bg-background">
            {selWidget ? (
              <WidgetSettings
                key={selWidget.id}
                w={selWidget}
                onChange={(patch, key) => edit(key, (l) => { const at = locate(l, selWidget.id)!; Object.assign(l.sections[at.si].slots[at.ci][at.wi], patch) })}
                onDuplicate={() => {
                  const copy = { ...selWidget, id: uid() }
                  edit(`dup-${copy.id}`, (l) => { const at = locate(l, selWidget.id)!; l.sections[at.si].slots[at.ci].splice(at.wi + 1, 0, copy) })
                  setSelected({ kind: "widget", id: copy.id })
                }}
                onRemove={() => { edit(`del-${selWidget.id}`, (l) => { const at = locate(l, selWidget.id)!; l.sections[at.si].slots[at.ci].splice(at.wi, 1) }); setSelected(null) }}
              />
            ) : selSection ? (
              <SectionSettings
                key={selSection.id}
                section={selSection}
                onChange={(patch, key) =>
                  edit(key, (l) => {
                    const s = l.sections.find((x) => x.id === selSection.id)!
                    if (patch.columns) s.slots = resizeSlots(s.slots, patch.columns)
                    Object.assign(s, patch)
                  })
                }
                onRemove={() => { edit(`del-s-${selSection.id}`, (l) => { l.sections = l.sections.filter((x) => x.id !== selSection.id) }); setSelected(null) }}
              />
            ) : (
              <NothingSelected />
            )}
          </aside>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && <DragChip type={dragging.startsWith("new:") ? dragging.slice(4) : locate(layout, dragging) ? (() => { const at = locate(layout, dragging)!; return layout.sections[at.si].slots[at.ci][at.wi].type })() : ""} />}
        </DragOverlay>
      </DndContext>
      </CoachContext.Provider>
    </div>
  )
}

function DragChip({ type }: { type: string }) {
  const def = getWidget(type)
  if (!def) return null
  return (
    <div className="flex w-56 cursor-grabbing items-center gap-2 rounded-lg border bg-background p-2 text-sm shadow-xl">
      <def.icon className="size-4" /> {def.name}
    </div>
  )
}

function AddSection({ index, onAdd }: { index: number; onAdd: (index: number, c: ColumnSplit) => void }) {
  return (
    <div className="group/add relative -my-[calc(var(--page-gap)/2)] flex h-[var(--page-gap)] items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/add:bg-primary/40" />
      <Popover>
        <PopoverTrigger
          render={
            <button className="relative z-10 flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-[0.7rem] text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover/add:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100" aria-label="Add a section here" />
          }
        >
          <Plus className="size-3" /> Section
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <span className="px-1 text-xs text-muted-foreground">New section with</span>
          <div className="grid gap-1">
            {COLUMN_SPLITS.map((c) => (
              <button key={c.value} onClick={() => onAdd(index, c.value)} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <SplitIcon split={c.value} /> {c.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function SectionEditor({
  section,
  coach,
  first,
  last,
  phone,
  dragging,
  selected,
  onSelect,
  onMove,
  onRemove,
}: {
  section: Section
  coach: Coach
  first: boolean
  last: boolean
  phone: boolean
  dragging: string | null
  selected: Selection
  onSelect: (s: Selection) => void
  onMove: (by: number) => void
  onRemove: () => void
}) {
  const isSel = selected?.kind === "section" && selected.id === section.id
  return (
    <section
      onClick={(e) => {
        e.stopPropagation()
        onSelect({ kind: "section", id: section.id })
      }}
      className={cn(
        "group/sec relative rounded-[calc(var(--radius)+4px)] outline-2 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-primary/25",
        isSel && "outline-primary",
      )}
    >
      <div className="absolute -top-3 right-2 z-20 flex items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 font-[family-name:var(--ff-geist)] text-foreground opacity-0 shadow-sm transition-opacity group-hover/sec:opacity-100 data-[on=true]:opacity-100" data-on={isSel}>
        <span className="flex items-center gap-1 px-1.5 text-[0.7rem] text-muted-foreground">
          <SplitIcon split={section.columns} className="h-3 w-5" /> Section
        </span>
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
      <div className={cn("grid grid-cols-1 page-gap", GRID[section.columns], SECTION_BG[section.background ?? "none"])}>
        {section.slots.map((col, ci) => (
          <Column key={ci} sectionId={section.id} index={ci} widgets={col} coach={coach} phone={phone} dragging={dragging} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </section>
  )
}

function Column({
  sectionId,
  index,
  widgets,
  coach,
  phone,
  dragging,
  selected,
  onSelect,
}: {
  sectionId: string
  index: number
  widgets: WidgetInstance[]
  coach: Coach
  phone: boolean
  dragging: string | null
  selected: Selection
  onSelect: (s: Selection) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `end:${sectionId}:${index}` })
  return (
    <div className="flex min-w-0 flex-col page-gap">
      {widgets.map((w) => (
        <EditableWidget key={w.id} w={w} coach={coach} phone={phone} dragging={dragging} selected={selected?.kind === "widget" && selected.id === w.id} onSelect={onSelect} />
      ))}
      <div
        ref={setNodeRef}
        className={cn(
          "grid flex-1 place-items-center rounded-(--radius) border-2 border-dashed text-xs text-muted-foreground transition-colors",
          widgets.length ? (dragging ? "min-h-14" : "hidden") : "min-h-28",
          isOver ? "border-primary bg-primary/5 text-primary" : "border-foreground/15",
        )}
      >
        {widgets.length ? "Drop here" : "Drop a widget here"}
      </div>
    </div>
  )
}

function EditableWidget({
  w,
  coach,
  phone,
  dragging,
  selected,
  onSelect,
}: {
  w: WidgetInstance
  coach: Coach
  phone: boolean
  dragging: string | null
  selected: boolean
  onSelect: (s: Selection) => void
}) {
  const def = getWidget(w.type)
  const drag = useDraggable({ id: w.id })
  const drop = useDroppable({ id: `before:${w.id}` })
  const available = isAvailable(w, coach)
  const showInsert = drop.isOver && dragging && dragging !== w.id
  if (!def) return null
  const C = def.Component
  return (
    <div
      ref={(n) => {
        drag.setNodeRef(n)
        drop.setNodeRef(n)
      }}
      {...drag.attributes}
      {...drag.listeners}
      onClick={(e) => {
        e.stopPropagation()
        onSelect({ kind: "widget", id: w.id })
      }}
      aria-label={`${def.name}. Click to edit, drag to move.`}
      className={cn(
        "group/w relative flex min-w-0 cursor-grab flex-col rounded-[calc(var(--radius)+2px)] outline-2 outline-offset-2 outline-transparent hover:outline-primary/40 active:cursor-grabbing",
        selected && "outline-primary",
        drag.isDragging && "opacity-30",
        phone && w.hideOnPhone && "opacity-40",
      )}
    >
      {showInsert && <span className="absolute -top-[calc(var(--page-gap)/2+1px)] right-0 left-0 z-10 h-0.5 rounded-full bg-primary" />}
      <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 font-[family-name:var(--ff-geist)] text-[0.65rem] text-background opacity-0 group-hover/w:opacity-100 data-[on=true]:opacity-100" data-on={selected}>
        {def.name}
      </span>
      {phone && w.hideOnPhone && (
        <Badge variant="secondary" className="absolute top-2 right-2 z-10 gap-1">
          <EyeOff className="size-3" /> Hidden on phones
        </Badge>
      )}
      <div className="pointer-events-none flex flex-1 flex-col select-none *:flex-1">
        {available ? (
          <C variant={w.variant ?? def.variants?.[0]?.value} props={w.props ?? {}} />
        ) : (
          <div className="grid min-h-24 place-items-center rounded-(--radius) border border-dashed p-4 text-center text-xs text-muted-foreground">
            {def.name} is hidden: its module is switched off in Look and feel → Menu and words.
          </div>
        )}
      </div>
    </div>
  )
}


