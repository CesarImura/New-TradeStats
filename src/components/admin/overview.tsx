"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, YAxis } from "recharts"
import { ArrowRight, ArrowUpRight, ChevronDown, Download, Video } from "@/components/icons"
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
      <DropdownMenuTrigger render={<Button hierarchy="secondary" size="md" className="gap-0 px-0" aria-label={`${name}: ${options[value]}`} />}>
        <span className="border-r border-a-border px-2.5 text-a-text-2">{name}</span>
        <span className="flex items-center gap-1 px-2.5">
          {options[value]} <ChevronDown className="size-3.5 text-a-text-2" />
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
    { label: "Starts in", value: inText(next.inMinutes ?? 0) },
    { label: "Signed up", value: next.seats?.split(" ")[0] ?? "0" },
    { label: "Reminders", value: "On" },
  ]
  return (
    <section aria-label="Next live" className="flex flex-col gap-6 rounded-a-lg bg-[var(--admin-color-highlight-base)] p-5 text-a-on-highlight md:flex-row md:items-stretch md:justify-between md:p-6">
      <div className="flex min-w-0 flex-col justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="t-mono-label opacity-70">Next live · {next.day} {next.date} · {next.time}</span>
          <h2 className="t-title md:t-display [overflow-wrap:anywhere]">{next.title}</h2>
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          {stats.map((st) => (
            <div key={st.label} className="flex flex-col gap-1">
              <dt className="t-mono-label-s opacity-70">{st.label}</dt>
              <dd className="t-data-m tabular-nums">{st.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex w-full shrink-0 flex-col justify-between gap-4 rounded-a-md bg-a-page p-4 text-a-text md:w-60">
        <div className="flex flex-col gap-1">
          <span className="t-mono-label-s text-a-text-3">Studio</span>
          <span className="t-body-l-medium">Stream room is ready</span>
          <span className="t-body-m text-a-text-2">Camera, mic and chat checked.</span>
        </div>
        <Button hierarchy="highlight" size="md" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
          Open studio <ArrowRight />
        </Button>
      </div>
    </section>
  )
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
  const [picked, setPicked] = useState<Record<string, string>>({})
  const metric = metrics.find((m) => m.id === picked[view]) ?? metrics[0]
  const [lower, setLower] = useState<"courses" | "week">("courses")

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
  const config = { value: { label: metric.label, color: "var(--admin-color-accent-strong)" } } satisfies ChartConfig
  // Daily counts read best as bars; levels (students, open requests) and long ranges as a line.
  const bars = Boolean(metric.sum) && Number(range) <= 30
  const [hover, setHover] = useState<number | null>(null)
  const activeBar = hover ?? open.data.length - 1

  const headline = useMemo(
    () => VIEWS[0].metrics.slice(0, 4).map((m) => {
      const data = series(m, 30, 1)
      const value = m.sum ? data.reduce((n, d) => n + d.value, 0) : data[data.length - 1].value
      return { m, value }
    }),
    [],
  )

  return (
    <div className="flex w-full flex-col gap-8">
      <NextLiveBanner base={base} />

      <AdminPageHeader
        title="Overview"
        subtitle={`${coach.name} · Monday, 12 October · Good morning, ${DEMO_ADMIN.name.split(" ")[0]}`}
        actions={
          <>
            <span className="inline-flex h-9 items-center gap-2.5 rounded-full bg-a-selected px-4 t-body-m">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-a-success-fill opacity-60 motion-reduce:animate-none" />
                <span className="size-2 rounded-full bg-a-success-fill" />
              </span>
              Students online: <span className="t-body-m-medium tabular-nums">23</span>
            </span>
            <Button size="lg" nativeButton={false} render={<Link href={`${base}/livestreams`} />}>
              <Video /> Go live <ArrowRight />
            </Button>
          </>
        }
      />

      {/* First, so a coach fresh from setup sees what's left; once it's all done it folds to one line. */}
      <SetupChecklist />

      <Panel className="gap-0 p-0">
        <div className="grid grid-cols-2 divide-a-border lg:grid-cols-4 lg:divide-x">
          {headline.map(({ m, value }, i) => (
            <Link key={m.id} href={`${base}/${m.href}`} className={cn("outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:ring-inset", i < 2 && "max-lg:border-b max-lg:border-a-border", i % 2 === 0 && "max-lg:border-r max-lg:border-a-border", i === 0 && "rounded-tl-a-lg", i === 1 && "max-lg:rounded-tr-a-lg", i === 2 && "max-lg:rounded-bl-a-lg lg:rounded-none", i === 3 && "rounded-br-a-lg max-lg:rounded-br-a-lg lg:rounded-r-a-lg")}>
              <MetricCard label={m.label} value={format(m, value)} delta={`${m.trend >= 0 ? "+" : "−"}${Math.round(Math.abs(m.trend) * 100)}% vs last month`} tone={m.id === "feedback" ? (m.trend < 0 ? "success" : "danger") : m.trend >= 0 ? "success" : "danger"} />
            </Link>
          ))}
        </div>
      </Panel>

      <SampleNotice>The numbers and lists on this page are examples, so you can see how the Overview works. They become yours as students join.</SampleNotice>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminTabs label="Overview view" tabs={VIEWS.map((v) => ({ id: v.id, label: v.label }))} value={view} onChange={setView} />
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip name="Date range" value={range} options={RANGES} onChange={setRange} />
            <FilterChip name="Tier" value={tier} options={tiers} onChange={setTier} />
          </div>
        </div>

        <div role="group" aria-label="Metric shown in the chart" className="flex flex-wrap gap-2">
          {strip.map(({ m, value }) => {
            const on = m.id === metric.id
            return (
              <button
                key={m.id}
                aria-pressed={on}
                onClick={() => setPicked((p) => ({ ...p, [view]: m.id }))}
                className={cn(
                  "inline-flex min-w-0 items-center gap-2 rounded-a-sm px-2.5 py-1.5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
                  on ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text",
                )}
              >
                <span className="t-caption truncate">{m.label}</span>
                <span className="t-caption-medium tabular-nums">
                  {format(m, value)}
                  {m.unit && <span className="ml-1 text-a-text-3">{m.unit}</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div className="rounded-a-md bg-a-sunk p-3 md:p-4">
          <ChartContainer config={config} className="aspect-auto h-64 w-full md:h-72">
            {bars ? (
              <BarChart data={open.data} margin={{ left: 0, right: 4, top: 8 }} barCategoryGap="22%" onMouseMove={(st) => setHover(typeof st.activeTooltipIndex === "number" ? st.activeTooltipIndex : null)} onMouseLeave={() => setHover(null)}>
                <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
                <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => format(metric, v)} />
                <ChartTooltip cursor={false} content={<OverviewTooltip metric={metric} />} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {open.data.map((d, i) => (
                    <Cell key={d.date} fill={i === activeBar ? "var(--admin-color-accent-strong)" : "var(--admin-color-bg-track)"} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={open.data} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--admin-color-chart-grid)" />
                <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => format(metric, v)} />
                <ChartTooltip cursor={{ stroke: "var(--admin-color-border-strong)" }} content={<OverviewTooltip metric={metric} />} />
                <Line dataKey="value" type="monotoneX" stroke="var(--admin-color-accent-strong)" strokeWidth={1.75} dot={false} />
              </LineChart>
            )}
          </ChartContainer>
          <div className="mt-1 flex justify-between pl-11 t-caption text-a-text-3 tabular-nums">
            <span>{open.data[0].date}</span>
            <span>{open.data[open.data.length - 1].date}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            hierarchy="secondary"
            iconOnly
            aria-label="Download as CSV"
            onClick={() => toast(`${metric.label} · ${RANGES[range].toLowerCase()}`, { description: "Downloads as a CSV in the real product." })}
          >
            <Download />
          </Button>
          <Button hierarchy="secondary" nativeButton={false} render={<Link href={`${base}/${metric.href}`} />}>
            Open {metric.href === "journal" ? "Journal & feedback" : metric.href} <ArrowUpRight />
          </Button>
        </div>
      </Panel>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader
            title={lower === "courses" ? "Content" : "This week"}
            description={lower === "courses" ? "Average progress across students with access" : "Lives, calls and news"}
            actions={<AdminTabs label="Content view" tabs={[{ id: "courses", label: "Courses" }, { id: "week", label: "This week" }]} value={lower} onChange={setLower} />}
          />
          {lower === "courses" ? (
            COURSES.length === 0 ? (
              <EmptyLine>No courses yet. Add your first one in Content.</EmptyLine>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {COURSES.map((c) => {
                  const pct = Math.min(100, courseProgress(c) + 9)
                  return (
                    <Link key={c.id} href={`${base}/content`} className="flex min-w-0 flex-col gap-3 rounded-a-md border border-a-border-subtle bg-a-raised p-4 outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:ring-2 focus-visible:ring-a-border-focus">
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="t-mono-label-s text-a-text-3">{c.area}</span>
                        <span className="t-body-l-medium truncate">{c.title}</span>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <span className="t-data-m tabular-nums">{pct}%</span>
                        <span className="t-caption text-a-text-2">{c.modules.length} {c.modules.length === 1 ? "module" : "modules"}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-a-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
                        <div className="h-full rounded-full bg-a-accent-strong" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          ) : EVENTS.length === 0 ? (
            <EmptyLine>Nothing scheduled this week.</EmptyLine>
          ) : (
            <ul className="flex flex-col divide-y divide-a-border-subtle">
              {EVENTS.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-24 shrink-0 t-mono-data text-a-text-2 tabular-nums">{e.day} {e.time}</span>
                  <span className="t-body-m min-w-0 flex-1 truncate">{e.title}</span>
                  {e.noTrade && <Tag tone="danger">No trade</Tag>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Needs you today"
            description={`${needsHelp.length + FEEDBACK_REQUESTS.length} things, most urgent first`}
            actions={
              <Link href={`${base}/students`} className="inline-flex items-center gap-1 t-body-m text-a-text-accent hover:underline">
                All students <ArrowRight className="size-4" />
              </Link>
            }
          />
          {needsHelp.length + FEEDBACK_REQUESTS.length === 0 ? (
            <EmptyLine>All clear. Nothing needs you right now.</EmptyLine>
          ) : (
            <ul className="flex flex-col divide-y divide-a-border-subtle">
              {needsHelp.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">{s.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="t-body-m-medium flex items-center gap-2">
                      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", s.health === "red" ? "bg-a-danger-fill" : "bg-a-warning-fill")} />
                      <span className="sr-only">{s.health === "red" ? "Urgent" : "Warning"}</span>
                      <span className="truncate">{s.name}</span>
                    </div>
                    <div className="t-caption truncate text-a-text-2">{s.reason} · {s.tier}</div>
                  </div>
                  <Button hierarchy="secondary" size="sm" nativeButton={false} render={<Link href={`${base}/students`} />}>Open</Button>
                </li>
              ))}
              {FEEDBACK_REQUESTS.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-3 last:pb-0">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-xs">{f.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="t-body-m-medium flex items-center gap-2">
                      <span className="truncate">{f.student}</span>
                      <Tag className="shrink-0">{f.trade}</Tag>
                    </div>
                    <div className="t-caption truncate text-a-text-2">“{f.note}” · {f.waiting}</div>
                  </div>
                  <Button hierarchy="secondary" size="sm" nativeButton={false} render={<Link href={`${base}/journal`} />}>Review</Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="rounded-a-md border border-dashed border-a-border-strong px-4 py-8 text-center t-body-m text-a-text-2">{children}</p>
}

function OverviewTooltip({ metric, ...props }: { metric: Metric } & React.ComponentProps<typeof ChartTooltipContent>) {
  return (
    <ChartTooltipContent
      {...props}
      hideLabel
      formatter={(v, _n, item) => (
        <span className="flex w-full items-center justify-between gap-4">
          <span className="text-a-text-2">{item.payload?.date}</span>
          <span className="t-body-m-medium text-a-text tabular-nums">{format(metric, Number(v))}</span>
        </span>
      )}
    />
  )
}
