"use client"

import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { Copy, EyeOff, GripVertical, MousePointerClick, MoveHorizontal, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { WIDGETS, WIDGET_GROUPS, getWidget, type WidgetDef } from "@/components/widgets/registry"
import { DataModeProvider } from "@/components/widgets/shared"
import type { Coach } from "@/lib/data/coaches"
import { SPAN_STEPS, type Section, type SectionBackground, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"

const MODULE_LABEL = { courses: "Courses", calendar: "Calendar", community: "Community", journal: "Journal", ranking: "Ranking", ai: "AI assistant" }

/**
 * A widget drawn small, in the coach's draft design and with sample data.
 * Laid out at the width it would have on the page, then scaled down.
 */
export function WidgetThumb({
  def,
  variant,
  canvasClass,
  space,
  height,
}: {
  def: WidgetDef
  variant?: string
  canvasClass: string
  /** Width available for the thumbnail, in px. */
  space: number
  height: number
}) {
  const logical = def.defaultSpan >= 12 ? 820 : def.defaultSpan >= 8 ? 620 : 400
  const C = def.Component
  return (
    <div className="relative flex justify-center overflow-hidden bg-muted/40 pt-2" style={{ height }} aria-hidden inert>
      <DataModeProvider value="sample">
        <div
          className={cn(canvasClass, "pointer-events-none flex shrink-0 flex-col self-start rounded-md bg-background font-sans text-foreground select-none [&>*]:flex-1")}
          style={{ width: logical, zoom: space / logical, padding: 12, containerType: "inline-size" }}
        >
          <C variant={variant ?? def.variants[0].value} props={{}} />
        </div>
      </DataModeProvider>
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </div>
  )
}

/**
 * Left panel: every widget, grouped, each with a live thumbnail. Search by
 * name, description, group or look. Drag one onto the page, or press + to add it.
 */
export function WidgetLibrary({ coach, canvasClass, onAdd }: { coach: Coach; canvasClass: string; onAdd: (type: string) => void }) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const match = (w: WidgetDef) => !q || `${w.name} ${w.description} ${w.group} ${w.variants.map((v) => v.label).join(" ")}`.toLowerCase().includes(q)
  const groups = WIDGET_GROUPS.map((g) => ({ g, items: WIDGETS.filter((w) => w.group === g && match(w)) })).filter((x) => x.items.length)

  return (
    <div className="grid gap-4">
      <div className="sticky top-0 z-10 grid gap-2 border-b bg-background p-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search widgets" aria-label="Search widgets" className="pl-8" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Drag a widget onto the page, or press + to add it to the selected section.</p>
      </div>
      <div className="grid gap-5 px-4 pb-6">
        {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No widget matches “{query}”. Try “calendar”, “progress” or “banner”.</p>}
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

function LibraryItem({ def, off, canvasClass, onAdd }: { def: WidgetDef; off: boolean; canvasClass: string; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `new:${def.type}`, disabled: off })
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
      <WidgetThumb def={def} canvasClass={canvasClass} space={236} height={112} />
      <div className="flex items-center gap-2 border-t p-2 pr-1.5">
        <def.icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-sm">{def.name}</span>
          <span className="truncate text-xs text-muted-foreground">{off ? `Switch on ${MODULE_LABEL[def.module!]} to use` : `${def.variants.length} looks · ${def.description}`}</span>
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

/** Right panel for a selected widget: its look, width, settings, and phone visibility. */
export function WidgetSettings({
  w,
  canvasClass,
  onChange,
  onDuplicate,
  onRemove,
}: {
  w: WidgetInstance
  canvasClass: string
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const def = getWidget(w.type)!
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  const current = w.variant ?? def.variants[0].value
  const span = Math.max(w.span, def.minSpan)
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

      <Field label="Look">
        <div className="grid gap-2" role="radiogroup" aria-label="Look">
          {def.variants.map((v) => (
            <button
              key={v.value}
              role="radio"
              aria-checked={current === v.value}
              onClick={() => onChange({ variant: v.value }, `${w.id}-variant`)}
              className={cn("overflow-hidden rounded-lg border text-left hover:border-foreground/40", current === v.value && "border-foreground ring-1 ring-foreground")}
            >
              <WidgetThumb def={def} variant={v.value} canvasClass={canvasClass} space={286} height={100} />
              <span className="block border-t px-2.5 py-1.5 text-xs font-medium">{v.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Width" hint="Or drag the widget's right edge">
        <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label="Width">
          {SPAN_STEPS.map((s) => {
            const tooNarrow = s.span < def.minSpan
            return (
              <button
                key={s.span}
                role="radio"
                aria-checked={span === s.span}
                disabled={tooNarrow}
                title={tooNarrow ? "Too narrow for this widget's content" : `${s.span} of 12 columns`}
                onClick={() => onChange({ span: s.span }, `${w.id}-span`)}
                className={cn("rounded-md border py-1.5 text-xs tabular-nums disabled:cursor-not-allowed disabled:opacity-35", span === s.span && "border-foreground font-semibold ring-1 ring-foreground")}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        <span className="text-xs text-muted-foreground">
          {span} of 12 columns{def.minSpan > 3 ? `; this widget needs at least ${def.minSpan}` : ""}. On tablets narrow widgets take half the row; on phones every widget takes the full row.
        </span>
      </Field>

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

/** Right panel for a selected section: background. */
export function SectionSettings({ section, onChange, onRemove }: { section: Section; onChange: (patch: Partial<Section>, key: string) => void; onRemove: () => void }) {
  return (
    <div className="grid gap-5 p-4">
      <div className="grid">
        <span className="text-sm font-semibold">Section</span>
        <span className="text-xs text-muted-foreground">A band of the page. Widgets inside it sit on a 12-column grid and wrap onto the next line when a row is full.</span>
      </div>
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
          <GripVertical className="size-4 shrink-0" /> Drag widgets to reorder them or move them to another section.
        </li>
        <li className="flex gap-2">
          <MoveHorizontal className="size-4 shrink-0" /> Drag a widget&apos;s right edge to make it wider or narrower. It snaps to the grid.
        </li>
        <li className="flex gap-2">
          <Plus className="size-4 shrink-0" /> Hover between sections to add a new one.
        </li>
        <li className="flex gap-2">
          <EyeOff className="size-4 shrink-0" /> Check tablet and phone: widgets reflow on their own.
        </li>
      </ul>
    </div>
  )
}
