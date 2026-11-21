"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { useCoach } from "@/components/coach/coach-provider"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { isFreeTier } from "@/lib/data/access"
import { MONEY, TRANSACTIONS } from "@/lib/data/people"
import { LineChart, Star, Ticket, Users } from "@/components/icons"
import { totals } from "@/lib/data/offers"
import { useNewPlatform } from "../use-new-platform"
import { useOffers } from "./offers"
import { AdminButton, AdminAvatar, AdminTabs, EmptyState, Panel, StatPanel, Tag } from "../ui"

/** Last six months. November is still running. */
const MONTHS = [
  { month: "Jun", revenue: 22000, members: 118 },
  { month: "Jul", revenue: 25000, members: 131 },
  { month: "Aug", revenue: 29000, members: 149 },
  { month: "Sep", revenue: 32000, members: 164 },
  { month: "Oct", revenue: 37000, members: 189 },
  { month: "Nov", revenue: 12000, members: 195 },
]
const OCT = 4

/** Sales · 01 Overview (Figma 535:7153): the month's numbers, what needs you, and what each tier brings in. */
export function RevenueOverview({ onProblems }: { onProblems: () => void }) {
  const { coach } = useCoach()
  const fresh = useNewPlatform()
  const months = fresh ? MONTHS.map((m) => ({ ...m, revenue: 0, members: 0 })) : MONTHS
  const paid = coach.tiers.filter((t) => !isFreeTier(t))
  const order = ["retrying", "failed", "disputed"]
  const attention = (fresh ? [] : TRANSACTIONS).filter((t) => !t.instalment && order.includes(t.status)).sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  const [metric, setMetric] = useState<"revenue" | "members">("revenue")
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? OCT
  const fmt = (v: number) => (metric === "revenue" ? (v === 0 ? "€0" : `€${Math.round(v / 1000)}k`) : String(v))
  const toneOf = { failed: "danger", retrying: "warning", disputed: "danger" } as const
  const byTier = paid.map((t) => ({ ...t, revenue: Math.round(Number(t.price.replace(/[^\d]/g, "")) * t.members * (t.cadence === "quarter" ? 1 / 3 : 1)) }))
  // Where the money came from: what offers collected this month, then each paid tier (Figma Sales 01 "Revenue by source").
  const { offers, links } = useOffers()
  const sum = totals(offers, links)
  const sources = [
    ...(offers.length > 0 ? [{ id: "offers", name: "Offers", icon: Ticket, revenue: fresh ? 0 : Math.max(0, MONEY.mrr - byTier.reduce((n, t) => n + t.revenue, 0)), detail: `${sum.sold} sold · ${offers.length} ${offers.length === 1 ? "offer" : "offers"}` }] : []),
    ...byTier.map((t, i) => ({ id: t.id, name: t.name, icon: [Users, LineChart, Star][i % 3], revenue: t.revenue, detail: `${t.members} members · ${t.price} / ${t.cadence === "quarter" ? "qtr" : "mo"}` })),
  ]
  const total = Math.max(sources.reduce((n, x) => n + x.revenue, 0), 1)

  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          fresh
            ? { label: "Revenue · this month", value: "€0", delta: "No sales yet" }
            : { label: "Revenue · October", value: `€${MONEY.mrr.toLocaleString("en")}`, delta: `+${MONEY.mrrChange}% · €${MONEY.mrrMore.toLocaleString("en")} more`, tone: "success" as const },
          { label: "Active members", value: paid.reduce((n, t) => n + t.members, 0).toLocaleString("en"), delta: fresh ? "No members yet" : "+14 this month" },
          fresh
            ? { label: "Next payout", value: "€0", delta: "Every Monday" }
            : { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: `${MONEY.nextPayout.date} · Bank ••7` },
          { label: "Needs attention", value: attention.length, delta: `${attention.filter((t) => t.status !== "disputed").length} failed · ${attention.filter((t) => t.status === "disputed").length} disputed` },
        ]}
      />
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel>
          <header className="flex items-center justify-between gap-2"><h2 className="t-heading-s text-a-text">Last 6 months, what students paid</h2><AdminTabs label="Chart metric" value={metric} onChange={setMetric} tabs={[{ id: "revenue", label: "Revenue" }, { id: "members", label: "Members" }]} /></header>
          <ChartContainer config={{ [metric]: { label: metric === "revenue" ? "Revenue" : "Members", color: "var(--admin-component-chart-bar-bg-default)" } } satisfies ChartConfig} className="aspect-auto h-[230px] w-full">
            <BarChart data={months} margin={{ top: 7, left: 0, right: 0 }} barCategoryGap="22%" onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
              <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
              <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={fmt} domain={metric === "revenue" ? [0, 40000] : [0, 200]} ticks={metric === "revenue" ? [0, 20000, 40000] : [0, 100, 200]} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} height={28} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => <span className="tabular-nums">{metric === "revenue" ? `€${Number(v).toLocaleString("en")}` : v}</span>} />} />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={metric} position="top" formatter={(v: unknown) => fmt(Number(v))} className="fill-[var(--admin-color-text-secondary)] text-[11px]" />
                {months.map((d, i) => (
                  <Cell key={d.month} fill={i === active ? (hover === null ? "var(--admin-component-chart-bar-bg-default)" : "var(--admin-component-chart-bar-bg-active)") : "var(--admin-component-chart-bar-bg-dim)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>
        <Panel className="gap-0 overflow-hidden p-0">
          <header className="flex items-center justify-between gap-2 px-5 py-4"><h2 className="t-heading-s text-a-text">Needs attention</h2><button type="button" onClick={onProblems} className="rounded-a-xs t-caption text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">All payments</button></header>
          {attention.length === 0 ? (
            <EmptyState compact title="All payments are fine." className="m-5 mt-0 py-8" />
          ) : (
            <>
            <div className="grid gap-1 border-t border-a-border-subtle px-5 py-3.5">
              <span className="t-metric text-a-text tabular-nums">€{attention.reduce((n, t) => n + t.amount, 0).toLocaleString("en")}</span>
              <span className="t-caption text-a-text-2">At risk this week · the next retry runs tonight</span>
            </div>
            <ul>
              {attention.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-t border-a-border-subtle px-5 py-3">
                  <AdminAvatar initials={t.who.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} />
                  <div className="min-w-0 flex-1">
                    <div className="t-body-m truncate text-a-text">{t.who}</div>
                    <div className="t-caption mt-1 truncate text-a-text-2">{t.status === "disputed" ? "Disputed" : "Payment failed"} · {t.what.split(" · ")[0]} €{t.amount}</div>
                  </div>
                  {t.status === "disputed" ? (
                    <AdminButton onClick={onProblems} hierarchy="secondary" size="lg">Answer the dispute</AdminButton>
                  ) : (
                    <Tag tone={toneOf[t.status as keyof typeof toneOf]}>{t.status === "retrying" ? "Retrying" : "Failed"}</Tag>
                  )}
                </li>
              ))}
            </ul>
            </>
          )}
        </Panel>
      </div>
      {sources.length > 0 && <Panel className="gap-4">
        <header className="flex items-center justify-between gap-2">
          <h2 className="t-heading-s text-a-text">Where October revenue came from</h2>
          <span className="t-body-m text-a-text">
            €{sources.reduce((n, x) => n + x.revenue, 0).toLocaleString("en")} <span className="t-caption text-a-text-3">in total</span>
          </span>
        </header>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((x) => {
            const share = (x.revenue / total) * 100
            return (
              <div key={x.id} className="flex min-w-0 flex-col gap-3 border-a-border-subtle p-4 first:pl-0 last:pr-0 max-sm:border-t max-sm:first:border-t-0 sm:max-lg:nth-[n+3]:border-t sm:max-lg:nth-[2n]:border-l sm:max-lg:nth-[2n]:pl-5 lg:border-l lg:first:border-l-0 lg:pl-5 lg:first:pl-0">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-a-md bg-a-selected text-a-icon">
                    <x.icon className="size-4" />
                  </span>
                  <span className="truncate t-body-m text-a-text">{x.name}</span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="t-heading-m text-a-text tabular-nums">€{x.revenue.toLocaleString("en")}</span>
                  <span className="t-caption text-a-text-3 tabular-nums">{Math.round(share)}%</span>
                </div>
                <span role="progressbar" aria-label={`${x.name}: ${Math.round(share)}% of revenue`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share)} className="block h-1.5 overflow-hidden rounded-full bg-a-progress">
                  <span className="block h-full rounded-full bg-[var(--admin-component-chart-bar-bg-default)]" style={{ width: `${share}%` }} />
                </span>
                <span className="truncate t-caption text-a-text-3">{x.detail}</span>
              </div>
            )
          })}
        </div>
      </Panel>}
    </div>
  )
}
