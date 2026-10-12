"use client"

import Link from "next/link"
import { Bell, CalendarDays, CalendarX, Newspaper, Radio, TriangleAlert } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { EVENTS, NOW_HOUR, TODAY, type CalEvent } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, DayTimeline, Head, TONE, W } from "./kit"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const KIND: Record<CalEvent["kind"], { color: string; label: string }> = {
  live: { color: TONE.primary, label: "Live" },
  call: { color: "oklch(0.62 0.13 240)", label: "Call" },
  workshop: { color: "oklch(0.6 0.15 300)", label: "Workshop" },
  "one-on-one": { color: "oklch(0.62 0.13 160)", label: "1:1" },
  news: { color: TONE.loss, label: "News" },
}

function NothingPlanned({ news }: { news?: boolean }) {
  const { coach } = useCoach()
  return news ? (
    <WidgetEmpty icon={CalendarX} title="No market news this week" text="Rate decisions, CPI and NFP show here in your time zone." />
  ) : (
    <WidgetEmpty icon={CalendarX} title="Nothing planned yet" text={`${coach.coachName}'s lives and calls will appear here.`} />
  )
}

/** Next live: countdown (big timer), timeline (today with a now line), block (brand colour). */
export function NextLive({ variant = "countdown" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <NothingPlanned />
  const live = EVENTS.find((e) => e.kind === "live")!
  const mins = live.inMinutes ?? 0
  const hh = String(Math.floor(mins / 60)).padStart(2, "0")
  const mm = String(mins % 60).padStart(2, "0")

  if (variant === "timeline") {
    return (
      <W>
        <Head icon={Radio} value={live.time} label="Today" right={`in ${inWords(mins)}`} />
        <DayTimeline from={8} to={20} now={NOW_HOUR} events={TODAY.map((e) => ({ ...e, color: KIND[e.kind].color }))} />
      </W>
    )
  }

  if (variant === "block") {
    return (
      <div className="flex h-full flex-col justify-between gap-4 rounded-(--radius) bg-primary p-[calc(1rem*var(--density,1))] text-primary-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-wider uppercase opacity-85">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-current" />
          </span>
          Next live
          <span className="ml-auto tabular-nums">{live.time}</span>
        </div>
        <div>
          <div className="font-heading text-4xl leading-none font-semibold tabular-nums">
            {hh}:{mm}
          </div>
          <div className="mt-1.5 text-sm opacity-85">{live.title} · with {coach.coachName}</div>
        </div>
        <Button variant="secondary" {...link(`${base}/calendar`)}>
          <Bell /> Remind me
        </Button>
      </div>
    )
  }

  // countdown: big timer plus a bar of the day filling up to the start
  const dayPct = ((NOW_HOUR - 8) / (15.5 - 8)) * 100
  return (
    <W>
      <Head icon={Radio} label="Next live" right={live.seats} />
      <Big size="lg" value={`${hh}:${mm}`} sub={`${live.title} · today ${live.time}`} />
      <div className="mt-auto grid gap-1.5">
        <div className="flex h-2 gap-0.5">
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} className="flex-1 rounded-sm" style={{ background: (i / 30) * 100 < dayPct ? TONE.primary : "var(--muted)" }} />
          ))}
        </div>
        <div className="flex justify-between">
          <Caps>08:00</Caps>
          <Caps className="text-foreground">Starts {live.time}</Caps>
        </div>
      </div>
    </W>
  )
}

/** This week: week (day columns with coloured blocks), timeline (dots on a line), list. */
export function ThisWeek({ variant = "week", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <NothingPlanned />
  const items = EVENTS.filter((e) => props.news !== false || e.kind !== "news")

  if (variant === "week") {
    return (
      <W>
        <Head icon={CalendarDays} value={items.length} label="Events" right="12–16 Oct" />
        <div className="grid flex-1 grid-cols-5 gap-1.5">
          {WEEK.map((d, i) => {
            const ev = items.filter((e) => e.day === d)
            return (
              <div key={d} className={cn("flex min-w-0 flex-col gap-1 rounded-[min(var(--radius),8px)] p-1.5", i === 0 ? "bg-primary/10" : "bg-muted/60")}>
                <Caps className={cn(i === 0 && "text-primary")}>{d}</Caps>
                <span className="font-heading text-lg leading-none font-semibold tabular-nums">{12 + i}</span>
                <div className="mt-auto flex flex-col gap-1">
                  {ev.map((e) => (
                    <span key={e.id} className="h-1.5 rounded-full" title={`${e.time} ${e.title}`} style={{ background: KIND[e.kind].color }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(["live", "call", "workshop", "news"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <i className="size-2 rounded-full" style={{ background: KIND[k].color }} /> {KIND[k].label}
            </span>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "timeline") {
    return (
      <W>
        <Head icon={CalendarDays} label={coach.wording.calendar} right="This week" />
        <ol className="relative grid flex-1 content-start gap-3 border-l pl-4">
          {items.slice(0, 6).map((e) => (
            <li key={e.id} className="relative flex items-baseline gap-2">
              <span className="absolute top-1 -left-[1.36rem] size-2.5 rounded-full ring-4 ring-card" style={{ background: KIND[e.kind].color }} />
              <Caps className="w-14 shrink-0">{e.day} {e.time}</Caps>
              <span className="truncate text-sm">{e.title}</span>
            </li>
          ))}
        </ol>
      </W>
    )
  }

  return (
    <W>
      <Head icon={CalendarDays} label={coach.wording.calendar} right="This week" />
      <div className="grid flex-1 content-start gap-1.5">
        {items.slice(0, 6).map((e) => (
          <Link key={e.id} href={`${base}/calendar`} className="flex items-center gap-2.5 rounded-md py-1">
            <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: KIND[e.kind].color }} />
            <span className="grid w-10 shrink-0 leading-tight">
              <Caps>{e.day}</Caps>
              <span className="text-xs tabular-nums">{e.time}</span>
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
            {e.noTrade && <TriangleAlert className="size-3.5 shrink-0 text-loss" />}
          </Link>
        ))}
      </div>
    </W>
  )
}

const IMPACT = { high: 3, medium: 2, low: 1 } as const

/** Economic news: impact (bars across the week), next (the next big one), list. */
export function EconNews({ variant = "impact" }: WidgetProps) {
  const empty = useEmpty()
  if (empty) return <NothingPlanned news />
  const news = EVENTS.filter((e) => e.kind === "news")
  const big = news.find((e) => e.impact === "high")!

  if (variant === "next") {
    return (
      <W className={cn(big.noTrade && "ring-1 ring-loss/40")}>
        <Head icon={TriangleAlert} tone="loss" value={big.day} label={big.time} right="High impact" />
        <Big value={big.title} sub={`in ${inWords(big.inMinutes ?? 0)}`} />
        <div className="mt-auto grid grid-cols-2 gap-2">
          {[
            ["Forecast", big.forecast],
            ["Previous", big.previous],
          ].map(([l, v]) => (
            <div key={l} className="grid gap-1 rounded-[min(var(--radius),8px)] bg-muted/60 p-2">
              <Caps>{l}</Caps>
              <span className="font-heading text-xl leading-none font-semibold tabular-nums">{v}</span>
            </div>
          ))}
        </div>
        {big.noTrade && <Caps className="text-loss">No trades 10 min around it</Caps>}
      </W>
    )
  }

  if (variant === "list") {
    return (
      <W>
        <Head icon={Newspaper} label="Economic news" right={`${news.length} this week`} />
        <div className="grid flex-1 content-start gap-2">
          {news.map((e) => (
            <div key={e.id} className="flex items-center gap-2.5 text-sm">
              <span className="flex gap-0.5">
                {[1, 2, 3].map((n) => (
                  <i key={n} className="size-1.5 rounded-full" style={{ background: n <= IMPACT[e.impact ?? "low"] ? TONE.loss : "var(--muted)" }} />
                ))}
              </span>
              <Caps className="w-16 shrink-0">{e.day} {e.time}</Caps>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  // impact: one bar per event across the week, height = impact, red = no-trade
  return (
    <W>
      <Head icon={Newspaper} tone="loss" value={news.filter((e) => e.noTrade).length} label="No-trade events" right="This week" />
      <div className="flex flex-1 items-end gap-1.5">
        {WEEK.map((d) => {
          const ev = news.filter((e) => e.day === d)
          return (
            <div key={d} className="flex h-full flex-1 flex-col justify-end gap-1">
              <div className="flex flex-1 items-end justify-center gap-0.5">
                {ev.length === 0 && <span className="h-1 w-full rounded-full bg-muted" />}
                {ev.map((e) => (
                  <span
                    key={e.id}
                    title={`${e.time} ${e.title}`}
                    className="w-full max-w-5 rounded-[3px]"
                    style={{ height: `${(IMPACT[e.impact ?? "low"] / 3) * 100}%`, background: e.noTrade ? TONE.loss : `color-mix(in oklab, ${TONE.loss} 35%, var(--muted))` }}
                  />
                ))}
              </div>
              <Caps className="text-center">{d.slice(0, 1)}</Caps>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <TriangleAlert className="size-3.5 text-loss" />
        <span className="truncate">Next: {big.title}</span>
        <span className="ml-auto text-muted-foreground tabular-nums">{big.day} {big.time}</span>
      </div>
    </W>
  )
}
