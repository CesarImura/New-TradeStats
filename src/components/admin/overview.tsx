"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Bar, CartesianGrid, Cell, ComposedChart, Line, YAxis } from "recharts"
import { ArrowRight, CalendarDays, ChevronDown, Video } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton as Button, AdminPageHeader, AdminTabs, Metric as MetricCard, Panel, PanelHeader, Tag } from "@/components/admin/ui"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ADMIN_STUDENTS, COURSES, EVENTS, FEEDBACK_REQUESTS, courseProgress } from "@/lib/data/sample"
import { cn } from "@/lib/utils"

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
      { id: "revenue", label: "Revenue", daily: 598, sum: true, money: true, trend: 0.3, href: "sales" },
      { id: "active", label: "Active students", daily: 182, trend: 0.12, href: "students" },
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
      <DropdownMenuTrigger render={<Button hierarchy="secondary" size="md" className="gap-0 px-0" aria-label={name ? `${name}: ${options[value]}` : options[value]} />}>
        {name && <span className="border-r border-a-border px-2.5 text-a-text-2">{name}</span>}
        <span className="flex items-center gap-1 px-2.5">
          {!name && <CalendarDays className="size-3.5 text-a-text-2" />}{options[value]} <ChevronDown className="size-3.5 text-a-text-2" />
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

/** "In 6 h 30 min", "in 2 days": how far away the next live is. */
function inText(min: number) {
  if (min < 60) return `${min} min`
  if (min < 2880) return `${Math.floor(min / 60)} h ${min % 60 ? `${min % 60} min` : ""}`.trim()
  return `${Math.round(min / 1440)} days`
}

/** The next live, on the highlight surface: the one warm block on the page. */
function NextLiveBanner({ base }: { base: string }) {
  const next = EVENTS.find((e) => e.kind === "live")
  if (!next) return null
  const stats = [
    { value: next.time, label: next.day === "Mon" ? "Today" : next.day },
    { value: next.seats?.split(" ")[0] ?? "0", label: "Expected" },
    { value: "38", label: "Last live" },
  ]
  return (
    <section aria-label="Next live" className="flex flex-col gap-6 rounded-a-lg bg-gradient-to-br from-[var(--admin-color-highlight-base)] to-[var(--admin-color-highlight-strong)] p-5 text-a-on-highlight md:flex-row md:items-stretch md:justify-between md:p-6">
      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="t-mono-label opacity-70">Next live · in {inText(next.inMinutes ?? 0)}</span>
          <h2 className="t-title md:t-display [overflow-wrap:anywhere]">{next.title}</h2>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          {stats.map((st) => (
            <div key={st.label} className="flex flex-col gap-0.5">
              <dd className="t-data-m tabular-nums">{st.value}</dd>
              <dt className="t-body-m opacity-70">{st.label}</dt>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex w-full shrink-0 flex-col justify-between gap-4 rounded-a-md bg-a-page p-4 text-a-text md:w-72">
        <div className="flex flex-col gap-1">
          <span className="t-mono-label-s text-a-text-3">Studio</span>
          <span className="t-body-m text-a-text-2">Camera, screen and chat are ready. {next.seats?.split(" ")[0] ?? "0"} students said they will join.</span>
        </div>
        <div className="flex gap-2">
          <Button hierarchy="highlight" size="md" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
            Open studio
          </Button>
          <Button hierarchy="secondary" size="md" onClick={() => toast("Reminder sent", { description: "Signed-up students get a nudge." })}>
            Remind
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Per-lesson drop-off for a course: share of students still there at each lesson. Steady made-up numbers. */
function dropoff(courseId: string, lessons: number) {
  let seed = [...courseId].reduce((n, c) => n * 31 + c.charCodeAt(0), 11) >>> 0
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
  let left = 100
  return Array.from({ length: lessons }, () => {
    left = Math.max(30, left - rnd() * 9)
    return Math.round(left)
  })
}

/** ADM-01. Answers "how is it going, and what needs me today". Figma: Admin · 02 Overview 01. */
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
  const [lower, setLower] = useState<"courses" | "questions">("courses")

  // First metric of a view is the bars, the second one the line.
  const [barM, lineM] = metrics
  const data = useMemo(() => {
    const bars = series(barM, Number(range), share)
    const line = series(lineM, Number(range), share)
    return bars.map((d, i) => ({ date: d.date, bar: d.value, line: line[i].value }))
  }, [barM, lineM, range, share])
  const config = {
    bar: { label: barM.label, color: "var(--admin-color-bg-track)" },
    line: { label: lineM.label, color: "var(--admin-color-accent-strong)" },
  } satisfies ChartConfig
  const [hover, setHover] = useState<number | null>(null)
  const activeBar = hover ?? data.length - 1
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => data[Math.round(t * (data.length - 1))].date.replace(/ \d{4}$/, ""))

  const headline = [
    { label: "Active students", value: "194", delta: "+6.2% vs last 30 days", tone: "success" as const, href: "students" },
    { label: "Revenue", value: "€37,180", delta: "+6.2% · €2,180 more", tone: "success" as const, href: "sales" },
    { label: "New students", value: "40", delta: "−4 vs last 30 days", tone: "danger" as const, href: "students" },
    { label: "Rules followed", value: "84%", delta: "+3 pp · 312 journal entries", tone: "success" as const, href: "journal" },
  ]
  const urgent = [
    ...needsHelp.map((s) => ({ id: s.id, name: s.name, initials: s.initials, tone: s.health === "red" ? "danger" : "warning", reason: s.reason ?? "", action: s.health === "red" ? "Message" : "Nudge", href: "students" })),
    ...FEEDBACK_REQUESTS.map((f) => ({ id: f.id, name: f.student, initials: f.initials, tone: "warning", reason: `Asked for feedback · ${f.waiting}`, action: "Review", href: "journal" })),
  ]

  return (
    <div className="flex w-full flex-col gap-8">
      <NextLiveBanner base={base} />

      <AdminPageHeader
        title="Overview"
        subtitle={`${coach.name} · last 30 days · updated 2 min ago`}
        actions={
          <>
            <span className="inline-flex h-9 items-center gap-2 rounded-a-md border border-a-border px-3 t-body-m">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-a-success-fill opacity-60 motion-reduce:animate-none" />
                <span className="size-2 rounded-full bg-a-success-fill" />
              </span>
              <span className="t-body-m-medium tabular-nums">23</span> Online
            </span>
            <div className="inline-flex">
              <Button size="lg" className="rounded-r-none" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
                <Video /> Go live
              </Button>
              <Button size="lg" iconOnly aria-label="Live options" className="rounded-l-none border-l border-white/20" nativeButton={false} render={<Link href={`${base}/calendar`} />}>
                <ArrowRight />
              </Button>
            </div>
          </>
        }
      />

      <Panel className="gap-0 p-0">
        <div className="grid grid-cols-2 divide-a-border lg:grid-cols-4 lg:divide-x">
          {headline.map((h, i) => (
            <Link key={h.label} href={`${base}/${h.href}`} className={cn("outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset", i < 2 && "max-lg:border-b max-lg:border-a-border", i % 2 === 0 && "max-lg:border-r max-lg:border-a-border", i === 0 && "rounded-tl-a-lg", i === 1 && "max-lg:rounded-tr-a-lg", i === 2 && "max-lg:rounded-bl-a-lg lg:rounded-none", i === 3 && "rounded-br-a-lg max-lg:rounded-br-a-lg lg:rounded-r-a-lg")}>
              <MetricCard label={h.label} value={h.value} delta={h.delta} tone={h.tone} />
            </Link>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminTabs label="Overview view" tabs={VIEWS.map((v) => ({ id: v.id, label: v.label }))} value={view} onChange={setView} />
          <div className="flex flex-wrap items-center gap-2">
            <ul className="mr-2 flex items-center gap-4 t-caption text-a-text-2">
              <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-a-track" />{barM.label}</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-a-accent-strong" />{lineM.label}</li>
            </ul>
            <FilterChip name="Tier" value={tier} options={tiers} onChange={setTier} />
            <FilterChip name="" value={range} options={RANGES} onChange={setRange} />
          </div>
        </div>

        <div className="rounded-a-md bg-a-sunk p-3 md:p-4">
          <ChartContainer config={config} className="aspect-auto h-64 w-full md:h-72">
            <ComposedChart data={data} margin={{ left: 0, right: 0, top: 8 }} onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
              <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" strokeDasharray="2 4" />
              <YAxis yAxisId="bar" hide domain={[0, "auto"]} />
              <YAxis yAxisId="line" hide domain={["auto", "auto"]} />
              <ChartTooltip cursor={false} content={<OverviewTooltip bar={barM} line={lineM} />} />
              <Bar yAxisId="bar" dataKey="bar" radius={[3, 3, 0, 0]} barSize={12} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={d.date} fill={i === activeBar ? "var(--admin-color-accent-strong)" : "var(--admin-color-bg-track)"} style={i === activeBar ? { filter: "drop-shadow(0 0 8px var(--admin-color-accent-strong))" } : undefined} />
                ))}
              </Bar>
              <Line yAxisId="line" dataKey="line" type="monotoneX" stroke="var(--admin-color-accent-strong)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ChartContainer>
          <div className="mt-1 flex justify-between t-caption text-a-text-3 tabular-nums">
            {ticks.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Content"
          description="Where students finish, and where they drop off"
          actions={<AdminTabs label="Content view" tabs={[{ id: "courses", label: "Courses" }, { id: "questions", label: "Questions" }]} value={lower} onChange={setLower} />}
        />
        {lower === "courses" ? (
          COURSES.length === 0 ? (
            <EmptyLine>No courses yet. Add your first one in Content.</EmptyLine>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {COURSES.slice(0, 3).map((c) => {
                const lessons = c.modules.flatMap((m) => m.lessons)
                const pct = Math.min(100, courseProgress(c) + 9)
                const bars = dropoff(c.id, Math.max(lessons.length, 4))
                let worst = 1
                for (let i = 2; i < bars.length; i++) if (bars[i - 1] - bars[i] > bars[worst - 1] - bars[worst]) worst = i
                const drop = Math.round(bars[worst - 1] - bars[worst])
                const risky = drop >= 8
                return (
                  <Link key={c.id} href={`${base}/content`} className="flex min-w-0 flex-col gap-4 rounded-a-md border border-a-border-subtle bg-a-raised p-4 outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus">
                    <div className="flex items-start justify-between gap-2">
                      <span className="t-body-l-medium truncate">{c.title}</span>
                      <Tag tone={risky ? "danger" : "success"}>{risky ? "At risk" : "Healthy"}</Tag>
                    </div>
                    <dl className="grid grid-cols-3 gap-2">
                      {[
                        [`${pct}%`, "Completed"],
                        ["194", "Students"],
                        [String(lessons.length), "Lessons"],
                      ].map(([v, l]) => (
                        <div key={l} className="flex flex-col gap-0.5">
                          <dd className="t-data-m tabular-nums">{v}</dd>
                          <dt className="t-caption text-a-text-2">{l}</dt>
                        </div>
                      ))}
                    </dl>
                    <div role="img" aria-label={`${c.title} drop-off per lesson`} className="flex h-16 items-end gap-1">
                      {bars.map((v, i) => (
                        <span key={i} className={cn("flex-1 rounded-t-[2px]", i === worst && risky ? "bg-a-danger-fill" : "bg-a-track")} style={{ height: `${v}%` }} />
                      ))}
                    </div>
                    <span className={cn("t-caption", risky ? "text-a-danger" : "text-a-success")}>{risky ? `−${drop}% at lesson ${worst + 1}` : "No drop-off"}</span>
                  </Link>
                )
              })}
            </div>
          )
        ) : (
          <EmptyLine>No open questions in your courses right now.</EmptyLine>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Needs you today"
          description={`${urgent.length} things, most urgent first`}
          actions={
            <Link href={`${base}/students`} className="inline-flex items-center gap-1 t-body-m text-a-text-accent hover:underline">
              See all <ArrowRight className="size-4" />
            </Link>
          }
        />
        {urgent.length === 0 ? (
          <EmptyLine>All clear. Nothing needs you right now.</EmptyLine>
        ) : (
          <ul className="flex flex-col divide-y divide-a-border-subtle">
            {urgent.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-xs">{u.initials}</AvatarFallback>
                </Avatar>
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", u.tone === "danger" ? "bg-a-danger-fill" : "bg-a-warning-fill")} />
                <span className="sr-only">{u.tone === "danger" ? "Urgent" : "Warning"}</span>
                <span className="t-body-m-medium w-36 shrink-0 truncate">{u.name}</span>
                <span className="t-body-m min-w-0 flex-1 truncate text-a-text-2">{u.reason}</span>
                <Button hierarchy="secondary" size="sm" nativeButton={false} render={<Link href={`${base}/${u.href}`} />}>{u.action}</Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-a-md border border-dashed border-a-border-strong px-4 py-8 text-center t-body-m text-a-text-2">{children}</p>
}

function OverviewTooltip({ bar, line, ...props }: { bar: Metric; line: Metric } & React.ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      hideLabel
      formatter={(v, name, item) => (
        <span className="flex w-full items-center justify-between gap-4">
          <span className="text-a-text-2">{name === "bar" ? bar.label : line.label}{name === "bar" ? <span className="sr-only"> ({item.payload?.date})</span> : null}</span>
          <span className="t-body-m-medium text-a-text tabular-nums">{format(name === "bar" ? bar : line, Number(v))}</span>
        </span>
      )}
    />
  )
}
