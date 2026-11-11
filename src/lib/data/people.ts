// Coach-side sample data: students, team, money, AI, ranking.
// The prototype's "today" is Monday 12 October 2026, 09:00.

import type { Health } from "./sample"

export type Student = {
  id: string
  name: string
  initials: string
  email: string
  tier: string // tier id
  group?: string
  progress: number
  lastActive: string
  activeDays: number // of the last 14
  health: Health
  reason?: string
  joined: string
  paid: number // lifetime, euro
  broker: boolean
  discord: boolean
  country: string
  coach?: string // assistant coach
  trades30: number
  rules: number // % rules kept, last 30 days
  notes: { by: string; when: string; text: string }[]
  history: { when: string; text: string }[]
}

const H = (when: string, text: string) => ({ when, text })

export const STUDENTS: Student[] = [
  {
    id: "s1", name: "Alex Moreau", initials: "AM", email: "alex.moreau@mail.com", tier: "core", group: "October cohort", progress: 62, lastActive: "today", activeDays: 11, health: "red", reason: "Payment failed",
    joined: "3 Mar 2026", paid: 1043, broker: true, discord: true, country: "FR", trades30: 41, rules: 84,
    notes: [{ by: "Marco", when: "2 Oct", text: "Wants to pass a 50K funded challenge before December. Push the daily loss limit module." }],
    history: [H("Today 07:12", "Payment of €149 failed (card expired)"), H("Fri 9 Oct", "Asked for review: NQ long −1.2R"), H("1 Oct", "Joined October cohort"), H("3 Mar", "Joined Core")],
  },
  {
    id: "s2", name: "Mia Sørensen", initials: "MS", email: "mia.s@proton.me", tier: "desk", progress: 81, lastActive: "today", activeDays: 13, health: "amber", reason: "Broke loss limit twice",
    joined: "12 Jan 2026", paid: 3510, broker: true, discord: true, country: "DK", coach: "Jana", trades30: 68, rules: 71,
    notes: [{ by: "Jana", when: "8 Oct", text: "Revenge trades after the first loss. Suggest a hard stop after −2R." }],
    history: [H("Fri 9 Oct", "Broke daily loss limit"), H("Wed 7 Oct", "Broke daily loss limit"), H("12 Jan", "Joined Trading Desk")],
  },
  {
    id: "s3", name: "Tom Becker", initials: "TB", email: "tom.becker@web.de", tier: "core", progress: 23, lastActive: "9 days ago", activeDays: 2, health: "amber", reason: "Inactive for 9 days",
    joined: "20 Aug 2026", paid: 298, broker: false, discord: false, country: "DE", trades30: 0, rules: 0, notes: [],
    history: [H("3 Oct", "Last login"), H("20 Aug", "Joined Core")],
  },
  {
    id: "s4", name: "Lena Ito", initials: "LI", email: "lena.ito@gmail.com", tier: "core", group: "October cohort", progress: 35, lastActive: "yesterday", activeDays: 8, health: "amber", reason: "Stuck in Module 2 for 12 days",
    joined: "28 Sep 2026", paid: 149, broker: true, discord: true, country: "JP", trades30: 17, rules: 88, notes: [],
    history: [H("Thu 8 Oct", "Asked for review: CL long −0.8R"), H("28 Sep", "Joined Core")],
  },
  {
    id: "s5", name: "Jonas Pereira", initials: "JP", email: "jonas@pereira.pt", tier: "vip", progress: 94, lastActive: "today", activeDays: 14, health: "green",
    joined: "2 Nov 2025", paid: 9600, broker: true, discord: true, country: "PT", trades30: 52, rules: 96, notes: [{ by: "Marco", when: "30 Sep", text: "Ready to size up. Talk about scaling plan on next 1:1." }],
    history: [H("Thu 8 Oct", "Asked for review: ES short +2.4R"), H("2 Nov 2025", "Joined 1:1 VIP")],
  },
  {
    id: "s6", name: "Sara Kowalski", initials: "SK", email: "sara.kowalski@o2.pl", tier: "desk", progress: 70, lastActive: "2 days ago", activeDays: 10, health: "green",
    joined: "5 May 2026", paid: 2340, broker: true, discord: true, country: "PL", coach: "Jana", trades30: 33, rules: 92, notes: [], history: [H("5 May", "Joined Trading Desk")],
  },
  {
    id: "s7", name: "Tariq Bello", initials: "TB", email: "tariq.bello@icloud.com", tier: "core", group: "October cohort", progress: 48, lastActive: "today", activeDays: 12, health: "green",
    joined: "30 Sep 2026", paid: 149, broker: true, discord: true, country: "NG", trades30: 22, rules: 90, notes: [], history: [H("30 Sep", "Joined Core")],
  },
  {
    id: "s8", name: "Elena Rossi", initials: "ER", email: "elena.rossi@libero.it", tier: "core", progress: 57, lastActive: "yesterday", activeDays: 9, health: "green",
    joined: "14 Jun 2026", paid: 745, broker: false, discord: true, country: "IT", trades30: 0, rules: 0, notes: [], history: [H("14 Jun", "Joined Core")],
  },
  {
    id: "s9", name: "Noah Fischer", initials: "NF", email: "noah.f@gmx.ch", tier: "desk", progress: 12, lastActive: "today", activeDays: 3, health: "green",
    joined: "10 Oct 2026", paid: 390, broker: false, discord: false, country: "CH", trades30: 0, rules: 0, notes: [], history: [H("10 Oct", "Joined Trading Desk")],
  },
  {
    id: "s10", name: "Ava Lindqvist", initials: "AL", email: "ava.lindqvist@me.com", tier: "core", progress: 0, lastActive: "never", activeDays: 0, health: "amber", reason: "Invited 6 days ago, hasn't joined",
    joined: "invited 6 Oct", paid: 0, broker: false, discord: false, country: "SE", trades30: 0, rules: 0, notes: [], history: [H("6 Oct", "Invited by e-mail")],
  },
]

export const GROUPS = [
  { id: "oct", name: "October cohort", start: "1 Oct 2026", end: "17 Dec 2026", seats: 30, members: 24, waiting: 0, tiers: ["core", "desk"] },
  { id: "nov", name: "November cohort", start: "2 Nov 2026", end: "21 Jan 2027", seats: 30, members: 11, waiting: 0, tiers: ["core", "desk"] },
  { id: "mastermind", name: "Funded mastermind", start: "5 Oct 2026", end: "30 Nov 2026", seats: 12, members: 12, waiting: 7, tiers: ["desk", "vip"] },
]

/** A discount code. `tiers` empty means every tier; `ends` is an ISO date or empty for no end. */
export type Coupon = { /** `discount` and `active` are what the checkout reads; they follow the fields below. */ discount: string; active: boolean; code: string; kind: "percent" | "amount"; amount: number; duration: "first" | "3" | "forever"; tiers: string[]; used: number; limit?: number; ends?: string; paused?: boolean }
export const COUPONS: Coupon[] = [
  { discount: "20% off · first payment", active: true, code: "AUTUMN20", kind: "percent", amount: 20, duration: "first", tiers: [], used: 34, limit: 100, ends: "2026-11-30" },
  { discount: "€50 off · forever", active: true, code: "DESK50", kind: "amount", amount: 50, duration: "forever", tiers: ["desk"], used: 6, limit: 20 },
  { discount: "30% off · 3 months", active: false, code: "BF2025", kind: "percent", amount: 30, duration: "3", tiers: [], used: 100, limit: 100, ends: "2025-12-01" },
]

export const COUPON_TODAY = "2026-10-12"
/** "20% off · first payment" */
export const couponLabel = (c: Coupon) => `${c.kind === "percent" ? `${c.amount}%` : `€${c.amount}`} off · ${c.duration === "first" ? "first payment" : c.duration === "3" ? "3 months" : "forever"}`
/** Out of date or out of uses. */
export const couponEnded = (c: Coupon) => (!!c.ends && c.ends < COUPON_TODAY) || (c.limit !== undefined && c.used >= c.limit)

export type Txn = { id: string; when: string; who: string; what: string; amount: number; status: "paid" | "failed" | "refunded" | "retrying" | "disputed" }
export const TRANSACTIONS: Txn[] = [
  { id: "x1", when: "Today 09:12", who: "Lena Ito", what: "1:1 VIP · instalment 2 of 3", amount: 130, status: "paid" },
  { id: "x2", when: "Today 06:00", who: "Alex Moreau", what: "Inner Circle · monthly", amount: 49, status: "retrying" },
  { id: "x3", when: "Yesterday", who: "Jonas Weber", what: "1:1 VIP", amount: 390, status: "disputed" },
  { id: "x4", when: "Yesterday", who: "Mia Sørensen", what: "Trading Desk · monthly", amount: 129, status: "paid" },
  { id: "x5", when: "2 d ago", who: "Tom Okafor", what: "Trading Desk · monthly", amount: 129, status: "failed" },
  { id: "x6", when: "3 d ago", who: "Priya Nair", what: "Inner Circle · AUTUMN20", amount: 39.2, status: "paid" },
]
/** Counts the Transactions filters show (the sample list above is only the newest few). */
export const TXN_COUNTS = { all: 1204, failed: 2, disputed: 1, refunded: 4 }

export const MONEY = {
  mrr: 37180,
  mrrChange: 6.2,
  month: 31204,
  fees: { label: "Our share (5%) and card fees", amount: 1118 },
  share: 1859,
  mrrMore: 2180,
  nextPayout: { amount: 8412, date: "Mon 17 Nov" },
  churn: 3.1,
  trials: 14,
}

export const TEAM = [
  { name: "Lionel Imura", initials: "LI", email: "lionel@northline.trade", role: "Owner", students: "All" },
  { name: "Jana Novak", initials: "JN", email: "jana@northline.trade", role: "Assistant coach", students: "2 assigned" },
  { name: "Ravi Patel", initials: "RP", email: "ravi@northline.trade", role: "Moderator", students: "–" },
]
export const ROLES = [
  { id: "owner", name: "Owner", text: "Everything, including money and the team" },
  { id: "admin", name: "Admin", text: "Everything except payouts and our subscription" },
  { id: "coach", name: "Assistant coach", text: "Their students: feedback, notes, calls" },
  { id: "moderator", name: "Moderator", text: "Community and announcements" },
]

export const EMAIL_TEMPLATES = [
  { id: "code", name: "Login code", subject: "Your code for {platform}", body: "Hi {first},\n\nYour code is {code}. It works for 10 minutes." },
  { id: "welcome", name: "Welcome", subject: "Welcome to {platform}", body: "Hi {first},\n\nGlad you're here. Start with the first lesson: {link}\n\n{coach}" },
  { id: "receipt", name: "Receipt and invoice", subject: "Your receipt from {platform}", body: "Thanks for your payment of {amount}. Your invoice is attached." },
  { id: "trial", name: "Trial ending", subject: "Your trial ends in 2 days", body: "Hi {first},\n\nYour free trial ends on {date}. Nothing to do if you want to stay." },
  { id: "failed", name: "Payment failed", subject: "Your payment didn't go through", body: "Hi {first},\n\nWe couldn't take your payment. Update your card here: {link}" },
  { id: "lesson", name: "New lesson", subject: "New: {lesson}", body: "{coach} published a new lesson: {lesson}.\n\n{link}" },
  { id: "event", name: "Event reminder", subject: "{event} starts in 1 hour", body: "Join here: {link}" },
  { id: "feedback", name: "Feedback received", subject: "{coach} reviewed your trade", body: "{coach} left feedback on your {trade} trade.\n\n{link}" },
]

export const LEGAL = [
  { id: "imprint", name: "Imprint", text: "Northline Trading GmbH\nBahnhofstrasse 1, 8001 Zürich, Switzerland\nCommercial register: CHE-123.456.789" },
  { id: "terms", name: "Terms", text: "1. Scope\nThese terms apply to all memberships of Northline Trading…" },
  { id: "privacy", name: "Privacy", text: "We process your data to provide the platform. Our payment partner processes payments…" },
  { id: "risk", name: "Risk warning", text: "Trading futures, forex and CFDs carries a high level of risk. Education only, no investment advice. Past results do not guarantee future results." },
]

// ---------- AI

/** What the AI can do for students. `plan` is off until the coach turns it on. */
export const AI_FEATURES = [
  { id: "answer", name: "Answer questions", on: true },
  { id: "journal", name: "Review a journal entry", on: true },
  { id: "lesson", name: "Explain a lesson", on: true },
  { id: "plan", name: "Pre-market plan", on: false },
]
/** Questions per day, per student, for each paid tier in order. null means the tier doesn't get the feature, 0 means unlimited. */
export const AI_LIMITS: Record<string, (number | null)[]> = {
  answer: [20, 50, 0],
  journal: [null, 5, 20],
  lesson: [10, 30, 0],
  plan: [null, null, 1],
}

export const AI_KNOWLEDGE = [
  { id: "k1", name: "Foundations", kind: "Course", items: "11 lessons", on: true, updated: "2 h ago" },
  { id: "k2", name: "Price action playbook", kind: "Course", items: "4 lessons", on: true, updated: "yesterday" },
  { id: "k3", name: "Risk rules.pdf", kind: "PDF", items: "12 pages", on: true, updated: "3 d ago" },
  { id: "k4", name: "FAQ from Discord", kind: "Q&A list", items: "48 answers", on: true, updated: "now", learning: true },
  { id: "k5", name: "Trading psychology", kind: "Course", items: "3 lessons", on: false, updated: "—" },
]

export type AiResult = "answered" | "handed" | "blocked"
/** What students asked lately: who, what, where the answer came from, how it ended. */
export const AI_QUESTIONS: { id: string; student: string; initials: string; q: string; from?: string; result: AiResult; ago: string }[] = [
  { id: "q1", student: "Mia Sørensen", initials: "MS", q: "Where do I put my stop on an ORB?", from: "Foundations · Lesson 4", result: "answered", ago: "2 h" },
  { id: "q2", student: "Alex Moreau", initials: "AM", q: "Can I trade during NFP?", from: "Your rules", result: "answered", ago: "3 h" },
  { id: "q3", student: "Lena Ito", initials: "LI", q: "Is my position size right for 2k?", result: "handed", ago: "5 h" },
  { id: "q4", student: "Jonas Weber", initials: "JW", q: "What's the best broker?", result: "blocked", ago: "1 d" },
]

// ---------- Ranking

export const RANK_METRICS = [
  { id: "discipline", name: "Discipline", text: "How well rules are kept" },
  { id: "consistency", name: "Consistency", text: "Steady results, small drawdowns" },
  { id: "return", name: "Return in %", text: "Only from verified broker trades" },
  { id: "progress", name: "Course progress", text: "Lessons done" },
  { id: "activity", name: "Activity", text: "Journal entries, reviews, lives attended" },
]

export type Competition = { id: string; name: string; metric: "rules" | "journal" | "points"; start: string; end: string; prize: string; entrants: number; winner?: string; who: "everyone" | "pick"; /** Tier and group ids when `who` is "pick". */ picked?: string[]; nicknames: boolean; /** Kept for the student side, which reads it. */ status?: "running" | "scheduled" | "ended" }
export const COMPETITIONS: Competition[] = [
  { id: "c1", name: "November discipline cup", metric: "rules", start: "2026-11-15", end: "2026-11-30", prize: "A free month", entrants: 64, who: "everyone", nicknames: true, status: "scheduled" },
  { id: "c2", name: "October consistency cup", metric: "journal", start: "2026-10-01", end: "2026-10-31", prize: "Bragging rights", entrants: 52, winner: "Sara Kowalski", who: "everyone", nicknames: true, status: "ended" },
]
export const RANK_TODAY = "2026-11-07"
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** "2026-11-15" → "Sat 15 Nov" */
export const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`
}
const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86400000)
export type CompetitionState = { status: "upcoming" | "running" | "ended"; days: number }
/** Where a competition is today: it starts in `days`, ends in `days`, or is over. */
export const competitionState = (c: Competition): CompetitionState =>
  c.end < RANK_TODAY ? { status: "ended", days: 0 } : c.start > RANK_TODAY ? { status: "upcoming", days: daysBetween(RANK_TODAY, c.start) } : { status: "running", days: daysBetween(RANK_TODAY, c.end) }

export const COMPETITION_METRICS = [{ value: "rules", label: "Rules kept" }, { value: "journal", label: "Journal entries" }, { value: "points", label: "Points" }] as const

export const POINTS = [
  { action: "Finish a lesson", points: 10, on: true },
  { action: "Log a trade in the journal", points: 5, on: true },
  { action: "Keep every rule for a day", points: 20, on: true },
  { action: "Join a livestream", points: 5, on: false },
]
export const LEVELS = [
  { name: "Rookie", from: 0 },
  { name: "Trader", from: 250 },
  { name: "Disciplined", from: 750 },
  { name: "Pro", from: 2000 },
  { name: "Elite", from: 5000 },
]
/** The badges the admin lists, with how each is earned. */
export const ADMIN_BADGES = [
  { id: "b1", name: "First 10 trades", text: "Logged 10 journal entries", earned: 142 },
  { id: "b2", name: "Rule keeper", text: "7 days with every rule kept", earned: 38 },
  { id: "b3", name: "Course finisher", text: "Finished a course", earned: 61 },
]
export const BADGES = [
  { name: "First trade logged", earned: 412 },
  { name: "7-day streak", earned: 158 },
  { name: "Rule keeper", earned: 61 },
  { name: "Course finisher", earned: 94 },
  { name: "Asked for feedback", earned: 203 },
]

// ---------- Community

export const ANNOUNCEMENTS = [
  { id: "n1", title: "New module: Daily loss limits", body: "Watch it before Wednesday's CPI. We'll go through your limits on Thursday's call.", when: "2 hours ago", pinned: true, channels: ["platform", "email", "discord"], reads: 128 },
  { id: "n2", title: "Live this Thursday moves to 15:00", body: "ECB at 14:15, so we start a bit later and trade the reaction.", when: "Fri 9 Oct", pinned: false, channels: ["platform", "discord"], reads: 164 },
  { id: "n3", title: "November cohort is open", body: "11 seats left. Members of the October cohort get the replays for free.", when: "Mon 5 Oct", pinned: false, channels: ["platform", "email"], reads: 171 },
]

export const DISCORD_ROLES = [
  { tier: "core", role: "@Core" },
  { tier: "desk", role: "@Trading Desk" },
  { tier: "vip", role: "@VIP" },
]

// ---------- Tiers across communities

const TIER_ORDER = ["core", "desk", "vip"]

/** The sample students use Northline's tier ids; other communities map them by position. */
export function tierFor(coach: { tiers: { id: string; name: string }[] }, id: string) {
  const direct = coach.tiers.find((t) => t.id === id)
  if (direct) return direct
  const i = Math.max(0, TIER_ORDER.indexOf(id))
  return coach.tiers[Math.min(i, coach.tiers.length - 1)] ?? { id, name: id }
}
