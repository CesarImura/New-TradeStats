"use client"

import { useSearchParams } from "next/navigation"
import { useCoach } from "@/components/coach/coach-provider"
import { isFreeTier, isOfferOnly, useTiers } from "@/lib/data/access"
import { MONEY } from "@/lib/data/people"
import { useNewPlatform } from "../use-new-platform"
import { useOffers } from "./offers"
import { PaymentAlerts } from "./payment-alerts"
import { RevenueChart } from "./revenue-chart"
import { ComingUp, SourceDonut, UPCOMING, type Source } from "./revenue-panels"
import { OFFERS_MONTH } from "@/lib/data/offers"
import { StatPanel } from "../ui"

/** Subscriptions and offers, as the donut and the chart paint them. */
const SOURCE_COLORS = ["var(--admin-component-chart-bar-bg-default)", "var(--admin-color-status-success-fill)", "color-mix(in srgb, var(--admin-color-status-info-fill) 85%, transparent)"]
/** Sample numbers: last month's recurring revenue was €10,920, and 7 instalments are still to collect. */
const MRR_CHANGE = { percent: 8.6, more: 940 }
const INSTALMENTS_LEFT = 7

/**
 * Sales · 01 Overview (Figma Sales 01, 01b New platform, 01c Payment alerts, 01d Chart default): the month's numbers, the six-month chart,
 * what needs you (`PaymentAlerts`), what is coming up and where the money came from. Revenue = subscriptions + offers; an offer-only tier is not a source of its own.
 */
export function RevenueOverview({ onProblems }: { onProblems: () => void }) {
  const { coach } = useCoach()
  const fresh = useNewPlatform()
  const alertsOpen = useSearchParams().get("alerts") === "1"
  // Only the tiers sold on their own: the free tier and the offer-only tier bring nothing by themselves.
  const tiers = useTiers(coach)
  const sold = tiers.filter((t) => !isFreeTier(t) && !isOfferOnly(t))
  // Everyone who pays today: the tiers sold on their own and the offer-only one.
  const paying = tiers.filter((t) => !isFreeTier(t)).reduce((n, t) => n + t.members, 0)
  const byTier = sold.map((t) => ({ ...t, revenue: fresh ? 0 : Math.round(Number(t.price.replace(/[^\d]/g, "")) * t.members * (t.cadence === "quarter" ? 1 / 3 : 1)) }))
  const mrr = byTier.reduce((n, t) => n + t.revenue, 0)
  const { offers } = useOffers()
  const sources: Source[] = [
    ...(offers.length > 0 ? [{ id: "offers", name: "Offers", revenue: fresh ? 0 : Math.max(0, MONEY.mrr - mrr), color: SOURCE_COLORS[0] }] : []),
    ...byTier.map((t, i) => ({ id: t.id, name: t.name, revenue: t.revenue, color: SOURCE_COLORS[Math.min(i + 1, 2)] })),
  ]
  const euro = (n: number) => `€${n.toLocaleString("en")}`

  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          fresh
            ? { label: "Revenue · this month", value: "€0", delta: "No sales yet" }
            : { label: "Revenue · October", value: euro(MONEY.mrr), delta: `+${MONEY.mrrChange}% · ${euro(MONEY.mrrMore)} more`, tone: "success" as const },
          fresh
            ? { label: "Recurring (MRR)", value: "€0", delta: "No subscribers yet" }
            : { label: "Recurring (MRR)", value: euro(mrr), delta: `+${MRR_CHANGE.percent}% · ${euro(MRR_CHANGE.more)} more`, tone: "success" as const },
          fresh
            ? { label: "To collect", value: "€0", delta: "No instalments yet" }
            : { label: "To collect", value: euro(OFFERS_MONTH.toCollect), delta: `${INSTALMENTS_LEFT} instalments · next ${OFFERS_MONTH.next}` },
          fresh
            ? { label: "Next payout", value: "€0", delta: "Every Monday" }
            : { label: "Next payout", value: euro(MONEY.nextPayout.amount), delta: `${MONEY.nextPayout.date} · Bank ••7` },
        ]}
      />
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <RevenueChart fresh={fresh} paying={paying} />
        <PaymentAlerts fresh={fresh} onOpenPayments={onProblems} defaultOpen={alertsOpen} />
      </div>
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ComingUp rows={fresh ? [] : UPCOMING} onAll={onProblems} />
        <SourceDonut sources={sources} month="October" fresh={fresh} />
      </div>
    </div>
  )
}
