"use client"

import Link from "next/link"
import { CalendarDays, CalendarX, Radio, TriangleAlert } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EVENTS, type CalEvent } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const KIND_DOT: Record<CalEvent["kind"], string> = {
  live: "bg-primary",
  call: "bg-sky-500",
  workshop: "bg-violet-500",
  "one-on-one": "bg-emerald-500",
  news: "bg-loss",
}

function NothingPlanned({ news }: { news?: boolean }) {
  const { coach } = useCoach()
  return news ? (
    <WidgetEmpty icon={CalendarX} title="No market news this week" text="Rate decisions, CPI and NFP show here in your time zone." />
  ) : (
    <WidgetEmpty icon={CalendarX} title="Nothing planned yet" text={`${coach.coachName}'s live sessions and calls will appear here.`} />
  )
}

/** Next live session: card, banner (brand colour block), countdown (big timer). */
export function NextLive({ variant = "card" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <NothingPlanned />
  const live = EVENTS.find((e) => e.kind === "live")!

  if (variant === "countdown") {
    const h = Math.floor((live.inMinutes ?? 0) / 60)
    const m = (live.inMinutes ?? 0) % 60
    return (
      <Card className="@container">
        <CardHeader>
          <CardDescription className="eyebrow flex items-center gap-1.5">
            <Radio className="size-3.5 text-primary" /> Next live in
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <div className="flex items-end gap-3 font-heading tabular-nums">
            {[
              [h, "hours"],
              [m, "min"],
            ].map(([v, l]) => (
              <div key={l} className="grid">
                <span className="text-5xl leading-none">{String(v).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>
          <div className="text-sm">
            <div>{live.title}</div>
            <div className="text-muted-foreground">Today {live.time} · {live.seats}</div>
          </div>
          <Button variant="secondary" {...link(`${base}/calendar`)}>
            <CalendarDays /> Remind me
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (variant === "banner") {
    return (
      <div className="flex flex-col justify-between gap-6 rounded-(--radius) bg-primary p-[calc(var(--card-spacing,1rem)*1.25)] text-primary-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-center gap-2 text-sm opacity-85">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-current" />
          </span>
          Next live session
        </div>
        <div>
          <div className="font-heading text-2xl leading-tight">{live.title}</div>
          <div className="opacity-80">Today · {live.time} · with {coach.coachName}</div>
        </div>
        <Button variant="secondary" {...link(`${base}/calendar`)}>
          <CalendarDays /> Add to my calendar
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow flex items-center gap-1.5">
          <Radio className="size-3.5 text-primary" /> Next live session
        </CardDescription>
        <CardTitle className="text-xl">{live.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground">
          Today · {live.time} · with {coach.coachName} · in {inWords(live.inMinutes ?? 0)}
        </p>
        <Button variant="secondary" {...link(`${base}/calendar`)}>
          <CalendarDays /> Add to my calendar
        </Button>
      </CardContent>
    </Card>
  )
}

/** This week: list, timeline (vertical), days (strip per weekday). */
export function ThisWeek({ variant = "list", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <NothingPlanned />
  const items = EVENTS.filter((e) => props.news !== false || e.kind !== "news")

  if (variant === "days") {
    return (
      <Card className="@container">
        <CardHeader>
          <CardDescription className="eyebrow">{coach.wording.calendar}</CardDescription>
          <CardTitle className="text-lg">This week</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 @md:grid-cols-5">
          {WEEK.map((d, i) => {
            const today = i === 0
            const ev = items.filter((e) => e.day === d)
            return (
              <div key={d} className={cn("flex flex-col gap-1.5 rounded-[min(var(--radius),10px)] border p-2", today && "border-primary bg-primary/5")}>
                <span className={cn("eyebrow", today && "text-primary")}>{d} {12 + i}</span>
                {ev.length === 0 && <span className="text-xs text-muted-foreground">Free</span>}
                {ev.map((e) => (
                  <span key={e.id} className="flex items-start gap-1.5 text-xs leading-tight">
                    <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", KIND_DOT[e.kind])} />
                    <span>
                      <span className="text-muted-foreground tabular-nums">{e.time}</span> {e.title}
                    </span>
                  </span>
                ))}
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  if (variant === "timeline") {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="eyebrow">{coach.wording.calendar}</CardDescription>
          <CardTitle className="text-lg">This week</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative grid gap-4 border-l pl-5">
            {items.slice(0, 5).map((e) => (
              <li key={e.id} className="relative">
                <span className={cn("absolute top-1 -left-[1.6rem] size-2.5 rounded-full ring-4 ring-card", KIND_DOT[e.kind])} />
                <div className="text-xs text-muted-foreground">
                  {e.day} {e.date} · {e.time}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {e.title}
                  {e.noTrade && <TriangleAlert className="size-3.5 text-loss" />}
                </div>
                {e.seats && <div className="text-xs text-muted-foreground">{e.seats}</div>}
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
        <CardDescription className="eyebrow">{coach.wording.calendar}</CardDescription>
        <CardTitle className="text-lg">This week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {items.slice(0, 5).map((e) => (
          <Link key={e.id} href={`${base}/calendar`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="grid w-11 shrink-0 text-center leading-tight">
              <span className="eyebrow">{e.day}</span>
              <span className="text-sm tabular-nums">{e.time}</span>
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
            {e.noTrade && <TriangleAlert className="size-3.5 shrink-0 text-loss" />}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

const IMPACT = { high: "bg-loss", medium: "bg-amber-500", low: "bg-muted-foreground/40" } as const

function ImpactBars({ level }: { level: keyof typeof IMPACT }) {
  const n = level === "high" ? 3 : level === "medium" ? 2 : 1
  return (
    <span className="flex items-end gap-0.5" aria-label={`${level} impact`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("w-1 rounded-sm", i <= n ? IMPACT[level] : "bg-muted")} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  )
}

/** Economic news: list, impact (table with impact and figures), next (the next big event). */
export function EconNews({ variant = "list" }: WidgetProps) {
  const empty = useEmpty()
  if (empty) return <NothingPlanned news />
  const news = EVENTS.filter((e) => e.kind === "news")

  if (variant === "next") {
    const big = news.find((e) => e.impact === "high")!
    return (
      <Card className={cn(big.noTrade && "ring-1 ring-loss/40")}>
        <CardHeader>
          <CardDescription className="eyebrow">Next high-impact news</CardDescription>
          <CardTitle className="text-2xl">{big.title}</CardTitle>
          <CardAction>
            <ImpactBars level="high" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground">
            {big.day} {big.date} · {big.time} · in {inWords(big.inMinutes ?? 0)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs text-muted-foreground">Forecast</div>
              <div className="tabular-nums">{big.forecast}</div>
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="text-xs text-muted-foreground">Previous</div>
              <div className="tabular-nums">{big.previous}</div>
            </div>
          </div>
          {big.noTrade && (
            <div className="flex items-center gap-2 rounded-md bg-loss/10 p-2 text-sm text-loss">
              <TriangleAlert className="size-4" /> Coach says: no trades 10 min around it
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === "impact") {
    return (
      <Card className="@container">
        <CardHeader>
          <CardDescription className="eyebrow">Economic calendar</CardDescription>
          <CardTitle className="text-lg">This week</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-normal">When</th>
                <th className="pb-2 font-normal">Event</th>
                <th className="hidden pb-2 font-normal @sm:table-cell">Fcst</th>
                <th className="pb-2 text-right font-normal">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {news.map((e) => (
                <tr key={e.id}>
                  <td className="py-1.5 pr-2 whitespace-nowrap text-muted-foreground tabular-nums">
                    {e.day} {e.time}
                  </td>
                  <td className="py-1.5 pr-2">
                    {e.title} {e.noTrade && <TriangleAlert className="inline size-3 text-loss" />}
                  </td>
                  <td className="hidden py-1.5 pr-2 text-muted-foreground tabular-nums @sm:table-cell">{e.forecast ?? "–"}</td>
                  <td className="py-1.5">
                    <span className="flex justify-end">
                      <ImpactBars level={e.impact ?? "low"} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Economic calendar</CardDescription>
        <CardTitle className="text-lg">News this week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {news.slice(0, 4).map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="w-20 shrink-0 text-muted-foreground tabular-nums">
              {e.day} {e.time}
            </span>
            <span className="flex-1">{e.title}</span>
            {e.noTrade && (
              <Badge variant="outline" className="gap-1 border-loss/40 text-loss">
                <TriangleAlert className="size-3" /> No trade
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
