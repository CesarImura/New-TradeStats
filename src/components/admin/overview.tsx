"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Bar, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { ArrowRight, CalendarDays, Video } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton, AdminFilter, AdminPageHeader, AdminTabs, EmptyState, Metric as MetricCard, Panel, Tag } from "@/components/admin/ui"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { COURSES, EVENTS } from "@/lib/data/sample"
import { FirstWeekOverview, useFirstWeek } from "@/components/admin/overview-first-week"
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
    const level = m.daily * share * (1 - m.trend / 2 + m.trend * t) * (weekend && m.sum ? 0.8 : 1)
    // Daily counts swing; levels (students, open requests) drift gently.
    const value = Math.max(0, level * (m.sum ? 0.92 + rnd() * 0.16 : 0.98 + rnd() * 0.04))
    return {
      date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      label: day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).replace(",", "").toUpperCase(),
      value,
    }
  })
}

/** The chart shows at most 14 bars: longer ranges fold into buckets (sums add up, levels keep the last day). */
const BUCKETS = 14
function bucketed(m: Metric, days: number, share: number) {
  const raw = series(m, days, share)
  const n = Math.min(BUCKETS, days)
  const out = Array.from({ length: n }, () => ({ value: 0, label: "" }))
  raw.forEach((d, i) => {
    const b = out[Math.floor((i * n) / days)]
    b.value = m.sum ? b.value + d.value : d.value
    b.label = d.label
  })
  return { buckets: out, ticks: [0, 0.25, 0.5, 0.75, 1].map((t) => raw[Math.round(t * (days - 1))].date) }
}

function format(m: Metric, v: number) {
  if (m.money && v >= 1000) return `€${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
  const n = m.money || v >= 20 || (!m.sum && !m.unit) ? Math.round(v) : Math.round(v * 10) / 10
  const text = n.toLocaleString("en", { maximumFractionDigits: 1 })
  return m.money ? `€${text}` : text
}

/** "2h 14m", "2 days": how far away the next live is. */
function inText(min: number) {
  if (min < 60) return `${min}m`
  if (min < 2880) return `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`
  return `${Math.round(min / 1440)} days`
}

/** Banner surface (Figma 524:7278 "Grain"): three soft glows on a warm base, with a fine grain on top. */
const BANNER_BG = [
  "radial-gradient(ellipse 60% 120% at 82% 30%, rgb(255 106 31) 0%, rgb(255 106 31 / 0.55) 31%, transparent 62%)",
  "radial-gradient(ellipse 70% 140% at 35% 120%, rgb(255 138 76) 0%, rgb(255 138 76 / 0.55) 30%, transparent 60%)",
  "radial-gradient(ellipse 50% 90% at 10% 10%, rgb(253 233 220) 0%, rgb(253 233 220 / 0.55) 35%, transparent 70%)",
  "linear-gradient(var(--admin-color-highlight-base), var(--admin-color-highlight-base))",
].join(", ")
const BANNER_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/** The next live, on the highlight surface: the one warm block on the page. Sample copy from Figma 524:7277. */
function NextLiveBanner({ base }: { base: string }) {
  const next = EVENTS.find((e) => e.kind === "live")
  if (!next) return null
  const expected = next.seats?.split(" ")[0] ?? "0"
  const stats = [
    { value: next.time, label: next.day === "Mon" ? "Today" : next.day },
    { value: expected, label: "Expected" },
    { value: "38", label: "Last live" },
  ]
  return (
    <section aria-label="Next live" className="relative isolate flex flex-col gap-6 overflow-hidden rounded-a-lg px-5 py-5 text-a-on-highlight shadow-[0_0_28px_rgb(255_106_31/0.2)] md:min-h-48 md:flex-row md:items-end md:justify-between md:px-7" style={{ backgroundImage: BANNER_BG }}>
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] mix-blend-multiply" style={{ backgroundImage: BANNER_GRAIN }} />
      <div className="flex min-w-0 flex-col justify-between gap-6 self-stretch">
        <div className="flex flex-col gap-2.5">
          <span className="t-mono-data flex items-center gap-2 uppercase">
            <span aria-hidden className="size-[5px] rounded-full bg-a-on-highlight" />
            Next live - in {inText(134)}
          </span>
          <h2 className="t-title md:t-display [overflow-wrap:anywhere]">NY open, live trading</h2>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          {stats.map((st) => (
            <div key={st.label} className="flex flex-col gap-0.5">
              <dd className="t-data-m tabular-nums">{st.value}</dd>
              <dt className="t-body-m">{st.label}</dt>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 rounded-a-10 bg-a-page px-4 py-3.5 text-a-text md:w-[250px]">
        <span className="t-mono-data uppercase text-a-text-2">Studio</span>
        <span className="t-body-m text-a-text-nav">Camera, screen and chat are ready. {expected} students said they will join.</span>
        <div className="flex gap-2">
          <AdminButton hierarchy="highlight" size="xl" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
            Open studio
          </AdminButton>
          <AdminButton hierarchy="secondary" size="xl" onClick={() => toast("Reminder sent", { description: "Signed-up students get a nudge." })}>
            Remind
          </AdminButton>
        </div>
      </div>
    </section>
  )
}

/**
 * Lesson-by-lesson completion per course, as in Figma 524:8745. `bars` are heights (% of the tallest);
 * `drop` is the lesson index where students fall off, with the label drawn above it.
 */
const COURSE_SUMMARY = [
  { completed: "59%", students: 142, bars: [97, 93, 87, 57, 53, 50, 48, 45, 42, 41, 36], drop: 3, dropLabel: "−31%" },
  { completed: "9%", students: 38, bars: [100, 63, 37, 21], drop: 1, dropLabel: "Drop-off" },
  { completed: "64%", students: 21, bars: [83, 74, 60], drop: -1, dropLabel: "" },
]

/** Figma 524:8846. Sample items; the dot colour is the urgency. */
const NEEDS = [
  { id: "n1", name: "Alex Moreau", initials: "AM", reason: "Payment failed", tone: "danger", action: "Message", href: "students" },
  { id: "n2", name: "Mia Sørensen", initials: "MS", reason: "Broke loss limit twice", tone: "danger", action: "Review", href: "journal" },
  { id: "n3", name: "Lena Ito", initials: "LI", reason: "Stuck in Module 2", tone: "warning", action: "Nudge", href: "students" },
  { id: "n4", name: "Open feedback", initials: "KO", reason: "3 journal entries waiting", tone: "warning", action: "Open", href: "journal" },
] as const

type BarShapeProps = { x?: number; y?: number; width?: number; height?: number }

/** `barCategoryGap` on the chart, as a share of the slot, on each side of the bar. */
const BAR_GAP = 0.24

/**
 * One bar, with all of its hover states in CSS (no React state, so moving across bars never re-renders the page):
 * three fills that cross-fade (a muted orange at rest, grey for the others while one is hovered, the gradient with
 * glow for the hovered one) plus a column behind it. The column is as wide as the slot, so the whole slot is the hover area (1.5px wider, so no seam between slots).
 * The state rules live on the chart wrapper in `AdminOverview`.
 */
function ChartBar({ x = 0, y = 0, width = 0, height = 0 }: BarShapeProps) {
  const r = Math.min(2, width / 2)
  const slot = width / (1 - 2 * BAR_GAP)
  const d = `M${x},${y + height}V${y + r}a${r},${r} 0 0 1 ${r},${-r}H${x + width - r}a${r},${r} 0 0 1 ${r},${r}V${y + height}Z`
  return (
    <g className="ov-bar">
      <rect className="ov-layer ov-col" x={x - (slot - width) / 2 - 0.75} y={0} width={slot + 1.5} height="100%" fill="var(--admin-color-bg-raised)" opacity={0} />
      <path className="ov-layer ov-rest" d={d} fill="var(--admin-primitive-orange-800)" />
      <path className="ov-layer ov-grey" d={d} fill="var(--admin-color-bg-track)" opacity={0} />
      <path className="ov-layer ov-active" d={d} fill="url(#overview-bar-active)" opacity={0} style={{ filter: "drop-shadow(0 0 12px rgb(255 85 0 / 0.45))" }} />
    </g>
  )
}

/** ADM-01. The everyday Overview, or the first-week one for a community with no students yet. */
export function AdminOverview() {
  const firstWeek = useFirstWeek()
  return firstWeek ? <FirstWeekOverview demo={firstWeek === "demo"} /> : <RunningOverview />
}

function RunningOverview() {
  const { coach, base } = useCoach()
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
  const { data, ticks } = useMemo(() => {
    const bars = bucketed(barM, Number(range), share)
    const line = bucketed(lineM, Number(range), share)
    return { ticks: bars.ticks, data: bars.buckets.map((d, i) => ({ i, label: d.label, bar: d.value, line: line.buckets[i].value })) }
  }, [barM, lineM, range, share])
  const config = {
    bar: { label: barM.label, color: "var(--admin-color-bg-track)" },
    line: { label: lineM.label, color: "var(--admin-color-accent-strong)" },
  } satisfies ChartConfig
  const headline = [
    { label: "Active students", value: "194", delta: "+6.2% vs last 30 days", tone: "success" as const, href: "students" },
    { label: "Revenue", value: "€37,180", delta: "+6.2% · €2,180 more", tone: "success" as const, href: "sales" },
    { label: "New students", value: "40", delta: "−4 vs last 30 days", tone: "danger" as const, href: "students" },
    { label: "Rules followed", value: "84%", delta: "+3 pp · 312 journal entries", tone: "success" as const, href: "journal" },
  ]
  const courses = COURSES.slice(0, 3)

  return (
    <div className="flex w-full flex-col gap-4">
      <NextLiveBanner base={base} />

      <AdminPageHeader
        className="pt-6"
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
              <AdminButton size="xl" className="rounded-r-none" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
                <Video /> Go live
              </AdminButton>
              <AdminButton size="xl" iconOnly aria-label="Live options" className="rounded-l-none border-l border-white/20" nativeButton={false} render={<Link href={`${base}/calendar`} />}>
                <ArrowRight />
              </AdminButton>
            </div>
          </>
        }
      />

      {/* Figma 524:7492 keeps 24px of air under the metrics before the chart. */}
      <Panel className="mb-6 gap-0 p-0">
        <div className="grid grid-cols-2 divide-a-border lg:grid-cols-4 lg:divide-x">
          {headline.map((h, i) => (
            <Link key={h.label} href={`${base}/${h.href}`} className={cn("outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset", i < 2 && "max-lg:border-b max-lg:border-a-border", i % 2 === 0 && "max-lg:border-r max-lg:border-a-border", i === 0 && "rounded-tl-a-lg", i === 1 && "max-lg:rounded-tr-a-lg", i === 2 && "max-lg:rounded-bl-a-lg lg:rounded-none", i === 3 && "rounded-br-a-lg max-lg:rounded-br-a-lg lg:rounded-r-a-lg")}>
              <MetricCard label={h.label} value={h.value} delta={h.delta} tone={h.tone} />
            </Link>
          ))}
        </div>
      </Panel>

      <Panel className="py-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminTabs label="Overview view" tabs={VIEWS.map((v) => ({ id: v.id, label: v.label }))} value={view} onChange={setView} />
          <div className="flex flex-wrap items-center gap-2">
            <ul className="mr-2 flex items-center gap-4 t-body-m text-a-text-2">
              <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px] bg-a-accent-strong" />{barM.label}</li>
              <li className="flex items-center gap-1.5"><span aria-hidden className="h-[3px] w-3.5 rounded-full bg-a-text" />{lineM.label}</li>
            </ul>
            <AdminFilter label="Tier" value={tier} onValueChange={setTier} options={Object.entries(tiers).map(([value, label]) => ({ value, label }))} />
            <AdminFilter ariaLabel="Period" icon={<CalendarDays />} value={range} onValueChange={(v) => setRange(v as Range)} options={Object.entries(RANGES).map(([value, label]) => ({ value, label }))} />
          </div>
        </div>

        <div>
          <div className="relative h-56 border-y border-a-border-subtle md:h-[238px] [&_.recharts-line]:pointer-events-none [&_.recharts-active-dot]:pointer-events-none [&_.ov-layer]:transition-opacity [&_.ov-layer]:duration-[400ms] [&_.ov-layer]:ease-[ease] motion-reduce:[&_.ov-layer]:transition-none [&:has(.ov-bar:hover)_.ov-rest]:!opacity-0 [&:has(.ov-bar:hover)_.ov-bar:not(:hover)_.ov-grey]:!opacity-100 [&_.ov-bar:hover_.ov-active]:!opacity-100 [&_.ov-bar:hover_.ov-col]:!opacity-100" style={{ backgroundImage: "radial-gradient(circle, var(--admin-color-chart-grid) 0.75px, transparent 1px)", backgroundSize: "16px 16px" }}>
            <ChartContainer config={config} className="aspect-auto h-full w-full [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible">
              <ComposedChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }} barCategoryGap="24%">
                <defs>
                  <linearGradient id="overview-bar-active" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8529" />
                    <stop offset="100%" stopColor="#FF5500" />
                  </linearGradient>
                </defs>
                <XAxis xAxisId="bar" dataKey="i" hide />
                <XAxis xAxisId="line" dataKey="i" type="number" domain={[0, Math.max(data.length - 1, 1)]} hide />
                <YAxis yAxisId="bar" hide domain={[0, "auto"]} />
                <YAxis yAxisId="line" hide domain={["auto", "auto"]} />
                <ChartTooltip cursor={false} content={<OverviewTooltip bar={barM} line={lineM} />} />
                <Bar xAxisId="bar" yAxisId="bar" dataKey="bar" isAnimationActive={false} shape={ChartBar} />
                <Line
                  xAxisId="line"
                  yAxisId="line"
                  dataKey="line"
                  type="linear"
                  stroke="var(--admin-color-text-primary)"
                  strokeWidth={1.5}
                  dot={(p: { cx?: number; cy?: number; index?: number }) =>
                    p.index === 0 || p.index === data.length - 1 ? <circle key={p.index} cx={p.cx} cy={p.cy} r={2} fill="var(--admin-color-text-primary)" /> : <g key={p.index} />
                  }
                  activeDot={{ r: 4, fill: "var(--admin-color-text-primary)", stroke: "var(--admin-color-accent-strong)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
          <div className="mt-4 flex justify-between pb-[7px] t-micro text-a-text-3 tabular-nums">
            {ticks.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid items-stretch gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="@container gap-3.5 py-[18px]">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="t-data-m text-a-text">Content</h2>
            <AdminTabs label="Content view" tabs={[{ id: "courses", label: "Courses" }, { id: "questions", label: "Questions" }]} value={lower} onChange={setLower} />
          </header>
          {lower === "courses" ? (
            courses.length === 0 ? (
              <EmptyLine>No courses yet. Add your first one in Content.</EmptyLine>
            ) : (
              <div className="grid flex-1 border-t border-a-border @min-[680px]:grid-cols-[246fr_270fr_246fr]">
                {courses.map((c, ci) => {
                  const sum = COURSE_SUMMARY[ci] ?? COURSE_SUMMARY[0]
                  const risky = sum.drop >= 0
                  return (
                    <Link
                      key={c.id}
                      href={`${base}/content`}
                      className={cn(
                        "flex min-w-0 flex-col gap-4 pb-1 pt-4 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset",
                        ci > 0 && "border-a-border @max-[679px]:mt-4 @max-[679px]:border-t @min-[680px]:border-l",
                        ci === 0 ? "@min-[680px]:pr-6" : ci === courses.length - 1 ? "@min-[680px]:pl-6" : "@min-[680px]:px-6"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="t-body-m truncate text-a-text">{c.title}</span>
                        <Tag tone={risky ? "danger" : "success"} dot>{risky ? "At risk" : "Healthy"}</Tag>
                      </div>
                      <dl className="flex items-end">
                        {[
                          [sum.completed, "completed"],
                          [String(sum.students), "students"],
                          [String(sum.bars.length), "lessons"],
                        ].map(([v, l]) => (
                          <div key={l} className="flex min-w-0 flex-1 flex-col gap-1">
                            <dd className="t-heading-l tabular-nums text-a-text">{v}</dd>
                            <dt className="t-caption text-a-text-2">{l}</dt>
                          </div>
                        ))}
                      </dl>
                      <div className="flex flex-1 flex-col gap-2">
                        <div role="img" aria-label={`${c.title} completion per lesson`} className="relative min-h-[122px] flex-1">
                          <div className="absolute inset-0 flex items-end gap-1.5">
                            {sum.bars.map((v, i) => (
                              <span key={i} className={cn("flex-1 rounded-t-a-2xs", i === sum.drop ? "bg-a-danger-fill" : "bg-a-track")} style={{ height: `${v}%` }} />
                            ))}
                          </div>
                          {risky ? (
                            <span className="absolute t-micro text-a-danger" style={{ left: `${(sum.drop / sum.bars.length) * 100}%`, bottom: `${sum.bars[sum.drop] + 3}%` }}>{sum.dropLabel}</span>
                          ) : (
                            <span className="absolute left-0 top-0 t-caption text-a-success">No drop-off</span>
                          )}
                          <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-a-icon-subtle" />
                        </div>
                        <div className="flex justify-between t-caption text-a-text-3">
                          <span>Lesson 1</span>
                          <span>Lesson {sum.bars.length}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          ) : (
            <EmptyLine>No open questions in your courses right now.</EmptyLine>
          )}
        </Panel>

        <Panel className="gap-0 py-[18px]">
          <header className="flex items-center justify-between pb-3.5">
            <h2 className="t-data-m text-a-text">Needs you today</h2>
            <Link href={`${base}/students`} className="inline-flex items-center gap-1.5 t-caption text-a-text-2 outline-none transition-colors duration-300 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
              See all <ArrowRight className="size-3" />
            </Link>
          </header>
          <ul className="flex flex-1 flex-col">
            {NEEDS.map((u) => (
              <li key={u.id} className="flex flex-1 items-center gap-3 border-t border-a-border py-3 last:pb-0">
                <Avatar className="size-8 shrink-0 overflow-visible">
                  <AvatarFallback className="text-xs">{u.initials}</AvatarFallback>
                  <span aria-hidden className={cn("absolute -right-0.5 -top-0.5 size-2 rounded-full", u.tone === "danger" ? "bg-a-danger-fill" : "bg-a-warning-fill")} />
                </Avatar>
                <span className="sr-only">{u.tone === "danger" ? "Urgent" : "Warning"}</span>
                <div className="flex min-w-0 flex-1 flex-col t-body-m">
                  <span className="truncate text-a-text">{u.name}</span>
                  <span className="truncate text-a-text-2">{u.reason}</span>
                </div>
                <AdminButton hierarchy="secondary" size="md" nativeButton={false} render={<Link href={`${base}/${u.href}`} />}>{u.action}</AdminButton>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <EmptyState compact title={children} className="py-8" />
}

type TipProps = { active?: boolean; payload?: { payload?: { label: string; bar: number; line: number } }[] }

/** Figma 524:8716: day, then one row per series with its marker and value. */
function OverviewTooltip({ bar, line, active, payload }: { bar: Metric; line: Metric } & TipProps) {
  const d = payload?.[0]?.payload
  if (!active || !d) return null
  const rows = [
    { key: "bar", name: bar.label, value: format(bar, d.bar), marker: "size-2 rounded-[2px] bg-a-accent-strong" },
    { key: "line", name: line.label, value: format(line, d.line), marker: "h-0.5 w-2 bg-a-text" },
  ]
  return (
    <div className="flex min-w-36 flex-col gap-2.5 rounded-a-md border border-a-border bg-a-raised px-3 py-2.5 shadow-lg">
      <span className="t-micro text-a-text-2">{d.label}</span>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 t-caption">
            <span className="flex items-center gap-2 text-a-text-2"><span aria-hidden className={r.marker} />{r.name}:</span>
            <span className="t-mono-data text-a-text tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
