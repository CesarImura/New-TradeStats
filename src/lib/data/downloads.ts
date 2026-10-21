"use client"

import type { Coach } from "./coaches"
import { setStored, useStored } from "@/lib/prototype-store"

/**
 * Downloads: files students can take beyond the ones attached to a lesson
 * (indicators, chart templates, checklists, trading plans, spreadsheets).
 * One store per community; prices and files are for show, nothing is uploaded.
 */

export type DownloadCategory = "indicators" | "templates" | "checklists" | "plans" | "other"

export const DOWNLOAD_CATEGORIES: { id: DownloadCategory; label: string }[] = [
  { id: "indicators", label: "Indicators" },
  { id: "templates", label: "Chart templates" },
  { id: "checklists", label: "Checklists" },
  { id: "plans", label: "Trading plans" },
  { id: "other", label: "Other" },
]

export const categoryLabel = (c: DownloadCategory) => DOWNLOAD_CATEGORIES.find((x) => x.id === c)?.label ?? "Other"

export type DownloadFile = { name: string; size: string; type: string }

export type DownloadItem = {
  id: string
  title: string
  description: string
  category: DownloadCategory
  file: DownloadFile
  version: string
  /** ISO date. */
  updated: string
  /** Tier ids that can download it. Empty means everyone. */
  tiers: string[]
  /** Series colour index for the cover. */
  cover?: number
  /** Tell students when it is added or updated. */
  notify?: boolean
}

/** The prototype's "today", so "new" means the same on every visit. */
export const TODAY = new Date("2026-10-12T12:00:00")
export const NEW_DAYS = 14

export const daysAgo = (iso: string) => Math.floor((TODAY.getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000)
export const isRecent = (iso: string) => daysAgo(iso) >= 0 && daysAgo(iso) <= NEW_DAYS
export const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

/** Does a student on this tier get the file? */
export const canDownload = (d: Pick<DownloadItem, "tiers">, tier?: string) => d.tiers.length === 0 || (!!tier && d.tiers.includes(tier))

const SEED = (second?: string): DownloadItem[] => {
  const limited = second ? [second] : []
  return [
    { id: "d1", title: "Session levels indicator (TradingView)", description: "Marks the Asia, London and New York highs and lows on any chart. Add it from the shared script link inside.", category: "indicators", file: { name: "session-levels-v1.3.pine", size: "18 KB", type: "Pine Script" }, version: "1.3", updated: "2026-10-08", tiers: [], cover: 0, notify: true },
    { id: "d2", title: "NQ scalping template (NinjaTrader)", description: "Chart layout with the volume profile, the opening range and the three levels we trade from.", category: "templates", file: { name: "nq-scalping.ntwtemplate", size: "142 KB", type: "NinjaTrader template" }, version: "2.0", updated: "2026-10-05", tiers: limited, cover: 1 },
    { id: "d3", title: "Pre-market checklist", description: "Ten checks before the first trade: news, levels, risk for the day and how you feel.", category: "checklists", file: { name: "Pre-market checklist.pdf", size: "212 KB", type: "PDF" }, version: "1.1", updated: "2026-09-14", tiers: [], cover: 2 },
    { id: "d4", title: "Trading plan template", description: "A plan to fill in once and review every month: markets, setups, risk and rules.", category: "plans", file: { name: "Trading plan template.docx", size: "86 KB", type: "Word" }, version: "3.2", updated: "2026-08-30", tiers: [], cover: 3 },
    { id: "d5", title: "Position size calculator", description: "Enter your account, risk percent and stop. It returns the size for futures, forex and stocks.", category: "other", file: { name: "Position size calculator.xlsx", size: "64 KB", type: "Excel" }, version: "2.4", updated: "2026-07-21", tiers: [], cover: 4 },
    { id: "d6", title: "Risk rules one-pager", description: "The rules we never break, on one page you can print and stick next to the screen.", category: "checklists", file: { name: "Risk rules one-pager.pdf", size: "96 KB", type: "PDF" }, version: "1.0", updated: "2026-06-12", tiers: [], cover: 1 },
    { id: "d7", title: "MT5 breakout indicator", description: "Draws the range and alerts on a close outside it. Works on every symbol and timeframe.", category: "indicators", file: { name: "breakout-range.ex5", size: "240 KB", type: "MetaTrader 5" }, version: "1.0", updated: "2026-10-01", tiers: limited, cover: 0, notify: true },
    { id: "d8", title: "Weekly review sheet", description: "Look back at the week: what you followed, what you broke and the one thing to change.", category: "templates", file: { name: "Weekly review sheet.xlsx", size: "58 KB", type: "Excel" }, version: "1.2", updated: "2026-09-27", tiers: [], cover: 2 },
  ]
}

const cache = new Map<string, DownloadItem[]>()
/** The sample files, with the coach's own second tier. Stable per coach, as the store needs. */
export function defaultDownloads(coach: Coach): DownloadItem[] {
  const hit = cache.get(coach.slug)
  if (hit) return hit
  const list = SEED(coach.tiers[1]?.id)
  cache.set(coach.slug, list)
  return list
}

export function useDownloads(coach: Coach) {
  return useStored<DownloadItem[]>(`${coach.slug}:downloads`, defaultDownloads(coach))
}

export function saveDownloads(coach: Coach, update: (d: DownloadItem[]) => DownloadItem[]) {
  setStored<DownloadItem[]>(`${coach.slug}:downloads`, update, defaultDownloads(coach))
}

// ---------- what this student already took

const NONE: string[] = []

export function useDownloaded(slug: string) {
  return useStored<string[]>(`${slug}:downloaded`, NONE)
}

export function markDownloaded(slug: string, id: string) {
  setStored<string[]>(`${slug}:downloaded`, (l) => (l.includes(id) ? l : [...l, id]), NONE)
}
