"use client"

import { useState } from "react"
import { CalendarClock, MessageSquareReply } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { CALL_ALLOWANCE, CALL_SLOTS, FEEDBACK } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, ACCENT_TEXT, Avatar, Drop, FX, GROW_ROWS, useFrame, useMore } from "./kit"
import { Chip, GREY, HatchBar, Label, Legend, Num, Rule, WCard, useFigureFont } from "./instrument"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"
import { CoachPhoto } from "./brand"
import { Rail, SplitCard } from "./layouts"

/** An empty tick or track (same as instrument.tsx). */
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"
const HATCH = `repeating-linear-gradient(135deg, ${TRACK} 0 2px, transparent 2px 5px)`

/** A list that shows as many whole rows as fit the widget's height and hides the rest. */
function Fit({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS, className)}>{children}</div>
}

/** A one-line legend: square swatches with label and figure, side by side. Hatched swatch for "left". */
function InlineKey({ items }: { items: { color?: string; hatch?: boolean; label: string; value: React.ReactNode }[] }) {
  const font = useFigureFont()
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.8125rem] leading-5">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5 whitespace-nowrap">
          <i className="size-2 shrink-0 rounded-[2px]" style={it.hatch ? { background: HATCH, boxShadow: `inset 0 0 0 1px ${TRACK}` } : { background: it.color }} />
          <span className="text-muted-foreground">{it.label}</span>
          <span className="tabular-nums" style={{ fontFamily: font }}>
            {it.value}
          </span>
        </span>
      ))}
    </div>
  )
}

// ---------- Coach feedback

/** Review status: the accent once answered, a hollow ring while it waits. */
function StatusDot({ waiting }: { waiting: boolean }) {
  return (
    <i
      className={cn("r-dot size-2 shrink-0", waiting && "border border-dashed border-[color:color-mix(in_oklab,var(--foreground)_55%,transparent)]")}
      style={waiting ? undefined : { background: ACCENT }}
    />
  )
}

/** "NQ long · −1.2R" → the trade in grey type, the R in the profit or loss colour. */
function TradeName({ trade }: { trade: string }) {
  const font = useFigureFont()
  const [name, r = ""] = trade.split(" · ")
  const loss = r.startsWith("−") || r.startsWith("-")
  return (
    <span className="min-w-0 truncate tabular-nums" style={{ fontFamily: font }}>
      {name}
      {r && <span style={{ color: loss ? "var(--loss)" : "var(--profit)" }}> {r}</span>}
    </span>
  )
}

function QueueRow({ trade, status, when }: { trade: string; status: "waiting" | "answered"; when: string }) {
  const waiting = status === "waiting"
  return (
    <div className="flex min-w-0 items-center gap-2 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1 text-[0.8125rem] leading-5 last:border-b-0">
      <StatusDot waiting={waiting} />
      <span className="flex min-w-0 flex-1">
        <TradeName trade={trade} />
      </span>
      <span className={cn("shrink-0", waiting ? "text-muted-foreground" : "")} style={waiting ? undefined : { color: ACCENT_TEXT }}>
        {waiting ? `waiting ${when}` : `answered ${when}`}
      </span>
    </div>
  )
}

/** Hours the coach took on each answered review (sample) and last month's average. */
const REPLY_HOURS = [6, 12]
const LAST_MONTH_HOURS = 12

/**
 * Coach feedback: queue (your review requests with status dots, answered vs
 * waiting), latest (the coach's newest reply as a quote), stats (answered vs
 * waiting as a hatched bar, the reply time).
 */
export function CoachFeedback({ variant = "queue" }: WidgetProps) {
  const { coach } = useCoach()
  const { fixed } = useFrame()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  if (empty)
    return <WidgetEmpty icon={MessageSquareReply} title="No reviews yet" text={`Mark a trade “Please review” in your journal and ${coach.coachName} will answer here.`} />
  const waiting = FEEDBACK.items.filter((i) => i.status === "waiting")
  const answered = FEEDBACK.items.filter((i) => i.status === "answered")
  const latest = answered[0]
  const initials = coach.coachName.slice(0, 2).toUpperCase()
  const replyChip = <Chip tone="neutral">~{FEEDBACK.avgReplyHours}h reply</Chip>
  const bar = <HatchBar parts={[{ value: FEEDBACK.answered, color: ACCENT }]} total={FEEDBACK.requested} />
  const key = (
    <InlineKey
      items={[
        { color: ACCENT, label: "answered", value: FEEDBACK.answered },
        { hatch: true, label: "waiting", value: FEEDBACK.requested - FEEDBACK.answered },
      ]}
    />
  )
  const quote = (clamp: string) => (
    <figure className="grid min-w-0 shrink-0 gap-1.5">
      <blockquote className={cn("border-l-2 pl-3 text-[0.8125rem] leading-5", clamp)} style={{ borderLeftColor: ACCENT }}>
        {latest.reply}
      </blockquote>
      <figcaption className="flex min-w-0 items-center gap-1.5 pl-3 text-[0.6875rem] leading-4 text-muted-foreground">
        <span className="truncate">{coach.coachName}</span>
        <span>·</span>
        <TradeName trade={latest.trade} />
        <span className="shrink-0">· {latest.when}</span>
      </figcaption>
    </figure>
  )

  if (variant === "latest") {
    return (
      <WCard icon={MessageSquareReply} title="Coach feedback" meta={`${coach.coachName} replied · ${latest.when}`} chip={<Chip>{waiting.length} waiting</Chip>}>
        <div className="flex min-w-0 shrink-0 gap-2.5">
          <span className="hidden @[18rem]:block">
            <Avatar initials={initials} size={24} />
          </span>
          <div className="min-w-0 flex-1">{quote(more ? "line-clamp-2" : "line-clamp-3")}</div>
        </div>
        {more && (
          <div className={cn("grid shrink-0 gap-1.5", !(detailed || fixed) && "mt-auto")}>
            {bar}
            {key}
          </div>
        )}
        {/* The earlier replies: on Detailed, and in any cell with room for them (they give way first when there isn't). */}
        {(detailed || fixed) && (
          <Drop level={3}>
            <Rule />
            <Label>Earlier</Label>
            <Fit className="-mt-2">
              {answered.slice(1).map((i) => (
                <div key={i.trade} className="grid min-w-0 gap-0.5 py-1">
                  <span className="flex min-w-0 text-[0.6875rem] leading-4">
                    <TradeName trade={i.trade} />
                    <span className="ml-auto shrink-0 pl-2 text-muted-foreground">{i.when}</span>
                  </span>
                  <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">{i.reply}</span>
                </div>
              ))}
            </Fit>
          </Drop>
        )}
      </WCard>
    )
  }

  if (variant === "thread") {
    /** "5 hours" → "5h", "yesterday" → "1d", "3 days ago" → "3d". */
    const ago = (w: string) => (w === "yesterday" ? "1d" : w.replace(/(\d+) (\w).*/, "$1$2"))
    /** Age in hours, to list the newest first. */
    const hours = (w: string) => (w === "yesterday" ? 24 : parseInt(w) * (/hour/.test(w) ? 1 : 24))
    const shown = (more ? FEEDBACK.items : waiting).slice().sort((a, b) => hours(a.when) - hours(b.when))
    return (
      <WCard icon={MessageSquareReply} title="Coach feedback" meta={`Your trade reviews · ${coach.coachName} replies in ~${FEEDBACK.avgReplyHours}h`} chip={<Chip>{waiting.length} waiting</Chip>}>
        <Rail
          newestFirst
          items={[
            { now: "" },
            ...shown.map((i) => ({
              time: ago(i.when),
              title: <TradeName trade={i.trade} />,
              state: (i.status === "answered" ? "past" : "ahead") as "past" | "ahead",
              color: i.status === "answered" ? ACCENT : undefined,
              sub: i.status === "answered" ? (detailed || i === latest ? `${coach.coachName}: “${i.reply}”` : undefined) : `Waiting for ${coach.coachName}`,
            })),
          ]}
        />
      </WCard>
    )
  }

  if (variant === "stats") {
    return (
      <WCard icon={MessageSquareReply} title="Coach feedback" meta={`Your reviews this month · ${coach.coachName}`} chip={replyChip}>
        {detailed && <Num value={`${FEEDBACK.avgReplyHours}h`} unit="avg reply" delta={`−${LAST_MONTH_HOURS - FEEDBACK.avgReplyHours}h vs Sep`} deltaTone="profit" />}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="min-w-0 flex-1">{bar}</div>
          <span className="shrink-0 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
            {FEEDBACK.answered}/{FEEDBACK.requested} <span className="text-muted-foreground">answered</span>
          </span>
        </div>
        {detailed && (
          <>
            <Legend
              className="shrink-0"
              items={[
                ...REPLY_HOURS.map((h, i) => ({ color: GREY[1], label: answered[i]?.trade ?? "Review", value: `${h}h` })),
                { color: TRACK, label: "Waiting the longest", value: waiting[0]?.when ?? "–" },
              ]}
            />
          </>
        )}
      </WCard>
    )
  }

  // queue: compact = what's waiting; standard = + the answered/waiting bar and answered rows; detailed = + the latest reply as a quote
  const list = more ? [...waiting, ...answered] : waiting
  return (
    <WCard icon={MessageSquareReply} title="Coach feedback" meta={`Your trade reviews · ${coach.coachName} replies in ~${FEEDBACK.avgReplyHours}h`} chip={<Chip>{waiting.length} waiting</Chip>}>
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <Num size="md" value={`${FEEDBACK.answered}/${FEEDBACK.requested}`} unit="answered" />
        {more && <div className="hidden min-w-0 flex-1 @[16rem]:block">{bar}</div>}
      </div>
      <Fit>
        {list.map((i) => (
          <QueueRow key={i.trade} {...i} />
        ))}
      </Fit>
      {detailed && (
        <>
          <Rule />
          {quote("line-clamp-2")}
        </>
      )}
    </WCard>
  )
}

// ---------- AI insight

// ---------- Book a 1:1

/**
 * Book a 1:1: slots (free times as chips in day columns, the month's
 * allowance as a hatched bar), next (the next free time with one button),
 * allowance (calls used, booked and left).
 */
export function BookCall({ variant = "slots" }: WidgetProps) {
  const { coach } = useCoach()
  const { emphasis } = useFrame()
  const font = useFigureFont()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const [picked, setPicked] = useState<string>()
  const days = empty ? CALL_SLOTS.map((d) => ({ ...d, times: [] })) : CALL_SLOTS
  const free = days.flatMap((d) => d.times.map((t) => ({ ...d, time: t })))
  const next = free[0]
  const booked = picked ? 1 : 0
  const left = Math.max(0, CALL_ALLOWANCE.included - CALL_ALLOWANCE.used - booked)
  const book = (label: string) => {
    setPicked(label)
    toast.success(`Booked: ${label} with ${coach.coachName}`, { description: "Added to your calendar. (Prototype)" })
  }

  if (!next) return <WidgetEmpty icon={CalendarClock} title="No free times this week" text={`${coach.coachName} opens new 1:1 times every Sunday.`} />

  const meta = `${CALL_ALLOWANCE.length}-min calls with ${coach.coachName}`
  const leftChip = <Chip tone={left ? "accent" : "neutral"}>{`${left} of ${CALL_ALLOWANCE.included} left`}</Chip>
  const allowanceBar = (
    <HatchBar
      parts={[
        { value: CALL_ALLOWANCE.used, color: GREY[1] },
        { value: booked, color: ACCENT },
      ].filter((p) => p.value > 0)}
      total={CALL_ALLOWANCE.included}
    />
  )
  const allowanceKey = (
    <InlineKey
      items={[
        { color: GREY[1], label: "used", value: CALL_ALLOWANCE.used },
        { color: ACCENT, label: "booked", value: booked },
        { hatch: true, label: "left", value: left },
      ]}
    />
  )

  const slot = (label: string, time: string, wide?: boolean) => {
    const on = picked === label
    return (
      <button
        key={label}
        onClick={() => book(label)}
        disabled={!on && left === 0}
        className={cn(
          "r-chip flex h-6 shrink-0 items-center justify-center border px-1.5 text-[0.6875rem] leading-none whitespace-nowrap tabular-nums transition-[background-color,border-color,scale] duration-150 ease-out hover:border-foreground/40 hover:bg-muted active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
          FX.focus,
          wide && "w-full",
        )}
        style={{
          fontFamily: font,
          ...(on ? { borderColor: ACCENT, color: ACCENT_TEXT, background: `color-mix(in oklab, ${ACCENT} 13%, transparent)` } : { borderColor: "color-mix(in oklab, var(--foreground) 16%, transparent)" }),
        }}
      >
        {on ? `✓ ${time}` : time}
      </button>
    )
  }

  if (variant === "split") {
    const label = `${next.day} ${next.time}`
    return (
      <SplitCard
        panel={
          <>
            <CoachPhoto className="absolute inset-0 rounded-none" />
            <span data-split-narrow="hide" className="absolute bottom-2 left-2">
              <Chip tone="neutral">{`${CALL_ALLOWANCE.length} min`}</Chip>
            </span>
          </>
        }
      >
        <div className="grid min-w-0 shrink-0 gap-0.5">
          <span className="truncate text-[0.8125rem] leading-5 font-medium">1:1 with {coach.coachName}</span>
          {more && <span className="line-clamp-2 text-[0.6875rem] leading-4 text-muted-foreground @max-[22rem]:hidden">Your trades, your questions · {left} of {CALL_ALLOWANCE.included} left this month</span>}
        </div>
        <div className="grid shrink-0 gap-0.5">
          <Label>Next free</Label>
          <Num size="md" value={label} delta={next.date} deltaTone="muted" />
        </div>
        {detailed && <div className="flex min-w-0 flex-wrap gap-1">{free.slice(1, 4).map((f) => slot(`${f.day} ${f.time}`, `${f.day} ${f.time}`))}</div>}
        <Button size="sm" variant={emphasis === "quiet" ? "outline" : "default"} className="mt-auto w-fit" disabled={!picked && left === 0} onClick={() => book(label)}>
          {picked === label ? "Booked" : `Book ${label}`}
        </Button>
      </SplitCard>
    )
  }

  if (variant === "allowance") {
    return (
      <WCard icon={CalendarClock} title="1:1 calls" meta={`${meta} · October`} chip={leftChip}>
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <div className="min-w-0 flex-1">{allowanceBar}</div>
          <span className="shrink-0 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
            {left} <span className="text-muted-foreground">left · next {next.day} {next.time}</span>
          </span>
        </div>
        {detailed && (
          <>
            {allowanceKey}
            <Rule />
            <Label>Free this week</Label>
            <div className="-mt-1.5 flex min-w-0 flex-wrap gap-1">{free.slice(0, 6).map((f) => slot(`${f.day} ${f.time}`, `${f.day} ${f.time}`))}</div>
          </>
        )}
      </WCard>
    )
  }

  if (variant === "next") {
    const label = `${next.day} ${next.time}`
    return (
      <WCard icon={CalendarClock} title={`1:1 with ${coach.coachName}`} meta={`${meta} · next free time`} chip={leftChip}>
        <div className="flex min-w-0 shrink-0 items-end gap-3">
          <div className="grid min-w-0 flex-1 gap-1">
            <Label>Next free</Label>
            <Num size="md" value={label} delta={`${next.date} · ${CALL_ALLOWANCE.length}m`} deltaTone="muted" />
          </div>
          <Button size="sm" variant={emphasis === "quiet" ? "outline" : "default"} className="hidden shrink-0 @[15rem]:inline-flex" disabled={!picked && left === 0} onClick={() => book(label)}>
            {picked === label ? "Booked" : "Book"}
          </Button>
        </div>
        {more && (
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="min-w-0 flex-1">{allowanceBar}</div>
            <span className="shrink-0 text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
              {left} of {CALL_ALLOWANCE.included} left
            </span>
          </div>
        )}
        {detailed && (
          <>
            {allowanceKey}
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              <Label className="mr-1">Or</Label>
              {free.slice(1, 5).map((f) => slot(`${f.day} ${f.time}`, `${f.day} ${f.time}`))}
            </div>
          </>
        )}
      </WCard>
    )
  }

  // slots: compact = the day columns of free times; standard = + the allowance bar and key; detailed = + the next free time line
  const shown = more ? days : days.filter((d) => d.times.length > 0)
  return (
    <WCard icon={CalendarClock} title="Book a 1:1" meta={`${meta} · ${free.length} free times this week`} chip={leftChip}>
      <div className="grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((d) => (
          <div key={d.day} className="flex min-h-0 min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-baseline gap-1">
              <Label className={cn(d.times.length && "text-foreground")}>{d.day}</Label>
              <span className="text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
                {d.date.split(" ")[0]}
              </span>
            </div>
            {/* Whole times only: the later ones wrap out of sight on a short card. */}
            <div className="flex min-h-0 flex-1 flex-col flex-wrap content-start gap-1 overflow-hidden *:w-full">
              {d.times.length === 0 ? (
                <span
                  className="r-chip flex h-6 shrink-0 items-center justify-center text-[0.6875rem] leading-none text-muted-foreground"
                  style={{ background: HATCH, boxShadow: `inset 0 0 0 1px ${TRACK}` }}
                >
                  full
                </span>
              ) : (
                d.times.map((t) => slot(`${d.day} ${t}`, t, true))
              )}
            </div>
          </div>
        ))}
      </div>
      <Drop level={2}>
        {more && (
          <div className="grid shrink-0 gap-1.5">
            {allowanceBar}
            {allowanceKey}
          </div>
        )}
      </Drop>
      <Drop level={3}>
        {detailed && (
          <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">
            Next free: <span className="text-foreground tabular-nums">{next.day} {next.date} · {next.time}</span> · invites go to your calendar
          </span>
        )}
      </Drop>
    </WCard>
  )
}

// ---------- Next unlock
