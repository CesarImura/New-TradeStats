"use client"

import { addDays, addMinutes, addWeeks, differenceInCalendarDays, isBefore, startOfDay } from "date-fns"
import type { Coach } from "./coaches"
import { DEMO_STUDENT } from "./sample"
import { setStored, useStored } from "@/lib/prototype-store"
import { isSetupSlug } from "./communities"
import { useEmptyIfSetup } from "./use-communities"

/**
 * Calendar: what the coach schedules (ADM-19 to ADM-22) and what students see
 * and book (STU-06 to STU-09, STU-27). One schedule per community, stored in
 * the browser; student bookings land in it, so the coach sees them too.
 * "Now" is Wednesday 12 November 2025, 10:23, in the student's time zone (CET).
 */

export const NOW = new Date(2025, 10, 12, 10, 23)

export type EventKind = "live" | "call" | "workshop"
export type Impact = "high" | "medium" | "low"

export type CalEvent = {
  id: string
  kind: EventKind
  title: string
  /** Local time, "2025-11-10T15:30". For a weekly event, the first one. */
  start: string
  minutes: number
  repeat: "none" | "weekly"
  description?: string
  /** Tier ids that can join. Empty means every tier. */
  tiers: string[]
  seats?: number
  signedUp: number
  /** Streamed inside the platform (Go live), recorded as a lesson. */
  streamed: boolean
  price?: string
  reminders: string[]
  host: string
}

export type NewsItem = {
  id: string
  title: string
  /** The short name on a calendar chip ("CPI"); the News tab uses the full title. */
  short?: string
  country: "US" | "EU" | "UK" | "DE" | "JP"
  start: string
  impact: Impact
  forecast?: string
  previous?: string
  actual?: string
  noTrade: boolean
  comment?: string
}

export type Window = { from: string; to: string }
export type Availability = {
  /** Monday = 1 … Sunday = 7 */
  week: Record<number, Window[]>
  length: number
  buffer: number
  noticeHours: number
  /** Calls per month by tier id. 0 = can't book. */
  perMonth: Record<string, number>
}

export type Booking = { id: string; start: string; minutes: number; student: string; initials: string; question?: string }

export type Schedule = { events: CalEvent[]; news: NewsItem[]; availability: Availability; bookings: Booking[] }

/** What the demo student did: event sign-ups (by occurrence key). Bookings live in the schedule. */
export type StudentCal = { signups: string[] }

// ---------- seed

function seed(coach: Coach): Schedule {
  const upper = coach.tiers.slice(1).map((t) => t.id)
  const host = coach.coachName
  const perMonth = Object.fromEntries(coach.tiers.map((t, i) => [t.id, [2, 4, 8][i] ?? 2]))
  return {
    events: [
      { id: "nyo", kind: "live", title: "NY open, live trading", start: "2025-11-03T09:00", minutes: 90, repeat: "weekly", tiers: [], signedUp: 41, streamed: true, reminders: ["1d", "1h"], host, description: "I trade the open live and talk through every decision. Questions in the chat." },
      { id: "nyo-th", kind: "live", title: "NY open, live trading", start: "2025-11-06T09:00", minutes: 90, repeat: "weekly", tiers: [], signedUp: 37, streamed: true, reminders: ["1d", "1h"], host },
      { id: "review", kind: "call", title: "Group call: week review", start: "2025-11-05T15:00", minutes: 60, repeat: "weekly", tiers: upper, signedUp: 14, streamed: false, reminders: ["1h"], host, description: "Three student trades, reviewed on screen." },
      { id: "ws1", kind: "workshop", title: "Workshop: order flow", start: "2025-11-13T13:00", minutes: 120, repeat: "none", tiers: [], seats: 20, signedUp: 12, streamed: true, reminders: ["1d", "1h"], host, description: "How to read the order book and footprint before you click." },
      { id: "ws2", kind: "workshop", title: "Workshop: risk and sizing", start: "2025-11-20T13:00", minutes: 120, repeat: "none", tiers: upper, seats: 30, signedUp: 21, streamed: true, reminders: ["1d", "1h"], host },
    ],
    news: [
      { id: "n1", title: "CPI m/m", short: "CPI", country: "US", start: "2025-11-11T14:30", impact: "high", forecast: "0.3%", previous: "0.2%", noTrade: true, comment: "No new positions from 14:20. Expect a fake first move; let it settle." },
      { id: "n2", title: "FOMC minutes", short: "FOMC", country: "US", start: "2025-11-12T20:00", impact: "high", noTrade: false },
      { id: "n3", title: "Initial jobless claims", short: "Claims", country: "US", start: "2025-11-13T13:30", impact: "medium", forecast: "218K", previous: "221K", noTrade: false },
      { id: "n4", title: "Non-farm payrolls", short: "NFP", country: "US", start: "2025-11-14T14:30", impact: "high", forecast: "180K", noTrade: true, comment: "Flat 10 minutes before. Wait for the first 5-minute candle to close." },
      { id: "n5", title: "CPI m/m", short: "CPI", country: "US", start: "2025-11-18T14:30", impact: "high", forecast: "0.3%", previous: "0.3%", noTrade: true },
      { id: "n6", title: "FOMC minutes", short: "FOMC", country: "US", start: "2025-11-19T20:00", impact: "high", noTrade: false },
      { id: "n7", title: "Non-farm payrolls", short: "NFP", country: "US", start: "2025-11-21T14:30", impact: "high", forecast: "175K", previous: "180K", noTrade: true },
    ],
    availability: {
      week: { 1: [], 2: [{ from: "10:00", to: "12:00" }, { from: "14:00", to: "16:00" }], 3: [], 4: [{ from: "09:00", to: "12:00" }, { from: "15:00", to: "17:00" }], 5: [{ from: "13:00", to: "15:00" }], 6: [], 7: [] },
      length: 30,
      buffer: 10,
      noticeHours: 12,
      perMonth,
    },
    bookings: [
      { id: "b1", start: "2025-11-12T11:00", minutes: 30, student: "Lena Ito", initials: "LI", question: "Can we go through my last 10 trades? I keep cutting winners early." },
      { id: "b2", start: "2025-11-14T10:00", minutes: 30, student: "Alex Moreau", initials: "AM", question: "My stops after the CPI week." },
      { id: "b3", start: "2025-11-13T09:30", minutes: 30, student: "Priya Nair", initials: "PN", question: "Scaling into winners: when is it too early?" },
      { id: "b4", start: "2025-11-06T10:00", minutes: 30, student: "Mia Sørensen", initials: "MS", question: "Position sizing on the desk account." },
      { id: "b5", start: "2025-11-21T14:00", minutes: 30, student: "Leo Marsh", initials: "LM", question: "Can we go through my last losing streak?" },
    ],
  }
}

const SEEDS = new Map<string, Schedule>()
const seedFor = (coach: Coach) => {
  if (!SEEDS.has(coach.slug)) SEEDS.set(coach.slug, seed(coach))
  return SEEDS.get(coach.slug)!
}
/** Whether an event is one of the prototype's sample events rather than one the coach made. */
export const isSampleEvent = (coach: Coach, id: string) => seedFor(coach).events.some((e) => e.id === id)
export const isSampleBooking = (coach: Coach, id: string) => seedFor(coach).bookings.some((b) => b.id === id)
const START_STUDENT: StudentCal = { signups: ["ws1@2025-11-13"] }

const scheduleKey = (slug: string) => `schedule:${slug}`
const studentKey = (slug: string) => `studentcal:${slug}`

/** A platform made in setup keeps the market news and the default hours, with no sample events or bookings. */
const EMPTY_SCHEDULES = new Map<string, Schedule>()
const emptyFor = (coach: Coach) => {
  if (!EMPTY_SCHEDULES.has(coach.slug)) EMPTY_SCHEDULES.set(coach.slug, { ...seedFor(coach), events: [], bookings: [] })
  return EMPTY_SCHEDULES.get(coach.slug)!
}
export const useSchedule = (coach: Coach) => {
  const sample = seedFor(coach)
  return useEmptyIfSetup(coach.slug, useStored<Schedule>(scheduleKey(coach.slug), sample), sample, emptyFor(coach))
}
export const useStudentCal = (slug: string) => useStored<StudentCal>(studentKey(slug), START_STUDENT)
export const saveSchedule = (coach: Coach, fn: (s: Schedule) => Schedule) => setStored<Schedule>(scheduleKey(coach.slug), fn, isSetupSlug(coach.slug) ? emptyFor(coach) : seedFor(coach))
export const saveStudentCal = (slug: string, fn: (s: StudentCal) => StudentCal) => setStored<StudentCal>(studentKey(slug), fn, START_STUDENT)

// ---------- time helpers

export function at(s: string) {
  const [d, t = "00:00"] = s.split("T")
  const [y, m, day] = d.split("-").map(Number)
  const [h, mi] = t.split(":").map(Number)
  return new Date(y, m - 1, day, h, mi)
}
export const stamp = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
export const dayKey = (d: Date) => stamp(d).slice(0, 10)
export const hhmm = (d: Date) => stamp(d).slice(11)
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

// ---------- what shows on the calendar

export type ItemKind = EventKind | "news" | "one-on-one"
export type Item = {
  key: string
  kind: ItemKind
  title: string
  start: Date
  end: Date
  event?: CalEvent
  news?: NewsItem
  booking?: Booking
}

/** Every occurrence of the events between two dates (weekly ones repeat). */
export function occurrences(events: CalEvent[], from: Date, to: Date): Item[] {
  const out: Item[] = []
  for (const e of events) {
    let s = at(e.start)
    if (e.repeat === "weekly") {
      const skip = Math.max(0, Math.floor(differenceInCalendarDays(from, s) / 7))
      s = addWeeks(s, skip)
    }
    while (s < to) {
      if (s >= startOfDay(from)) out.push({ key: `${e.id}@${dayKey(s)}`, kind: e.kind, title: e.title, start: s, end: addMinutes(s, e.minutes), event: e })
      if (e.repeat !== "weekly") break
      s = addWeeks(s, 1)
    }
  }
  return out
}

export function itemsBetween(s: Schedule, from: Date, to: Date, opts: { bookings: "all" | string | "none" }): Item[] {
  const news = s.news
    .map((n) => ({ key: n.id, kind: "news" as const, title: n.short ?? n.title, start: at(n.start), end: addMinutes(at(n.start), 15), news: n }))
    .filter((i) => i.start >= startOfDay(from) && i.start < to)
  const bookings =
    opts.bookings === "none"
      ? []
      : s.bookings
          .filter((b) => opts.bookings === "all" || b.student === opts.bookings)
          .map((b) => ({ key: b.id, kind: "one-on-one" as const, title: opts.bookings === "all" ? `1:1 · ${b.student}` : "1:1 call", start: at(b.start), end: addMinutes(at(b.start), b.minutes), booking: b }))
          .filter((i) => i.start >= startOfDay(from) && i.start < to)
  return [...occurrences(s.events, from, to), ...news, ...bookings].sort((a, b) => +a.start - +b.start)
}

export const isLiveNow = (i: Item) => i.start <= NOW && i.end > NOW

/** Free 1:1 times: the weekly windows, cut into calls, minus bookings, events and the notice period. */
export function freeSlots(s: Schedule, days = 14) {
  const { week, length, buffer, noticeHours } = s.availability
  const earliest = addMinutes(NOW, noticeHours * 60)
  const busy = itemsBetween(s, NOW, addDays(NOW, days + 1), { bookings: "all" }).filter((i) => i.kind !== "news")
  const out: { day: Date; times: Date[] }[] = []
  for (let d = 0; d < days; d++) {
    const day = startOfDay(addDays(NOW, d))
    const wd = ((day.getDay() + 6) % 7) + 1
    const times: Date[] = []
    for (const w of week[wd] ?? []) {
      for (let m = toMin(w.from); m + length <= toMin(w.to); m += length + buffer) {
        const t = addMinutes(day, m)
        const end = addMinutes(t, length)
        if (isBefore(t, earliest)) continue
        if (busy.some((b) => b.start < end && b.end > t)) continue
        times.push(t)
      }
    }
    out.push({ day, times })
  }
  return out
}

export const KIND_LABEL: Record<ItemKind, string> = { live: "Live", call: "Call", workshop: "Workshop", news: "News", "one-on-one": "1:1" }

/** 1:1 calls the student has booked this month (October). */
export const callsThisMonth = (s: Schedule, student: string) => s.bookings.filter((b) => b.student === student && at(b.start).getMonth() === NOW.getMonth()).length

export const studentName = `${DEMO_STUDENT.first} ${DEMO_STUDENT.last}`
