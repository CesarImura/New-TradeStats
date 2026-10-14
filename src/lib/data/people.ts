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
    id: "s2", name: "Mia Sørensen", initials: "MS", email: "mia.s@proton.me", tier: "desk", progress: 81, lastActive: "today", activeDays: 13, health: "red", reason: "Broke daily loss limit twice",
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

export const COUPONS = [
  { code: "BLACKFRIDAY", discount: "40% for 3 months", uses: "0 of 200", expires: "30 Nov 2026", active: true },
  { code: "WELCOME10", discount: "€10 off first month", uses: "86", expires: "never", active: true },
  { code: "YOUTUBE", discount: "7-day free trial", uses: "212", expires: "never", active: true },
  { code: "SUMMER", discount: "25% for 1 month", uses: "48 of 50", expires: "31 Aug 2026", active: false },
]

export type Txn = { id: string; when: string; who: string; what: string; amount: number; status: "paid" | "failed" | "refunded" | "retrying" | "disputed" }
export const TRANSACTIONS: Txn[] = [
  { id: "x1", when: "Today 07:12", who: "Alex Moreau", what: "Core · monthly", amount: 149, status: "failed" },
  { id: "x2", when: "Today 06:40", who: "Noah Fischer", what: "Trading Desk · monthly", amount: 390, status: "paid" },
  { id: "x3", when: "Sun 11 Oct", who: "Sara Kowalski", what: "Trading Desk · monthly", amount: 390, status: "paid" },
  { id: "x4", when: "Sat 10 Oct", who: "Ben Okafor", what: "Core · monthly", amount: 149, status: "retrying" },
  { id: "x5", when: "Fri 9 Oct", who: "Lucía Gómez", what: "Core · monthly", amount: 149, status: "refunded" },
  { id: "x6", when: "Thu 8 Oct", who: "Jonas Pereira", what: "1:1 VIP · quarterly", amount: 2400, status: "paid" },
  { id: "x7", when: "Wed 7 Oct", who: "Kim Ahn", what: "Core · monthly", amount: 149, status: "disputed" },
  { id: "x8", when: "Wed 7 Oct", who: "Tariq Bello", what: "Core · monthly", amount: 149, status: "paid" },
]

export const MONEY = {
  mrr: 37180,
  mrrChange: 6.2,
  month: 17940,
  fees: { label: "Our share (5%) and card fees", amount: 1420 },
  nextPayout: { amount: 4210, date: "Mon 19 Oct" },
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

export const AI_FEATURES = [
  { id: "chat", name: "Ask anything", text: "Students chat with your AI about lessons and trading questions" },
  { id: "trade", name: "Ask about a trade", text: "From a journal trade: what went right, which rule it broke" },
  { id: "lesson", name: "Lesson summaries and quiz", text: "Summary, chapters and quiz in every lesson" },
  { id: "weekly", name: "Weekly summary", text: "A short review of the student's week in the journal" },
  { id: "briefing", name: "Briefing before a 1:1", text: "Only for you: what the student traded and asked" },
]

export const AI_KNOWLEDGE = [
  { id: "k1", name: "Foundations", kind: "Course", items: "8 lessons · transcripts", on: true },
  { id: "k2", name: "Price action playbook", kind: "Course", items: "2 lessons · transcripts", on: true },
  { id: "k3", name: "Live session recordings", kind: "Recordings", items: "24 recordings", on: true },
  { id: "k4", name: "Northline rulebook.pdf", kind: "Document", items: "18 pages", on: true },
  { id: "k5", name: "FAQ", kind: "FAQ", items: "32 questions", on: true },
  { id: "k6", name: "Trading psychology", kind: "Course", items: "1 lesson · Inner Circle only", on: false },
]

export const AI_QUESTIONS = [
  { q: "Where exactly do I put my stop on an ORB?", n: 41, lesson: "Stops that make sense", answered: true },
  { q: "How many contracts for a 50K account?", n: 33, lesson: "Position sizing", answered: true },
  { q: "Should I trade during CPI?", n: 27, lesson: "Daily loss limits", answered: true },
  { q: "What's the difference between a failed breakout and a reversal?", n: 19, lesson: "Failed breakout reversal", answered: true },
  { q: "Which prop firm do you recommend?", n: 16, lesson: "–", answered: false },
  { q: "How do I handle overnight gaps?", n: 11, lesson: "–", answered: false },
]

export const AI_USAGE = [
  { tier: "core", used: 2140, quota: 30 },
  { tier: "desk", used: 1210, quota: 100 },
  { tier: "vip", used: 220, quota: 0 },
]

// ---------- Ranking

export const RANK_METRICS = [
  { id: "discipline", name: "Discipline", text: "How well rules are kept" },
  { id: "consistency", name: "Consistency", text: "Steady results, small drawdowns" },
  { id: "return", name: "Return in %", text: "Only from verified broker trades" },
  { id: "progress", name: "Course progress", text: "Lessons done" },
  { id: "activity", name: "Activity", text: "Journal entries, reviews, lives attended" },
]

export const COMPETITIONS = [
  { id: "c1", name: "October consistency cup", metric: "consistency", start: "1 Oct", end: "31 Oct", prize: "Free month of Trading Desk", entrants: 64, status: "running" as const },
  { id: "c2", name: "Rulebook November", metric: "discipline", start: "2 Nov", end: "30 Nov", prize: "1:1 call with Marco", entrants: 0, status: "scheduled" as const },
  { id: "c3", name: "September sprint", metric: "return", start: "1 Sep", end: "30 Sep", prize: "€500 funded account", entrants: 81, status: "ended" as const },
]

export const POINTS = [
  { action: "Finish a lesson", points: 10 },
  { action: "Log a trade with notes", points: 5 },
  { action: "Keep every rule for a day", points: 15 },
  { action: "Attend a live session", points: 20 },
  { action: "Ask for a review", points: 5 },
]
export const LEVELS = [
  { name: "Rookie", from: 0 },
  { name: "Trader", from: 250 },
  { name: "Disciplined", from: 750 },
  { name: "Pro", from: 2000 },
  { name: "Elite", from: 5000 },
]
export const BADGES = [
  { name: "First trade logged", earned: 412 },
  { name: "7-day streak", earned: 158 },
  { name: "Rulebook keeper", earned: 61 },
  { name: "Course finished", earned: 94 },
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
