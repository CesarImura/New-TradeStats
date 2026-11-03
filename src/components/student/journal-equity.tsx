"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { fmtPnl } from "@/lib/data/trades"

const equityConfig = { v: { label: "Equity", color: "var(--primary)" } } satisfies ChartConfig

/** The Journal's equity curve. */
export function EquityChart({ data }: { data: { d: number; v: number }[] }) {
  return (
    <ChartContainer config={equityConfig} className="aspect-auto min-h-56 w-full flex-1">
      <AreaChart data={data} margin={{ left: 0, right: 4, top: 8 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-v)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(d) => (d % 5 === 0 ? `Day ${d}` : "")} />
        <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v) => <span className="font-mono tabular-nums">{fmtPnl(Number(v))}</span>} />} />
        <Area dataKey="v" type="monotone" stroke="var(--color-v)" strokeWidth={2} fill="url(#eq)" />
      </AreaChart>
    </ChartContainer>
  )
}
