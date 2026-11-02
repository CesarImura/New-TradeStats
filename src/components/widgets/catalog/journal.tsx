"use client"

import { signed, useEmpty, type WidgetProps } from "../parts/shared"
import { useState } from "react"
import { LineChart } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { JOURNAL_STATS, JOURNAL_WEEK, R_STATS, SETUPS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { BLEED, Chip, GREY, Label, Num, Seg, useFigureFont, useMonoFigures, WCard } from "../parts/anatomy"
import { Legend, Rule, StepChart } from "../parts/visuals"
import { useMore } from "../parts/frame"
import { ACCENT, ACCENT_TEXT, SPLIT } from "../parts/tokens"
import { Drop } from "../parts/card"
import { Tip } from "../parts/bits"
import { BleedArea, Compare, HeatGrid, HeroCard, heatPl } from "../parts/layouts"
import { ConnectBroker, Fig, ModelKey, euro, plColor, rr, soft, tightComma, TRACK } from "./journal-shared"

export { RulesFollowed } from "./rules-followed"


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
  const font = useFigureFont()
  const mono = useMonoFigures()
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
      {/* The period's P&L alone on its line; the comparison is a sentence under it, keyed to the dashed model line. */}
      <div className="grid min-w-0 shrink-0 gap-1.5">
        {/* Mono figures give the comma a whole cell ("1 , 220"): at this size the comma is pulled in to half a cell. */}
        <Num value={mono ? tightComma(signed(gain)) : signed(gain)} />
        <span className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-5 text-muted-foreground">
          <ModelKey />
          <span className="min-w-0 truncate">
            <span className="tabular-nums" style={{ color: plColor(gap), fontFamily: font }}>
              {euro(Math.abs(gap))}
            </span>{" "}
            <span style={{ color: plColor(gap) }}>{gap >= 0 ? "ahead of" : "behind"}</span> {coach.coachName}&apos;s model
          </span>
        </span>
      </div>
      <div data-main className="flex min-h-min flex-1 flex-col">
        <div className={cn("flex min-h-16 flex-1 flex-col", BLEED)}>
          <StepChart
            className="min-h-12 flex-1"
            height={0}
            format={signed}
            series={[
              { values: mine, label: "Your equity" },
              { values: model, label: `${coach.coachName}'s model account` },
            ]}
          />
        </div>
      </div>
      {/* The figures read as one short statement under the chart: name left, value right, like the legend they continue.
          Detailed adds the two balances to the same list. */}
      <Drop level={2}>
        {standard && (
          <Legend
            className="shrink-0"
            items={[
              { label: "Win rate", value: `${JOURNAL_STATS.winRate}%` },
              { label: "Expectancy", value: rr(R_STATS.expectancy, 2) },
              { label: "Best day", value: signed(Math.max(...days)), valueTone: "profit" },
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
              { color: GREY[1], label: `${coach.coachName}'s model`, value: euro(BALANCE.model) },
            ]}
          />
        )}
      </Drop>
    </WCard>
  )
}

// ---------- Discipline
