"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Minus, Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COACH_PROFILE, UPGRADE } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { CoachPhoto } from "./brand"
import { Big, Caps, Head, Stat, TYPE, W, useMore } from "./kit"
import type { WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

const HAIRLINE = "border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)]"

// ---------- Upgrade

/**
 * Upgrade: compare (your tier next to the next one), banner (one line with the button), card (the price and what it adds).
 * Shown only to students who have a higher tier to move to. The button is the accent.
 */
export function Upgrade({ variant = "compare", props }: WidgetProps) {
  const { base } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const { current, next, features } = UPGRADE
  const extra = features.filter((f) => !f.current)
  const cta = (
    <Button size="sm" className="w-fit shrink-0" {...link(`${base}/profile`)}>
      {String(props.button || `Upgrade to ${next.name}`)} <ArrowRight />
    </Button>
  )
  const price = `${next.price} a ${next.cadence}`

  if (variant === "banner") {
    return (
      <W className="justify-center gap-2 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-6">
        <div className="grid min-w-0 gap-1">
          <Caps className="truncate">
            You&apos;re on {current.name}
            {detailed && ` · ${next.name} is ${price}`}
          </Caps>
          <span className={cn(TYPE.value, "truncate @xl:line-clamp-2 @xl:whitespace-normal")}>
            {more ? `${next.name}: ${extra.map((f) => f.label.toLowerCase()).join(", ")}` : `Move up to ${next.name}`}
          </span>
        </div>
        {cta}
      </W>
    )
  }

  if (variant === "card") {
    return (
      <W>
        <Head icon={Sparkles} label={`Upgrade to ${next.name}`} />
        <Big value={next.price} unit={`/ ${next.cadence}`} sub={detailed ? `You're on ${current.name} (${current.price})` : undefined} />
        {detailed ? (
          <ul className="grid gap-1">
            {extra.map((f) => (
              <li key={f.label} className={cn(TYPE.body, "flex min-w-0 items-center gap-2")}>
                <Check className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          more && <span className={cn(TYPE.small, "line-clamp-2")}>Adds {extra.map((f) => f.label.toLowerCase()).join(", ")}.</span>
        )}
        <div className="mt-auto">{cta}</div>
      </W>
    )
  }

  const rows = more ? features : extra
  return (
    <W>
      <Head icon={Sparkles} label="Your plan" right={price} />
      <div className={cn(TYPE.body, "grid flex-1 grid-cols-[minmax(0,1fr)_auto_auto] content-start items-stretch")}>
        <span />
        <Caps className="px-3 pt-1 pb-2 text-center">{current.name}</Caps>
        <span className="rounded-t-[min(var(--radius),6px)] bg-muted px-3 pt-1 pb-2 text-center">
          <Caps className="text-foreground">{next.name}</Caps>
        </span>
        {rows.map((f, i) => {
          const last = i === rows.length - 1
          return (
            <div key={f.label} className="contents">
              <span className={cn("min-w-0 truncate border-b py-1.5", HAIRLINE, last && "border-b-0", !f.current && "font-medium")}>{f.label}</span>
              <span className={cn("grid place-items-center border-b px-3", HAIRLINE, last && "border-b-0")}>
                {f.current ? <Check className="size-3.5 text-muted-foreground" /> : <Minus className="size-3.5 text-muted-foreground/50" />}
              </span>
              <span className={cn("grid place-items-center bg-muted px-3", last && "rounded-b-[min(var(--radius),6px)]")}>{f.next && <Check className="size-3.5 text-foreground" />}</span>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {cta}
        {detailed && <span className={TYPE.small}>Cancel anytime</span>}
      </div>
    </W>
  )
}

// ---------- Coach profile

function Socials() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {COACH_PROFILE.socials.map((s) => (
        <a key={s} href="#" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
          {s} <ArrowUpRight className="size-3" />
        </a>
      ))}
    </div>
  )
}

function Stats({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {COACH_PROFILE.stats.map((s) => (
        <Stat key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  )
}

/**
 * Coach profile: card (photo, title, numbers, socials), hero (a large photo beside the bio), compact (one row with Message).
 * The verified mark (or the Message button) is the accent.
 */
export function CoachProfile({ variant = "card" }: WidgetProps) {
  const { coach } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const verified = (accent: boolean) => <BadgeCheck className={cn("size-4 shrink-0", accent ? "text-[color:var(--w-accent,var(--primary))]" : "text-muted-foreground")} />

  if (variant === "compact") {
    return (
      <W className="flex-row items-center gap-3">
        <CoachPhoto className="size-10" />
        <div className="grid min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName}</span>
            {verified(false)}
          </span>
          <span className={cn(TYPE.small, "truncate")}>{detailed ? `${COACH_PROFILE.title} · ${COACH_PROFILE.stats[0].value} ${COACH_PROFILE.stats[0].label.toLowerCase()}` : COACH_PROFILE.title}</span>
        </div>
        {more && (
          <Button size="sm" className="hidden shrink-0 @[18rem]:inline-flex">
            Message
          </Button>
        )}
      </W>
    )
  }

  if (variant === "hero") {
    return (
      <W className="gap-0 p-0 @xl:flex-row">
        <CoachPhoto className="hidden w-2/5 rounded-none @xl:block" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-[calc(1rem*var(--density,1))]">
          <div className="flex min-w-0 items-center gap-3">
            <CoachPhoto className="size-10 @xl:hidden" />
            <div className="grid min-w-0 gap-0.5">
              <Caps>Your coach</Caps>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn(TYPE.valueLg, "truncate")}>{coach.coachName}</span>
                {verified(true)}
              </span>
              <span className={cn(TYPE.small, "truncate")}>{COACH_PROFILE.title}</span>
            </div>
          </div>
          {more && <p className={cn(TYPE.body, "line-clamp-3 font-heading text-muted-foreground")}>“{COACH_PROFILE.bio}”</p>}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
            <Stats className="max-w-xs flex-1" />
            {detailed && <Socials />}
          </div>
        </div>
      </W>
    )
  }

  return (
    <W>
      <div className="flex min-w-0 items-center gap-3">
        <CoachPhoto className="size-12" />
        <div className="grid min-w-0">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={cn(TYPE.value, "truncate")}>{coach.coachName}</span>
            {verified(true)}
          </span>
          <span className={cn(TYPE.small, "truncate")}>{COACH_PROFILE.title}</span>
        </div>
      </div>
      {detailed && <p className={cn(TYPE.body, "line-clamp-3 text-muted-foreground")}>{COACH_PROFILE.bio}</p>}
      {more && <Stats />}
      <div className="mt-auto">
        <Socials />
      </div>
    </W>
  )
}
