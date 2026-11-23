"use client"

import { useState } from "react"
import { toast } from "@/lib/toast"
import { ALERT_CARD_ACTION, ALERT_TAG, NO_ALERTS, PAYMENT_ALERTS, alertLine, alertsAtRisk, type AlertAction, type PaymentAlert } from "@/lib/data/payment-alerts"
import { AdminButton, AttentionCard, AttentionDrawer, type AttentionItem, type AttentionRow } from "../ui"

/** What each action of a payment alert does in the prototype (the real thing is the payment partner's and the student profile's). */
export function useAlertActions(onOpenPayments: () => void) {
  return (action: AlertAction, a: PaymentAlert) => {
    const first = a.who.split(" ")[0]
    if (action === "Answer the dispute" || action === "View payment") return onOpenPayments()
    if (action === "Send payment link") return toast("Payment link sent", { description: `${first} gets an e-mail to update the card.` })
    if (action === "Retry now") return toast("Retrying the payment", { description: "You'll see the result here." })
    if (action === "Pause access") return toast(`Access paused for ${a.who}`, { description: "Keeps the account and the journal. Nothing is deleted." })
    return toast(`Open ${first}'s profile to remove ${first}`, { description: "In Students, Review › Remove student." })
  }
}

/** The payment alerts as drawer items. */
export function alertItems(alerts: PaymentAlert[], run: (action: AlertAction, a: PaymentAlert) => void): AttentionItem[] {
  return alerts.map((a) => ({
    id: a.id,
    tab: a.kind,
    lead: { initials: a.initials, tone: ALERT_TAG[a.kind].tone },
    name: a.who,
    sub: a.what,
    tag: ALERT_TAG[a.kind],
    detail: a.detail,
    actions: a.actions.map((x) => ({ label: x, onClick: () => run(x, a) })),
  }))
}

/** The payment alerts as card rows: one action each, as wide as the others. */
export function alertRows(alerts: PaymentAlert[], run: (action: AlertAction, a: PaymentAlert) => void): AttentionRow[] {
  const first: Record<PaymentAlert["kind"], AlertAction> = { dispute: "Answer the dispute", failed: "Send payment link", retrying: "Retry now" }
  return alerts.map((a) => ({
    id: a.id,
    lead: { initials: a.initials, tone: ALERT_TAG[a.kind].tone },
    name: a.who,
    reason: alertLine(a),
    action: <AdminButton hierarchy="secondary" size="md" onClick={() => run(first[a.kind], a)}>{ALERT_CARD_ACTION[a.kind]}</AdminButton>,
  }))
}

export const ALERT_TABS = [{ id: "failed", label: "Failed" }, { id: "retrying", label: "Retrying" }, { id: "dispute", label: "Disputes" }]

/** Sales · 01 "Payment alerts" (Figma Sales 01 and 01c): only payments. The Overview shows the same list as one summary row (Overview · Needs you today). */
export function PaymentAlerts({ fresh, onOpenPayments, defaultOpen = false }: { fresh: boolean; onOpenPayments: () => void; defaultOpen?: boolean }) {
  const alerts = fresh ? NO_ALERTS : PAYMENT_ALERTS
  const [open, setOpen] = useState(defaultOpen)
  const run = useAlertActions(onOpenPayments)
  return (
    <>
      <AttentionCard title="Payment alerts" count={alerts.length} onViewAll={() => setOpen(true)} rows={alertRows(alerts, run)} empty="All payments are fine." fill />
      <AttentionDrawer open={open} onOpenChange={setOpen} title="Payment alerts" subtitle={`${alerts.length} payments · €${alertsAtRisk(alerts).toLocaleString("en")} at risk`} tabs={ALERT_TABS} items={alertItems(alerts, run)} />
    </>
  )
}
