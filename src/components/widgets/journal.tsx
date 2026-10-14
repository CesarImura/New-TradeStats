"use client"

import { useState } from "react"
import { LineChart, Link2, Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { JOURNAL_STATS, JOURNAL_WEEK, RULE_DAYS, R_STATS, SETUPS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Chip, GREY, Label, Legend, Num, Rule, StepChart, TickBar, TickGauge, WCard, useFigureFont } from "./instrument"
import { ACCENT, ACCENT_TEXT, useMore } from "./kit"
import { BleedArea, BleedBars, HeroCard } from "./layouts"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const rr = (v: number, digits = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}R`
const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`
/** A result tint: profit or loss, softened. Mixed with transparent so it also works on a Star card. */
const soft = (v: number, strength: number) => `color-mix(in oklab, ${v >= 0 ? "var(--profit)" : "var(--loss)"} ${strength}%, transparent)`
const plColor = (v: number) => (v > 0 ? "var(--profit)" : v < 0 ? "var(--loss)" : "var(--muted-foreground)")
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"

function ConnectBroker() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={Link2} title="Connect your broker" text={`Trades sync into your ${coach.wording.journal.toLowerCase()} automatically.`} action={<Button size="sm">Connect</Button>} />
}

/** A small label over a figure: used in the Edge strip. */
function Fig({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  const font = useFigureFont()
  return (
    <div className="grid min-w-0 gap-0.5">
      <Label className="truncate">{label}</Label>
      <span className="truncate text-[0.8125rem] leading-5 tabular-nums" style={{ fontFamily: font, color }}>
        {value}
      </span>
    </div>
  )
}

/**
 * A gauge that fits whatever height the card leaves it (size container):
 * as wide as the card allows, never taller than the space.
 */
function FitGauge({ value, max = 100, children }: { value: number; max?: number; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-20 flex-1 items-end justify-center [container-type:size]">
      <TickGauge value={value} max={max} className="w-[min(100cqw,189cqh)] max-w-80">
        {children}
      </TickGauge>
    </div>
  )
}

// ---------- Performance

/** The last 20 trading days, Monday to Friday, four weeks. The last week is the journal's week. */
const DAYS: number[][] = [[120, -80, 0, 260, -90], [-210, 140, 310, -60, 0], [80, 0, -150, -20, 140], JOURNAL_WEEK.map((d) => d.pnl)]
const DAILY = DAYS.flat()
const EQUITY_20 = DAILY.reduce<number[]>((a, v) => [...a, (a[a.length - 1] ?? 0) + v], [])
/** The coach's model account over the same 20 days (cumulative P&L). */
const MODEL_20 = [60, 110, 90, 180, 240, 300, 280, 360, 420, 470, 520, 560, 610, 700, 760, 850, 940, 1010, 1060, 1180]
const BALANCE = { you: 52340, model: 51180 }
const WEEKDAYS = ["M", "T", "W", "T", "F"]

/** Daily P&L as soft diverging bars, grouped by week, the week's total under each group. */
function DayBars() {
  const [hover, setHover] = useState<number>()
  const font = useFigureFont()
  const up = Math.max(...DAILY, 1)
  const down = Math.max(...DAILY.map((v) => -v), 1)
  const last = DAILY.length - 1
  return (
    <div className="flex min-h-16 flex-1 flex-col gap-1.5" onPointerLeave={() => setHover(undefined)}>
      <div className="relative flex min-h-0 flex-1 gap-2.5">
        <span className="absolute inset-x-0 h-px" style={{ top: `${(up / (up + down)) * 100}%`, background: TRACK }} />
        {DAYS.map((week, w) => (
          <div key={w} className="flex min-w-0 flex-1 gap-[3px]">
            {week.map((v, d) => {
              const i = w * 5 + d
              const on = hover === i
              return (
                <div key={d} className="relative flex min-w-0 flex-1 flex-col" onPointerEnter={() => setHover(i)}>
                  <div className="flex items-end" style={{ flex: up }}>
                    {v > 0 && <span className="r-bar w-full" style={{ height: `${(v / up) * 100}%`, background: soft(v, on || i === last ? 85 : 42) }} />}
                  </div>
                  <div className="flex items-start" style={{ flex: down }}>
                    {v < 0 && <span className="r-bar w-full" style={{ height: `${(-v / down) * 100}%`, background: soft(v, on || i === last ? 85 : 42) }} />}
                  </div>
                  {v === 0 && <span className="r-dot absolute left-1/2 size-1 -translate-1/2" style={{ top: `${(up / (up + down)) * 100}%`, background: GREY[2] }} />}
                  {on && (
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 -translate-x-1/2 rounded-[min(var(--radius),4px)] bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums"
                      style={{ fontFamily: font }}
                    >
                      Wk {w + 1} · {["Mon", "Tue", "Wed", "Thu", "Fri"][d]} · {v ? signed(v) : "no trades"}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
        {DAYS.map((week, w) => {
          const t = week.reduce((a, b) => a + b, 0)
          return (
            <span key={w} className="min-w-0 flex-1 truncate text-center" style={{ color: plColor(t) }}>
              {signed(t)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** A calendar of the 20 days, softly shaded by result, the week's total on the right. */
function DayCalendar() {
  const font = useFigureFont()
  const max = Math.max(...DAILY.map(Math.abs), 1)
  const cols = { gridTemplateColumns: "repeat(5, minmax(0,1fr)) auto" }
  return (
    <div className="flex min-h-20 flex-1 flex-col gap-1" style={{ fontFamily: font }}>
      <div className="grid gap-1" style={cols}>
        {WEEKDAYS.map((l, i) => (
          <Label key={i} className="text-center">
            {l}
          </Label>
        ))}
        <Label className="hidden w-12 text-right @[16rem]:block">Week</Label>
      </div>
      {DAYS.map((week, w) => {
        const t = week.reduce((a, b) => a + b, 0)
        return (
          <div key={w} className="grid min-h-5 flex-1 gap-1" style={cols}>
            {week.map((v, d) => {
              const today = w === DAYS.length - 1 && d === week.length - 1
              return (
                <span
                  key={d}
                  title={`Week ${w + 1} · ${["Mon", "Tue", "Wed", "Thu", "Fri"][d]} · ${v ? signed(v) : "no trades"}`}
                  className="r-bar grid place-items-center overflow-hidden text-[0.6875rem] leading-none tabular-nums"
                  style={{
                    background: v === 0 ? undefined : soft(v, 10 + Math.round((Math.abs(v) / max) * 32)),
                    boxShadow: v === 0 ? `inset 0 0 0 1px ${TRACK}` : today ? `inset 0 0 0 1.5px ${ACCENT}` : undefined,
                  }}
                >
                  <span className={cn("hidden @[22rem]:inline", v === 0 ? "text-muted-foreground" : "text-foreground")}>{v === 0 ? "·" : `${v > 0 ? "+" : "−"}${Math.abs(v)}`}</span>
                </span>
              )
            })}
            <span className="hidden w-12 self-center text-right text-[0.6875rem] leading-4 tabular-nums @[16rem]:block" style={{ color: plColor(t) }}>
              {signed(t)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** The edge under the result (Detail = Detailed): what a trade earns in R and which setup pays. */
function Edge() {
  const sorted = [...SETUPS].sort((a, b) => b.r - a.r)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  return (
    <div className="grid shrink-0 gap-2.5">
      <Rule />
      <div className="grid grid-cols-3 gap-3">
        <Fig label="Expectancy" value={rr(R_STATS.expectancy, 2)} color={ACCENT_TEXT} />
        <Fig label="Avg win" value={rr(R_STATS.avgWin)} />
        <Fig label="Avg loss" value={rr(R_STATS.avgLoss)} />
      </div>
      <Legend
        items={[
          { color: "var(--profit)", label: `Best · ${best.name} · ${best.win}% win`, value: rr(best.r), valueTone: "profit" },
          { color: "var(--loss)", label: `Weakest · ${worst.name} · ${worst.win}% win`, value: rr(worst.r), valueTone: "loss" },
        ]}
      />
    </div>
  )
}

/**
 * Performance: curve (equity against the coach's model account), bars (daily
 * P&L by week), heatmap (a four-week calendar). Detailed adds the edge.
 */
export function JournalPnl({ variant = "curve" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />

  const total = EQUITY_20[EQUITY_20.length - 1]
  const green = DAILY.filter((v) => v > 0).length
  const red = DAILY.filter((v) => v < 0).length
  const best = Math.max(...DAILY)
  const worst = Math.min(...DAILY)
  const headline = <Num value={signed(total)} delta={`${signed(JOURNAL_STATS.pnl)} this week`} deltaTone={JOURNAL_STATS.pnl >= 0 ? "profit" : "loss"} />
  const card = (children: React.ReactNode) => (
    <WCard icon={LineChart} title="Performance" meta={`${coach.wording.journal} · last ${DAILY.length} days · ${JOURNAL_STATS.trades} trades`} chip={<Chip>{JOURNAL_STATS.winRate}% win</Chip>}>
      {children}
    </WCard>
  )

  if (variant === "hero") {
    const week = JOURNAL_STATS.pnl
    return (
      <HeroCard
        title={`Performance · last ${DAILY.length} days`}
        chip={<Chip>{JOURNAL_STATS.winRate}% win</Chip>}
        value={signed(total)}
        delta={standard ? `${signed(week)} this week` : undefined}
        deltaTone={week >= 0 ? "profit" : "loss"}
        line={standard ? `${green} green days out of ${green + red}. You're ${signed(total - MODEL_20[MODEL_20.length - 1])} against ${coach.coachName}'s model account.` : undefined}
        stats={
          detailed
            ? [
                { label: "Expectancy", value: rr(R_STATS.expectancy, 2), tone: "accent" },
                { label: "Best day", value: signed(best), tone: "profit" },
                { label: "Worst day", value: signed(worst), tone: "loss" },
              ]
            : undefined
        }
        foot={standard ? <BleedArea values={EQUITY_20} /> : undefined}
      />
    )
  }

  if (variant === "bars") {
    return card(
      <>
        {headline}
        <DayBars />
        {standard && (
          <Legend
            className="shrink-0 @[20rem]:grid-cols-2 @[20rem]:gap-x-5"
            items={[
              { color: "var(--profit)", label: "Green days", value: `${green} of ${green + red}` },
              { color: "var(--loss)", label: "Red days", value: red },
            ]}
          />
        )}
        {detailed && <Edge />}
      </>,
    )
  }

  if (variant === "heatmap") {
    return card(
      <>
        {headline}
        <DayCalendar />
        {standard && (
          <Legend
            className="shrink-0 @[20rem]:grid-cols-2 @[20rem]:gap-x-5"
            items={[
              { color: "var(--profit)", label: "Green days", value: `${green} of ${green + red}` },
              { color: "var(--loss)", label: "Best · worst", value: `${signed(best)} · ${signed(worst)}` },
            ]}
          />
        )}
        {detailed && <Edge />}
      </>,
    )
  }

  // curve
  return card(
    <>
      {headline}
      <StepChart
        className="min-h-14 flex-1"
        height={0}
        format={signed}
        series={[
          { values: EQUITY_20, label: "Your equity" },
          { values: MODEL_20, label: `${coach.coachName}'s model account` },
        ]}
      />
      {standard && (
        <Legend
          className="shrink-0"
          items={[
            { color: ACCENT, label: "Your equity", value: euro(BALANCE.you) },
            { color: GREY[1], label: `${coach.coachName}'s model account`, value: euro(BALANCE.model) },
            ...(detailed ? [] : [{ label: "Expectancy", value: rr(R_STATS.expectancy, 2), valueTone: "accent" as const }]),
          ]}
        />
      )}
      {detailed && <Edge />}
    </>,
  )
}

// ---------- Discipline

/** The coach's five rules over the last 19 trades. `miss` shows a never-do rule as how often it was broken. */
const RULE_SET = [
  { rule: "Max 1% risk per trade", kept: 19, total: 19 },
  { rule: "Stop set before entry", kept: 17, total: 19 },
  { rule: "No trades in news", kept: 15, total: 19 },
  { rule: "Never move a stop", kept: 16, total: 19, miss: "Moved a stop" },
  { rule: "Journal every trade", kept: 13, total: 19 },
]
const KEPT = Math.round((RULE_SET.reduce((a, r) => a + r.kept, 0) / RULE_SET.reduce((a, r) => a + r.total, 0)) * 100)
const ruleRow = (r: (typeof RULE_SET)[number]) =>
  r.miss
    ? { color: "var(--loss)", label: r.miss, value: `${r.total - r.kept}×`, valueTone: "loss" as const }
    : { color: r.kept / r.total >= 0.85 ? GREY[0] : GREY[2], label: r.rule, value: `${r.kept}/${r.total}` }

/** The last 10 trading days as dots: the current clean run in the accent, broken days as a loss ring. */
function DayDots({ days, run }: { days: boolean[]; run: number }) {
  const letters = ["M", "T", "W", "T", "F"]
  return (
    <div className="grid shrink-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
      {days.map((d, i) => (
        <div key={i} className="grid justify-items-center gap-1.5">
          <span
            className="r-dot size-3"
            title={d ? "Clean" : "Broke a rule"}
            style={d ? { background: i >= days.length - run ? ACCENT : GREY[1] } : { boxShadow: "inset 0 0 0 1.5px var(--loss)" }}
          />
          <Label>{letters[i % 5]}</Label>
        </div>
      ))}
    </div>
  )
}

/** Each rule as a thin row of ticks, one per trade. The weakest rule takes the accent. */
function RuleTracks({ rules, className }: { rules: typeof RULE_SET; className?: string }) {
  const font = useFigureFont()
  const weakest = [...RULE_SET].sort((a, b) => a.kept / a.total - b.kept / b.total)[0]
  return (
    <div className={cn("grid min-h-0 flex-1 content-evenly gap-2", className)}>
      {rules.map((r) => {
        const weak = r === weakest
        return (
          <div key={r.rule} className="grid gap-1">
            <div className="flex min-w-0 items-baseline gap-2 text-xs leading-5">
              <span className={cn("min-w-0 flex-1 truncate", weak ? "text-foreground" : "text-muted-foreground")}>{r.rule}</span>
              <span className="shrink-0 tabular-nums" style={{ fontFamily: font, color: weak ? ACCENT_TEXT : undefined }}>
                {r.kept}/{r.total}
              </span>
            </div>
            <TickBar value={r.kept} max={r.total} segments={r.total} height={6} color={weak ? ACCENT : GREY[1]} />
          </div>
        )
      })}
    </div>
  )
}

/** Discipline: radar (drawn as a tick gauge), streak (clean days), rules (each of the coach's rules). */
export function RulesFollowed({ variant = "radar" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <ConnectBroker />

  let run = 0
  for (let i = RULE_DAYS.length - 1; i >= 0 && RULE_DAYS[i]; i--) run++
  const clean = RULE_DAYS.filter(Boolean).length
  const meta = `${coach.coachName}'s ${RULE_SET.length} rules · ${RULE_DAYS.length} trading days`
  const card = (children: React.ReactNode) => (
    <WCard icon={Shield} title="Discipline" meta={meta} chip={<Chip>{KEPT}%</Chip>}>
      {children}
    </WCard>
  )

  if (variant === "hero") {
    const broken = RULE_SET.filter((r) => !r.miss).sort((a, b) => a.kept / a.total - b.kept / b.total)[0]
    return (
      <HeroCard
        title={`Discipline · ${coach.coachName}'s ${RULE_SET.length} rules`}
        chip={<Chip>{`${run} clean in a row`}</Chip>}
        label="Rules kept"
        value={`${KEPT}%`}
        delta={standard ? `${clean} of ${RULE_DAYS.length} days clean` : undefined}
        deltaTone="muted"
        line={standard ? `Most often missed: “${broken.rule}”, kept ${broken.kept} of ${broken.total} times.` : undefined}
        stats={detailed ? ["Risk 1%", "Stop first", "No news"].map((label, i) => ({ label, value: `${RULE_SET[i].kept}/${RULE_SET[i].total}` })) : undefined}
        foot={
          standard ? (
            <BleedBars
              bars={RULE_DAYS.map((d, i) => ({
                h: d ? 1 : 0.55,
                color: d ? (i >= RULE_DAYS.length - run ? ACCENT : GREY[2]) : "var(--loss)",
                ring: !d,
                title: d ? "Clean day" : "Broke a rule",
              }))}
            />
          ) : undefined
        }
      />
    )
  }

  if (variant === "streak") {
    return card(
      <>
        <Num value={run} unit={run === 1 ? "clean day" : "clean days in a row"} />
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <DayDots days={RULE_DAYS} run={run} />
        </div>
        {standard && (
          <Legend
            className="shrink-0 grid-cols-2 gap-x-4"
            items={[
              { color: ACCENT, dot: true, label: "Clean", value: `${clean}/${RULE_DAYS.length}` },
              { color: "var(--loss)", dot: true, label: "Broken", value: RULE_DAYS.length - clean, valueTone: "loss" },
            ]}
          />
        )}
        {detailed && (
          <>
            <Rule />
            <Legend className="shrink-0" items={RULE_SET.map(ruleRow)} />
          </>
        )}
      </>,
    )
  }

  if (variant === "rules") {
    const weakest = [...RULE_SET].sort((a, b) => a.kept / a.total - b.kept / b.total)
    if (!standard) {
      return card(
        <>
          <Num value={`${KEPT}%`} delta="of rules kept" deltaTone="muted" />
          <RuleTracks rules={weakest.slice(0, 1)} className="flex-none" />
        </>,
      )
    }
    // Standard: the four weakest in the coach's order; Detailed: all five and the clean days.
    const shown = detailed ? RULE_SET : RULE_SET.filter((r) => weakest.slice(0, 4).includes(r))
    return card(
      <>
        <RuleTracks rules={shown} />
        {detailed && (
          <>
            <Rule />
            <Legend
              className="shrink-0"
              items={[
                { color: ACCENT, dot: true, label: "Clean days", value: `${clean}/${RULE_DAYS.length}` },
                { color: GREY[1], dot: true, label: "Clean streak", value: `${run} days` },
              ]}
            />
          </>
        )}
      </>,
    )
  }

  // radar: a tick gauge of rules kept
  return card(
    <>
      <FitGauge value={KEPT}>
        <Num value={`${KEPT}%`} className="justify-center" />
        <Label>of rules kept</Label>
      </FitGauge>
      {standard && <Legend className="shrink-0" items={RULE_SET.filter((r) => r.rule !== "Journal every trade" || detailed).map(ruleRow)} />}
      {detailed && (
        <>
          <Rule />
          <Legend
            className="shrink-0 @[20rem]:grid-cols-2 @[20rem]:gap-x-5"
            items={[
              { label: "Clean days", value: `${clean}/${RULE_DAYS.length}` },
              { label: "Clean streak", value: `${run} days` },
            ]}
          />
        </>
      )}
    </>,
  )
}
