"use client"

import { addDays, addMinutes, differenceInMinutes, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfMonth } from "date-fns"
import { NOW, hhmm, type Item, type ItemKind } from "@/lib/data/schedule"
import { cn } from "@/lib/utils"

/** Admin / Calendar event (Figma 583:660): a 2px edge and a soft fill by type. Live is accent, 1:1 call is success, news is danger, group calls and workshops are neutral. */
const TONE: Record<ItemKind, string> = {
  live: "border-a-accent-strong bg-a-accent-soft",
  call: "border-a-border-strong bg-a-muted",
  workshop: "border-a-border-strong bg-a-muted",
  "one-on-one": "border-a-success bg-a-success-soft",
  news: "border-a-danger bg-a-danger-soft",
}
export const KIND_LABEL: Record<ItemKind, string> = { live: "Live session", call: "Group call", workshop: "Workshop", "one-on-one": "Call", news: "News" }
export const KIND_DOT: Record<ItemKind, string> = { live: "bg-a-accent-strong", call: "bg-a-text-2", workshop: "bg-a-text-2", "one-on-one": "bg-a-success", news: "bg-a-danger" }

function meta(i: Item) {
  if (i.kind === "news") return `News · ${i.news?.noTrade ? "No trade" : i.news?.impact}`
  if (i.kind === "workshop" && i.event?.seats) return `Workshop · ${i.event.signedUp} / ${i.event.seats} seats`
  return `${KIND_LABEL[i.kind]} · ${hhmm(i.start)}`
}

const ROW = 56 // px per hour
const label = (i: Item) => `${i.title}, ${KIND_LABEL[i.kind]}, ${format(i.start, "EEEE d MMMM")} ${hhmm(i.start)}`

function EventBlock({ item, onSelect, className, style }: { item: Item; onSelect: (i: Item, el?: HTMLElement) => void; className?: string; style?: React.CSSProperties }) {
  // A 30 minute slot is 24px tall: only the title fits (Figma 557:26777).
  const short = typeof style?.height === "number" && style.height < 44
  return (
    <button type="button" aria-label={label(item)} title={`${hhmm(item.start)} ${item.title}`} onClick={(e) => (e.stopPropagation(), onSelect(item, e.currentTarget))} style={style}
      className={cn("absolute flex min-w-0 flex-col items-start overflow-hidden rounded-a-sm border-l-2 px-2 text-left outline-none transition-[filter] duration-200 hover:brightness-125 focus-visible:ring-2 focus-visible:ring-a-border-focus", short ? "justify-center py-0" : "gap-0.5 py-1.5", TONE[item.kind], className)}>
      <span className="w-full truncate t-caption text-a-text">{item.title}</span>
      {!short && <span className="w-full truncate t-micro text-a-text-2">{meta(item)}</span>}
    </button>
  )
}

/** Overlapping items share the width of their day, side by side. */
function lanes(list: Item[]) {
  const out = new Map<string, { lane: number; of: number }>()
  let cluster: Item[] = []
  let end = 0
  const flush = () => {
    const ends: number[] = []
    for (const i of cluster) {
      let l = ends.findIndex((e) => e <= +i.start)
      if (l < 0) l = ends.length
      ends[l] = +i.end
      out.set(i.key, { lane: l, of: 1 })
    }
    for (const i of cluster) out.get(i.key)!.of = ends.length
    cluster = []
  }
  for (const i of [...list].sort((a, b) => +a.start - +b.start)) {
    if (cluster.length && +i.start >= end) flush()
    cluster.push(i)
    end = Math.max(end, +i.end)
  }
  flush()
  return out
}

/** Calendar · 01 Week (Figma 532:8006): a panel, a 40px head with the days, 56px per hour, events inset 4px. Click an empty time to schedule there. */
export function AdminWeek({ items, start, onSelect, onEmptySlot }: { items: Item[]; start: Date; onSelect: (i: Item, el?: HTMLElement) => void; onEmptySlot: (d: Date) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const inWeek = items.filter((i) => i.start >= days[0] && i.start < addDays(days[6], 1))
  const first = Math.min(8, ...inWeek.map((i) => i.start.getHours()))
  const last = Math.max(19, ...inWeek.map((i) => Math.ceil(i.end.getHours() + i.end.getMinutes() / 60)))
  const hours = Array.from({ length: last - first }, (_, i) => first + i)
  const y = (d: Date) => (d.getHours() + d.getMinutes() / 60 - first) * ROW

  return (
    <div data-slot="admin-week" className="overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
      <div className="overflow-x-auto">
        <div className="min-w-[860px]">
          <div className="grid h-10 grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-a-border">
            <span />
            {days.map((d) => (
              <div key={+d} className={cn("flex items-center border-l border-a-border px-3 t-body-m tabular-nums", isSameDay(d, NOW) ? "text-a-text" : "text-a-text-2")}>
                {format(d, "EEE d")}
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]" style={{ height: hours.length * ROW }}>
            <div className="relative">
              {hours.map((h) => (
                <span key={h} className="absolute left-2.5 t-micro text-a-text-3 tabular-nums" style={{ top: (h - first) * ROW + 6 }}>
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((d) => {
              const list = inWeek.filter((i) => isSameDay(i.start, d))
              const lane = lanes(list)
              return (
                <div key={+d} className="relative cursor-pointer border-l border-a-border"
                  style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${ROW - 1}px, var(--admin-color-border-subtle) ${ROW - 1}px, var(--admin-color-border-subtle) ${ROW}px)` }}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    const mins = Math.round(((e.clientY - r.top) / ROW) * 2) * 30
                    onEmptySlot(addMinutes(new Date(d.getFullYear(), d.getMonth(), d.getDate(), first, 0), Math.floor(mins / 30) * 30 - 0))
                  }}>
                  {isSameDay(d, NOW) && NOW.getHours() >= first && NOW.getHours() < last && <span aria-hidden className="absolute inset-x-0 z-10 h-px bg-a-accent-strong" style={{ top: y(NOW) }} />}
                  {list.map((i) => {
                    const l = lane.get(i.key)!
                    return (
                      <EventBlock key={i.key} item={i} onSelect={onSelect}
                        style={{ top: y(i.start) + 2, height: Math.max(24, (differenceInMinutes(i.end, i.start) / 60) * ROW - 4), left: `calc(${(l.lane / l.of) * 100}% + 4px)`, width: `calc(${100 / l.of}% - 8px)` }} />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The month: a day per cell with its events as one-line chips, "+N more" past three. Click a day to open its week. */
export function AdminMonth({ items, cursor, onSelect, onDay }: { items: Item[]; cursor: Date; onSelect: (i: Item, el?: HTMLElement) => void; onDay: (d: Date) => void }) {
  const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const last = endOfMonth(cursor)
  const days: Date[] = []
  for (let d = first; d <= last || days.length % 7; d = addDays(d, 1)) days.push(d)
  return (
    <div className="overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid h-10 grid-cols-7 border-b border-a-border">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <div key={d} className={cn("flex items-center px-3 t-body-m text-a-text-2", i > 0 && "border-l border-a-border")}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d, i) => {
              const list = items.filter((x) => isSameDay(x.start, d))
              return (
                <div key={+d} onClick={() => onDay(d)} className={cn("flex min-h-28 cursor-pointer flex-col gap-1 border-a-border p-1.5 transition-colors duration-300 hover:bg-a-hover", i % 7 > 0 && "border-l", i >= 7 && "border-t", !isSameMonth(d, cursor) && "bg-a-subtle")}>
                  <span className={cn("t-caption tabular-nums", isSameDay(d, NOW) ? "grid size-5 place-items-center self-start rounded-full bg-a-accent-strong text-a-on-accent" : isSameMonth(d, cursor) ? "px-1 text-a-text" : "px-1 text-a-text-3")}>{d.getDate()}</span>
                  {list.slice(0, 3).map((x) => (
                    <button key={x.key} type="button" aria-label={label(x)} onClick={(e) => (e.stopPropagation(), onSelect(x, e.currentTarget))}
                      className={cn("flex w-full min-w-0 items-center gap-1.5 rounded-a-xs border-l-2 px-1.5 py-0.5 text-left outline-none hover:brightness-125 focus-visible:ring-2 focus-visible:ring-a-border-focus", TONE[x.kind])}>
                      <span className="shrink-0 t-micro text-a-text-2 tabular-nums">{hhmm(x.start)}</span>
                      <span className="truncate t-micro text-a-text">{x.title}</span>
                    </button>
                  ))}
                  {list.length > 3 && <span className="px-1.5 t-micro text-a-text-3">+{list.length - 3} more</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
