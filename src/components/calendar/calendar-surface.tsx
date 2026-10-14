"use client"

import { addDays, addMonths, addWeeks, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { NOW, hhmm, isLiveNow, type Item, type ItemKind } from "@/lib/data/schedule"
import { cn } from "@/lib/utils"

export type View = "month" | "week" | "list"

const HOURS = { from: 7, to: 23 }
const ROW = 44 // px per hour in the week view

/**
 * Month, week and list views over the same items. Used on the student side
 * (themed) and in the admin area (neutral); the caller decides the colours.
 */
export function CalendarSurface({
  items,
  view,
  onView,
  cursor,
  onCursor,
  onSelect,
  colorOf,
  toolbar,
  onEmptySlot,
}: {
  items: Item[]
  view: View
  onView: (v: View) => void
  cursor: Date
  onCursor: (d: Date) => void
  onSelect: (i: Item) => void
  colorOf: (k: ItemKind) => string
  toolbar?: React.ReactNode
  /** Admin: click an empty time in the week view to create something there. */
  onEmptySlot?: (d: Date) => void
}) {
  const step = (dir: 1 | -1) => onCursor(view === "month" ? addMonths(cursor, dir) : addWeeks(cursor, dir))
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 })
  const label =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), isSameMonth(weekStart, addDays(weekStart, 6)) ? "d MMM yyyy" : "d MMM yyyy")}`

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onCursor(NOW)}>
            Today
          </Button>
        </div>
        <span className="min-w-36 font-heading text-lg">{label}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {toolbar}
          <div role="radiogroup" aria-label="View" className="flex rounded-lg bg-muted p-0.5">
            {(["month", "week", "list"] as View[]).map((v) => (
              <button
                key={v}
                role="radio"
                aria-checked={view === v}
                onClick={() => onView(v)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm text-muted-foreground capitalize",
                  view === v && "bg-background font-medium text-foreground shadow-sm",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" && <Month items={items} cursor={cursor} onSelect={onSelect} colorOf={colorOf} onDay={(d) => (onCursor(d), onView("week"))} />}
      {view === "week" && <Week items={items} start={weekStart} onSelect={onSelect} colorOf={colorOf} onEmptySlot={onEmptySlot} />}
      {view === "list" && (
        <List items={items} start={isSameDay(weekStart, startOfWeek(NOW, { weekStartsOn: 1 })) ? NOW : weekStart} onSelect={onSelect} colorOf={colorOf} />
      )}
    </div>
  )
}

function LiveDot() {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  )
}

function Chip({ item, color, onSelect }: { item: Item; color: string; onSelect: (i: Item) => void }) {
  const live = isLiveNow(item)
  return (
    <button
      onClick={(e) => (e.stopPropagation(), onSelect(item))}
      className="flex w-full min-w-0 items-center gap-1.5 rounded-[var(--r-chip,6px)] px-1.5 py-0.5 text-left text-xs hover:bg-muted"
      title={`${hhmm(item.start)} ${item.title}`}
    >
      {live ? <LiveDot /> : <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />}
      <span className="shrink-0 text-muted-foreground tabular-nums">{hhmm(item.start)}</span>
      <span className={cn("truncate", item.news?.noTrade && "font-medium")}>{item.title}</span>
    </button>
  )
}

function Month({
  items,
  cursor,
  onSelect,
  colorOf,
  onDay,
}: {
  items: Item[]
  cursor: Date
  onSelect: (i: Item) => void
  colorOf: (k: ItemKind) => string
  onDay: (d: Date) => void
}) {
  const first = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
  const last = endOfMonth(cursor)
  const days: Date[] = []
  for (let d = first; d <= last || days.length % 7; d = addDays(d, 1)) days.push(d)
  return (
    <div className="overflow-x-auto rounded-(--radius) border bg-card text-card-foreground">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const list = items.filter((i) => isSameDay(i.start, d))
            const today = isSameDay(d, NOW)
            return (
              <div
                key={+d}
                onClick={() => onDay(d)}
                className={cn(
                  "flex min-h-28 cursor-pointer flex-col gap-0.5 border-r border-b p-1 last:border-r-0 nth-[7n]:border-r-0 hover:bg-muted/40",
                  !isSameMonth(d, cursor) && "bg-muted/30 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "mb-0.5 grid size-6 place-items-center self-start rounded-full text-xs tabular-nums",
                    today && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {list.slice(0, 3).map((i) => (
                  <Chip key={i.key} item={i} color={colorOf(i.kind)} onSelect={onSelect} />
                ))}
                {list.length > 3 && <span className="px-1.5 text-xs text-muted-foreground">+{list.length - 3} more</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Week({
  items,
  start,
  onSelect,
  colorOf,
  onEmptySlot,
}: {
  items: Item[]
  start: Date
  onSelect: (i: Item) => void
  colorOf: (k: ItemKind) => string
  onEmptySlot?: (d: Date) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const hours = Array.from({ length: HOURS.to - HOURS.from }, (_, i) => HOURS.from + i)
  const top = (d: Date) => (d.getHours() + d.getMinutes() / 60 - HOURS.from) * ROW

  return (
    <div className="overflow-x-auto rounded-(--radius) border bg-card text-card-foreground">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b">
          <span />
          {days.map((d) => (
            <div
              key={+d}
              className={cn("flex items-baseline gap-1.5 border-l px-2 py-2 text-xs text-muted-foreground", isSameDay(d, NOW) && "text-foreground")}
            >
              {format(d, "EEE")}
              <span
                className={cn(
                  "grid size-6 place-items-center rounded-full text-sm tabular-nums",
                  isSameDay(d, NOW) && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {d.getDate()}
              </span>
            </div>
          ))}
        </div>
        <div className="max-h-[640px] overflow-y-auto">
          <div className="relative grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" style={{ height: hours.length * ROW }}>
            <div className="relative">
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[0.65rem] text-muted-foreground tabular-nums"
                  style={{ top: (h - HOURS.from) * ROW }}
                >
                  {h > HOURS.from ? `${String(h).padStart(2, "0")}:00` : ""}
                </span>
              ))}
            </div>
            {days.map((d) => {
              const list = items.filter((i) => isSameDay(i.start, d))
              // Simple lanes so overlapping items sit side by side.
              const lanes: Item[][] = []
              const laneOf = new Map<string, number>()
              for (const i of list) {
                let l = lanes.findIndex((lane) => lane.every((x) => x.end <= i.start || x.start >= i.end))
                if (l < 0) l = lanes.push([]) - 1
                lanes[l].push(i)
                laneOf.set(i.key, l)
              }
              const n = Math.max(1, lanes.length)
              return (
                <div
                  key={+d}
                  className={cn("relative border-l", isSameDay(d, NOW) && "bg-primary/[0.03]", onEmptySlot && "cursor-copy")}
                  onClick={(e) => {
                    if (!onEmptySlot) return
                    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
                    const mins = Math.round(((y / ROW) * 60) / 30) * 30
                    const t = new Date(d)
                    t.setHours(HOURS.from, 0, 0, 0)
                    onEmptySlot(new Date(+t + mins * 60000))
                  }}
                >
                  {hours.map((h) => (
                    <span
                      key={h}
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/60"
                      style={{ top: (h - HOURS.from) * ROW }}
                    />
                  ))}
                  {list.map((i) => {
                    const color = colorOf(i.kind)
                    const h = Math.max(22, ((+i.end - +i.start) / 3600000) * ROW)
                    const lane = laneOf.get(i.key) ?? 0
                    const live = isLiveNow(i)
                    return (
                      <button
                        key={i.key}
                        onClick={(e) => (e.stopPropagation(), onSelect(i))}
                        className="absolute overflow-hidden rounded-[var(--r-chip,6px)] border-l-[3px] px-1.5 py-0.5 text-left text-[0.7rem] leading-tight shadow-xs transition-shadow hover:z-10 hover:shadow-md"
                        style={{
                          top: top(i.start),
                          height: h,
                          left: `calc(${(lane / n) * 100}% + 2px)`,
                          width: `calc(${100 / n}% - 4px)`,
                          borderColor: color,
                          background: `color-mix(in oklab, ${color} 14%, var(--card))`,
                        }}
                      >
                        <span className="flex items-center gap-1 font-medium">
                          {live && <LiveDot />}
                          <span className="truncate">{i.title}</span>
                        </span>
                        {h > 30 && <span className="block text-muted-foreground tabular-nums">{hhmm(i.start)}</span>}
                      </button>
                    )
                  })}
                  {isSameDay(d, NOW) && (
                    <span className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-red-500" style={{ top: top(NOW) }}>
                      <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-red-500" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function List({ items, start, onSelect, colorOf }: { items: Item[]; start: Date; onSelect: (i: Item) => void; colorOf: (k: ItemKind) => string }) {
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i))
  const groups = days.map((d) => ({ d, list: items.filter((i) => isSameDay(i.start, d) && (!isSameDay(d, NOW) || i.end > NOW)) })).filter((g) => g.list.length)
  if (!groups.length) return <p className="py-12 text-center text-sm text-muted-foreground">Nothing in the next two weeks.</p>
  return (
    <div className="grid gap-5">
      {groups.map(({ d, list }) => (
        <div key={+d} className="grid gap-2">
          <span className="eyebrow">{isSameDay(d, NOW) ? "Today" : isSameDay(d, addDays(NOW, 1)) ? "Tomorrow" : format(d, "EEEE d MMMM")}</span>
          <div className="overflow-hidden rounded-(--radius) border bg-card text-card-foreground">
            {list.map((i) => (
              <button
                key={i.key}
                onClick={() => onSelect(i)}
                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/50"
              >
                <span className="w-12 shrink-0 text-sm tabular-nums">{hhmm(i.start)}</span>
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: colorOf(i.kind) }} />
                <span className="grid min-w-0 flex-1">
                  <span className="flex items-center gap-2 truncate text-sm font-medium">
                    {isLiveNow(i) && <LiveDot />}
                    {i.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {i.news
                      ? `${i.news.country} · ${i.news.impact} impact${i.news.forecast ? ` · forecast ${i.news.forecast}` : ""}`
                      : `${Math.round((+i.end - +i.start) / 60000)} min${i.event?.host ? ` · with ${i.event.host}` : ""}${i.booking?.question ? ` · “${i.booking.question}”` : ""}`}
                  </span>
                </span>
                {i.news?.noTrade && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">No trade</span>}
                {isLiveNow(i) && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Live now</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
