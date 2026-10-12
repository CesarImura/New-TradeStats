"use client"

import { Area, AreaChart, Bar, BarChart, Cell, XAxis } from "recharts"
import { Check, Link2, X } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { JOURNAL_DAYS, JOURNAL_STATS, JOURNAL_WEEK, RULES } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Ring, WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const pnlConfig = { pnl: { label: "P&L", color: "var(--profit)" } } satisfies ChartConfig

function ConnectBroker() {
  const { coach } = useCoach()
  return (
    <WidgetEmpty
      icon={Link2}
      title="Connect your broker"
      text={`Your trades sync into your ${coach.wording.journal.toLowerCase()} automatically. Takes a minute.`}
      action={<Button size="sm">Connect</Button>}
    />
  )
}

/** P&L: chart (daily bars), number (big figure + curve), calendar (4-week heatmap). */
export function JournalPnl({ variant = "chart" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <ConnectBroker />
  const curve = JOURNAL_WEEK.reduce<{ day: string; v: number }[]>((acc, d) => [...acc, { day: d.day, v: (acc.at(-1)?.v ?? 0) + d.pnl }], [])
  const header = (
    <CardHeader>
      <CardDescription className="eyebrow">{coach.wording.journal} · {variant === "calendar" ? "last 4 weeks" : "this week"}</CardDescription>
      <CardTitle className={cn("tabular-nums text-profit", variant === "number" ? "text-5xl" : "text-2xl")}>
        {variant === "calendar" ? signed(JOURNAL_DAYS.flat().reduce((a, b) => a + b, 0)) : signed(JOURNAL_STATS.pnl)}
      </CardTitle>
      <CardAction className="text-right text-xs text-muted-foreground">
        {JOURNAL_STATS.trades} trades
        <br />
        {JOURNAL_STATS.winRate}% win rate
      </CardAction>
    </CardHeader>
  )

  if (variant === "calendar") {
    const max = Math.max(...JOURNAL_DAYS.flat().map(Math.abs))
    return (
      <Card>
        {header}
        <CardContent className="grid gap-1.5">
          <div className="grid grid-cols-5 gap-1.5 text-center text-[0.65rem] text-muted-foreground">
            {["M", "T", "W", "T", "F"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          {JOURNAL_DAYS.map((week, wi) => (
            <div key={wi} className="grid grid-cols-5 gap-1.5">
              {week.map((v, di) => (
                <span
                  key={di}
                  title={v ? signed(v) : "No trades"}
                  className="grid aspect-[5/3] place-items-center rounded-[min(var(--radius),6px)] text-[0.6rem] tabular-nums"
                  style={{
                    background: v === 0 ? "var(--muted)" : `color-mix(in oklab, ${v > 0 ? "var(--profit)" : "var(--loss)"} ${25 + (Math.abs(v) / max) * 60}%, transparent)`,
                  }}
                >
                  {v !== 0 && <span className="hidden @[14rem]:inline">{v > 0 ? "+" : "−"}{Math.abs(v)}</span>}
                </span>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (variant === "number") {
    return (
      <Card>
        {header}
        <CardContent className="mt-auto">
          <ChartContainer config={pnlConfig} className="aspect-auto h-14 w-full">
            <AreaChart data={curve} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Area dataKey="v" type="monotone" stroke="var(--profit)" fill="var(--profit)" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {header}
      <CardContent className="mt-auto">
        <ChartContainer config={pnlConfig} className="aspect-auto h-24 w-full">
          <BarChart data={JOURNAL_WEEK} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
            <Bar dataKey="pnl" radius={[3, 3, 3, 3]} isAnimationActive={false}>
              {JOURNAL_WEEK.map((d) => (
                <Cell key={d.day} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Rules followed: number, ring, breakdown (per rule). */
export function RulesFollowed({ variant = "number" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <ConnectBroker />
  const v = JOURNAL_STATS.rulesFollowed

  if (variant === "breakdown") {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">{coach.coachName}&apos;s rules</CardDescription>
          <CardTitle className="text-lg">How you kept them</CardTitle>
          <CardAction className="text-2xl font-semibold tabular-nums">{v}%</CardAction>
        </CardHeader>
        <CardContent className="grid gap-2.5">
          {RULES.map((r) => {
            const ok = r.kept === r.total
            return (
              <div key={r.rule} className="flex items-center gap-2.5 text-sm">
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", ok ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss")}>
                  {ok ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{r.rule}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {r.kept}/{r.total}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  if (variant === "ring") {
    return (
      <Card className="@container">
        <CardContent className="flex items-center gap-4">
          <Ring value={v} size={96} stroke={9}>
            <span className="text-2xl font-semibold tabular-nums">{v}%</span>
          </Ring>
          <div className="grid gap-1">
            <span className="eyebrow">{coach.wording.journal} · discipline</span>
            <span className="font-heading text-lg leading-tight">Rules followed</span>
            <span className="text-sm text-muted-foreground">Most missed: stop moved further away.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.journal} · discipline</CardDescription>
        <CardTitle className="text-5xl tabular-nums">{v}%</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-2 text-sm text-muted-foreground">
        <Progress value={v} />
        Rules followed on your last {JOURNAL_STATS.trades} trades.
      </CardContent>
    </Card>
  )
}
