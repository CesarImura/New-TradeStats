"use client"

import { useEffect, useState } from "react"
import { CalendarDays, CalendarX, Clock, Newspaper, Radio } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { EVENTS, MARKET_SESSIONS, NOW_HOUR, type CalEvent } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ACCENT, Drop, GROW_ROWS, SPLIT, Tip, useFrame, useMore } from "./kit"
import { Poster, Rail, SplitCard, type RailItem } from "./layouts"
import { Axis, Chip, GREY, Label, Legend, Num, Panel, Rolling, Rule, TickBar, Timeline, WCard, useFigureFont } from "./instrument"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const TODAY_NAME = "Mon"
/** An empty tick (same as instrument.tsx's track). */
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"
const LOSS = "var(--loss)"
/** Loss as text: the shade that stays readable on the card. */
const LOSS_TEXT = "var(--loss-text)"
/** How long each kind of event runs, in minutes (sample). */
const LENGTH: Record<CalEvent["kind"], number> = { live: 90, call: 45, workshop: 60, "one-on-one": 30, news: 30 }
const KIND_LABEL: Record<CalEvent["kind"], string> = { live: "Live", call: "Call", workshop: "Workshop", "one-on-one": "1:1", news: "News" }

const pad = (n: number) => String(n).padStart(2, "0")
const toHour = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h + m / 60
}
const hhmm = (h: number) => `${pad(Math.floor(h) % 24)}:${pad(Math.round((h % 1) * 60))}`
/** "6h 30m", "2d 5h", "45m". */
function short(minutes: number) {
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = Math.round(minutes % 60)
  if (d) return `${d}d ${h}h`
  if (h) return m ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}
/** Does [start, start+len) overlap the slot [from, to)? Hours. */
const overlaps = (start: number, len: number, from: number, to: number) => start < to && start + len > from

/** A list that shows as many whole rows as fit the widget's height and hides the rest. */
function Fit({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS, className)}>{children}</div>
}

function NothingPlanned({ news }: { news?: boolean }) {
  const { coach } = useCoach()
  return news ? (
    <WidgetEmpty icon={CalendarX} title="No market news this week" text="Rate decisions, CPI and NFP show here in your time zone." />
  ) : (
    <WidgetEmpty icon={CalendarX} title="Nothing planned yet" text={`${coach.coachName}'s lives and calls will appear here.`} />
  )
}

/** Seconds left, ticking down once a second. */
function useTicker(start: number) {
  const [left, setLeft] = useState(start)
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  return left
}

// ---------- Up next

/** Today's plan (sample, "now" is Mon 09:00). Times in the student's time zone. */
type AgendaItem = { time: string; mins: number; title: string; kind: CalEvent["kind"]; noTrade?: boolean; impact?: CalEvent["impact"] }
const AGENDA: AgendaItem[] = [
  { time: "15:30", mins: 90, title: "Live trading · NY open", kind: "live" },
  { time: "18:00", mins: 45, title: "Trade review Q&A", kind: "call" },
  { time: "20:30", mins: 30, title: "CPI · no trade", kind: "news", noTrade: true, impact: "high" },
]
const DAY_FROM = 8
const DAY_TO = 20

/** The trading day as 15-minute ticks: past in grey, events in the accent (no-trade in the loss colour), now taller. */
function DayBar({ agenda, height = 10 }: { agenda: AgendaItem[]; height?: number }) {
  const segments = (DAY_TO - DAY_FROM) * 4
  const mark = (i: number) => {
    const from = DAY_FROM + i / 4
    const ev = agenda.find((a) => overlaps(toHour(a.time), a.mins / 60, from, from + 0.25))
    if (ev) return ev.noTrade ? LOSS : ev.kind === "news" ? GREY[1] : ACCENT
    if (from < NOW_HOUR) return GREY[2]
    return undefined
  }
  return (
    <div className="grid shrink-0 gap-1">
      <TickBar value={0} segments={segments} mark={mark} now={(NOW_HOUR - DAY_FROM) * 4} height={height} />
      <Axis labels={["08:00", "12:00", "16:00", "20:00"]} />
    </div>
  )
}

function agendaRow(a: AgendaItem) {
  return {
    time: a.time,
    title: a.title,
    strong: a.kind === "live",
    color: a.noTrade ? LOSS : a.kind === "live" ? ACCENT : GREY[1],
    value: a.impact ? (
      <>
        <span style={{ color: LOSS_TEXT }}>{a.impact}</span> {a.mins}m
      </>
    ) : (
      `${a.mins}m`
    ),
  }
}

/** Timeline rows that drop out one by one when the card runs out of height. */
function FitTimeline({ items, className }: { items: Parameters<typeof Timeline>[0]["items"]; className?: string }) {
  return (
    <Fit className={className}>
      {items.map((it, i) => (
        <Timeline key={i} items={[it]} />
      ))}
    </Fit>
  )
}

/**
 * Up next: countdown (time to the next session, today's tick bar, the agenda),
 * timeline (today's bar large with the agenda), week (five day columns of hour
 * ticks with the next session underneath).
 */
export function NextLive({ variant = "countdown", props = {} }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const [hover, setHover] = useState<string>()
  const [remind, setRemind] = useState(false)
  const { emphasis } = useFrame()
  const font = useFigureFont()
  const sessions = EVENTS.filter((e) => e.kind !== "news")
  const next = sessions.find((e) => e.inMinutes !== undefined) ?? sessions[0]
  const mins = next?.inMinutes ?? 0
  const secs = useTicker(mins * 60 + 12)
  if (empty || !next) return <NothingPlanned />
  const withNews = props.news !== false
  const items = EVENTS.filter((e) => withNews || e.kind !== "news")
  const agenda = AGENDA.filter((a) => withNews || a.kind !== "news")
  const meta = `${next.title} · with ${coach.coachName}`

  if (variant === "timeline") {
    const coachMins = agenda.filter((a) => a.kind !== "news").reduce((s, a) => s + a.mins, 0)
    const blocked = agenda.filter((a) => a.noTrade).reduce((s, a) => s + a.mins, 0)
    const free = (DAY_TO - NOW_HOUR) * 60 - coachMins - blocked
    return (
      <WCard icon={CalendarDays} title="Today" meta={`Mon 12 Oct · ${agenda.length} on your day with ${coach.coachName}`} chip={<Chip>in {short(mins)}</Chip>} bodyClassName={SPLIT}>
        {/* Wide and short: the day's bar on the left, the agenda beside it. */}
        <div data-main className="flex shrink-0 flex-col justify-center gap-3">
          {detailed && <Num size="md" value={`${agenda.length} events`} delta={`next ${next.time}`} deltaTone="accent" />}
          <DayBar agenda={agenda} height={20} />
        </div>
        <FitTimeline items={(more ? agenda : agenda.slice(0, 1)).map(agendaRow)} />
        {detailed && (
          <Legend
            className="shrink-0"
            items={[
              { color: ACCENT, label: `With ${coach.coachName}`, value: short(coachMins) },
              { color: LOSS, label: "No-trade window", value: short(blocked) },
              { color: GREY[2], label: "Free to trade till 20:00", value: short(free) },
            ]}
          />
        )}
      </WCard>
    )
  }

  if (variant === "week") {
    const W_FROM = 7
    const W_TO = 21
    return (
      <WCard
        icon={CalendarDays}
        title="This week"
        meta={`12–16 Oct · ${items.filter((e) => e.kind !== "news").length} sessions with ${coach.coachName}`}
        chip={<Chip tone="neutral">{items.length} events</Chip>}
      >
        <div className={cn("grid min-h-16 grid-cols-5 gap-1.5", detailed ? "h-24 shrink-0" : "flex-1")} onPointerLeave={() => setHover(undefined)}>
          {WEEK.map((d, di) => {
            const evs = items.filter((e) => e.day === d)
            const today = d === TODAY_NAME
            return (
              <div key={d} className="flex min-h-0 min-w-0 flex-col gap-1.5">
                <div className="flex min-w-0 items-baseline gap-1">
                  <Label className={cn(today && "text-foreground")}>{d}</Label>
                  <span className={cn("text-[0.6875rem] leading-4 tabular-nums", today ? "font-medium" : "text-muted-foreground")} style={{ fontFamily: font }}>
                    {12 + di}
                  </span>
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col gap-[2px]">
                  {Array.from({ length: W_TO - W_FROM }, (_, i) => {
                    const from = W_FROM + i
                    const ev = evs.find((e) => overlaps(toHour(e.time), LENGTH[e.kind] / 60, from, from + 1))
                    const isNow = today && from === Math.floor(NOW_HOUR)
                    const color = isNow
                      ? "var(--foreground)"
                      : ev
                        ? ev.noTrade
                          ? LOSS
                          : ev.kind === "news"
                            ? GREY[1]
                            : ACCENT
                        : today && from < NOW_HOUR
                          ? GREY[2]
                          : TRACK
                    return (
                      // Each hour is a row: a hairline when free, a thin bar (not a block) when something is on.
                      <span
                        key={i}
                        className={cn("flex min-h-px flex-1 items-center transition-opacity duration-150", hover && ev && hover !== ev.id && "opacity-40")}
                        onPointerEnter={() => setHover(ev?.id)}
                      >
                        <i className="r-bar block w-full" style={{ background: color, height: isNow || ev ? "max(2px, 40%)" : 1, marginRight: isNow || ev ? 0 : "30%" }} />
                      </span>
                    )
                  })}
                  {evs.map((e) =>
                    hover === e.id ? (
                      <Tip key={e.id} x={di === 0 ? 0 : di === WEEK.length - 1 ? 100 : 50} y={((toHour(e.time) - W_FROM) / (W_TO - W_FROM)) * 100} place="above" label={e.time} value={e.title} />
                    ) : null,
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {more && !detailed && <Timeline className="shrink-0" items={[{ time: next.time, title: `${next.title} · ${next.day}`, value: `in ${short(mins)}`, color: ACCENT, strong: true }]} />}
        {detailed && (
          <>
            <Rule />
            <Fit>
              {[...items]
                .sort((a, b) => WEEK.indexOf(a.day) - WEEK.indexOf(b.day) || a.time.localeCompare(b.time))
                .map((e) => (
                  <Legend
                    key={e.id}
                    items={[
                      {
                        dot: true,
                        color: e.noTrade ? LOSS : e.kind === "news" ? GREY[1] : ACCENT,
                        label: (
                          <>
                            <span className="tabular-nums">
                              {e.day} {e.time}
                            </span>{" "}
                            <span className="text-foreground">{e.title}</span>
                          </>
                        ),
                        value: e.noTrade ? "no trade" : e.seats ?? KIND_LABEL[e.kind],
                        valueTone: e.noTrade ? "loss" : undefined,
                      },
                    ]}
                  />
                ))}
            </Fit>
          </>
        )}
      </WCard>
    )
  }

  const hh = Math.floor(secs / 3600)
  const clock = (
    <>
      <Rolling value={hh >= 24 ? `${Math.floor(hh / 24)}d ${pad(hh % 24)}` : `${pad(hh)}:${pad(Math.floor((secs % 3600) / 60))}`} />
      <span className="text-muted-foreground">
        :<Rolling value={pad(secs % 60)} />
      </span>
    </>
  )

  if (variant === "split") {
    const later = items.filter((e) => e.id !== next.id).slice(0, detailed ? 3 : 2)
    return (
      <SplitCard panel={<Poster kicker={`${KIND_LABEL[next.kind]} · ${next.day} ${next.time}`} title={next.title} sub={`with ${coach.coachName}`} />}>
        <div className="grid shrink-0 gap-0.5">
          <span className="truncate text-[0.8125rem] leading-5 font-medium @[22rem]:hidden">{next.title}</span>
          <Label>Starts in</Label>
          <Num value={clock} />
        </div>
        {more && next.seats && <span className="line-clamp-2 text-[0.6875rem] leading-4 text-muted-foreground">{next.seats} · reminder 15 min before</span>}
        {detailed && (
          <>
            <Rule />
            <Legend
              className="shrink-0"
              items={later.map((e) => ({ dot: true, color: e.noTrade ? LOSS : e.kind === "news" ? GREY[1] : GREY[0], label: `${e.day} ${e.time} · ${e.title}`, value: e.kind === "news" ? "news" : KIND_LABEL[e.kind] }))}
            />
          </>
        )}
        <Button size="sm" variant={remind || emphasis === "quiet" ? "outline" : "default"} className="mt-auto w-fit" onClick={() => setRemind((r) => !r)}>
          {remind ? "Reminder set" : "Remind me"}
        </Button>
      </SplitCard>
    )
  }

  // countdown, on the base structure: time to the next session, today's bar on a panel, the agenda (three at most;
  // the rest of the week on Detailed), and a reminder in the foot.
  const later = items.filter((e) => e.id !== next.id).slice(0, 3)
  return (
    <WCard
      bands
      icon={Radio}
      title="Up next"
      section={coach.wording.calendar}
      meta={meta}
      chip={next.seats ? <Chip>{next.seats}</Chip> : undefined}
      footnote={more ? (remind ? "We'll remind you 15 min before" : `${KIND_LABEL[next.kind]} · ${LENGTH[next.kind]} min`) : undefined}
      action={more ? { label: remind ? "Reminder on" : "Remind me", onClick: () => setRemind((r) => !r) } : undefined}
      // Wide and short: the countdown and the day on the left, the agenda beside them.
      bodyClassName={SPLIT}
    >
      <div data-main className="flex shrink-0 flex-col justify-center gap-3">
        <div className="grid shrink-0 gap-1">
          <Drop level={2}>
            {more && <Label>Starts in</Label>}
          </Drop>
          <Num value={clock} delta={`${next.day === TODAY_NAME ? "today" : next.day} ${next.time}`} deltaTone="muted" />
        </div>
        <Panel className="shrink-0">
          <DayBar agenda={agenda} />
        </Panel>
      </div>
      <Drop level={2}>
        {more && <FitTimeline items={agenda.slice(0, 3).map(agendaRow)} className="min-h-6 flex-1" />}
      </Drop>
      <Drop level={3}>
        {detailed && (
          <>
            <Rule />
            <Label>Later this week</Label>
            <Fit className="-mt-2 flex-none">
              {later.map((e) => (
                <Legend
                  key={e.id}
                  items={[
                    {
                      dot: true,
                      color: e.noTrade ? LOSS : e.kind === "news" ? GREY[1] : ACCENT,
                      label: (
                        <>
                          <span className="tabular-nums">
                            {e.day} {e.time}
                          </span>{" "}
                          <span className="text-foreground">{e.title}</span>
                        </>
                      ),
                      value: e.noTrade ? "no trade" : e.seats ?? KIND_LABEL[e.kind],
                      valueTone: e.noTrade ? "loss" : undefined,
                    },
                  ]}
                />
              ))}
            </Fit>
          </>
        )}
      </Drop>
    </WCard>
  )
}

// ---------- Market calendar (economic news + market sessions)

const IMPACT = { high: 3, medium: 2, low: 1 } as const

function sessionState(s: { open: number; close: number }, now: number) {
  const open = now >= s.open && now < s.close
  const until = open ? s.close - now : (s.open - now + 24) % 24
  return { open, until }
}

/** Three small rising bars: how much the release can move the market. Neutral; no-trade is said separately. */
function ImpactTicks({ impact = "low", big }: { impact?: CalEvent["impact"]; big?: boolean }) {
  const h = big ? [6, 10, 14] : [4, 7, 10]
  return (
    <span className="flex shrink-0 items-end gap-[2px]" style={{ height: h[2] }} aria-label={`${impact} impact`}>
      {h.map((px, i) => (
        <i key={i} className="rounded-[1px]" style={{ width: big ? 4 : 3, height: px, background: i < IMPACT[impact] ? "var(--foreground)" : TRACK }} />
      ))}
    </span>
  )
}

/** A release as a timeline row: when, impact ticks, name, forecast → previous, the no-trade mark. */
function ReleaseRow({ e, figures }: { e: CalEvent; figures?: boolean }) {
  const font = useFigureFont()
  return (
    <div className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-6">
      <span className="w-[4.25rem] shrink-0 text-muted-foreground tabular-nums @max-[15rem]:hidden" style={{ fontFamily: font }}>
        {e.day} {e.time}
      </span>
      <ImpactTicks impact={e.impact} />
      <span className={cn("min-w-0 flex-1 truncate", e.impact === "high" && "font-medium")}>{e.title}</span>
      {figures && e.forecast && (
        <span className="hidden shrink-0 text-muted-foreground tabular-nums @[20rem]:inline" style={{ fontFamily: font }}>
          <span className="text-foreground">{e.forecast}</span> / {e.previous}
        </span>
      )}
      {e.noTrade && (
        <span className="flex shrink-0 items-center gap-1" style={{ color: LOSS_TEXT }}>
          <i className="r-dot size-[7px]" style={{ background: LOSS }} />
          <span className="hidden @[17rem]:inline">no trade</span>
        </span>
      )}
    </div>
  )
}

/** The sessions open right now, as the header chip. */
function OpenChip() {
  const open = MARKET_SESSIONS.filter((s) => sessionState(s, NOW_HOUR).open)
  return <Chip>{open.length ? `${open.map((s) => s.name).join(" · ")} open` : "Markets closed"}</Chip>
}

/** The week as 2-hour ticks (06–22 each day): releases by impact, no-trade in the loss colour, now taller. */
function WeekBar({ news }: { news: CalEvent[] }) {
  const PER = 8
  const mark = (i: number) => {
    const day = WEEK[Math.floor(i / PER)]
    const from = 6 + (i % PER) * 2
    const ev = news.find((e) => e.day === day && overlaps(toHour(e.time), 0.5, from, from + 2))
    if (ev) return ev.noTrade ? LOSS : ev.impact === "high" ? "var(--warning)" : GREY[1]
    if (day === TODAY_NAME && from + 2 <= NOW_HOUR) return GREY[2]
    return undefined
  }
  return (
    <div className="grid shrink-0 gap-1">
      <TickBar value={0} segments={WEEK.length * PER} mark={mark} now={Math.floor((NOW_HOUR - 6) / 2)} />
      <div className="grid grid-cols-5 text-center">
        {WEEK.map((d) => (
          <Label key={d}>{d}</Label>
        ))}
      </div>
    </div>
  )
}

/**
 * Market calendar: next (the next big release with a week of impact ticks),
 * week (this week's releases as impact rows), sessions (Sydney, Tokyo, London,
 * New York as tick bars over 24 hours with a now line).
 */
export function EconNews({ variant = "next" }: WidgetProps) {
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  if (empty) return <NothingPlanned news />
  const news = EVENTS.filter((e) => e.kind === "news").sort((a, b) => WEEK.indexOf(a.day) - WEEK.indexOf(b.day) || a.time.localeCompare(b.time))
  const big = news.find((e) => e.impact === "high")!
  const noTrade = news.filter((e) => e.noTrade)
  // The no-trade count is in the chip or the rows; the context line stays short enough to read whole.
  const meta = `This week · ${news.length} releases`

  if (variant === "sessions") {
    const now = NOW_HOUR
    const open = MARKET_SESSIONS.filter((s) => sessionState(s, now).open)
    const cols = cn("grid grid-cols-[3.75rem_1fr] items-center gap-x-2.5 @max-[15rem]:grid-cols-[3rem_1fr]", detailed && "@[20rem]:grid-cols-[3.75rem_1fr_4.5rem]")
    const london = MARKET_SESSIONS.find((s) => s.name === "London")
    const ny = MARKET_SESSIONS.find((s) => s.name === "New York")
    const overlap = london && ny ? [Math.max(london.open, ny.open), Math.min(london.close, ny.close)] : undefined
    return (
      <WCard icon={Clock} title="Market sessions" meta={`Your time zone · now ${hhmm(now)}`} chip={<OpenChip />}>
        <Drop level={2}>
          {more && (
            <Num
              size="md"
              value={open.length ? open[open.length - 1].name : "Closed"}
              delta={open.length ? `closes in ${short(sessionState(open[open.length - 1], now).until * 60)}` : undefined}
              deltaTone="accent"
            />
          )}
        </Drop>
        <div className="grid shrink-0 gap-1">
          {MARKET_SESSIONS.map((s) => {
            const st = sessionState(s, now)
            return (
              <div key={s.name} className={cols}>
                <span className={cn("truncate text-[0.6875rem] leading-4", st.open ? "font-medium" : "text-muted-foreground")}>{s.name}</span>
                <TickBar
                  value={0}
                  segments={48}
                  height={8}
                  now={now * 2}
                  mark={(i) => (overlaps(s.open, s.close - s.open, i / 2, i / 2 + 0.5) ? (st.open ? ACCENT : GREY[2]) : undefined)}
                />
                {detailed && (
                  <span className="hidden text-right text-[0.6875rem] leading-4 text-muted-foreground tabular-nums @[20rem]:inline">
                    {st.open ? "closes" : "opens"} {short(st.until * 60)}
                  </span>
                )}
              </div>
            )
          })}
          <Drop level={3}>
            {more && (
              <div className={cols}>
                <span />
                <Axis labels={["00", "06", "12", "18", "24"]} />
              </div>
            )}
          </Drop>
        </div>
        <Drop level={2}>
          {more && overlap && (
            <Legend
              className="shrink-0"
              items={[
                { color: ACCENT, label: "Open now", value: open.map((s) => s.name).join(", ") || "none" },
                ...(detailed ? [{ color: GREY[2], label: "London · New York overlap", value: `${hhmm(overlap[0])}–${hhmm(overlap[1])}` }] : []),
              ]}
            />
          )}
        </Drop>
        <Drop level={3}>
          {detailed && (
            <>
              <Rule />
              <ReleaseRow e={big} />
            </>
          )}
        </Drop>
      </WCard>
    )
  }

  if (variant === "week") {
    const list = more ? news : news.filter((e) => e.impact === "high")
    return (
      <WCard icon={Newspaper} title="Market calendar" meta={meta} chip={<OpenChip />}>
        <Num size="md" value={`${news.length} releases`} delta={`${noTrade.length} no-trade`} deltaTone="loss" />
        {detailed && <WeekBar news={news} />}
        <Fit>
          {list.map((e) => (
            <ReleaseRow key={e.id} e={e} figures={detailed} />
          ))}
        </Fit>
      </WCard>
    )
  }

  if (variant === "timeline") {
    const days = WEEK.filter((d) => news.some((e) => e.day === d))
    const shown = more ? news : news.filter((e) => e.impact === "high")
    const rail: RailItem[] = [{ now: "Mon" }]
    for (const d of days) {
      const evs = shown.filter((e) => e.day === d)
      if (!evs.length) continue
      rail.push({ group: `${d} ${evs[0].date.split(" ")[0]}` })
      for (const e of evs)
        rail.push({
          time: e.time,
          title: e.title,
          state: e.id === big.id ? "next" : "ahead",
          color: e.noTrade ? LOSS : undefined,
          sub: more && (e.forecast || e.noTrade) ? [e.noTrade && "no trade", detailed && e.forecast && `Forecast ${e.forecast} · Prior ${e.previous}`].filter(Boolean).join(" · ") || undefined : undefined,
          aside: <ImpactTicks impact={e.impact} />,
        })
    }
    return (
      <WCard icon={Newspaper} title="Market calendar" meta={meta} chip={<Chip tone="loss">{`${noTrade.length} no-trade`}</Chip>}>
        <Rail items={rail} />
      </WCard>
    )
  }

  // next
  const others = news.filter((e) => e.id !== big.id)
  return (
    <WCard icon={Newspaper} title="Market calendar" meta={meta} chip={<OpenChip />}>
      <div className="grid shrink-0 gap-1">
        <Label>Next high impact</Label>
        <Num value={big.title} delta={`in ${short(big.inMinutes ?? 0)}`} deltaTone="accent" />
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2 text-[0.6875rem] leading-5" style={{ fontFamily: font }}>
        <ImpactTicks impact={big.impact} big />
        <span className="shrink-0 whitespace-nowrap text-muted-foreground tabular-nums">
          {big.day} {big.date.split(" ")[0]} · {big.time}
        </span>
        {big.forecast && (
          <span className="hidden truncate text-muted-foreground tabular-nums @[18rem]:inline">
            · Forecast <span className="text-foreground">{big.forecast}</span> · Prior {big.previous}
          </span>
        )}
        {big.noTrade && (
          <span className="ml-auto flex shrink-0 items-center gap-1" style={{ color: LOSS_TEXT }}>
            <i className="r-dot size-[7px]" style={{ background: LOSS }} />
            no trade
          </span>
        )}
      </div>
      {more && <WeekBar news={news} />}
      {detailed && (
        <>
          <Rule />
          <Fit className="-mt-1">
            {others.map((e) => (
              <ReleaseRow key={e.id} e={e} />
            ))}
          </Fit>
        </>
      )}
    </WCard>
  )
}
