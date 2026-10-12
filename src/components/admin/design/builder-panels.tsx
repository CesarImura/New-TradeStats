"use client"

import { useDraggable } from "@dnd-kit/core"
import { useState } from "react"
import { Copy, EyeOff, GripVertical, MousePointerClick, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { WIDGETS, WIDGET_GROUPS, getWidget, type WidgetDef } from "@/components/widgets/registry"
import type { Coach } from "@/lib/data/coaches"
import { COLUMN_SPLITS, type Section, type SectionBackground, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"

const MODULE_LABEL = { courses: "Courses", calendar: "Calendar", community: "Community", journal: "Journal", ranking: "Ranking", ai: "AI assistant" }

/**
 * Left panel: every widget, grouped, each with a live thumbnail drawn in the
 * coach's draft design. Search by name, description or group. Drag one onto
 * the page, or press + to add it to the selected section.
 */
export function WidgetLibrary({
  coach,
  canvasClass,
  onAdd,
}: {
  coach: Coach
  /** Classes that give thumbnails the coach's theme (scope class, dark). */
  canvasClass: string
  onAdd: (type: string) => void
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const match = (w: WidgetDef) => !q || `${w.name} ${w.description} ${w.group}`.toLowerCase().includes(q)
  const groups = WIDGET_GROUPS.map((g) => ({ g, items: WIDGETS.filter((w) => w.group === g && match(w)) })).filter((x) => x.items.length)

  return (
    <div className="grid gap-4">
      <div className="sticky top-0 z-10 grid gap-2 border-b bg-background p-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets"
            aria-label="Search widgets"
            className="pl-8"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Drag a widget onto the page, or press + to add it to the selected section.</p>
      </div>
      <div className="grid gap-5 px-4 pb-6">
        {groups.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No widget matches “{query}”. Try “calendar”, “progress” or “banner”.
          </p>
        )}
        {groups.map(({ g, items }) => (
          <div key={g} className="grid gap-2">
            <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{g}</span>
            {items.map((w) => (
              <LibraryItem key={w.type} def={w} canvasClass={canvasClass} off={!!w.module && !coach.modules[w.module]} onAdd={() => onAdd(w.type)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Width the thumbnail is laid out at before scaling: a column, or the full page for wide widgets. */
const THUMB_WIDTH = { normal: 420, wide: 820 }
const THUMB_SPACE = 236

function LibraryItem({ def, off, canvasClass, onAdd }: { def: WidgetDef; off: boolean; canvasClass: string; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `new:${def.type}`, disabled: off })
  const logical = def.wide ? THUMB_WIDTH.wide : THUMB_WIDTH.normal
  const C = def.Component
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group overflow-hidden rounded-lg border bg-background text-left",
        off ? "opacity-55" : "cursor-grab hover:border-foreground/30 hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...(off ? {} : listeners)}
      {...attributes}
      aria-label={`Drag ${def.name} onto the page`}
    >
      {/* Live thumbnail: the real widget, in the coach's design, scaled down */}
      <div className="relative flex h-[104px] justify-center overflow-hidden border-b bg-muted/40 pt-2" aria-hidden inert>
        <div
          className={cn(canvasClass, "pointer-events-none shrink-0 self-start rounded-md bg-background font-sans text-foreground select-none")}
          style={{ width: logical, zoom: THUMB_SPACE / logical, padding: 12 }}
        >
          <C variant={def.variants?.[0]?.value} props={{}} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="flex items-center gap-2 p-2 pr-1.5">
        <def.icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-sm">{def.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {off ? `Switch on ${MODULE_LABEL[def.module!]} to use` : def.description}
          </span>
        </span>
        {!off && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Add ${def.name}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
          >
            <Plus />
          </Button>
        )}
      </div>
    </div>
  )
}

/** Right panel for a selected widget: its look, its settings, and phone visibility. */
export function WidgetSettings({
  w,
  onChange,
  onDuplicate,
  onRemove,
}: {
  w: WidgetInstance
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const def = getWidget(w.type)!
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  return (
    <div className="grid gap-5 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
          <def.icon className="size-4" />
        </span>
        <div className="grid">
          <span className="text-sm font-semibold">{def.name}</span>
          <span className="text-xs text-muted-foreground">{def.description}</span>
        </div>
      </div>
      {def.variants && (
        <Field label="Look">
          <Segmented
            label="Look"
            value={w.variant ?? def.variants[0].value}
            options={def.variants}
            onChange={(variant) => onChange({ variant }, `${w.id}-variant`)}
          />
        </Field>
      )}
      {def.settings?.map((s) => {
        if (s.type === "toggle")
          return (
            <label key={s.key} className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
              {s.label}
              <Switch checked={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onCheckedChange={(v) => setProp(s.key, v)} />
            </label>
          )
        if (s.type === "select")
          return (
            <Field key={s.key} label={s.label}>
              <select value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProp(s.key, e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm">
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )
        return (
          <Field key={s.key} label={s.label}>
            {s.type === "textarea" ? (
              <Textarea value={String(props[s.key] ?? "")} placeholder="Leave empty for the default text" onChange={(e) => setProp(s.key, e.target.value)} />
            ) : (
              <Input value={String(props[s.key] ?? "")} placeholder={s.placeholder ?? "Leave empty for the default"} onChange={(e) => setProp(s.key, e.target.value)} />
            )}
          </Field>
        )
      })}
      <label className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
        <span className="flex items-center gap-2">
          <EyeOff className="size-4 text-muted-foreground" /> Hide on phones
        </span>
        <Switch checked={!!w.hideOnPhone} onCheckedChange={(hideOnPhone) => onChange({ hideOnPhone }, `${w.id}-phone`)} />
      </label>
      {def.wide && <p className="text-xs text-muted-foreground">Looks best in a one-column section.</p>}
      <div className="flex gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy /> Duplicate
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 /> Remove
        </Button>
      </div>
    </div>
  )
}

export function SplitIcon({ split, className }: { split: string; className?: string }) {
  const parts = split.split(":").map(Number)
  return (
    <span className={cn("flex h-3.5 w-6 gap-0.5", className)} aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="rounded-[2px] bg-current opacity-70" style={{ flex: p }} />
      ))}
    </span>
  )
}

/** Right panel for a selected section: columns and background. */
export function SectionSettings({
  section,
  onChange,
  onRemove,
}: {
  section: Section
  onChange: (patch: Partial<Section>, key: string) => void
  onRemove: () => void
}) {
  return (
    <div className="grid gap-5 p-4">
      <div className="grid">
        <span className="text-sm font-semibold">Section</span>
        <span className="text-xs text-muted-foreground">A row of the page. Widgets snap into its columns; on phones it becomes one column.</span>
      </div>
      <Field label="Columns">
        <div className="grid grid-cols-5 gap-1.5">
          {COLUMN_SPLITS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              aria-label={c.label}
              aria-pressed={section.columns === c.value}
              onClick={() => onChange({ columns: c.value }, `${section.id}-cols`)}
              className={cn("grid place-items-center rounded-md border py-2 text-muted-foreground hover:text-foreground", section.columns === c.value && "border-foreground text-foreground ring-1 ring-foreground")}
            >
              <SplitIcon split={c.value} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Background">
        <Segmented<SectionBackground>
          label="Background"
          value={section.background ?? "none"}
          onChange={(background) => onChange({ background }, `${section.id}-bg`)}
          options={[
            { value: "none", label: "None" },
            { value: "muted", label: "Soft" },
            { value: "brand", label: "Brand tint" },
          ]}
        />
      </Field>
      <div className="border-t pt-4">
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 /> Remove section and its widgets
        </Button>
      </div>
    </div>
  )
}

export function NothingSelected() {
  return (
    <div className="grid gap-4 p-4 text-sm text-muted-foreground">
      <MousePointerClick className="size-5" />
      <p>Click a widget or a section on the page to change it.</p>
      <ul className="grid gap-2 text-xs">
        <li className="flex gap-2">
          <GripVertical className="size-4 shrink-0" /> Drag widgets to move them between columns and sections.
        </li>
        <li className="flex gap-2">
          <Plus className="size-4 shrink-0" /> Add a section between rows to change the layout.
        </li>
        <li className="flex gap-2">
          <EyeOff className="size-4 shrink-0" /> Check the phone view: sections stack into one column.
        </li>
      </ul>
    </div>
  )
}
