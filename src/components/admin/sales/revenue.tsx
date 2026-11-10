"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { useCoach } from "@/components/coach/coach-provider"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MONEY, TRANSACTIONS } from "@/lib/data/people"
import { REVENUE_MONTHS } from "@/lib/data/sample"
import { AdminButton, AdminTabs, EmptyState, Panel, PanelHeader, StatPanel, Tag } from "../ui"

// ---------- ADM-35 Revenue

export function RevenueOverview({ onProblems }: { onProblems: () => void }) {
  const { coach } = useCoach()
  const attention = TRANSACTIONS.filter((t) => ["failed", "retrying", "disputed"].includes(t.status))
  const members = coach.tiers.reduce((n, t) => n + t.members, 0)
  const [metric, setMetric] = useState<"revenue" | "members">("revenue")
  const data = REVENUE_MONTHS.map((m, i) => ({ ...m, members: Math.round(members * (0.72 + i * 0.056)) }))
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? data.length - 1
  const fmt = (v: number) => (metric === "revenue" ? `€${Math.round(v / 1000)}k` : String(v))
  const toneOf = { failed: "danger", retrying: "warning", disputed: "danger" } as const
  const revenueByTier = coach.tiers.map((t) => ({ ...t, revenue: Math.round(Number(t.price.replace(/[^\d]/g, "")) * t.members * (t.cadence === "quarter" ? 1 / 3 : 1)) }))
  const maxRevenue = Math.max(...revenueByTier.map((t) => t.revenue), 1)
  return (
    <div className="grid gap-4">
      <StatPanel
        stats={[
          { label: "Revenue · October", value: `€${MONEY.mrr.toLocaleString("en")}`, delta: `+${MONEY.mrrChange}% · €${Math.round((MONEY.mrr * MONEY.mrrChange) / 100).toLocaleString("en")} more`, tone: "success" },
          { label: "Active members", value: coach.tiers.filter((t) => t.price !== "€0").reduce((n, t) => n + t.members, 0).toLocaleString("en"), delta: "+14 this month" },
          { label: "Next payout", value: `€${MONEY.nextPayout.amount.toLocaleString("en")}`, delta: `${MONEY.nextPayout.date} · Bank ••7` },
          { label: "Needs attention", value: attention.length, delta: `${attention.filter((t) => t.status !== "disputed").length} failed · ${attention.filter((t) => t.status === "disputed").length} disputed` },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader
            title="Last 6 months, what students paid"
            actions={<AdminTabs label="Chart metric" tabs={[{ id: "revenue", label: "Revenue" }, { id: "members", label: "Members" }]} value={metric} onChange={setMetric} />}
          />
          <ChartContainer config={{ [metric]: { label: metric === "revenue" ? "Revenue" : "Members", color: "var(--admin-color-accent-strong)" } } satisfies ChartConfig} className="aspect-auto h-60 w-full">
            <BarChart data={data} margin={{ top: 20, left: 0, right: 4 }} barCategoryGap="14%" onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
              <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={fmt} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => <span className="tabular-nums">{metric === "revenue" ? `€${Number(v).toLocaleString("en")}` : v}</span>} />} />
              <Bar dataKey={metric} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={metric} position="top" formatter={(v: unknown) => fmt(Number(v))} className="fill-[var(--admin-color-text-secondary)] text-[11px]" />
                {data.map((d, i) => (
                  <Cell key={d.month} fill={i === active ? "var(--admin-color-accent-strong)" : "var(--admin-color-chart-bar-muted)"} fillOpacity={i === active ? 1 : 0.45} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Panel>
        <Panel>
          <PanelHeader title="Needs attention" actions={<button onClick={onProblems} className="t-body-m text-a-text-2 hover:text-a-text">All payments</button>} />
          {attention.length === 0 ? (
            <EmptyState compact title="All payments are fine." className="py-8" />
          ) : (
            <ul className="flex flex-col divide-y divide-a-border-subtle">
              {attention.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
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
      <Panel className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Revenue · Oct</TableHead>
              <TableHead className="hidden w-48 sm:table-cell">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueByTier.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="pl-5 font-medium">{t.name}</TableCell>
                <TableCell className="text-a-text-2">{t.price} / {t.cadence === "quarter" ? "qtr" : "mo"}</TableCell>
                <TableCell className="text-right tabular-nums">{t.members}</TableCell>
                <TableCell className="text-right tabular-nums">€{t.revenue.toLocaleString("en")}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="h-1.5 w-40 overflow-hidden rounded-full bg-a-track" role="img" aria-label={`${Math.round((t.revenue / maxRevenue) * 100)}% of the top tier`}>
                    <div className="h-full rounded-full bg-a-accent-strong" style={{ width: `${(t.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <p className="t-caption text-a-text-2">October in full: students paid €19,360, our share 5% (−€968), card and payment fees (−€452), to you €{MONEY.month.toLocaleString("en")}. VAT is collected and paid for you; it isn&apos;t in these numbers.</p>
    </div>
  )
}
