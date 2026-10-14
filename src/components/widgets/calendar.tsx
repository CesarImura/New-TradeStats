"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, CalendarDays, CalendarX, Clock, Newspaper, Radio, TriangleAlert } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { EVENTS, MARKET_SESSIONS, NOW_HOUR, TODAY, type CalEvent } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, Big, Caps, Countdown, DayTimeline, Head, Row, Stat, TYPE, Tip, W, series, useMore } from "./kit"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const TODAY_NAME = "Mon"
/** Event types: shades of the one accent; news stays neutral. */
const KIND: Record<CalEvent["kind"], { color: string; label: string }> = {
  live: { color: series(0), label: "Live" },
  call: { color: series(1), label: "Call" },
  workshop: { color: series(2), label: "Workshop" },
  "one-on-one": { color: series(3), label: "1:1" },
  news: { color: "color-mix(in oklab, var(--foreground) 28%, transparent)", label: "News" },
}

/** A list that shows as many whole rows as fit the widget's height and hides the rest. */
function Fit({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", className)}>{children}</div>
}

function NothingPlanned({ news }: { news?: boolean }) {
  const { coach } = useCoach()
  return news ? (
    <WidgetEmpty icon={CalendarX} title="No market news this week" text="Rate decisions, CPI and NFP show here in your time zone." />
  ) : (
    <WidgetEmpty icon={CalendarX} title="Nothing planned yet" text={`${coach.coachName}'s lives and calls will appear here.`} />
  )
}

/** "No trade" as quiet loss-coloured text, never a block. */
function NoTrade({ short }: { short?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-loss">
      <TriangleAlert className="size-3" />
      {short ? null : "No trade"}
    </span>
  )
}

// ---------- Up next (was Next live + This week)

/**
 * Up next: countdown (time to the next session), timeline (today on a line),
 * week (the five trading days as columns). Detail adds a supporting line, then
 * a short list of what follows.
 */
export function NextLive({ variant = "countdown", props = {} }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const [hover, setHover] = useState<string>()
  if (empty) return <NothingPlanned />
  const items = EVENTS.filter((e) => props.news !== false || e.kind !== "news")
  const sessions = EVENTS.filter((e) => e.kind !== "news")
  const next = sessions.find((e) => e.inMinutes !== undefined) ?? sessions[0]
  const mins = next.inMinutes ?? 0
  const later = items.filter((e) => e.id !== next.id)

  const laterList = (list: CalEvent[]) => (
    <Fit>
      {list.map((e) => (
        <Row
          key={e.id}
          title={e.title}
          sub={e.kind === "news" ? (e.noTrade ? <span className="text-loss">No trade</span> : "Market news") : KIND[e.kind].label}
          value={
            <span className="text-xs text-muted-foreground tabular-nums">
              {e.day} {e.time}
            </span>
          }
        />
      ))}
    </Fit>
  )

  if (variant === "timeline") {
    const todays = TODAY.map((e) => ({ ...e, color: KIND[e.kind].color }))
    return (
      <W>
        <Head icon={CalendarDays} label="Today" right={`Next in ${inWords(mins)}`} />
        <DayTimeline from={8} to={20} now={NOW_HOUR} events={todays} />
        {more && !detailed && (
          <span className={cn(TYPE.small, "truncate")}>
            <span className="text-foreground">{next.title}</span> · {next.time}
          </span>
        )}
        {detailed && (
          <Fit className="max-h-24">
            {TODAY.map((e) => (
              <Row
                key={e.title}
                title={e.title}
                value={<span className="text-xs text-muted-foreground tabular-nums">{`${Math.floor(e.start)}:${String(Math.round((e.start % 1) * 60)).padStart(2, "0")}`}</span>}
              />
            ))}
          </Fit>
        )}
      </W>
    )
  }

  if (variant === "week") {
    const nextLine = (
      <span className={cn(TYPE.small, "truncate")}>
        Next: <span className="text-foreground">{next.title}</span> · {next.day} {next.time}
      </span>
    )
    return (
      <W>
        <Head icon={CalendarDays} label="This week" right="12–16 Oct" />
        <div className={cn("grid min-h-0 grid-cols-5 gap-1", detailed ? "shrink-0" : "flex-1")} onPointerLeave={() => setHover(undefined)}>
          {WEEK.map((d, i) => {
            const ev = items.filter((e) => e.day === d).sort((a, b) => a.time.localeCompare(b.time))
            const today = d === TODAY_NAME
            return (
              <div key={d} className={cn("r-inner flex min-w-0 flex-col gap-1.5 p-1.5", today && "bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)]")}>
                <div className="flex min-w-0 items-baseline gap-1">
                  <Caps className={cn(today && "text-foreground")}>{d}</Caps>
                  <span className={cn(TYPE.title, "tabular-nums leading-none", today && "font-semibold")}>{12 + i}</span>
                  {today && <span className="r-dot size-1.5 shrink-0 self-center" style={{ background: ACCENT }} aria-label="Today" />}
                </div>
                <div className="flex min-h-0 flex-col gap-1">
                  {ev.map((e) => (
                    <span key={e.id} className="relative" onPointerEnter={() => setHover(e.id)}>
                      {/* Narrow: a thin mark per event. Wide: a neutral chip with its time. */}
                      <span
                        className={cn("r-bar block h-1 transition-opacity duration-150 @[26rem]:hidden", hover && hover !== e.id && "opacity-40")}
                        style={{ background: e.noTrade ? "var(--loss)" : KIND[e.kind].color }}
                      />
                      <span
                        className={cn(
                          "r-chip hidden min-w-0 items-center gap-1 border-l-2 bg-muted px-1 py-0.5 text-[0.6875rem] leading-tight transition-opacity duration-150 @[26rem]:flex",
                          hover && hover !== e.id && "opacity-50",
                        )}
                        style={{ borderLeftColor: KIND[e.kind].color }}
                      >
                        <span className="shrink-0 tabular-nums">{e.time}</span>
                        <span className="hidden truncate text-muted-foreground @[40rem]:inline">{e.title}</span>
                        {e.noTrade && <TriangleAlert className="ml-auto size-3 shrink-0 text-loss" />}
                      </span>
                      {hover === e.id && <Tip x={i === 0 ? 0 : i === WEEK.length - 1 ? 100 : 50} y={0} place="above" label={`${e.day} ${e.time}`} value={e.title} />}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {more && !detailed && <div className="mt-auto flex min-w-0">{nextLine}</div>}
        {detailed && laterList(items)}
      </W>
    )
  }

  // countdown
  const hh = Math.floor(mins / 60)
  const mm = mins % 60
  const parts = hh >= 24 ? [{ value: Math.floor(hh / 24), unit: "d" }, { value: hh % 24, unit: "h" }] : [{ value: hh, unit: "h" }, { value: mm, unit: "min" }]
  return (
    <W>
      <Head icon={Radio} label="Up next" right={next.seats} />
      <div className="grid min-w-0 gap-1">
        <Countdown parts={parts} />
        <span className={cn(TYPE.body, "flex min-w-0 items-center gap-1.5")}>
          <i className="r-dot size-1.5 shrink-0" style={{ background: ACCENT }} />
          <span className="truncate">{next.title}</span>
        </span>
      </div>
      {more && (
        <div className={cn("flex min-w-0 items-center gap-2", !detailed && "mt-auto")}>
          <span className={cn(TYPE.small, "truncate")}>
            {next.day} {next.time} · with {coach.coachName}
          </span>
          <Button size="sm" variant="outline" className="ml-auto hidden shrink-0 @[16rem]:inline-flex" {...link(`${base}/calendar`)}>
            <Bell /> Remind me
          </Button>
        </div>
      )}
      {detailed && (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <Caps>Later this week</Caps>
          {laterList(later)}
        </div>
      )}
    </W>
  )
}


// ---------- Market calendar (economic news + market sessions)

const IMPACT = { high: 3, medium: 2, low: 1 } as const
const hhmm = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
const inHours = (h: number) => (h >= 1 ? `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m` : `${Math.round(h * 60)}m`)
function sessionState(s: { open: number; close: number }, now: number) {
  const open = now >= s.open && now < s.close
  const until = open ? s.close - now : (s.open - now + 24) % 24
  return { open, until }
}

/** Three small dots: how much the release can move the market. Neutral, not red. */
function ImpactDots({ impact = "low" }: { impact?: CalEvent["impact"] }) {
  return (
    <span className="flex shrink-0 gap-0.5" aria-label={`${impact} impact`}>
      {[1, 2, 3].map((n) => (
        <i key={n} className="r-dot size-1.5" style={{ background: n <= IMPACT[impact] ? "var(--foreground)" : "var(--muted)" }} />
      ))}
    </span>
  )
}

/** Which sessions are open now: the accent dot marks open ones. */
function SessionStrip() {
  const open = MARKET_SESSIONS.filter((s) => sessionState(s, NOW_HOUR).open)
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <i className="r-dot size-1.5 shrink-0" style={{ background: ACCENT }} />
      <span className="truncate">
        <span className="text-foreground">{open.map((s) => s.name).join(", ")}</span> open
      </span>
    </span>
  )
}

/**
 * Market calendar: next (the next big release), week (this week's releases as
 * a list), sessions (Sydney, Tokyo, London, New York over 24 hours with a now
 * line). Open sessions show in the header of the other looks.
 */
export function EconNews({ variant = "next" }: WidgetProps) {
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) return <NothingPlanned news />
  const news = EVENTS.filter((e) => e.kind === "news")
  const big = news.find((e) => e.impact === "high")!

  if (variant === "sessions") {
    const now = NOW_HOUR
    const open = MARKET_SESSIONS.filter((s) => sessionState(s, now).open)
    const pos = (h: number) => `${(h / 24) * 100}%`
    // Detailed adds a third column with "closes in" / "opens in" when there is room.
    const cols = cn("grid grid-cols-[4.5rem_1fr] gap-x-2 @max-[16rem]:grid-cols-[3rem_1fr]", detailed && "@[22rem]:grid-cols-[4.5rem_1fr_6.5rem]")
    const nowLine = (
      <span className="pointer-events-none absolute inset-y-0 w-px bg-foreground" style={{ left: pos(now) }}>
        <span className="r-dot absolute -top-1 -left-[3px] size-[7px]" style={{ background: ACCENT }} />
      </span>
    )
    return (
      <W>
        <Head icon={Clock} label="Sessions" value={open.length} unit="open" right={hhmm(now)} />
        <div className={cn(cols, "min-h-0 flex-1")}>
          <div className="grid content-evenly">
            {MARKET_SESSIONS.map((s) => (
              <span key={s.name} className={cn(TYPE.small, "flex h-5 items-center truncate", sessionState(s, now).open && "text-foreground")}>
                {s.name}
              </span>
            ))}
          </div>
          <div className="relative grid content-evenly">
            {MARKET_SESSIONS.map((s) => {
              const st = sessionState(s, now)
              return (
                <div key={s.name} className="relative flex h-5 items-center">
                  <span className="r-bar absolute inset-x-0 h-1.5 bg-muted" />
                  <span
                    className="r-bar absolute h-1.5"
                    style={{ left: pos(s.open), width: pos(s.close - s.open), background: st.open ? "color-mix(in oklab, var(--foreground) 60%, transparent)" : "color-mix(in oklab, var(--foreground) 18%, transparent)" }}
                  />
                </div>
              )
            })}
            {nowLine}
          </div>
          {detailed && (
            <div className="hidden content-evenly @[22rem]:grid">
              {MARKET_SESSIONS.map((s) => {
                const st = sessionState(s, now)
                return (
                  <span key={s.name} className="flex h-5 items-center justify-end text-xs text-muted-foreground tabular-nums">
                    {st.open ? `closes ${inHours(st.until)}` : `opens ${inHours(st.until)}`}
                  </span>
                )
              })}
            </div>
          )}
        </div>
        <div className={cols}>
          <span />
          <div className="flex justify-between">
            {["00", "06", "12", "18", "24"].map((t) => (
              <Caps key={t}>{t}</Caps>
            ))}
          </div>
        </div>
        {more && (
          <span className={cn(TYPE.small, "flex min-w-0 items-center gap-1.5")}>
            <span className="truncate">
              Next big release: <span className="text-foreground">{big.title}</span> · {big.day} {big.time}
            </span>
            {big.noTrade && <NoTrade short />}
          </span>
        )}
      </W>
    )
  }

  if (variant === "week") {
    const list = more ? news : news.filter((e) => e.impact === "high")
    return (
      <W>
        <Head icon={Newspaper} label="Market calendar" right={<SessionStrip />} />
        <Fit>
          {list.map((e) => (
            <div key={e.id} className="flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5 last:border-b-0">
              <ImpactDots impact={e.impact} />
              <span className="w-[4.5rem] shrink-0 text-xs text-muted-foreground tabular-nums @max-[15rem]:hidden">
                {e.day} {e.time}
              </span>
              <span className="grid min-w-0 flex-1">
                <span className={cn(TYPE.body, "truncate")}>{e.title}</span>
                {detailed && e.forecast && (
                  <span className={cn(TYPE.small, "truncate tabular-nums")}>
                    Forecast {e.forecast} · Previous {e.previous}
                  </span>
                )}
              </span>
              {e.noTrade && <NoTrade short />}
            </div>
          ))}
        </Fit>
      </W>
    )
  }

  // next
  const others = news.filter((e) => e.id !== big.id)
  return (
    <W>
      <Head icon={Newspaper} label="Market calendar" right={<SessionStrip />} />
      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <ImpactDots impact={big.impact} />
          <Caps className="tabular-nums">
            {big.day} {big.time} · in {inWords(big.inMinutes ?? 0)}
          </Caps>
        </div>
        <Big value={big.title} />
        {big.noTrade && <NoTrade />}
      </div>
      {more && (
        <div className={cn("grid grid-cols-2 gap-3", !detailed && "mt-auto")}>
          <Stat label="Forecast" value={big.forecast} />
          <Stat label="Previous" value={big.previous} />
        </div>
      )}
      {detailed && (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <Caps>Also this week</Caps>
          <Fit>
            {others.map((e) => (
              <Row
                key={e.id}
                avatar={<ImpactDots impact={e.impact} />}
                title={e.title}
                value={
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {e.day} {e.time}
                  </span>
                }
              />
            ))}
          </Fit>
        </div>
      )}
    </W>
  )
}
