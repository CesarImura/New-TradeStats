"use client"

import { useDraggable } from "@dnd-kit/core"
import { Copy, EyeOff, GripVertical, MousePointerClick, Plus, Trash2 } from "lucide-react"
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

/** Left panel: every widget, grouped. Drag one onto the page, or press + to add it. */
export function WidgetLibrary({ coach, onAdd }: { coach: Coach; onAdd: (type: string) => void }) {
  return (
    <div className="grid gap-5 p-4">
      <p className="text-xs text-muted-foreground">Drag a widget onto the page, or press + to add it to the selected section.</p>
      {WIDGET_GROUPS.map((g) => {
        const items = WIDGETS.filter((w) => w.group === g)
        return (
          <div key={g} className="grid gap-1.5">
            <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{g}</span>
            {items.map((w) => (
              <LibraryItem key={w.type} def={w} off={!!w.module && !coach.modules[w.module]} onAdd={() => onAdd(w.type)} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function LibraryItem({ def, off, onAdd }: { def: WidgetDef; off: boolean; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `new:${def.type}`, disabled: off })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border bg-background p-2 pr-1.5 text-left",
        off ? "opacity-50" : "cursor-grab hover:border-foreground/30 active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...(off ? {} : listeners)}
      {...attributes}
      aria-label={`Drag ${def.name} onto the page`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
        <def.icon className="size-4" />
      </span>
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
