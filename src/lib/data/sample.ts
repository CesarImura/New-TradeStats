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
  { day: "Mon", pnl: 312 },
  { day: "Tue", pnl: -137 },
  { day: "Wed", pnl: 214 },
  { day: "Thu", pnl: 476 },
  { day: "Fri", pnl: -85 },
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

/** Last four weeks, Monday to Friday, oldest first. 0 = no trades. */
export const JOURNAL_DAYS = [
  [118, -76, 0, 263, 92],
  [-212, 143, 306, -57, 0],
  [84, 0, -153, 417, 182],
  [312, -137, 214, 476, -85],
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

/** Last 10 trading days: did the student keep every rule? */
export const RULE_DAYS = [true, true, false, true, true, true, false, true, true, true]

/** Weekly rank over the last 8 weeks (lower is better). */
export const RANK_HISTORY = [31, 27, 25, 22, 20, 18, 16, 12]

/** Equity over the last 20 trading days, in euros. */
export const EQUITY = [0, 120, 40, 40, 300, 390, 180, 320, 630, 570, 570, 650, 650, 500, 920, 1100, 1240, 1100, 1310, 1220]

// ---------- Second widget batch (times in the student's time zone, now = Mon 09:00)

export const MARKET_SESSIONS = [
  { name: "Sydney", open: 0, close: 9 },
  { name: "Tokyo", open: 2, close: 11 },
  { name: "London", open: 9, close: 18 },
  { name: "New York", open: 14, close: 23 },
]

/** A funded / prop-firm style account with limits. */
export const ACCOUNT = {
  name: "Funded 50K",
  start: 50000,
  peak: 53100,
  balance: 52340,
  maxDrawdown: 5000, // 10% of start, from peak
  dailyLimit: 2500,
  today: -120,
  history: [50000, 50320, 50180, 50640, 51200, 50900, 51650, 52400, 53100, 52700, 52480, 52340],
}

export const SETUPS = [
  { name: "Opening range breakout", short: "ORB", trades: 14, win: 64, r: 1.4 },
  { name: "Failed breakout", short: "Failed BO", trades: 9, win: 56, r: 0.9 },
  { name: "VWAP reclaim", short: "VWAP", trades: 11, win: 45, r: 0.3 },
  { name: "News fade", short: "News", trades: 5, win: 20, r: -0.6 },
]

export const R_STATS = { expectancy: 0.42, avgWin: 1.8, avgLoss: -0.9, winRate: 44 }

export const FEEDBACK = {
  requested: 6,
  answered: 4,
  avgReplyHours: 9,
  items: [
    { trade: "NQ long · −1.2R", status: "waiting" as const, when: "2 days" },
    { trade: "ES short · +2.4R", status: "answered" as const, when: "yesterday", reply: "Good patience on the entry. Next time scale out at 1R so the runner is free." },
    { trade: "CL long · −0.8R", status: "answered" as const, when: "3 days ago", reply: "You entered before the candle closed. Wait for the close." },
    { trade: "NQ short · +0.6R", status: "waiting" as const, when: "5 hours" },
  ],
}

export const AI_INSIGHT = {
  title: "You give back profits after lunch",
  text: "Morning trades average +0.8R; after 12:00 they average −0.4R.",
  hours: ["09", "10", "11", "12", "13", "14", "15"],
  r: [0.9, 1.1, 0.7, 0.2, -0.3, -0.5, -0.4],
  lesson: "Daily loss limits",
}

export const CALL_SLOTS = [
  { day: "Tue", date: "13 Oct", times: ["10:00", "14:30"] },
  { day: "Wed", date: "14 Oct", times: [] as string[] },
  { day: "Thu", date: "15 Oct", times: ["09:00", "11:00", "16:00"] },
  { day: "Fri", date: "16 Oct", times: ["13:00"] },
]
export const CALL_ALLOWANCE = { used: 1, included: 2, length: 30 }

export const UPGRADE = {
  current: { name: "Core", price: "€149" },
  next: { name: "Trading Desk", price: "€390", cadence: "month" },
  features: [
    { label: "All courses", current: true, next: true },
    { label: "Weekly live sessions", current: true, next: true },
    { label: "Group trade review", current: false, next: true },
    { label: "1:1 call every month", current: false, next: true },
    { label: "Unlimited AI questions", current: false, next: true },
  ],
}

export const COACH_PROFILE = {
  title: "Futures trader since 2012",
  bio: "I trade the NY open on NQ and ES, and teach a rules-first way to do it. No signals, no hype.",
  stats: [
    { label: "Students", value: "182" },
    { label: "Years trading", value: "12" },
    { label: "Rating", value: "4.9" },
  ],
  socials: ["YouTube", "X", "Instagram"],
}
