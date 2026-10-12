"use client"

import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, Cell, XAxis } from "recharts"
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Megaphone,
  MessageSquareText,
  PlayCircle,
  Radio,
  Sparkles,
  TriangleAlert,
  Trophy,
} from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  ANNOUNCEMENT,
  COURSES,
  EVENTS,
  JOURNAL_STATS,
  JOURNAL_WEEK,
  courseProgress,
  nextLesson,
} from "@/lib/data/sample"
import { cn } from "@/lib/utils"

export type WidgetProps = { variant?: string; props: Record<string, string | boolean> }

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

// ---------- Learning

export function ContinueLesson({ variant = "card", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const course = COURSES.find((c) => c.id === props.course) ?? COURSES[0]
  const next = nextLesson(course)
  if (!next) return null
  if (variant === "hero") {
    return (
      <Card className="@container">
        <div className="grid gap-5 px-(--card-spacing) py-[calc(var(--card-spacing)*0.5)] @xl:grid-cols-[1.4fr_1fr] @xl:items-center">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">{String(props.title || "Start here")}</span>
            <h2 className="text-2xl leading-tight @xl:text-3xl">Pick up where you left off</h2>
            <p className="max-w-prose text-muted-foreground">
              {course.title} · {next.module.title}. Next up: <span className="text-foreground">{next.lesson.title}</span>, {next.lesson.minutes} min.
            </p>
            <Progress value={courseProgress(course)} className="max-w-sm" />
            <div>
              <Button size="lg" {...link(`${base}/courses`)}>
                <PlayCircle /> Continue {coach.wording.lesson.toLowerCase()}
              </Button>
            </div>
          </div>
          <div className="relative hidden aspect-video place-items-center overflow-hidden rounded-[min(var(--radius),14px)] bg-muted @xl:grid">
            <PlayCircle className="size-10 text-foreground/60" />
            <span className="absolute bottom-2 left-3 text-xs text-muted-foreground">{next.lesson.minutes}:00</span>
          </div>
        </div>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{String(props.title || coach.wording.courses)}</CardDescription>
        <CardTitle className="text-lg">{next.lesson.title}</CardTitle>
        <CardAction>
          <Badge variant="secondary">{courseProgress(course)}%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="text-sm text-muted-foreground">
          {course.title} · {next.module.title} · {next.lesson.minutes} min
        </div>
        <Progress value={courseProgress(course)} />
        <div>
          <Button {...link(`${base}/courses`)}>
            <PlayCircle /> Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function CourseProgress({ variant = "list" }: WidgetProps) {
  const { coach, base } = useCoach()
  const courses = COURSES
  if (variant === "cards") {
    return (
      <div className="@container flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl">{coach.wording.courses}</h3>
          <Link href={`${base}/courses`} className="text-sm text-primary">See all</Link>
        </div>
        <div className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} size="sm" className={cn(c.locked && "opacity-70")}>
              <div className="mx-(--card-spacing) grid aspect-[16/7] place-items-center rounded-[min(var(--radius),10px)] bg-muted">
                <span className="font-heading text-lg text-muted-foreground">{c.title.split(" ")[0]}</span>
              </div>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.locked ? `Unlock with ${c.locked}` : `${courseProgress(c)}% done`}</CardDescription>
              </CardHeader>
              {!c.locked && (
                <CardContent>
                  <Progress value={courseProgress(c)} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.courses}</CardDescription>
        <CardTitle className="text-lg">Your progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {courses.map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{c.title}</span>
              <span className="text-muted-foreground tabular-nums">{c.locked ? `${c.locked} only` : `${courseProgress(c)}%`}</span>
            </div>
            <Progress value={c.locked ? 0 : courseProgress(c)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ---------- Calendar

export function NextLive({ variant = "card" }: WidgetProps) {
  const { coach, base } = useCoach()
  const live = EVENTS.find((e) => e.kind === "live")!
  if (variant === "banner") {
    return (
      <div className="flex h-full flex-col justify-between gap-6 rounded-(--radius) bg-primary p-[calc(var(--card-spacing,1rem)*1.25)] text-primary-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <Radio className="size-4" /> Next live session
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
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="eyebrow flex items-center gap-1.5">
          <Radio className="size-3.5 text-primary" /> Next live session
        </CardDescription>
        <CardTitle className="text-xl">{live.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-muted-foreground">Today · {live.time} · with {coach.coachName}</p>
        <Button variant="secondary" {...link(`${base}/calendar`)}>
          <CalendarDays /> Add to my calendar
        </Button>
      </CardContent>
    </Card>
  )
}

export function ThisWeek({ props }: WidgetProps) {
  const { coach, base } = useCoach()
  const items = EVENTS.filter((e) => props.news !== false || e.kind !== "news").slice(0, 4)
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.calendar}</CardDescription>
        <CardTitle className="text-lg">This week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {items.map((e) => (
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

export function EconNews() {
  const news = EVENTS.filter((e) => e.kind === "news")
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Economic calendar</CardDescription>
        <CardTitle className="text-lg">News this week</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {news.map((e) => (
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

// ---------- Journal

const pnlConfig = { pnl: { label: "P&L", color: "var(--profit)" } } satisfies ChartConfig

export function JournalPnl({ variant = "chart" }: WidgetProps) {
  const { coach } = useCoach()
  const curve = JOURNAL_WEEK.reduce<{ day: string; v: number }[]>((acc, d) => [...acc, { day: d.day, v: (acc.at(-1)?.v ?? 0) + d.pnl }], [])
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.journal} · this week</CardDescription>
        <CardTitle className={cn("tabular-nums text-profit", variant === "number" ? "text-4xl" : "text-2xl")}>+€{JOURNAL_STATS.pnl}</CardTitle>
        <CardAction className="text-right text-xs text-muted-foreground">
          {JOURNAL_STATS.trades} trades
          <br />
          {JOURNAL_STATS.winRate}% win rate
        </CardAction>
      </CardHeader>
      <CardContent>
        {variant === "number" ? (
          <ChartContainer config={pnlConfig} className="aspect-auto h-12 w-full">
            <AreaChart data={curve} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Area dataKey="v" type="monotone" stroke="var(--profit)" fill="var(--profit)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}

export function RulesFollowed() {
  const { coach } = useCoach()
  const v = JOURNAL_STATS.rulesFollowed
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.journal} · discipline</CardDescription>
        <CardTitle className="text-4xl tabular-nums">{v}%</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <Progress value={v} />
        Rules followed on your last 19 trades. Most missed: stop moved.
      </CardContent>
    </Card>
  )
}

// ---------- Community and progress

export function FirstWeek() {
  const { coach } = useCoach()
  const items = [
    { label: `Watch your first ${coach.wording.lesson.toLowerCase()}`, done: true },
    { label: "Join a live session", done: false },
    ...(coach.modules.community ? [{ label: `Post an intro in ${coach.wording.community}`, done: false }] : []),
    ...(coach.modules.journal ? [{ label: "Connect your broker", done: false }] : []),
  ]
  const done = items.filter((i) => i.done).length
  return (
    <Card className="h-full">
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

export function Announcement({ variant = "highlight" }: WidgetProps) {
  const { coach } = useCoach()
  const hl = variant === "highlight"
  return (
    <Card className={cn("h-full", hl && "bg-highlight text-highlight-foreground")}>
      <CardHeader>
        <CardDescription className={cn("eyebrow flex items-center gap-1.5", hl && "text-highlight-foreground/70")}>
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

export function Discord({ props }: WidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">Community</CardDescription>
        <CardTitle className="text-lg">Join us on Discord</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
        <p>{String(props.text || "Live chat, trade ideas and Q&A with the rest of the group.")}</p>
        <div>
          <Button variant="secondary">
            <MessageSquareText /> Open Discord
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MyRank() {
  const { coach } = useCoach()
  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.ranking} · discipline</CardDescription>
        <CardTitle className="flex items-baseline gap-2 text-4xl tabular-nums">
          #12 <span className="text-sm font-normal text-muted-foreground">of 240</span>
        </CardTitle>
        <CardAction>
          <Trophy className="size-5 text-primary" />
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Up 4 places this week.</CardContent>
    </Card>
  )
}

// ---------- Coach and brand

export function WelcomeVideo({ props }: WidgetProps) {
  const { coach } = useCoach()
  return (
    <Card className="@container">
      <div className="grid gap-5 px-(--card-spacing) @xl:grid-cols-[1fr_1.2fr] @xl:items-center">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[min(var(--radius),14px)] bg-muted">
          <PlayCircle className="size-12 text-foreground/60" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="eyebrow">A message from {coach.coachName}</span>
          <h3 className="text-2xl leading-tight">{String(props.title || "Welcome in. Here's how to get the most out of it.")}</h3>
          <p className="text-muted-foreground">{String(props.text || "Two minutes on how the program works, what to do first, and how to reach me.")}</p>
        </div>
      </div>
    </Card>
  )
}

export function Banner({ variant = "brand", props }: WidgetProps) {
  const { base } = useCoach()
  const styles = {
    brand: "bg-primary text-primary-foreground",
    highlight: "bg-highlight text-highlight-foreground",
    plain: "bg-card text-card-foreground",
  } as const
  return (
    <div
      className={cn("flex flex-wrap items-center justify-between gap-4 rounded-(--radius) p-[calc(var(--card-spacing,1rem)*1.5)]", styles[variant as keyof typeof styles] ?? styles.brand)}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex max-w-prose flex-col gap-1">
        <h3 className="text-2xl leading-tight">{String(props.title || "Inner Circle opens on 1 November")}</h3>
        <p className="opacity-80">{String(props.text || "Small group, weekly 1:1 reviews, and the full playbook.")}</p>
      </div>
      {props.button !== "" && (
        <Button variant={variant === "brand" ? "secondary" : "default"} size="lg" {...link(`${base}/${String(props.target || "courses")}`)}>
          {String(props.button || "Find out more")} <ArrowRight />
        </Button>
      )}
    </div>
  )
}

export function TextBlock({ props }: WidgetProps) {
  return (
    <div className="flex flex-col gap-2 py-1">
      <h3 className="text-2xl leading-tight">{String(props.title || "How this works")}</h3>
      <p className="max-w-prose whitespace-pre-line text-muted-foreground">
        {String(props.text || "Watch one lesson a day, join Monday's live session, and journal every trade. Ask for a review whenever you're unsure.")}
      </p>
    </div>
  )
}

const PARTNERS = [
  { name: "IC Markets", note: "Broker · our partner", tag: "Partner" },
  { name: "FTMO", note: "Prop firm challenge" },
  { name: "TradingView", note: "Charts we use on the lives" },
  { name: "YouTube", note: "Free weekly breakdowns" },
]

export function PartnerLinks() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription className="eyebrow">Tools and partners</CardDescription>
        <CardTitle className="text-lg">What we use</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {PARTNERS.map((p) => (
          <a key={p.name} href="#" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span className="flex-1">
              <span className="block text-sm">{p.name}</span>
              <span className="block text-xs text-muted-foreground">{p.note}</span>
            </span>
            {p.tag && <Badge variant="outline">{p.tag}</Badge>}
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

export function AiAsk() {
  const { coach } = useCoach()
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <Sparkles className="size-6 text-primary" />
      <h3 className="text-2xl leading-tight">Ask {coach.wording.ai} anything</h3>
      <div className="flex w-full max-w-xl items-center gap-2 rounded-[var(--button-radius)] border bg-background p-1.5 pl-4">
        <span className="flex-1 text-left text-sm text-muted-foreground">“Where did the coach explain stop placement?”</span>
        <Button size="sm">Ask</Button>
      </div>
      <p className="text-xs text-muted-foreground">Answers come from {coach.coachName}&apos;s lessons. Not investment advice.</p>
    </div>
  )
}
