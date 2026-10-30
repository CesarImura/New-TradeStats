"use client"

import { useState } from "react"
import { Chip, Label, Legend, Num, Panel, WCard } from "@/components/widgets/instrument"
import { Drop, GROW_ROWS, Ring, SPLIT, Spark, Streak, Track, tileDrop, useFrame, useMore } from "@/components/widgets/kit"
import type { WidgetProps } from "@/components/widgets/shared"
import { Eye, Flag, Flame, NotebookPen } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * New widgets for the library (prototype only): a watchlist, goals, a
 * trading streak and a session check-in. Same card, type and colour rules.
 */

const pct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`
const tone = (n: number) => ({ color: n >= 0 ? "var(--profit-text)" : "var(--loss-text)" })

const WATCH = [
  { sym: "NQ", name: "Nasdaq 100", price: 18476.5, chg: 0.62, line: [8, 9, 7, 10, 12, 11, 13, 14, 13, 15] },
  { sym: "ES", name: "S&P 500", price: 5238.25, chg: 0.31, line: [10, 11, 10, 12, 11, 12, 13, 12, 13, 14] },
  { sym: "CL", name: "Crude oil", price: 78.42, chg: -1.18, line: [15, 14, 14, 12, 13, 11, 10, 11, 9, 8] },
  { sym: "GC", name: "Gold", price: 2384.1, chg: 0.08, line: [11, 10, 12, 11, 11, 12, 11, 12, 12, 12] },
  { sym: "EURUSD", name: "Euro / Dollar", price: 1.0842, chg: -0.21, line: [12, 12, 11, 12, 11, 10, 11, 10, 10, 9] },
]

export function Watchlist({ variant = "list" }: WidgetProps) {
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const rows = WATCH.slice(0, detailed ? 5 : standard ? 4 : 3)
  if (variant === "tiles") {
    return (
      <WCard icon={Eye} title="Watchlist" meta="Delayed 15 min" chip={<Chip tone="neutral">{rows.length} markets</Chip>}>
        {/* In a cell that sets the height the tiles share it (their lines grow with them); a tile that no longer fits whole gives way, last first. */}
        <div className="grid grid-cols-2 gap-2 @[30rem]:grid-cols-4 [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:auto-rows-fr">
          {rows.slice(0, 4).map((w, i) => (
            <Drop key={w.sym} level={tileDrop(i)}>
              {/* Panel: the inner surface that follows the theme and turns into a brand shade on a Star card. */}
              <Panel className="min-h-0 min-w-0 gap-1 p-3" pad={false}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{w.sym}</span>
                  <span className="text-xs tabular-nums" style={tone(w.chg)}>
                    {pct(w.chg)}
                  </span>
                </span>
                <span className="text-[0.8125rem] tabular-nums">{w.price.toLocaleString("en")}</span>
                {/* The day's trace in its own direction's colour, quiet (no grid in a tile), with a faint fill. */}
              <Spark values={w.line} tone={w.chg >= 0 ? "profit" : "loss"} grid={false} area className="mt-1 h-8 [@container_card_(min-height:0px)]:h-auto [@container_card_(min-height:0px)]:min-h-8 [@container_card_(min-height:0px)]:max-h-24 [@container_card_(min-height:0px)]:flex-1" />
              </Panel>
            </Drop>
          ))}
        </div>
      </WCard>
    )
  }
  return (
    <WCard icon={Eye} title="Watchlist" meta="Delayed 15 min">
      {/* Whole rows only: a short card keeps the first markets. */}
      <ul className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS)}>
        {rows.map((w) => (
          <li key={w.sym} className="grid grid-cols-[1fr_4.5rem_auto] items-center gap-3 py-2 @[24rem]:grid-cols-[minmax(6rem,12rem)_minmax(5rem,1fr)_4.5rem_auto] @[24rem]:gap-x-6" style={{ borderColor: "var(--w-hair, var(--border))" }}>
            <span className="min-w-0">
              <span className="block font-medium">{w.sym}</span>
              {standard && <span className="block truncate text-xs text-muted-foreground">{w.name}</span>}
            </span>
            {/* Wide: the sparkline takes the spare width (more of the day to read), not a gap between name and price. */}
            <Spark values={w.line} tone="muted" className="hidden h-6 @[24rem]:block [@container_card_(min-height:0px)]:h-[clamp(1.5rem,6cqh,3rem)]" />
            <span className="text-right tabular-nums">{w.price.toLocaleString("en")}</span>
            <span className="w-16 text-right text-xs tabular-nums" style={tone(w.chg)}>
              {pct(w.chg)}
            </span>
          </li>
        ))}
      </ul>
    </WCard>
  )
}

const GOALS = [
  { name: "Journal every trade", now: 18, target: 20, unit: "trades" },
  { name: "Max 3 trades a day", now: 9, target: 10, unit: "days" },
  { name: "Watch Foundations", now: 4, target: 8, unit: "lessons" },
  { name: "Monthly P&L", now: 1220, target: 2000, unit: "€" },
]

export function Goals({ variant = "list" }: WidgetProps) {
  const standard = useMore("standard")
  const { fixed } = useFrame()
  const shown = GOALS.slice(0, standard ? 4 : 3)
  const done = shown.filter((g) => g.now >= g.target).length
  if (variant === "rings") {
    return (
      <WCard icon={Flag} title="Goals" meta="This month" chip={<Chip tone="neutral">{`${done} of ${shown.length} done`}</Chip>}>
        {/* One row of rings from 18rem, two by two when very narrow; a tall, narrow cell lists them (ring beside its name). In a cell that sets the height the rings grow with it. */}
        <div className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-2 gap-y-3 @[18rem]:grid-cols-4 @[26rem]:gap-x-4 [@container_card_(max-aspect-ratio:6/5)]:grid-cols-1 [@container_card_(max-aspect-ratio:6/5)]:content-evenly">
          {shown.map((g, i) => (
            <div
              key={g.name}
              className="grid min-w-0 justify-items-center gap-2 text-center [@container_card_(max-aspect-ratio:6/5)]:grid-cols-[auto_minmax(0,1fr)] [@container_card_(max-aspect-ratio:6/5)]:items-center [@container_card_(max-aspect-ratio:6/5)]:justify-items-start [@container_card_(max-aspect-ratio:6/5)]:gap-3 [@container_card_(max-aspect-ratio:6/5)]:text-left"
            >
              {/* One accent: the goal closest to done; the others stay muted. */}
              <Ring
                value={(g.now / g.target) * 100}
                tone={i === 0 ? "primary" : "muted"}
                size={48}
                fluid={fixed}
                className={fixed ? "size-[clamp(3rem,min(26cqh,14cqw),6rem)] [@container_card_(max-aspect-ratio:6/5)]:size-[clamp(2.5rem,min(13cqh,18cqw),4rem)]" : undefined}
              >
                <span className="text-xs tabular-nums">{Math.round((g.now / g.target) * 100)}%</span>
              </Ring>
              <span className="line-clamp-2 text-xs leading-4">{g.name}</span>
            </div>
          ))}
        </div>
      </WCard>
    )
  }
  return (
    <WCard icon={Flag} title="Goals" meta="This month" chip={<Chip tone="neutral">{`${done} of ${shown.length} done`}</Chip>}>
      {/* A cell that sets the height spreads the goals over it; a wide one sets them in two columns. Each goal then says what is left (more information, not bigger rows). */}
      <ul className="grid gap-3 [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:content-evenly [@container_card_(min-width:40rem)_and_(min-aspect-ratio:7/5)]:grid-cols-2 [@container_card_(min-width:40rem)_and_(min-aspect-ratio:7/5)]:gap-x-10">
        {shown.map((g, i) => (
          <li key={g.name} className="grid gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate">{g.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{g.unit === "€" ? `€${g.now.toLocaleString("en")} / €${g.target.toLocaleString("en")}` : `${g.now} / ${g.target} ${g.unit}`}</span>
            </span>
            <Track value={(g.now / g.target) * 100} color={i === 0 ? undefined : "var(--muted-foreground)"} />
            {fixed && (
              <Drop level={3}>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {g.now >= g.target ? "Done" : `${g.unit === "€" ? `€${(g.target - g.now).toLocaleString("en")}` : `${g.target - g.now} ${g.target - g.now === 1 ? g.unit.replace(/s$/, "") : g.unit}`} to go · ${Math.round((g.now / g.target) * 100)}%`} · 3 days left
                </span>
              </Drop>
            )}
          </li>
        ))}
      </ul>
    </WCard>
  )
}

/** The month's trading days: true kept every rule, false broke one, null no trading. */
const MONTH: (boolean | null)[] = [true, true, false, true, true, null, null, true, true, true, true, false, null, null, true, true, true, true, true, null, null, true, true, true]

export function TradingStreak({ variant = "month" }: WidgetProps) {
  const standard = useMore("standard")
  let run = 0
  for (let i = MONTH.length - 1; i >= 0; i--) {
    if (MONTH[i] === null) continue
    if (MONTH[i]) run++
    else break
  }
  const kept = MONTH.filter((d) => d === true).length
  const traded = MONTH.filter((d) => d !== null).length
  if (variant === "streak") {
    return (
      <WCard icon={Flame} title="Trading streak" meta="Days in a row with every rule kept">
        <Num value={run} unit={run === 1 ? "day" : "days"} caption="current streak" />
        <Streak days={MONTH.slice(-10)} />
        {standard && <Label>Best this month: 5 days</Label>}
      </WCard>
    )
  }
  const weeks = [MONTH.slice(0, 7), MONTH.slice(7, 14), MONTH.slice(14, 21), MONTH.slice(21)]
  // Where the current streak starts: after the last broken day.
  const runStart = MONTH.lastIndexOf(false) + 1
  return (
    <WCard icon={Flame} title="Trading streak" meta="October · rules kept" chip={<Chip>{`${run} in a row`}</Chip>} bodyClassName={SPLIT}>
      {/* In a cell that sets the height the month takes it: four week rows share the height, and the width is held to keep the days square. Elsewhere it stays 18rem at most, so square days never outgrow the card. */}
      <div
        data-main
        className="mx-auto grid w-full max-w-[18rem] gap-1.5 [@container_card_(min-height:0px)]:mx-auto [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:w-full [@container_card_(min-height:0px)]:max-w-[calc((100cqh-8.5rem)*1.75)] [@container_card_(min-height:0px)]:flex-1 [@container_card_(min-height:0px)]:grid-rows-[auto_repeat(4,minmax(0,1fr))]"
      >
        <div className="grid grid-cols-7 gap-1.5 text-center text-[0.6875rem] text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5 [@container_card_(min-height:0px)]:min-h-0">
            {w.map((d, di) => {
              const idx = wi * 7 + di
              const last = idx === MONTH.length - 1
              // The one accent: the current streak. Other kept days are a neutral fill; a broken day is a thin loss outline.
              const inRun = d === true && runStart <= idx
              return (
                <span
                  key={di}
                  title={d === null ? "No trading" : d ? "All rules kept" : "A rule broken"}
                  className={cn(
                    "relative aspect-square rounded-[min(var(--radius),5px)] [@container_card_(min-height:0px)]:aspect-auto [@container_card_(min-height:0px)]:h-full",
                    last && "ring-2 ring-offset-1 ring-offset-(--card)",
                  )}
                  style={{
                    // The streak is a mark in the accent on a kept day, not a filled block: a big cell would turn the card into brand colour.
                    background: d ? "color-mix(in oklab, var(--foreground) 14%, transparent)" : "transparent",
                    boxShadow: d === null ? "inset 0 0 0 1px var(--w-hair, var(--border))" : d === false ? "inset 0 0 0 1.5px var(--loss)" : undefined,
                    // @ts-expect-error CSS variable for the ring colour
                    "--tw-ring-color": "var(--w-accent, var(--primary))",
                  }}
                >
                  {inRun && <i className="r-dot absolute top-1/2 left-1/2 size-2 -translate-1/2" style={{ background: "var(--w-accent, var(--primary))" }} />}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      {standard && <Legend items={[{ label: "Days with every rule kept", value: `${kept} of ${traded}` }]} />}
    </WCard>
  )
}

const MOODS = ["Calm", "Focused", "Tired", "Rushed", "Tilted"] as const
/** The last check-ins (sample), with the day's result, newest first. */
const HISTORY = [
  { day: "Fri 16", mood: "Focused", sleep: 7.5, pl: 340 },
  { day: "Thu 15", mood: "Calm", sleep: 8, pl: 460 },
  { day: "Wed 14", mood: "Rushed", sleep: 5.5, pl: -200 },
  { day: "Tue 13", mood: "Focused", sleep: 7, pl: 280 },
  { day: "Mon 12", mood: "Tired", sleep: 6, pl: 240 },
  { day: "Fri 9", mood: "Calm", sleep: 8, pl: 180 },
]

export function SessionCheckIn({ variant = "mood" }: WidgetProps) {
  const standard = useMore("standard")
  const { fixed } = useFrame()
  const [mood, setMood] = useState<(typeof MOODS)[number]>()
  const [sleep, setSleep] = useState(7)
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)
  const warn = mood === "Tilted" || mood === "Rushed" || sleep < 6
  return (
    <WCard icon={NotebookPen} title="Session check-in" meta="Before you trade · 20 seconds" chip={saved ? <Chip tone="profit">Saved</Chip> : undefined}>
      {/* The questions at the top; wide and short, side by side. Under them, in a cell with room, the last sessions (what the
          check-in is for), so a taller card shows more, not a gap. The Save row stays at the foot. */}
      <div className="grid gap-3 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:grid-cols-2 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:gap-x-8">
        <div className="grid gap-2">
          <Label>How do you feel?</Label>
          <div role="radiogroup" aria-label="Mood" className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mood === m}
                onClick={() => {
                  setMood(m)
                  setSaved(false)
                }}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out outline-none active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-(--brand-mark)",
                  mood === m ? "border-transparent bg-[var(--w-accent,var(--primary))] text-[var(--primary-foreground)]" : "hover:bg-muted",
                )}
                style={mood === m ? undefined : { borderColor: "var(--w-hair, var(--border))" }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {variant === "notes" || standard ? (
          <label className="grid gap-2">
            <span className="flex items-baseline justify-between">
              <Label>Sleep</Label>
              <span className="text-xs tabular-nums">{sleep} h</span>
            </span>
            <input type="range" min={3} max={10} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full accent-[var(--w-accent,var(--primary))]" aria-label="Hours of sleep" />
          </label>
        ) : null}
        {variant === "notes" && (
          <label className="grid gap-2">
            <Label>Plan for today</Label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="NQ open only, max 2 trades, stop at −1R"
              className="w-full resize-none rounded-md border bg-transparent px-2.5 py-2 text-[0.8125rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-(--brand-mark)"
              style={{ borderColor: "var(--w-hair, var(--border))" }}
            />
          </label>
        )}
      </div>
      {fixed && (
        <Drop level={3}>
          <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1.5">
            <Label>Last sessions</Label>
            <ul className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS)}>
              {HISTORY.map((h) => (
                <li key={h.day} className="flex min-w-0 items-center gap-3 py-1.5 text-xs" style={{ borderColor: "var(--w-hair, var(--border))" }}>
                  <span className="w-12 shrink-0 text-muted-foreground tabular-nums">{h.day}</span>
                  <span className="min-w-0 flex-1 truncate">{h.mood}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">{h.sleep} h sleep</span>
                  <span className="w-14 shrink-0 text-right tabular-nums" style={tone(h.pl)}>
                    {h.pl >= 0 ? "+" : "−"}€{Math.abs(h.pl)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Drop>
      )}
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="min-w-0 text-xs leading-4" style={{ color: warn ? "var(--warning-text, var(--loss-text))" : "var(--muted-foreground)" }}>
          {warn ? "Consider sizing down or sitting out today." : mood ? "Good to go. Trade your plan." : "Pick one to log it in your journal."}
        </span>
        {/* Before a mood is picked the button reads as inactive (muted, still legible), not faded out. */}
        <button
          type="button"
          disabled={!mood}
          onClick={() => setSaved(true)}
          className="h-8 shrink-0 rounded-md px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark)"
          style={mood ? { background: "var(--w-accent, var(--primary))", color: "var(--primary-foreground)" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          Save
        </button>
      </div>
    </WCard>
  )
}
