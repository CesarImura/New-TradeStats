"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ChevronRight, Eye, EyeOff, GripVertical, Plus, RotateCcw, Trash2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { imgKey, parseEntries, useDefaultSlides, useShelfCards, type MediaEntry, type MediaItem, type Part } from "@/components/widgets/media"
import type { WidgetProps } from "@/components/widgets/shared"
import { series } from "@/components/widgets/kit"
import { cn } from "@/lib/utils"
import { Field } from "./controls"

// The cards of a Shelf and the slides of a Featured hero, edited in Design → Content: add, edit, hide, delete and
// drag into order. The list saves as JSON in the widget's `cards` prop and each picture in its own prop
// (media.tsx imgKey), so the store keeps each picture once. Cards from the coach's courses, lessons or files keep a
// link to them (their progress stays live) and can be hidden, not deleted.

type Props = WidgetProps["props"]

const TARGETS = [
  { value: "courses", label: "Courses" },
  { value: "calendar", label: "Calendar" },
  { value: "community", label: "Community" },
  { value: "profile", label: "Upgrade" },
  { value: "url", label: "A web address" },
]

const PARTS: Record<"shelf" | "hero", { part: Part; label: string }[]> = {
  shelf: [
    { part: "kicker", label: "Small label" },
    { part: "title", label: "Title" },
    { part: "text", label: "Text" },
    { part: "tags", label: "Tags" },
    { part: "progress", label: "Progress" },
    { part: "button", label: "Button" },
  ],
  hero: [
    { part: "kicker", label: "Small label" },
    { part: "tags", label: "Tags" },
    { part: "title", label: "Title" },
    { part: "text", label: "Text" },
    { part: "facts", label: "Details" },
    { part: "progress", label: "Progress" },
    { part: "button", label: "Buttons" },
  ],
}

const selectClass = "h-8 w-full rounded-lg border bg-background px-2 text-sm"
const newId = () => `c${Math.random().toString(36).slice(2, 8)}`

export function MediaCardsEditor({
  kind,
  max,
  label,
  props,
  onProps,
  picture,
}: {
  kind: "shelf" | "hero"
  max: number
  label: string
  props: Props
  /** Saves props on the widget; `key` groups an edit for undo. */
  onProps: (patch: Props, key: string) => void
  /** The editor's picture field (Upload, Replace, Remove). */
  picture: (value: string, onPick: (dataUrl: string) => void) => React.ReactNode
}) {
  const shelf = useShelfCards(props)
  const slides = useDefaultSlides(props)
  const base: MediaItem[] = kind === "shelf" ? shelf.base : slides
  const saved = parseEntries(props.cards)
  // Until the coach edits, the list is the source as it is: one linked entry per item.
  const entries: MediaEntry[] = saved ?? base.slice(0, max).map((b) => ({ id: b.id, ref: b.id }))
  // On a Shelf, items published since the list was saved show at the end, as the widget shows them.
  const extra = saved && kind === "shelf" ? base.filter((b) => !saved.some((e) => e.ref === b.id || e.id === b.id)).map((b) => ({ id: b.id, ref: b.id })) : []
  const list: MediaEntry[] = [...entries, ...extra]
  const byId = new Map(base.map((b) => [b.id, b]))
  const [open, setOpen] = useState<string | null>(null)
  const [drag, setDrag] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const noun = kind === "hero" ? "slide" : "card"

  const save = (next: MediaEntry[], key: string, also: Props = {}) => onProps({ cards: JSON.stringify(next), ...also }, `cards-${key}`)
  const update = (id: string, patch: Partial<MediaEntry>) => save(list.map((e) => (e.id === id ? clean({ ...e, ...patch }) : e)), `${id}-${Object.keys(patch).join("-")}`)
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return
    const next = [...list]
    const [e] = next.splice(from, 1)
    next.splice(to, 0, e)
    save(next, "order")
  }
  const add = () => {
    const id = newId()
    save([...list, { id, title: kind === "hero" ? "New slide" : "New card", button: kind === "hero" ? "Start here" : undefined }], "add")
    setOpen(id)
  }
  // One save for the list and the picture: two in a row would each start from the same old props.
  const remove = (id: string) => save(
    list.filter((e) => e.id !== id),
    "remove",
    { [imgKey(id)]: "" },
  )

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.8rem] font-medium">
          {label} <span className="text-muted-foreground tabular-nums">{list.filter((e) => !e.hidden).length}</span>
        </span>
        {saved && (
          <Button variant="ghost" size="sm" className="-mr-2 h-7 text-muted-foreground" onClick={() => onProps({ cards: "" }, "cards-reset")} title={kind === "hero" ? "Back to your courses" : "Back to the source as it is"}>
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        )}
      </div>

      <ol className="grid gap-1.5" onDragLeave={() => setOver(null)}>
        {list.map((e, i) => {
          const b = e.ref ? byId.get(e.ref) : undefined
          const title = e.title || b?.title || (kind === "hero" ? "Picture only" : "Untitled")
          const pic = typeof props[imgKey(e.id)] === "string" ? String(props[imgKey(e.id)]) : b?.picture
          const expanded = open === e.id
          return (
            <li
              key={e.id}
              draggable
              onDragStart={(ev) => {
                setDrag(i)
                ev.dataTransfer.effectAllowed = "move"
                ev.dataTransfer.setData("text/x-media-card", e.id)
              }}
              onDragOver={(ev) => {
                if (drag === null) return
                ev.preventDefault()
                setOver(i)
              }}
              onDrop={(ev) => {
                ev.preventDefault()
                if (drag !== null) move(drag, i)
                setDrag(null)
                setOver(null)
              }}
              onDragEnd={() => {
                setDrag(null)
                setOver(null)
              }}
              className={cn(
                "grid rounded-lg border bg-background transition-[box-shadow,opacity] duration-150",
                drag === i && "opacity-50",
                over === i && drag !== null && drag !== i && (drag < i ? "shadow-[0_2px_0_0_var(--primary)]" : "shadow-[0_-2px_0_0_var(--primary)]"),
                e.hidden && "bg-muted/40",
              )}
            >
              <div className="flex min-w-0 items-center gap-2 py-1.5 pr-1.5 pl-1">
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden />
                <span className={cn("relative h-8 w-11 shrink-0 overflow-hidden rounded-md border", e.hidden && "opacity-40")} style={{ background: `color-mix(in oklab, ${series(b?.tone ?? i)} 30%, var(--muted))` }}>
                  {pic && (
                    // eslint-disable-next-line @next/next/no-img-element -- an uploaded data URL
                    <img src={pic} alt="" className="absolute inset-0 size-full object-cover" />
                  )}
                </span>
                <button type="button" onClick={() => setOpen(expanded ? null : e.id)} className="grid min-w-0 flex-1 text-left outline-none focus-visible:underline" aria-expanded={expanded}>
                  <span className={cn("truncate text-[0.8rem] font-medium", e.hidden && "text-muted-foreground line-through")}>{title}</span>
                  <span className="truncate text-xs text-muted-foreground">{e.hidden ? "Hidden" : e.ref ? (kind === "hero" && e.ref === "own" ? "Your headline" : "From your content") : `Your ${noun}`}</span>
                </button>
                <div className="flex shrink-0 items-center">
                  <IconButton label={`Move ${noun} up`} onClick={() => move(i, i - 1)} disabled={i === 0}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton label={`Move ${noun} down`} onClick={() => move(i, i + 1)} disabled={i === list.length - 1}>
                    <ArrowDown />
                  </IconButton>
                  <IconButton label={e.hidden ? `Show ${noun}` : `Hide ${noun}`} onClick={() => update(e.id, { hidden: !e.hidden })}>
                    {e.hidden ? <EyeOff /> : <Eye />}
                  </IconButton>
                  {!e.ref && (
                    <IconButton label={`Delete ${noun}`} onClick={() => remove(e.id)}>
                      <Trash2 />
                    </IconButton>
                  )}
                  <IconButton label={expanded ? "Close" : "Edit"} onClick={() => setOpen(expanded ? null : e.id)}>
                    <ChevronRight className={cn("transition-transform duration-200", expanded && "rotate-90")} />
                  </IconButton>
                </div>
              </div>
              {expanded && <EntryFields kind={kind} entry={e} base={b} picture={picture(typeof props[imgKey(e.id)] === "string" ? String(props[imgKey(e.id)]) : "", (v) => onProps({ [imgKey(e.id)]: v }, `img-${e.id}`))} onChange={(patch) => update(e.id, patch)} />}
            </li>
          )
        })}
      </ol>

      <Button variant="outline" size="sm" className="w-full" onClick={add} disabled={list.length >= max}>
        <Plus /> Add {noun}
      </Button>
      <p className="text-xs text-muted-foreground">
        {list.length >= max ? `Up to ${max} ${noun}s. Delete or hide one to add another.` : `Drag to change the order. Up to ${max} ${noun}s.`}
        {kind === "shelf" && " Cards from your content keep the student's progress."}
      </p>
    </div>
  )
}

/** Drops empty fields, so a linked card falls back to its course again. */
function clean(e: MediaEntry): MediaEntry {
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v !== "" && v !== undefined && !(Array.isArray(v) && v.length === 0))) as MediaEntry
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:text-foreground [&_svg]:size-3.5" aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  )
}

/** One card's or slide's fields; empty ones show what the linked course says. */
function EntryFields({ kind, entry: e, base: b, picture, onChange }: { kind: "shelf" | "hero"; entry: MediaEntry; base?: MediaItem; picture: React.ReactNode; onChange: (patch: Partial<MediaEntry>) => void }) {
  const off = new Set(e.off ?? [])
  const toggle = (p: Part) => {
    const next = new Set(off)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    onChange({ off: [...next] })
  }
  const text = (key: keyof MediaEntry, label: string, placeholder?: string) => (
    <Field label={label}>
      <Input value={String(e[key] ?? "")} placeholder={placeholder ?? "Empty"} onChange={(ev) => onChange({ [key]: ev.target.value })} />
    </Field>
  )
  const target = (key: "target" | "target2", url: "url" | "url2") => (
    <>
      <select value={e[key] ?? ""} onChange={(ev) => onChange({ [key]: ev.target.value })} className={selectClass} aria-label="Opens">
        <option value="">{b ? "Its own page" : "Courses"}</option>
        {TARGETS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {e[key] === "url" && <Input value={e[url] ?? ""} placeholder="https://…" aria-label="Web address" onChange={(ev) => onChange({ [url]: ev.target.value })} />}
    </>
  )

  return (
    <div className="grid gap-3 border-t p-3">
      <Field label="Picture">{picture}</Field>
      <div className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">Shows</span>
        <div className="flex flex-wrap gap-1.5">
          {PARTS[kind].map(({ part, label }) => (
            <button
              key={part}
              type="button"
              aria-pressed={!off.has(part)}
              onClick={() => toggle(part)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                off.has(part) ? "text-muted-foreground line-through decoration-muted-foreground/60" : "border-foreground/25 bg-foreground/[0.06] text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {kind === "hero" && <p className="text-xs text-muted-foreground">Switch everything off for a slide that is only its picture.</p>}
      </div>
      {!off.has("kicker") && text("kicker", "Small label", b?.kicker || "e.g. New course")}
      {!off.has("title") && text("title", "Title", b?.title || "Title")}
      {!off.has("text") && (
        <Field label="Text">
          <Textarea value={e.text ?? ""} placeholder={b?.sub || "A sentence or two"} onChange={(ev) => onChange({ text: ev.target.value })} />
        </Field>
      )}
      {!off.has("tags") && text("tags", "Tags", b?.tags.join(", ") || "Beginner, Futures")}
      {kind === "hero" && !off.has("facts") && text("facts", "Details", b?.facts?.join(", ") || "12 videos, 1 h 54 min")}
      {!off.has("progress") && (
        <Field label="Progress" hint={b?.pct !== undefined && !e.pct ? "The student's" : undefined}>
          <Input type="number" min={0} max={100} value={e.pct ?? ""} placeholder={b?.pct !== undefined ? `${b.pct}% (live)` : "None"} onChange={(ev) => onChange({ pct: ev.target.value })} />
        </Field>
      )}
      {kind === "shelf" && (
        <Field label="Badge">
          <select value={e.badge ?? ""} onChange={(ev) => onChange({ badge: ev.target.value as MediaEntry["badge"] })} className={selectClass}>
            <option value="">{b ? "Automatic" : "None"}</option>
            <option value="new">New</option>
            <option value="none">None</option>
          </select>
        </Field>
      )}
      {!off.has("button") && (
        <>
          <Field label={kind === "hero" ? "Button" : "Button text"}>
            <Input value={e.button ?? ""} placeholder={b?.button || (kind === "hero" ? "Start here" : "Start")} onChange={(ev) => onChange({ button: ev.target.value })} />
            {target("target", "url")}
          </Field>
          {kind === "hero" && (
            <Field label="Second button">
              <Input value={e.button2 ?? ""} placeholder="Leave empty for none" onChange={(ev) => onChange({ button2: ev.target.value })} />
              {e.button2 && target("target2", "url2")}
            </Field>
          )}
        </>
      )}
    </div>
  )
}
