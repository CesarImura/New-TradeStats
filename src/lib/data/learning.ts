"use client"

import type { Coach } from "./coaches"
import type { CourseDraft } from "./communities"
import { readStored, setStored, useStored } from "@/lib/prototype-store"

/**
 * Courses: what the coach builds in Content (ADM-08 to ADM-13) and what
 * students take in Courses (STU-02 to STU-05, STU-29). One catalogue per
 * community, stored in the browser, so admin edits show on the student side.
 * The prototype's "today" is Monday 12 October 2026.
 */

export type Status = "published" | "draft" | "scheduled" | "archived"

export type Chapter = { at: number; title: string; ai?: boolean } // seconds into the video
export type Download = { name: string; size: string }
export type QuizQuestion = { id: string; q: string; options: string[]; answer: number }
export type Quiz = { passMark: number; gate: boolean; questions: QuizQuestion[]; ai?: boolean }

export type Lesson = {
  id: string
  title: string
  minutes: number
  status: Status
  /** Shown to students while locked, e.g. "Thu 15 Oct". */
  unlockAt?: string
  summary?: string
  takeaways?: string[]
  aiSummary?: boolean
  text?: string
  chapters: Chapter[]
  downloads: Download[]
  quiz?: Quiz
  transcript?: string[]
  /** The video file, once uploaded. */
  video?: string
}

export type Module = { id: string; title: string; lessons: Lesson[] }

export type Course = {
  id: string
  title: string
  tagline: string
  area: string
  status: Status
  scheduledFor?: string
  /** Tier ids that get this course. Empty means every tier. */
  tiers: string[]
  /** Index into the brand's series colours, for the cover. */
  color: number
  modules: Module[]
}

export type Catalog = { areas: string[]; courses: Course[] }

export type Progress = {
  done: string[]
  /** Lesson id → notes, each at a moment in the video. */
  notes: Record<string, { at: number; text: string; id: string }[]>
  quiz: Record<string, number>
  last?: string
}

// ---------- seed

const ch = (...rows: [string, string][]): Chapter[] =>
  rows.map(([t, title]) => {
    const [m, s] = t.split(":").map(Number)
    return { at: m * 60 + s, title, ai: true }
  })

const L = (id: string, title: string, minutes: number, extra: Partial<Lesson> = {}): Lesson => ({
  id,
  title,
  minutes,
  status: "published",
  // Drafts in the sample are waiting for their video; everything else has one.
  video: extra.status === "draft" ? undefined : `${title}.mp4`,
  chapters: [],
  downloads: [],
  ...extra,
})

function seed(coach: Coach): Catalog {
  const upper = coach.tiers.slice(1).map((t) => t.id)
  return {
    areas: ["Core", "Strategies", "Inner circle"],
    courses: [
      {
        id: "foundations",
        title: "Foundations",
        tagline: "Market structure, execution and risk",
        area: "Core",
        status: "published",
        tiers: [],
        color: 0,
        modules: [
          {
            id: "m1",
            title: "Market structure",
            lessons: [
              L("l1", "How price really moves", 14, { chapters: ch(["0:00", "Why structure first"], ["3:10", "Auctions and imbalance"], ["9:40", "Reading a chart top-down"]) }),
              L("l2", "Trends, ranges, transitions", 18, { chapters: ch(["0:00", "Three market states"], ["6:20", "Spotting a transition"], ["13:05", "What to trade in each"]) }),
              L("l3", "Marking key levels", 22, {
                chapters: ch(["0:00", "Which levels matter"], ["7:30", "Prior day high and low"], ["15:10", "Clean up your chart"]),
                downloads: [{ name: "Key levels checklist.pdf", size: "180 KB" }],
              }),
            ],
          },
          {
            id: "m2",
            title: "Execution",
            lessons: [
              L("l4", "Entries that don't chase", 16, { chapters: ch(["0:00", "The chase"], ["5:45", "Waiting for the retest"], ["11:20", "Limit or market?"]) }),
              L("l5", "Stops that make sense", 19, {
                summary: "Most stops get hit because they sit where everyone else's sit. Place yours past the next structure level, then size down so the risk stays at 1%.",
                aiSummary: true,
                takeaways: ["Put the stop where the idea is wrong, not where the loss feels small", "Past the next structure level, not just past the wick", "Size the position from the stop, never the other way round"],
                text: "Before the next lesson, go back through your last ten losing trades in the journal. For each one, mark where the idea was actually wrong. How many stops were inside that line?",
                chapters: ch(["0:00", "Why stops get hit"], ["2:40", "Where everyone puts theirs"], ["7:15", "Structure-based stops"], ["12:40", "Sizing from the stop"], ["16:30", "Three examples from last week"]),
                downloads: [
                  { name: "Stop placement cheat sheet.pdf", size: "240 KB" },
                  { name: "Position size calculator.xlsx", size: "36 KB" },
                ],
                transcript: [
                  "0:00 Today we talk about stops, and why most of yours get hit right before the move.",
                  "0:24 Look at this chart from Tuesday. Where would you put the stop on this long?",
                  "2:40 Right below the swing low. Exactly where everybody else put theirs.",
                  "7:15 Instead, ask: where is my idea wrong? Here, it's below the next structure level.",
                  "12:40 That stop is wider, so the position gets smaller. Risk stays at one percent.",
                ],
                quiz: {
                  passMark: 2,
                  gate: true,
                  ai: true,
                  questions: [
                    { id: "q1", q: "Where should the stop go?", options: ["Just below the last candle", "Where the trade idea is proven wrong", "At a fixed 10 points"], answer: 1 },
                    { id: "q2", q: "Your stop gets wider. What changes?", options: ["Nothing", "The position gets smaller", "The target gets closer"], answer: 1 },
                    { id: "q3", q: "Why do obvious stops get hit?", options: ["Bad luck", "Everyone else's stops sit there too", "The broker moves price"], answer: 1 },
                  ],
                },
              }),
            ],
          },
          {
            id: "m3",
            title: "Risk management",
            lessons: [
              L("l6", "Position sizing", 21),
              L("l7", "Daily loss limits", 12, { downloads: [{ name: "Daily limit worksheet.pdf", size: "120 KB" }] }),
              L("l8", "Scaling up safely", 17),
            ],
          },
          {
            id: "m4",
            title: "Building a playbook",
            lessons: [
              L("l9", "What goes in a playbook", 15, { status: "scheduled", unlockAt: "Thu 15 Oct" }),
              L("l10", "Writing your first setup", 20, { status: "scheduled", unlockAt: "Thu 15 Oct" }),
              L("l11", "Reviewing it every Friday", 11, { status: "draft" }),
            ],
          },
        ],
      },
      {
        id: "playbook",
        title: "Price action playbook",
        tagline: "Six setups, step by step",
        area: "Strategies",
        status: "published",
        tiers: [],
        color: 1,
        modules: [
          {
            id: "p1",
            title: "Breakouts",
            lessons: [
              L("p1l1", "Opening range breakout", 24, { chapters: ch(["0:00", "The opening range"], ["8:00", "Entry and stop"], ["17:30", "When to skip it"]) }),
              L("p1l2", "Failed breakout reversal", 20),
            ],
          },
          {
            id: "p2",
            title: "Pullbacks",
            lessons: [L("p2l1", "VWAP reclaim", 18), L("p2l2", "Second-leg pullback", 16)],
          },
        ],
      },
      {
        id: "psychology",
        title: "Trading psychology",
        tagline: "Tilt, patience and routines",
        area: "Inner circle",
        status: "published",
        tiers: upper,
        color: 2,
        modules: [
          { id: "x1", title: "Tilt", lessons: [L("x1l1", "Spotting tilt early", 15), L("x1l2", "Your stop-trading rule", 12)] },
          { id: "x2", title: "Routines", lessons: [L("x2l1", "A morning routine that holds", 14)] },
        ],
      },
      {
        id: "breakdowns",
        title: "Live trade breakdowns",
        tagline: "Every live session, cut into lessons",
        area: "Strategies",
        status: "scheduled",
        scheduledFor: "Thu 29 Oct",
        tiers: [],
        color: 3,
        modules: [{ id: "b1", title: "October", lessons: [L("b1l1", "NY open, 5 Oct", 26, { status: "draft" }), L("b1l2", "NY open, 7 Oct", 31, { status: "draft" })] }],
      },
      {
        id: "risk-lab",
        title: "Risk lab",
        tagline: "Worksheets and drills",
        area: "Core",
        status: "draft",
        tiers: [],
        color: 4,
        modules: [{ id: "r1", title: "Drills", lessons: [L("r1l1", "The 1% drill", 9, { status: "draft" })] }],
      },
      {
        id: "bootcamp-2025",
        title: "2025 bootcamp",
        tagline: "Last year's cohort recordings",
        area: "Core",
        status: "archived",
        tiers: [],
        color: 0,
        modules: [{ id: "c1", title: "Week 1", lessons: [L("c1l1", "Kick-off", 40)] }],
      },
    ],
  }
}

const SEEDS = new Map<string, Catalog>()

const draftsOf = (coach: Coach): CourseDraft[] => {
  const drafts = (coach as { setup?: { courses?: CourseDraft[] } }).setup?.courses
  return Array.isArray(drafts) ? drafts : []
}

const fromDrafts = (drafts: CourseDraft[]): Catalog => ({
  areas: ["Core"],
  courses: drafts.map((d, i) => ({
    id: d.id,
    title: d.title,
    tagline: "Uploaded in setup",
    area: "Core",
    status: "published",
    tiers: [],
    color: i,
    modules: [
      {
        id: `${d.id}-m1`,
        title: "Lessons",
        lessons: d.lessons.map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, status: "published", chapters: [], downloads: [] })),
      },
    ],
  })),
})

// The seed follows the coach's setup uploads, so the wizard preview shows their own
// courses instead of the sample. Without uploads it stays the memoised sample.
const seedFor = (coach: Coach): Catalog => {
  const drafts = draftsOf(coach)
  if (drafts.length > 0) {
    const key = `${coach.slug}:${JSON.stringify(drafts)}`
    if (!SEEDS.has(key)) SEEDS.set(key, fromDrafts(drafts))
    return SEEDS.get(key)!
  }
  if (!SEEDS.has(coach.slug)) SEEDS.set(coach.slug, seed(coach))
  return SEEDS.get(coach.slug)!
}

const START_PROGRESS: Progress = { done: ["l1", "l2", "l3", "l4"], notes: {}, quiz: {}, last: "l5" }

// ---------- reads

const catalogKey = (slug: string) => `catalog:${slug}`
const progressKey = (slug: string) => `progress:${slug}`

export function useCatalog(coach: Coach) {
  return useStored<Catalog>(catalogKey(coach.slug), seedFor(coach))
}

export function useProgress(slug: string) {
  return useStored<Progress>(progressKey(slug), START_PROGRESS)
}

// ---------- writes

export function saveCatalog(coach: Coach, update: (c: Catalog) => Catalog) {
  setStored<Catalog>(catalogKey(coach.slug), (c) => update(c), seedFor(coach))
}

export function resetCatalog(slug: string) {
  setStored(catalogKey(slug), null)
  setStored(progressKey(slug), null)
}

export function updateProgress(slug: string, update: (p: Progress) => Progress) {
  setStored<Progress>(progressKey(slug), (p) => update(p), START_PROGRESS)
}

export function readCatalog(coach: Coach) {
  return readStored<Catalog>(catalogKey(coach.slug), seedFor(coach))
}

// ---------- helpers

export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8)

/** What students can see: published courses and lessons; scheduled lessons show as locked with a date. */
export const visibleLessons = (m: Module) => m.lessons.filter((l) => l.status === "published" || l.status === "scheduled")
export const studentCourses = (c: Catalog) => c.courses.filter((x) => x.status === "published")

export const allLessons = (c: Course) => c.modules.flatMap((m) => m.lessons)
export const openLessons = (c: Course) => allLessons(c).filter((l) => l.status === "published")

export function courseStats(c: Course, p: Progress) {
  const open = openLessons(c)
  const done = open.filter((l) => p.done.includes(l.id)).length
  const minutes = open.reduce((n, l) => n + l.minutes, 0)
  return { lessons: open.length, done, pct: open.length ? Math.round((done / open.length) * 100) : 0, minutes }
}

/** The next published lesson the student hasn't finished. */
export function resumeLesson(c: Course, p: Progress) {
  for (const m of c.modules) for (const l of m.lessons) if (l.status === "published" && !p.done.includes(l.id)) return { module: m, lesson: l }
  return null
}

export function findLesson(c: Course, id: string) {
  for (const m of c.modules) {
    const i = m.lessons.findIndex((l) => l.id === id)
    if (i >= 0) return { module: m, lesson: m.lessons[i] }
  }
  return null
}

/** Previous and next published lessons, across modules. */
export function neighbours(c: Course, id: string) {
  const list = openLessons(c)
  const i = list.findIndex((l) => l.id === id)
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null }
}

export const canAccess = (c: Course, tierId: string | undefined) => c.tiers.length === 0 || (!!tierId && c.tiers.includes(tierId))

/** A gated quiz must be passed before the next lesson opens. */
export function gateBefore(c: Course, lessonId: string, p: Progress) {
  const list = openLessons(c)
  const i = list.findIndex((l) => l.id === lessonId)
  for (let j = 0; j < i; j++) {
    const q = list[j].quiz
    if (q?.gate && (p.quiz[list[j].id] ?? -1) < q.passMark) return list[j]
  }
  return null
}

/** The coach's "Preview as student": drafts show as if they were published. */
export const asPreview = (c: Course): Course => ({
  ...c,
  status: "published",
  modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.status === "draft" ? { ...l, status: "published" } : l)) })),
})

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

export const STATUS_LABEL: Record<Status, string> = { published: "Published", draft: "Draft", scheduled: "Scheduled", archived: "Archived" }
