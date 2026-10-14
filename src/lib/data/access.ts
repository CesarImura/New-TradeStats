"use client"

import { useSearchParams } from "next/navigation"
import type { Coach, Tier } from "./coaches"
import type { Course } from "./learning"
import { readStored, setStored, useStored } from "@/lib/prototype-store"

/**
 * Tiers, groups and access (ADM-14, ADM-15, ADM-29 to ADM-31). One store per
 * community, so what the coach sets in the admin shows on the sales page,
 * the checkout and the student side. Prices are for show: the prototype
 * takes no payments.
 */

// ---------- tiers

export type TierExtra = {
  name?: string
  price?: string
  cadence?: string
  yearly?: string
  trial: number
  installments: boolean
  hidden: boolean
  role: string
  /** One line under the name on the sales page. */
  description: string
  /** What the sales page lists for this tier. */
  features: string[]
  /** Marked "Most popular" on the sales page. */
  featured?: boolean
}

export type TierInfo = Tier & Omit<TierExtra, "name" | "price" | "cadence">

const NO_EXTRA: Record<string, TierExtra> = {}
const NO_TIERS: Tier[] = []

const FEATURES = [
  ["All core courses", "Weekly live session", "Community and Discord", "AI questions: 20 a month"],
  ["Everything in the first tier", "Daily live trading desk", "Group trade reviews", "Unlimited AI questions"],
  ["Everything in the tiers before", "1:1 call every month", "Personal trading plan", "Direct line to the coach"],
]

export function blankExtra(i: number): TierExtra {
  return { trial: i === 0 ? 7 : 0, installments: false, hidden: false, role: "", description: "", features: FEATURES[Math.min(i, 2)], featured: i === 1 }
}

/** The coach's tiers with every edit made in Sales & payments. */
export function useTiers(coach: Coach): TierInfo[] {
  const extra = useStored(`${coach.slug}:tier-extra`, NO_EXTRA)
  const added = useStored(`${coach.slug}:tiers-added`, NO_TIERS)
  return mergeTiers(coach, extra, added)
}

export function readTiers(coach: Coach): TierInfo[] {
  return mergeTiers(coach, readStored(`${coach.slug}:tier-extra`, NO_EXTRA), readStored(`${coach.slug}:tiers-added`, NO_TIERS))
}

function mergeTiers(coach: Coach, extra: Record<string, TierExtra>, added: Tier[]): TierInfo[] {
  return [...coach.tiers, ...added].map((t, i) => {
    const x = { ...blankExtra(i), ...extra[t.id] }
    const { name, price, cadence, ...rest } = x
    return { ...t, ...rest, name: name ?? t.name, price: price ?? t.price, cadence: cadence ?? t.cadence }
  })
}

export function saveTier(slug: string, id: string, index: number, patch: Partial<TierExtra>) {
  setStored<Record<string, TierExtra>>(`${slug}:tier-extra`, (all) => ({ ...all, [id]: { ...blankExtra(index), ...all[id], ...patch } }), NO_EXTRA)
}

export function addTier(slug: string): Tier {
  const t = { id: `t${Date.now()}`, name: "New tier", price: "€99", cadence: "month", members: 0 }
  setStored<Tier[]>(`${slug}:tiers-added`, (a) => [...a, t], NO_TIERS)
  return t
}

export const amount = (price: string) => Number(price.replace(/[^\d.]/g, "")) || 0
export const per = (cadence: string) => (cadence === "once" ? "once" : cadence === "quarter" ? "/ 3 months" : `/ ${cadence}`)

// ---------- groups

export type Group = {
  id: string
  name: string
  /** ISO dates, so the inputs can edit them. */
  start: string
  end: string
  seats: number
  members: number
  waiting: number
  /** Tiers whose students can join the group. */
  tiers: string[]
  waitlist: boolean
  channel: boolean
  ranking: boolean
}

const SEED_GROUPS = [
  { id: "oct", name: "October cohort", start: "2026-10-01", end: "2026-12-17", seats: 30, members: 24, waiting: 0, tiers: [0, 1] },
  { id: "nov", name: "November cohort", start: "2026-11-02", end: "2027-01-21", seats: 30, members: 11, waiting: 0, tiers: [0, 1] },
  { id: "mastermind", name: "Funded mastermind", start: "2026-10-05", end: "2026-11-30", seats: 12, members: 12, waiting: 7, tiers: [1, 2] },
]

const groupCache = new Map<string, Group[]>()
/** Sample groups, with the coach's own tier ids. Stable per coach, as the store needs. */
export function defaultGroups(coach: Coach): Group[] {
  const hit = groupCache.get(coach.slug)
  if (hit) return hit
  const ids = coach.tiers.map((t) => t.id)
  const list = SEED_GROUPS.map((g) => ({
    ...g,
    tiers: [...new Set(g.tiers.map((i) => ids[Math.min(i, ids.length - 1)]).filter(Boolean))],
    waitlist: true,
    channel: true,
    ranking: coach.modules.ranking,
  }))
  groupCache.set(coach.slug, list)
  return list
}

export function useGroups(coach: Coach) {
  return useStored(`${coach.slug}:groups`, defaultGroups(coach))
}

export function saveGroups(coach: Coach, update: (g: Group[]) => Group[]) {
  setStored(`${coach.slug}:groups`, update, defaultGroups(coach))
}

export const isFull = (g: Group) => g.members >= g.seats

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** "2026-10-01" → "1 Oct 2026" */
export function fmtDate(iso: string, year = true) {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS[m - 1]}${year ? ` ${y}` : ""}`
}

// ---------- access

/** When a group's members get a course. */
export type GroupRule = "tier" | "start" | "week2" | "week3" | "week4" | "none"
export const GROUP_RULES: { value: GroupRule; label: string; short: string }[] = [
  { value: "tier", label: "Same as their tier", short: "Tier" },
  { value: "start", label: "On the group's start date", short: "Start" },
  { value: "week2", label: "7 days after the start", short: "+7 d" },
  { value: "week3", label: "14 days after the start", short: "+14 d" },
  { value: "week4", label: "21 days after the start", short: "+21 d" },
  { value: "none", label: "Not for this group", short: "–" },
]

export type AccessSettings = {
  /** Locked content: shown with "Unlock with …" as an upsell, or hidden. */
  locked: "show" | "hide"
  /** Module overrides, "courseId/moduleId" → tier ids. Missing means it follows the course. */
  modules: Record<string, string[]>
  /** "courseId/groupId" → when the group gets it. Missing means "tier". */
  groups: Record<string, GroupRule>
}

const NO_ACCESS: AccessSettings = { locked: "show", modules: {}, groups: {} }

export function useAccess(slug: string) {
  return useStored(`${slug}:access`, NO_ACCESS)
}

export function saveAccess(slug: string, update: (a: AccessSettings) => AccessSettings) {
  setStored(`${slug}:access`, update, NO_ACCESS)
}

/** Tier ids a course is for; an empty list in the catalogue means every tier. */
export const courseTiers = (c: Course, all: string[]) => (c.tiers.length ? c.tiers : all)

export function moduleTiers(a: AccessSettings, c: Course, moduleId: string, all: string[]) {
  return a.modules[`${c.id}/${moduleId}`] ?? courseTiers(c, all)
}

// ---------- preview as (ADM-15)

export type PreviewAs = { kind: "tier" | "group"; id: string; label: string } | null

export function usePreviewAs(slug: string) {
  return useStored<PreviewAs>(`${slug}:preview-as`, null)
}

export function setPreviewAs(slug: string, p: PreviewAs) {
  setStored<PreviewAs>(`${slug}:preview-as`, p, null)
}

/**
 * The tier the student side shows: `?tier=` from a preview link, then the
 * admin's "Preview as", then what a new student just bought, then the demo
 * student's own tier (the first one).
 */
export function useViewerTier(coach: Coach) {
  const param = useSearchParams().get("tier")
  const preview = usePreviewAs(coach.slug)
  const groups = useGroups(coach)
  const bought = useJustJoined(coach.slug)
  if (param) return param
  if (preview?.kind === "tier") return preview.id
  if (preview?.kind === "group") return groups.find((g) => g.id === preview.id)?.tiers[0] ?? coach.tiers[0]?.id
  return bought?.tier ?? coach.tiers[0]?.id
}

const NOT_NEW = { stage: "done" }
const NO_PURCHASE = null as { tier: string; group?: string } | null
/** A student who just went through checkout and onboarding sees their own tier and group. */
function useJustJoined(slug: string) {
  const start = useStored<{ stage: string }>(`${slug}:student-start`, NOT_NEW)
  const purchase = useStored(`${slug}:purchase`, NO_PURCHASE)
  return start.stage === "new" ? purchase : null
}

/** The group the student side shows: the admin's "Preview as" group, else the demo student's cohort. */
export function useViewerGroup(coach: Coach): Group | undefined {
  const preview = usePreviewAs(coach.slug)
  const groups = useGroups(coach)
  const param = useSearchParams().get("group")
  const bought = useJustJoined(coach.slug)
  const id = param ?? (preview?.kind === "group" ? preview.id : preview ? undefined : bought ? bought.group : "oct")
  return groups.find((g) => g.id === id)
}

const TODAY = "2026-10-12"
const OFFSET: Partial<Record<GroupRule, number>> = { start: 0, week2: 7, week3: 14, week4: 21 }

/** For a group member: is the course open yet, and from when. `null` when the group rule doesn't apply. */
export function groupOpening(a: AccessSettings, courseId: string, group: Group | undefined): { open: boolean; date: string } | null {
  if (!group) return null
  const rule = a.groups[`${courseId}/${group.id}`] ?? "tier"
  const days = OFFSET[rule]
  if (days === undefined) return null
  const d = new Date(`${group.start}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  const iso = d.toISOString().slice(0, 10)
  return { open: iso <= TODAY, date: fmtDate(iso, false) }
}
