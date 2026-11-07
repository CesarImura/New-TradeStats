"use client"

import { useEmpty, type WidgetProps } from "../parts/shared"
import { useState } from "react"
import { Shield } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { RULE_DAYS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Chip, GREY, ink, Label, Num, useFigureFont, WCard } from "../parts/anatomy"
import { Donut, DonutFigure, Legend, RING, RING_BODY, Rule, ShareRows, TickBar } from "../parts/visuals"
import { useMore } from "../parts/frame"
import { ACCENT, ACCENT_TEXT } from "../parts/tokens"
import { Drop } from "../parts/card"
import { BleedBars, Compare, HeatGrid, HeroCard, heatShade } from "../parts/layouts"
import { ConnectBroker } from "./journal-shared"


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
          {/* Wide: each day grows into a tile across its column, so a full-width card isn't a row of specks. */}
          <span className="r-dot size-3 [@container_card_(min-width:34rem)]:h-7 [@container_card_(min-width:34rem)]:w-full [@container_card_(min-width:56rem)]:h-10" title={d ? "Clean" : "Broke a rule"} style={d ? { background: i >= days.length - run ? ACCENT : GREY[1] } : { boxShadow: "inset 0 0 0 1.5px var(--loss)" }} />
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

/** Discipline: radar (a ring of rules kept), streak (clean days), rules (each of the coach's rules). */
export function RulesFollowed({ variant = "radar" }: WidgetProps) {
  const { coach } = useCoach()
  const [focus, setFocus] = useState<number>()
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
      // A ring of rules kept beside the rules (stacked in a tall, narrow cell); pointing at a rule puts it on the ring.
      bodyClassName={RING_BODY}
    >
      <Donut className={RING} total={100} parts={[{ value: pct, color: shown?.miss ? "var(--loss)" : ACCENT }]} label={`${pct}% ${shown ? (shown.miss ?? shown.rule) : "of rules kept"}`}>
        <DonutFigure value={`${pct}%`} caption={shown ? (shown.miss ?? shown.rule) : "rules kept"} />
      </Donut>
      {standard && (
        <ShareRows
          className="min-w-0 flex-1"
          onFocus={setFocus}
          rows={rows.map((r, i) => ({
            label: r.miss ?? r.rule,
            value: r.miss ? `${r.total - r.kept}×` : `${r.kept}/${r.total}`,
            share: r.miss ? (r.total - r.kept) / r.total : r.kept / r.total,
            tone: r.miss ? ("loss" as const) : undefined,
            on: focus === undefined ? r === order[0] && !r.miss : focus === i,
          }))}
        />
      )}
    </WCard>
  )
}

