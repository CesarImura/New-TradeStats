"use client"

import { ArrowDown, ArrowUp, Check, Crown, Trophy } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LEADERBOARD } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Ring, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

function useFirstWeek() {
  const { coach } = useCoach()
  const empty = useEmpty()
  return [
    { label: `Watch your first ${coach.wording.lesson.toLowerCase()}`, done: !empty },
    { label: "Join a live session", done: false },
    ...(coach.modules.community ? [{ label: `Post an intro in ${coach.wording.community}`, done: false }] : []),
    ...(coach.modules.journal ? [{ label: "Connect your broker", done: false }] : []),
  ]
}

/** First week: checklist, steps (numbered path), progress (ring + next step). */
export function FirstWeek({ variant = "checklist" }: WidgetProps) {
  const items = useFirstWeek()
  const done = items.filter((i) => i.done).length
  const pct = Math.round((done / items.length) * 100)
  const next = items.find((i) => !i.done)

  if (variant === "progress") {
    return (
      <Card className="@container">
        <CardContent className="flex items-center gap-4">
          <Ring value={pct} size={88} stroke={8}>
            <span className="text-lg font-semibold tabular-nums">
              {done}/{items.length}
            </span>
          </Ring>
          <div className="grid gap-1">
            <span className="eyebrow">Your first week</span>
            <span className="font-heading text-lg leading-tight">Next: {next?.label ?? "All done"}</span>
            <span className="text-sm text-muted-foreground">{items.length - done} steps to go. Most people finish in 3 days.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "steps") {
    return (
      <Card className="@container">
        <CardHeader>
          <CardDescription className="eyebrow">Your first week</CardDescription>
          <CardTitle className="text-lg">
            {done} of {items.length} done
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 @xl:grid-cols-4 @xl:gap-2">
            {items.map((i, n) => (
              <li key={i.label} className="flex items-center gap-3 @xl:flex-col @xl:items-start">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                    i.done ? "border-primary bg-primary text-primary-foreground" : i === next ? "border-primary text-primary" : "text-muted-foreground",
                  )}
                >
                  {i.done ? <Check className="size-4" /> : n + 1}
                </span>
                <span className={cn("text-sm", i.done && "text-muted-foreground")}>{i.label}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Your first week</CardDescription>
        <CardTitle className="text-lg">
          {done} of {items.length} done
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-3 text-sm">
            <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border", i.done && "border-primary bg-primary text-primary-foreground")}>
              {i.done && <Check className="size-3" />}
            </span>
            <span className={cn(i.done && "text-muted-foreground line-through")}>{i.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function Change({ n }: { n: number }) {
  if (!n) return <span className="text-xs text-muted-foreground">–</span>
  return (
    <span className={cn("flex items-center text-xs tabular-nums", n > 0 ? "text-profit" : "text-loss")}>
      {n > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(n)}
    </span>
  )
}

/** My rank: number, podium (top 3 + you), leaderboard (top 5 + you). */
export function MyRank({ variant = "number" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Trophy} title="The ranking starts after your first week" text="Rankings use discipline, not profit, so everyone starts equal." />
  const me = LEADERBOARD.find((l) => l.me)!

  if (variant === "podium") {
    const [first, second, third] = LEADERBOARD
    const col = (p: typeof first, h: string) => (
      <div className="flex flex-col items-center gap-1">
        <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">{p.initials}</span>
        <span className="max-w-full truncate text-xs">{p.name}</span>
        <div className={cn("grid w-full place-items-start justify-center rounded-t-[min(var(--radius),8px)] pt-1 text-sm font-semibold", h, p.rank === 1 ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {p.rank === 1 ? <Crown className="size-4" /> : p.rank}
        </div>
      </div>
    )
    return (
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">{coach.wording.ranking} · discipline</CardDescription>
          <CardTitle className="flex items-baseline gap-2 text-lg">
            You&apos;re #{me.rank} <Change n={me.change} />
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-auto grid grid-cols-3 items-end gap-2">
          {col(second, "h-10")}
          {col(first, "h-16")}
          {col(third, "h-7")}
        </CardContent>
      </Card>
    )
  }

  if (variant === "leaderboard") {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">{coach.wording.ranking}</CardDescription>
          <CardTitle className="text-lg">This week&apos;s top traders</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-1">
          {LEADERBOARD.map((p) => (
            <div key={p.rank} className={cn("flex items-center gap-3 rounded-md px-2 py-1.5 text-sm", p.me && "mt-2 bg-primary/10 font-medium")}>
              <span className="w-6 text-muted-foreground tabular-nums">{p.rank}</span>
              <span className="grid size-6 place-items-center rounded-full bg-muted text-[0.6rem] font-semibold">{p.initials}</span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="tabular-nums">{p.score}</span>
              <Change n={p.change} />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.ranking} · discipline</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-5xl tabular-nums">
          #{me.rank} <span className="text-sm font-normal text-muted-foreground">of 240</span>
        </CardTitle>
        <CardAction>
          <Trophy className="size-5 text-primary" />
        </CardAction>
      </CardHeader>
      <CardContent className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
        <Change n={me.change} /> places this week · score {me.score}
      </CardContent>
    </Card>
  )
}
