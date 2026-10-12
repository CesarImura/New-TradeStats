"use client"

import { ArrowDown, ArrowUp, Check, Crown, Flag, Trophy } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { LEADERBOARD, RANK_HISTORY } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Head, Ring, Spark, TONE, W } from "./kit"
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
        <Ring value={pct} size={80} stroke={8}>
          <span className="font-heading text-lg font-semibold tabular-nums">
            {done}/{items.length}
          </span>
        </Ring>
        <div className="grid min-w-0 gap-1.5">
          <Head icon={Flag} label="First week" />
          <span className="truncate font-heading text-lg leading-tight font-semibold">{next ? `Next: ${next.label}` : "All done"}</span>
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
            <div key={i.label} className="flex items-center gap-2.5 text-sm">
              <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", i.done && "border-primary bg-primary text-primary-foreground")}>
                {i.done && <Check className="size-3" />}
              </span>
              <span className={cn(i.done && "text-muted-foreground line-through")}>{i.label}</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Flag} value={`${pct}%`} label="First week" right={`${done}/${items.length}`} />
      <div className="flex gap-1">
        {items.map((i) => (
          <span
            key={i.label}
            className={cn("h-2 flex-1 rounded-full", i.done && "fx-glow")}
            style={{ background: i.done ? "var(--brand-grad-h)" : i === next ? TONE.highlight : "var(--muted)" }}
          />
        ))}
      </div>
      <div className="mt-auto grid gap-1">
        <Caps>Next step</Caps>
        <span className="font-heading text-lg leading-tight font-semibold">{next?.label ?? "All done"}</span>
      </div>
    </W>
  )
}

function Change({ n }: { n: number }) {
  if (!n) return <span className="text-xs text-muted-foreground">–</span>
  return (
    <span className={cn("flex items-center text-xs font-semibold tabular-nums", n > 0 ? "text-profit" : "text-loss")}>
      {n > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(n)}
    </span>
  )
}

/** Ranking: trend (place over 8 weeks), podium (top 3), leaderboard (score bars). */
export function MyRank({ variant = "trend" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Trophy} title="The ranking starts after week one" text="It's based on discipline, not profit, so everyone starts equal." />
  const me = LEADERBOARD.find((l) => l.me)!

  if (variant === "podium") {
    const [first, second, third] = LEADERBOARD
    const col = (p: typeof first, h: string) => (
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="grid size-8 place-items-center rounded-full bg-muted text-[0.65rem] font-semibold">{p.initials}</span>
        <Caps className="max-w-full truncate">{p.name}</Caps>
        <div className={cn("grid w-full place-items-start justify-center overflow-hidden rounded-t-[min(var(--radius),8px)] pt-1.5 font-heading text-sm font-semibold", h, p.rank === 1 ? "fx-hero fx-glow" : "bg-muted")}>
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
            <div key={p.rank} className={cn("grid gap-1", p.me && "mt-1 rounded-md bg-primary/10 p-1.5")}>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-5 font-semibold tabular-nums text-muted-foreground">{p.rank}</span>
                <span className={cn("flex-1 truncate", p.me && "font-semibold")}>{p.name}</span>
                <Change n={p.change} />
                <span className="w-6 text-right font-semibold tabular-nums">{p.score}</span>
              </div>
              <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", p.me && "fx-glow")}
                  style={{ width: `${(p.score / max) * 100}%`, background: p.me ? "var(--brand-grad-h)" : `color-mix(in oklab, ${TONE.primary} 30%, var(--muted))` }}
                />
              </div>
            </div>
          ))}
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Trophy} label={coach.wording.ranking} right={<Change n={me.change} />} />
      <Big fx value={`#${me.rank}`} unit="of 240" sub={`Up from #${RANK_HISTORY[0]} eight weeks ago`} />
      <Spark values={RANK_HISTORY} invert />
      <div className="flex justify-between">
        <Caps>8 weeks</Caps>
        <Caps className="text-foreground">Now</Caps>
      </div>
    </W>
  )
}
