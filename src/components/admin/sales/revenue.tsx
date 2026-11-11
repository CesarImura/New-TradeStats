"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { useCoach } from "@/components/coach/coach-provider"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { isFreeTier } from "@/lib/data/access"
import { MONEY, TRANSACTIONS } from "@/lib/data/people"
import { AdminButton, AdminProgress, AdminSegmented, AdminTable, AdminTableHead, AdminTd, AdminTh, AdminTr, EmptyState, Panel, PanelHeader, StatPanel, Tag } from "../ui"

/** Last six months. November is still running. */
const MONTHS = [
  { month: "Jun", revenue: 22000, members: 118 },
  { month: "Jul", revenue: 25000, members: 131 },
  { month: "Aug", revenue: 28000, members: 149 },
  { month: "Sep", revenue: 32000, members: 164 },
  { month: "Oct", revenue: 37000, members: 189 },
  { month: "Nov", revenue: 12000, members: 195 },
]
const OCT = 4

/** Sales · 01 Overview (Figma 535:7153): the month's numbers, what needs you, and what each tier brings in. */
export function RevenueOverview({ onProblems }: { onProblems: () => void }) {
  const { coach } = useCoach()
  const paid = coach.tiers.filter((t) => !isFreeTier(t))
  const order = ["retrying", "failed", "disputed"]
  const attention = TRANSACTIONS.filter((t) => order.includes(t.status)).sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  const [metric, setMetric] = useState<"revenue" | "members">("revenue")
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? OCT
  const fmt = (v: number) => (metric === "revenue" ? (v === 0 ? "€0" : `€${Math.round(v / 1000)}k`) : String(v))
  const toneOf = { failed: "danger", retrying: "warning", disputed: "danger" } as const
  const byTier = paid.map((t) => ({ ...t, revenue: Math.round(Number(t.price.replace(/[^\d]/g, "")) * t.members * (t.cadence === "quarter" ? 1 / 3 : 1)) }))
  const total = Math.max(byTier.reduce((n, t) => n + t.revenue, 0), 1)

  return (
    <div className="flex flex-col gap-4">
      <StatPanel
        stats={[
          { label: "Revenue · October", value: `€${MONEY.mrr.toLocaleString("en")}`, delta: `+${MONEY.mrrChange}% · €${MONEY.mrrMore.toLocaleString("en")} more`, tone: "success" },
          { label: "Active members", value: paid.reduce((n, t) => n + t.members, 0).toLocaleString("en"), delta: "+14 this month" },
          { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: `${MONEY.nextPayout.date} · Bank ••7` },
          { label: "Needs attention", value: attention.length, delta: `${attention.filter((t) => t.status !== "disputed").length} failed · ${attention.filter((t) => t.status === "disputed").length} disputed` },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel>
          <PanelHeader title="Last 6 months, what students paid" actions={<AdminSegmented size="sm" label="Chart metric" value={metric} onChange={setMetric} options={[{ value: "revenue", label: "Revenue" }, { value: "members", label: "Members" }]} className="w-[168px]" />} />
          <ChartContainer config={{ [metric]: { label: metric === "revenue" ? "Revenue" : "Members", color: "var(--admin-color-accent-strong)" } } satisfies ChartConfig} className="aspect-auto h-[230px] w-full">
            <BarChart data={MONTHS} margin={{ top: 20, left: 0, right: 4 }} barCategoryGap="14%" onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
              <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={fmt} domain={metric === "revenue" ? [0, 40000] : [0, 200]} ticks={metric === "revenue" ? [0, 20000, 40000] : [0, 100, 200]} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => <span className="tabular-nums">{metric === "revenue" ? `€${Number(v).toLocaleString("en")}` : v}</span>} />} />
              <Bar dataKey={metric} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={metric} position="top" formatter={(v: unknown) => fmt(Number(v))} className="fill-[var(--admin-color-text-secondary)] text-[11px]" />
                {MONTHS.map((d, i) => (
                  <Cell key={d.month} fill={i === active ? "var(--admin-color-accent-strong)" : "var(--admin-color-chart-bar-muted)"} fillOpacity={i === active ? 1 : 0.45} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>
        <Panel className="gap-0 overflow-hidden p-0">
          <PanelHeader className="px-5 py-5" title="Needs attention" actions={<button type="button" onClick={onProblems} className="rounded-a-xs t-body-m text-a-text-2 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">All payments</button>} />
          {attention.length === 0 ? (
            <EmptyState compact title="All payments are fine." className="m-5 mt-0 py-8" />
          ) : (
            <ul>
              {attention.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-t border-a-border px-5 py-4">
                  <div className="min-w-0">
                    <div className="t-body-m-medium truncate">{t.who}</div>
                    <div className="t-caption truncate text-a-text-2">{t.status === "disputed" ? "Disputed" : "Payment failed"} · {t.what.split(" · ")[0]} €{t.amount}</div>
                  </div>
                  {t.status === "disputed" ? (
                    <AdminButton onClick={onProblems} hierarchy="secondary" size="lg">Answer the dispute</AdminButton>
                  ) : (
                    <Tag tone={toneOf[t.status as keyof typeof toneOf]} dot>{t.status === "retrying" ? "Retrying" : "Failed"}</Tag>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <AdminTable minWidth={640} scrollLabel="Revenue by tier">
        <AdminTableHead>
          <AdminTh>Tier</AdminTh>
          <AdminTh width={160}>Price</AdminTh>
          <AdminTh width={130} align="end">Members</AdminTh>
          <AdminTh width={170} align="end">Revenue · Oct</AdminTh>
          <AdminTh width={200}>Share</AdminTh>
        </AdminTableHead>
        <tbody>
          {byTier.map((t) => {
            const share = (t.revenue / total) * 100
            return (
              <AdminTr key={t.id}>
                <AdminTd className="text-a-text">{t.name}</AdminTd>
                <AdminTd>{t.price} / {t.cadence === "quarter" ? "qtr" : "mo"}</AdminTd>
                <AdminTd align="end">{t.members}</AdminTd>
                <AdminTd align="end">€{t.revenue.toLocaleString("en")}</AdminTd>
                <AdminTd><AdminProgress tone="accent" label={`${t.name}: ${Math.round(share)}% of revenue`} value={share} className="w-[112px]" /></AdminTd>
              </AdminTr>
            )
          })}
        </tbody>
      </AdminTable>
    </div>
  )
}
