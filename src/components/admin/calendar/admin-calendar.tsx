"use client"

import { useState } from "react"
import { addDays, format } from "date-fns"
import { CalendarClock, Plus, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CalendarSurface, type View } from "@/components/calendar/calendar-surface"
import {
  NOW,
  at,
  freeSlots,
  hhmm,
  itemsBetween,
  saveSchedule,
  stamp,
  toMin,
  useSchedule,
  type CalEvent,
  type EventKind,
  type Impact,
  type Item,
  type ItemKind,
  type NewsItem,
  type Window,
} from "@/lib/data/schedule"
import { cn } from "@/lib/utils"

const COLORS: Record<ItemKind, string> = { live: "#f97316", call: "#0ea5e9", workshop: "#8b5cf6", "one-on-one": "#10b981", news: "#e11d48" }
const RANGE = { from: addDays(NOW, -45), to: addDays(NOW, 75) }
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

/** ADM-19 calendar, with the event editor (ADM-20), 1:1 availability (ADM-21) and economic news notes (ADM-22). */
export function AdminCalendar() {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const [view, setView] = useState<View>("week")
  const [cursor, setCursor] = useState(NOW)
  const [editing, setEditing] = useState<CalEvent | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [open, setOpen] = useState<Item | null>(null)

  const items = itemsBetween(schedule, RANGE.from, RANGE.to, { bookings: "all" })
  const week = items.filter((i) => i.start >= NOW && i.start < addDays(NOW, 7))
  const stats = [
    { label: "Lives this week", value: week.filter((i) => i.kind === "live").length },
    { label: "Workshop sign-ups", value: week.filter((i) => i.kind === "workshop").reduce((n, i) => n + (i.event?.signedUp ?? 0), 0) },
    { label: "1:1 calls booked", value: week.filter((i) => i.kind === "one-on-one").length },
    { label: "No-trade events", value: week.filter((i) => i.news?.noTrade).length },
  ]

  const newEvent = (start: Date) => {
    setIsNew(true)
    setEditing({ id: `e${Date.now()}`, kind: "live", title: "", start: stamp(start), minutes: 60, repeat: "none", tiers: [], signedUp: 0, streamed: true, reminders: ["1h", "10m"], host: coach.coachName })
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Lives, calls, workshops, 1:1s and market news. Students see it in their own time zone.</p>
        </div>
        <Button onClick={() => newEvent(new Date(2026, 9, 13, 15, 30))}>
          <Plus /> New event
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="calendar" className="gap-5">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="availability">1:1 availability</TabsTrigger>
          <TabsTrigger value="news">
            Economic news <span className="text-muted-foreground tabular-nums">{schedule.news.filter((n) => n.noTrade && at(n.start) >= NOW).length} no-trade</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarSurface
            items={items}
            view={view}
            onView={setView}
            cursor={cursor}
            onCursor={setCursor}
            colorOf={(k) => COLORS[k]}
            onEmptySlot={newEvent}
            onSelect={(i) => {
              if (i.event) {
                setIsNew(false)
                setEditing(i.event)
              } else setOpen(i)
            }}
            toolbar={
              <div className="hidden flex-wrap gap-3 text-xs text-muted-foreground xl:flex">
                {(Object.keys(COLORS) as ItemKind[]).map((k) => (
                  <span key={k} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: COLORS[k] }} />
                    {{ live: "Live", call: "Call", workshop: "Workshop", "one-on-one": "1:1", news: "News" }[k]}
                  </span>
                ))}
              </div>
            }
          />
          <p className="mt-2 text-xs text-muted-foreground">Click an empty time in the week view to schedule something there.</p>
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityEditor />
        </TabsContent>

        <TabsContent value="news">
          <NewsNotes onOpen={(n) => setOpen({ key: n.id, kind: "news", title: n.title, start: at(n.start), end: at(n.start), news: n })} />
        </TabsContent>
      </Tabs>

      <EventEditor event={editing} isNew={isNew} onClose={() => setEditing(null)} />
      <DetailSheet item={open} onClose={() => setOpen(null)} />
    </div>
  )
}

// ---------- ADM-20 event editor

const KIND_OPTIONS: { value: EventKind; label: string; note: string }[] = [
  { value: "live", label: "Live session", note: "Streamed here, saved as a lesson" },
  { value: "call", label: "Group call", note: "Q&A or review on video" },
  { value: "workshop", label: "Workshop", note: "Limited seats, can be paid" },
]
const REMINDERS = [
  ["1d", "1 day before"],
  ["1h", "1 hour before"],
  ["10m", "10 minutes before"],
] as const

function EventEditor({ event, isNew, onClose }: { event: CalEvent | null; isNew: boolean; onClose: () => void }) {
  const { coach } = useCoach()
  const [draft, setDraft] = useState<CalEvent | null>(event)
  const [last, setLast] = useState(event)
  if (event !== last) {
    setLast(event)
    setDraft(event)
  }
  const e = draft
  const set = (patch: Partial<CalEvent>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const save = () => {
    if (!e || !e.title.trim()) return
    saveSchedule(coach, (s) => ({ ...s, events: isNew ? [...s.events, e] : s.events.map((x) => (x.id === e.id ? e : x)) }))
    toast.success(isNew ? "Scheduled. Students with access see it now." : "Saved. Signed-up students are told about the change.")
    onClose()
  }
  const remove = () => {
    if (!e) return
    saveSchedule(coach, (s) => ({ ...s, events: s.events.filter((x) => x.id !== e.id) }))
    toast(`${e.title} cancelled. Signed-up students get an e-mail.`)
    onClose()
  }

  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>{isNew ? "New event" : "Edit event"}</SheetTitle>
          <SheetDescription>{e?.repeat === "weekly" && !isNew ? "Changes apply to every week of this series." : "Students are reminded automatically."}</SheetDescription>
        </SheetHeader>
        {e && (
          <div className="grid gap-5 overflow-y-auto p-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    onClick={() => set({ kind: k.value, streamed: k.value !== "call", seats: k.value === "workshop" ? e.seats ?? 20 : e.seats })}
                    className={cn("grid gap-0.5 rounded-lg border p-2.5 text-left", e.kind === k.value && "border-primary ring-1 ring-primary")}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="size-2 rounded-full" style={{ background: COLORS[k.value] }} /> {k.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{k.note}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-title">Title</Label>
              <Input id="ev-title" autoFocus={isNew} value={e.title} onChange={(x) => set({ title: x.target.value })} placeholder="e.g. Live trading · NY open" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ev-date">Date</Label>
                <Input id="ev-date" type="date" value={e.start.slice(0, 10)} onChange={(x) => set({ start: `${x.target.value}T${e.start.slice(11)}` })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ev-time">Starts</Label>
                <Input id="ev-time" type="time" value={e.start.slice(11)} onChange={(x) => set({ start: `${e.start.slice(0, 10)}T${x.target.value}` })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ev-len">Length</Label>
                <select id="ev-len" value={e.minutes} onChange={(x) => set({ minutes: Number(x.target.value) })} className="h-9 rounded-lg border bg-background px-2 text-sm">
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Repeat every {format(at(e.start), "EEEE")}</span>
              <Switch checked={e.repeat === "weekly"} onCheckedChange={(v) => set({ repeat: v ? "weekly" : "none" })} />
            </label>

            <div className="grid gap-2">
              <Label>Who can join</Label>
              <div className="flex flex-wrap gap-2">
                <TierChip on={e.tiers.length === 0} onClick={() => set({ tiers: [] })}>
                  Every tier
                </TierChip>
                {coach.tiers.map((t) => (
                  <TierChip key={t.id} on={e.tiers.includes(t.id)} onClick={() => set({ tiers: e.tiers.includes(t.id) ? e.tiers.filter((x) => x !== t.id) : [...e.tiers, t.id] })}>
                    {t.name}
                  </TierChip>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-lg border p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="grid">
                  <span className="font-medium">Live in the platform</span>
                  <span className="text-xs text-muted-foreground">Go live from here; the recording becomes a lesson.</span>
                </span>
                <Switch checked={e.streamed} onCheckedChange={(v) => set({ streamed: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Limit seats</span>
                <span className="flex items-center gap-2">
                  {e.seats !== undefined && <Input type="number" min={1} value={e.seats} onChange={(x) => set({ seats: Number(x.target.value) })} className="h-8 w-20" />}
                  <Switch checked={e.seats !== undefined} onCheckedChange={(v) => set({ seats: v ? 20 : undefined })} />
                </span>
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Paid</span>
                <span className="flex items-center gap-2">
                  {e.price !== undefined && <Input value={e.price} onChange={(x) => set({ price: x.target.value })} className="h-8 w-24" />}
                  <Switch checked={e.price !== undefined} onCheckedChange={(v) => set({ price: v ? "€49" : undefined })} />
                </span>
              </label>
            </div>

            <div className="grid gap-2">
              <Label>Reminders</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                {REMINDERS.map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2">
                    <Checkbox checked={e.reminders.includes(k)} onCheckedChange={(v) => set({ reminders: v ? [...e.reminders, k] : e.reminders.filter((x) => x !== k) })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ev-desc">Description</Label>
              <Textarea id="ev-desc" value={e.description ?? ""} onChange={(x) => set({ description: x.target.value })} placeholder="What students can expect." />
            </div>
            {!isNew && (
              <p className="text-xs text-muted-foreground">
                {e.signedUp} signed up{e.seats ? ` of ${e.seats} seats` : ""}.
              </p>
            )}
          </div>
        )}
        <SheetFooter className="border-t sm:flex-row sm:justify-between">
          {!isNew ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>
              <Trash2 /> Cancel event
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={save} disabled={!e?.title.trim()}>
            {isNew ? "Schedule" : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function TierChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-3 py-1 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  )
}

// ---------- 1:1 booking and news details

function DetailSheet({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const [last, setLast] = useState(item)
  if (item && item !== last) setLast(item)
  const i = item ?? last
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        {i?.booking && <BookingDetail item={i} onClose={onClose} />}
        {i?.news && <NewsEditor news={i.news} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}

function BookingDetail({ item, onClose }: { item: Item; onClose: () => void }) {
  const { coach } = useCoach()
  const b = item.booking!
  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{b.initials}</AvatarFallback>
          </Avatar>
          <div className="grid">
            <SheetTitle>1:1 with {b.student}</SheetTitle>
            <SheetDescription>
              {format(item.start, "EEEE d MMMM")} · {hhmm(item.start)}–{hhmm(item.end)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <div className="grid gap-4 p-4 text-sm">
        {b.question && (
          <div className="grid gap-1 rounded-lg bg-muted p-3">
            <span className="text-xs text-muted-foreground">Their question</span>
            <p>{b.question}</p>
          </div>
        )}
        <div className="grid gap-2 rounded-lg border p-3">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4" /> Briefing
            <Badge variant="secondary">AI</Badge>
          </span>
          <p className="text-muted-foreground">
            19 trades since your last call, 58% win rate. Broke “stop never moved further away” 6 times, mostly after 12:00. Stuck on Module 2 for 12 days.
          </p>
        </div>
      </div>
      <SheetFooter className="border-t">
        <Button onClick={() => toast("The video call would open here.")}>Start call</Button>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => {
            saveSchedule(coach, (s) => ({ ...s, bookings: s.bookings.filter((x) => x.id !== b.id) }))
            toast(`Call cancelled. ${b.student} gets an e-mail with a link to rebook.`)
            onClose()
          }}
        >
          Cancel call
        </Button>
      </SheetFooter>
    </>
  )
}

/** ADM-22: mark no-trade events and add a comment students see. */
function NewsEditor({ news, onClose }: { news: NewsItem; onClose: () => void }) {
  const { coach } = useCoach()
  const [noTrade, setNoTrade] = useState(news.noTrade)
  const [comment, setComment] = useState(news.comment ?? "")
  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{news.title}</SheetTitle>
        <SheetDescription>
          {news.country} · {format(at(news.start), "EEEE d MMMM, HH:mm")} · {news.impact} impact
        </SheetDescription>
      </SheetHeader>
      <div className="grid gap-5 p-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          {[
            ["Forecast", news.forecast],
            ["Previous", news.previous],
            ["Actual", news.actual],
          ].map(([l, v]) => (
            <div key={l} className="grid gap-0.5 rounded-lg bg-muted p-2.5">
              <span className="text-xs text-muted-foreground">{l}</span>
              <span className="font-medium tabular-nums">{v ?? "–"}</span>
            </div>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span className="grid">
            <span className="font-medium">No-trade event</span>
            <span className="text-xs text-muted-foreground">Marked in red for students; the journal checks the rule.</span>
          </span>
          <Switch checked={noTrade} onCheckedChange={setNoTrade} />
        </label>
        <div className="grid gap-2">
          <Label htmlFor="news-comment">Your note for students</Label>
          <Textarea id="news-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. No new positions from 14:20. Let the first move settle." className="min-h-24" />
        </div>
      </div>
      <SheetFooter className="border-t">
        <Button
          onClick={() => {
            saveSchedule(coach, (s) => ({ ...s, news: s.news.map((n) => (n.id === news.id ? { ...n, noTrade, comment: comment.trim() || undefined } : n)) }))
            toast.success("Saved. Students see your note on the event.")
            onClose()
          }}
        >
          Save
        </Button>
      </SheetFooter>
    </>
  )
}

function NewsNotes({ onOpen }: { onOpen: (n: NewsItem) => void }) {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const [impact, setImpact] = useState<Impact | "all">("all")
  const rows = schedule.news.filter((n) => at(n.start) >= addDays(NOW, -1) && (impact === "all" || n.impact === impact)).sort((a, b) => +at(a.start) - +at(b.start))
  const toggle = (n: NewsItem, v: boolean) => saveSchedule(coach, (s) => ({ ...s, news: s.news.map((x) => (x.id === n.id ? { ...x, noTrade: v } : x)) }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Economic news</CardTitle>
        <CardDescription>From our news feed, in your time zone. Mark the ones your students shouldn&apos;t trade, and add a note.</CardDescription>
        <div className="flex gap-1 pt-2">
          {(["all", "high", "medium", "low"] as const).map((v) => (
            <Button key={v} size="xs" variant={impact === v ? "secondary" : "ghost"} onClick={() => setImpact(v)} className="capitalize">
              {v === "all" ? "All" : `${v} impact`}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead className="hidden md:table-cell">Forecast</TableHead>
              <TableHead>Your note</TableHead>
              <TableHead className="text-right">No trade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((n) => (
              <TableRow key={n.id} className="cursor-pointer" onClick={() => onOpen(n)}>
                <TableCell className="whitespace-nowrap tabular-nums">{format(at(n.start), "EEE d MMM, HH:mm")}</TableCell>
                <TableCell>
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-xs">{n.country}</span>
                  {n.title}
                </TableCell>
                <TableCell>
                  <span className="flex gap-0.5" title={`${n.impact} impact`}>
                    {[1, 2, 3].map((d) => (
                      <i key={d} className={cn("size-1.5 rounded-full", d <= { high: 3, medium: 2, low: 1 }[n.impact] ? "bg-rose-500" : "bg-muted")} />
                    ))}
                  </span>
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{n.forecast ?? "–"}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{n.comment ?? <span className="text-xs">Add a note</span>}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Switch checked={n.noTrade} onCheckedChange={(v) => toggle(n, v)} aria-label={`No trade around ${n.title}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ---------- ADM-21 availability

function AvailabilityEditor() {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const a = schedule.availability
  const set = (patch: Partial<typeof a>) => saveSchedule(coach, (s) => ({ ...s, availability: { ...s.availability, ...patch } }))
  const setDay = (d: number, windows: Window[]) => set({ week: { ...a.week, [d]: windows } })
  const next = freeSlots(schedule, 14).filter((d) => d.times.length).slice(0, 4)

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Weekly free time</CardTitle>
          <CardDescription>Students book 1:1 calls inside these windows. Lives and other events block their time automatically.</CardDescription>
        </CardHeader>
        <CardContent className="grid divide-y">
          {DAYS.map((name, i) => {
            const d = i + 1
            const windows = a.week[d] ?? []
            return (
              <div key={d} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
                <label className="flex w-36 items-center gap-3 pt-1.5 text-sm">
                  <Switch checked={windows.length > 0} onCheckedChange={(v) => setDay(d, v ? [{ from: "10:00", to: "12:00" }] : [])} />
                  {name}
                </label>
                <div className="grid flex-1 gap-2">
                  {windows.length === 0 && <span className="pt-1.5 text-sm text-muted-foreground">Not available</span>}
                  {windows.map((w, wi) => (
                    <div key={wi} className="flex items-center gap-2">
                      <Input type="time" value={w.from} onChange={(e) => setDay(d, windows.map((x, j) => (j === wi ? { ...x, from: e.target.value } : x)))} className="h-8 w-28" />
                      <span className="text-muted-foreground">–</span>
                      <Input type="time" value={w.to} onChange={(e) => setDay(d, windows.map((x, j) => (j === wi ? { ...x, to: e.target.value } : x)))} className="h-8 w-28" />
                      <span className="text-xs text-muted-foreground">
                        {Math.max(0, Math.floor((toMin(w.to) - toMin(w.from) + a.buffer) / (a.length + a.buffer)))} calls
                      </span>
                      <Button variant="ghost" size="icon-xs" aria-label="Remove window" onClick={() => setDay(d, windows.filter((_, j) => j !== wi))}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {windows.length > 0 && (
                    <Button variant="ghost" size="xs" className="w-fit" onClick={() => setDay(d, [...windows, { from: "15:00", to: "17:00" }])}>
                      <Plus /> Add a window
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <SettingSelect label="Call length" value={a.length} options={[15, 20, 30, 45, 60]} suffix="min" onChange={(v) => set({ length: v })} />
            <SettingSelect label="Break between calls" value={a.buffer} options={[0, 5, 10, 15, 30]} suffix="min" onChange={(v) => set({ buffer: v })} />
            <SettingSelect label="Book at least" value={a.noticeHours} options={[2, 6, 12, 24, 48]} suffix="h ahead" onChange={(v) => set({ noticeHours: v })} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Calls per month</CardTitle>
            <CardDescription>By tier. 0 means the tier can&apos;t book.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {coach.tiers.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{t.name}</span>
                <Input
                  type="number"
                  min={0}
                  value={a.perMonth[t.id] ?? 0}
                  onChange={(e) => set({ perMonth: { ...a.perMonth, [t.id]: Math.max(0, Number(e.target.value)) } })}
                  className="h-8 w-20 text-right"
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" /> What students see
            </CardTitle>
            <CardDescription>The next free times, after bookings and events.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {next.length === 0 && <p className="text-sm text-muted-foreground">No free times in the next two weeks.</p>}
            {next.map((d) => (
              <div key={+d.day} className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">{format(d.day, "EEEE d MMM")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {d.times.map((t) => (
                    <span key={+t} className="rounded-md border px-2 py-0.5 text-xs tabular-nums">
                      {hhmm(t)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingSelect({ label, value, options, suffix, onChange }: { label: string; value: number; options: number[]; suffix: string; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-8 rounded-lg border bg-background px-2 text-sm">
        {options.map((o) => (
          <option key={o} value={o}>
            {o} {suffix}
          </option>
        ))}
      </select>
    </label>
  )
}
