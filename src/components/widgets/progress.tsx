"use client"

import { Check, Crown, Flag, Trophy } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { DEMO_STUDENT, LEADERBOARD, RANK_HISTORY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, ACCENT_TEXT, Avatar, Drop, GROW_ROWS, SPLIT, TYPE, useFitRows, useFrame, useMore } from "./kit"
import { Axis, Chip, DotStrip, GREY, Label, Legend, Num, Rule, WCard, ink, useFigureFont, useChartStyle } from "./instrument"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"
import { BleedArea, Compare, HeroCard, Rail, type RailItem } from "./layouts"

/** An empty tick or track (the same faint grey instrument.tsx uses). */
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"
const HAIRLINE = "border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)]"

/** The student's first week: day 2 of 7 (joined Sunday; "today" is Monday). */
const FIRST_WEEK_DAY = 2

function useFirstWeek() {
  const { coach } = useCoach()
  const empty = useEmpty()
  return [
    { label: `First ${coach.wording.lesson.toLowerCase()}`, hint: "Watch it to the end", time: empty ? "15 min" : "Sun", done: !empty },
    { label: "Join a live", hint: `${coach.coachName} trades the NY open`, time: "Mon 18:00", done: false },
    ...(coach.modules.community ? [{ label: "Say hello", hint: "Introduce yourself in the community", time: "1 min", done: false }] : []),
    ...(coach.modules.journal ? [{ label: "Connect broker", hint: "Your trades fill the journal", time: "2 min", done: false }] : []),
  ]
}
type Step = ReturnType<typeof useFirstWeek>[number]

/**
 * The stepped tick track: one group of ticks per step, each group a step
 * higher than the last, like a staircase. Done steps grey, the next step in
 * the accent, the rest faint.
 */
function StepTrack({ items, next, height: h0 = 12, ticks: t0 = 5, className }: { items: Step[]; next?: Step; height?: number; ticks?: number; className?: string }) {
  // Chart style: ticks (a staircase of tick groups), solid (one block per step), thin (a hairline per step).
  const style = useChartStyle()
  const height = style === "thin" ? 3 : h0
  const ticks = style === "ticks" ? t0 : 1
  return (
    <div className={cn("flex items-end gap-[6px]", className)} style={{ height }} aria-hidden>
      {items.map((it, i) => {
        const h = style === "thin" ? height : Math.round(height * (0.4 + (0.6 * (i + 1)) / items.length))
        const color = it.done ? GREY[1] : it === next ? ACCENT : TRACK
        return (
          <div key={it.label} title={it.label} className="flex flex-1 items-end gap-[2px]" style={{ height: h }}>
            {Array.from({ length: ticks }, (_, k) => (
              <span key={k} className={cn("h-full flex-1", style === "ticks" ? "rounded-[1px]" : "r-bar")} style={{ background: color }} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** The same steps as a ring: one arc per step. */
function StepRing({ items, next, size = 40, children }: { items: Step[]; next?: Step; size?: number; children?: React.ReactNode }) {
  const n = items.length
  const gap = 14
  const arc = (i: number) => {
    const a0 = ((i * 360) / n + gap / 2 - 90) * (Math.PI / 180)
    const a1 = (((i + 1) * 360) / n - gap / 2 - 90) * (Math.PI / 180)
    const p = (a: number) => `${(20 + Math.cos(a) * 17).toFixed(2)} ${(20 + Math.sin(a) * 17).toFixed(2)}`
    return `M${p(a0)} A17 17 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`
  }
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full" aria-hidden>
        {items.map((it, i) => (
          <path key={it.label} d={arc(i)} fill="none" strokeWidth={3} stroke={it.done ? GREY[1] : it === next ? ACCENT : TRACK} style={{ strokeLinecap: "var(--cap)" as never }} />
        ))}
      </svg>
      <span className="relative leading-none">{children}</span>
    </div>
  )
}

/** A step's mark: a check when done, an accent ring on the next step, an empty circle otherwise. */
function StepMark({ done, next }: { done: boolean; next: boolean }) {
  return (
    <span
      className={cn("r-dot grid size-4 shrink-0 place-items-center border", done ? "border-transparent bg-muted text-foreground" : "border-[color:color-mix(in_oklab,var(--foreground)_22%,transparent)]")}
      style={next ? { borderColor: ACCENT, borderWidth: 1.5 } : undefined}
    >
      {done && <Check className="size-2.5" />}
    </span>
  )
}

/** Checklist rows: mark, step, its time or length on the right; `hints` adds a line under each open step. */
function Checklist({ items, next, hints, times = true }: { items: Step[]; next?: Step; hints?: boolean; times?: boolean }) {
  const font = useFigureFont()
  return (
    // Whole rows only, and in a cell that sets the height the rows open up to share it.
    <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS)}>
      {items.map((i) => (
        <div key={i.label} className={cn("flex min-w-0 items-center gap-2.5 py-1.5", HAIRLINE)}>
          <StepMark done={i.done} next={i === next} />
          <span className="grid min-w-0 flex-1">
            <span className={cn(TYPE.body, "truncate", i.done && "text-muted-foreground line-through", i === next && "font-medium")}>{i.label}</span>
            {hints && !i.done && <span className={cn(TYPE.small, "truncate")}>{i.hint}</span>}
          </span>
          {times && (
            <span className="shrink-0 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font, color: i === next ? ACCENT_TEXT : "var(--muted-foreground)" }}>
              {i.done ? `done ${i.time}` : i.time}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * First week.
 * steps: the stepped tick track and the next step to take.
 * ring: one line, the next step beside a ring of the steps.
 * checklist: the track over every step, with times.
 */
export function FirstWeek({ variant = "steps" }: WidgetProps) {
  const { coach } = useCoach()
  const { fixed } = useFrame()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  const items = useFirstWeek()
  const done = items.filter((i) => i.done).length
  const next = items.find((i) => !i.done)
  const meta = `${coach.coachName}'s first week · day ${FIRST_WEEK_DAY} of 7`
  const chip = <Chip>{`${done}/${items.length} done`}</Chip>
  const count = (
    <span className="text-[0.6875rem] tabular-nums" style={{ fontFamily: font }}>
      {done}/{items.length}
    </span>
  )

  if (variant === "ring") {
    if (!detailed)
      return (
        <WCard row icon={Flag} title={next ? next.label : "First week done"} meta={standard ? (next ? `Next step · ${next.time} · ${next.hint}` : meta) : undefined}>
          <StepRing items={items} next={next}>
            {count}
          </StepRing>
        </WCard>
      )
    return (
      <WCard icon={Flag} title="First week" meta={meta} chip={chip}>
        <div className="flex min-w-0 items-center gap-3">
          <StepRing items={items} next={next} size={40}>
            {count}
          </StepRing>
          <div className="grid min-w-0 gap-0.5">
            <Label>{next ? "Next step" : "All done"}</Label>
            <span className={cn(TYPE.title, "truncate")}>{next?.label ?? "Welcome in"}</span>
          </div>
        </div>
        <Checklist items={items} next={next} />
      </WCard>
    )
  }

  if (variant === "path") {
    const at = items.findIndex((i) => !i.done)
    const rail: RailItem[] = items.map((i, k) => ({
      time: i.done ? "Sun" : k === at ? "Next" : `${k + 1}`,
      title: i.label,
      sub: standard && !i.done ? i.hint : undefined,
      aside: (
        <span className={i === next ? "" : "text-muted-foreground"} style={i === next ? { color: ink(ACCENT_TEXT) } : undefined}>
          {i.done ? "done" : i.time}
        </span>
      ),
      state: i.done ? "past" : i === next ? "next" : "ahead",
    }))
    rail.splice(at < 0 ? rail.length : at, 0, { now: `Day ${FIRST_WEEK_DAY}` })
    return (
      <WCard icon={Flag} title="First week" meta={meta} chip={chip}>
        <Rail items={standard ? rail : rail.slice(0, (at < 0 ? rail.length : at) + 3)} />
      </WCard>
    )
  }

  if (variant === "checklist") {
    const shown = standard ? items : items.filter((i) => !i.done)
    return (
      <WCard icon={Flag} title="First week" meta={meta} chip={chip}>
        <StepTrack items={items} next={next} height={16} />
        <Checklist items={shown} next={next} hints={detailed} times={standard} />
      </WCard>
    )
  }

  // steps
  return (
    <WCard icon={Flag} title="First week" meta={meta} chip={chip} bodyClassName="justify-center gap-1.5">
      <StepTrack items={items} next={next} />
      {standard && (
        <div className="flex min-w-0 items-baseline gap-2 text-[0.6875rem] leading-4">
          <span className="shrink-0 text-muted-foreground">{next ? "Next" : "Done"}</span>
          <span className="min-w-0 flex-1 truncate font-medium">{next?.label ?? "Your first week"}</span>
          {next && (
            <span className="hidden shrink-0 text-[0.6875rem] tabular-nums @[15rem]:inline" style={{ fontFamily: font, color: ACCENT_TEXT }}>
              {next.time}
            </span>
          )}
        </div>
      )}
      {detailed && (
        <>
          <Rule className="mt-1.5" />
          <Checklist items={items.filter((i) => i !== next)} next={next} />
        </>
      )}
      {/* Room under the track (a taller cell): every step as a row, instead of a blank card around one line. */}
      {fixed && (
        <Drop level={3}>
          <div className="mt-2 flex min-h-0 flex-col">
            <Checklist items={items} next={next} times={standard} />
          </div>
        </Drop>
      )}
    </WCard>
  )
}

// ---------- Ranking

const MEMBERS = 240
type Member = (typeof LEADERBOARD)[number]

/**
 * Every member's discipline score this week (sample): the leaderboard's top
 * five, the places up to the student's, the student, and the rest as a bell
 * around 70 (a fixed pseudo-random sequence, so it renders the same).
 */
const SCORES = (() => {
  const top = LEADERBOARD.filter((l) => !l.me).map((l) => l.score)
  const near = [91.4, 90.8, 90.5, 89.9, 89.6, 88.7]
  const me = LEADERBOARD.find((l) => l.me)!.score
  let s = 11
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const rest = Array.from({ length: MEMBERS - top.length - near.length - 1 }, () => {
    const v = 70 + (rnd() + rnd() + rnd() - 1.5) * 24
    return Math.round(Math.min(87.6, Math.max(34, v)) * 10) / 10
  })
  return [...top, ...near, me, ...rest]
})()
const SORTED = [...SCORES].sort((a, b) => b - a)
/** The top 10% starts here. */
const TOP_CUT = SORTED[Math.floor(MEMBERS * 0.1) - 1]
const MEDIAN = SORTED[Math.floor(MEMBERS / 2)]

/** Weekly change in places, mono: ▲ 4 in profit, ▼ 1 in loss, a dash when flat. */
function Change({ n }: { n: number }) {
  const font = useFigureFont()
  return (
    <span className={cn("text-[0.6875rem] tabular-nums", !n ? "text-muted-foreground" : n > 0 ? "text-profit" : "text-loss")} style={{ fontFamily: font }}>
      {!n ? "–" : `${n > 0 ? "▲" : "▼"} ${Math.abs(n)}`}
    </span>
  )
}

/** One leaderboard row: place, face, name, change, score. The student's row is tinted with an accent edge. */
function RankRow({ p }: { p: Member }) {
  const font = useFigureFont()
  return (
    <div
      className={cn("-mx-1.5 flex min-w-0 items-center gap-2.5 rounded-[min(var(--radius),6px)] px-1.5 py-1", p.me && "bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)]")}
      style={p.me ? { boxShadow: `inset 2px 0 0 ${ACCENT}` } : undefined}
    >
      <span className="w-6 shrink-0 text-right text-[0.6875rem] tabular-nums" style={{ fontFamily: font, color: p.me ? "var(--foreground)" : "var(--muted-foreground)", fontWeight: p.me ? 500 : undefined }}>
        {String(p.rank).padStart(2, "0")}
      </span>
      <span className="hidden @[14rem]:block">
        <Avatar initials={p.initials} size={20} />
      </span>
      <span className={cn(TYPE.body, "min-w-0 flex-1 truncate", p.me && "font-medium")}>{p.me ? `${DEMO_STUDENT.first} (you)` : p.name}</span>
      <span className="hidden w-8 shrink-0 text-right @[16rem]:inline">
        <Change n={p.change} />
      </span>
      <span className="w-7 shrink-0 text-right text-[0.8125rem] tabular-nums" style={{ fontFamily: font }}>
        {p.score}
      </span>
    </div>
  )
}

/** Everyone's score as dots, the student's own marked, the top 10% in the accent. */
function Field({ me, className, axis = true }: { me: number; className?: string; axis?: boolean }) {
  const lo = 30
  const hi = 100
  return (
    <div className={cn("grid gap-1", className)}>
      <DotStrip values={SCORES} me={me} min={lo} max={hi} split={TOP_CUT} mean={MEDIAN} className="h-14" />
      {axis && <Axis labels={[lo, (lo + hi) / 2, hi]} />}
    </div>
  )
}

/**
 * Ranking.
 * trend: the student's place, and where their score sits among every member's.
 * podium: the top three on steps, and the student's own row.
 * leaderboard: the top of the list with the student's own row.
 */
export function MyRank({ variant = "trend" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  const listFit = useFitRows<HTMLDivElement>(28, { min: 2, item: "[data-row] > *" })
  if (empty) return <WidgetEmpty icon={Trophy} title="The ranking starts after week one" text="It's based on discipline, not profit, so everyone starts equal." />
  const me = LEADERBOARD.find((l) => l.me)!
  const others = LEADERBOARD.filter((l) => !l.me)
  const topPct = Math.max(1, Math.ceil((me.rank / MEMBERS) * 100))
  const meta = `${coach.coachName}'s discipline score · ${MEMBERS} ${coach.wording.students.toLowerCase()}`
  const delta = me.change ? `${me.change > 0 ? "▲" : "▼"} ${Math.abs(me.change)}` : undefined
  const deltaTone = me.change >= 0 ? "profit" : "loss"
  const head = <Num value={`#${me.rank}`} unit={`of ${MEMBERS}`} delta={delta} deltaTone={deltaTone} />
  const [list, fit] = listFit

  if (variant === "compare") {
    /** What goes into the discipline score: the student against the average of the top 10% (sample). */
    const rows = [
      { label: "Score", a: me.score, b: 95, aText: String(me.score), bText: "95", better: "higher" as const },
      { label: "Clean days", a: 8, b: 9.6, aText: "8/10", bText: "9.6/10", better: "higher" as const },
      { label: "Trades journaled", a: 68, b: 96, aText: "68%", bText: "96%", better: "higher" as const },
      { label: "Lessons this week", a: 2, b: 3, aText: "2", bText: "3", better: "higher" as const },
      { label: "Lives attended", a: 1, b: 2, aText: "1", bText: "2", better: "higher" as const },
    ]
    return (
      <WCard icon={Trophy} title={coach.wording.ranking} meta={`You vs the top 10% · ${MEMBERS} ${coach.wording.students.toLowerCase()}`} chip={<Chip>{`You #${me.rank}`}</Chip>}>
        <Compare a="You" b="Top 10% average" rows={standard ? rows : rows.slice(0, 3)} />
        {detailed && <span className="shrink-0 truncate text-[0.6875rem] leading-4 text-muted-foreground">Biggest gap: journaling. Log every trade to close it.</span>}
      </WCard>
    )
  }

  if (variant === "hero") {
    const ahead = others[others.length - 1]
    return (
      <HeroCard
        title={`${coach.wording.ranking} · discipline score`}
        chip={<Chip>{`Top ${topPct}%`}</Chip>}
        label={`Your place of ${MEMBERS}`}
        value={`#${me.rank}`}
        delta={standard ? delta && `${delta} this week` : undefined}
        deltaTone={deltaTone}
        line={standard ? `Up from #${RANK_HISTORY[0]} ${RANK_HISTORY.length} weeks ago. ${ahead.name} (#${ahead.rank}) is ${ahead.score - me.score} points ahead.` : undefined}
        stats={
          detailed
            ? [
                { label: "Score", value: me.score, tone: "accent" },
                { label: "Best", value: `#${Math.min(...RANK_HISTORY)}` },
                { label: `#${ahead.rank}`, value: `+${ahead.score - me.score} pts` },
              ]
            : undefined
        }
        foot={standard ? <BleedArea values={RANK_HISTORY} invert /> : undefined}
      />
    )
  }

  if (variant === "podium") {
    const [first, second, third] = others
    const step = (p: Member, h: string) => (
      <div className="flex min-w-0 flex-col items-center justify-end gap-1 [@container_card_(min-height:0px)]:h-full">
        <span className="relative">
          <Avatar initials={p.initials} size={p.rank === 1 ? 30 : 26} />
          {p.rank === 1 && <Crown className="absolute -top-2.5 left-1/2 size-3.5 -translate-x-1/2" style={{ color: ACCENT }} />}
        </span>
        {standard && <span className={cn(TYPE.small, "max-w-full truncate", p.rank === 1 && "text-foreground")}>{p.name}</span>}
        <div
          className={cn("grid w-full content-start justify-items-center gap-0.5 pt-1", h)}
          style={{
            background: "color-mix(in oklab, var(--foreground) 5%, transparent)",
            borderTop: `2px solid ${p.rank === 1 ? ACCENT : GREY[2]}`,
            borderTopLeftRadius: "min(var(--radius), 4px)",
            borderTopRightRadius: "min(var(--radius), 4px)",
          }}
        >
          <span className="text-[0.8125rem] leading-5 tabular-nums" style={{ fontFamily: font }}>
            {p.score}
          </span>
        </div>
      </div>
    )
    return (
      <WCard icon={Trophy} title={coach.wording.ranking} meta={meta} chip={<Chip>{`You #${me.rank} · ${me.score}`}</Chip>}>
        {/* In a cell that sets the height the steps rise with it (in proportion), instead of a short podium under a blank band. */}
        <div className="mt-auto grid grid-cols-3 items-end gap-2 [@container_card_(min-height:0px)]:min-h-0 [@container_card_(min-height:0px)]:flex-1">
          {step(second, "h-9 [@container_card_(min-height:0px)]:h-[clamp(2.25rem,40%,7rem)]")}
          {step(first, "h-12 [@container_card_(min-height:0px)]:h-[clamp(3rem,55%,9.5rem)]")}
          {step(third, "h-6 [@container_card_(min-height:0px)]:h-[clamp(1.5rem,28%,5rem)]")}
        </div>
        {detailed && (
          <>
            <RankRow p={me} />
            <Legend
              items={[
                { color: GREY[2], label: `To #${third.rank} (${third.name})`, value: `+${third.score - me.score} pts` },
                { color: ACCENT, label: "Top 10% from", value: Math.floor(TOP_CUT) },
              ]}
            />
          </>
        )}
      </WCard>
    )
  }

  if (variant === "leaderboard") {
    // As many of the top as the card holds (Detail's count until measured), the student's own row always last.
    const top = others.slice(0, Math.max(1, fit !== undefined ? fit - 1 : detailed ? 5 : standard ? 4 : 3))
    const gap = me.rank - top[top.length - 1].rank - 1
    return (
      <WCard icon={Trophy} title={coach.wording.ranking} meta={meta} chip={<Chip>{`Top ${topPct}%`}</Chip>}>
        {head}
        {/* -mx/px: the rows' tint bleeds 6px past the text on each side; the clipping box makes room for it. */}
        <div ref={list} className="-mx-1.5 grid min-h-0 flex-1 content-start overflow-hidden px-1.5 [&>[data-row]]:contents">
          {top.map((p) => (
            <div key={p.rank} data-row>
              <RankRow p={p} />
            </div>
          ))}
          {gap > 0 && (
            <span className="py-0.5 pl-1 text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
              ··· {gap} more
            </span>
          )}
          <div data-row>
            <RankRow p={me} />
          </div>
        </div>
        {detailed && <Field me={me.score} className="mt-auto hidden @[15rem]:grid" />}
      </WCard>
    )
  }

  // trend: wide and short, the field on the left and the figures beside it; taller, the field sits in the middle.
  return (
    <WCard icon={Trophy} title={coach.wording.ranking} meta={meta} chip={<Chip>{`Top ${topPct}%`}</Chip>} bodyClassName={SPLIT}>
      {head}
      <div data-main className="flex min-h-min flex-1 flex-col justify-center">
        <Field me={me.score} axis={standard} />
      </div>
      {standard && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Score", value: me.score },
            { label: "Top", value: `${topPct}%` },
            { label: "Best", value: `#${Math.min(...RANK_HISTORY)}` },
          ].map((s) => (
            <div key={s.label} className="grid min-w-0 gap-0.5">
              <Label className="truncate">{s.label}</Label>
              <span className="truncate text-[0.8125rem] leading-5 tabular-nums" style={{ fontFamily: font }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {detailed && (
        <Legend
          items={[
            { color: ACCENT, label: "Top 10%", value: `≥ ${Math.floor(TOP_CUT)}` },
            { color: GREY[2], label: coach.wording.students, value: MEMBERS },
            { color: "var(--foreground)", label: `${DEMO_STUDENT.first} (you)`, value: me.score },
            { color: GREY[1], label: "Median (dashed)", value: Math.round(MEDIAN) },
            { color: GREY[3], label: `${RANK_HISTORY.length} weeks ago`, value: `#${RANK_HISTORY[0]}` },
          ]}
        />
      )}
    </WCard>
  )
}
