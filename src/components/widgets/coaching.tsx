"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarClock, Hourglass, Lock, MessageSquareReply, Sparkles } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AI_INSIGHT, CALL_ALLOWANCE, CALL_SLOTS, FEEDBACK, UNLOCKS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Bars, Big, Caps, Head, Ring, TONE, Track, W } from "./kit"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

// ---------- Coach feedback

/** Coach feedback: queue (requests and their status), latest (the newest reply), stats (answered + reply time). */
export function CoachFeedback({ variant = "queue" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty)
    return <WidgetEmpty icon={MessageSquareReply} title="No reviews yet" text={`Mark a trade “Please review” in your journal and ${coach.coachName} will answer here.`} />
  const waiting = FEEDBACK.items.filter((i) => i.status === "waiting")
  const latest = FEEDBACK.items.find((i) => i.status === "answered")!

  if (variant === "latest") {
    return (
      <W>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-[0.65rem] text-primary-foreground">{coach.coachName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 leading-tight">
            <span className="truncate text-sm font-semibold">{coach.coachName} reviewed your trade</span>
            <Caps>{latest.when}</Caps>
          </div>
        </div>
        <p className="line-clamp-3 font-heading text-base leading-snug">“{latest.reply}”</p>
        <div className="mt-auto flex items-center gap-2">
          <span className="r-chip bg-muted px-2 py-1 text-xs tabular-nums">{latest.trade}</span>
          <span className="ml-auto text-xs text-muted-foreground">{waiting.length} waiting</span>
        </div>
      </W>
    )
  }

  if (variant === "stats") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={(FEEDBACK.answered / FEEDBACK.requested) * 100} size={72} stroke={7}>
          <span className="font-heading text-base font-semibold tabular-nums">
            {FEEDBACK.answered}/{FEEDBACK.requested}
          </span>
        </Ring>
        <div className="grid min-w-0 gap-1.5">
          <Head icon={MessageSquareReply} label="Reviews answered" />
          <span className="truncate text-sm text-muted-foreground">
            Usually within <span className="text-foreground">{FEEDBACK.avgReplyHours} hours</span>
          </span>
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={MessageSquareReply} value={waiting.length} label="Waiting for review" right={`~${FEEDBACK.avgReplyHours}h reply`} />
      <div className="grid flex-1 content-start gap-2">
        {FEEDBACK.items.map((i) => (
          <div key={i.trade} className="flex min-w-0 items-center gap-2.5">
            <i className={cn("r-dot size-2 shrink-0", i.status === "waiting" ? "bg-amber-500" : "bg-profit")} />
            <span className="min-w-0 flex-1 truncate text-sm tabular-nums">{i.trade}</span>
            <Caps className="shrink-0">{i.status === "waiting" ? i.when : "Answered"}</Caps>
          </div>
        ))}
      </div>
    </W>
  )
}

// ---------- AI insight

/** AI insight: chart (sentence + R by hour), card (sentence + suggested lesson), compact (one line). */
export function AiInsight({ variant = "chart" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Sparkles} title="Insights appear after 20 trades" text={`${coach.wording.ai} looks for patterns in your journal.`} />

  if (variant === "compact") {
    return (
      <W className="flex-row items-center gap-3">
        <span className="r-chip grid size-9 shrink-0 place-items-center bg-primary/12">
          <Sparkles className="size-4 text-primary" />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-semibold">{AI_INSIGHT.title}</span>
          <span className="truncate text-xs text-muted-foreground">{AI_INSIGHT.text}</span>
        </div>
      </W>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={Sparkles} label={coach.wording.ai} right="Insight" />
        <span className="font-heading text-xl leading-snug font-semibold text-balance">{AI_INSIGHT.title}</span>
        <p className="line-clamp-2 text-sm text-muted-foreground">{AI_INSIGHT.text}</p>
        <Button variant="secondary" size="sm" className="mt-auto w-fit" {...link(`${base}/courses`)}>
          Watch “{AI_INSIGHT.lesson}” <ArrowRight />
        </Button>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Sparkles} label={coach.wording.ai} right="From your journal" />
      <span className="font-heading text-lg leading-snug font-semibold text-balance">{AI_INSIGHT.title}</span>
      <Bars diverging values={AI_INSIGHT.r} labels={AI_INSIGHT.hours} tips={AI_INSIGHT.hours.map((h) => `${h}:00`)} format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`} />
    </W>
  )
}

// ---------- Book a 1:1

/** Book a 1:1: slots (free times by day), next (the next free time), allowance (calls left this month), brand (next, on the coach's colour). */
export function BookCall({ variant = "slots" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const [picked, setPicked] = useState<string>()
  const days = empty ? CALL_SLOTS.map((d) => ({ ...d, times: [] })) : CALL_SLOTS
  const next = days.flatMap((d) => d.times.map((t) => ({ ...d, time: t })))[0]
  const left = CALL_ALLOWANCE.included - CALL_ALLOWANCE.used
  const book = (label: string) => {
    setPicked(label)
    toast.success(`Booked: ${label} with ${coach.coachName}`, { description: "Added to your calendar. (Prototype)" })
  }

  if (!next) return <WidgetEmpty icon={CalendarClock} title="No free times this week" text={`${coach.coachName} opens new 1:1 times every Sunday.`} />

  if (variant === "allowance") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={(CALL_ALLOWANCE.used / CALL_ALLOWANCE.included) * 100} size={72} stroke={7}>
          <span className="font-heading text-base font-semibold tabular-nums">{left}</span>
        </Ring>
        <div className="grid min-w-0 gap-1.5">
          <Head icon={CalendarClock} label={`1:1 calls left`} />
          <span className="truncate text-sm text-muted-foreground">
            Next free: <span className="text-foreground">{next.day} {next.time}</span>
          </span>
        </div>
      </W>
    )
  }

  if (variant === "next" || variant === "brand") {
    return (
      <W brand={variant === "brand"}>
        <Head icon={CalendarClock} label={`1:1 with ${coach.coachName}`} right={`${left} of ${CALL_ALLOWANCE.included} left`} />
        <Big value={`${next.day} ${next.time}`} sub={`${next.date} · ${CALL_ALLOWANCE.length} min`} />
        <Button className="mt-auto w-full @[16rem]:w-fit" onClick={() => book(`${next.day} ${next.time}`)}>
          {picked ? "Booked" : "Book this time"}
        </Button>
      </W>
    )
  }

  return (
    <W>
      <Head icon={CalendarClock} label={`Book a 1:1 · ${CALL_ALLOWANCE.length} min`} right={`${left} left`} />
      <div className="grid flex-1 content-evenly gap-2">
        {days.map((d) => (
          <div key={d.day} className="grid grid-cols-[2.5rem_1fr] items-center gap-2">
            <span className="grid leading-tight">
              <Caps>{d.day}</Caps>
              <span className="text-[0.65rem] text-muted-foreground tabular-nums">{d.date.split(" ")[0]}</span>
            </span>
            <div className="flex min-w-0 flex-wrap gap-1">
              {d.times.length === 0 && <span className="text-xs text-muted-foreground">Full</span>}
              {d.times.map((t) => {
                const label = `${d.day} ${t}`
                return (
                  <button
                    key={t}
                    onClick={() => book(label)}
                    className={cn("r-chip border px-2 py-1 text-xs tabular-nums transition-colors hover:border-primary hover:text-primary", picked === label && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground")}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </W>
  )
}

// ---------- Next unlock

/** Next unlock: countdown (time until the next module opens), schedule (the next three), card (compact). */
export function NextUnlock({ variant = "countdown" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <WidgetEmpty icon={Lock} title="Everything is unlocked" text={`New ${coach.wording.courses.toLowerCase()} content appears here when it's scheduled.`} />
  const [first] = UNLOCKS
  const days = Math.floor(first.inHours / 24)
  const hours = first.inHours % 24

  if (variant === "schedule") {
    const horizon = UNLOCKS.at(-1)!.inHours
    return (
      <W>
        <Head icon={Hourglass} label="Coming up" right={coach.wording.courses} />
        <div className="grid flex-1 content-evenly gap-3">
          {UNLOCKS.map((u, i) => (
            <div key={u.title} className="grid gap-1">
              <div className="flex min-w-0 items-baseline gap-2 text-sm">
                <span className="truncate">{u.title}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{u.date}</span>
              </div>
              <Track value={100 - (u.inHours / horizon) * 100} color={i === 0 ? TONE.primary : `color-mix(in oklab, ${TONE.primary} 35%, var(--muted))`} className="h-1" />
            </div>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "card") {
    return (
      <W className="flex-row items-center gap-3">
        <span className="r-chip grid size-9 shrink-0 place-items-center bg-muted">
          <Lock className="size-4 text-muted-foreground" />
        </span>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-semibold">{first.title}</span>
          <span className="truncate text-xs text-muted-foreground">Unlocks in {inWords(first.inHours * 60)} · {first.lessons} lessons</span>
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Hourglass} label="Next unlock" right={first.date} />
      <div className="flex items-end gap-3 font-heading tabular-nums">
        {[
          [days, "days"],
          [hours, "hours"],
        ].map(([v, l]) => (
          <div key={l} className="grid gap-1">
            <span className="leading-none font-semibold" style={{ fontSize: "clamp(1.75rem, 14cqi, 3rem)" }}>
              {String(v).padStart(2, "0")}
            </span>
            <Caps>{l}</Caps>
          </div>
        ))}
      </div>
      <div className="mt-auto grid min-w-0 gap-0.5">
        <span className="truncate text-sm font-medium">{first.title}</span>
        <span className="text-xs text-muted-foreground">{first.lessons} lessons</span>
      </div>
    </W>
  )
}
