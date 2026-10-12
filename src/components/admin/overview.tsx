"use client"

import Link from "next/link"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ArrowRight, Check, CircleDashed, PlayCircle, Radio } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  ADMIN_STUDENTS,
  COURSES,
  EVENTS,
  FEEDBACK_REQUESTS,
  GETTING_STARTED,
  REVENUE_MONTHS,
  courseProgress,
} from "@/lib/data/sample"
import { cn } from "@/lib/utils"

const revenueConfig = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig

/** ADM-01. Answers "what needs me today" before anything else. */
export function AdminOverview() {
  const { coach, base } = useCoach()
  const needsHelp = ADMIN_STUDENTS.filter((s) => s.health !== "green")
  const done = GETTING_STARTED.filter((g) => g.done).length
  const members = coach.tiers.reduce((n, t) => n + t.members, 0)

  const kpis = [
    { label: `Active ${coach.wording.students.toLowerCase()}`, value: members.toLocaleString("en"), note: "+9 this week" },
    { label: "Revenue · October", value: "€17,940", note: "+8.9% vs September" },
    { label: "Open feedback", value: String(FEEDBACK_REQUESTS.length), note: "oldest waits 2 days" },
    { label: "Next live", value: "Today 15:30", note: "NY open · 41 signed up" },
  ]

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Monday, 12 October</p>
          <h1 className="text-2xl font-semibold tracking-tight">Good morning, {coach.coachName}</h1>
        </div>
        <Button>
          <Radio /> Go live
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            {done} of {GETTING_STARTED.length} done. Each step has a 2-minute video if you need it.
          </CardDescription>
          <CardAction className="w-40">
            <Progress value={(done / GETTING_STARTED.length) * 100} />
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {GETTING_STARTED.map((g) => (
            <button
              key={g.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted",
                g.done && "text-muted-foreground",
              )}
            >
              {g.done ? <Check className="size-4 text-primary" /> : <CircleDashed className="size-4" />}
              <span className={cn("flex-1", g.done && "line-through")}>{g.label}</span>
              {!g.done && <PlayCircle className="size-4 text-muted-foreground" />}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} size="sm">
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{k.note}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Needs your help</CardTitle>
            <CardDescription>{needsHelp.length} {coach.wording.students.toLowerCase()}, most urgent first</CardDescription>
            <CardAction>
              <Link href={`${base}/students`} className="inline-flex items-center gap-1 text-sm text-primary">
                All {coach.wording.students.toLowerCase()} <ArrowRight className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {needsHelp.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={cn("size-2 shrink-0 rounded-full", s.health === "red" ? "bg-red-500" : "bg-amber-400")} />
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{s.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {s.reason} · {s.tier}
                  </div>
                </div>
                <Button variant="outline" size="sm">Open</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback requests</CardTitle>
            <CardDescription>Trades waiting for your review, oldest first</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {FEEDBACK_REQUESTS.map((f) => (
              <div key={f.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[0.65rem]">{f.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{f.student}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{f.waiting}</span>
                </div>
                <div className="text-sm">
                  <Badge variant="secondary" className="mr-2 font-mono">{f.trade}</Badge>
                  <span className="text-muted-foreground">“{f.note}”</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Last 6 months, after our fees</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="aspect-auto h-56 w-full">
              <BarChart data={REVENUE_MONTHS} margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>Lives, calls and news</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {EVENTS.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground tabular-nums">
                  {e.day} {e.time}
                </span>
                <span className="flex-1 truncate">{e.title}</span>
                {e.noTrade && <Badge variant="destructive">No trade</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course progress</CardTitle>
          <CardDescription>Average across {coach.wording.students.toLowerCase()} with access</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {COURSES.map((c) => (
            <div key={c.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>{c.title}</span>
                <span className="text-muted-foreground tabular-nums">{courseProgress(c) + 9}%</span>
              </div>
              <Progress value={courseProgress(c) + 9} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
