"use client"

import Link from "next/link"
import { ArrowRight, Handshake, Image as ImageIcon, Play, Quote, Search, Sparkles, Type, Video } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { AI_INSIGHT, AI_SAMPLE, COACH_PROFILE } from "@/lib/data/sample"
import { KIND_LABEL, useOffers, type PartnerOffer } from "@/lib/data/partners"
import { cn } from "@/lib/utils"
import { Axis, Chip, GREY, HatchBar, Label, Legend, StepChart, TickBar, Timeline, WCard, useFigureFont } from "./instrument"
import { ACCENT, ACCENT_TEXT, Avatar, TYPE, useMore } from "./kit"
import { Cover, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

/** "Ask Kairo AI", but not "Ask Ask Marco" when the coach already named it that way. */
const askAi = (name: string) => (/^ask\b/i.test(name) ? name : `Ask ${name}`)

export const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** A web address the coach typed, made safe to open: http(s) only, "example.com" becomes "https://example.com". Anything else is undefined. */
export function webUrl(raw: unknown): URL | undefined {
  const v = String(raw ?? "").trim()
  if (!v) return undefined
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`)
    return u.protocol === "https:" || u.protocol === "http:" ? u : undefined
  } catch {
    return undefined
  }
}

/** Where a coach's button goes: one of the student pages, or (target "url") a web address in a new tab. */
export const ctaLink = (base: string, props: WidgetProps["props"], fallback = "courses") => {
  if (props.target === "url") return { nativeButton: false as const, render: <a href={webUrl(props.url)?.href ?? "#"} target="_blank" rel="noreferrer" /> }
  return link(`${base}/${String(props.target || fallback)}`)
}

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
    <div className={cn("relative shrink-0 overflow-hidden rounded-[min(var(--radius),8px)]", className)} style={{ background: "var(--cover-bg, color-mix(in oklab, var(--foreground) 86%, var(--background)))" }} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
        <circle cx="50" cy="42" r="16" fill="var(--cover-fg, var(--background))" opacity="0.2" />
        <path d="M16 104c0-21 15-36 34-36s34 15 34 36z" fill="var(--cover-fg, var(--background))" opacity="0.2" />
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

const LENGTH = { label: "2:14", s: 134 }
const CHAPTERS = [
  { title: "How the program works", at: "0:00", s: 0, len: "48 s" },
  { title: "What to do in your first week", at: "0:48", s: 48, len: "52 s" },
  { title: "How to reach me", at: "1:40", s: 100, len: "34 s" },
]
/** Where the student stopped watching (sample): the start of chapter 2. */
const WATCHED = 48

/** The chapters as a timeline: the one to watch next carries the accent. */
function Chapters({ className }: { className?: string }) {
  const next = CHAPTERS.findIndex((c, i) => (CHAPTERS[i + 1]?.s ?? LENGTH.s) > WATCHED)
  return <Timeline className={className} items={CHAPTERS.map((c, i) => ({ time: c.at, title: c.title, value: c.len, color: i === next ? ACCENT : i < next ? GREY[2] : GREY[1], strong: i === next }))} />
}

/** A scrubber under the video: watched so far in the accent, chapter starts as taller ticks. */
function Scrubber() {
  const n = 48
  const starts = CHAPTERS.slice(1).map((c) => Math.round((c.s / LENGTH.s) * n))
  return <TickBar value={WATCHED} max={LENGTH.s} segments={n} height={6} now={Math.round((WATCHED / LENGTH.s) * n)} mark={(i) => (starts.includes(i) ? GREY[0] : undefined)} />
}

/** Welcome video: side (video beside the words), stacked (video on top), minimal (the title as a quote). */
export function WelcomeVideo({ variant = "side", props }: WidgetProps) {
  const { coach } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "Welcome in. Here's how to get the most out of it.")
  const text = String(props.text || "Two minutes on how the program works, what to do first, and how to reach me.")
  const pct = Math.round((WATCHED / LENGTH.s) * 100)
  const meta = `${coach.coachName} · ${LENGTH.label} · ${CHAPTERS.length} chapters`
  const chip = <Chip>{pct}% watched</Chip>
  const watch = (
    <Button size="sm" className="w-fit shrink-0">
      <Play /> Resume at {CHAPTERS[1].at}
    </Button>
  )

  if (variant === "minimal") {
    return (
      <WCard icon={Quote} title="Welcome video" meta={meta} chip={chip}>
        <p className={cn(TYPE.value, "line-clamp-2 max-w-3xl font-normal text-balance @2xl:text-[1.75rem] @2xl:leading-8")}>“{title}”</p>
        {detailed && <Chapters />}
        <div className="mt-auto flex min-w-0 items-center gap-2.5">
          <Avatar initials={initials(coach.coachName)} size={28} />
          <span className="grid min-w-0 flex-1">
            <span className={cn(TYPE.title, "truncate")}>{coach.coachName}</span>
            {more && <span className={cn(TYPE.small, "truncate")}>{COACH_PROFILE.title}</span>}
          </span>
          {watch}
        </div>
      </WCard>
    )
  }

  if (variant === "stacked") {
    return (
      <WCard flush icon={Video} title="Welcome video" meta={meta} chip={chip}>
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2">
          <VideoThumb length={LENGTH.label} className="h-full" />
          {more && <Scrubber />}
        </div>
        <div className="flex min-w-0 flex-col gap-3 @lg:flex-row @lg:items-end @lg:justify-between">
          <div className="grid min-w-0 gap-1">
            <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{title}</h3>
            {more && <p className={cn(TYPE.body, "line-clamp-1 text-muted-foreground")}>{text}</p>}
          </div>
          {watch}
        </div>
        {detailed && <Chapters />}
      </WCard>
    )
  }

  return (
    <WCard flush icon={Video} title="Welcome video" meta={meta} chip={chip} bodyClassName="@xl:flex-row @xl:gap-5">
      <VideoThumb length={LENGTH.label} className="min-h-20 w-full flex-1 @xl:h-full @xl:max-w-[50%]" />
      <div className="flex min-w-0 flex-col gap-2 @xl:flex-1">
        <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{title}</h3>
        {more && <p className={cn(TYPE.body, "line-clamp-2 hidden text-muted-foreground @xl:block")}>{text}</p>}
        {more && <Chapters className={cn(!detailed && "hidden @xl:grid")} />}
        <div className="@xl:mt-auto">{watch}</div>
      </div>
    </WCard>
  )
}

// ---------- Banner

/** Banner: headline (words left, button right), picture (artwork beside the words), slim (one line). */
export function Banner({ variant = "headline", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "Inner Circle opens on 1 November")
  const text = String(props.text || "Small group, weekly 1:1 reviews, and the full playbook.")
  const eyebrow = String(props.eyebrow || "Limited places")
  const cta = props.button !== "" && (
    <Button size="sm" className="w-fit shrink-0" {...ctaLink(base, props)}>
      {String(props.button || "Find out more")} <ArrowRight />
    </Button>
  )

  if (variant === "slim") {
    if (detailed) {
      return (
        <WCard row icon={ImageIcon} title={title} meta={text} chip={<Chip>{eyebrow}</Chip>}>
          {cta}
        </WCard>
      )
    }
    return (
      <WCard row crumb={more ? eyebrow : undefined} title={title}>
        <span className="ml-auto" />
        {cta}
      </WCard>
    )
  }

  const words = (
    <div className="grid min-w-0 gap-1">
      <h3 className={cn(TYPE.value, "text-balance @3xl:text-[1.75rem] @3xl:leading-8", variant === "picture" ? "line-clamp-2" : "line-clamp-1")}>{title}</h3>
      {more && <p className={cn(TYPE.body, "max-w-prose text-muted-foreground", detailed ? "line-clamp-3" : "line-clamp-1")}>{text}</p>}
    </div>
  )

  if (variant === "picture") {
    return (
      <WCard flush crumb={coach.org} title={eyebrow} chip={detailed ? <Chip tone="neutral">{coach.name}</Chip> : undefined} bodyClassName="flex-row items-stretch gap-4">
        <Cover className="hidden aspect-[4/3] h-full shrink-0 @lg:block" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
          {words}
          {cta}
        </div>
      </WCard>
    )
  }

  return (
    <WCard flush crumb={coach.org} title={eyebrow} bodyClassName="flex-row items-center justify-between gap-4 @lg:gap-6">
      {words}
      {cta}
    </WCard>
  )
}

// ---------- Text

/** Text: plain (heading and paragraph), quote (in the heading font, signed), steps (each sentence or line numbered). */
export function TextBlock({ variant = "plain", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const font = useFigureFont()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "How this works")
  const text = String(props.text || "Watch one lesson a day.\nJoin Monday's live session.\nJournal every trade, and ask for a review whenever you're unsure.")
  // Text with a button: no button text, no button (unlike Banner).
  const cta = !!props.button && (
    <Button size="sm" className="w-fit shrink-0" {...ctaLink(base, props)}>
      {String(props.button)} <ArrowRight />
    </Button>
  )

  if (variant === "quote") {
    return (
      <WCard flush icon={Quote} title={coach.coachName} meta={more ? COACH_PROFILE.title : undefined} bodyClassName="justify-center">
        <blockquote className={cn(TYPE.value, "font-normal text-balance @2xl:text-[1.75rem] @2xl:leading-8", detailed ? "line-clamp-5" : "line-clamp-3")}>“{text.replace(/\n+/g, " ")}”</blockquote>
      </WCard>
    )
  }

  if (variant === "steps") {
    const steps = text
      .split(/\n+|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return (
      <WCard icon={Type} title={title} meta={more ? `From ${coach.coachName} · ${steps.length} steps` : undefined} chip={detailed ? <Chip tone="neutral">{steps.length} steps</Chip> : undefined}>
        <ol className="grid content-start gap-x-6 gap-y-2 @2xl:grid-flow-col @2xl:auto-cols-fr">
          {steps.map((s, i) => (
            <li key={i} className="flex min-w-0 gap-3 @2xl:flex-col @2xl:gap-1.5">
              <span className="w-5 shrink-0 text-xs leading-5 tabular-nums" style={{ fontFamily: font, color: i === 0 ? ACCENT_TEXT : "var(--muted-foreground)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={cn(TYPE.body, "min-w-0")}>{s}</span>
            </li>
          ))}
        </ol>
        {cta && <div className="mt-auto">{cta}</div>}
      </WCard>
    )
  }

  return (
    <WCard flush icon={Type} title={`From ${coach.coachName}`} meta={more ? coach.name : undefined} bodyClassName="gap-1.5">
      <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{title}</h3>
      <p className={cn(TYPE.body, "max-w-prose whitespace-pre-line text-muted-foreground", detailed ? "" : more ? "line-clamp-3" : "line-clamp-1")}>{text}</p>
      {cta && <div className="mt-auto pt-1">{cta}</div>}
    </WCard>
  )
}

// ---------- Partner links

/** A partner's mark until the coach uploads a logo: initials in the heading font, no colour. */
export function Mark({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="r-chip grid shrink-0 place-items-center border bg-background font-heading font-medium tracking-tight text-foreground"
      style={{ width: size, height: size, fontSize: size > 20 ? "0.6875rem" : "0.5625rem" }}
    >
      {initials(name)}
    </span>
  )
}

/** Partner links: list (legend rows with the coach's codes), tiles (a logo wall), chips (one row). Reads the offers the coach switched on in Partners. */
export function PartnerLinks({ variant = "list" }: WidgetProps) {
  const { coach, base } = useCoach()
  const offers = useOffers(coach).filter((o) => o.on)
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const withCode = offers.filter((o) => o.code).length
  const meta = `Tools ${coach.coachName} uses · ${withCode} codes`
  const disclosure = detailed && <span className={cn(TYPE.small, "mt-auto")}>Some of these are affiliate links.</span>
  const href = (o: PartnerOffer) => o.url
  const ext = { target: "_blank", rel: "noreferrer" } as const

  if (offers.length === 0) {
    return <WidgetEmpty icon={Handshake} title="No partner offers yet" text={`Offers from the brokers, prop firms and tools ${coach.coachName} works with show here.`} />
  }

  if (variant === "chips") {
    return (
      <WCard row icon={Handshake} title="Partner links" meta={more ? meta : undefined} chip={<Chip tone="neutral">{offers.length} links</Chip>}>
        <div className="hidden min-w-0 flex-[2] justify-end gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] @[26rem]:flex">
          {offers.map((o) => (
            <a key={o.id} href={href(o)} {...ext} className="r-chip flex shrink-0 items-center gap-1.5 border py-1 pr-2 pl-1 text-xs hover:bg-muted">
              <Mark name={o.name} size={18} />
              {o.name}
              {detailed && <span className="text-muted-foreground">{o.offer}</span>}
            </a>
          ))}
        </div>
      </WCard>
    )
  }

  if (variant === "tiles") {
    return (
      <WCard icon={Handshake} title="Partner links" meta={meta} chip={<Chip tone="neutral">{offers.length} links</Chip>}>
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 @xl:grid-cols-4">
          {offers.slice(0, detailed ? 8 : 4).map((o, i) => (
            <a key={o.id} href={href(o)} {...ext} className="relative grid min-h-0 content-center justify-items-start gap-1 rounded-[min(var(--radius),8px)] border bg-card p-2.5 hover:bg-muted">
              <span className="truncate font-heading text-[0.8125rem] leading-5 font-medium tracking-tight">{o.name}</span>
              {more && <span className={cn(TYPE.small, "line-clamp-1")}>{KIND_LABEL[o.kind]}</span>}
              <Chip tone={i === 0 ? "accent" : "neutral"}>{o.offer}</Chip>
            </a>
          ))}
        </div>
        {disclosure}
      </WCard>
    )
  }

  return (
    <WCard icon={Handshake} title="Partner links" meta={meta} chip={<Chip tone="neutral">{offers.length} links</Chip>}>
      <div className="grid">
        {offers.map((o, i) => (
          <a key={o.id} href={href(o)} {...ext} className="group flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5 last:border-b-0">
            <Mark name={o.name} size={more ? 28 : 22} />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-heading text-[0.8125rem] leading-5 font-medium tracking-tight group-hover:underline">{o.name}</span>
              {more && <span className={cn(TYPE.small, "truncate")}>{KIND_LABEL[o.kind]}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {detailed && o.code && <Label className="hidden @[20rem]:inline">{o.code}</Label>}
              <Chip tone={i === 0 ? "accent" : "neutral"}>{o.offer}</Chip>
            </span>
          </a>
        ))}
      </div>
      <Link href={`${base}/partners`} className={cn(TYPE.small, "mt-auto w-fit hover:underline")}>All offers</Link>
      {disclosure}
    </WCard>
  )
}

// ---------- Ask the AI (also carries the AI insight from the student's trades)

const QUOTA = { used: 18, included: 50, resetsIn: 17 }
const SUGGESTIONS = ["Where should my stop go?", "Explain the A+ setup", "Why do I lose after lunch?"]
const LEFT = QUOTA.included - QUOTA.used

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

/** "32 of 50 questions left": what's used solid, what's left hatched. */
function Quota() {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="truncate">
          {LEFT} of {QUOTA.included} questions left
        </Label>
        <Label className="hidden shrink-0 @[18rem]:inline">Resets in {QUOTA.resetsIn} d</Label>
      </div>
      <HatchBar parts={[{ value: QUOTA.used, color: GREY[1] }]} total={QUOTA.included} height={8} />
    </div>
  )
}

const r = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}R`

/**
 * Ask the AI: search (the question box and the monthly allowance), chat (an
 * example exchange), insight (one pattern from the student's journal, with the
 * box to ask why).
 */
export function AiAsk({ variant = "search" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const lessonsMeta = `Answers from ${coach.coachName}'s lessons · not advice`
  const left = <Chip tone="neutral">{LEFT} left</Chip>

  if (variant === "insight") {
    if (empty) {
      return (
        <WCard icon={Sparkles} title={coach.wording.ai} meta="From your journal · 0 trades">
          <div className="grid gap-0.5">
            <span className={TYPE.title}>Insights appear after 20 trades</span>
            <span className={TYPE.small}>{coach.wording.ai} looks for patterns in your journal.</span>
          </div>
          <HatchBar parts={[]} total={20} height={8} />
          <div className="mt-auto">
            <AskBox />
          </div>
        </WCard>
      )
    }
    const am = AI_INSIGHT.r.slice(0, 3)
    const pm = AI_INSIGHT.r.slice(4)
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
    return (
      <WCard icon={Sparkles} title={coach.wording.ai} meta="From your journal · last 20 days · 19 trades" chip={<Chip tone="loss">{r(avg(pm))} after 12:00</Chip>}>
        <span className={cn(TYPE.title, "line-clamp-1")}>{AI_INSIGHT.title}</span>
        <div className="grid min-h-0 flex-1 gap-1">
          <StepChart series={[{ values: AI_INSIGHT.r, label: "Avg R" }]} format={r} height={more ? 64 : 48} className="min-h-0" />
          {more && <Axis labels={AI_INSIGHT.hours.map((h) => `${h}:00`)} className="[&>span:nth-child(even)]:hidden @[22rem]:[&>span:nth-child(even)]:inline" />}
        </div>
        {detailed && (
          <>
            <Legend
              items={[
                { color: GREY[1], label: "Before 12:00, avg", value: r(avg(am)), valueTone: "profit" },
                { color: ACCENT, label: "After 12:00, avg", value: r(avg(pm)), valueTone: "loss" },
              ]}
            />
            <Link href={`${base}/courses`} className="flex w-fit items-center gap-1 text-xs font-medium hover:underline">
              Watch “{AI_INSIGHT.lesson}” <ArrowRight className="size-3.5" />
            </Link>
          </>
        )}
        <AskBox placeholder="Ask why…" />
      </WCard>
    )
  }

  if (variant === "chat") {
    return (
      <WCard icon={Sparkles} title={coach.wording.ai} meta={lessonsMeta} chip={left} bodyClassName="@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @3xl:items-stretch @3xl:gap-8">
        <div className="hidden content-center gap-3 @3xl:grid">
          <h3 className={cn(TYPE.value, "text-balance")}>Stuck? {askAi(coach.wording.ai)}.</h3>
          {more && <p className={cn(TYPE.body, "text-muted-foreground")}>Every answer links to the exact moment in a lesson.</p>}
          {detailed && <Quota />}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5">
          <div className={cn(TYPE.body, "r-chip ml-auto max-w-[85%] bg-muted px-3 py-2")}>{AI_SAMPLE.question}</div>
          <div className="flex min-w-0 gap-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" style={{ color: ACCENT_TEXT }} />
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
      </WCard>
    )
  }

  return (
    <WCard icon={Sparkles} title={`${askAi(coach.wording.ai)} anything`} meta={lessonsMeta} chip={left}>
      <AskBox />
      {detailed && (
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {SUGGESTIONS.map((s) => (
            <span key={s} className="r-chip border px-2 py-0.5 text-xs text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}
      {more && (
        <div className="mt-auto">
          <Quota />
        </div>
      )}
    </WCard>
  )
}
