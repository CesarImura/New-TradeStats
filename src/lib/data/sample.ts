// Sample content shared by all demo coaches. The prototype's "today" is
// Monday 12 October 2026, 09:00.

export const DEMO_STUDENT = { first: "Alex", last: "Moreau", initials: "AM" }

export type Lesson = { id: string; title: string; minutes: number; done: boolean }
export type Module = { id: string; title: string; lessons: Lesson[] }
export type Course = { id: string; title: string; area: string; modules: Module[]; locked?: string; hue: number; tagline: string }

export const COURSES: Course[] = [
  {
    id: "foundations",
    title: "Foundations",
    area: "Core",
    hue: 24,
    tagline: "Market structure, execution and risk",
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
    hue: 210,
    tagline: "Six setups, step by step",
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
    hue: 280,
    tagline: "Tilt, patience and routines",
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
  impact?: "high" | "medium" | "low"
  forecast?: string
  previous?: string
  inMinutes?: number
}

export const EVENTS: CalEvent[] = [
  { id: "e1", kind: "live", title: "Live trading · NY open", day: "Mon", date: "12 Oct", time: "15:30", live: false, inMinutes: 390, seats: "41 signed up" },
  { id: "e2", kind: "call", title: "Q&A call", day: "Tue", date: "13 Oct", time: "18:00", seats: "34 signed up" },
  { id: "e3", kind: "news", title: "US CPI", day: "Wed", date: "14 Oct", time: "14:30", noTrade: true, impact: "high", forecast: "3.1%", previous: "3.2%", inMinutes: 3210 },
  { id: "e4", kind: "workshop", title: "Workshop · Journaling that works", day: "Thu", date: "15 Oct", time: "11:00", seats: "12 of 20 seats" },
  { id: "e5", kind: "one-on-one", title: "1:1 with coach", day: "Fri", date: "16 Oct", time: "16:00" },
  { id: "e6", kind: "news", title: "FOMC minutes", day: "Thu", date: "15 Oct", time: "20:00", impact: "medium" },
  { id: "e7", kind: "news", title: "ECB rate decision", day: "Thu", date: "15 Oct", time: "14:15", impact: "high", forecast: "3.25%", previous: "3.50%", noTrade: true },
  { id: "e8", kind: "news", title: "US retail sales", day: "Fri", date: "16 Oct", time: "14:30", impact: "medium", forecast: "0.3%", previous: "0.6%" },
  { id: "e9", kind: "news", title: "UK GDP", day: "Fri", date: "16 Oct", time: "08:00", impact: "low", forecast: "0.2%", previous: "0.1%" },
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
  author: "Coach",
  pinned: true,
  reactions: 42,
  comments: 9,
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

/** Last four weeks, Monday to Friday, oldest first. 0 = no trades. */
export const JOURNAL_DAYS = [
  [120, -80, 0, 260, 90],
  [-210, 140, 310, -60, 0],
  [80, 0, -150, 420, 180],
  [320, -140, 210, 480, -90],
]

export const RULES = [
  { rule: "Max 1% risk per trade", kept: 19, total: 19 },
  { rule: "No trades 10 min before red news", kept: 17, total: 19 },
  { rule: "Stop never moved further away", kept: 13, total: 19 },
  { rule: "Max 3 trades a day", kept: 18, total: 19 },
]

export const LEADERBOARD = [
  { rank: 1, name: "Jonas P.", initials: "JP", score: 98, change: 0 },
  { rank: 2, name: "Sara K.", initials: "SK", score: 96, change: 2 },
  { rank: 3, name: "Mia S.", initials: "MS", score: 95, change: -1 },
  { rank: 4, name: "Tariq B.", initials: "TB", score: 93, change: 1 },
  { rank: 5, name: "Elena R.", initials: "ER", score: 92, change: -2 },
  { rank: 12, name: "You", initials: "AM", score: 88, change: 4, me: true },
]

export const DISCORD = { members: 2140, online: 128, avatars: ["JP", "SK", "MS", "TB", "ER", "LI"], channels: ["#trade-ideas", "#daily-recap", "#questions"] }

export const PARTNERS = [
  { name: "IC Markets", note: "Broker · our partner", tag: "Partner", color: "#1e3a8a" },
  { name: "FTMO", note: "Prop firm challenges", color: "#0f766e" },
  { name: "TradingView", note: "Charts we use on the lives", color: "#131722" },
  { name: "YouTube", note: "Free weekly breakdowns", color: "#dc2626" },
]

export const AI_SAMPLE = {
  question: "Why do I keep getting stopped out right before the move?",
  answer:
    "Your stops sit just beyond the obvious swing low, where most traders put theirs. In Module 2 the coach suggests placing them past the next structure level and sizing down to keep the 1% risk.",
  source: "Module 2 · Stops that make sense, 12:40",
}

// ---------- Extra series for the visual widgets ("now" is Monday 09:00)

/** Today's schedule, for timeline views. Times as decimal hours. */
export const TODAY = [
  { title: "Market prep", start: 14, end: 14.75, kind: "call" as const },
  { title: "Live trading · NY open", start: 15.5, end: 17, kind: "live" as const },
  { title: "Q&A", start: 18, end: 18.75, kind: "call" as const },
]
export const NOW_HOUR = 9

/** Discipline score per area, 0–100, for the radar view. */
export const DISCIPLINE = [
  { label: "Risk", v: 100 },
  { label: "News", v: 89 },
  { label: "Stops", v: 68 },
  { label: "Trades/day", v: 95 },
  { label: "Journal", v: 80 },
]

/** Last 10 trading days: did the student keep every rule? */
export const RULE_DAYS = [true, true, false, true, true, true, false, true, true, true]

/** Weekly rank over the last 8 weeks (lower is better). */
export const RANK_HISTORY = [31, 27, 25, 22, 20, 18, 16, 12]

/** Messages per hour in the Discord over the last 12 hours. */
export const DISCORD_ACTIVITY = [4, 2, 1, 0, 1, 3, 9, 14, 22, 18, 26, 31]

/** Equity over the last 20 trading days, in euros. */
export const EQUITY = [0, 120, 40, 40, 300, 390, 180, 320, 630, 570, 570, 650, 650, 500, 920, 1100, 1240, 1100, 1310, 1220]
