"use client"

import type { Coach } from "./coaches"
import { readStored, setStored, useStored } from "@/lib/prototype-store"

/**
 * PUB-01 sales page, built from blocks in Sales & payments → Sales page
 * (ADM-40). The coach turns blocks on or off, orders them and edits their text.
 */

export type BlockType = "hero" | "about" | "results" | "curriculum" | "week" | "tiers" | "groups" | "faq" | "cta"

export type Block = {
  id: string
  type: BlockType
  on: boolean
  title: string
  text: string
  /** FAQ questions; results quotes use `who` as the name. */
  items?: { q: string; a: string; who?: string }[]
}

export const BLOCK_INFO: Record<BlockType, { name: string; hint: string }> = {
  hero: { name: "Opening", hint: "Big headline, one sentence and the main button" },
  about: { name: "About the coach", hint: "Who you are and how you trade" },
  results: { name: "What students say", hint: "Quotes from students who agreed" },
  curriculum: { name: "What's inside", hint: "Your courses, filled in from Content" },
  week: { name: "A week with us", hint: "Lives, calls and community at a glance" },
  tiers: { name: "Prices", hint: "Your tiers from Tiers & prices" },
  groups: { name: "Next groups", hint: "Upcoming cohorts with seats left" },
  faq: { name: "Questions", hint: "Questions people ask before buying" },
  cta: { name: "Closing", hint: "Last call to join" },
}

const cache = new Map<string, Block[]>()

export function defaultBlocks(coach: Coach): Block[] {
  const hit = cache.get(coach.slug)
  if (hit) return hit
  const blocks: Block[] = [
    { id: "hero", type: "hero", on: true, title: coach.tagline, text: `Courses, live sessions and a community with ${coach.coachName}. Everything in one place, built around how you actually trade.` },
    {
      id: "about",
      type: "about",
      on: true,
      title: `Hi, I'm ${coach.coachName}`,
      text: "I've traded for over ten years and coached more than 1,500 traders. No signals, no hype: a clear process, honest reviews of your trades and a group that keeps you on track.",
    },
    {
      id: "results",
      type: "results",
      on: true,
      title: `What ${coach.wording.students.toLowerCase()} say`,
      text: "",
      items: [
        { who: "Jonas P. · member since 2025", q: "", a: "The trade reviews changed everything. I finally know why I lose, and it happens a lot less." },
        { who: "Sara K. · passed a 50K challenge", q: "", a: "The daily loss rule and the live sessions got me through my first funded challenge." },
        { who: "Tariq B. · trades part-time", q: "", a: "Short lessons I can watch after work, and a group that answers within minutes." },
      ],
    },
    { id: "curriculum", type: "curriculum", on: true, title: "What's inside", text: "Step by step, from the basics to a playbook of your own." },
    { id: "week", type: "week", on: true, title: "A week with us", text: "" },
    { id: "tiers", type: "tiers", on: true, title: "Pick your plan", text: "Cancel any time. Upgrade whenever you like; you only pay the difference." },
    { id: "groups", type: "groups", on: true, title: "Start together", text: "Join a group and go through the program with others, week by week." },
    {
      id: "faq",
      type: "faq",
      on: true,
      title: "Questions",
      text: "",
      items: [
        { q: "Is this for beginners?", a: "Yes. The first course starts from zero; experienced traders can skip ahead." },
        { q: "Do I get trade signals?", a: "No. You learn a process and get feedback on your own trades. Education only, no investment advice." },
        { q: "Can I cancel?", a: "Any time, in two clicks. You keep access until the end of the period you paid for." },
        { q: "Which broker do I need?", a: "Any. The journal connects to the most common brokers, or you enter trades by hand." },
      ],
    },
    { id: "cta", type: "cta", on: true, title: "Your next trade starts with a plan", text: "Join today and watch the first lesson in two minutes." },
  ]
  cache.set(coach.slug, blocks)
  return blocks
}

export function useSalesPage(coach: Coach) {
  return useStored(`${coach.slug}:sales-page`, defaultBlocks(coach))
}

export function saveSalesPage(coach: Coach, update: (b: Block[]) => Block[]) {
  setStored(`${coach.slug}:sales-page`, update, defaultBlocks(coach))
}

export function resetSalesPage(coach: Coach) {
  setStored<Block[] | null>(`${coach.slug}:sales-page`, null)
}

// ---------- checkout → account → welcome, handed from page to page

export type Purchase = {
  tier: string
  cycle: "regular" | "yearly"
  email: string
  name: string
  group?: string
  coupon?: string
  discount?: string
  total: number
  trial: number
}

const NO_PURCHASE: Purchase | null = null

export function usePurchase(slug: string) {
  return useStored(`${slug}:purchase`, NO_PURCHASE)
}

export function savePurchase(slug: string, p: Purchase | null) {
  setStored(`${slug}:purchase`, p, NO_PURCHASE)
}

export const readPurchase = (slug: string) => readStored(`${slug}:purchase`, NO_PURCHASE)
