/**
 * The payments that need the coach (Figma Sales · 01 "Payment alerts", Overview · 01h "Needs you today"). One list for every place that shows it:
 * the card and drawer in Sales, the summary row and drawer in Overview and the count on Students, so the numbers always match.
 * Sample data of the prototype; the list is sorted by urgency (a dispute first, then failures, then payments being retried).
 */

export type AlertKind = "dispute" | "failed" | "retrying"
export type AlertAction = "Answer the dispute" | "View payment" | "Send payment link" | "Pause access" | "Remove student" | "Retry now"

export type PaymentAlert = {
  id: string
  who: string
  initials: string
  kind: AlertKind
  /** Offer or tier, and what was being paid: the drawer's second line. */
  what: string
  /** The offer or tier alone, for the card's line. */
  plan: string
  amount: number
  /** Amount, reason and what happens next: the drawer's detail line. */
  detail: string
  actions: AlertAction[]
}

export const PAYMENT_ALERTS: PaymentAlert[] = [
  { id: "jonas", who: "Jonas Weber", initials: "JW", kind: "dispute", what: "Gold · dispute opened 12 Nov", plan: "Gold", amount: 1500, detail: "€1,500 · Product not as described · respond by 5 Dec", actions: ["Answer the dispute", "View payment"] },
  { id: "priya", who: "Priya Nair", initials: "PN", kind: "failed", what: "Silver · instalment 2 of 2", plan: "Silver", amount: 1200, detail: "€1,200 · Card declined · 3 attempts · retries stopped", actions: ["Send payment link", "Pause access", "Remove student"] },
  { id: "tom", who: "Tom Okafor", initials: "TO", kind: "failed", what: "Trading Desk · monthly", plan: "Trading Desk", amount: 129, detail: "€129 · Insufficient funds · 3 attempts · retries stopped", actions: ["Send payment link", "Pause access"] },
  { id: "alex", who: "Alex Moreau", initials: "AM", kind: "retrying", what: "Inner Circle · monthly", plan: "Inner Circle", amount: 49, detail: "€49 · Card declined · attempt 2 of 4 · next retry tonight", actions: ["Retry now", "Send payment link"] },
  { id: "marco", who: "Marco Bellini", initials: "MB", kind: "retrying", what: "Gold · instalment 3 of 4", plan: "Gold", amount: 1500, detail: "€1,500 · Card declined · attempt 1 of 4 · next retry 25 Nov", actions: ["Retry now", "Send payment link", "Pause access"] },
]

export const NO_ALERTS: PaymentAlert[] = []

/** What is at risk across the list (the drawer's subtitle). */
export const alertsAtRisk = (list: PaymentAlert[]) => list.reduce((n, a) => n + a.amount, 0)

/** The card's line under the name: "Disputed · Gold €1,500", "Payment failed · Silver €1,200". */
export const alertLine = (a: PaymentAlert) => `${a.kind === "dispute" ? "Disputed" : "Payment failed"} · ${a.plan} €${a.amount.toLocaleString("en")}`

/** The one action a card row shows; the drawer has them all. */
export const ALERT_CARD_ACTION: Record<AlertKind, string> = { dispute: "Answer", failed: "Send link", retrying: "Retry" }
export const ALERT_TAG: Record<AlertKind, { label: string; tone: "danger" | "warning" }> = { dispute: { label: "Disputed", tone: "danger" }, failed: { label: "Failed", tone: "danger" }, retrying: { label: "Retrying", tone: "warning" } }
