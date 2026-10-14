"use client"

import { createContext, useContext, useState } from "react"
import { addDays, addMinutes, differenceInMinutes, format, isSameDay } from "date-fns"
import { Bell, CalendarPlus, CalendarX, Clock, Lock, Play, Radio, TriangleAlert, Users, Video } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useStudentTier } from "@/components/courses/shared"
import { TONE, series } from "@/components/widgets/kit"
import {
  KIND_LABEL,
  NOW,
  at,
  callsThisMonth,
  freeSlots,
  hhmm,
  isLiveNow,
  itemsBetween,
  saveSchedule,
  saveStudentCal,
  stamp,
  studentName,
  useSchedule,
  useStudentCal,
  type Booking,
  type Item,
  type ItemKind,
} from "@/lib/data/schedule"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { CalendarSurface, type EventStyle, type View } from "./calendar-surface"
import { OwnTitle } from "@/components/student/own-title"

export const STUDENT_COLORS: Record<ItemKind, string> = {
  live: series(0),
  call: series(1),
  workshop: series(2),
  "one-on-one": series(4),
  news: TONE.loss,
}
/** "A colour per type": distinct but calm hues; lives stay in the coach's colour. */
const MULTI_COLORS: Record<ItemKind, string> = {
  live: series(0),
  call: "oklch(0.6 0.12 245)",
  workshop: "oklch(0.62 0.12 160)",
  "one-on-one": "oklch(0.66 0.13 70)",
  news: TONE.loss,
}
/** "Greys, lives in my colour". */
const MONO_COLORS: Record<ItemKind, string> = {
  live: series(0),
  call: "color-mix(in oklab, var(--foreground) 62%, var(--card))",
  workshop: "color-mix(in oklab, var(--foreground) 45%, var(--card))",
  "one-on-one": "color-mix(in oklab, var(--foreground) 30%, var(--card))",
  news: TONE.loss,
}
const PALETTES: Record<string, Record<ItemKind, string>> = { shades: STUDENT_COLORS, multi: MULTI_COLORS, mono: MONO_COLORS }

/** Where an event's details open, chosen by the coach on the calendar's core widget (Design → Pages). */
type Opens = "tray" | "popover" | "popup"
const ColorsContext = createContext(STUDENT_COLORS)
const OpensContext = createContext<Opens>("tray")

const KINDS: ItemKind[] = ["live", "call", "workshop", "one-on-one", "news"]
const RANGE = { from: addDays(NOW, -45), to: addDays(NOW, 75) }

/** STU-06 calendar with STU-07 event, STU-08 booking, STU-09 news detail and STU-27 my bookings. */
export function StudentCalendar({ props = {} }: { props?: Record<string, string | boolean> } = {}) {
  const { coach } = useCoach()
  const colors = PALETTES[(props.colors as string) ?? "shades"] ?? STUDENT_COLORS
  const opens = ((props.open as string) ?? "tray") as Opens
  const eventStyle = ((props.style as string) ?? "tinted") as EventStyle
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const schedule = useSchedule(coach)
  const mine = useStudentCal(coach.slug)
  const tier = useStudentTier()
  const [view, setView] = useState<View>("week")
  const [cursor, setCursor] = useState(NOW)
  const [hidden, setHidden] = useState<ItemKind[]>([])
  const [open, setOpen] = useState<Item | null>(null)
  const [booking, setBooking] = useState<{ replace?: Booking } | null>(null)

  const all = itemsBetween(schedule, RANGE.from, RANGE.to, { bookings: studentName })
  const items = all.filter((i) => !hidden.includes(i.kind))
  const liveNow = all.find((i) => isLiveNow(i) && i.kind === "live")
  const allowance = schedule.availability.perMonth[tier ?? ""] ?? 0
  const used = callsThisMonth(schedule, studentName)
  const upcomingMine = all.filter((i) => i.end > NOW && (i.booking || mine.signups.includes(i.key)))

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <OwnTitle>
          <div className="flex flex-col gap-1">
          <span className="eyebrow">Times in your time zone · CET</span>
          <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.calendar}</h1>
        </div>
        </OwnTitle>
        {allowance > 0 && (
          <Button onClick={() => setBooking({})}>
            <CalendarPlus /> Book a 1:1
          </Button>
        )}
      </div>

      {liveNow && (
        <div className="fx-hero @container rounded-(--radius)" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="flex flex-col gap-3 p-[calc(1rem*var(--density,1))] @lg:flex-row @lg:items-center">
            <span className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-current" />
              </span>
              Live now
            </span>
            <span className="flex-1 font-heading text-lg leading-tight">
              {liveNow.title}{" "}
              <span className="text-sm opacity-80">
                · with {liveNow.event?.host}, until {hhmm(liveNow.end)}
              </span>
            </span>
            <Button variant="secondary" onClick={() => toast("The live session would open here (STU-10).")}>
              <Play /> Join now
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="calendar" className="gap-5">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="mine">
            My bookings <span className="text-muted-foreground tabular-nums">{upcomingMine.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarSurface
            items={items}
            view={view}
            onView={setView}
            cursor={cursor}
            onCursor={setCursor}
            onSelect={(i, el) => {
              setAnchor(el ?? null)
              setOpen(i)
            }}
            colorOf={(k) => colors[k]}
            eventStyle={eventStyle}
            toolbar={
              <div className="flex flex-wrap gap-1.5">
                {KINDS.map((k) => {
                  const on = !hidden.includes(k)
                  return (
                    <button
                      key={k}
                      onClick={() => setHidden((h) => (on ? [...h, k] : h.filter((x) => x !== k)))}
                      aria-pressed={on}
                      className={cn("r-chip flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-opacity", !on && "opacity-45")}
                    >
                      <span className="size-2 rounded-full" style={{ background: colors[k] }} />
                      {KIND_LABEL[k]}
                    </button>
                  )
                })}
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="mine">
          <MyBookings
            items={upcomingMine}
            onOpen={(i) => {
              setAnchor(null)
              setOpen(i)
            }}
            onReschedule={(b) => setBooking({ replace: b })}
          />
        </TabsContent>
      </Tabs>

      <ColorsContext.Provider value={colors}>
        <OpensContext.Provider value={opens === "popover" && !anchor ? "popup" : opens}>
          <ItemSheet item={open} anchor={anchor} onClose={() => setOpen(null)} onReschedule={(b) => (setOpen(null), setBooking({ replace: b }))} />
        </OpensContext.Provider>
      </ColorsContext.Provider>
      <BookDialog open={!!booking} replace={booking?.replace} onClose={() => setBooking(null)} allowance={allowance} used={used} />
    </div>
  )
}

// ---------- detail sheet (STU-07 event, STU-09 news, own 1:1)

/** An event's details: in a tray from the side, a popover by the event, or a pop-up in the middle. */
function ItemSheet({ item, anchor, onClose, onReschedule }: { item: Item | null; anchor: HTMLElement | null; onClose: () => void; onReschedule: (b: Booking) => void }) {
  const opens = useContext(OpensContext)
  const { coach } = useCoach()
  const mine = useStudentCal(coach.slug)
  const tier = useStudentTier()
  const [last, setLast] = useState<Item | null>(item)
  if (item && item !== last) setLast(item)
  const i = item ?? last
  const body = (
    <>
      {i?.event && <EventDetail item={i} signedUp={mine.signups.includes(i.key)} tier={tier} />}
      {i?.news && <NewsDetail item={i} />}
      {i?.booking && <BookingDetail item={i} onReschedule={onReschedule} onDone={onClose} />}
    </>
  )
  if (opens === "popover")
    return (
      <PopoverPrimitive.Root open={!!item} onOpenChange={(o) => !o && onClose()}>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner anchor={anchor} side="right" align="start" sideOffset={8} collisionPadding={12} className="isolate z-50">
            <PopoverPrimitive.Popup className="flex max-h-[min(70vh,560px)] w-[22rem] flex-col overflow-y-auto rounded-(--radius) bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-hidden [&_[data-slot=sheet-header]]:p-4 [&_[data-slot=sheet-footer]]:p-4">
              {body}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    )
  if (opens === "popup")
    return (
      <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">{body}</DialogContent>
      </Dialog>
    )
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-md">{body}</SheetContent>
    </Sheet>
  )
}

function Head({ item, icon: Icon }: { item: Item; icon: React.ElementType }) {
  const live = isLiveNow(item)
  const colors = useContext(ColorsContext)
  // A popover has its own title parts; the tray and the pop-up are dialogs.
  const popover = useContext(OpensContext) === "popover"
  const Title = popover ? PopoverPrimitive.Title : SheetTitle
  const Description = popover ? PopoverPrimitive.Description : SheetDescription
  return (
    <SheetHeader className="gap-3 border-b">
      <div className="flex items-center gap-2">
        <span className="r-chip grid size-8 place-items-center text-white" style={{ background: colors[item.kind] }}>
          <Icon className="size-4" />
        </span>
        <span className="eyebrow">{KIND_LABEL[item.kind]}</span>
        {live && <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Live now</span>}
      </div>
      <Title className="font-heading text-2xl leading-tight">{item.title}</Title>
      <Description className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-4" />
        {format(item.start, "EEEE d MMMM")} · {hhmm(item.start)}
        {item.kind !== "news" && `–${hhmm(item.end)}`}
      </Description>
    </SheetHeader>
  )
}

function EventDetail({ item, signedUp, tier }: { item: Item; signedUp: boolean; tier?: string }) {
  const { coach } = useCoach()
  const e = item.event!
  const allowed = e.tiers.length === 0 || (!!tier && e.tiers.includes(tier))
  const needs = coach.tiers.find((t) => e.tiers.includes(t.id))
  const past = item.end <= NOW
  const live = isLiveNow(item)
  const taken = e.signedUp + (signedUp ? 1 : 0)
  const full = e.seats !== undefined && taken >= e.seats && !signedUp
  const startsIn = differenceInMinutes(item.start, NOW)
  const toggle = () => {
    saveStudentCal(coach.slug, (s) => ({ signups: signedUp ? s.signups.filter((k) => k !== item.key) : [...s.signups, item.key] }))
    toast.success(
      signedUp ? "You're no longer signed up." : `You're in. We'll remind you ${e.reminders.includes("1d") ? "the day before and " : ""}an hour before.`,
    )
  }
  return (
    <>
      <Head item={item} icon={item.kind === "live" ? Radio : item.kind === "workshop" ? Users : Video} />
      <div className="grid gap-5 p-4">
        {e.description && <p className="leading-relaxed text-muted-foreground">{e.description}</p>}
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Fact label="With">{e.host}</Fact>
          <Fact label="Length">{e.minutes} min</Fact>
          <Fact label={e.seats ? "Seats" : "Signed up"}>{e.seats ? `${Math.max(0, e.seats - taken)} of ${e.seats} left` : `${taken} people`}</Fact>
          <Fact label="Where">{e.streamed ? "Here, in the platform" : "Video call, link here"}</Fact>
          {e.price && <Fact label="Price">{e.price}</Fact>}
          {e.repeat === "weekly" && <Fact label="Repeats">Every {format(item.start, "EEEE")}</Fact>}
        </dl>
        {!allowed && (
          <div className="flex items-start gap-3 rounded-[var(--r-inner)] bg-muted p-3 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0" />
            <span>
              Part of <strong>{needs?.name}</strong>. Upgrade to join this and every other {needs?.name} session.
            </span>
          </div>
        )}
      </div>
      <SheetFooter className="border-t">
        {!allowed ? (
          <Button onClick={() => toast("Upgrade would open here (STU-22).")}>Upgrade to {needs?.name}</Button>
        ) : past ? (
          <Button onClick={() => toast("The recording would play here. It's also saved as a lesson.")}>
            <Play /> Watch the recording
          </Button>
        ) : live ? (
          <Button onClick={() => toast("The live session would open here (STU-10).")}>
            <Play /> Join now
          </Button>
        ) : (
          <>
            {startsIn < 15 && e.streamed && (
              <Button onClick={() => toast("The live session would open here (STU-10).")}>
                <Play /> Join
              </Button>
            )}
            <Button variant={signedUp ? "outline" : "default"} onClick={toggle} disabled={full}>
              {signedUp ? "Cancel my spot" : full ? "Full" : e.price ? `Sign up · ${e.price}` : "Sign me up"}
            </Button>
            {full && (
              <Button variant="outline" onClick={() => toast.success("You're on the waiting list. We'll e-mail you if a seat opens.")}>
                Join the waiting list
              </Button>
            )}
            <Button variant="ghost" onClick={() => toast("A calendar file (.ics) would download.")}>
              <CalendarPlus /> Add to my calendar
            </Button>
          </>
        )}
      </SheetFooter>
    </>
  )
}

function NewsDetail({ item }: { item: Item }) {
  const { coach } = useCoach()
  const n = item.news!
  const dots = { high: 3, medium: 2, low: 1 }[n.impact]
  return (
    <>
      <Head item={item} icon={TriangleAlert} />
      <div className="grid gap-5 p-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="r-chip bg-muted px-2 py-0.5 font-medium">{n.country}</span>
          <span className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              {[1, 2, 3].map((d) => (
                <i key={d} className="size-1.5 rounded-full" style={{ background: d <= dots ? TONE.loss : "var(--muted)" }} />
              ))}
            </span>
            {n.impact[0].toUpperCase() + n.impact.slice(1)} impact
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Forecast", n.forecast],
            ["Previous", n.previous],
            ["Actual", n.actual ?? (item.start < NOW ? "–" : "Pending")],
          ].map(([l, v]) => (
            <div key={l} className="r-inner grid gap-1 bg-muted/60 p-3">
              <span className="eyebrow">{l}</span>
              <span className="font-heading text-xl leading-none tabular-nums">{v ?? "–"}</span>
            </div>
          ))}
        </div>
        {n.noTrade && (
          <div className="flex items-start gap-3 rounded-[var(--r-inner)] bg-loss/10 p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-loss" />
            <span>
              <strong>No-trade event.</strong> {coach.coachName} asks you not to open new positions around it. Your journal checks this rule.
            </span>
          </div>
        )}
        {n.comment && (
          <figure className="grid gap-1.5 border-l-2 border-primary pl-3">
            <span className="eyebrow">{coach.coachName}&apos;s note</span>
            <blockquote className="leading-relaxed">{n.comment}</blockquote>
          </figure>
        )}
      </div>
      <SheetFooter className="border-t">
        <Button variant="outline" onClick={() => toast.success("We'll remind you 15 minutes before.")}>
          <Bell /> Remind me
        </Button>
      </SheetFooter>
    </>
  )
}

function BookingDetail({ item, onReschedule, onDone }: { item: Item; onReschedule: (b: Booking) => void; onDone: () => void }) {
  const { coach } = useCoach()
  const b = item.booking!
  const past = item.end <= NOW
  return (
    <>
      <Head item={item} icon={Video} />
      <div className="grid gap-4 p-4 text-sm">
        <p className="text-muted-foreground">
          {b.minutes}-minute call with {coach.coachName}. The link works from 5 minutes before.
        </p>
        {b.question && (
          <div className="r-inner grid gap-1 bg-muted/60 p-3">
            <span className="eyebrow">Your question</span>
            <p>{b.question}</p>
          </div>
        )}
        {!past && <p className="text-xs text-muted-foreground">Free to change until 12 hours before.</p>}
      </div>
      {!past && (
        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onReschedule(b)}>
            Reschedule
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              saveSchedule(coach, (s) => ({ ...s, bookings: s.bookings.filter((x) => x.id !== b.id) }))
              toast(`Call cancelled. ${coach.coachName} has been told.`)
              onDone()
            }}
          >
            <CalendarX /> Cancel the call
          </Button>
        </SheetFooter>
      )}
    </>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

// ---------- STU-08 book a 1:1

function BookDialog({ open, replace, onClose, allowance, used }: { open: boolean; replace?: Booking; onClose: () => void; allowance: number; used: number }) {
  const { coach } = useCoach()
  const schedule = useSchedule(coach)
  const days = freeSlots(schedule, 14).filter((d) => d.times.length)
  const [day, setDay] = useState(0)
  const [time, setTime] = useState<Date | null>(null)
  const [question, setQuestion] = useState("")
  const left = allowance - used + (replace ? 1 : 0)
  const length = schedule.availability.length
  const pick = days[Math.min(day, days.length - 1)]

  const confirm = () => {
    if (!time) return
    const b: Booking = {
      id: `b${+time}`,
      start: stamp(time),
      minutes: length,
      student: studentName,
      initials: DEMO_STUDENT.initials,
      question: question.trim() || replace?.question,
    }
    saveSchedule(coach, (s) => ({ ...s, bookings: [...s.bookings.filter((x) => x.id !== replace?.id), b] }))
    toast.success(`${replace ? "Moved to" : "Booked:"} ${format(time, "EEEE d MMM")} at ${hhmm(time)}`, {
      description: `${coach.coachName} gets your question ahead of the call.`,
    })
    setTime(null)
    setQuestion("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{replace ? "Pick a new time" : `Book a 1:1 with ${coach.coachName}`}</DialogTitle>
          <DialogDescription>
            {length} minutes on video.{" "}
            {left > 0 ? `${left} of ${allowance} calls left this month.` : "You've used this month's calls. New ones open on 1 November."}
          </DialogDescription>
        </DialogHeader>
        {left <= 0 ? (
          <div className="grid gap-3 rounded-[var(--r-inner)] bg-muted p-4 text-sm">
            Need more time with {coach.coachName}? Higher tiers include more calls each month.
          </div>
        ) : days.length === 0 ? (
          <p className="text-sm text-muted-foreground">No free times in the next two weeks. {coach.coachName} opens new ones every Sunday.</p>
        ) : (
          <div className="grid gap-4">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((d, i) => (
                <button
                  key={+d.day}
                  onClick={() => (setDay(i), setTime(null))}
                  className={cn(
                    "grid w-16 shrink-0 justify-items-center gap-0.5 rounded-[var(--r-inner)] border px-2 py-2 text-center",
                    i === day && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  <span className="text-[0.65rem] uppercase opacity-75">{format(d.day, "EEE")}</span>
                  <span className="font-heading text-xl leading-none">{d.day.getDate()}</span>
                  <span className="text-[0.65rem] opacity-75">{d.times.length} free</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {pick.times.map((t) => (
                <button
                  key={+t}
                  onClick={() => setTime(t)}
                  className={cn(
                    "rounded-[var(--button-radius)] border px-2 py-2 text-sm tabular-nums transition-colors hover:bg-muted",
                    time && +time === +t && "border-primary bg-primary/10 font-medium text-primary",
                  )}
                >
                  {hhmm(t)}
                </button>
              ))}
            </div>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={replace?.question ?? "What do you want to talk about? (optional)"}
              className="min-h-20"
            />
          </div>
        )}
        <DialogFooter>
          <Button onClick={confirm} disabled={!time || left <= 0}>
            {time ? `${replace ? "Move to" : "Book"} ${format(time, "EEE d MMM")}, ${hhmm(time)}–${hhmm(addMinutes(time, length))}` : "Pick a time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- STU-27 my bookings

function MyBookings({ items, onOpen, onReschedule }: { items: Item[]; onOpen: (i: Item) => void; onReschedule: (b: Booking) => void }) {
  const { coach } = useCoach()
  if (!items.length) {
    return (
      <div className="grid place-items-center gap-2 rounded-(--radius) border border-dashed px-6 py-12 text-center">
        <CalendarPlus className="size-6 text-muted-foreground" />
        <p className="font-medium">Nothing booked yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">Sign up for a session or book a 1:1 and it shows here, with reminders.</p>
      </div>
    )
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((i) => (
        <div key={i.key} className="flex gap-4 rounded-(--radius) bg-card p-4 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <div
            className="grid w-14 shrink-0 content-start justify-items-center rounded-[var(--r-inner)] py-2 text-white"
            style={{ background: STUDENT_COLORS[i.kind] }}
          >
            <span className="text-[0.65rem] uppercase opacity-80">{format(i.start, "MMM")}</span>
            <span className="font-heading text-2xl leading-none">{i.start.getDate()}</span>
            <span className="text-[0.65rem] opacity-80">{format(i.start, "EEE")}</span>
          </div>
          <div className="grid min-w-0 flex-1 content-start gap-1">
            <span className="eyebrow">
              {KIND_LABEL[i.kind]} · {hhmm(i.start)}–{hhmm(i.end)}
            </span>
            <span className="truncate font-heading text-lg leading-tight">{i.booking ? `1:1 with ${coach.coachName}` : i.title}</span>
            {i.booking?.question && <span className="truncate text-sm text-muted-foreground">“{i.booking.question}”</span>}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpen(i)}>
                Details
              </Button>
              {i.booking && (
                <Button size="sm" variant="ghost" onClick={() => onReschedule(i.booking!)}>
                  Reschedule
                </Button>
              )}
              {isSameDay(i.start, at(stamp(NOW))) && <span className="self-center text-xs font-medium text-primary">Today</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
