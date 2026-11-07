"use client"

import { addDays, addMinutes, addWeeks, differenceInCalendarDays, isBefore, startOfDay } from "date-fns"
import type { Coach } from "./coaches"
import { DEMO_STUDENT } from "./sample"
import { setStored, useStored } from "@/lib/prototype-store"

/**
 * Calendar: what the coach schedules (ADM-19 to ADM-22) and what students see
 * and book (STU-06 to STU-09, STU-27). One schedule per community, stored in
 * the browser; student bookings land in it, so the coach sees them too.
 * "Now" is Monday 12 October 2026, 09:00, in the student's time zone (CET).
 */

export const NOW = new Date(2026, 9, 12, 9, 0)

export type EventKind = "live" | "call" | "workshop"
export type Impact = "high" | "medium" | "low"

export type CalEvent = {
  id: string
  kind: EventKind
  title: string
  /** Local time, "2026-10-12T15:30". For a weekly event, the first one. */
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
      { id: "prep", kind: "live", title: "Morning market prep", start: "2026-10-05T08:45", minutes: 45, repeat: "weekly", tiers: [], signedUp: 58, streamed: true, reminders: ["10m"], host, description: "Levels, news and the plan for the day, before Europe gets going." },
      { id: "nyo", kind: "live", title: "Live trading · NY open", start: "2026-10-05T15:30", minutes: 90, repeat: "weekly", tiers: [], signedUp: 41, streamed: true, reminders: ["1h", "10m"], host, description: "I trade the open live and talk through every decision. Questions in the chat." },
      { id: "nyo-w", kind: "live", title: "Live trading · NY open", start: "2026-10-07T15:30", minutes: 90, repeat: "weekly", tiers: [], signedUp: 37, streamed: true, reminders: ["1h", "10m"], host },
      { id: "qa", kind: "call", title: "Q&A call", start: "2026-10-06T18:00", minutes: 45, repeat: "weekly", tiers: [], signedUp: 34, streamed: false, reminders: ["1h"], host, description: "Bring your questions, or a trade you want to talk through." },
      { id: "review", kind: "call", title: "Group trade review", start: "2026-10-09T17:00", minutes: 60, repeat: "weekly", tiers: upper, signedUp: 14, streamed: false, reminders: ["1h"], host, description: "Three student trades, reviewed on screen." },
      { id: "ws1", kind: "workshop", title: "Workshop · Journaling that works", start: "2026-10-15T11:00", minutes: 90, repeat: "none", tiers: [], seats: 20, signedUp: 12, streamed: true, reminders: ["1d", "1h"], host, description: "How to journal so it actually changes your trading. Bring last week's trades." },
      { id: "ws2", kind: "workshop", title: "Workshop · Prop firm rules, explained", start: "2026-10-22T16:00", minutes: 60, repeat: "none", tiers: upper, seats: 30, signedUp: 21, streamed: true, reminders: ["1d", "1h"], host, price: "€49" },
      { id: "ws3", kind: "workshop", title: "Workshop · Building your first playbook", start: "2026-10-29T11:00", minutes: 90, repeat: "none", tiers: [], seats: 20, signedUp: 20, streamed: true, reminders: ["1d"], host },
    ],
    news: [
      { id: "n1", title: "Non-farm payrolls", country: "US", start: "2026-10-02T14:30", impact: "high", forecast: "150K", previous: "142K", actual: "171K", noTrade: true, comment: "Flat 10 minutes before. Wait for the first 5-minute candle to close." },
      { id: "n2", title: "US PPI", country: "US", start: "2026-10-13T14:30", impact: "medium", forecast: "0.2%", previous: "0.3%", noTrade: false },
      { id: "n3", title: "US CPI", country: "US", start: "2026-10-14T14:30", impact: "high", forecast: "3.1%", previous: "3.2%", noTrade: true, comment: "No new positions from 14:20. Expect a fake first move; let it settle." },
      { id: "n4", title: "ECB rate decision", country: "EU", start: "2026-10-15T14:15", impact: "high", forecast: "3.25%", previous: "3.50%", noTrade: true, comment: "Press conference at 14:45 moves EUR more than the decision itself." },
      { id: "n5", title: "FOMC minutes", country: "US", start: "2026-10-15T20:00", impact: "medium", noTrade: false },
      { id: "n6", title: "UK GDP", country: "UK", start: "2026-10-16T08:00", impact: "low", forecast: "0.2%", previous: "0.1%", noTrade: false },
      { id: "n7", title: "US retail sales", country: "US", start: "2026-10-16T14:30", impact: "medium", forecast: "0.3%", previous: "0.6%", noTrade: false },
      { id: "n8", title: "Fed chair speech", country: "US", start: "2026-10-20T16:00", impact: "high", noTrade: false },
      { id: "n9", title: "German ifo", country: "DE", start: "2026-10-21T10:00", impact: "low", forecast: "86.1", previous: "85.7", noTrade: false },
      { id: "n10", title: "US jobless claims", country: "US", start: "2026-10-22T14:30", impact: "low", forecast: "228K", previous: "231K", noTrade: false },
      { id: "n11", title: "EU flash PMI", country: "EU", start: "2026-10-23T10:00", impact: "medium", forecast: "45.4", previous: "45.0", noTrade: false },
      { id: "n12", title: "BoJ rate decision", country: "JP", start: "2026-10-28T04:00", impact: "medium", noTrade: false },
      { id: "n13", title: "FOMC rate decision", country: "US", start: "2026-10-28T19:00", impact: "high", forecast: "4.25%", previous: "4.50%", noTrade: true, comment: "No trades from 18:50 until the press conference ends." },
    ],
    availability: {
      week: { 1: [], 2: [{ from: "10:00", to: "12:00" }, { from: "14:00", to: "16:00" }], 3: [], 4: [{ from: "09:00", to: "12:00" }, { from: "15:00", to: "17:00" }], 5: [{ from: "13:00", to: "15:00" }], 6: [], 7: [] },
      length: 30,
      buffer: 10,
      noticeHours: 12,
      perMonth,
    },
    bookings: [
      { id: "b1", start: "2026-10-13T10:00", minutes: 30, student: "Jonas Pereira", initials: "JP", question: "Scaling into winners: when is it too early?" },
      { id: "b2", start: "2026-10-15T09:40", minutes: 30, student: "Mia Sørensen", initials: "MS", question: "My stops after the CPI week." },
      { id: "b3", start: "2026-10-16T13:00", minutes: 30, student: `${DEMO_STUDENT.first} ${DEMO_STUDENT.last}`, initials: DEMO_STUDENT.initials, question: "Can we go through my last losing streak?" },
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
const START_STUDENT: StudentCal = { signups: ["ws1@2026-10-15"] }

const scheduleKey = (slug: string) => `schedule:${slug}`
const studentKey = (slug: string) => `studentcal:${slug}`

export const useSchedule = (coach: Coach) => useStored<Schedule>(scheduleKey(coach.slug), seedFor(coach))
export const useStudentCal = (slug: string) => useStored<StudentCal>(studentKey(slug), START_STUDENT)
export const saveSchedule = (coach: Coach, fn: (s: Schedule) => Schedule) => setStored<Schedule>(scheduleKey(coach.slug), fn, seedFor(coach))
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
    .map((n) => ({ key: n.id, kind: "news" as const, title: n.title, start: at(n.start), end: addMinutes(at(n.start), 15), news: n }))
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
