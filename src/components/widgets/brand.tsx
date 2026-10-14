"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, PlayCircle, Quote, Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AI_SAMPLE, PARTNERS } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Caps, Head, Ring, W } from "./kit"
import { Cover, type WidgetProps } from "./shared"

/** "Ask Kairo AI", but not "Ask Ask Marco" when the coach already named it that way. */
const askAi = (name: string) => (/^ask\b/i.test(name) ? name : `Ask ${name}`)

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** Welcome video: side (video beside text), stacked (video on top), minimal (quote + play). */
export function WelcomeVideo({ variant = "side", props }: WidgetProps) {
  const { coach } = useCoach()
  const title = String(props.title || "Welcome in. Here's how to get the most out of it.")
  const text = String(props.text || "Two minutes on how the program works, what to do first, and how to reach me.")
  const video = (
    <div className="relative aspect-video overflow-hidden rounded-[min(var(--radius),14px)]">
      <Cover className="absolute inset-0" />
      <PlayCircle className="absolute top-1/2 left-1/2 size-14 -translate-1/2 text-white drop-shadow" />
      <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 text-xs text-white">2:14</span>
    </div>
  )

  if (variant === "minimal") {
    return (
      <W className="items-center justify-center gap-4 text-center">
        <Quote className="size-6 text-primary" />
        <p className="max-w-2xl font-heading text-2xl leading-snug @lg:text-3xl">“{title}”</p>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{coach.coachName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{coach.coachName}</span>
          <Button size="sm" variant="secondary">
            <PlayCircle /> Watch · 2 min
          </Button>
        </div>
      </W>
    )
  }

  if (variant === "stacked") {
    return (
      <Card className="rounded-(--radius) pt-0">
        {video}
        <CardHeader>
          <CardDescription className="eyebrow">A message from {coach.coachName}</CardDescription>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container rounded-(--radius)">
      <div className="grid gap-5 px-(--card-spacing) @xl:grid-cols-[1fr_1.2fr] @xl:items-center">
        {video}
        <div className="flex flex-col gap-2">
          <span className="eyebrow">A message from {coach.coachName}</span>
          <h3 className="text-2xl leading-tight">{title}</h3>
          <p className="text-muted-foreground">{text}</p>
        </div>
      </div>
    </Card>
  )
}

/** Banner: brand colour, highlight, plain. */
export function Banner({ variant = "brand", props }: WidgetProps) {
  const { base } = useCoach()
  const styles = {
    brand: "fx-hero",
    highlight: "bg-highlight text-highlight-foreground",
    plain: "bg-card text-card-foreground",
  } as const
  return (
    <div
      className={cn("@container flex h-full flex-col items-start justify-center gap-4 overflow-hidden rounded-(--radius) p-[calc(var(--card-spacing,1rem)*1.5)] @xl:flex-row @xl:items-center @xl:justify-between", styles[variant as keyof typeof styles] ?? styles.brand)}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex max-w-prose flex-col gap-1">
        <h3 className="text-2xl leading-tight">{String(props.title || "Inner Circle opens on 1 November")}</h3>
        <p className="opacity-80">{String(props.text || "Small group, weekly 1:1 reviews, and the full playbook.")}</p>
      </div>
      {props.button !== "" && (
        <Button variant={variant === "brand" ? "secondary" : "default"} size="lg" className="shrink-0" {...link(`${base}/${String(props.target || "courses")}`)}>
          {String(props.button || "Find out more")} <ArrowRight />
        </Button>
      )}
    </div>
  )
}

/** Text: plain, quote, centred. */
export function TextBlock({ variant = "plain", props }: WidgetProps) {
  const { coach } = useCoach()
  const title = String(props.title || "How this works")
  const text = String(props.text || "Watch one lesson a day, join Monday's live session, and journal every trade. Ask for a review whenever you're unsure.")
  if (variant === "quote") {
    return (
      <W className="justify-center">
        <figure className="flex flex-col gap-3 border-l-4 border-primary py-1 pl-5">
          <blockquote className="font-heading text-2xl leading-snug">“{text}”</blockquote>
          <figcaption className="text-sm text-muted-foreground">— {coach.coachName}</figcaption>
        </figure>
      </W>
    )
  }
  return (
    <W className={cn("gap-2", variant === "centered" && "items-center justify-center text-center")}>
      <h3 className="text-2xl leading-tight">{title}</h3>
      <p className="max-w-prose whitespace-pre-line text-muted-foreground">{text}</p>
    </W>
  )
}

/** Partner links: list, tiles (logo grid), chips. */
export function PartnerLinks({ variant = "list" }: WidgetProps) {
  if (variant === "tiles") {
    return (
      <Card className="@container rounded-(--radius)">
        <CardHeader>
          <CardDescription className="eyebrow">Tools and partners</CardDescription>
          <CardTitle className="text-lg">What we use</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
          {PARTNERS.map((p) => (
            <a key={p.name} href="#" className="r-inner grid gap-2 border p-3 hover:bg-muted">
              <span className="r-chip grid size-9 place-items-center text-sm font-bold text-white" style={{ background: p.color }}>
                {p.name[0]}
              </span>
              <span className="text-sm leading-tight">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.note}</span>
            </a>
          ))}
        </CardContent>
      </Card>
    )
  }
  if (variant === "chips") {
    return (
      <W className="flex-row flex-wrap content-center items-center gap-2">
        <span className="eyebrow mr-1">Our tools</span>
        {PARTNERS.map((p) => (
          <a key={p.name} href="#" className="r-chip flex items-center gap-2 border bg-card px-3 py-1.5 text-sm hover:bg-muted">
            <span className="r-dot size-2" style={{ background: p.color }} />
            {p.name}
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </a>
        ))}
      </W>
    )
  }
  return (
    <Card className="rounded-(--radius)">
      <CardHeader>
        <CardDescription className="eyebrow">Tools and partners</CardDescription>
        <CardTitle className="text-lg">What we use</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {PARTNERS.map((p) => (
          <a key={p.name} href="#" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
            <span className="r-chip grid size-8 shrink-0 place-items-center text-xs font-bold text-white" style={{ background: p.color }}>
              {p.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{p.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.note}</span>
            </span>
            {p.tag && <Badge variant="outline">{p.tag}</Badge>}
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </a>
        ))}
      </CardContent>
    </Card>
  )
}

/** Ask the AI: search (centred box), chat (example exchange), quota (questions left), brand (search, on the coach's colour). */
export function AiAsk({ variant = "search" }: WidgetProps) {
  const { coach } = useCoach()
  const box = (
    <div className="flex w-full items-center gap-2 rounded-[var(--button-radius)] border bg-background p-1.5 pl-4">
      <span className="flex-1 truncate text-left text-sm text-muted-foreground">Ask about a lesson or your trades…</span>
      <Button size="sm">Ask</Button>
    </div>
  )

  if (variant === "quota") {
    const used = 18
    const quota = 50
    return (
      <W>
        <Head icon={Sparkles} label={coach.wording.ai} right="This month" />
        <div className="flex flex-1 items-center gap-4">
          <Ring value={(used / quota) * 100} size={76} stroke={8}>
            <span className="font-heading text-lg font-semibold tabular-nums">{quota - used}</span>
          </Ring>
          <div className="grid gap-1">
            <Caps>Questions left</Caps>
            <span className="text-sm text-muted-foreground">
              {used} of {quota} used. Resets on 1 November.
            </span>
          </div>
        </div>
        {box}
      </W>
    )
  }

  if (variant === "chat") {
    return (
      <W className="grid content-center gap-4 @3xl:grid-cols-[1fr_1.4fr] @3xl:items-center">
        <div className="grid gap-2">
          <h3 className="flex items-center gap-2 text-xl leading-tight @3xl:flex-col @3xl:items-start @3xl:text-2xl">
            <Sparkles className="size-5 shrink-0 text-primary @3xl:size-6" /> Stuck? {askAi(coach.wording.ai)}.
          </h3>
          <p className="hidden text-sm text-muted-foreground @3xl:block">Answers come from {coach.coachName}&apos;s own lessons, with a link to the exact moment. Not investment advice.</p>
        </div>
        <div className="r-inner grid gap-2 bg-muted/60 p-3">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">{AI_SAMPLE.question}</div>
          <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
            {AI_SAMPLE.answer}
            <div className="mt-1.5 text-xs text-primary">▶ {AI_SAMPLE.source}</div>
          </div>
          {box}
        </div>
      </W>
    )
  }

  return (
    <W brand={variant === "brand"} className="items-center justify-center gap-4 text-center">
      <Sparkles className="size-6 text-primary" />
      <h3 className="text-2xl leading-tight">{askAi(coach.wording.ai)} anything</h3>
      <div className="w-full max-w-xl">{box}</div>
      <p className="text-xs text-muted-foreground">Answers come from {coach.coachName}&apos;s lessons. Not investment advice.</p>
    </W>
  )
}
