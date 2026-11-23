"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Euro } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { toast } from "@/lib/toast"
import { NO_ALERTS, PAYMENT_ALERTS, alertsAtRisk } from "@/lib/data/payment-alerts"
import { alertItems, useAlertActions } from "./sales/payment-alerts"
import { AdminButton, AttentionCard, AttentionDrawer, type AttentionItem, type AttentionRow } from "./ui"

/** Overview · Needs you today (Figma Overview 01, 01h): everything that needs the coach across the Admin. The payments are one summary row from the same list as Sales · Payment alerts. */
const OTHERS = [
  { id: "mia", initials: "MS", name: "Mia Sørensen", reason: "Broke loss limit twice", tone: "danger", action: "Review", href: "journal", tab: "students", sub: "Student · rules broken", tag: { label: "At risk", tone: "danger" }, detail: "Broke the loss limit twice this week · NQ and ES", also: "Message" },
  { id: "lena", initials: "LI", name: "Lena Ito", reason: "Stuck in Module 2", tone: "warning", action: "Nudge", href: "students", tab: "students", sub: "Student · Price action playbook", tag: { label: "Stuck", tone: "warning" }, detail: "No progress for 6 days · stuck in Module 2", also: "Message" },
  { id: "feedback", initials: "KO", name: "Open feedback", reason: "3 journal entries waiting", tone: "warning", action: "Open", href: "journal", tab: "journal", sub: "Journal feedback", tag: { label: "Waiting", tone: "warning" }, detail: "3 entries waiting · oldest from Mia Sørensen, 2 days ago", also: "" },
] as const

export function NeedsYouToday({ fresh }: { fresh: boolean }) {
  const { base } = useCoach()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const alerts = fresh ? NO_ALERTS : PAYMENT_ALERTS
  const others = fresh ? [] : OTHERS
  const run = useAlertActions(() => router.push(`${base}/sales?tab=transactions`))
  const go = (href: string) => router.push(`${base}/${href}`)

  const rows: AttentionRow[] = [
    ...(alerts.length > 0
      ? [{
          id: "payments",
          lead: { node: <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-a-md bg-a-selected text-a-icon"><Euro className="size-4" /></span> },
          name: `${alerts.length} payments need you`,
          reason: `€${alertsAtRisk(alerts).toLocaleString("en")} at risk`,
          action: <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`${base}/sales?tab=overview&alerts=1`} />}>Review</AdminButton>,
        }]
      : []),
    ...others.map((u) => ({
      id: u.id,
      lead: { initials: u.initials, tone: u.tone },
      name: u.name,
      reason: u.reason,
      action: <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`${base}/${u.href}`} />}>{u.action}</AdminButton>,
    })),
  ]
  const items: AttentionItem[] = [
    ...alertItems(alerts, run),
    ...others.map((u) => ({
      id: u.id,
      tab: u.tab,
      lead: { initials: u.initials, tone: u.tone },
      name: u.name,
      sub: u.sub,
      tag: u.tag,
      detail: u.detail,
      actions: [{ label: u.action === "Open" ? "Open journal" : u.action, onClick: () => go(u.href) }, ...(u.also ? [{ label: u.also, onClick: () => toast(`Message to ${u.name.split(" ")[0]}`, { description: "Opens the message box in Students." }) }] : [])],
    })),
  ]
  return (
    <>
      <AttentionCard title="Needs you today" count={items.length} onViewAll={() => setOpen(true)} rows={rows} empty="Nothing needs you today." max={4} fill />
      <AttentionDrawer
        open={open}
        onOpenChange={setOpen}
        title="Needs you today"
        subtitle={`${items.length} items · ${alerts.length} are payments`}
        tabs={[{ id: "failed", label: "Payments" }, { id: "students", label: "Students" }, { id: "journal", label: "Journal" }]}
        items={items.map((i) => (["dispute", "failed", "retrying"].includes(i.tab) ? { ...i, tab: "failed" } : i))}
      />
    </>
  )
}
