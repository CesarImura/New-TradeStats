"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarPlus, Check, Video } from "@/components/icons"
import { toast } from "sonner"
import { OnbFrame, OnbTitle, mono } from "@/components/onboarding/frame"
import { Button } from "@/components/ui/button"
import { setAccount } from "@/lib/data/communities"
import { useAccount } from "@/lib/data/use-communities"
import { cn } from "@/lib/utils"

/** The prototype's "today" is Monday 12 October; calls start the next working day. */
const DAYS = [
  { id: "tue", label: "Tue", date: "13 Oct", times: ["10:00", "11:30", "15:00", "16:30"] },
  { id: "wed", label: "Wed", date: "14 Oct", times: ["09:30", "14:00", "17:00"] },
  { id: "thu", label: "Thu", date: "15 Oct", times: ["10:00", "13:30"] },
  { id: "fri", label: "Fri", date: "16 Oct", times: [] },
  { id: "mon", label: "Mon", date: "19 Oct", times: ["09:00", "10:30", "15:30", "17:00"] },
]

const PREPARE = [
  "A draft platform in your colours, with your logo",
  "Your tiers and prices, copied from where you sell today",
  "A plan to move your students without losing anyone",
]

/**
 * ONB-05 · Free setup call, for big communities and coaches switching
 * platforms. ONB-06 · Call booked, with the door into the demo workspace.
 */
export default function Call() {
  const router = useRouter()
  const acc = useAccount()
  const [day, setDay] = useState(DAYS[0].id)
  const [time, setTime] = useState<string>()
  const booked = acc?.call
  const d = DAYS.find((x) => x.id === day)!

  const selfServe = (
    <Link
      href="/setup"
      onClick={() => setAccount({ route: "C" })}
      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      I&apos;d rather set it up myself
    </Link>
  )

  if (booked) {
    return (
      <OnbFrame>
        <div className="grid gap-8">
          <div className="grid size-12 place-items-center bg-[var(--ts-cta)] text-[#040404]">
            <Check className="size-6" strokeWidth={2.5} />
          </div>
          <OnbTitle
            eyebrow="Call booked"
            title={
              <>
                {booked.date}, {booked.time}.<br />
                See you there.
              </>
            }
            text={`45 minutes on video with Lea from our onboarding team. The invite is on its way to ${acc?.email ?? "your inbox"}.`}
          />
          <div className="flex flex-wrap gap-2">
            {["Google Calendar", "Outlook", "Apple (.ics)"].map((c) => (
              <Button key={c} variant="outline" size="sm" onClick={() => toast(`Added to ${c}. (Prototype)`)}>
                <CalendarPlus /> {c}
              </Button>
            ))}
          </div>
          <div className="grid gap-3 border-t pt-6">
            <span className={cn(mono, "text-muted-foreground")}>What we&apos;ll have ready</span>
            <ul className="grid gap-2 text-sm">
              {PREPARE.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-[var(--ts-interactive)]" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3">
            <Button
              size="lg"
              className="h-12 justify-between px-4 text-[0.95rem]"
              onClick={() => {
                setAccount({ step: 0 })
                router.push("/admin/northline")
              }}
            >
              Look around a demo platform until then <ArrowRight />
            </Button>
            <div className="flex flex-wrap justify-between gap-3">
              <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setAccount({ call: undefined })}>
                Change time
              </button>
              {selfServe}
            </div>
          </div>
        </div>
      </OnbFrame>
    )
  }

  return (
    <OnbFrame>
      <div className="grid gap-8">
        <OnbTitle
          eyebrow="Free · white-glove setup"
          title="Let us set it up with you."
          text="With a community your size, a 45-minute call is the fastest way in. We build the platform with you and move your students over — free."
        />

        <div className="grid gap-4">
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Day">
            {DAYS.map((x) => (
              <button
                key={x.id}
                role="radio"
                aria-checked={day === x.id}
                disabled={!x.times.length}
                onClick={() => {
                  setDay(x.id)
                  setTime(undefined)
                }}
                className={cn(
                  "grid gap-0.5 rounded-[var(--radius)] border py-2.5 text-center transition-colors hover:border-white/25 disabled:opacity-35 disabled:hover:border-border",
                  day === x.id && "border-[var(--ts-interactive)] hover:border-[var(--ts-interactive)]",
                )}
              >
                <span className={cn(mono, day === x.id ? "text-[var(--ts-interactive)]" : "text-muted-foreground")}>{x.label}</span>
                <span className="text-sm tabular-nums">{x.date.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Time">
            {d.times.map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={time === t}
                onClick={() => setTime(t)}
                className={cn(
                  "rounded-[var(--radius)] border py-2.5 text-sm tabular-nums transition-colors hover:border-white/25",
                  time === t && "border-[var(--ts-cta)] bg-[var(--ts-cta)] text-[#040404] hover:border-[var(--ts-cta)]",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="size-3.5" /> Video call · 45 min · times in your time zone (CEST)
          </span>
        </div>

        <div className="grid gap-4">
          <Button
            size="lg"
            className="h-12 justify-between px-4 text-[0.95rem]"
            disabled={!time}
            onClick={() => time && setAccount({ call: { date: `${d.label} ${d.date}`, time } })}
          >
            {time ? `Book ${d.label} ${d.date}, ${time}` : "Pick a time"} <ArrowRight />
          </Button>
          <div className="text-center">{selfServe}</div>
        </div>
      </div>
    </OnbFrame>
  )
}
