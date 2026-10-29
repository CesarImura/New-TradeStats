"use client"

import { useState } from "react"
import { LineChart, Link2, Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { JOURNAL_STATS, JOURNAL_WEEK, RULE_DAYS, R_STATS, SETUPS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Chip, FitGauge, GREY, ink, Label, Legend, MiniStats, Num, Panel, Rule, Seg, StepChart, TickBar, useFigureFont, WCard } from "./instrument"
import { ACCENT, ACCENT_TEXT, Drop, SPLIT, Tip, useMore } from "./kit"
import { BleedArea, BleedBars, Compare, HeatGrid, HeroCard, heatPl, heatShade } from "./layouts"
import { WidgetEmpty, signed, useEmpty, type WidgetProps } from "./shared"

const rr = (v: number, digits = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}R`
const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`
/** A result tint: profit or loss, softened. Mixed with transparent so it also works on a Star card. */
const soft = (v: number, strength: number) => `color-mix(in oklab, ${v >= 0 ? "var(--profit)" : "var(--loss)"} ${strength}%, transparent)`
/** Profit or loss as text: the readable shades, not the fill colours. */
const plColor = (v: number) => (v > 0 ? "var(--profit-text)" : v < 0 ? "var(--loss-text)" : "var(--muted-foreground)")
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


// ---------- Performance

/** The last 20 trading days, Monday to Friday, four weeks. The last week is the journal's week. */
const DAYS: number[][] = [[118, -76, 0, 263, -95], [-212, 143, 306, -57, 0], [84, 0, -153, -17, 136], JOURNAL_WEEK.map((d) => d.pnl)]
const DAILY = DAYS.flat()
const EQUITY_20 = DAILY.reduce<number[]>((a, v) => [...a, (a[a.length - 1] ?? 0) + v], [])
/** The coach's model account over the same 20 days (cumulative P&L). */
const MODEL_20 = [60, 110, 90, 180, 240, 300, 280, 360, 420, 470, 520, 560, 610, 700, 760, 850, 940, 1010, 1060, 1180]
const BALANCE = { you: 52340, model: 51180 }
const WEEKDAYS = ["M", "T", "W", "T", "F"]

/** P&L by hour of day and weekday over the last 20 days (sample; adds up to the 20-day total): mornings pay, afternoons give it back. */
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16]
const HOUR_PL: number[][] = [
  [0, 180, 240, 90, -40, -120, 0, -60, 0],
  [210, 220, 130, 0, -90, -60, -150, 0, -40],
  [0, 140, 310, 120, 0, -80, -110, -70, 0],
  [-30, 260, 180, 230, -60, 0, -130, -90, 0],
  [0, 90, 150, 40, -120, -70, 0, 0, -50],
]
const AM = HOUR_PL.flat()
  .filter((_, i) => HOURS[i % HOURS.length] < 12)
  .reduce((a, b) => a + b, 0)
const PM = HOUR_PL.flat()
  .filter((_, i) => HOURS[i % HOURS.length] >= 12)
  .reduce((a, b) => a + b, 0)

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
                  {/* Slim bars (never slabs on a wide card), centred in their day. */}
                  <div className="flex items-end justify-center" style={{ flex: up }}>
                    {v > 0 && <span className="r-bar w-full max-w-3.5 transition-[background-color] duration-150" style={{ height: `${(v / up) * 100}%`, background: soft(v, on || i === last ? 85 : 42) }} />}
                  </div>
                  <div className="flex items-start justify-center" style={{ flex: down }}>
                    {v < 0 && <span className="r-bar w-full max-w-3.5 transition-[background-color] duration-150" style={{ height: `${(-v / down) * 100}%`, background: soft(v, on || i === last ? 85 : 42) }} />}
                  </div>
                  {v === 0 && <span className="r-dot absolute left-1/2 size-1 -translate-1/2" style={{ top: `${(up / (up + down)) * 100}%`, background: GREY[2] }} />}
                  {on && <Tip x={50} y={0} place="above" label={`Wk ${w + 1} · ${["Mon", "Tue", "Wed", "Thu", "Fri"][d]}`} value={v ? signed(v) : "No trades"} color={v ? (v > 0 ? "var(--profit)" : "var(--loss)") : undefined} />}
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
                // A neutral cell: the result is the signed figure and a thin bar as long as the day was big, never a red or green block.
                <span
                  key={d}
                  title={`Week ${w + 1} · ${["Mon", "Tue", "Wed", "Thu", "Fri"][d]} · ${v ? signed(v) : "no trades"}`}
                  className="r-bar relative grid place-items-center overflow-hidden pb-1 text-[0.6875rem] leading-none tabular-nums"
                  style={{
                    background: v === 0 ? undefined : `color-mix(in oklab, var(--foreground) 4%, transparent)`,
                    boxShadow: v === 0 ? `inset 0 0 0 1px ${TRACK}` : today ? `inset 0 0 0 1.5px ${ACCENT}` : undefined,
                  }}
                >
                  <span className="hidden @[22rem]:inline" style={{ color: plColor(v) }}>
                    {v === 0 ? "·" : `${v > 0 ? "+" : "−"}${Math.abs(v)}`}
                  </span>
                  {v !== 0 && (
                    <i
                      className="r-bar absolute bottom-0.5 left-1/2 h-0.5 -translate-x-1/2"
                      style={{ width: `${Math.max(12, Math.round((Math.abs(v) / max) * 70))}%`, background: v > 0 ? "var(--profit)" : "var(--loss)" }}
                    />
                  )}
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
/** The equity curve's periods: trading days shown. */
const PERIODS = { "1w": 5, "2w": 10, "4w": 20 } as const
type Period = keyof typeof PERIODS

export function JournalPnl({ variant = "curve" }: WidgetProps) {
  const { coach } = useCoach()
  const [period, setPeriod] = useState<Period>("4w")
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
    <WCard icon={LineChart} title="Performance" meta={`${coach.wording.journal} · last ${DAILY.length} days · ${JOURNAL_STATS.trades} trades`} chip={<Chip>{JOURNAL_STATS.winRate}% win</Chip>} bodyClassName={SPLIT}>
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
                { label: "Expectancy", value: rr(R_STATS.expectancy, 2) },
                { label: "Best day", value: signed(best), tone: "profit" },
                { label: "Worst day", value: signed(worst), tone: "loss" },
              ]
            : undefined
        }
        foot={standard ? <BleedArea values={EQUITY_20} /> : undefined}
      />
    )
  }

  if (variant === "compare") {
    /** The coach's model account over the same 20 days (sample). */
    const MODEL = { pnl: MODEL_20[MODEL_20.length - 1], win: 62, expectancy: 0.55, avgLoss: 0.7, worst: 150, trades: 14 }
    const gap = total - MODEL.pnl
    const rows = [
      { label: "P&L", a: total, b: MODEL.pnl, aText: signed(total), bText: signed(MODEL.pnl), better: "higher" as const },
      { label: "Win rate", a: JOURNAL_STATS.winRate, b: MODEL.win, aText: `${JOURNAL_STATS.winRate}%`, bText: `${MODEL.win}%`, better: "higher" as const },
      { label: "Expectancy", a: R_STATS.expectancy, b: MODEL.expectancy, aText: rr(R_STATS.expectancy, 2), bText: rr(MODEL.expectancy, 2), better: "higher" as const },
      { label: "Avg loss", a: -R_STATS.avgLoss, b: MODEL.avgLoss, aText: rr(R_STATS.avgLoss), bText: rr(-MODEL.avgLoss), better: "lower" as const },
      { label: "Worst day", a: -worst, b: MODEL.worst, aText: signed(worst), bText: signed(-MODEL.worst), better: "lower" as const },
      { label: "Trades", a: JOURNAL_STATS.trades, b: MODEL.trades, aText: String(JOURNAL_STATS.trades), bText: String(MODEL.trades) },
    ]
    return (
      <WCard
        icon={LineChart}
        title={`You vs ${coach.coachName}`}
        meta={`${coach.wording.journal} · last ${DAILY.length} days · ${coach.coachName}'s model account`}
        chip={<Chip tone={gap >= 0 ? "accent" : "neutral"}>{gap >= 0 ? `${signed(gap)} ahead` : `${signed(gap)} behind`}</Chip>}
      >
        <Compare a="You" b={`${coach.coachName}'s model`} rows={standard ? rows : rows.slice(0, 3)} />
      </WCard>
    )
  }

  if (variant === "hours") {
    const max = Math.max(...HOUR_PL.flat().map(Math.abs), 1)
    const best = HOUR_PL.flat().reduce((m, v, i) => (v > HOUR_PL.flat()[m] ? i : m), 0)
    return (
      <WCard
        icon={LineChart}
        title="Performance by hour"
        meta={`${coach.wording.journal} · last ${DAILY.length} days · your time zone`}
        chip={<Chip>{`best ${String(HOURS[best % HOURS.length]).padStart(2, "0")}:00`}</Chip>}
        bodyClassName={SPLIT}
      >
        <Drop level={2}>{standard && <Num size="md" value={signed(AM)} unit="before 12:00" delta={`${signed(PM)} after`} deltaTone={PM >= 0 ? "profit" : "loss"} />}</Drop>
        <div data-main className="flex min-h-min flex-1 flex-col">
          <HeatGrid
            rowLabels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
            colLabels={HOURS.map((h, i) => (i % 2 === 0 ? String(h).padStart(2, "0") : undefined))}
            rows={HOUR_PL.map((r, ri) =>
              r.map((v, ci) => ({
                ...heatPl(v / max),
                ring: ri * HOURS.length + ci === best ? ACCENT : undefined,
                title: `${["Mon", "Tue", "Wed", "Thu", "Fri"][ri]} ${String(HOURS[ci]).padStart(2, "0")}:00 · ${v ? signed(v) : "no trades"}`,
              })),
            )}
          />
        </div>
        <Drop level={3}>
          {detailed && (
            <Legend
              className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5"
              items={[
                { color: "var(--profit)", label: "Best hour", value: `${["Mon", "Tue", "Wed", "Thu", "Fri"][Math.floor(best / HOURS.length)]} ${String(HOURS[best % HOURS.length]).padStart(2, "0")}:00` },
                { color: "var(--loss)", label: "After 12:00", value: signed(PM), valueTone: "loss" },
              ]}
            />
          )}
        </Drop>
      </WCard>
    )
  }

  if (variant === "bars") {
    return card(
      <>
        {headline}
        <div data-main className="flex min-h-min flex-1 flex-col">
          <DayBars />
        </div>
        <Drop level={2}>
          {standard && (
            <Legend
              className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5"
              items={[
                { color: "var(--profit)", label: "Green days", value: `${green} of ${green + red}` },
                { color: "var(--loss)", label: "Red days", value: red },
              ]}
            />
          )}
        </Drop>
        <Drop level={3}>{detailed && <Edge />}</Drop>
      </>,
    )
  }

  if (variant === "heatmap") {
    return card(
      <>
        {headline}
        <div data-main className="flex min-h-min flex-1 flex-col">
          <DayCalendar />
        </div>
        <Drop level={2}>
          {standard && (
            <Legend
              className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5"
              items={[
                { color: "var(--profit)", label: "Green days", value: `${green} of ${green + red}` },
                { color: "var(--loss)", label: "Range", value: `${signed(worst)} to ${signed(best)}` },
              ]}
            />
          )}
        </Drop>
        <Drop level={3}>{detailed && <Edge />}</Drop>
      </>,
    )
  }

  // curve, on the base structure: name (with the period), the period's P&L against the coach's model, the step chart on
  // a panel, three small stats, and the way into the journal.
  const n = PERIODS[period]
  const from = (vals: number[]) => vals.slice(-n).map((v) => v - (vals[vals.length - n - 1] ?? 0))
  const mine = from(EQUITY_20)
  const model = from(MODEL_20)
  const gain = mine[mine.length - 1]
  const gap = gain - model[model.length - 1]
  const days = DAILY.slice(-n)
  return (
    <WCard
      bands
      icon={LineChart}
      title="Performance"
      section={coach.wording.journal}
      meta={`${coach.wording.journal} · last ${n} days · ${JOURNAL_STATS.trades} trades`}
      control={
        <Seg
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            ["1w", "1W"],
            ["2w", "2W"],
            ["4w", "4W"],
          ]}
        />
      }
      action={standard ? { label: `Open ${coach.wording.journal.toLowerCase()}`, href: "journal" } : undefined}
      footnote={detailed ? `${days.filter((v) => v > 0).length} green days of ${days.filter((v) => v !== 0).length}` : undefined}
      bodyClassName={SPLIT}
    >
      <Num value={signed(gain)} delta={signed(gap)} deltaTone={gap >= 0 ? "profit" : "loss"} caption={`vs ${coach.coachName}'s model`} />
      <div data-main className="flex min-h-min flex-1 flex-col">
        <Panel className="min-h-16 flex-1">
          <StepChart
            className="min-h-12 flex-1"
            height={0}
            format={signed}
            series={[
              { values: mine, label: "Your equity" },
              { values: model, label: `${coach.coachName}'s model account` },
            ]}
          />
        </Panel>
      </div>
      <Drop level={2}>
        {standard && (
          <MiniStats
            items={[
              { label: "Win rate", value: `${JOURNAL_STATS.winRate}%` },
              { label: "Expectancy", value: rr(R_STATS.expectancy, 2) },
              { label: "Best day", value: signed(Math.max(...days)), tone: "profit" },
            ]}
          />
        )}
      </Drop>
      <Drop level={3}>
        {detailed && (
          <Legend
            className="shrink-0"
            items={[
              { color: ACCENT, label: "Your equity", value: euro(BALANCE.you) },
              { color: GREY[1], label: `${coach.coachName}'s model account`, value: euro(BALANCE.model) },
            ]}
          />
        )}
      </Drop>
    </WCard>
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
  r.miss ? { color: "var(--loss)", label: r.miss, value: `${r.total - r.kept}×`, valueTone: "loss" as const } : { color: r.kept / r.total >= 0.85 ? GREY[0] : GREY[2], label: r.rule, value: `${r.kept}/${r.total}` }

/** The last 10 trading days as dots: the current clean run in the accent, broken days as a loss ring. */
function DayDots({ days, run }: { days: boolean[]; run: number }) {
  const letters = ["M", "T", "W", "T", "F"]
  return (
    <div className="grid shrink-0 gap-1.5" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
      {days.map((d, i) => (
        <div key={i} className="grid justify-items-center gap-1.5">
          <span className="r-dot size-3" title={d ? "Clean" : "Broke a rule"} style={d ? { background: i >= days.length - run ? ACCENT : GREY[1] } : { boxShadow: "inset 0 0 0 1.5px var(--loss)" }} />
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
    // Whole rows only: when the card is short, the last rules wrap out of sight instead of being cut in half.
    <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start justify-evenly gap-2 overflow-hidden *:w-full", className)}>
      {rules.map((r) => {
        const weak = r === weakest
        return (
          <div key={r.rule} className="grid gap-1">
            <div className="flex min-w-0 items-baseline gap-2 text-[0.8125rem] leading-5">
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
  const [focus, setFocus] = useState<number>()
  const font = useFigureFont()
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

  if (variant === "compare") {
    /** Last week's rules kept, in % (sample). */
    const LAST: Record<string, number> = { "Max 1% risk per trade": 100, "Stop set before entry": 82, "No trades in news": 71, "Never move a stop": 76, "Journal every trade": 53 }
    const lastAll = 76
    const pct = (r: (typeof RULE_SET)[number]) => Math.round((r.kept / r.total) * 100)
    const rows = [
      { label: "All rules", a: KEPT, b: lastAll, aText: `${KEPT}%`, bText: `${lastAll}%`, better: "higher" as const },
      ...RULE_SET.map((r) => ({ label: r.rule, a: pct(r), b: LAST[r.rule], aText: `${pct(r)}%`, bText: `${LAST[r.rule]}%`, better: "higher" as const })),
    ]
    return (
      <WCard icon={Shield} title="Discipline" meta={`${coach.coachName}'s ${RULE_SET.length} rules · this week vs last`} chip={<Chip>{`${KEPT - lastAll >= 0 ? "+" : "−"}${Math.abs(KEPT - lastAll)} pts`}</Chip>}>
        <Compare a="This week" b="Last week" rows={standard ? rows : rows.slice(0, 3)} />
      </WCard>
    )
  }

  if (variant === "grid") {
    // Rules broken per day (sample): the two broken days in RULE_DAYS carry every miss.
    const MISSES: Record<string, Record<number, number>> = {
      "Stop set before entry": { 2: 1, 6: 1 },
      "No trades in news": { 2: 2, 6: 2 },
      "Never move a stop": { 2: 1, 6: 2 },
      "Journal every trade": { 2: 3, 6: 3 },
    }
    const days = RULE_DAYS.length
    const short = ["Risk", "Stop", "News", "Move", "Log"]
    return card(
      <>
        <Drop level={2}>{standard && <Num size="md" value={`${clean}/${days}`} unit="clean days" delta={`${run} in a row`} deltaTone="accent" />}</Drop>
        <HeatGrid
          rowLabels={short}
          colLabels={Array.from({ length: days }, (_, i) => (i === days - 1 ? "today" : i % 3 === 0 ? `−${days - 1 - i}d` : undefined))}
          rows={RULE_SET.map((r) =>
            Array.from({ length: days }, (_, d) => {
              const miss = MISSES[r.rule]?.[d] ?? 0
              const today = d === days - 1
              return miss
                ? { ring: "var(--loss)", text: <span style={{ color: ink("var(--loss-text)") }}>{miss}</span>, title: `${r.rule} · broken ${miss}×` }
                : { fill: today ? ACCENT : heatShade(0.08), title: `${r.rule} · kept` }
            }),
          )}
        />
        <Drop level={3}>{detailed && <Legend className="shrink-0" items={RULE_SET.filter((r) => r.kept < r.total).map(ruleRow)} />}</Drop>
      </>,
    )
  }

  if (variant === "streak") {
    return card(
      <>
        <Num value={run} unit={run === 1 ? "clean day" : "clean days in a row"} />
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <DayDots days={RULE_DAYS} run={run} />
        </div>
        <Drop level={2}>
          {standard && (
            <Legend
              className="shrink-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-x-4"
              items={[
                { color: ACCENT, dot: true, label: "Clean", value: `${clean}/${RULE_DAYS.length}` },
                { color: "var(--loss)", dot: true, label: "Broken", value: RULE_DAYS.length - clean, valueTone: "loss" },
              ]}
            />
          )}
        </Drop>
        <Drop level={3}>
          {detailed && (
            <>
              <Rule />
              <Legend className="shrink-0" items={RULE_SET.map(ruleRow)} />
            </>
          )}
        </Drop>
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
        <Drop level={3}>
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
        </Drop>
      </>,
    )
  }

  // radar, on the base structure: the gauge of rules kept on a panel, a row per rule (pointing at a rule puts it on
  // the gauge), the clean days, and the way into the journal.
  const order = [...RULE_SET].sort((a, b) => a.kept / a.total - b.kept / b.total)
  const rows = detailed ? RULE_SET : order.slice(0, 3)
  const shown = focus === undefined ? undefined : rows[focus]
  const pct = shown ? Math.round((shown.kept / shown.total) * 100) : KEPT
  return (
    <WCard
      bands
      icon={Shield}
      title="Discipline"
      section={coach.wording.journal}
      meta={meta}
      chip={<Chip>{`${run} clean in a row`}</Chip>}
      action={standard ? { label: `Open ${coach.wording.journal.toLowerCase()}`, href: "journal" } : undefined}
      footnote={standard ? `${clean} of ${RULE_DAYS.length} days clean` : undefined}
      // Wide and short (twice as wide as tall, in a fixed cell): the gauge on the left, the rules beside it, instead of a stretched stack.
      bodyClassName="[@container_card_(min-aspect-ratio:2/1)]:flex-row [@container_card_(min-aspect-ratio:2/1)]:items-center [@container_card_(min-aspect-ratio:2/1)]:justify-center [@container_card_(min-aspect-ratio:2/1)]:gap-[clamp(1.5rem,5cqw,4rem)]"
    >
      <Panel className="min-h-20 flex-1 justify-end p-2 [@container_card_(min-aspect-ratio:2/1)]:h-full [@container_card_(min-aspect-ratio:2/1)]:flex-none [@container_card_(min-aspect-ratio:2/1)]:w-[min(46%,26rem,max(calc((100cqh-6.5rem)*1.15),min(calc((100cqh-6.5rem)*1.8),17rem)))] [@container_card_(min-aspect-ratio:2/1)]:justify-center">
        <FitGauge value={pct}>
          {/* Scales with the gauge (cqw of the gauge). */}
          <span className="text-[clamp(1.25rem,12cqw,3.5rem)] leading-none font-medium tracking-[-0.02em] tabular-nums" style={{ fontFamily: font }}>
            {pct}%
          </span>
          <Label className="max-w-[70cqw] truncate text-[clamp(0.6875rem,3.6cqw,1rem)] leading-tight">{shown ? (shown.miss ?? shown.rule) : "of rules kept"}</Label>
        </FitGauge>
      </Panel>
      {standard && (
        <div className="grid shrink-0 [@container_card_(min-aspect-ratio:2/1)]:w-[min(36%,15rem)] [@container_card_(min-aspect-ratio:2/1)]:content-center [@container_card_(min-aspect-ratio:2/1)]:gap-1 [@container_card_(min-aspect-ratio:2/1)]:[&>button]:h-9 [@container_card_(min-aspect-ratio:2/1)]:[&>button]:text-sm" onPointerLeave={() => setFocus(undefined)}>
          {rows.map((r, i) => {
            const on = focus === i
            const weak = r === order[0]
            return (
              <button
                key={r.rule}
                type="button"
                onPointerEnter={() => setFocus(i)}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus(undefined)}
                className={cn("flex h-7 min-w-0 items-center gap-2 rounded-sm text-left text-[0.8125rem] leading-5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-(--brand-mark)")}
              >
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: r.miss ? "var(--loss)" : on || (weak && focus === undefined) ? ACCENT : GREY[2] }} />
                <span className={cn("min-w-0 flex-1 truncate", on ? "text-foreground underline decoration-1 underline-offset-4" : "text-muted-foreground")}>{r.miss ?? r.rule}</span>
                <span className="shrink-0 tabular-nums" style={{ fontFamily: font, color: r.miss ? "var(--loss-text)" : undefined }}>
                  {r.miss ? `${r.total - r.kept}×` : `${r.kept}/${r.total}`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </WCard>
  )
}
