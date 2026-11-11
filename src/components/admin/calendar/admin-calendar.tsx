"use client"

import { useState } from "react"
import { addDays, addMinutes, format, startOfWeek } from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight, Info, Plus, Settings, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { STUDENTS, tierFor } from "@/lib/data/people"
import {
  NOW,
  at,
  freeSlots,
  hhmm,
  isSampleBooking,
  isSampleEvent,
  itemsBetween,
  saveSchedule,
  stamp,
  toMin,
  useSchedule,
  type Booking,
  type CalEvent,
  type EventKind,
  type Item,
  type NewsItem,
  type Window,
} from "@/lib/data/schedule"
import { cn } from "@/lib/utils"
import { PageHeader } from "../kit"
import { SampleNotice, SetupTip, useWizardCommunity } from "../setup-checklist"
import { AdminButton, AdminDrawer, AdminField, AdminFilter, AdminModal, AdminSegmented, AdminTable, AdminTableFooter, AdminTableHead, AdminTabs, AdminTd, AdminTh, AdminToolbar, AdminTr, Callout, EmptyState, OptionCard, Panel, StepIndicator, Tag, adminControl } from "../ui"
import { AdminMonth, AdminWeek, KIND_DOT } from "./calendar-views"

const RANGE = { from: addDays(NOW, -45), to: addDays(NOW, 75) }
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TABS = [
  { id: "calendar", label: "Calendar" },
  { id: "availability", label: "Availability" },
  { id: "news", label: "News" },
] as const
type Tab = (typeof TABS)[number]["id"]
type View = "week" | "month"
const range = (a: Date) => `${format(a, "d")} – ${format(addDays(a, 6), "d MMM yyyy")}`

/** Calendar (Figma 532:7850, 01 to 05): the week, the event form, 1:1 availability, economic news and a call's details. */
export function AdminCalendar() {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const [tab, setTab] = useState<Tab>("calendar")
  const [impact, setImpact] = useState("all")
  const [period, setPeriod] = useState("week")
  const [view, setView] = useState<View>("week")
  const [cursor, setCursor] = useState(NOW)
  const [editing, setEditing] = useState<CalEvent | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [open, setOpen] = useState<Item | null>(null)

  // A community made in setup starts on the sample events; they read "Sample ·" until replaced.
  const wizard = useWizardCommunity(coach.slug)
  const sample = (e?: CalEvent) => !!wizard && !!e && isSampleEvent(coach, e.id)
  const sampleBooking = (b?: Booking) => !!wizard && !!b && isSampleBooking(coach, b.id)
  const items = itemsBetween(schedule, RANGE.from, RANGE.to, { bookings: "all" }).map((i) => (sample(i.event) || sampleBooking(i.booking) ? { ...i, title: `Sample · ${i.title}` } : i))
  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 })
  const inWeek = items.filter((i) => i.kind !== "news" && i.start >= weekStart && i.start < addDays(weekStart, 7)).length
  const step = (dir: 1 | -1) => setCursor((c) => (view === "month" ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, dir * 7)))

  const newEvent = (start: Date) => {
    setIsNew(true)
    setEditing({ id: `e${Date.now()}`, kind: "live", title: "", start: stamp(start), minutes: 90, repeat: "none", tiers: [], signedUp: 0, streamed: true, reminders: ["1d", "1h"], host: coach.coachName })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      <PageHeader
        title="Calendar"
        text={`Lives, calls and news · ${inWeek} ${inWeek === 1 ? "event" : "events"} this week`}
        actions={
          <>
            {tab !== "availability" && (
              <AdminButton onClick={() => setTab("availability")} hierarchy="secondary">
                <Settings /> Call settings
              </AdminButton>
            )}
            <AdminButton onClick={() => newEvent(new Date(2026, 9, 13, 15, 30))}>
              <Plus /> New event
            </AdminButton>
          </>
        }
      />
      <SetupTip task="live" />
      <SampleNotice show={schedule.events.some((e) => sample(e))}>
        Events and 1:1 bookings marked Sample are examples, so you can see how your calendar looks. Replace or delete them before you invite students.
      </SampleNotice>

      <AdminToolbar className="min-h-9">
        <AdminTabs label="Calendar" value={tab} onChange={setTab} tabs={TABS} />
        <div className="flex-1" />
        {tab === "calendar" && (
          <>
            <AdminButton hierarchy="secondary" size="md" onClick={() => setCursor(NOW)}>Today</AdminButton>
            <AdminButton hierarchy="secondary" size="md" iconOnly aria-label="Previous" onClick={() => step(-1)}><ChevronLeft /></AdminButton>
            <AdminButton hierarchy="secondary" size="md" iconOnly aria-label="Next" onClick={() => step(1)}><ChevronRight /></AdminButton>
            <span aria-live="polite" className="px-1 t-body-m-medium text-a-text tabular-nums">{view === "month" ? format(cursor, "MMMM yyyy") : range(weekStart)}</span>
            <AdminSegmented label="View" value={view} onChange={setView} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} className="w-[132px] gap-1.5" />
          </>
        )}
        {tab === "news" && (
          <>
            <AdminFilter label="Impact" value={impact} onValueChange={setImpact} options={[{ value: "all", label: "All" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
            <AdminFilter ariaLabel="Period" value={period} onValueChange={setPeriod} options={[{ value: "week", label: "This week" }, { value: "next", label: "Next week" }, { value: "all", label: "All upcoming" }]} />
          </>
        )}
      </AdminToolbar>

      {tab === "calendar" && (
        <>
          {view === "week" ? (
            <AdminWeek items={items} start={weekStart} onEmptySlot={newEvent} onSelect={(i) => select(i)} />
          ) : (
            <AdminMonth items={items} cursor={cursor} onSelect={(i) => select(i)} onDay={(d) => (setCursor(d), setView("week"))} />
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 t-caption text-a-text-2">
            {(["live", "call", "one-on-one", "news"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-1.5 rounded-full", KIND_DOT[k])} />
                {k === "call" ? "Group call / Workshop" : k === "news" ? "No-trade news" : k === "one-on-one" ? "1:1 call" : "Live session"}
              </span>
            ))}
            <span aria-hidden className="h-px min-w-px flex-1" />
            <span>Click an empty time to schedule something there.</span>
          </div>
        </>
      )}
      {tab === "availability" && <AvailabilityTab />}
      {tab === "news" && <NewsTab impact={impact} period={period} onOpen={(n) => setOpen({ key: n.id, kind: "news", title: n.title, start: at(n.start), end: addMinutes(at(n.start), 15), news: n })} />}

      <EventModal event={editing} isNew={isNew} onClose={() => setEditing(null)} />
      <CallDrawer item={open?.booking ? open : null} onClose={() => setOpen(null)} />
      <NewsDrawer item={open?.news ? open : null} onClose={() => setOpen(null)} />
    </div>
  )

  function select(i: Item) {
    if (i.event) {
      setIsNew(false)
      setEditing(i.event)
    } else setOpen(i)
  }
}

/* ---------- 02 New event ---------- */

const KIND_OPTIONS: { value: EventKind; label: string; note: string }[] = [
  { value: "live", label: "Live session", note: "Streamed here, saved as a lesson" },
  { value: "call", label: "Group call", note: "Q&A or review on video" },
  { value: "workshop", label: "Workshop", note: "Limited seats, can be paid" },
]
const LENGTHS = [30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h` }))

function EventModal({ event, isNew, onClose }: { event: CalEvent | null; isNew: boolean; onClose: () => void }) {
  const { coach } = useCoach()
  const [draft, setDraft] = useState<CalEvent | null>(event)
  const [last, setLast] = useState(event)
  const [more, setMore] = useState(false)
  if (event !== last) {
    setLast(event)
    setDraft(event)
    setMore(false)
  }
  const e = draft
  const set = (patch: Partial<CalEvent>) => setDraft((d) => (d ? { ...d, ...patch } : d))

  const save = () => {
    if (!e || !e.title.trim()) return
    saveSchedule(coach, (s) => ({ ...s, events: isNew ? [...s.events, { ...e, title: e.title.trim() }] : s.events.map((x) => (x.id === e.id ? { ...e, title: e.title.trim() } : x)) }))
    toast.success(isNew ? "Scheduled. Students with access see it now." : "Saved. Signed-up students are told about the change.")
    onClose()
  }
  const remove = () => {
    if (!e) return
    saveSchedule(coach, (s) => ({ ...s, events: s.events.filter((x) => x.id !== e.id) }))
    toast(`${e.title} cancelled. Signed-up students get an e-mail.`)
    onClose()
  }
  const lengths = e && !LENGTHS.some((l) => l.value === String(e.minutes)) ? [...LENGTHS, { value: String(e.minutes), label: `${e.minutes} min` }] : LENGTHS

  return (
    <AdminModal
      open={!!event}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? "New event" : "Edit event"}
      subtitle={e?.repeat === "weekly" && !isNew ? "Changes apply to every week of this series." : "Students with access see it right away."}
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          {isNew ? <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton> : <AdminButton hierarchy="danger" onClick={remove}><Trash2 /> Cancel event</AdminButton>}
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton onClick={save} disabled={!e?.title.trim()}>{isNew ? "Schedule" : "Save changes"}</AdminButton>
        </div>
      }>
      {e && (
        <>
          <div role="radiogroup" aria-label="Type" className="grid gap-2">
            {KIND_OPTIONS.map((k) => (
              <OptionCard key={k.value} checked={e.kind === k.value} title={k.label} description={k.note} onSelect={() => set({ kind: k.value, streamed: k.value !== "call", seats: k.value === "workshop" ? (e.seats ?? 20) : e.seats })} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <AdminField label="Title">
              <input autoFocus={isNew} value={e.title} onChange={(x) => set({ title: x.target.value })} placeholder="NY open, live trading" className={cn(adminControl, "h-11")} />
            </AdminField>
            <div className="grid gap-1.5">
              <span className="t-caption text-a-text">Who can join</span>
              <AdminSegmented label="Who can join" value={e.tiers.length ? "tiers" : "all"} onChange={(v) => set({ tiers: v === "all" ? [] : coach.tiers.slice(1).map((t) => t.id) })} options={[{ value: "all", label: "Everyone" }, { value: "tiers", label: "Pick tiers" }]} />
              {e.tiers.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                  {coach.tiers.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 t-body-m text-a-text">
                      <Checkbox checked={e.tiers.includes(t.id)} onCheckedChange={(v) => set({ tiers: v ? [...e.tiers, t.id] : e.tiers.filter((x) => x !== t.id) })} />
                      {t.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Starts">
                <input type="datetime-local" value={e.start} onChange={(x) => x.target.value && set({ start: x.target.value })} className={cn(adminControl, "h-11 scheme-dark")} />
              </AdminField>
              <div className="grid gap-1.5">
                <span className="t-caption text-a-text">Length</span>
                <AdminFilter ariaLabel="Length" value={String(e.minutes)} onValueChange={(v) => set({ minutes: Number(v) })} options={lengths} className="h-11! w-full justify-between" />
              </div>
            </div>
          </div>
          <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
          <label className="flex items-center justify-between gap-6">
            <span className="grid gap-0.5">
              <span className="t-body-m text-a-text">Reminders</span>
              <span className="t-caption text-a-text-2">{e.reminders.length ? "1 day and 1 hour before" : "No reminders"}</span>
            </span>
            <Switch checked={e.reminders.length > 0} onCheckedChange={(v) => set({ reminders: v ? ["1d", "1h"] : [] })} />
          </label>
          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)} className="-mt-2 flex w-fit items-center gap-1 rounded-a-xs t-body-m text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
            <ChevronDown className={cn("size-3.5 transition-transform duration-200", more && "rotate-180")} /> More options
          </button>
          {more && (
            <div className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
              <label className="flex items-center justify-between gap-6 t-body-m text-a-text">
                Repeat every {format(at(e.start), "EEEE")}
                <Switch checked={e.repeat === "weekly"} onCheckedChange={(v) => set({ repeat: v ? "weekly" : "none" })} />
              </label>
              <label className="flex items-center justify-between gap-6">
                <span className="grid gap-0.5">
                  <span className="t-body-m text-a-text">Live in the platform</span>
                  <span className="t-caption text-a-text-2">Go live from here; the recording becomes a lesson.</span>
                </span>
                <Switch checked={e.streamed} onCheckedChange={(v) => set({ streamed: v })} />
              </label>
              <div className="flex items-center justify-between gap-6 t-body-m text-a-text">
                <label htmlFor="ev-seats">Limit seats</label>
                <span className="flex items-center gap-2">
                  {e.seats !== undefined && <input id="ev-seats" type="number" min={1} value={e.seats} onChange={(x) => set({ seats: Number(x.target.value) })} className={cn(adminControl, "h-8 w-20 px-2")} />}
                  <Switch aria-label="Limit seats" checked={e.seats !== undefined} onCheckedChange={(v) => set({ seats: v ? 20 : undefined })} />
                </span>
              </div>
              <div className="flex items-center justify-between gap-6 t-body-m text-a-text">
                <label htmlFor="ev-price">Paid</label>
                <span className="flex items-center gap-2">
                  {e.price !== undefined && <input id="ev-price" value={e.price} onChange={(x) => set({ price: x.target.value })} className={cn(adminControl, "h-8 w-24 px-2")} />}
                  <Switch aria-label="Paid" checked={e.price !== undefined} onCheckedChange={(v) => set({ price: v ? "€49" : undefined })} />
                </span>
              </div>
              <AdminField label="Description" optional>
                <textarea value={e.description ?? ""} onChange={(x) => set({ description: x.target.value })} placeholder="What students can expect." className={cn(adminControl, "block h-20 resize-none py-2.5")} />
              </AdminField>
              {!isNew && <p className="t-caption text-a-text-2">{e.signedUp} signed up{e.seats ? ` of ${e.seats} seats` : ""}.</p>}
            </div>
          )}
        </>
      )}
    </AdminModal>
  )
}

/* ---------- 03 Availability ---------- */

function AvailabilityTab() {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const a = schedule.availability
  const [openDay, setOpenDay] = useState<number | null>(null)
  const set = (patch: Partial<typeof a>) => saveSchedule(coach, (s) => ({ ...s, availability: { ...s.availability, ...patch } }))
  const setDay = (d: number, windows: Window[]) => set({ week: { ...a.week, [d]: windows } })
  const free = freeSlots(schedule, 14).filter((d) => d.times.length).slice(0, 2)
  const lengthOptions = [15, 30, 45, 60].includes(a.length) ? [15, 30, 45, 60] : [...[15, 30, 45, 60], a.length].sort((x, y) => x - y)
  const breakOptions = [0, 10, 15].includes(a.buffer) ? [0, 10, 15] : [...[0, 10, 15], a.buffer].sort((x, y) => x - y)

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,804fr)_minmax(0,380fr)]">
      <Panel className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h2 className="t-heading-s text-a-text">Weekly hours</h2>
          <span className="t-caption text-a-text-3">Europe/Lisbon</span>
        </div>
        {DAYS.map((name, i) => {
          const d = i + 1
          const windows = a.week[d] ?? []
          const on = windows.length > 0
          const expanded = openDay === d && on
          return (
            <div key={d} className="border-t border-a-border">
              <div className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-1 px-5", on ? "min-h-[52px] py-2" : "min-h-[42px] py-2")}>
                <Switch aria-label={`${name} available`} checked={on} onCheckedChange={(v) => (setDay(d, v ? [{ from: "09:00", to: "12:00" }] : []), setOpenDay(null))} />
                <span className="w-24 shrink-0 t-body-m text-a-text">{name}</span>
                {on ? (
                  <button type="button" aria-expanded={expanded} aria-label={`Edit ${name} hours`} onClick={() => setOpenDay(expanded ? null : d)} className="min-w-0 rounded-a-xs t-body-m text-a-text outline-none hover:text-a-text-accent focus-visible:ring-2 focus-visible:ring-a-border-focus">
                    {windows.map((w) => `${w.from} – ${w.to}`).join(" · ")}
                  </button>
                ) : (
                  <span className="t-body-m text-a-text-3">Not available</span>
                )}
                <span aria-hidden className="h-px min-w-px flex-1" />
                {on && (
                  <AdminButton hierarchy="ghost" size="md" onClick={() => (setDay(d, [...windows, { from: "15:00", to: "17:00" }]), setOpenDay(d))}>
                    <Plus /> Window
                  </AdminButton>
                )}
              </div>
              {expanded && (
                <div className="grid gap-2 px-5 pb-3.5 pl-[86px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
                  {windows.map((w, wi) => {
                    const bad = toMin(w.to) <= toMin(w.from)
                    return (
                      <div key={wi} className="flex flex-wrap items-center gap-2">
                        <input type="time" aria-label={`${name} window ${wi + 1} from`} value={w.from} onChange={(x) => setDay(d, windows.map((y, j) => (j === wi ? { ...y, from: x.target.value } : y)))} className={cn(adminControl, "h-8 w-36 scheme-dark")} />
                        <span aria-hidden className="text-a-text-3">–</span>
                        <input type="time" aria-label={`${name} window ${wi + 1} to`} aria-invalid={bad || undefined} value={w.to} onChange={(x) => setDay(d, windows.map((y, j) => (j === wi ? { ...y, to: x.target.value } : y)))} className={cn(adminControl, "h-8 w-36 scheme-dark")} />
                        <span className="t-caption text-a-text-2">{bad ? "Ends before it starts" : `${Math.max(0, Math.floor((toMin(w.to) - toMin(w.from) + a.buffer) / (a.length + a.buffer)))} calls`}</span>
                        <AdminButton aria-label={`Remove ${name} window ${wi + 1}`} onClick={() => (setDay(d, windows.filter((_, j) => j !== wi)), windows.length === 1 && setOpenDay(null))} hierarchy="ghost" size="md" iconOnly><Trash2 /></AdminButton>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </Panel>

      <Panel className="gap-4">
        <h2 className="t-heading-s text-a-text">Call settings</h2>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Call length</span>
          <AdminSegmented label="Call length" value={String(a.length)} onChange={(v) => set({ length: Number(v) })} options={lengthOptions.map((m) => ({ value: String(m), label: `${m} min` }))} className="gap-1.5" />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Break between calls</span>
          <AdminSegmented label="Break between calls" value={String(a.buffer)} onChange={(v) => set({ buffer: Number(v) })} options={breakOptions.map((m) => ({ value: String(m), label: m === 0 ? "None" : `${m} min` }))} className="gap-1.5" />
        </div>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Book at least</span>
          <AdminFilter ariaLabel="Book at least" value={String(a.noticeHours)} onValueChange={(v) => set({ noticeHours: Number(v) })} options={[...new Set([1, 2, 6, 12, 24, 48, a.noticeHours])].sort((x, y) => x - y).map((h) => ({ value: String(h), label: `${h} h ahead` }))} className="h-9! w-full justify-between" />
        </div>
        <div className="grid gap-2">
          <span className="t-caption text-a-text">Calls per month</span>
          {coach.tiers.map((t) => (
            <label key={t.id} className="flex items-center justify-between gap-3 t-body-m text-a-text">
              {t.name}
              <input type="number" min={0} aria-label={`Calls per month for ${t.name}`} value={a.perMonth[t.id] ?? 0} onChange={(x) => set({ perMonth: { ...a.perMonth, [t.id]: Math.max(0, Number(x.target.value)) } })} className={cn(adminControl, "h-8 w-16 px-2 text-center")} />
            </label>
          ))}
          <p className="t-caption text-a-text-3">By tier. 0 means the tier can&apos;t book.</p>
        </div>
      </Panel>
      <div className="lg:col-span-2">
        <Callout tone="neutral" icon={<Info className="size-4" />} className="rounded-a-md py-2 t-caption">
          {free.length === 0 ? "No free times in the next two weeks." : `Next free times: ${free.map((d) => `${format(d.day, "EEE d MMM")} ${d.times.slice(0, 3).map(hhmm).join(", ")}`).join(" · ")}`}
        </Callout>
      </div>
    </div>
  )
}

/* ---------- 04 News ---------- */

const CCY = { US: "USD", EU: "EUR", UK: "GBP", DE: "EUR", JP: "JPY" } as const
const IMPACT_TONE = { high: "danger", medium: "warning", low: "neutral" } as const

function NewsTab({ onOpen, impact, period }: { onOpen: (n: NewsItem) => void; impact: string; period: string }) {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const wk = startOfWeek(NOW, { weekStartsOn: 1 })
  const rows = schedule.news
    .filter((n) => (impact === "all" || n.impact === impact) && (period === "all" ? at(n.start) >= addDays(NOW, -1) : period === "next" ? at(n.start) >= addDays(wk, 7) && at(n.start) < addDays(wk, 14) : at(n.start) >= wk && at(n.start) < addDays(wk, 7)))
    .sort((a, b) => +at(a.start) - +at(b.start))
  const toggle = (n: NewsItem, v: boolean) => saveSchedule(coach, (s) => ({ ...s, news: s.news.map((x) => (x.id === n.id ? { ...x, noTrade: v } : x)) }))
  if (rows.length === 0) return <EmptyState title="No news in this range" description="Change the impact or the period to see more." />
  return (
    <AdminTable minWidth={860} footer={<AdminTableFooter>No-trade events are marked in red for students; the journal checks the rule.</AdminTableFooter>}>
      <AdminTableHead>
        <AdminTh width={176}>When</AdminTh>
        <AdminTh width={86} />
        <AdminTh>Event</AdminTh>
        <AdminTh width={116} align="end">Forecast</AdminTh>
        <AdminTh width={116} align="end">Actual</AdminTh>
        <AdminTh width={136}>Impact</AdminTh>
        <AdminTh width={110} align="end">No trade</AdminTh>
      </AdminTableHead>
      <tbody>
        {rows.map((n) => (
          <AdminTr key={n.id} onClick={() => onOpen(n)}>
            <AdminTd className="whitespace-nowrap">{format(at(n.start), "EEE d · HH:mm")}</AdminTd>
            <AdminTd><Tag>{CCY[n.country]}</Tag></AdminTd>
            <AdminTd className="truncate text-a-text">{n.title}</AdminTd>
            <AdminTd align="end">{n.forecast ?? "—"}</AdminTd>
            <AdminTd align="end">{n.actual ?? "—"}</AdminTd>
            <AdminTd><Tag tone={IMPACT_TONE[n.impact]} dot>{n.impact}</Tag></AdminTd>
            <AdminTd align="end" onClick={(e) => e.stopPropagation()}>
              <Switch aria-label={`${n.title}: no trade`} checked={n.noTrade} onCheckedChange={(v) => toggle(n, v)} />
            </AdminTd>
          </AdminTr>
        ))}
      </tbody>
    </AdminTable>
  )
}

function NewsDrawer({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { coach } = useCoach()
  const [last, setLast] = useState(item)
  const [noTrade, setNoTrade] = useState(false)
  const [comment, setComment] = useState("")
  if (item && item !== last) {
    setLast(item)
    setNoTrade(item.news!.noTrade)
    setComment(item.news!.comment ?? "")
  }
  const news = (item ?? last)?.news
  return (
    <AdminDrawer
      open={!!item}
      onOpenChange={(o) => !o && onClose()}
      title={news?.title ?? "News"}
      subtitle={news && `${CCY[news.country]} · ${format(at(news.start), "EEEE d MMMM, HH:mm")} · ${news.impact} impact`}
      className="sm:data-[side=right]:w-[440px]"
      bodyClassName="gap-5"
      footer={
        <div className="flex w-full items-center gap-2">
          <AdminButton hierarchy="ghost" onClick={onClose}>Cancel</AdminButton>
          <span aria-hidden className="h-px min-w-px flex-1" />
          <AdminButton onClick={() => {
            if (!news) return
            saveSchedule(coach, (s) => ({ ...s, news: s.news.map((n) => (n.id === news.id ? { ...n, noTrade, comment: comment.trim() || undefined } : n)) }))
            toast.success("Saved. Students see your note on the event.")
            onClose()
          }}>Save</AdminButton>
        </div>
      }>
      {news && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {([["Forecast", news.forecast], ["Previous", news.previous], ["Actual", news.actual]] as const).map(([l, v]) => (
              <div key={l} className="grid gap-1.5">
                <span className="t-mono-label text-a-text-2">{l}</span>
                <span className="t-heading-m text-a-text tabular-nums">{v ?? "—"}</span>
              </div>
            ))}
          </div>
          <hr className="m-0 h-px shrink-0 border-0 bg-a-border-subtle" />
          <label className="flex items-center justify-between gap-6">
            <span className="grid gap-0.5">
              <span className="t-body-m text-a-text">No-trade event</span>
              <span className="t-caption text-a-text-2">Marked in red for students; the journal checks the rule.</span>
            </span>
            <Switch checked={noTrade} onCheckedChange={setNoTrade} />
          </label>
          <AdminField label="Your note for students" optional>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="No new positions from 14:20. Let the first move settle." className={cn(adminControl, "block h-28 resize-none py-2.5")} />
          </AdminField>
        </>
      )}
    </AdminDrawer>
  )
}

/* ---------- 05 Call details ---------- */

const PAST_CALLS = ["Market structure review", "Journal feedback", "Risk plan"]

function CallDrawer({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const [last, setLast] = useState(item)
  const [note, setNote] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)
  const [when, setWhen] = useState("")
  if (item && item !== last) {
    setLast(item)
    setNote(null)
  }
  const shown = item ?? last
  const b = shown?.booking
  const student = b ? STUDENTS.find((s) => s.name === b.student) : undefined
  const tier = student ? tierFor(coach, student.tier) : undefined
  const total = student ? (schedule.availability.perMonth[student.tier] ?? 4) : 4
  const used = Math.min(total, 3)
  const first = b?.student.split(" ")[0] ?? ""
  const calls = Array.from({ length: total }, (_, k) => k + 1)

  return (
    <>
      <AdminDrawer
        open={!!item}
        onOpenChange={(o) => !o && onClose()}
        title={b ? `1:1 · ${b.student}` : "1:1"}
        className="sm:data-[side=right]:w-[440px]"
        bodyClassName="gap-5"
        footer={
          b && shown && (
            <div className="flex w-full flex-wrap items-center gap-2">
              <AdminButton hierarchy="secondary" onClick={() => (setWhen(stamp(shown.start)), setMoving(true))}>Reschedule</AdminButton>
              <AdminButton hierarchy="danger" onClick={() => {
                saveSchedule(coach, (s) => ({ ...s, bookings: s.bookings.filter((x) => x.id !== b.id) }))
                toast(`Call cancelled. ${b.student} gets an e-mail with a link to rebook.`)
                onClose()
              }}>Cancel call</AdminButton>
              <span aria-hidden className="h-px min-w-px flex-1" />
              <AdminButton onClick={() => toast("The video call would open here.")}>Start call</AdminButton>
            </div>
          )
        }>
        {b && shown && (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-a-border bg-a-track">
                <AvatarFallback className="bg-transparent t-body-m text-a-text">{b.initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 gap-0.5">
                <span className="truncate t-body-m-medium text-a-text">{b.student}</span>
                <span className="truncate t-caption text-a-text-2">{tier ? `${tier.name} · ` : ""}{used} of {total} calls used this month</span>
              </div>
            </div>
            <section className="flex flex-col gap-3">
              <h3 className="t-mono-label text-a-text-2">Call</h3>
              <div className="flex items-center gap-2 t-body-m"><span className="text-a-text-2">When</span><span aria-hidden className="h-px min-w-px flex-1" /><span className="text-a-text">{format(shown.start, "EEE d MMM")} · {hhmm(shown.start)} – {hhmm(shown.end)}</span></div>
              <div className="flex items-center gap-2 t-body-m"><span className="text-a-text-2">Where</span><span aria-hidden className="h-px min-w-px flex-1" /><span className="text-a-text">Video call in the platform</span></div>
            </section>
            {b.question && (
              <Panel className="gap-2.5">
                <h3 className="t-mono-label text-a-text-2">Their question</h3>
                <p className="t-body-m text-a-text">“{b.question}”</p>
              </Panel>
            )}
            <section className="flex flex-col gap-4">
              <h3 className="t-mono-label text-a-text-2">Calls this month · {used} of {total} used</h3>
              <ol className="flex flex-col gap-4">
                {calls.map((k) => {
                  const state = k < used ? "done" : k === used ? "current" : "upcoming"
                  const date = addDays(shown.start, -7 * (used - k))
                  return (
                    <li key={k} className="flex items-start gap-3">
                      <StepIndicator step={k} state={state} />
                      <div className="grid min-w-0 t-body-m">
                        <span className="text-a-text">Call {k}{state === "done" ? ` · ${PAST_CALLS[(k - 1) % PAST_CALLS.length]}` : state === "current" ? " · This call" : ""}</span>
                        <span className="text-a-text-2">{state === "upcoming" ? "Not booked yet" : state === "current" ? `${format(shown.start, "EEE d MMM")} · ${hhmm(shown.start)}` : format(date, "EEE d MMM")}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
            {note === null ? (
              <AdminButton hierarchy="ghost" className="self-center" onClick={() => setNote("")}><Plus /> Add a note</AdminButton>
            ) : (
              <AdminField label={`Note about ${first}`}>
                <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only your team sees this" className={cn(adminControl, "block h-24 resize-none py-2.5")} />
              </AdminField>
            )}
          </>
        )}
      </AdminDrawer>
      <AdminModal open={moving} onOpenChange={setMoving} title="Reschedule call" subtitle={b ? `${b.student} gets an e-mail with the new time.` : undefined} className="sm:max-w-[420px]"
        footer={
          <div className="flex w-full items-center gap-2">
            <span aria-hidden className="h-px min-w-px flex-1" />
            <AdminButton hierarchy="ghost" onClick={() => setMoving(false)}>Cancel</AdminButton>
            <AdminButton disabled={!when || !b} onClick={() => {
              if (!b) return
              saveSchedule(coach, (s) => ({ ...s, bookings: s.bookings.map((x) => (x.id === b.id ? { ...x, start: when } : x)) }))
              toast.success("Call moved.")
              setMoving(false)
              onClose()
            }}>Move call</AdminButton>
          </div>
        }>
        <AdminField label="New time">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={cn(adminControl, "h-11 scheme-dark")} />
        </AdminField>
      </AdminModal>
    </>
  )
}
