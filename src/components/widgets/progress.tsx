"use client"

import { Check, Crown, Flag, Trophy } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { LEADERBOARD, RANK_HISTORY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, Avatar, Big, Caps, Delta, Head, Ring, Row, Spark, Stat, TYPE, Track, W, useMore } from "./kit"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** A neutral stand-in for the accent, so only one thing per widget carries the coach's colour. */
const NEUTRAL = "color-mix(in oklab, var(--foreground) 45%, transparent)"
const quietAccent = { "--w-accent": NEUTRAL } as React.CSSProperties

function useFirstWeek() {
  const { coach } = useCoach()
  const empty = useEmpty()
  return [
    { label: `First ${coach.wording.lesson.toLowerCase()}`, hint: "About 15 min", done: !empty },
    { label: "Join a live", hint: "Next one Mon 18:00", done: false },
    ...(coach.modules.community ? [{ label: "Say hello", hint: "Introduce yourself", done: false }] : []),
    ...(coach.modules.journal ? [{ label: "Connect broker", hint: "Takes 2 min", done: false }] : []),
  ]
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

/**
 * First week.
 * steps: one short bar per step, and the next step to take.
 * ring: a progress ring beside the next step.
 * checklist: every step with a check mark.
 */
export function FirstWeek({ variant = "steps" }: WidgetProps) {
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const items = useFirstWeek()
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)
  const next = items.find((i) => !i.done)
  const rest = items.filter((i) => !i.done && i !== next)

  if (variant === "ring") {
    return (
      <W className="justify-center">
        <div className="flex items-center gap-3">
          <Ring value={pct} size={48} stroke={4}>
            <span className="text-xs font-medium tabular-nums">
              {done}/{items.length}
            </span>
          </Ring>
          <div className="grid min-w-0 gap-0.5">
            <Caps>{next ? "Next step" : "First week"}</Caps>
            <span className={cn(TYPE.title, "truncate")}>{next ? next.label : "All done"}</span>
            {standard && next && <span className={cn(TYPE.small, "truncate")}>{next.hint}</span>}
          </div>
        </div>
        {detailed && rest.length > 0 && <span className={cn(TYPE.small, "truncate")}>Then: {rest.map((r) => r.label).join(" · ")}</span>}
      </W>
    )
  }

  if (variant === "checklist") {
    const shown = standard ? items : items.filter((i) => !i.done)
    return (
      <W>
        <Head icon={Flag} value={`${done}/${items.length}`} label="First week" />
        <div className="grid flex-1 content-start">
          {shown.map((i) => (
            <div key={i.label} className="flex min-w-0 items-center gap-2.5 py-1.5">
              <StepMark done={i.done} next={i === next} />
              <span className="grid min-w-0">
                <span className={cn(TYPE.body, "truncate", i.done && "text-muted-foreground line-through", i === next && "font-medium")}>{i.label}</span>
                {detailed && !i.done && <span className={cn(TYPE.small, "truncate")}>{i.hint}</span>}
              </span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  // steps
  return (
    <W>
      <Head icon={Flag} label="First week" right={`${done} of ${items.length}`} />
      <div className="flex gap-1">
        {items.map((i) => (
          <span
            key={i.label}
            title={i.label}
            className="r-bar h-1.5 flex-1"
            style={{ background: i.done ? NEUTRAL : i === next ? ACCENT : "var(--muted)" }}
          />
        ))}
      </div>
      {standard && (
        <div className="mt-auto grid min-w-0 gap-0.5">
          <Caps>{next ? "Next step" : "First week"}</Caps>
          <span className={cn(TYPE.title, "truncate")}>{next?.label ?? "All done"}</span>
          {detailed && next && <span className={cn(TYPE.small, "truncate")}>{next.hint}</span>}
        </div>
      )}
    </W>
  )
}

/** Weekly change in places: ▲ 4, or a dash. */
function Change({ n }: { n: number }) {
  if (!n) return <span className="text-xs text-muted-foreground">–</span>
  return <Delta value={n} suffix="" />
}

/**
 * Ranking.
 * trend: the student's place, and how it moved over 8 weeks.
 * podium: the top three on steps, with faces.
 * leaderboard: the top of the list with the student's own row.
 */
export function MyRank({ variant = "trend" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <WidgetEmpty icon={Trophy} title="The ranking starts after week one" text="It's based on discipline, not profit, so everyone starts equal." />
  const me = LEADERBOARD.find((l) => l.me)!
  const others = LEADERBOARD.filter((l) => !l.me)

  if (variant === "podium") {
    const [first, second, third] = others
    const step = (p: typeof first, h: string) => (
      <div className="flex min-w-0 flex-col items-center gap-1.5">
        <span className="relative">
          <Avatar initials={p.initials} size={p.rank === 1 ? 36 : 28} />
          {p.rank === 1 && <Crown className="absolute -top-2.5 left-1/2 size-3.5 -translate-x-1/2" style={{ color: ACCENT }} />}
        </span>
        <span className={cn(TYPE.small, "max-w-full truncate", p.rank === 1 && "text-foreground")}>{p.name}</span>
        <div
          className={cn("grid w-full place-items-start justify-center pt-1.5 text-xs font-medium tabular-nums text-muted-foreground", h)}
          style={{ background: "var(--muted)", borderTopLeftRadius: "var(--r-inner, 6px)", borderTopRightRadius: "var(--r-inner, 6px)" }}
        >
          {standard ? p.score : p.rank}
        </div>
      </div>
    )
    return (
      <W>
        <Head icon={Trophy} label={coach.wording.ranking} value={`#${me.rank}`} unit="you" tone="fg" right={<Change n={me.change} />} />
        <div className="mt-auto grid grid-cols-3 items-end gap-2">
          {step(second, "h-10")}
          {step(first, "h-16")}
          {step(third, "h-7")}
        </div>
        {detailed && <Row rank={me.rank} avatar={<Avatar initials={me.initials} size={20} />} title={me.name} value={<span className="flex items-center gap-2"><Change n={me.change} /> {me.score}</span>} me />}
      </W>
    )
  }

  if (variant === "leaderboard") {
    const top = others.slice(0, detailed ? 5 : standard ? 4 : 3)
    const max = Math.max(...LEADERBOARD.map((l) => l.score))
    return (
      <W>
        <Head icon={Trophy} label={coach.wording.ranking} right="Discipline score" />
        <div className="grid flex-1 content-start">
          {[...top, me].map((p) => (
            <div key={p.rank} className={cn(p.me && "mt-1")}>
              <Row
                me={p.me}
                rank={p.rank}
                avatar={<span className="hidden @[14rem]:block"><Avatar initials={p.initials} size={22} /></span>}
                title={p.name}
                value={
                  <span className="flex items-center gap-2.5">
                    <span className="hidden @[16rem]:inline">
                      <Change n={p.change} />
                    </span>
                    <span className="w-6 text-right font-medium">{p.score}</span>
                  </span>
                }
              />
              {detailed && (
                <span className="hidden pb-1 pl-6.5 @[18rem]:block" style={p.me ? undefined : quietAccent}>
                  <Track value={(p.score / max) * 100} />
                </span>
              )}
            </div>
          ))}
        </div>
      </W>
    )
  }

  // trend
  return (
    <W>
      <Head icon={Trophy} label={coach.wording.ranking} right={<Change n={me.change} />} />
      <Big value={`#${me.rank}`} unit="of 240" sub={standard ? `Up from #${RANK_HISTORY[0]} eight weeks ago` : undefined} />
      {standard && <Spark values={RANK_HISTORY} invert format={(v) => `#${v}`} tip={(i) => (i === RANK_HISTORY.length - 1 ? "This week" : `${RANK_HISTORY.length - 1 - i}w ago`)} />}
      {detailed && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Score" value={me.score} />
          <Stat label="Top" value={`${Math.max(1, Math.round((me.rank / 240) * 100))}%`} />
          <Stat label="Best" value={`#${Math.min(...RANK_HISTORY)}`} />
        </div>
      )}
    </W>
  )
}
