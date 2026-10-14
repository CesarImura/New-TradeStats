"use client"

import { useState } from "react"
import { CalendarClock, MessageSquareReply } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { CALL_ALLOWANCE, CALL_SLOTS, FEEDBACK } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, ACCENT_TEXT, Avatar, Big, Caps, Head, Ring, Row, TYPE, W, useFrame, useMore } from "./kit"
import { WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

// ---------- Coach feedback

/** A list that shows as many whole rows as fit the widget's height and hides the rest. */
function Fit({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", className)}>{children}</div>
}

/** Review status as a small neutral mark: hollow while waiting, filled once answered. */
function StatusDot({ waiting }: { waiting: boolean }) {
  return (
    <i
      className={cn("r-dot size-2 shrink-0", waiting ? "border border-[color:color-mix(in_oklab,var(--foreground)_45%,transparent)]" : "bg-[color:color-mix(in_oklab,var(--foreground)_55%,transparent)]")}
    />
  )
}

/**
 * Coach feedback: queue (your review requests and where they stand), latest
 * (the coach's newest reply, as a quote), stats (how many are answered, how fast).
 */
export function CoachFeedback({ variant = "queue" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  if (empty)
    return <WidgetEmpty icon={MessageSquareReply} title="No reviews yet" text={`Mark a trade “Please review” in your journal and ${coach.coachName} will answer here.`} />
  const waiting = FEEDBACK.items.filter((i) => i.status === "waiting")
  const answered = FEEDBACK.items.filter((i) => i.status === "answered")
  const latest = answered[0]
  const initials = coach.coachName.slice(0, 2).toUpperCase()

  if (variant === "latest") {
    return (
      <W>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar initials={initials} size={28} />
          <div className="grid min-w-0">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName} replied</span>
            <span className={cn(TYPE.small, "truncate tabular-nums")}>
              {latest.trade} · {latest.when}
            </span>
          </div>
        </div>
        <p className={cn(TYPE.body, "border-l-2 pl-3", detailed ? "line-clamp-2" : "line-clamp-3")} style={{ borderLeftColor: ACCENT }}>
          {latest.reply}
        </p>
        {more && !detailed && (
          <span className={cn(TYPE.small, "mt-auto truncate")}>
            {waiting.length} more waiting · usually within {FEEDBACK.avgReplyHours} hours
          </span>
        )}
        {detailed && (
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <Caps>Earlier</Caps>
            <Fit>
              {answered.slice(1).map((i) => (
                <Row key={i.trade} title={i.reply} sub={`${i.trade} · ${i.when}`} />
              ))}
            </Fit>
          </div>
        )}
      </W>
    )
  }

  if (variant === "stats") {
    return (
      <W className={cn(!detailed && "justify-center")}>
        <div className="flex min-w-0 items-center gap-3">
          <Ring value={(FEEDBACK.answered / FEEDBACK.requested) * 100} size={44} stroke={4}>
            <span className="text-xs font-medium tabular-nums">
              {FEEDBACK.answered}/{FEEDBACK.requested}
            </span>
          </Ring>
          <div className="grid min-w-0 gap-0.5">
            <span className={cn(TYPE.title, "truncate")}>
              {FEEDBACK.answered} of {FEEDBACK.requested} reviews answered
            </span>
            {more && <span className={cn(TYPE.small, "truncate")}>Usually within {FEEDBACK.avgReplyHours} hours</span>}
          </div>
        </div>
        {detailed && (
          <Fit>
            {waiting.map((i) => (
              <Row key={i.trade} avatar={<StatusDot waiting />} title={i.trade} value={<span className="text-xs text-muted-foreground">{i.when}</span>} />
            ))}
          </Fit>
        )}
      </W>
    )
  }

  // queue: compact = what's waiting; standard = plus answered; detailed = plus the reply under each answer
  const list = more ? [...waiting, ...answered] : waiting
  return (
    <W>
      <Head icon={MessageSquareReply} label="Coach feedback" value={waiting.length} unit="waiting" right={`~${FEEDBACK.avgReplyHours}h reply`} />
      <Fit>
        {list.map((i) => (
          <Row
            key={i.trade}
            avatar={<StatusDot waiting={i.status === "waiting"} />}
            title={<span className="tabular-nums">{i.trade}</span>}
            sub={detailed && i.status === "answered" ? i.reply : undefined}
            value={<span className="text-xs text-muted-foreground">{i.status === "waiting" ? `Waiting ${i.when}` : "Answered"}</span>}
          />
        ))}
      </Fit>
    </W>
  )
}

// ---------- AI insight


// ---------- Book a 1:1

/**
 * Book a 1:1: slots (free times by day, tap to book), next (the next free time
 * with one button), allowance (calls left this month).
 */
export function BookCall({ variant = "slots" }: WidgetProps) {
  const { coach } = useCoach()
  const { emphasis } = useFrame()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const [picked, setPicked] = useState<string>()
  const days = empty ? CALL_SLOTS.map((d) => ({ ...d, times: [] })) : CALL_SLOTS
  const free = days.flatMap((d) => d.times.map((t) => ({ ...d, time: t })))
  const next = free[0]
  const left = CALL_ALLOWANCE.included - CALL_ALLOWANCE.used
  const book = (label: string) => {
    setPicked(label)
    toast.success(`Booked: ${label} with ${coach.coachName}`, { description: "Added to your calendar. (Prototype)" })
  }

  if (!next) return <WidgetEmpty icon={CalendarClock} title="No free times this week" text={`${coach.coachName} opens new 1:1 times every Sunday.`} />

  const chip = (label: string, time: string) => (
    <button
      key={label}
      onClick={() => book(label)}
      className={cn("r-chip border px-2 py-1 text-xs tabular-nums transition-colors hover:border-foreground/40 hover:bg-muted", picked === label && "font-medium")}
      style={picked === label ? { borderColor: ACCENT, color: ACCENT_TEXT } : undefined}
    >
      {picked === label ? `${time} · booked` : time}
    </button>
  )

  if (variant === "allowance") {
    return (
      <W className={cn(!detailed && "justify-center")}>
        <div className="flex min-w-0 items-center gap-3">
          <Ring value={(left / CALL_ALLOWANCE.included) * 100} size={44} stroke={4}>
            <span className="text-xs font-medium tabular-nums">{left}</span>
          </Ring>
          <div className="grid min-w-0 gap-0.5">
            <span className={cn(TYPE.title, "truncate")}>
              {left} of {CALL_ALLOWANCE.included} calls left this month
            </span>
            {more && (
              <span className={cn(TYPE.small, "truncate")}>
                Next free: <span className="text-foreground tabular-nums">{next.day} {next.time}</span>
              </span>
            )}
          </div>
        </div>
        {detailed && <div className="flex min-w-0 flex-wrap gap-1">{free.slice(0, 4).map((f) => chip(`${f.day} ${f.time}`, `${f.day} ${f.time}`))}</div>}
      </W>
    )
  }

  if (variant === "next") {
    const label = `${next.day} ${next.time}`
    return (
      <W>
        <Head icon={CalendarClock} label={`1:1 with ${coach.coachName}`} right={more ? `${left} of ${CALL_ALLOWANCE.included} left` : undefined} />
        <Big value={label} sub={more ? `${next.date} · ${CALL_ALLOWANCE.length} min` : undefined} />
        {detailed && (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <Caps className="mr-1">Or</Caps>
            {free.slice(1, 4).map((f) => chip(`${f.day} ${f.time}`, `${f.day} ${f.time}`))}
          </div>
        )}
        <Button size="sm" variant={emphasis === "quiet" ? "outline" : "default"} className="mt-auto w-full @[16rem]:w-fit" onClick={() => book(label)}>
          {picked === label ? "Booked" : "Book this time"}
        </Button>
      </W>
    )
  }

  // slots: compact = the days that still have times; standard = every day; detailed = plus the allowance
  const shown = more ? days : days.filter((d) => d.times.length > 0)
  return (
    <W>
      <Head icon={CalendarClock} label="Book a 1:1" right={`${CALL_ALLOWANCE.length} min`} />
      <Fit className="gap-1.5">
        {shown.map((d) => (
          <div key={d.day} className="grid grid-cols-[2.75rem_1fr] items-center gap-2">
            <span className="grid leading-tight">
              <Caps>{d.day}</Caps>
              <span className="text-[0.6875rem] text-muted-foreground tabular-nums">{d.date.split(" ")[0]}</span>
            </span>
            <div className="flex min-w-0 flex-wrap gap-1">
              {d.times.length === 0 && <span className={TYPE.small}>Full</span>}
              {d.times.map((t) => chip(`${d.day} ${t}`, t))}
            </div>
          </div>
        ))}
      </Fit>
      {detailed && (
        <span className={cn(TYPE.small, "truncate")}>
          {left} of {CALL_ALLOWANCE.included} calls left this month
        </span>
      )}
    </W>
  )
}

// ---------- Next unlock


