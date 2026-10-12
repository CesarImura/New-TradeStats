"use client"

import Link from "next/link"
import { Bar, BarChart, Cell, XAxis } from "recharts"
import {
  ArrowRight,
  CalendarDays,
  Check,
  Megaphone,
  MessageSquareText,
  PlayCircle,
  Radio,
  TriangleAlert,
  Trophy,
} from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import type { WidgetId } from "@/lib/data/coaches"
import {
  ANNOUNCEMENT,
  COURSES,
  DEMO_STUDENT,
  EVENTS,
  JOURNAL_STATS,
  JOURNAL_WEEK,
  courseProgress,
  nextLesson,
} from "@/lib/data/sample"
import { cn } from "@/lib/utils"

/** STU-01. Built from the widgets the coach picked for this tier. */
export function StudentHome() {
  const { coach } = useCoach()
  const widgets = coach.homeWidgets.filter((w) => {
    if (w === "journal-week") return coach.modules.journal
    if (w === "rank") return coach.modules.ranking
    if (w === "next-event" || w === "econ") return coach.modules.calendar
    return true
  })
  const [hero, ...rest] = widgets

  return (
    <div className="flex flex-col page-gap">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Monday, 12 October</span>
        <h1 className="text-3xl leading-tight md:text-4xl">Good morning, {DEMO_STUDENT.first}</h1>
      </div>
      {hero && <Widget id={hero} />}
      <div className="grid grid-cols-1 page-gap md:grid-cols-2 xl:grid-cols-3">
        {rest.map((w) => (
          <Widget key={w} id={w} />
        ))}
      </div>
    </div>
  )
}

function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case "start-here":
      return <StartHere />
    case "first-week":
      return <FirstWeek />
    case "next-lesson":
      return <NextLesson />
    case "journal-week":
      return <JournalWeek />
    case "next-event":
      return <NextEvent />
    case "announcement":
      return <Announcement />
    case "econ":
      return <Econ />
    case "rank":
      return <Rank />
  }
}

function StartHere() {
  const { coach, base } = useCoach()
  const course = COURSES[0]
  const next = nextLesson(course)!
  const live = EVENTS.find((e) => e.kind === "live")!
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4 p-(--card-spacing) md:p-[calc(var(--card-spacing)*1.5)]">
          <span className="eyebrow">Start here</span>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl leading-tight md:text-3xl">Pick up where you left off</h2>
            <p className="max-w-prose text-muted-foreground">
              {course.title} · {next.module.title}. Next up: <span className="text-foreground">{next.lesson.title}</span>, {next.lesson.minutes} min.
            </p>
          </div>
          <Progress value={courseProgress(course)} className="max-w-sm" />
          <div className="flex flex-wrap gap-2">
            <Button size="lg" nativeButton={false} render={<Link href={`${base}/courses`} />}>
              <PlayCircle /> Continue {coach.wording.lesson.toLowerCase()}
            </Button>
            {coach.modules.community && (
              <Button size="lg" variant="outline">
                <MessageSquareText /> Introduce yourself
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t bg-muted/50 p-(--card-spacing) md:border-t-0 md:border-l md:p-[calc(var(--card-spacing)*1.5)]">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-primary" />
            <span className="eyebrow">Next live session</span>
          </div>
          <div>
            <div className="font-heading text-xl">{live.title}</div>
            <div className="text-muted-foreground">
              Today · {live.time} · with {coach.coachName}
            </div>
          </div>
          <Button variant="secondary" nativeButton={false} render={<Link href={`${base}/calendar`} />}>
            <CalendarDays /> Add to my calendar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function FirstWeek() {
  const { coach } = useCoach()
  const items = [
    { label: `Watch your first ${coach.wording.lesson.toLowerCase()}`, done: true },
    { label: "Join a live session", done: false },
    { label: `Post an intro in ${coach.wording.community}`, done: false },
    ...(coach.modules.journal ? [{ label: "Connect your broker", done: false }] : []),
  ]
  const done = items.filter((i) => i.done).length
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
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border",
                i.done && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {i.done && <Check className="size-3" />}
            </span>
            <span className={cn(i.done && "text-muted-foreground line-through")}>{i.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function NextLesson() {
  const { coach, base } = useCoach()
  const course = COURSES[1]
  const n = nextLesson(course)!
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.courses}</CardDescription>
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{courseProgress(course)}%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-sm text-muted-foreground">
          Next: <span className="text-foreground">{n.lesson.title}</span> · {n.lesson.minutes} min
        </div>
        <Progress value={8} />
        <Link href={`${base}/courses`} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open course <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  )
}

const pnlConfig = { pnl: { label: "P&L", color: "var(--profit)" } } satisfies ChartConfig

function JournalWeek() {
  const { coach } = useCoach()
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.journal} · this week</CardDescription>
        <CardTitle className="text-2xl tabular-nums text-profit">+€{JOURNAL_STATS.pnl}</CardTitle>
        <CardAction className="text-right text-xs text-muted-foreground">
          {JOURNAL_STATS.trades} trades
          <br />
          {JOURNAL_STATS.winRate}% win rate
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ChartContainer config={pnlConfig} className="aspect-auto h-24 w-full">
          <BarChart data={JOURNAL_WEEK} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
            <Bar dataKey="pnl" radius={[3, 3, 3, 3]}>
              {JOURNAL_WEEK.map((d) => (
                <Cell key={d.day} fill={d.pnl >= 0 ? "var(--profit)" : "var(--loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rules followed</span>
          <span className="tabular-nums">{JOURNAL_STATS.rulesFollowed}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

function NextEvent() {
  const { coach, base } = useCoach()
  const upcoming = EVENTS.filter((e) => e.kind !== "news").slice(1, 4)
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.calendar}</CardDescription>
        <CardTitle className="text-lg">Coming up</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {upcoming.map((e) => (
          <Link key={e.id} href={`${base}/calendar`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="grid w-11 shrink-0 text-center leading-tight">
              <span className="eyebrow">{e.day}</span>
              <span className="text-sm tabular-nums">{e.time}</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm">{e.title}</span>
              {e.seats && <span className="block text-xs text-muted-foreground">{e.seats}</span>}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

function Announcement() {
  const { coach } = useCoach()
  return (
    <Card className="bg-highlight text-highlight-foreground">
      <CardHeader>
        <CardDescription className="eyebrow flex items-center gap-1.5 text-highlight-foreground/70">
          <Megaphone className="size-3.5" /> From {coach.coachName}
        </CardDescription>
        <CardTitle className="text-lg">{ANNOUNCEMENT.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p>{ANNOUNCEMENT.body}</p>
        <span className="text-xs opacity-70">{ANNOUNCEMENT.when}</span>
      </CardContent>
    </Card>
  )
}

function Econ() {
  const news = EVENTS.filter((e) => e.kind === "news")
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Economic calendar</CardDescription>
        <CardTitle className="text-lg">This week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {news.map((e) => (
          <div key={e.id} className="flex items-center gap-3 text-sm">
            <span className="w-16 shrink-0 text-muted-foreground tabular-nums">
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

function Rank() {
  const { coach } = useCoach()
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.ranking} · discipline</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-3xl tabular-nums">
          #12 <span className="text-sm font-normal text-muted-foreground">of 240</span>
        </CardTitle>
        <CardAction>
          <Trophy className="size-5 text-primary" />
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Up 4 places since last week. 3 more rule-clean days to reach the top 10.</CardContent>
    </Card>
  )
}
