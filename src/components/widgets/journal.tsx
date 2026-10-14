"use client"

import { Gauge, LineChart, Link2, Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { DISCIPLINE, EQUITY, JOURNAL_DAYS, JOURNAL_STATS, JOURNAL_WEEK, RULES, RULE_DAYS, R_BINS, R_STATS, SETUPS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, Bars, Big, Caps, Head, Heat, Radar, Row, Spark, Stat, Streak, TYPE, Track, W, useMore } from "./kit"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

/** Neutral fill for bars that are not the widget's one accent. */
const NEUTRAL = "color-mix(in oklab, var(--foreground) 40%, transparent)"
const rr = (v: number, digits = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}R`
const plText = (v: number) => (v >= 0 ? "text-profit" : "text-loss")

function ConnectBroker() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={Link2} title="Connect your broker" text={`Trades sync into your ${coach.wording.journal.toLowerCase()} automatically.`} action={<Button size="sm">Connect</Button>} />
}

// ---------- Performance

/**
 * The edge under the result (Detail = Detailed): what a trade earns in R and
 * which setup pays. Replaces the old "R-multiple spread" and "Win rate by
 * setup" widgets.
 */
function Edge() {
  const sorted = [...SETUPS].sort((a, b) => b.r - a.r)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const trades = R_BINS.reduce((n, b) => n + b.n, 0)
  return (
    <div className="grid shrink-0 gap-2 border-t border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-3">
      <div className="grid grid-cols-3 gap-3 @[26rem]:grid-cols-4">
        <Stat label="Expectancy" value={rr(R_STATS.expectancy, 2)} />
        <Stat label="Avg win" value={rr(R_STATS.avgWin)} />
        <Stat label="Avg loss" value={rr(R_STATS.avgLoss)} />
        <div className="hidden @[26rem]:block">
          <Stat label="Trades" value={trades} />
        </div>
      </div>
      <div>
        {[
          { s: best, tag: "Best setup" },
          { s: worst, tag: "Weakest setup" },
        ].map(({ s, tag }) => (
          <Row
            key={tag}
            title={s.name}
            sub={`${tag} · ${s.trades} trades · ${s.win}% win`}
            value={<span className={cn("font-medium", plText(s.r))}>{rr(s.r)}</span>}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Performance: curve (equity over 20 days), bars (this week, day by day),
 * heatmap (a four-week calendar). Detailed adds expectancy and best/worst setup.
 */
export function JournalPnl({ variant = "curve" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />

  if (variant === "heatmap") {
    const month = JOURNAL_DAYS.flat().reduce((a, b) => a + b, 0)
    const weeks = JOURNAL_DAYS.map((w) => w.reduce((a, b) => a + b, 0))
    const green = JOURNAL_DAYS.flat().filter((v) => v > 0).length
    const traded = JOURNAL_DAYS.flat().filter((v) => v !== 0).length
    return (
      <W>
        <Head icon={LineChart} label="Performance" value={signed(month)} tone={month >= 0 ? "profit" : "loss"} right={`${green} of ${traded} days green`} />
        <div className="flex min-h-0 flex-1 gap-3">
          <Heat rows={JOURNAL_DAYS} labels={["M", "T", "W", "T", "F"]} className="min-w-0" />
          {standard && (
            <div className="hidden w-14 shrink-0 flex-col gap-1 @[18rem]:flex">
              <Caps className="text-right">Week</Caps>
              {weeks.map((w, i) => (
                <span key={i} className={cn("flex min-h-2 flex-1 items-center justify-end text-xs tabular-nums", plText(w))}>
                  {signed(w)}
                </span>
              ))}
            </div>
          )}
        </div>
        {detailed && <Edge />}
      </W>
    )
  }

  if (variant === "bars") {
    const week = JOURNAL_WEEK.map((d) => d.pnl)
    return (
      <W>
        <Head icon={LineChart} label="Performance" right={coach.wording.journal} />
        <Big value={signed(JOURNAL_STATS.pnl)} sub={`This week · ${JOURNAL_STATS.trades} trades · ${JOURNAL_STATS.winRate}% win`} />
        {standard && <Bars diverging values={week} labels={JOURNAL_WEEK.map((d) => d.day[0])} tips={JOURNAL_WEEK.map((d) => d.day)} format={signed} className="min-h-10" />}
        {detailed && <Edge />}
      </W>
    )
  }

  // curve
  const total = EQUITY[EQUITY.length - 1]
  return (
    <W>
      <Head icon={LineChart} label="Performance" right="Last 20 days" />
      <Big
        size="lg"
        value={signed(total)}
        sub={
          <>
            <span className={plText(JOURNAL_STATS.pnl)}>{signed(JOURNAL_STATS.pnl)}</span> this week · {JOURNAL_STATS.winRate}% win
          </>
        }
      />
      {standard && <Spark values={EQUITY} format={signed} tip={(i) => `Day ${i + 1}`} />}
      {detailed && <Edge />}
    </W>
  )
}

// ---------- Discipline

/** The coach's rules, kept out of total. The weakest rule carries the accent unless the widget already spent it. */
function RuleList({ accent = true, className }: { accent?: boolean; className?: string }) {
  const weakest = [...RULES].sort((a, b) => a.kept / a.total - b.kept / b.total)[0]
  return (
    <div className={cn("grid min-h-0 flex-1 content-evenly gap-2", className)}>
      {RULES.map((r) => {
        const weak = r === weakest
        return (
          <div key={r.rule} className="grid gap-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className={cn(TYPE.body, "truncate", weak && "font-medium")}>{r.rule}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                {r.kept}/{r.total}
              </span>
            </div>
            <Track value={(r.kept / r.total) * 100} color={weak && accent ? ACCENT : NEUTRAL} />
          </div>
        )
      })}
    </div>
  )
}

/** Discipline: radar (by area), streak (clean days in a row), rules (each of the coach's rules). */
export function RulesFollowed({ variant = "radar" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />
  const v = JOURNAL_STATS.rulesFollowed
  const weakestArea = [...DISCIPLINE].sort((a, b) => a.v - b.v)[0]
  const weakestRule = [...RULES].sort((a, b) => a.kept / a.total - b.kept / b.total)[0]
  let streak = 0
  for (let i = RULE_DAYS.length - 1; i >= 0 && RULE_DAYS[i]; i--) streak++
  const clean = RULE_DAYS.filter(Boolean).length

  if (variant === "streak") {
    return (
      <W>
        <Head icon={Shield} label="Clean streak" right={`${coach.coachName}'s rules`} />
        <Big size="lg" value={streak} unit={streak === 1 ? "day" : "days"} sub={`${clean} of the last ${RULE_DAYS.length} days clean`} />
        {standard && (
          <div className="mt-auto grid gap-1.5">
            <Streak days={RULE_DAYS} />
            <div className="flex justify-between">
              <Caps>{RULE_DAYS.length} days ago</Caps>
              <Caps>Today</Caps>
            </div>
          </div>
        )}
        {detailed && <RuleList accent={false} className="flex-none border-t border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-3" />}
      </W>
    )
  }

  if (variant === "rules") {
    if (!standard) {
      return (
        <W>
          <Head icon={Shield} label="Rules kept" />
          <Big size="lg" value={`${v}%`} sub={`Weakest: ${weakestRule.rule}`} />
        </W>
      )
    }
    return (
      <W>
        <Head icon={Shield} label="Rules kept" value={`${v}%`} tone="fg" right={`${JOURNAL_STATS.trades} trades`} />
        <RuleList />
        {detailed && (
          <div className="grid shrink-0 grid-cols-3 gap-3 border-t border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] pt-3">
            <Stat label="Clean days" value={`${clean}/${RULE_DAYS.length}`} />
            <Stat label="Streak" value={`${streak}d`} />
            <Stat label="Weakest area" value={weakestArea.label} />
          </div>
        )}
      </W>
    )
  }

  // radar
  return (
    <W>
      <Head icon={Gauge} label="Discipline" value={`${v}%`} tone="fg" right={`${JOURNAL_STATS.trades} trades`} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 @[26rem]:flex-row">
        <div className="relative min-h-0 flex-1">
          <Radar axes={DISCIPLINE} className="absolute inset-0" />
        </div>
        {detailed && (
          <div className="grid shrink-0 content-center gap-2 @[26rem]:w-[44%]">
            {[...DISCIPLINE]
              .sort((a, b) => a.v - b.v)
              .map((a) => (
                <div key={a.label} className="grid gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(TYPE.body, "truncate", a === weakestArea && "font-medium")}>{a.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{a.v}%</span>
                  </div>
                  <Track value={a.v} color={NEUTRAL} />
                </div>
              ))}
          </div>
        )}
      </div>
      {standard && !detailed && (
        <p className={cn(TYPE.small, "truncate")}>
          Weakest: <span className="text-foreground">{weakestArea.label}</span> · {weakestArea.v}%
        </p>
      )}
    </W>
  )
}
