"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, CalendarClock, CircleHelp, Globe, Link2, Play, PlayCircle } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VideoThumb, ctaLink, webUrl } from "./brand"
import { Chip, Label, WCard, useFigureFont } from "./instrument"
import { TYPE, W, useMore } from "./kit"
import { Cover, type WidgetProps } from "./shared"

// The coach's own content: pictures, buttons, embeds and a hero. These are the
// coach's words, not student data, so they show their sample in the empty data
// mode too.

const SAMPLE_CAPTION = "Our trading floor, London"
const CLIP = "overflow-hidden rounded-[min(var(--radius),8px)]"

/**
 * The coach's picture (a data URL from an upload) filling its box, or the
 * course artwork until they upload one. `flush` drops the rounding for a
 * picture that touches the card's edges.
 */
export function Picture({ src, alt, label, flush, className }: { src?: unknown; alt: string; label?: string; flush?: boolean; className?: string }) {
  const url = typeof src === "string" && src ? src : undefined
  return (
    <div className={cn("relative min-h-0 min-w-0", !flush && CLIP, className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- an uploaded data URL, not something next/image can optimise
        <img src={url} alt={alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <Cover label={label} className="absolute inset-0 rounded-none" />
      )}
    </div>
  )
}

// ---------- Image

/** Image: cover (the picture is the card), caption (picture and a line under it), side (picture left, words right). */
export function ImageBlock({ variant = "cover", props }: WidgetProps) {
  const more = useMore("standard")
  const title = String(props.title || "")
  const text = String(props.text || "")

  if (variant === "caption") {
    const caption = title || text || SAMPLE_CAPTION
    return (
      <W className="gap-2.5 p-[calc(0.625rem*var(--density,1))]">
        <Picture src={props.image} alt={caption} className="flex-1" />
        <div className="grid min-w-0 gap-0.5 px-1">
          <span className={cn(title ? TYPE.title : TYPE.body, "line-clamp-1")}>{caption}</span>
          {title && text && more && <span className={cn(TYPE.small, "line-clamp-1")}>{text}</span>}
        </div>
      </W>
    )
  }

  if (variant === "side") {
    return (
      <W className="flex-row items-stretch gap-4 p-[calc(0.625rem*var(--density,1))]">
        <Picture src={props.image} alt={title || SAMPLE_CAPTION} className="w-[42%] shrink-0 @xl:w-[36%]" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-1">
          <h3 className={cn(TYPE.value, "line-clamp-2 text-balance")}>{title || SAMPLE_CAPTION}</h3>
          {more && <p className={cn(TYPE.body, "line-clamp-3 text-muted-foreground")}>{text || "Where the weekly reviews are recorded."}</p>}
        </div>
      </W>
    )
  }

  return (
    <W className="gap-0 p-0">
      <Picture flush src={props.image} alt={title || text || SAMPLE_CAPTION} label={title || text || SAMPLE_CAPTION} className="flex-1" />
    </W>
  )
}

// ---------- Button

/** Button: filled and outline (the call to action in a card of its own), row (label left, button right). */
export function ButtonBlock({ variant = "filled", props }: WidgetProps) {
  const { base } = useCoach()
  const more = useMore("standard")
  const label = String(props.title || "Book a call")
  const text = String(props.text || "")
  const go = ctaLink(base, props, "calendar")

  if (variant === "row") {
    return (
      <W row className="flex-row items-center justify-center gap-3">
        <span className="grid min-w-0 flex-1">
          <span className={cn(TYPE.title, "truncate")}>{label}</span>
          {text && more && <span className={cn(TYPE.small, "truncate")}>{text}</span>}
        </span>
        <Button size="sm" className="w-fit shrink-0" {...go}>
          Open <ArrowRight />
        </Button>
      </W>
    )
  }

  return (
    <W row className="justify-center gap-1.5">
      <Button variant={variant === "outline" ? "outline" : "default"} size="lg" className="w-full min-w-0" {...go}>
        <span className="truncate">{label}</span> <ArrowRight />
      </Button>
      {text && more && <span className={cn(TYPE.small, "line-clamp-1 text-center")}>{text}</span>}
    </W>
  )
}

// ---------- Embed

type Embedded = { kind: "video" | "page"; src: string; href: string; host: string }

/** A YouTube or Vimeo link becomes its player address; any other web address stays a page. Not a web address: undefined. */
export function parseEmbed(raw: unknown): Embedded | undefined {
  const u = webUrl(raw)
  if (!u) return undefined
  const host = u.hostname.replace(/^www\./, "")
  const seg = u.pathname.split("/").filter(Boolean)
  let yt: string | undefined
  if (host === "youtu.be") yt = seg[0]
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    yt = seg[0] === "watch" ? (u.searchParams.get("v") ?? undefined) : ["embed", "shorts", "live", "v"].includes(seg[0]) ? seg[1] : undefined
  }
  if (yt && /^[\w-]{6,}$/.test(yt)) return { kind: "video", src: `https://www.youtube.com/embed/${yt}`, host, href: u.href }
  const vm = host === "vimeo.com" ? seg.find((s) => /^\d+$/.test(s)) : host === "player.vimeo.com" && seg[0] === "video" ? seg[1] : undefined
  if (vm && /^\d+$/.test(vm)) return { kind: "video", src: `https://player.vimeo.com/video/${vm}`, href: u.href, host }
  return { kind: "page", src: u.href, href: u.href, host }
}

function Frame({ src, title, className }: { src: string; title: string; className?: string }) {
  return <iframe src={src} title={title} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className={cn("absolute inset-0 size-full border-0 bg-background", className)} />
}

/** Embed: video (a 16:9 frame), page (the page fills the card), row (the title and a play button). */
export function Embed({ variant = "video", props }: WidgetProps) {
  const more = useMore("standard")
  const e = parseEmbed(props.url)
  const title = String(props.title || "")

  if (variant === "row") {
    return (
      <W row className="flex-row items-center justify-center gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-[min(var(--radius),7px)] bg-muted">
          <PlayCircle className="size-3.5" />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className={cn(TYPE.title, "truncate")}>{title || e?.host || "Watch the video"}</span>
          {more && <span className={cn(TYPE.small, "truncate")}>{e ? e.host : "2:14"}</span>}
        </span>
        <Button size="sm" className="w-fit shrink-0" nativeButton={false} render={<a href={e?.href ?? "#"} target="_blank" rel="noreferrer" />}>
          <Play /> Watch
        </Button>
      </W>
    )
  }

  if (variant === "page") {
    if (!e) {
      return (
        <W className="p-[calc(0.625rem*var(--density,1))]">
          <div className={cn(CLIP, "grid flex-1 place-items-center content-center gap-1.5 bg-muted p-4 text-center")}>
            <Globe className="size-4 text-muted-foreground" />
            <span className={cn(TYPE.body, "text-balance text-muted-foreground")}>Paste an address in the widget&apos;s settings</span>
          </div>
        </W>
      )
    }
    return (
      <W className="relative gap-0 p-0">
        <Frame src={e.src} title={title || e.host} />
      </W>
    )
  }

  // video: a 16:9 frame as large as the card allows, centred.
  const caption = title || (e ? "" : "How I plan my week")
  return (
    <W className="gap-2 p-[calc(0.625rem*var(--density,1))]">
      <div className="min-h-0 flex-1 [container-type:size]">
        <div className="mx-auto grid h-full place-items-center">
          <div className={cn(CLIP, "relative aspect-video")} style={{ width: "min(100cqw, 100cqh * 16 / 9)" }}>
            {e?.kind === "video" ? <Frame src={e.src} title={title || e.host} /> : <VideoThumb className="absolute inset-0" />}
          </div>
        </div>
      </div>
      {(caption || (e && e.kind === "page")) && (
        <div className="grid min-w-0 gap-0.5 px-1">
          {caption && <span className={cn(TYPE.title, "line-clamp-1")}>{caption}</span>}
          {e && e.kind === "page" && <span className={cn(TYPE.small, "line-clamp-1")}>{e.host}</span>}
        </div>
      )}
    </W>
  )
}

// ---------- Hero

/** The words of a hero: small label, headline, text and a button. */
function HeroWords({ props, split }: { props: WidgetProps["props"]; split?: boolean }) {
  const { base } = useCoach()
  const more = useMore("standard")
  const eyebrow = String(props.eyebrow || "")
  const title = String(props.title || "Trade with a plan")
  const text = String(props.text || "Six setups, one rulebook, weekly reviews.")
  return (
    <>
      <div className="grid min-w-0 gap-1">
        {eyebrow && <Label className="truncate">{eyebrow}</Label>}
        <h3 className={cn(TYPE.value, "text-balance @3xl:text-[1.75rem] @3xl:leading-8", split ? "line-clamp-3" : "line-clamp-2")}>{title}</h3>
        {more && <p className={cn(TYPE.body, "max-w-prose text-muted-foreground", split ? "line-clamp-4" : "line-clamp-2 hidden @md:block")}>{text}</p>}
      </div>
      {props.button !== "" && (
        <Button size="sm" className="w-fit shrink-0" {...ctaLink(base, props)}>
          {String(props.button || "Start here")} <ArrowRight />
        </Button>
      )}
    </>
  )
}

/** Hero: image and video (the picture fills the card, the words on a solid strip under it), split (picture beside the words, stacked when narrow). */
export function Hero({ variant = "image", props }: WidgetProps) {
  const title = String(props.title || "Trade with a plan")

  if (variant === "split") {
    return (
      <W className="gap-0 p-0 @xl:flex-row">
        <Picture flush src={props.image} alt={title} className="min-h-16 flex-1 @xl:w-1/2 @xl:flex-none" />
        <div className="flex min-w-0 shrink-0 flex-col justify-center gap-3 p-[calc(1rem*var(--density,1))] @xl:w-1/2 @xl:p-[calc(1.5rem*var(--density,1))]">
          <HeroWords props={props} split />
        </div>
      </W>
    )
  }

  return (
    <W className="gap-0 p-0">
      {variant === "video" ? <VideoThumb className="flex-1 rounded-none" /> : <Picture flush src={props.image} alt={title} className="flex-1" />}
      <div className="flex min-w-0 shrink-0 flex-col gap-3 bg-card p-[calc(1rem*var(--density,1))] @lg:flex-row @lg:items-end @lg:justify-between">
        <HeroWords props={props} />
      </div>
    </W>
  )
}

// ---------- Questions

type QA = { q: string; a: string }

const SAMPLE_FAQ: QA[] = [
  { q: "Do I need experience to join?", a: "No. The first course starts from how a chart works and builds up to a full trading plan." },
  { q: "Which markets do you teach?", a: "Futures and forex, mostly index futures and the major currency pairs." },
  { q: "How much time does it take each week?", a: "About four hours: two lessons, one live session and your journal after each trade." },
  { q: "Can I get my trades reviewed?", a: "Yes. Log a trade in your journal and ask for a review. I answer within two days." },
]

/** One question per line: "question | answer". A line without "|" is a question with no answer. */
function parseFaq(raw: unknown): QA[] {
  const items = String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("|")
      return i < 0 ? { q: l, a: "" } : { q: l.slice(0, i).trim(), a: l.slice(i + 1).trim() }
    })
    .filter((x) => x.q)
  return items.length ? items : SAMPLE_FAQ
}

function FaqRows({ items }: { items: QA[] }) {
  return (
    <Accordion className="min-w-0">
      {items.map((x, i) =>
        x.a ? (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="py-2 text-[0.8125rem] leading-5">{x.q}</AccordionTrigger>
            <AccordionContent className={cn(TYPE.body, "pb-2 text-muted-foreground")}>{x.a}</AccordionContent>
          </AccordionItem>
        ) : (
          <div key={i} className="py-2 text-[0.8125rem] leading-5 font-medium not-last:border-b">
            {x.q}
          </div>
        ),
      )}
    </Accordion>
  )
}

/** Questions: list (one column), two (two columns when wide), row (the first question and its answer). */
export function Faq({ variant = "list", props }: WidgetProps) {
  const title = String(props.title || "Questions")
  const items = parseFaq(props.items)

  if (variant === "row") {
    const first = items[0]
    return <WCard row icon={CircleHelp} title={first.q} meta={first.a || undefined} chip={<Chip tone="neutral">{items.length} questions</Chip>} />
  }

  const half = Math.ceil(items.length / 2)
  return (
    <WCard icon={CircleHelp} title={title} meta={`${items.length} questions`} bodyClassName="overflow-y-auto">
      {variant === "two" ? (
        <div className="grid items-start gap-x-6 @2xl:grid-cols-2">
          <FaqRows items={items.slice(0, half)} />
          {items.length > 1 && <FaqRows items={items.slice(half)} />}
        </div>
      ) : (
        <FaqRows items={items} />
      )}
    </WCard>
  )
}

// ---------- Links

type Item = { name: string; href: string; external: boolean; host: string }

/** A web address the coach typed: with http(s), or a bare "example.com/path". */
const isWeb = (t: string) => /^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t)

/** One link per line: "name | address". The address is a web address (new tab) or a page of the platform, like "courses". */
function parseLinks(raw: unknown, base: string): Item[] {
  const lines = String(raw ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const sample = [
    "TradingView | https://www.tradingview.com",
    "Our Discord | https://discord.com/invite/trading",
    "Position size calculator | https://docs.google.com/spreadsheets/d/position-size",
    "Rules | p/rules",
  ]
  return (lines.length ? lines : sample)
    .map((l) => {
      const i = l.indexOf("|")
      const target = (i < 0 ? l : l.slice(i + 1)).trim()
      const web = isWeb(target) ? webUrl(target) : undefined
      const name = (i < 0 ? web?.hostname.replace(/^www\./, "") : l.slice(0, i).trim()) || target
      return web
        ? { name, href: web.href, external: true, host: web.hostname.replace(/^www\./, "") }
        : { name, href: `${base}/${target.replace(/^\/+/, "")}`, external: false, host: "On this site" }
    })
    .filter((x) => x.name)
}

function A({ item, className, children }: { item: Item; className?: string; children: React.ReactNode }) {
  return item.external ? (
    <a href={item.href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {children}
    </Link>
  )
}

/** Links: list (rows with an arrow), tiles (small tiles with the host), row (chips). */
export function Links({ variant = "list", props }: WidgetProps) {
  const { base } = useCoach()
  const more = useMore("standard")
  const detailed = useMore("detailed")
  const title = String(props.title || "Links")
  const items = parseLinks(props.items, base)
  const count = <Chip tone="neutral">{items.length} links</Chip>

  if (variant === "row") {
    return (
      <WCard row icon={Link2} title={title} chip={count}>
        <div className="hidden min-w-0 flex-[2] justify-end gap-1.5 overflow-hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] @[26rem]:flex">
          {items.map((x, i) => (
            <A key={i} item={x} className="r-chip flex shrink-0 items-center gap-1 border px-2 py-1 text-xs hover:bg-muted">
              {x.name}
              {x.external && <ArrowUpRight className="size-3 text-muted-foreground" />}
            </A>
          ))}
        </div>
      </WCard>
    )
  }

  if (variant === "tiles") {
    return (
      <WCard icon={Link2} title={title} meta={`${items.length} links`} chip={count}>
        <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
          {items.map((x, i) => (
            <A key={i} item={x} className="relative grid min-h-0 min-w-0 content-center justify-items-start gap-0.5 rounded-[min(var(--radius),8px)] border bg-card p-2.5 hover:bg-muted">
              <span className="max-w-full truncate pr-4 font-heading text-[0.8125rem] leading-5 font-medium tracking-tight">{x.name}</span>
              {more && <span className={cn(TYPE.small, "max-w-full truncate")}>{x.host}</span>}
              <ArrowUpRight className="absolute top-2 right-2 size-3.5 text-muted-foreground" />
            </A>
          ))}
        </div>
      </WCard>
    )
  }

  return (
    <WCard icon={Link2} title={title} meta={`${items.length} links`} chip={count} bodyClassName="overflow-y-auto">
      <div className="grid">
        {items.map((x, i) => (
          <A key={i} item={x} className="group flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-2 last:border-b-0">
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-heading text-[0.8125rem] leading-5 font-medium tracking-tight group-hover:underline">{x.name}</span>
              {detailed && <span className={cn(TYPE.small, "truncate")}>{x.host}</span>}
            </span>
            {x.external ? <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /> : <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
          </A>
        ))}
      </div>
    </WCard>
  )
}

// ---------- Countdown

/** The prototype's today is 12 Oct 2026: the sample counts down to 22 Oct 2026, 09:00. */
const SAMPLE_DATE = new Date(2026, 9, 22, 9, 0, 0)

function parseDate(raw: unknown): Date {
  const v = String(raw ?? "").trim()
  if (!v) return SAMPLE_DATE
  // "2026-11-01 09:00" is not a format every browser reads: make it ISO (local time).
  const d = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(v) ? v.replace(" ", "T") : v)
  return Number.isNaN(d.getTime()) ? SAMPLE_DATE : d
}

const tick = (cb: () => void) => {
  const t = setInterval(cb, 1000)
  return () => clearInterval(t)
}
const nowSecond = () => Math.floor(Date.now() / 1000) * 1000

/** Ticks once a second. Before the page is on the client, 0 (so server and client render the same). */
function useCountdown(raw: unknown) {
  const now = useSyncExternalStore(tick, nowSecond, () => 0)
  const date = parseDate(raw)
  const ready = now > 0
  const left = ready ? Math.max(0, date.getTime() - now) : 0
  const s = Math.floor(left / 1000)
  const parts = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
  const pad = (n: number) => String(n).padStart(2, "0")
  const short = parts.d > 0 ? `${parts.d}d ${pad(parts.h)}h` : parts.h > 0 ? `${parts.h}h ${pad(parts.m)}m` : `${parts.m}m ${pad(parts.s)}s`
  return { date, ready, over: ready && left === 0, parts, short, pad }
}

function Figures({ c, size }: { c: ReturnType<typeof useCountdown>; size: "lg" | "md" }) {
  const font = useFigureFont()
  const cells: [string, number][] = [["days", c.parts.d], ["hours", c.parts.h], ["minutes", c.parts.m], ["seconds", c.parts.s]]
  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([label, n]) => (
        <div key={label} className="grid min-w-0 justify-items-center gap-0.5 rounded-[min(var(--radius),8px)] bg-muted/50 py-2">
          <span className={cn(size === "lg" ? TYPE.valueLg : TYPE.value, "tracking-[-0.02em]")} style={{ fontFamily: font }}>
            {c.ready ? c.pad(n) : "--"}
          </span>
          <span className={cn(TYPE.small, "max-w-full truncate px-1")}>{label}</span>
        </div>
      ))}
    </div>
  )
}

/** Countdown: big (four figures), line (one row with a button), card (title, text, figures and a button). */
export function Countdown({ variant = "big", props }: WidgetProps) {
  const { base } = useCoach()
  const more = useMore("standard")
  const c = useCountdown(props.date)
  const title = String(props.title || "Next cohort starts")
  const label = props.button === "" ? "" : String(props.button || "Save my spot")
  const go = ctaLink(base, props, "calendar")
  const when = c.ready ? c.date.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : undefined
  const button = label && (
    <Button size="sm" className="w-fit shrink-0" {...go}>
      {label} <ArrowRight />
    </Button>
  )

  if (variant === "line") {
    return (
      <WCard row icon={CalendarClock} title={title} meta={more ? when : undefined}>
        <span className={cn(TYPE.title, "ml-auto hidden shrink-0 tabular-nums @[16rem]:inline")}>{c.over ? "Started" : c.ready ? `Starts in ${c.short}` : "Starts in …"}</span>
        {button}
      </WCard>
    )
  }

  if (variant === "card") {
    const text = String(props.text || "Doors open for the next group. Places are limited.")
    return (
      <WCard icon={CalendarClock} title={title} meta={when}>
        {more && <p className={cn(TYPE.body, "line-clamp-3 text-muted-foreground")}>{text}</p>}
        {c.over ? <span className={TYPE.value}>Started</span> : <Figures c={c} size="md" />}
        <div className="mt-auto flex">{button}</div>
      </WCard>
    )
  }

  return (
    <WCard icon={CalendarClock} title={title} meta={when}>
      {c.over ? (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className={TYPE.valueLg}>Started</span>
          {button}
        </div>
      ) : (
        <div className="my-auto">
          <Figures c={c} size="lg" />
        </div>
      )}
    </WCard>
  )
}
