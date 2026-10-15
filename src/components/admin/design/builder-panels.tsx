"use client"

import { useState } from "react"
import { Copy, EyeOff, GripVertical, Lock, Maximize2, MousePointerClick, Plus, Search, Trash2, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getWidget, librarySections, lookOf, type WidgetDef } from "@/components/widgets/registry"
import { WidgetFrame } from "@/components/widgets/kit"
import { DataModeProvider } from "@/components/widgets/shared"
import type { Coach } from "@/lib/data/coaches"
import { ROW_HEIGHT, type Detail, type Emphasis, type PageId, type WidgetInstance } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"

/** Per-widget Emphasis and Detail (see the rules in widgets/kit.tsx). Shared with the grid's right-click menu. */
export const EMPHASIS: { value: Emphasis; label: string; hint: string }[] = [
  { value: "quiet", label: "Quiet", hint: "No colour. Sits back so other widgets stand out." },
  { value: "accent", label: "Accent", hint: "One mark in your brand colour." },
  { value: "star", label: "Star", hint: "On your brand colour, bigger numbers. One per page." },
]
export const DETAIL: { value: Detail; label: string; hint: string }[] = [
  { value: "compact", label: "Compact", hint: "Just the headline number or item." },
  { value: "standard", label: "Standard", hint: "The headline plus its main context." },
  { value: "detailed", label: "Detailed", hint: "Everything this widget can show." },
]

const MODULE_LABEL = { courses: "Courses", calendar: "Calendar", charts: "Charts", community: "Community", discord: "Discord", journal: "Journal", ranking: "Ranking", ai: "AI assistant" }

/** Size of one column and one gap on the 1180px desktop canvas, for thumbnails. */
const COL_PX = 72
const GAP_PX = 24

/**
 * A widget drawn small, in the coach's draft design and with sample data:
 * laid out at the size it gets on the page by default, then scaled down so
 * the whole widget fits.
 */
export function WidgetThumb({ def, variant, canvasClass, box }: { def: WidgetDef; variant?: string; canvasClass: string; box: { w: number; h: number } }) {
  const look = lookOf(def, variant)
  const width = def.defaultW * COL_PX + (def.defaultW - 1) * GAP_PX
  const height = look.h * ROW_HEIGHT + (look.h - 1) * GAP_PX
  const scale = Math.min((box.w - 16) / width, (box.h - 16) / height)
  const C = def.Component
  return (
    <div className="grid place-items-center overflow-hidden bg-muted/50" style={{ height: box.h }} aria-hidden inert>
      <DataModeProvider value="sample">
        <div
          className={cn(canvasClass, "pointer-events-none flex flex-col bg-background font-sans text-foreground select-none [&>*]:flex-1")}
          style={{ width, height, zoom: scale, containerType: "inline-size" }}
        >
          {/* Library and layout thumbnails always show the default Emphasis and Detail. */}
          <WidgetFrame>
            <C variant={look.value} props={{}} />
          </WidgetFrame>
        </div>
      </DataModeProvider>
    </div>
  )
}

/**
 * Left panel: every widget, grouped, each with a live thumbnail. Search by
 * name, description, group or look. Drag one onto the grid, or press + to add it.
 */
export function WidgetLibrary({
  page,
  coach,
  canvasClass,
  onAdd,
  onDragType,
}: {
  page: PageId
  coach: Coach
  canvasClass: string
  onAdd: (type: string) => void
  /** Tells the grid which widget is being dragged in, so it can show its size. */
  onDragType: (type: string | null) => void
}) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const match = (w: WidgetDef) => !q || `${w.name} ${w.description} ${w.group} ${w.variants.map((v) => v.label).join(" ")}`.toLowerCase().includes(q)
  const groups = librarySections(page)
    .map((s) => ({ g: s.title, items: s.types.map((t) => getWidget(t)!).filter(match) }))
    .filter((x) => x.items.length)

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
        <p className="text-xs text-muted-foreground">Drag a widget onto the grid, or press + to add it at the bottom.</p>
      </div>
      <div className="grid gap-5 px-4 pb-6">
        {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No widget matches “{query}”. Try “calendar”, “progress” or “banner”.</p>}
        {groups.map(({ g, items }) => (
          <div key={g} className="grid gap-2">
            <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{g}</span>
            {items.map((w) => {
              const off = !!w.module && !coach.modules[w.module]
              return (
                <div
                  key={w.type}
                  draggable={!off}
                  // Native drag and drop: the grid accepts drops from outside.
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", w.type)
                    e.dataTransfer.effectAllowed = "copy"
                    onDragType(w.type)
                  }}
                  onDragEnd={() => onDragType(null)}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-background text-left",
                    off ? "opacity-55" : "cursor-grab hover:border-foreground/30 hover:shadow-sm active:cursor-grabbing",
                  )}
                  aria-label={`${w.name}. Drag onto the grid or press add.`}
                >
                  <WidgetThumb def={w} canvasClass={canvasClass} box={{ w: 266, h: 128 }} />
                  <div className="flex items-center gap-2 border-t p-2 pr-1.5">
                    <w.icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm">{w.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{off ? `Switch on ${MODULE_LABEL[w.module!]} to use` : `${w.variants.length} layout${w.variants.length === 1 ? "" : "s"} · ${w.description}`}</span>
                    </span>
                    {!off && (
                      <Button variant="ghost" size="icon-xs" aria-label={`Add ${w.name}`} onClick={() => onAdd(w.type)}>
                        <Plus />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Right panel for a selected widget: emphasis, detail, layout, size, settings, and phone visibility. */
export function WidgetSettings({
  w,
  pinned,
  canvasClass,
  onChange,
  onDuplicate,
  onRemove,
}: {
  w: WidgetInstance
  /** The page's core widget: it can't be removed, duplicated or hidden. */
  pinned?: boolean
  canvasClass: string
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const def = getWidget(w.type)!
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  const look = lookOf(def, w.variant)
  const pick = (v: (typeof def.variants)[number]) => onChange({ variant: v.value, h: Math.max(w.h, v.minH) }, `${w.id}-variant`)
  const emphasis = w.emphasis ?? "accent"
  const detail = w.detail ?? "standard"
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

      {pinned && (
        <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          The main part of this page. It always stays on the page: move it or drag its edges to resize it. On the live page it grows with its
          content.
        </p>
      )}

      <Field label="Emphasis">
        <Segmented label="Emphasis" value={emphasis} options={EMPHASIS} onChange={(v) => onChange({ emphasis: v }, `${w.id}-emphasis`)} />
        <p className="text-xs text-muted-foreground">{EMPHASIS.find((o) => o.value === emphasis)?.hint}</p>
      </Field>
      <Field label="Detail">
        <Segmented label="Detail" value={detail} options={DETAIL} onChange={(v) => onChange({ detail: v }, `${w.id}-detail`)} />
        <p className="text-xs text-muted-foreground">{DETAIL.find((o) => o.value === detail)?.hint}</p>
      </Field>

      {def.variants.length > 1 && (
        <Field label="Layout">
          <div className="grid gap-2" role="radiogroup" aria-label="Layout">
            {def.variants.map((v) => (
              // A div, not a button: the thumbnail contains the widget's own buttons.
              <div
                key={v.value}
                role="radio"
                tabIndex={0}
                aria-checked={look.value === v.value}
                aria-label={v.label}
                // A taller look grows the widget so its content fits.
                onClick={() => pick(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    pick(v)
                  }
                }}
                className={cn(
                  "cursor-pointer overflow-hidden rounded-lg border text-left outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
                  look.value === v.value && "border-foreground ring-1 ring-foreground",
                )}
              >
                <WidgetThumb def={def} variant={v.value} canvasClass={canvasClass} box={{ w: 306, h: 120 }} />
                <span className="block border-t px-2.5 py-1.5 text-xs font-medium">{v.label}</span>
              </div>
            ))}
          </div>
        </Field>
      )}

      <Field label="Size">
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3 text-sm">
          <Maximize2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1">
            <span className="font-medium tabular-nums">
              {w.w} × {w.h}
            </span>{" "}
            <span className="text-muted-foreground">cells</span>
            <span className="block text-xs text-muted-foreground">
              Drag the widget&apos;s edges or corner on the grid. Smallest for this layout: {def.minW} × {look.minH}.
            </span>
          </span>
        </div>
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
      {!pinned && (
        <label className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
          <span className="flex items-center gap-2">
            <EyeOff className="size-4 text-muted-foreground" /> Hide on phones
          </span>
          <Switch checked={!!w.hideOnPhone} onCheckedChange={(hideOnPhone) => onChange({ hideOnPhone }, `${w.id}-phone`)} />
        </label>
      )}
      {!pinned && (
        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy /> Duplicate
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
            <Trash2 /> Remove
          </Button>
        </div>
      )}
    </div>
  )
}

export function NothingSelected() {
  return (
    <div className="grid gap-4 p-4 text-sm text-muted-foreground">
      <MousePointerClick className="size-5" />
      <p>Click a widget on the grid to change it.</p>
      <ul className="grid gap-2 text-xs">
        <li className="flex gap-2">
          <GripVertical className="size-4 shrink-0" /> Drag a widget to move it. The highlighted cells show where it will land.
        </li>
        <li className="flex gap-2">
          <Maximize2 className="size-4 shrink-0" /> Drag a widget&apos;s right edge, bottom edge or corner to resize it. It snaps to the grid, wider and taller.
        </li>
        <li className="flex gap-2">
          <EyeOff className="size-4 shrink-0" /> Check tablet and phone: the page reflows on its own.
        </li>
      </ul>
    </div>
  )
}
