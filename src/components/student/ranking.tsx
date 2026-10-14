"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Flame, Medal, Trophy } from "@/components/icons"
import { toast } from "sonner"
import { useCommunityData } from "@/components/admin/kit"
import { DEFAULT_RANKING, type RankingSetup } from "@/components/admin/ranking/ranking-admin"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BADGES, LEVELS, RANK_METRICS } from "@/lib/data/people"
import { LEADERBOARD } from "@/lib/data/sample"
import { useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

/** STU-25 leaderboards and competitions, STU-26 level, points, badges and streak. */
export function StudentRanking() {
  const { coach } = useCoach()
  const r = useStored<RankingSetup>(`${coach.slug}:ranking`, DEFAULT_RANKING)
  const [period, setPeriod] = useState(r.period)
  const [hidden, setHidden] = useCommunityData(coach.slug, "rank-hidden", false)
  const [joined, setJoined] = useCommunityData(coach.slug, "rank-joined", false)
  const metric = RANK_METRICS.find((m) => m.id === r.metric)
  const live = r.competitions.find((c) => c.status === "running")
  const points = 1180
  const level = [...LEVELS].reverse().find((l) => points >= l.from)!
  const next = LEVELS[LEVELS.indexOf(level) + 1]

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Ranked by {metric?.name.toLowerCase()} · {metric?.text}</span>
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.ranking}</h1>
      </div>

      {live && (
        <Card className="fx-hero flex-row flex-wrap items-center gap-4 px-5">
          <Trophy className="size-8 shrink-0" />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className="eyebrow">Competition · ends {live.end}</span>
            <span className="text-xl">{live.name}</span>
            <span className="text-sm opacity-80">
              Prize: {live.prize} · {live.entrants + (joined ? 1 : 0)} taking part
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setJoined(!joined)
              toast(joined ? "You left the competition" : "You're in", { description: joined ? undefined : "Only your verified broker trades count." })
            }}
          >
            {joined ? "Leave" : "Take part"}
          </Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="gap-3 px-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5">
            <h2 className="text-lg">Leaderboard</h2>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="all">All time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="divide-y">
            {LEADERBOARD.map((l) => (
              <div key={l.rank} className={cn("flex items-center gap-3 px-5 py-2.5", l.me && "bg-primary/8")}>
                <span className={cn("w-7 text-center font-heading text-lg tabular-nums", l.rank <= 3 && "text-primary")}>{l.rank}</span>
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{l.initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm">{l.me ? (hidden ? "You (hidden from others)" : "You") : l.name}</span>
                <span className={cn("flex w-10 items-center justify-end gap-0.5 text-xs tabular-nums", l.change > 0 ? "text-profit" : l.change < 0 ? "text-loss" : "text-muted-foreground")}>
                  {l.change > 0 ? <ArrowUp className="size-3" /> : l.change < 0 ? <ArrowDown className="size-3" /> : null}
                  {l.change !== 0 ? Math.abs(l.change) : "–"}
                </span>
                <span className="w-10 text-right tabular-nums">{l.score}</span>
              </div>
            ))}
          </div>
          {r.optOut && (
            <label className="flex items-center justify-between gap-3 border-t px-5 pt-3 text-sm">
              <span className="grid">
                Show me on the leaderboard
                <span className="text-xs text-muted-foreground">{r.nicknames ? "Others see your nickname, never amounts" : "Others see your name, never amounts"}</span>
              </span>
              <Switch checked={!hidden} onCheckedChange={(v) => setHidden(!v)} />
            </label>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-3 px-5">
            <span className="eyebrow">Your level</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl">{level.name}</span>
              <span className="text-sm text-muted-foreground tabular-nums">{points.toLocaleString("en")} points</span>
            </div>
            {next && (
              <>
                <Progress value={((points - level.from) / (next.from - level.from)) * 100} />
                <span className="text-xs text-muted-foreground">
                  {next.from - points} points to {next.name}
                </span>
              </>
            )}
            <div className="flex items-center gap-2 border-t pt-3 text-sm">
              <Flame className="size-4 text-primary" /> 6-day streak of journaling
            </div>
          </Card>
          <Card className="gap-3 px-5">
            <span className="eyebrow">Badges</span>
            <div className="grid grid-cols-3 gap-2">
              {BADGES.map((b, i) => (
                <div key={b.name} className={cn("grid justify-items-center gap-1.5 rounded-(--r-inner) border p-2.5 text-center", i > 2 && "opacity-40")}>
                  <Medal className={cn("size-6", i <= 2 ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-[0.7rem] leading-tight">{b.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
