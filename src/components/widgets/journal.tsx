"use client"

import { Check, Gauge, LineChart, Link2, Shield, X } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { DISCIPLINE, EQUITY, JOURNAL_DAYS, JOURNAL_STATS, JOURNAL_WEEK, RULE_DAYS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Bars, Big, Caps, Head, Heat, Radar, Ring, Spark, W } from "./kit"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

function ConnectBroker() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={Link2} title="Connect your broker" text={`Trades sync into your ${coach.wording.journal.toLowerCase()} automatically.`} action={<Button size="sm">Connect</Button>} />
}

/** P&L: bars (each day above or below zero), curve (equity line), heatmap (last four weeks). */
export function JournalPnl({ variant = "bars" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <ConnectBroker />
  const month = JOURNAL_DAYS.flat().reduce((a, b) => a + b, 0)

  if (variant === "curve") {
    return (
      <W>
        <Head icon={LineChart} tone="profit" value={`${JOURNAL_STATS.winRate}%`} unit="win" right="20 days" />
        <Big value={signed(EQUITY[EQUITY.length - 1])} tone="profit" sub={`${JOURNAL_STATS.trades} trades this week`} />
        <Spark values={EQUITY} tone="profit" format={signed} tip={(i) => `Day ${i + 1}`} />
      </W>
    )
  }

  if (variant === "heatmap") {
    return (
      <W>
        <Head icon={LineChart} tone={month >= 0 ? "profit" : "loss"} value={signed(month)} label="4 weeks" right={coach.wording.journal} />
        <Heat rows={JOURNAL_DAYS} labels={["M", "T", "W", "T", "F"]} />
      </W>
    )
  }

  return (
    <W>
      <Head icon={LineChart} tone="profit" value={`${JOURNAL_STATS.winRate}%`} unit="win" right="This week" />
      <Big value={signed(JOURNAL_STATS.pnl)} tone="profit" sub={`${JOURNAL_STATS.trades} trades`} />
      <Bars diverging values={JOURNAL_WEEK.map((d) => d.pnl)} labels={JOURNAL_WEEK.map((d) => d.day[0])} tips={JOURNAL_WEEK.map((d) => d.day)} format={signed} />
    </W>
  )
}

/** Rules followed: radar (discipline by area), ring (one number), streak (last 10 days). */
export function RulesFollowed({ variant = "radar" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <ConnectBroker />
  const v = JOURNAL_STATS.rulesFollowed
  const weakest = [...DISCIPLINE].sort((a, b) => a.v - b.v)[0]

  if (variant === "ring") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={v} size={80} stroke={8}>
          <span className="font-heading text-lg font-semibold tabular-nums">{v}%</span>
        </Ring>
        <div className="grid min-w-0 gap-1.5">
          <Head icon={Shield} label="Rules kept" />
          <span className="truncate text-sm text-muted-foreground">
            Weakest: <span className="text-foreground">{weakest.label}</span>
          </span>
        </div>
      </W>
    )
  }

  if (variant === "streak") {
    let streak = 0
    for (let i = RULE_DAYS.length - 1; i >= 0 && RULE_DAYS[i]; i--) streak++
    return (
      <W>
        <Head icon={Shield} tone="profit" value={streak} unit="days" label="Clean streak" right="Last 10 days" />
        <div className="grid flex-1 grid-cols-10 items-center gap-1">
          {RULE_DAYS.map((ok, i) => (
            <span key={i} className={cn("r-dot grid aspect-square place-items-center", ok ? "bg-profit text-white" : "bg-loss/15 text-loss")}>
              {ok ? <Check className="size-[55%]" /> : <X className="size-[55%]" />}
            </span>
          ))}
        </div>
        <Caps className="hidden @[16rem]:block">{coach.coachName}&apos;s rules, every trading day</Caps>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Gauge} value={`${v}%`} label="Discipline" right={`Weakest: ${weakest.label}`} />
      <div className="relative min-h-0 flex-1">
        <Radar axes={DISCIPLINE} className="absolute inset-0" />
      </div>
    </W>
  )
}
