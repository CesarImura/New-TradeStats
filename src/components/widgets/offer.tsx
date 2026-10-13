"use client"

import Link from "next/link"
import { ArrowRight, BadgeCheck, Check, Minus, Sparkles } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { COACH_PROFILE, UPGRADE } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Caps, Head, W } from "./kit"
import { Cover, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

// ---------- Upgrade

/**
 * Upgrade: compare (your tier next to the next one), banner (brand surface), card (compact).
 * Shown only to students who have a higher tier to move to.
 */
export function Upgrade({ variant = "compare", props }: WidgetProps) {
  const { base } = useCoach()
  const { current, next, features } = UPGRADE
  const extra = features.filter((f) => !f.current)
  const cta = String(props.button || `Upgrade to ${next.name}`)

  if (variant === "banner") {
    return (
      <div className="fx-hero @container flex h-full flex-col justify-center gap-4 overflow-hidden rounded-(--radius) p-[calc(1.25rem*var(--density,1))] @xl:flex-row @xl:items-center @xl:justify-between" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="grid min-w-0 gap-1">
          <span className="text-[0.65rem] font-medium tracking-wide uppercase opacity-80">You&apos;re on {current.name}</span>
          <span className="font-heading leading-tight font-semibold text-balance" style={{ fontSize: "clamp(1.25rem, 5cqi, 1.9rem)" }}>
            {next.name}: {extra.map((f) => f.label.toLowerCase()).join(", ")}
          </span>
        </div>
        <Button variant="secondary" size="lg" className="shrink-0 self-start @xl:self-auto" {...link(`${base}/profile`)}>
          {cta} <ArrowRight />
        </Button>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={Sparkles} label={`Upgrade to ${next.name}`} right={`${next.price}/${next.cadence}`} />
        <div className="flex flex-wrap gap-1.5">
          {extra.map((f) => (
            <span key={f.label} className="r-chip flex items-center gap-1 bg-primary/10 px-2 py-1 text-xs text-primary">
              <Check className="size-3" /> {f.label}
            </span>
          ))}
        </div>
        <Button className="mt-auto w-fit" {...link(`${base}/profile`)}>
          {cta} <ArrowRight />
        </Button>
      </W>
    )
  }

  return (
    <W>
      <Head icon={Sparkles} label="Your plan" right={`${next.price}/${next.cadence}`} />
      <div className="grid flex-1 grid-cols-[1fr_auto_auto] content-start items-center gap-x-3 gap-y-2 text-sm">
        <span />
        <Caps className="text-center">{current.name}</Caps>
        <Caps className="r-chip bg-primary px-1.5 py-1 text-center text-primary-foreground">{next.name}</Caps>
        {features.map((f) => (
          <div key={f.label} className="contents">
            <span className={cn("min-w-0 truncate", !f.current && "font-medium")}>{f.label}</span>
            <span className="grid place-items-center">{f.current ? <Check className="size-4 text-muted-foreground" /> : <Minus className="size-4 text-muted-foreground/50" />}</span>
            <span className="grid place-items-center">{f.next && <Check className="size-4 text-primary" />}</span>
          </div>
        ))}
      </div>
      <Button className="w-full @[18rem]:w-fit" {...link(`${base}/profile`)}>
        {cta} <ArrowRight />
      </Button>
    </W>
  )
}

// ---------- Coach profile

function Socials() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COACH_PROFILE.socials.map((s) => (
        <a key={s} href="#" className="r-chip border px-2 py-1 text-xs hover:bg-muted">
          {s}
        </a>
      ))}
    </div>
  )
}

/** Coach profile: card (photo, title, numbers, socials), hero (large with bio), compact (one row). */
export function CoachProfile({ variant = "card" }: WidgetProps) {
  const { coach } = useCoach()
  const initials = coach.coachName.slice(0, 2).toUpperCase()
  const avatar = (size: string) => (
    <Avatar className={cn(size, "r-chip after:rounded-[inherit]")} style={{ borderRadius: "var(--r-chip)" }}>
      <AvatarFallback className="bg-primary font-heading text-primary-foreground" style={{ borderRadius: "var(--r-chip)" }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
  const name = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-heading text-lg leading-tight font-semibold">{coach.coachName}</span>
      <BadgeCheck className="size-4 shrink-0 text-primary" />
    </span>
  )

  if (variant === "compact") {
    return (
      <W className="flex-row items-center gap-3">
        {avatar("size-11")}
        <div className="grid min-w-0 flex-1 gap-0.5">
          {name}
          <span className="truncate text-xs text-muted-foreground">{COACH_PROFILE.title}</span>
        </div>
        <Button variant="secondary" size="sm" className="hidden shrink-0 @[18rem]:inline-flex">
          Message
        </Button>
      </W>
    )
  }

  if (variant === "hero") {
    return (
      <W className="p-0">
        <div className="grid h-full @xl:grid-cols-[2fr_3fr]">
          <Cover className="hidden h-full min-h-32 rounded-none @xl:block" />
          <div className="flex min-w-0 flex-col gap-3 p-[calc(1rem*var(--density,1))]">
            <div className="flex items-center gap-3">
              {avatar("size-12")}
              <div className="grid min-w-0">
                {name}
                <Caps>{COACH_PROFILE.title}</Caps>
              </div>
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">{COACH_PROFILE.bio}</p>
            <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
              <div className="flex gap-5">
                {COACH_PROFILE.stats.map((s) => (
                  <div key={s.label} className="grid gap-1">
                    <span className="font-heading text-xl leading-none font-semibold tabular-nums">{s.value}</span>
                    <Caps>{s.label}</Caps>
                  </div>
                ))}
              </div>
              <Socials />
            </div>
          </div>
        </div>
      </W>
    )
  }

  return (
    <W>
      <div className="flex items-center gap-3">
        {avatar("size-12")}
        <div className="grid min-w-0">
          {name}
          <span className="truncate text-xs text-muted-foreground">{COACH_PROFILE.title}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {COACH_PROFILE.stats.map((s) => (
          <div key={s.label} className="r-inner grid gap-1 bg-muted/60 p-2">
            <span className="font-heading text-lg leading-none font-semibold tabular-nums">{s.value}</span>
            <Caps className="truncate">{s.label}</Caps>
          </div>
        ))}
      </div>
      <div className="mt-auto">
        <Socials />
      </div>
    </W>
  )
}
