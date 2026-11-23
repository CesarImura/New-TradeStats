"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { AdminTabs, Panel } from "../ui"

/** Last six months, split into what subscriptions and offers brought in (October adds up to the month's €37,180). November is still running. */
const MONTHS = [
  { month: "Jun", name: "JUNE", subs: 9000, offers: 13000, members: 118 },
  { month: "Jul", name: "JULY", subs: 9600, offers: 15400, members: 131 },
  { month: "Aug", name: "AUGUST", subs: 10200, offers: 18800, members: 149 },
  { month: "Sep", name: "SEPTEMBER", subs: 10900, offers: 21100, members: 164 },
  { month: "Oct", name: "OCTOBER", subs: 11860, offers: 25320, members: 189 },
  { month: "Nov", name: "NOVEMBER", subs: 9400, offers: 2600, members: 189 },
]
const SUBS = "var(--admin-color-status-success-fill)"
const OFFERS = "var(--admin-component-chart-bar-bg-default)"
const eur = (v: number) => `€${Math.round(v).toLocaleString("en")}`
const k = (v: number) => (v === 0 ? "€0" : `€${Math.round(v / 1000)}k`)

type Point = (typeof MONTHS)[number] & { total: number }

/** Sales · 01 chart (Figma Sales 01 hover, 01d default): subscriptions and offers stacked. At rest every bar is full; on hover the others dim and the month gets a column and a card. */
export function RevenueChart({ fresh, paying }: { fresh: boolean; /** Paying members today (every tier but the free one, offer-only included): the last month of the Members tab, so it matches Tiers & prices. */ paying: number }) {
  const [metric, setMetric] = useState<"revenue" | "members">("revenue")
  const [hover, setHover] = useState<number | null>(null)
  const data: Point[] = MONTHS.map((m, i) => (fresh ? { ...m, subs: 0, offers: 0, members: 0, total: 0 } : { ...m, members: i === MONTHS.length - 1 ? paying : m.members, total: m.subs + m.offers }))
  const dim = (i: number) => (hover !== null && hover !== i ? 0.38 : 1)
  const fmt = (v: number) => (metric === "revenue" ? k(v) : String(v))
  return (
    <Panel>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="t-heading-s text-a-text">Last 6 months</h2>
        <div className="flex items-center gap-4">
          {metric === "revenue" && (
            <ul className="flex items-center gap-4 t-caption text-a-text-2">
              {[["Subscriptions", SUBS], ["Offers", OFFERS]].map(([n, c]) => (
                <li key={n} className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px]" style={{ background: c }} />{n}</li>
              ))}
            </ul>
          )}
          <AdminTabs label="Chart metric" value={metric} onChange={setMetric} tabs={[{ id: "revenue", label: "Revenue" }, { id: "members", label: "Members" }]} />
        </div>
      </header>
      <ChartContainer config={{ subs: { label: "Subscriptions", color: SUBS }, offers: { label: "Offers", color: OFFERS }, members: { label: "Members", color: OFFERS } } satisfies ChartConfig} className="aspect-auto h-[230px] w-full">
        <BarChart data={data} margin={{ top: 14, left: 0, right: 0 }} barCategoryGap="22%" onMouseMove={(st) => setHover(st.activeTooltipIndex === undefined || st.activeTooltipIndex === null ? null : Number(st.activeTooltipIndex))} onMouseLeave={() => setHover(null)}>
          <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
          <YAxis tickLine={false} axisLine={false} width={36} tickFormatter={fmt} domain={metric === "revenue" ? [0, 40000] : [0, 200]} ticks={metric === "revenue" ? [0, 20000, 40000] : [0, 100, 200]} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} height={28} tickMargin={8} />
          <ChartTooltip cursor={{ fill: "var(--admin-color-chart-grid)", opacity: 0.6 }} content={<Tip metric={metric} />} />
          {metric === "revenue" ? (
            <>
              <Bar dataKey="subs" stackId="a" isAnimationActive={false}>
                {data.map((d, i) => <Cell key={d.month} fill={SUBS} fillOpacity={dim(i)} />)}
              </Bar>
              <Bar dataKey="offers" stackId="a" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.map((d, i) => <Cell key={d.month} fill={OFFERS} fillOpacity={dim(i)} />)}
                <LabelList dataKey="offers" position="top" content={({ x, y, width, index }) => <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" className="fill-[var(--admin-color-text-secondary)] text-[11px]">{k(data[Number(index)].total)}</text>} />
              </Bar>
            </>
          ) : (
            <Bar dataKey="members" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => <Cell key={d.month} fill={OFFERS} fillOpacity={dim(i)} />)}
              <LabelList dataKey="members" position="top" formatter={(v: unknown) => String(v)} className="fill-[var(--admin-color-text-secondary)] text-[11px]" />
            </Bar>
          )}
        </BarChart>
      </ChartContainer>
    </Panel>
  )
}

/** The hover card: the month, each series with its marker and value, and the total. */
function Tip({ active, payload, metric }: { active?: boolean; payload?: { payload: Point }[]; metric: "revenue" | "members" }) {
  const d = payload?.[0]?.payload
  if (!active || !d) return null
  const rows = metric === "revenue" ? [["Offers", eur(d.offers), OFFERS], ["Subscriptions", eur(d.subs), SUBS]] : [["Members", String(d.members), OFFERS]]
  return (
    <div className="flex min-w-44 flex-col gap-2.5 rounded-a-md border border-a-border bg-a-raised px-3 py-2.5 shadow-lg">
      <span className="t-micro text-a-text-2">{d.name}</span>
      <div className="flex flex-col gap-2">
        {rows.map(([n, v, c]) => (
          <div key={n} className="flex items-center justify-between gap-4 t-caption">
            <span className="flex items-center gap-2 text-a-text-2"><span aria-hidden className="size-2 rounded-[2px]" style={{ background: c }} />{n}:</span>
            <span className="t-mono-data text-a-text tabular-nums">{v}</span>
          </div>
        ))}
        {metric === "revenue" && (
          <div className="flex items-center justify-between gap-4 border-t border-a-border pt-2 t-caption">
            <span className="text-a-text-2">Total:</span>
            <span className="t-mono-data text-a-text tabular-nums">{eur(d.total)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
