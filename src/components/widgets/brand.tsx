"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, Handshake, Play, Quote, Search, Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { AI_INSIGHT, AI_SAMPLE, COACH_PROFILE, PARTNERS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Avatar, Bars, Caps, Head, TYPE, W, useMore } from "./kit"
import { Cover, useEmpty, type WidgetProps } from "./shared"

/** "Ask Kairo AI", but not "Ask Ask Marco" when the coach already named it that way. */
const askAi = (name: string) => (/^ask\b/i.test(name) ? name : `Ask ${name}`)

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** Accent text: the one coloured thing in a widget, when it is a link rather than a button. */
/** Brand-coloured text, in the readable version of the brand colour (see kit.tsx ACCENT_TEXT). */
const ACCENT_TEXT = "text-[color:var(--w-accent-text,var(--brand-text,var(--primary)))]"

/** Initials for a name: "Marco" -> "MA", "IC Markets" -> "IM". */
const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase()
}

// ---------- Pictures (neutral; they give a widget interest without colour)

/**
 * Stand-in for the coach's own photo until they upload one: a near-black
 * (or near-white) panel with a soft head-and-shoulders silhouette.
 */
export function CoachPhoto({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-[min(var(--radius),8px)]", className)} style={{ background: "color-mix(in oklab, var(--foreground) 86%, var(--background))" }} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
        <circle cx="50" cy="42" r="16" fill="var(--background)" opacity="0.2" />
        <path d="M16 104c0-21 15-36 34-36s34 15 34 36z" fill="var(--background)" opacity="0.2" />
      </svg>
    </div>
  )
}

/** A video thumbnail: the course artwork, a neutral play button and the length. */
export function VideoThumb({ length = "2:14", className }: { length?: string; className?: string }) {
  return (
    <div className={cn("relative min-h-0 overflow-hidden rounded-[min(var(--radius),8px)]", className)}>
      <Cover className="absolute inset-0 rounded-none" />
      <span className="r-dot absolute top-1/2 left-1/2 grid size-10 -translate-1/2 place-items-center bg-background text-foreground shadow-sm">
        <Play className="size-4 translate-x-px" />
      </span>
      <span className="r-chip absolute right-2 bottom-2 bg-background/85 px-1.5 py-0.5 text-[0.6875rem] leading-4 font-medium text-foreground tabular-nums">{length}</span>
    </div>
  )
}

// ---------- Welcome video

const CHAPTERS = [
  { title: "How the program works", at: "0:00" },
  { title: "What to do in your first week", at: "0:48" },
  { title: "How to reach me", at: "1:40" },
]

/** Welcome video: side (video beside the words), stacked (video on top), minimal (the title as a quote). */
export function WelcomeVideo({ variant = "side", props }: WidgetProps) {
  const { coach } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "Welcome in. Here's how to get the most out of it.")
  const text = String(props.text || "Two minutes on how the program works, what to do first, and how to reach me.")
  const watch = (
    <Button size="sm" className="w-fit shrink-0">
      <Play /> Watch · 2 min
    </Button>
  )
  const chapters = detailed && (
    <ol className="grid">
      {CHAPTERS.map((c) => (
        <li key={c.at} className="flex items-baseline gap-2 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1 last:border-b-0">
          <span className="w-8 shrink-0 text-xs text-muted-foreground tabular-nums">{c.at}</span>
          <span className={cn(TYPE.body, "truncate")}>{c.title}</span>
        </li>
      ))}
    </ol>
  )

  if (variant === "minimal") {
    return (
      <W className="justify-center gap-4">
        <Quote className="size-4 shrink-0 text-muted-foreground" />
        <p className={cn(TYPE.value, "line-clamp-3 max-w-3xl font-normal text-balance @2xl:text-[1.75rem] @2xl:leading-8")}>“{title}”</p>
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar initials={initials(coach.coachName)} size={28} />
          <span className="grid min-w-0">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName}</span>
            {more && <span className={cn(TYPE.small, "truncate")}>{COACH_PROFILE.title}</span>}
          </span>
          <span className="ml-auto">{watch}</span>
        </div>
      </W>
    )
  }

  if (variant === "stacked") {
    return (
      <W>
        <VideoThumb className="flex-1" />
        <div className="flex min-w-0 flex-col gap-3 @lg:flex-row @lg:items-end @lg:justify-between">
          <div className="grid min-w-0 gap-1">
            <Caps>A message from {coach.coachName}</Caps>
            <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{title}</h3>
            {more && <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>{text}</p>}
          </div>
          {watch}
        </div>
        {chapters}
      </W>
    )
  }

  return (
    <W className="@xl:flex-row @xl:items-center @xl:gap-6">
      <VideoThumb className="aspect-video w-full flex-1 @xl:h-full @xl:max-w-[55%] @xl:flex-none" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Caps>A message from {coach.coachName}</Caps>
        <h3 className={cn(TYPE.value, "line-clamp-3 text-balance")}>{title}</h3>
        {more && <p className={cn(TYPE.body, "line-clamp-3 hidden text-muted-foreground @xl:block")}>{text}</p>}
        {chapters}
        <div className="mt-1">{watch}</div>
      </div>
    </W>
  )
}

// ---------- Banner

/** Banner: headline (words left, button right), picture (artwork beside the words), slim (one line). */
export function Banner({ variant = "headline", props }: WidgetProps) {
  const { base } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "Inner Circle opens on 1 November")
  const text = String(props.text || "Small group, weekly 1:1 reviews, and the full playbook.")
  const eyebrow = String(props.eyebrow || "Limited places")
  const cta = props.button !== "" && (
    <Button size="sm" className="w-fit shrink-0" {...link(`${base}/${String(props.target || "courses")}`)}>
      {String(props.button || "Find out more")} <ArrowRight />
    </Button>
  )

  if (variant === "slim") {
    return (
      <W row className="flex-row items-center gap-3">
        <span className={cn(TYPE.body, "min-w-0 flex-1 truncate")}>
          {detailed && <Caps className="mr-2">{eyebrow}</Caps>}
          <span className="font-medium">{title}</span>
          {more && <span className="hidden text-muted-foreground @2xl:inline"> · {text}</span>}
        </span>
        {cta}
      </W>
    )
  }

  if (variant === "picture") {
    return (
      <W className="flex-row items-stretch gap-4">
        <Cover className="hidden aspect-[4/3] h-full shrink-0 @lg:block" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {detailed && <Caps>{eyebrow}</Caps>}
          <h3 className={cn(TYPE.value, "line-clamp-2 text-balance @3xl:text-[1.75rem] @3xl:leading-8")}>{title}</h3>
          {more && <p className={cn(TYPE.body, "line-clamp-2 max-w-prose text-muted-foreground")}>{text}</p>}
          {cta && <div className="mt-1.5">{cta}</div>}
        </div>
      </W>
    )
  }

  return (
    <W className="flex-row items-center justify-between gap-6">
      <div className="grid min-w-0 gap-1">
        {detailed && <Caps>{eyebrow}</Caps>}
        <h3 className={cn(TYPE.value, "truncate @3xl:text-[1.75rem] @3xl:leading-8")}>{title}</h3>
        {more && <p className={cn(TYPE.body, "truncate text-muted-foreground")}>{text}</p>}
      </div>
      {cta}
    </W>
  )
}

// ---------- Text

/** Text: plain (heading and paragraph), quote (in the heading font, signed), steps (each sentence or line numbered). */
export function TextBlock({ variant = "plain", props }: WidgetProps) {
  const { coach } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "How this works")
  const text = String(props.text || "Watch one lesson a day.\nJoin Monday's live session.\nJournal every trade, and ask for a review whenever you're unsure.")

  if (variant === "quote") {
    return (
      <W className="justify-center gap-3">
        <blockquote className={cn(TYPE.value, "line-clamp-4 font-normal text-balance @2xl:text-[1.75rem] @2xl:leading-8")}>“{text.replace(/\n+/g, " ")}”</blockquote>
        <figcaption className="flex min-w-0 items-center gap-2">
          {more && <Avatar initials={initials(coach.coachName)} size={20} />}
          <span className={cn(TYPE.small, "truncate")}>
            {coach.coachName}
            {detailed && ` · ${COACH_PROFILE.title}`}
          </span>
        </figcaption>
      </W>
    )
  }

  if (variant === "steps") {
    const steps = text
      .split(/\n+|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return (
      <W>
        {more && <span className={TYPE.title}>{title}</span>}
        <ol className="grid content-start gap-x-6 gap-y-2 @2xl:grid-flow-col @2xl:auto-cols-fr">
          {steps.map((s, i) => (
            <li key={i} className="flex min-w-0 gap-3 @2xl:flex-col @2xl:gap-1.5">
              <span className="w-5 shrink-0 text-xs leading-5 font-medium text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className={cn(TYPE.body, "min-w-0")}>{s}</span>
            </li>
          ))}
        </ol>
      </W>
    )
  }

  return (
    <W className="gap-2">
      <h3 className={cn(TYPE.value, "text-balance")}>{title}</h3>
      <p className={cn(TYPE.body, "max-w-prose whitespace-pre-line text-muted-foreground", !more && "line-clamp-2")}>{text}</p>
    </W>
  )
}

// ---------- Partner links

/** A partner's mark until the coach uploads a logo: initials in the heading font, no colour. */
function Mark({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="r-chip grid shrink-0 place-items-center border bg-background font-heading font-medium tracking-tight text-foreground"
      style={{ width: size, height: size, fontSize: size > 20 ? "0.6875rem" : "0.5625rem" }}
    >
      {initials(name)}
    </span>
  )
}

/** Partner links: list (rows with notes), tiles (a logo wall), chips (one line). */
export function PartnerLinks({ variant = "list" }: WidgetProps) {
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const disclosure = detailed && <span className={cn(TYPE.small, "mt-auto")}>Some of these are affiliate links.</span>

  if (variant === "chips") {
    return (
      <W row className="flex-row items-center gap-3">
        <Caps className="shrink-0">Our tools</Caps>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)]">
          {PARTNERS.map((p) => (
            <a key={p.name} href="#" className="r-chip flex shrink-0 items-center gap-1.5 border py-1 pr-2 pl-1 text-xs hover:bg-muted">
              <Mark name={p.name} size={18} />
              {p.name}
            </a>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "tiles") {
    return (
      <W>
        <Head icon={Handshake} label="Tools and partners" />
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 @xl:grid-cols-4">
          {PARTNERS.map((p) => (
            <a key={p.name} href="#" className="relative grid min-h-0 content-center justify-items-center gap-1 rounded-[min(var(--radius),8px)] border p-2 text-center hover:bg-muted">
              {p.tag && <span className={cn("absolute top-1.5 right-2 text-[0.6875rem] leading-none font-medium", ACCENT_TEXT)}>{p.tag}</span>}
              <span className="font-heading text-[0.9375rem] leading-5 font-medium tracking-tight">{p.name}</span>
              {more && <span className={cn(TYPE.small, "line-clamp-1")}>{p.note}</span>}
            </a>
          ))}
        </div>
        {disclosure}
      </W>
    )
  }

  return (
    <W>
      <Head icon={Handshake} label="Tools and partners" right={`${PARTNERS.length} links`} />
      <div className="grid">
        {PARTNERS.map((p) => (
          <a key={p.name} href="#" className="group flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5 last:border-b-0">
            <Mark name={p.name} />
            <span className="grid min-w-0 flex-1">
              <span className={cn(TYPE.body, "truncate group-hover:underline")}>{p.name}</span>
              {more && <span className={cn(TYPE.small, "truncate")}>{p.note}</span>}
            </span>
            {p.tag ? <span className={cn("shrink-0 text-xs font-medium", ACCENT_TEXT)}>{p.tag}</span> : <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />}
          </a>
        ))}
      </div>
      {disclosure}
    </W>
  )
}

// ---------- Ask the AI (also carries the AI insight from the student's trades)

const QUOTA = { used: 18, included: 50 }
const SUGGESTIONS = ["Where should my stop go?", "Explain the A+ setup", "Why do I lose after lunch?"]

/** The question box. Its button is the widget's one accent. */
function AskBox({ placeholder = "Ask about a lesson or your trades…" }: { placeholder?: string }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 rounded-[var(--button-radius,var(--radius))] border bg-background py-1 pr-1 pl-3 text-foreground">
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <span className={cn(TYPE.body, "min-w-0 flex-1 truncate text-left text-muted-foreground")}>{placeholder}</span>
      <Button size="sm">Ask</Button>
    </div>
  )
}

const quotaLine = `${QUOTA.included - QUOTA.used} of ${QUOTA.included} questions left this month`

/**
 * Ask the AI: search (a centred box), chat (an example exchange), insight
 * (one pattern from the student's journal, with the box to ask why).
 * Detailed adds example questions and the monthly allowance.
 */
export function AiAsk({ variant = "search" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")

  if (variant === "insight") {
    if (empty) {
      return (
        <W>
          <Head icon={Sparkles} label={coach.wording.ai} right="From your journal" />
          <div className="grid gap-0.5">
            <span className={TYPE.title}>Insights appear after 20 trades</span>
            <span className={TYPE.small}>{coach.wording.ai} looks for patterns in your journal.</span>
          </div>
          <div className="mt-auto">
            <AskBox />
          </div>
        </W>
      )
    }
    return (
      <W>
        <Head icon={Sparkles} label={coach.wording.ai} right="From your journal" />
        <div className="grid min-w-0 gap-0.5">
          <span className={cn(TYPE.value, "line-clamp-2 text-balance")}>{AI_INSIGHT.title}</span>
          {(!more || detailed) && <span className={cn(TYPE.small, "line-clamp-1")}>{AI_INSIGHT.text}</span>}
        </div>
        {more && (
          <Bars diverging values={AI_INSIGHT.r} labels={AI_INSIGHT.hours} tips={AI_INSIGHT.hours.map((h) => `${h}:00`)} format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`} />
        )}
        {detailed && (
          <Link href={`${base}/courses`} className="flex w-fit items-center gap-1 text-xs font-medium hover:underline">
            Watch “{AI_INSIGHT.lesson}” <ArrowRight className="size-3.5" />
          </Link>
        )}
        <div className={cn(!more && "mt-auto")}>
          <AskBox placeholder="Ask why…" />
        </div>
      </W>
    )
  }

  if (variant === "chat") {
    return (
      <W className="@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @3xl:items-center @3xl:gap-8">
        <div className="grid content-center gap-1.5">
          <Head icon={Sparkles} label={coach.wording.ai} />
          <h3 className={cn(TYPE.value, "text-balance")}>Stuck? {askAi(coach.wording.ai)}.</h3>
          {more && <p className={cn(TYPE.body, "hidden text-muted-foreground @3xl:block")}>Answers come from {coach.coachName}&apos;s own lessons, with a link to the exact moment. Not investment advice.</p>}
          {detailed && <span className={cn(TYPE.small, "hidden @3xl:block")}>{quotaLine}</span>}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <div className={cn(TYPE.body, "r-chip ml-auto max-w-[85%] bg-muted px-3 py-2")}>{AI_SAMPLE.question}</div>
          <div className="flex min-w-0 gap-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="grid min-w-0 gap-1">
              <p className={cn(TYPE.body, more ? "line-clamp-3" : "line-clamp-2")}>{AI_SAMPLE.answer}</p>
              {more && (
                <span className={cn(TYPE.small, "flex min-w-0 items-center gap-1")}>
                  <Play className="size-3 shrink-0" /> <span className="truncate">{AI_SAMPLE.source}</span>
                </span>
              )}
            </div>
          </div>
          <div className="mt-auto">
            <AskBox placeholder="Ask a follow-up…" />
          </div>
        </div>
      </W>
    )
  }

  return (
    <W className="items-center justify-center gap-2.5 text-center">
      {more && !detailed && <Sparkles className="size-4 text-muted-foreground" />}
      <h3 className={cn(TYPE.value, "text-balance")}>{askAi(coach.wording.ai)} anything</h3>
      <div className="w-full max-w-xl">
        <AskBox />
      </div>
      {detailed && (
        <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <span key={s} className="r-chip border px-2 py-0.5 text-xs text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}
      {more && <p className={TYPE.small}>{detailed ? `${quotaLine}. ` : ""}Answers come from {coach.coachName}&apos;s lessons. Not investment advice.</p>}
    </W>
  )
}

