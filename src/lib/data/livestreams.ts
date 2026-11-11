import { setStored, useStored } from "@/lib/prototype-store"
import type { Coach } from "./coaches"

/**
 * Livestreams: a coach schedules one, connects OBS, goes live, and ends it; the recording lands in Content.
 * Three states, in the words coaches use: before (scheduled), live, after (ended). Kept in the browser like the rest of the prototype.
 */
export type StreamState = "scheduled" | "live" | "ended"

export type ChatMessage = { id: string; who: string; text: string; coach?: boolean }

export type Livestream = {
  id: string
  title: string
  description?: string
  /** When it starts, as local time "2026-11-05T15:00". */
  startsAt: string
  state: StreamState
  /** Tier ids that can watch. Empty means every tier. */
  tiers: string[]
  /** What the coach pastes into OBS with the server address. */
  key: string
  /** When the coach went live (ms since 1970), while it is live. */
  startedAt?: number
  /** Minutes on air, once it ended. */
  minutes?: number
  /** The most people watching at once. */
  peak: number
  viewers: number
  chat: ChatMessage[]
  /** After it ends: the recording is made, then it is ready to use. */
  recording?: "processing" | "ready"
  /** Planned length in minutes (before it starts). */
  planned?: number
  /** Where students find it: the calendar and the Live page, or the Live page only. */
  where?: "both" | "live"
  /** Title of the course its recording was saved into as a lesson. */
  lesson?: string
}

/** Where OBS sends the video. The same for every community: the platform's own streaming address. */
export const STREAM_SERVER = "rtmps://live.tradestats.io:443/app"

const SEED = (): Livestream[] => [
  {
    id: "s1",
    title: "Live session: NY open",
    description: "We trade the first hour together. Bring your questions.",
    startsAt: "2026-11-05T14:30",
    state: "scheduled",
    tiers: [],
    key: "ts_live_9f3k2m8x7q1w4c6v5b0n",
    peak: 0,
    viewers: 0,
    chat: [],
  },
  {
    id: "s2",
    title: "Weekly market review",
    description: "What moved, what we traded and what we are watching next week.",
    startsAt: "2026-10-30T15:00",
    state: "ended",
    tiers: [],
    key: "ts_live_2b7h4j9d3s8a1e6f5g0t",
    minutes: 74,
    peak: 118,
    viewers: 0,
    chat: [
      { id: "m1", who: "Alex", text: "That stop placement made sense, thanks." },
      { id: "m2", who: "Marco", text: "Glad it helped. Same rule on the next one.", coach: true },
      { id: "m3", who: "Dana", text: "Will the recording be up today?" },
    ],
    recording: "ready",
  },
]

const cache = new Map<string, Livestream[]>()
const seedFor = (coach: Coach) => {
  const hit = cache.get(coach.slug)
  if (hit) return hit
  const list = SEED()
  cache.set(coach.slug, list)
  return list
}
const keyOf = (coach: Coach) => `${coach.slug}:livestreams`

export function useLivestreams(coach: Coach) {
  return useStored<Livestream[]>(keyOf(coach), seedFor(coach))
}

export function saveLivestreams(coach: Coach, update: (l: Livestream[]) => Livestream[]) {
  setStored<Livestream[]>(keyOf(coach), update, seedFor(coach))
}

/** Change one livestream. */
export const patchLivestream = (coach: Coach, id: string, patch: Partial<Livestream> | ((s: Livestream) => Partial<Livestream>)) =>
  saveLivestreams(coach, (l) => l.map((s) => (s.id === id ? { ...s, ...(typeof patch === "function" ? patch(s) : patch) } : s)))

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
/** A new stream key: long enough to be private. Only the coach sees it. */
export const newStreamKey = () => "ts_live_" + Array.from({ length: 20 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("")

/** "Thu 5 Nov, 14:30" */
export function whenLabel(startsAt: string) {
  const d = new Date(startsAt)
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
}

export const STATE_LABEL: Record<StreamState, string> = { scheduled: "Before", live: "Live", ended: "After" }

/** "in 2 h 14 min", "in 24 days": how long until a livestream starts, from the prototype's today. */
export function untilLabel(startsAt: string, now = new Date(2026, 9, 12, 9, 0)) {
  const mins = Math.round((new Date(startsAt).getTime() - now.getTime()) / 60000)
  if (mins <= 0) return "now"
  if (mins < 60) return `in ${mins} min`
  if (mins < 48 * 60) return `in ${Math.floor(mins / 60)} h ${mins % 60} min`
  return `in ${Math.round(mins / 1440)} days`
}

/** "1 h 30 min" */
export const lengthLabel = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`)
