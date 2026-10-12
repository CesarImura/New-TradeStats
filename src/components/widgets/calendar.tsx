"use client"

import Link from "next/link"
import { Bell, CalendarDays, CalendarX, Newspaper, Radio, TriangleAlert } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { EVENTS, NOW_HOUR, TODAY, type CalEvent } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, DayTimeline, Head, Key, TONE, Track, W, fill, series } from "./kit"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const KIND: Record<CalEvent["kind"], { color: string; label: string }> = {
  live: { color: series(0), label: "Live" },
  call: { color: series(1), label: "Call" },
  workshop: { color: series(2), label: "Workshop" },
  "one-on-one": { color: series(4), label: "1:1" },
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

function NoTrade() {
  return (
    <span className="r-chip inline-flex items-center gap-1 bg-loss/12 px-1.5 py-0.5 text-[0.65rem] font-medium text-loss">
      <TriangleAlert className="size-3" /> No trade
    </span>
  )
}

/** Next live: countdown (big timer), timeline (today with a now line), block (brand surface). */
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
      <div className="fx-hero @container flex h-full flex-col justify-between gap-4 overflow-hidden rounded-(--radius) p-[calc(1rem*var(--density,1))]" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-center gap-2 text-[0.65rem] font-medium tracking-wide uppercase opacity-80">
          <Radio className="size-3.5" /> Next live
          <span className="ml-auto tabular-nums">{live.time}</span>
        </div>
        <div className="min-w-0">
          <div className="font-heading leading-none font-semibold tabular-nums" style={{ fontSize: "clamp(2rem, 17cqi, 3.25rem)" }}>
            {hh}:{mm}
          </div>
          <div className="mt-1.5 truncate text-sm opacity-80">
            {live.title} · with {coach.coachName}
          </div>
        </div>
        <Button variant="secondary" className="w-full @[16rem]:w-fit" {...link(`${base}/calendar`)}>
          <Bell /> Remind me
        </Button>
      </div>
    )
  }

  const dayPct = ((NOW_HOUR - 8) / (15.5 - 8)) * 100
  return (
    <W>
      <Head icon={Radio} label="Next live" right={live.seats} />
      <Big size="lg" value={`${hh}:${mm}`} sub={`${live.title} · ${live.time}`} />
      <div className="mt-auto grid gap-1.5">
        <Track value={dayPct} />
        <div className="flex justify-between">
          <Caps>Now</Caps>
          <Caps className="text-foreground">{live.time}</Caps>
        </div>
      </div>
    </W>
  )
}

/** This week: week (day columns with event marks), timeline (dots on a line), list. */
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
            const today = i === 0
            return (
              <div key={d} className={cn("r-inner flex min-w-0 flex-col gap-1 p-1.5", today ? "bg-primary text-primary-foreground" : "bg-muted/60")}>
                <Caps className={cn(today && "text-primary-foreground/80")}>{d}</Caps>
                <span className="font-heading text-lg leading-none font-semibold tabular-nums">{12 + i}</span>
                <div className="mt-auto flex flex-col gap-1">
                  {ev.map((e) => (
                    <span key={e.id} className="r-bar h-1.5" title={`${e.time} ${e.title}`} style={{ background: today ? "currentColor" : KIND[e.kind].color, opacity: today ? 0.85 : 1 }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="hidden flex-wrap gap-x-3 gap-y-1 @[18rem]:flex">
          {(["live", "call", "workshop", "news"] as const).map((k) => (
            <Key key={k} color={KIND[k].color}>
              {KIND[k].label}
            </Key>
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
            <li key={e.id} className="relative flex min-w-0 items-baseline gap-2">
              <span className="r-dot absolute top-1 -left-[1.33rem] size-2.5 ring-4 ring-card" style={{ background: KIND[e.kind].color }} />
              <Caps className="hidden w-14 shrink-0 @[15rem]:block">
                {e.day} {e.time}
              </Caps>
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
          <Link key={e.id} href={`${base}/calendar`} className="flex min-w-0 items-center gap-2.5 py-1">
            <span className="r-bar h-7 w-1 shrink-0" style={{ background: KIND[e.kind].color }} />
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
      <W>
        <Head icon={TriangleAlert} tone="loss" value={big.day} label={big.time} right={big.noTrade ? <NoTrade /> : "High impact"} />
        <Big value={big.title} sub={`in ${inWords(big.inMinutes ?? 0)}`} />
        <div className="mt-auto grid grid-cols-2 gap-2">
          {[
            ["Forecast", big.forecast],
            ["Previous", big.previous],
          ].map(([l, v]) => (
            <div key={l} className="r-inner grid gap-1 bg-muted/60 p-2">
              <Caps>{l}</Caps>
              <span className="font-heading text-xl leading-none font-semibold tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "list") {
    return (
      <W>
        <Head icon={Newspaper} label="Economic news" right={`${news.length} this week`} />
        <div className="grid flex-1 content-start gap-2">
          {news.map((e) => (
            <div key={e.id} className="flex min-w-0 items-center gap-2.5 text-sm">
              <span className="flex shrink-0 gap-0.5">
                {[1, 2, 3].map((n) => (
                  <i key={n} className="r-dot size-1.5" style={{ background: n <= IMPACT[e.impact ?? "low"] ? TONE.loss : "var(--muted)" }} />
                ))}
              </span>
              <Caps className="hidden w-16 shrink-0 @[16rem]:block">
                {e.day} {e.time}
              </Caps>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
            </div>
          ))}
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Newspaper} tone="loss" value={news.filter((e) => e.noTrade).length} label="No-trade events" right="This week" />
      <div className="flex flex-1 items-end gap-1.5">
        {WEEK.map((d) => {
          const ev = news.filter((e) => e.day === d)
          return (
            <div key={d} className="flex h-full flex-1 flex-col justify-end gap-1.5">
              <div className="flex flex-1 items-end justify-center gap-0.5">
                {ev.length === 0 && <span className="r-bar h-1 w-full bg-muted" />}
                {ev.map((e) => (
                  <span
                    key={e.id}
                    title={`${e.time} ${e.title}`}
                    className="r-bar w-full max-w-5"
                    style={{ height: `${(IMPACT[e.impact ?? "low"] / 3) * 100}%`, background: e.noTrade ? fill("loss") : `color-mix(in oklab, ${TONE.loss} 28%, var(--muted))` }}
                  />
                ))}
              </div>
              <Caps className="text-center">{d.slice(0, 1)}</Caps>
            </div>
          )
        })}
      </div>
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="truncate">Next: {big.title}</span>
        <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
          {big.day} {big.time}
        </span>
      </div>
    </W>
  )
}
