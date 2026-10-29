"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Minus, Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COACH_PROFILE, UPGRADE } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { CoachPhoto } from "./brand"
import { Chip, GREY, HatchBar, Label, Legend, Num, Rule, WCard, useFigureFont } from "./instrument"
import { ACCENT, ACCENT_TEXT, CTA, Drop, FitText, FX, SPREAD_ROWS, TYPE, useFrame, useMore, W } from "./kit"
import type { WidgetProps } from "./shared"
import { MEDIA_FG, MEDIA_FG2, MediaCard, Poster, SplitCard } from "./layouts"

const link = (p: string) => ({
  nativeButton: false as const,
  render: <Link href={p} />,
})

/** "€390" -> 390; "€2,400" -> 2400. */
const amount = (price: string) => Number(price.replace(/[^\d.]/g, "")) || 0
const currency = (price: string) => price.replace(/[\d.,\s]/g, "") || "€"

// ---------- Upgrade

/** The student's tier and the next one up: the coach's own tiers when there are two, the sample otherwise. */
function useTiers() {
  const { coach } = useCoach()
  const [a, b] = coach.tiers
  const current = a ? { name: a.name, price: a.price, cadence: a.cadence } : { ...UPGRADE.current, cadence: UPGRADE.next.cadence }
  const next = b ? { name: b.name, price: b.price, cadence: b.cadence, members: b.members } : { ...UPGRADE.next, members: 37 }
  return { current, next }
}

/** One plan as legend rows with checkmarks; `next` marks what it adds in the accent. */
function PlanColumn({ name, price, cadence, rows, next, delta }: { name: string; price: string; cadence: string; rows: { label: string; on: boolean; added?: boolean }[]; next?: boolean; delta?: string }) {
  const font = useFigureFont()
  return (
    <div
      className={cn(
        // Both columns get the same inset, so the names, prices and rows line up across; only the next tier is tinted.
        "grid h-full min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] content-start gap-2 p-2.5",
        next && "rounded-[min(var(--radius),8px)] bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)]",
      )}
    >
      <Label className="truncate">{next ? `Next · ${name}` : `You · ${name}`}</Label>
      <Num size="md" value={price} unit={`/ ${cadence === "month" ? "mo" : cadence}`} delta={delta} deltaTone="muted" />
      {/* Whole rows only; both columns are as tall, so they lose the same rows. */}
      <div className={cn("flex min-h-0 flex-col flex-wrap content-start gap-1 overflow-hidden *:w-full", SPREAD_ROWS)}>
        {rows.map((f) => (
          // A compare table's cells: the small size, so two columns of features fit side by side.
          <div key={f.label} className="flex min-w-0 items-center gap-2 text-[0.6875rem] leading-5" style={{ fontFamily: font }}>
            {f.on ? (
              <Check
                className="size-3.5 shrink-0"
                style={{
                  color: f.added ? ACCENT_TEXT : "var(--muted-foreground)",
                }}
              />
            ) : (
              <Minus className="size-3.5 shrink-0 text-muted-foreground/50" />
            )}
            <span
              className={cn(
                "min-w-0 truncate leading-4",
                f.on ? (f.added ? "text-foreground" : "text-muted-foreground") : "text-muted-foreground line-through decoration-[color:color-mix(in_oklab,var(--foreground)_30%,transparent)]",
              )}
            >
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Upgrade: compare (your tier next to the next one), banner (one row with the button), card (the price and what it adds).
 * Shown only to students who have a higher tier to move to. The button is the accent.
 */
export function Upgrade({ variant = "compare", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const { fixed } = useFrame()
  const { current, next } = useTiers()
  const { features } = UPGRADE
  const extra = features.filter((f) => !f.current)
  const have = features.length - extra.length
  const diff = amount(next.price) - amount(current.price)
  const plus = `+${currency(next.price)}${diff.toLocaleString("en")}`
  const students = coach.wording.students.toLowerCase()
  const label = String(props.button || `Upgrade to ${next.name}`)
  const cta = (
    <Button size="sm" className={cn("w-fit", CTA)} title={label} {...link(`${base}/profile`)}>
      <span className="truncate">{label}</span> <ArrowRight />
    </Button>
  )
  const priceChip = (
    <Chip>
      {next.price} / {next.cadence}
    </Chip>
  )

  if (variant === "banner") {
    return (
      <WCard
        row
        icon={Sparkles}
        title={`Move up to ${next.name}`}
        meta={more ? `You're on ${current.name} · adds ${extra.map((f) => f.label.toLowerCase()).join(", ")}` : `You're on ${current.name}`}
        chip={detailed ? priceChip : undefined}
      >
        {cta}
      </WCard>
    )
  }

  if (variant === "split") {
    return (
      <SplitCard panel={<Poster kicker={`Next · ${next.name}`} title={`${next.price} / ${next.cadence}`} sub={`${next.members} ${students} on it`} />}>
        <div className="grid min-w-0 shrink-0 gap-0.5">
          <span className="truncate text-[0.8125rem] leading-5 font-medium">Move up to {next.name}</span>
          {more && (
            <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">
              You&rsquo;re on {current.name} · {plus} a {next.cadence}
            </span>
          )}
        </div>
        <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start gap-1 overflow-hidden *:w-full", SPREAD_ROWS)}>
          {(detailed ? extra : extra.slice(0, 2)).map((f) => (
            <div key={f.label} className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-5">
              <Check className="size-3.5 shrink-0" style={{ color: ACCENT_TEXT }} />
              <span className="min-w-0 leading-4">{f.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex min-w-0">{cta}</div>
      </SplitCard>
    )
  }

  if (variant === "card") {
    return (
      <WCard icon={Sparkles} title={`Upgrade to ${next.name}`} meta={`You're on ${current.name} · ${current.price}`} chip={<Chip tone="neutral">+{extra.length} features</Chip>}>
        <Num value={next.price} unit={`/ ${next.cadence}`} delta={`${plus} vs ${current.name}`} deltaTone="muted" />
        {more && (
          <div className="grid gap-1.5">
            <HatchBar
              parts={[
                { value: have, color: GREY[1] },
                { value: extra.length, color: ACCENT },
              ]}
              total={features.length}
              height={8}
            />
            <Legend
              className="[grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-x-3"
              items={[
                { color: GREY[1], label: "You have", value: have },
                {
                  color: ACCENT,
                  label: "Adds",
                  value: extra.length,
                  valueTone: "accent",
                },
              ]}
            />
          </div>
        )}
        <Drop level={3}>
          {(detailed || fixed) && (
            <>
              <Rule />
              <Legend
                items={extra.map((f) => ({
                  color: ACCENT,
                  label: f.label,
                  value: <Check className="size-3.5" style={{ color: ACCENT_TEXT }} />,
                }))}
              />
            </>
          )}
        </Drop>
        <div className="mt-auto flex min-w-0">{cta}</div>
      </WCard>
    )
  }

  const rows = more ? features : extra
  return (
    <WCard icon={Sparkles} title="Upgrade" meta={`You're on ${current.name} · ${next.members} ${students} on ${next.name}`} chip={priceChip}>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 @[20rem]:grid-cols-2">
        <div className="hidden min-h-0 @[20rem]:block">
          <PlanColumn name={current.name} price={current.price} cadence={current.cadence} rows={rows.map((f) => ({ label: f.label, on: f.current }))} />
        </div>
        <PlanColumn
          next
          name={next.name}
          price={next.price}
          cadence={next.cadence}
          delta={plus}
          rows={rows.map((f) => ({
            label: f.label,
            on: f.next,
            added: !f.current,
          }))}
        />
      </div>
      {/* The button spans both columns: it is the one thing to do here. */}
      <div className="grid gap-1">
        <Button size="sm" className={cn("w-full", CTA)} title={label} {...link(`${base}/profile`)}>
          <span className="truncate">{label}</span> <ArrowRight />
        </Button>
        <Drop level={3}>{detailed && <span className={cn(TYPE.small, "text-center")}>Cancel anytime · switch back whenever</span>}</Drop>
      </div>
    </WCard>
  )
}

// ---------- Coach profile

/** The coach's numbers: students from their own tiers, the rest from the profile (sample). */
function useCoachStats() {
  const { coach } = useCoach()
  const students = coach.tiers.reduce((a, t) => a + t.members, 0)
  const years = COACH_PROFILE.stats.find((s) => /year/i.test(s.label))?.value ?? "12"
  return [
    { label: coach.wording.students, value: students.toLocaleString("en") },
    { label: "Years", value: years },
    { label: "Win rate", value: "58%" },
  ]
}

function Socials({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {COACH_PROFILE.socials.map((s) => (
        <a key={s} href="#" className={cn("rounded-sm [&_[data-slot=badge]]:transition-colors [&_[data-slot=badge]]:duration-150 [&:hover_[data-slot=badge]]:bg-muted", FX.focus)}>
          <Chip tone="neutral">
            {s} <ArrowUpRight className="ml-0.5 size-3" />
          </Chip>
        </a>
      ))}
    </div>
  )
}

/**
 * Coach profile: card (photo, name, numbers, socials), hero (a large photo beside the bio), compact (one row with Message).
 * The verified mark (or the Message button) is the accent.
 */
export function CoachProfile({ variant = "card" }: WidgetProps) {
  const { coach } = useCoach()
  const stats = useCoachStats()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const { fixed } = useFrame()
  const verified = <BadgeCheck className="size-4 shrink-0" style={{ color: ACCENT }} />
  const name = (cls: string) => (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className={cn(cls, "truncate font-heading")}>{coach.coachName}</span>
      {verified}
    </span>
  )

  if (variant === "compact") {
    return (
      <W row className="flex-row items-center justify-start gap-3">
        <CoachPhoto className="size-10" />
        <div className="grid min-w-0 flex-1">
          {name("text-[0.8125rem] leading-5 font-medium")}
          <span className={cn(TYPE.small, "truncate")}>{more ? `${COACH_PROFILE.title} · ${stats[0].value} ${stats[0].label.toLowerCase()}` : COACH_PROFILE.title}</span>
        </div>
        {detailed && <Socials className="hidden shrink-0 flex-nowrap @2xl:flex" />}
        {more && (
          <Button size="sm" className="hidden shrink-0 @[18rem]:inline-flex">
            Message
          </Button>
        )}
      </W>
    )
  }

  if (variant === "media") {
    return (
      <MediaCard
        side
        image={<CoachPhoto className="absolute inset-0 rounded-none" />}
        kicker="Your coach"
        aside={more ? <BadgeCheck className="size-4" style={{ color: MEDIA_FG }} /> : undefined}
        title={coach.coachName}
        sub={more ? `${COACH_PROFILE.title} · ${stats.map((st) => `${st.value} ${st.label.toLowerCase()}`).join(" · ")}` : COACH_PROFILE.title}
        footer={
          <>
            {detailed && (
              <span className="min-w-0 flex-1 truncate font-heading text-[0.6875rem] leading-4" style={{ color: MEDIA_FG2 }}>
                “{COACH_PROFILE.bio}”
              </span>
            )}
            <Button size="sm" className="ml-auto shrink-0">
              Message
            </Button>
          </>
        }
      />
    )
  }

  if (variant === "hero") {
    return (
      <WCard flush icon={BadgeCheck} title="Your coach" meta={`${coach.name} · ${COACH_PROFILE.title}`} bodyClassName="@xl:flex-row @xl:gap-5">
        <CoachPhoto className="hidden w-2/5 @xl:block" />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CoachPhoto className="size-10 @xl:hidden" />
            <div className="grid min-w-0 gap-0.5">
              {name(TYPE.valueLg)}
              <span className={cn(TYPE.small, "truncate")}>{coach.tagline}</span>
            </div>
          </div>
          <Drop level={2}>
            {more && (
              <FitText lines={3} className={cn(TYPE.body, "font-heading text-muted-foreground")}>
                “{COACH_PROFILE.bio}”
              </FitText>
            )}
          </Drop>
          <Drop level={1}>
            <Legend
              className="mt-auto max-w-xs"
              items={stats.map((s, i) => ({
                color: i === 0 ? ACCENT : GREY[i],
                label: s.label,
                value: s.value,
              }))}
            />
          </Drop>
          <Drop level={3}>{detailed && <Socials />}</Drop>
        </div>
      </WCard>
    )
  }

  return (
    <WCard icon={BadgeCheck} title="Your coach" meta={`${coach.name} · since 2012`} chip={<Chip tone="profit">Verified</Chip>}>
      <div className="flex min-w-0 items-center gap-3">
        <CoachPhoto className="size-12" />
        <div className="grid min-w-0">
          {name(TYPE.value)}
          <span className={cn(TYPE.small, "truncate")}>{COACH_PROFILE.title}</span>
        </div>
      </div>
      {/* The bio: on Detailed, and in any cell with room for it. */}
      <Drop level={3}>
        {(detailed || fixed) && (
          <FitText lines={3} className={cn(TYPE.body, "text-muted-foreground")}>
            {COACH_PROFILE.bio}
          </FitText>
        )}
      </Drop>
      <Drop level={2}>
        {more && (
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="grid min-w-0 gap-0.5">
                <Label className="truncate">{s.label}</Label>
                <Num size="md" value={s.value} />
              </div>
            ))}
          </div>
        )}
      </Drop>
      <Drop level={1}>
        <Socials className="mt-auto" />
      </Drop>
    </WCard>
  )
}
