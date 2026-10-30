"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Area, AreaChart, CartesianGrid, YAxis } from "recharts"
import { ArrowRight, ArrowUpRight, ChevronDown, Download, Radio } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ADMIN_STUDENTS, COURSES, EVENTS, FEEDBACK_REQUESTS, courseProgress } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { DEMO_ADMIN } from "@/lib/data/account"
import { SampleNotice, SetupChecklist } from "./setup-checklist"

/** "Today" in the prototype's sample data. */
const TODAY = new Date(2026, 9, 12)
const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" } as const
type Range = keyof typeof RANGES

/**
 * One number in the metric strip. `daily` is a typical day for the whole
 * community; `sum` adds the days up (sales, answers), otherwise the strip shows
 * the latest day (students, open requests). `money` formats as euros.
 */
type Metric = { id: string; label: string; daily: number; sum?: boolean; money?: boolean; unit?: string; trend: number; href: string }

const VIEWS: { id: string; label: string; metrics: Metric[] }[] = [
  {
    id: "general",
    label: "General",
    metrics: [
      { id: "active", label: "Active students", daily: 182, trend: 0.12, href: "students" },
      { id: "revenue", label: "Revenue", daily: 598, sum: true, money: true, trend: 0.3, href: "sales" },
      { id: "new", label: "New students", daily: 1.6, sum: true, trend: 0.4, href: "students" },
      { id: "feedback", label: "Open feedback", daily: 3, trend: -0.2, href: "journal" },
      { id: "lessons", label: "Lessons finished", daily: 46, sum: true, trend: 0.18, href: "content" },
      { id: "live", label: "Live attendance", daily: 41, unit: "avg", trend: 0.08, href: "calendar" },
    ],
  },
  {
    id: "students",
    label: "Students",
    metrics: [
      { id: "s-active", label: "Active students", daily: 182, trend: 0.12, href: "students" },
      { id: "s-new", label: "New students", daily: 1.6, sum: true, trend: 0.4, href: "students" },
      { id: "s-left", label: "Cancelled", daily: 0.3, sum: true, trend: -0.3, href: "students" },
      { id: "s-risk", label: "At risk", daily: 4, trend: -0.15, href: "students" },
      { id: "s-journal", label: "Journal entries", daily: 74, sum: true, trend: 0.22, href: "journal" },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    metrics: [
      { id: "r-revenue", label: "Revenue", daily: 598, sum: true, money: true, trend: 0.3, href: "sales" },
      { id: "r-sales", label: "New sales", daily: 1.4, sum: true, trend: 0.35, href: "sales" },
      { id: "r-renewals", label: "Renewals", daily: 5.1, sum: true, trend: 0.05, href: "sales" },
      { id: "r-refunds", label: "Refunds", daily: 0.1, sum: true, trend: -0.5, href: "sales" },
      { id: "r-arps", label: "Per student", daily: 98.6, money: true, trend: 0.04, href: "sales" },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    metrics: [
      { id: "e-lessons", label: "Lessons finished", daily: 46, sum: true, trend: 0.18, href: "content" },
      { id: "e-live", label: "Live attendance", daily: 41, unit: "avg", trend: 0.08, href: "calendar" },
      { id: "e-posts", label: "Community posts", daily: 38, sum: true, trend: 0.25, href: "community" },
      { id: "e-ai", label: "AI questions", daily: 112, sum: true, trend: 0.45, href: "ai" },
      { id: "e-answered", label: "Feedback answered", daily: 6, sum: true, trend: 0.1, href: "journal" },
    ],
  },
]

/** A steady, made-up daily series for a metric: same input, same line. */
function series(m: Metric, days: number, share: number) {
  let seed = [...m.id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  return Array.from({ length: days }, (_, i) => {
    const t = i / Math.max(days - 1, 1)
    const day = new Date(TODAY)
    day.setDate(TODAY.getDate() - (days - 1 - i))
    const weekend = day.getDay() === 0 || day.getDay() === 6
    const level = m.daily * share * (1 - m.trend / 2 + m.trend * t) * (weekend && m.sum ? 0.45 : 1)
    // Daily counts swing; levels (students, open requests) drift gently.
    const value = Math.max(0, level * (m.sum ? 0.8 + rnd() * 0.4 : 0.97 + rnd() * 0.06))
    return { date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), value }
  })
}

function format(m: Metric, v: number) {
  const n = m.money || v >= 20 || (!m.sum && !m.unit) ? Math.round(v) : Math.round(v * 10) / 10
  const text = n.toLocaleString("en", { maximumFractionDigits: 1 })
  return m.money ? `€${text}` : text
}

/** A filter chip: its name, then the chosen value with a caret. */
function FilterChip<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-0 px-0" />}>
        <span className="border-r border-white/[0.08] px-2.5 font-normal text-muted-foreground">{name}</span>
        <span className="flex items-center gap-1 px-2.5">
          {options[value]} <ChevronDown className="size-3.5 text-muted-foreground" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {(Object.keys(options) as T[]).map((k) => (
            <DropdownMenuRadioItem key={k} value={k}>
              {options[k]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** ADM-01. Answers "how is it going, and what needs me today". */
export function AdminOverview() {
  const { coach, base } = useCoach()
  const needsHelp = ADMIN_STUDENTS.filter((s) => s.health !== "green")
  const members = coach.tiers.reduce((n, t) => n + t.members, 0)

  const [view, setView] = useState(VIEWS[0].id)
  const [range, setRange] = useState<Range>("30")
  const tiers = Object.fromEntries([["all", "All tiers"], ...coach.tiers.map((t) => [t.id, t.name])]) as Record<string, string>
  const [tier, setTier] = useState("all")
  const share = tier === "all" ? 1 : (coach.tiers.find((t) => t.id === tier)?.members ?? 0) / Math.max(members, 1)
  const metrics = VIEWS.find((v) => v.id === view)!.metrics
  const [picked, setPicked] = useState<Record<string, string>>({})
  const metric = metrics.find((m) => m.id === picked[view]) ?? metrics[0]

  const strip = useMemo(
    () =>
      metrics.map((m) => {
        const data = series(m, Number(range), share)
        const value = m.sum ? data.reduce((n, d) => n + d.value, 0) : m.unit === "avg" ? data.reduce((n, d) => n + d.value, 0) / data.length : data[data.length - 1].value
        return { m, data, value }
      }),
    [metrics, range, share],
  )
  const open = strip.find((s) => s.m.id === metric.id)!
  const config = { value: { label: metric.label, color: "var(--chart-1)" } } satisfies ChartConfig

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex h-9 items-center gap-2.5 rounded-full bg-white/[0.04] px-4 text-sm">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--profit)] opacity-60" />
            <span className="size-2 rounded-full bg-[var(--profit)]" />
          </span>
          Students online: <span className="font-medium tabular-nums">23</span>
        </span>
        <Button>
          <Radio /> Go live
        </Button>
      </div>

      <div className="grid gap-1">
        <p className="text-sm text-muted-foreground">{coach.name} · Monday, 12 October</p>
        <h1 className="text-[2rem] leading-10 font-semibold tracking-[-0.025em]">Good morning, {DEMO_ADMIN.name.split(" ")[0]}</h1>
      </div>

      {/* First, so a coach fresh from setup sees what's left; once it's all done it folds to one line. */}
      <SetupChecklist />

      <div className="flex flex-col gap-4">
        <SampleNotice>The numbers and lists on this page are examples, so you can see how the Overview works. They become yours as students join.</SampleNotice>
        <Tabs value={view} onValueChange={(v) => setView(v as string)}>
          <TabsList className="w-full justify-start">
            {VIEWS.map((v) => (
              <TabsTrigger key={v.id} value={v.id}>
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <FilterChip name="Date range" value={range} options={RANGES} onChange={setRange} />
          <FilterChip name="Tier" value={tier} options={tiers} onChange={setTier} />
        </div>

        <div className="overflow-hidden rounded-xl bg-[var(--adm-surface)]">
          <div className="grid grid-cols-2 gap-1 p-1.5 sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
            {strip.map(({ m, value }) => {
              const on = m.id === metric.id
              return (
                <button
                  key={m.id}
                  onClick={() => setPicked((p) => ({ ...p, [view]: m.id }))}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-[10px] px-4 py-3.5 text-left transition-colors",
                    on ? "bg-[var(--adm-raised)]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <span className={cn("text-sm", on ? "text-foreground" : "text-muted-foreground")}>{m.label}</span>
                  <span className={cn("text-[1.375rem] leading-7 tabular-nums", on ? "text-foreground" : "text-[#a8a8b1]")}>
                    {format(m, value)}
                    {m.unit && <span className="ml-1 text-sm text-muted-foreground">{m.unit}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="px-5 pt-6 pb-5">
            <ChartContainer config={config} className="aspect-auto h-72 w-full">
              <AreaChart data={open.data} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="ov-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => format(metric, v)} />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)" }}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v, _n, item) => (
                        <span className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">{item.payload?.date}</span>
                          <span className="font-medium text-foreground tabular-nums">{format(metric, Number(v))}</span>
                        </span>
                      )}
                    />
                  }
                />
                <Area dataKey="value" type="monotoneX" stroke="var(--color-value)" strokeWidth={1.75} fill="url(#ov-fill)" />
              </AreaChart>
            </ChartContainer>
            <div className="mt-1 flex justify-between pl-11 text-xs text-muted-foreground tabular-nums">
              <span>{open.data[0].date}</span>
              <span>{open.data[open.data.length - 1].date}</span>
            </div>
            <div className="mt-5 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Download as CSV"
                onClick={() => toast(`${metric.label} · ${RANGES[range].toLowerCase()}`, { description: "Downloads as a CSV in the real product." })}
              >
                <Download />
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href={`${base}/${metric.href}`} />}>
                Open {metric.href === "journal" ? "Journal & feedback" : metric.href} <ArrowUpRight />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Needs your help</CardTitle>
            <CardDescription>{needsHelp.length} students, most urgent first</CardDescription>
            <CardAction>
              <Link href={`${base}/students`} className="inline-flex items-center gap-1 text-sm text-primary">
                All students <ArrowRight className="size-4" />
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

      <div className="grid gap-4 lg:grid-cols-2">
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
        <Card>
          <CardHeader>
            <CardTitle>Course progress</CardTitle>
            <CardDescription>Average across students with access</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
    </div>
  )
}
