"use client"

import { ArrowDown, ArrowUp, Check, Crown, Flag, Trophy } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { LEADERBOARD, RANK_HISTORY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Head, Ring, Spark, TONE, Track, W, fill } from "./kit"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

function useFirstWeek() {
  const { coach } = useCoach()
  const empty = useEmpty()
  return [
    { label: `First ${coach.wording.lesson.toLowerCase()}`, done: !empty },
    { label: "Join a live", done: false },
    ...(coach.modules.community ? [{ label: "Say hello", done: false }] : []),
    ...(coach.modules.journal ? [{ label: "Connect broker", done: false }] : []),
  ]
}

/** First week: steps (segmented bar), ring (progress + next step), checklist. */
export function FirstWeek({ variant = "steps" }: WidgetProps) {
  const items = useFirstWeek()
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)
  const next = items.find((i) => !i.done)

  if (variant === "ring") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={pct} size={72} stroke={7}>
          <span className="font-heading text-base font-semibold tabular-nums">
            {done}/{items.length}
          </span>
        </Ring>
        <div className="grid min-w-0 gap-1.5">
          <Head icon={Flag} label="First week" />
          <span className="truncate font-heading text-lg leading-tight font-semibold">{next ? next.label : "All done"}</span>
        </div>
      </W>
    )
  }

  if (variant === "checklist") {
    return (
      <W>
        <Head icon={Flag} value={`${done}/${items.length}`} label="First week" />
        <div className="grid flex-1 content-start gap-2">
          {items.map((i) => (
            <div key={i.label} className="flex min-w-0 items-center gap-2.5 text-sm">
              <span className={cn("r-dot grid size-5 shrink-0 place-items-center border", i.done && "border-primary bg-primary text-primary-foreground")}>
                {i.done && <Check className="size-3" />}
              </span>
              <span className={cn("truncate", i.done && "text-muted-foreground line-through")}>{i.label}</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Flag} value={`${pct}%`} label="First week" right={`${done} of ${items.length}`} />
      <div className="flex gap-1">
        {items.map((i) => (
          <span key={i.label} className="r-bar h-2 flex-1" style={{ background: i.done ? fill("primary", "90deg") : i === next ? `color-mix(in oklab, ${TONE.primary} 35%, var(--muted))` : "var(--muted)" }} />
        ))}
      </div>
      <div className="mt-auto grid min-w-0 gap-1">
        <Caps>Next step</Caps>
        <span className="truncate font-heading text-lg leading-tight font-semibold">{next?.label ?? "All done"}</span>
      </div>
    </W>
  )
}

function Change({ n }: { n: number }) {
  if (!n) return <span className="text-xs text-muted-foreground">–</span>
  return (
    <span className={cn("flex items-center text-xs font-medium tabular-nums", n > 0 ? "text-profit" : "text-loss")}>
      {n > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(n)}
    </span>
  )
}

/** Ranking: trend (place over 8 weeks), podium (top 3), leaderboard (score bars), brand (trend on the coach's colour). */
export function MyRank({ variant = "trend" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Trophy} title="The ranking starts after week one" text="It's based on discipline, not profit, so everyone starts equal." />
  const me = LEADERBOARD.find((l) => l.me)!

  if (variant === "podium") {
    const [first, second, third] = LEADERBOARD
    const col = (p: typeof first, h: string) => (
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="r-dot grid size-8 place-items-center bg-muted text-[0.65rem] font-semibold">{p.initials}</span>
        <Caps className="max-w-full truncate">{p.name}</Caps>
        <div
          className={cn("grid w-full place-items-start justify-center overflow-hidden pt-1.5 font-heading text-sm font-semibold", h, p.rank === 1 ? "fx-hero" : "bg-muted")}
          style={{ borderTopLeftRadius: "var(--r-inner)", borderTopRightRadius: "var(--r-inner)" }}
        >
          {p.rank === 1 ? <Crown className="size-4" /> : p.rank}
        </div>
      </div>
    )
    return (
      <W>
        <Head icon={Trophy} value={`#${me.rank}`} label="You" right={<Change n={me.change} />} />
        <div className="mt-auto grid grid-cols-3 items-end gap-2">
          {col(second, "h-12")}
          {col(first, "h-20")}
          {col(third, "h-8")}
        </div>
      </W>
    )
  }

  if (variant === "leaderboard") {
    const max = Math.max(...LEADERBOARD.map((l) => l.score))
    return (
      <W>
        <Head icon={Trophy} label={coach.wording.ranking} right="Discipline score" />
        <div className="grid flex-1 content-evenly gap-2">
          {LEADERBOARD.map((p) => (
            <div key={p.rank} className={cn("grid gap-1", p.me && "r-inner mt-1 bg-primary/8 p-1.5")}>
              <div className="flex min-w-0 items-center gap-2 text-xs">
                <span className="w-5 shrink-0 font-medium tabular-nums text-muted-foreground">{p.rank}</span>
                <span className={cn("flex-1 truncate", p.me && "font-semibold")}>{p.name}</span>
                <Change n={p.change} />
                <span className="w-6 shrink-0 text-right font-semibold tabular-nums">{p.score}</span>
              </div>
              <Track className="ml-7 h-1" value={(p.score / max) * 100} color={p.me ? fill("primary", "90deg") : `color-mix(in oklab, ${TONE.primary} 28%, var(--muted))`} />
            </div>
          ))}
        </div>
      </W>
    )
  }

  return (
    <W brand={variant === "brand"}>
      <Head icon={Trophy} label={coach.wording.ranking} right={<Change n={me.change} />} />
      <Big value={`#${me.rank}`} unit="of 240" sub={`Up from #${RANK_HISTORY[0]} eight weeks ago`} />
      <Spark values={RANK_HISTORY} invert format={(v) => `#${v}`} tip={(i) => (i === RANK_HISTORY.length - 1 ? "This week" : `${RANK_HISTORY.length - 1 - i}w ago`)} />
    </W>
  )
}
