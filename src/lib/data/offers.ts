"use client"

import { NOW } from "./schedule"

/**
 * Offers (Figma Sales · 04 to 07, 13c): packages a coach sells on a call (about €2k to €10k), each with its own payment plans, and the single-use
 * checkout links made from them. The prototype takes no payments: a link works once, instalments are shown, nothing is charged.
 * An offer opens an existing tier after the first payment (`tierId`); it never creates a tier of its own.
 */

export type OfferPlan = 1 | 2 | 4 | 6
export const OFFER_PLANS: OfferPlan[] = [1, 2, 4, 6]

export type Offer = {
  id: string
  name: string
  /** Total price, in the platform's currency. */
  price: number
  /** The tier the client gets after the first payment. */
  tierId: string
  /** The payment plans a link can use. Pay in full (1) is always allowed. */
  plans: OfferPlan[]
  /** What the checkout lists besides the tier. */
  perks: string[]
  /** If the client already subscribes, that subscription ends after the first payment. */
  replaceSubscription: boolean
  /** Only the e-mail typed in the link can pay with it. */
  lockEmail: boolean
  /** A notification when a link is opened. */
  notifyOpen: boolean
  /** The sender can change the price of one link; every change is recorded. */
  senderPrice: boolean
  sold: number
  paying: number
}

export type LinkStatus = "new" | "opened" | "paid" | "expired"

export type OfferLink = {
  /** The last part of the address: /offer/<id>. */
  id: string
  offerId: string
  plan: OfferPlan
  /** The total for this client: the offer's price unless the sender changed it. */
  price: number
  email?: string
  /** The client's name, as far as it is known (from the link or from the checkout). */
  name?: string
  sender: string
  /** ISO date and time the link was made. */
  sentAt: string
  /** ISO date the link stops working. */
  expires: string
  openedAt?: string
  paidAt?: string
  /** An instalment that failed and is being retried. */
  failed?: boolean
}

export type OfferSettingsSample = { offers: Offer[]; links: OfferLink[] }

export const NO_OFFERS: Offer[] = []
export const NO_LINKS: OfferLink[] = []

const GOLD_PERKS = ["Direct line to your coach", "Monthly strategy review", "Private community channel"]

export const OFFERS: Offer[] = [
  { id: "silver", name: "Coaching Silver", price: 2400, tierId: "desk", plans: [1, 2, 4, 6], perks: ["Two coaching calls a month", "Journal feedback every week"], replaceSubscription: true, lockEmail: true, notifyOpen: true, senderPrice: false, sold: 3, paying: 1 },
  { id: "gold", name: "Coaching Gold", price: 6000, tierId: "vip", plans: [1, 2, 4, 6], perks: GOLD_PERKS, replaceSubscription: true, lockEmail: true, notifyOpen: true, senderPrice: true, sold: 5, paying: 3 },
  { id: "platinum", name: "Coaching Platinum", price: 9600, tierId: "vip", plans: [1, 2, 4, 6], perks: ["Weekly 1:1 call", "Personal trading plan", "Direct line to your coach"], replaceSubscription: true, lockEmail: true, notifyOpen: true, senderPrice: true, sold: 2, paying: 2 },
]

/** Sample links: one of each status, as in the Figma sample. */
export const LINKS: OfferLink[] = [
  { id: "gold-mb4x7k", offerId: "gold", plan: 4, price: 6000, email: "marco.bellini@example.com", name: "Marco Bellini", sender: "Ana", sentAt: "2025-11-12T10:11", expires: "2025-11-19", openedAt: "2025-11-12T10:14", paidAt: "2025-11-12T10:20" },
  { id: "silver-sl2q9p", offerId: "silver", plan: 1, price: 2400, email: "sofia.laurent@example.com", name: "Sofia Laurent", sender: "Ana", sentAt: "2025-11-12T09:23", expires: "2025-11-19", openedAt: "2025-11-12T09:40" },
  { id: "plat-do8m3c", offerId: "platinum", plan: 6, price: 9600, email: "daniel.okoye@example.com", name: "Daniel Okoye", sender: "Kairo", sentAt: "2025-11-11T16:02", expires: "2025-11-18" },
  { id: "gold-el5w1z", offerId: "gold", plan: 2, price: 6000, email: "eva.lindqvist@example.com", name: "Eva Lindqvist", sender: "Ana", sentAt: "2025-11-03T11:30", expires: "2025-11-10", openedAt: "2025-11-03T12:05" },
  { id: "silver-pn6r2d", offerId: "silver", plan: 2, price: 2400, email: "priya.nair@example.com", name: "Priya Nair", sender: "Kairo", sentAt: "2025-11-06T14:10", expires: "2025-11-13", openedAt: "2025-11-06T14:30", paidAt: "2025-11-06T15:02", failed: true },
  { id: "gold-to9h4v", offerId: "gold", plan: 2, price: 6000, email: "tom.okafor@example.com", name: "Tom Okafor", sender: "Ana", sentAt: "2025-11-05T09:00", expires: "2025-11-12", openedAt: "2025-11-05T09:20", paidAt: "2025-11-05T09:41" },
  { id: "silver-li3n8b", offerId: "silver", plan: 4, price: 2400, email: "lena.ito@gmail.com", name: "Lena Ito", sender: "Ana", sentAt: "2025-11-04T10:00", expires: "2025-11-11", openedAt: "2025-11-04T10:12", paidAt: "2025-11-04T10:30" },
  { id: "plat-am2k6r", offerId: "platinum", plan: 6, price: 9600, email: "alex.m@fastmail.com", name: "Alex Moreau", sender: "Kairo", sentAt: "2025-11-03T15:00", expires: "2025-11-10", openedAt: "2025-11-03T15:20", paidAt: "2025-11-03T16:05" },
  { id: "gold-ms7p4w", offerId: "gold", plan: 4, price: 6000, email: "mia.s@proton.me", name: "Mia Sørensen", sender: "Ana", sentAt: "2025-11-02T09:30", expires: "2025-11-09", openedAt: "2025-11-02T09:41", paidAt: "2025-11-02T10:00" },
  { id: "plat-jp9d3x", offerId: "platinum", plan: 4, price: 9600, email: "jonas@pereira.pt", name: "Jonas Pereira", sender: "Kairo", sentAt: "2025-11-02T08:10", expires: "2025-11-09", openedAt: "2025-11-02T08:15", paidAt: "2025-11-02T08:40" },
  { id: "silver-tb5v2m", offerId: "silver", plan: 1, price: 2400, email: "tom.becker@web.de", name: "Tom Becker", sender: "Ana", sentAt: "2025-11-10T14:00", expires: "2025-11-17", openedAt: "2025-11-10T14:30" },
  { id: "gold-sk8c1q", offerId: "gold", plan: 2, price: 6000, email: "sara.k@wp.pl", name: "Sara Kowalski", sender: "Kairo", sentAt: "2025-11-09T11:00", expires: "2025-11-16", openedAt: "2025-11-09T11:45" },
  { id: "silver-mk4h9j", offerId: "silver", plan: 2, price: 2400, email: "mk@koski.fi", name: "Mikael Koski", sender: "Ana", sentAt: "2025-11-12T08:00", expires: "2025-11-19" },
  { id: "gold-jw6t2n", offerId: "gold", plan: 4, price: 6000, email: "jonas@beckerfx.de", name: "Jonas Weber", sender: "Kairo", sentAt: "2025-10-28T10:00", expires: "2025-11-04", openedAt: "2025-10-28T10:20" },
]

/** The tier an offer opens: its own, or (a community that has no such tier, as with the samples) the most expensive paid one. */
export function offerTier<T extends { id: string; price: string }>(tiers: T[], id: string): T | undefined {
  const paid = tiers.filter((t) => (Number(t.price.replace(/[^\d.]/g, "")) || 0) > 0)
  return tiers.find((t) => t.id === id) ?? paid[paid.length - 1]
}

// ---------- calendar

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const pad = (n: number) => String(n).padStart(2, "0")
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const TODAY = isoDay(NOW)
export const NOW_ISO = `${TODAY}T${pad(NOW.getHours())}:${pad(NOW.getMinutes())}`

/** "12 Dec": the day and month of an ISO date, with the year when it is not this one. */
export function shortDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}${y !== NOW.getFullYear() ? ` ${y}` : ""}`
}

/** The date of instalment `i` (0 is today) when the first one is paid on `from`: one month apart, on the same day. */
export function instalmentDate(from: Date, i: number) {
  const d = new Date(from.getFullYear(), from.getMonth() + i, from.getDate())
  // 31 Jan + 1 month would land in March: stay in the month that was asked for.
  if (d.getDate() !== from.getDate()) d.setDate(0)
  return d
}

/** "12 min ago", "1 h ago", "yesterday", "9 d ago": how long ago, for the Sent column. */
export function ago(iso: string) {
  const mins = Math.max(0, Math.round((NOW.getTime() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${Math.max(1, mins)} min ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.floor(h / 24)
  return days === 1 ? "yesterday" : `${days} d ago`
}

// ---------- money and plans

export const money = (n: number) => `€${n.toLocaleString("en", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
export const planEach = (price: number, plan: OfferPlan) => Math.round((price / plan) * 100) / 100
export const planName = (plan: OfferPlan) => (plan === 1 ? "Pay in full" : `${plan} payments`)
/** "4 payments of €1,500", "pay in full". */
export const planLine = (price: number, plan: OfferPlan) => (plan === 1 ? "pay in full" : `${plan} payments of ${money(planEach(price, plan))}`)
export const planHint = (price: number, plan: OfferPlan) =>
  plan === 1 ? `${money(price)} today` : plan === 2 ? `${money(planEach(price, 2))} now and ${money(planEach(price, 2))} after 30 days` : `${money(planEach(price, plan))} a month`

export function linkStatus(l: OfferLink): LinkStatus {
  if (l.paidAt) return "paid"
  if (l.expires < TODAY) return "expired"
  return l.openedAt ? "opened" : "new"
}

export const STATUS_LABEL: Record<LinkStatus, string> = { new: "Not opened", opened: "Opened", paid: "Paid", expired: "Expired" }

export const linkUrl = (origin: string, slug: string, id: string) => `${origin}/site/${slug}/offer/${id}`

/** A short, hard-to-guess address part: the offer, then random letters and digits. */
export function newLinkId(offerId: string) {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
  let tail = ""
  for (let i = 0; i < 6; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${offerId.slice(0, 6)}-${tail}`
}

/** What the sample says is still to collect and what needs the coach, from the links that were paid. */
export function totals(offers: Offer[], links: OfferLink[]) {
  const paid = links.filter((l) => linkStatus(l) === "paid")
  const first = paid.reduce((s, l) => s + planEach(l.price, l.plan), 0)
  const rest = paid.reduce((s, l) => s + l.price - planEach(l.price, l.plan), 0)
  return {
    sent: links.length,
    opened: links.filter((l) => l.openedAt).length,
    paid: paid.length,
    collected: first,
    toCollect: rest,
    failed: links.filter((l) => l.failed).length,
    sold: offers.reduce((s, o) => s + o.sold, 0),
  }
}
