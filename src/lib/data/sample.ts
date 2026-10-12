// Sample content shared by all demo coaches. The prototype's "today" is
// Monday 12 October 2026, 09:00.

export const DEMO_STUDENT = { first: "Alex", last: "Moreau", initials: "AM" }

export type Lesson = { id: string; title: string; minutes: number; done: boolean }
export type Module = { id: string; title: string; lessons: Lesson[] }
export type Course = { id: string; title: string; area: string; modules: Module[]; locked?: string }

export const COURSES: Course[] = [
  {
    id: "foundations",
    title: "Foundations",
    area: "Core",
    modules: [
      {
        id: "m1",
        title: "Module 1 · Market structure",
        lessons: [
          { id: "l1", title: "How price really moves", minutes: 14, done: true },
          { id: "l2", title: "Trends, ranges, transitions", minutes: 18, done: true },
          { id: "l3", title: "Marking key levels", minutes: 22, done: true },
        ],
      },
      {
        id: "m2",
        title: "Module 2 · Execution",
        lessons: [
          { id: "l4", title: "Entries that don't chase", minutes: 16, done: true },
          { id: "l5", title: "Stops that make sense", minutes: 19, done: false },
        ],
      },
      {
        id: "m3",
        title: "Module 3 · Risk management",
        lessons: [
          { id: "l6", title: "Position sizing", minutes: 21, done: false },
          { id: "l7", title: "Daily loss limits", minutes: 12, done: false },
          { id: "l8", title: "Scaling up safely", minutes: 17, done: false },
        ],
      },
    ],
  },
  {
    id: "playbook",
    title: "Price action playbook",
    area: "Core",
    modules: [
      {
        id: "p1",
        title: "Setups",
        lessons: [
          { id: "p1l1", title: "Opening range breakout", minutes: 24, done: false },
          { id: "p1l2", title: "Failed breakout reversal", minutes: 20, done: false },
        ],
      },
    ],
  },
  {
    id: "psychology",
    title: "Trading psychology",
    area: "Inner circle",
    locked: "Inner Circle",
    modules: [{ id: "x1", title: "Tilt", lessons: [{ id: "x1l1", title: "Spotting tilt early", minutes: 15, done: false }] }],
  },
]

export function courseProgress(c: Course) {
  const all = c.modules.flatMap((m) => m.lessons)
  return Math.round((all.filter((l) => l.done).length / all.length) * 100)
}

export function nextLesson(c: Course) {
  for (const m of c.modules) for (const l of m.lessons) if (!l.done) return { module: m, lesson: l }
  return null
}

export type EventKind = "live" | "call" | "workshop" | "one-on-one" | "news"
export type CalEvent = {
  id: string
  kind: EventKind
  title: string
  day: string // e.g. "Mon"
  date: string // e.g. "12 Oct"
  time: string
  live?: boolean
  noTrade?: boolean
  seats?: string
}

export const EVENTS: CalEvent[] = [
  { id: "e1", kind: "live", title: "Live trading · NY open", day: "Mon", date: "12 Oct", time: "15:30", live: false },
  { id: "e2", kind: "call", title: "Q&A call", day: "Tue", date: "13 Oct", time: "18:00", seats: "34 signed up" },
  { id: "e3", kind: "news", title: "US CPI", day: "Wed", date: "14 Oct", time: "14:30", noTrade: true },
  { id: "e4", kind: "workshop", title: "Workshop · Journaling that works", day: "Thu", date: "15 Oct", time: "11:00", seats: "12 of 20 seats" },
  { id: "e5", kind: "one-on-one", title: "1:1 with coach", day: "Fri", date: "16 Oct", time: "16:00" },
  { id: "e6", kind: "news", title: "FOMC minutes", day: "Thu", date: "15 Oct", time: "20:00" },
]

export const JOURNAL_WEEK = [
  { day: "Mon", pnl: 320 },
  { day: "Tue", pnl: -140 },
  { day: "Wed", pnl: 210 },
  { day: "Thu", pnl: 480 },
  { day: "Fri", pnl: -90 },
]

export const JOURNAL_STATS = { pnl: 780, winRate: 58, trades: 19, rulesFollowed: 84 }

export const ANNOUNCEMENT = {
  title: "New module: Daily loss limits",
  body: "Watch it before Wednesday's CPI. We'll go through your limits on Thursday's call.",
  when: "2 hours ago",
}

// ---------- Coach side

export type Health = "red" | "amber" | "green"
export type AdminStudent = {
  id: string
  name: string
  initials: string
  tier: string
  group?: string
  progress: number
  lastActive: string
  health: Health
  reason?: string
}

export const ADMIN_STUDENTS: AdminStudent[] = [
  { id: "s1", name: "Alex Moreau", initials: "AM", tier: "Core", group: "October cohort", progress: 62, lastActive: "today", health: "red", reason: "Payment failed" },
  { id: "s2", name: "Mia Sørensen", initials: "MS", tier: "Trading Desk", progress: 81, lastActive: "today", health: "red", reason: "Broke daily loss limit twice" },
  { id: "s3", name: "Tom Becker", initials: "TB", tier: "Core", progress: 23, lastActive: "9 days ago", health: "amber", reason: "Inactive for 9 days" },
  { id: "s4", name: "Lena Ito", initials: "LI", tier: "Core", group: "October cohort", progress: 35, lastActive: "yesterday", health: "amber", reason: "Stuck in Module 2 for 12 days" },
  { id: "s5", name: "Jonas Pereira", initials: "JP", tier: "1:1 VIP", progress: 94, lastActive: "today", health: "green" },
  { id: "s6", name: "Sara Kowalski", initials: "SK", tier: "Trading Desk", progress: 70, lastActive: "2 days ago", health: "green" },
]

export const FEEDBACK_REQUESTS = [
  { id: "f1", student: "Mia Sørensen", initials: "MS", trade: "NQ long · −1.2R", note: "Was my stop too tight here?", waiting: "2 days" },
  { id: "f2", student: "Jonas Pereira", initials: "JP", trade: "ES short · +2.4R", note: "Took partials early, right call?", waiting: "1 day" },
  { id: "f3", student: "Lena Ito", initials: "LI", trade: "CL long · −0.8R", note: "Entered before confirmation again.", waiting: "5 hours" },
]

export const REVENUE_MONTHS = [
  { month: "May", revenue: 11200 },
  { month: "Jun", revenue: 12900 },
  { month: "Jul", revenue: 13650 },
  { month: "Aug", revenue: 15100 },
  { month: "Sep", revenue: 16480 },
  { month: "Oct", revenue: 17940 },
]

export const GETTING_STARTED = [
  { id: "design", label: "Design and logo", done: true },
  { id: "tier", label: "Create your first tier", done: true },
  { id: "course", label: "Add a course", done: true },
  { id: "payments", label: "Set up payments", done: true },
  { id: "live", label: "Create the first live session", done: false },
  { id: "discord", label: "Connect Discord", done: false },
  { id: "invite", label: "Invite students", done: false },
]
