"use client"

import type { Coach } from "./coaches"
import { setStored, useStored } from "@/lib/prototype-store"

/**
 * Partners: offers from brokers, prop firms and tools, and the coach's own
 * affiliate program behind them. One store per community. Nothing is tracked
 * for real: clicks, sign-ups and earnings are sample numbers.
 */

export type PartnerKind = "broker" | "prop" | "tool"

export const KIND_LABEL: Record<PartnerKind, string> = { broker: "Broker", prop: "Prop firm", tool: "Tool" }
export const PARTNER_KINDS: PartnerKind[] = ["broker", "prop", "tool"]

export type PartnerOffer = {
  id: string
  name: string
  kind: PartnerKind
  /** What the student gets: "20% off the first month". */
  offer: string
  code?: string
  /** Tracking link for catalogue offers, the coach's own link otherwise. */
  url: string
  /** Tier ids that can see the offer unlocked. Empty means everyone. */
  tiers: string[]
  /** "catalogue": negotiated by TradeStats. "own": the coach's own link. */
  source: "catalogue" | "own"
  clicks: number
  signups: number
  /** In euros. */
  earnings: number
  on: boolean
}

/** An offer TradeStats negotiated; the coach adds it and earns a share of the commission. */
export type CatalogueOffer = { id: string; name: string; kind: PartnerKind; offer: string; text: string; commission: string }

/** The coach's share of every commission on a catalogue offer. */
export const COACH_SHARE = 60

export const CATALOGUE: CatalogueOffer[] = [
  { id: "ic-markets", name: "IC Markets", kind: "broker", offer: "Lower fees on every trade", text: "Raw spreads on forex and futures CFDs", commission: "Up to $6 per lot" },
  { id: "pepperstone", name: "Pepperstone", kind: "broker", offer: "Cashback on the first 10 lots", text: "Fast execution, cTrader and MT5", commission: "Up to $5 per lot" },
  { id: "ftmo", name: "FTMO", kind: "prop", offer: "10% off the challenge", text: "Two-step evaluation, up to 90% profit split", commission: "10% of the fee" },
  { id: "topstep", name: "Topstep", kind: "prop", offer: "50% off the first month", text: "Futures combine with a daily loss limit", commission: "15% of the fee" },
  { id: "tradingview", name: "TradingView", kind: "tool", offer: "$15 credit on any paid plan", text: "The charts used in the lessons", commission: "$30 per paid sign-up" },
  { id: "edgewonk", name: "Edgewonk", kind: "tool", offer: "20% off the first year", text: "A trading journal with deep statistics", commission: "20% of the first year" },
]

export const catalogueUrl = (coachSlug: string, c: CatalogueOffer) => `https://go.tradestats.app/${coachSlug}/${c.id}`

/** The coach's own code: the coach's name and a number. */
export const coachCode = (coach: Coach, n: number) => `${coach.coachName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6)}${n}`

/** A catalogue offer as the coach's own entry, ready to switch on. */
export function fromCatalogue(coach: Coach, c: CatalogueOffer, extra?: Partial<PartnerOffer>): PartnerOffer {
  return {
    id: c.id,
    name: c.name,
    kind: c.kind,
    offer: c.offer,
    code: c.kind === "tool" ? undefined : coachCode(coach, c.kind === "prop" ? 10 : 20),
    url: catalogueUrl(coach.slug, c),
    tiers: [],
    source: "catalogue",
    clicks: 0,
    signups: 0,
    earnings: 0,
    on: true,
    ...extra,
  }
}

const cache = new Map<string, PartnerOffer[]>()
/** Four catalogue offers and one own link, with the coach's tiers. Stable per coach, as the store needs. */
export function defaultOffers(coach: Coach): PartnerOffer[] {
  const hit = cache.get(coach.slug)
  if (hit) return hit
  const cat = (id: string) => CATALOGUE.find((c) => c.id === id)!
  const second = coach.tiers[1]?.id
  const list: PartnerOffer[] = [
    fromCatalogue(coach, cat("ic-markets"), { clicks: 412, signups: 38, earnings: 1140 }),
    fromCatalogue(coach, cat("ftmo"), { clicks: 286, signups: 17, earnings: 640, tiers: second ? [second] : [] }),
    fromCatalogue(coach, cat("tradingview"), { clicks: 530, signups: 44, earnings: 780 }),
    fromCatalogue(coach, cat("edgewonk"), { clicks: 96, signups: 9, earnings: 118 }),
    {
      id: "own-sheets",
      name: "Notion trade log",
      kind: "tool",
      offer: "My trade log template, 30% off",
      code: coachCode(coach, 30),
      url: `https://example.com/${coach.slug}-trade-log`,
      tiers: [],
      source: "own",
      clicks: 64,
      signups: 5,
      earnings: 0,
      on: true,
    },
  ]
  cache.set(coach.slug, list)
  return list
}

export function useOffers(coach: Coach) {
  return useStored<PartnerOffer[]>(`${coach.slug}:partners`, defaultOffers(coach))
}

export function saveOffers(coach: Coach, update: (o: PartnerOffer[]) => PartnerOffer[]) {
  setStored<PartnerOffer[]>(`${coach.slug}:partners`, update, defaultOffers(coach))
}

// ---------- the coach's own affiliate program

export type AffiliateProgram = { on: boolean; commission: number; cookieDays: number; payout: "monthly" | "with-platform" }

export const DEFAULT_AFFILIATE: AffiliateProgram = { on: true, commission: 20, cookieDays: 30, payout: "monthly" }

export function useAffiliate(coach: Coach) {
  return useStored<AffiliateProgram>(`${coach.slug}:affiliate`, DEFAULT_AFFILIATE)
}

export function saveAffiliate(coach: Coach, patch: Partial<AffiliateProgram>) {
  setStored<AffiliateProgram>(`${coach.slug}:affiliate`, (a) => ({ ...a, ...patch }), DEFAULT_AFFILIATE)
}
