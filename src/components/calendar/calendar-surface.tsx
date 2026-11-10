"use client"

import { useContext } from "react"
import { addDays, addMonths, addWeeks, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "@/components/icons"
import { AdminButton } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { ShellEditorContext } from "@/components/shells/student-shell"
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
  eventStyle = "tinted",
  toolbar,
  onEmptySlot,
  leading,
}: {
  items: Item[]
  view: View
  onView: (v: View) => void
  cursor: Date
  onCursor: (d: Date) => void
  /** `el` is the clicked event, for a popover to point at. */
  onSelect: (i: Item, el?: HTMLElement) => void
  colorOf: (k: ItemKind) => string
  /** How event blocks are drawn: tinted (default), solid or outline. */
  eventStyle?: EventStyle
  toolbar?: React.ReactNode
  /** Admin: click an empty time in the week view to create something there. */
  onEmptySlot?: (d: Date) => void
  /** Admin: what sits at the start of the header row (the page tabs), so tabs and view controls share one row as in the Figma toolbar. */
  leading?: React.ReactNode
}) {
  const step = (dir: 1 | -1) => onCursor(view === "month" ? addMonths(cursor, dir) : addWeeks(cursor, dir))
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 })
  // On a phone the week grid is wider than the screen: students get the list instead (the coach, who clicks a time to create, keeps the grid).
  const phoneList = !onEmptySlot
  const admin = !!onEmptySlot
  const listStart = isSameDay(weekStart, startOfWeek(NOW, { weekStartsOn: 1 })) ? NOW : weekStart
  const label =
    view === "month"
      ? format(cursor, "MMMM yyyy")
      : `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), isSameMonth(weekStart, addDays(weekStart, 6)) ? "d MMM yyyy" : "d MMM yyyy")}`

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {admin && (
        <div className="flex flex-wrap items-center gap-2">
          {leading}
          <div className="flex-1" />
          <AdminButton hierarchy="secondary" size="md" onClick={() => onCursor(NOW)}>
            Today
          </AdminButton>
          <AdminButton hierarchy="secondary" size="md" iconOnly aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft />
          </AdminButton>
          <AdminButton hierarchy="secondary" size="md" iconOnly aria-label="Next" onClick={() => step(1)}>
            <ChevronRight />
          </AdminButton>
          <span className="t-body-m-medium px-1 text-a-text">{label}</span>
          <div role="radiogroup" aria-label="View" className="flex items-center gap-1">
            {(["week", "month"] as View[]).map((v) => (
              <AdminButton key={v} role="radio" aria-checked={view === v} hierarchy={view === v ? "secondary" : "ghost"} size="md" className="capitalize" onClick={() => onView(v)}>
                {v}
              </AdminButton>
            ))}
          </div>
        </div>
      )}
      {!admin && (
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn("flex items-center gap-1", admin && "order-2")}>
          {admin ? (
            <Button variant="outline" size="sm" onClick={() => onCursor(NOW)}>
              Today
            </Button>
          ) : null}
          <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => step(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight />
          </Button>
          {!admin && (
            <Button variant="outline" size="sm" onClick={() => onCursor(NOW)}>
              Today
            </Button>
          )}
        </div>
        <span className={cn("min-w-36 font-heading text-lg", admin && "order-3 min-w-0 font-sans text-sm")}>{label}</span>
        <div className={cn("flex flex-wrap items-center gap-2", admin ? "order-4" : "ml-auto")}>
          {!admin && toolbar}
          <div role="radiogroup" aria-label="View" className="flex rounded-lg bg-muted p-0.5">
            {((admin ? ["week", "month", "list"] : ["month", "week", "list"]) as View[]).map((v) => (
              <button
                key={v}
                role="radio"
                aria-checked={view === v}
                onClick={() => onView(v)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm text-muted-foreground capitalize max-lg:min-h-10",
                  phoneList && v === "week" && "max-sm:hidden",
                  view === v && "bg-background font-medium text-foreground shadow-sm",
                  phoneList && v === "list" && view === "week" && "max-sm:bg-background max-sm:font-medium max-sm:text-foreground max-sm:shadow-sm",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {view === "month" && <Month items={items} cursor={cursor} onSelect={onSelect} colorOf={colorOf} eventStyle={eventStyle} onDay={(d) => (onCursor(d), onView("week"))} />}
      {view === "week" && (
        <div className={cn(phoneList && "max-sm:hidden")}>
          <Week items={items} start={weekStart} onSelect={onSelect} colorOf={colorOf} eventStyle={eventStyle} onEmptySlot={onEmptySlot} />
        </div>
      )}
      {view === "week" && phoneList && (
        <div className="sm:hidden">
          <List items={items} start={listStart} onSelect={onSelect} colorOf={colorOf} />
        </div>
      )}
      {view === "list" && <List items={items} start={listStart} onSelect={onSelect} colorOf={colorOf} />}
      {admin && <div className="flex flex-wrap items-center justify-between gap-2">{toolbar}</div>}
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

export type EventStyle = "tinted" | "solid" | "outline"

/**
 * An event's time: secondary text, a step closer to the main text colour. The theme's
 * secondary text reads at 4.5:1 on the card, but a tinted event is a little darker
 * (or lighter) than the card, which took it just under.
 */
const TIME_TEXT = "text-[color-mix(in_oklab,var(--muted-foreground)_70%,var(--foreground))]"

/**
 * Colours of an event block in each style. Solid picks black or white text, whichever
 * the fill needs: below oklch L 0.565 white reads at 4.5:1, above it black does. That
 * uses CSS relative colours (`oklch(from …)`: Chrome 119, Safari 18, Firefox 128);
 * older browsers drop the value, and `solidTextFallback` picks the colour instead.
 */
export function blockStyle(color: string, style: EventStyle): React.CSSProperties {
  if (style === "solid") return { background: color, borderColor: color, color: `oklch(from ${color} clamp(0, calc((0.565 - l) * 1000), 1) 0 0)` }
  if (style === "outline") return { background: "var(--card)", borderColor: color, boxShadow: `inset 0 0 0 1px ${color}` }
  return { background: `color-mix(in oklab, ${color} 14%, var(--card))`, borderColor: color }
}

const RELATIVE_COLOURS = typeof CSS !== "undefined" && CSS.supports("color", "oklch(from red l c h)")

/**
 * For browsers without relative colours (Next.js supports Safari 16.4 and Firefox 111):
 * reads the solid block's real fill and sets black or white text, by the same 4.5:1 rule.
 * Used as the block's ref, so it runs again whenever the block renders.
 */
function solidTextFallback(el: HTMLElement | null) {
  if (!el || RELATIVE_COLOURS) return
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  if (!ctx) return
  ctx.fillStyle = getComputedStyle(el).backgroundColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  // At luminance 0.175 black and white text both read at about 4.5:1 or more.
  el.style.color = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.175 ? "#000" : "#fff"
}

function Chip({ item, color, onSelect, eventStyle = "tinted" }: { item: Item; color: string; onSelect: (i: Item, el?: HTMLElement) => void; eventStyle?: EventStyle }) {
  const live = isLiveNow(item)
  const tinted = eventStyle === "tinted"
  return (
    <button
      ref={eventStyle === "solid" ? (el) => solidTextFallback(el) : undefined}
      onClick={(e) => (e.stopPropagation(), onSelect(item, e.currentTarget))}
      className={cn("flex w-full min-w-0 items-center gap-1.5 rounded-[var(--r-chip,6px)] px-1.5 py-0.5 text-left text-xs", tinted ? "hover:bg-muted" : "border hover:opacity-90")}
      style={tinted ? undefined : blockStyle(color, eventStyle)}
      title={`${hhmm(item.start)} ${item.title}`}
    >
      {live ? <LiveDot /> : tinted && <span className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />}
      <span className={cn("shrink-0 tabular-nums", eventStyle !== "solid" && TIME_TEXT)}>{hhmm(item.start)}</span>
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
  eventStyle,
}: {
  items: Item[]
  cursor: Date
  onSelect: (i: Item, el?: HTMLElement) => void
  eventStyle: EventStyle
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
                  <Chip key={i.key} item={i} color={colorOf(i.kind)} onSelect={onSelect} eventStyle={eventStyle} />
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
  eventStyle,
}: {
  items: Item[]
  start: Date
  onSelect: (i: Item, el?: HTMLElement) => void
  eventStyle: EventStyle
  colorOf: (k: ItemKind) => string
  onEmptySlot?: (d: Date) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const hours = Array.from({ length: HOURS.to - HOURS.from }, (_, i) => HOURS.from + i)
  const top = (d: Date) => (d.getHours() + d.getMinutes() / 60 - HOURS.from) * ROW
  // The Design editor shows the page whole, so the hours aren't a scroll of their own there.
  const editor = !!useContext(ShellEditorContext)

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
        <div className={cn(!editor && "max-h-[640px] overflow-y-auto")}>
          <div className="relative grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" style={{ height: hours.length * ROW }}>
            <div className="relative">
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground tabular-nums"
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
                  {/* The "now" line runs under the events, so it never crosses their text; only its dot sits on top (after the events). */}
                  {isSameDay(d, NOW) && <span className="pointer-events-none absolute inset-x-0 h-0.5 bg-red-500" style={{ top: top(NOW) }} />}
                  {list.map((i) => {
                    const color = colorOf(i.kind)
                    const h = Math.max(22, ((+i.end - +i.start) / 3600000) * ROW)
                    const lane = laneOf.get(i.key) ?? 0
                    const live = isLiveNow(i)
                    return (
                      <button
                        key={i.key}
                        ref={eventStyle === "solid" ? (el) => solidTextFallback(el) : undefined}
                        onClick={(e) => (e.stopPropagation(), onSelect(i, e.currentTarget))}
                        className="absolute overflow-hidden rounded-[var(--r-chip,6px)] border-l-[3px] px-1.5 py-0.5 text-left text-[0.6875rem] leading-tight shadow-xs transition-shadow hover:z-10 hover:shadow-md"
                        style={{
                          top: top(i.start),
                          height: h,
                          left: `calc(${(lane / n) * 100}% + 2px)`,
                          width: `calc(${100 / n}% - 4px)`,
                          ...blockStyle(color, eventStyle),
                        }}
                      >
                        <span className="flex items-center gap-1 font-medium">
                          {live && <LiveDot />}
                          <span className="truncate">{i.title}</span>
                        </span>
                        {h > 30 && <span className={cn("block tabular-nums", eventStyle !== "solid" && TIME_TEXT)}>{hhmm(i.start)}</span>}
                      </button>
                    )
                  })}
                  {isSameDay(d, NOW) && <span className="pointer-events-none absolute -left-1 z-20 size-2.5 -translate-y-1 rounded-full bg-red-500" style={{ top: top(NOW) }} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function List({ items, start, onSelect, colorOf }: { items: Item[]; start: Date; onSelect: (i: Item, el?: HTMLElement) => void; colorOf: (k: ItemKind) => string }) {
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
                onClick={(e) => onSelect(i, e.currentTarget)}
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
