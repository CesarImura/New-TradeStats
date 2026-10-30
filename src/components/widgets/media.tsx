"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaCarouselType } from "embla-carousel"
import { AnimatePresence, motion } from "motion/react"
import { useShouldReduceMotion } from "@animate-ui/react/utils/motion"
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Download, GalleryHorizontal, Lock, Play } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { useViewerTier } from "@/lib/data/access"
import { canAccess, courseStats, openLessons, resumeLesson, studentCourses, useCatalog, useProgress } from "@/lib/data/learning"
import { categoryLabel, isRecent, useDownloads } from "@/lib/data/downloads"
import { cn } from "@/lib/utils"
import { ACCENT, CTA, MOTION, TYPE, W, series, useFrame, useMore } from "./kit"
import { WCard } from "./instrument"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

// Media widgets: posters in a row, a carousel or a grid (Shelf), and a full-width Featured hero (content.tsx Hero).
// The one place widgets lay words over a picture with a fade (Gustavo, 30 Oct: an exception to "no gradients" for
// media). The fade is always the card's own colour, so it follows whatever the coach picked, and the words sit where it
// is solid: they are measured against the card, never against the picture.

export type Shape = "portrait" | "landscape" | "square"

const RATIO: Record<Shape, string> = { portrait: "aspect-[2/3]", landscape: "aspect-video", square: "aspect-square" }

/** The card colour rising from the bottom of a picture: solid under the words, gone by the middle. */
export const FADE_UP = "linear-gradient(to top, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 88%, transparent) 22%, color-mix(in oklab, var(--fade-to) 45%, transparent) 48%, transparent 72%)"
/** Where the fade lands: the card colour, or the brand on a filled Star (whose --card is transparent). Set on each media root. */
export const FADE_TO = "[--fade-to:var(--card)] in-[.fx-hero]:[--fade-to:var(--brand,var(--chart-1))]"
/** A softer veil at the top, for a tag or a lock. */
const FADE_DOWN = "linear-gradient(to bottom, color-mix(in oklab, var(--fade-to) 55%, transparent) 0%, transparent 28%)"

/** One poster: what it is, where it goes and what the student has done with it. */
export type MediaItem = {
  id: string
  title: string
  /** A short line under the title (a tagline, a duration). */
  sub?: string
  tags: string[]
  /** Series colour index for the sample artwork. */
  tone: number
  href: string
  /** 0 to 100, or undefined when progress means nothing (a download). */
  pct?: number
  /** What the line under the poster says: "0% complete", "12 min left". */
  status?: string
  locked?: string
  fresh?: boolean
  /** A small line above the title on the sample poster ("Course 01"). */
  kicker?: string
  picture?: string
}

/** Candle heights for the poster's chart, one set per item so posters differ. */
const CANDLES = [
  [22, 30, 26, 38, 34, 46, 41, 55, 50, 63, 58, 72],
  [60, 52, 57, 44, 49, 38, 45, 52, 47, 58, 66, 61],
  [30, 34, 28, 42, 48, 40, 55, 51, 46, 60, 57, 70],
  [48, 40, 52, 46, 58, 54, 50, 62, 68, 60, 72, 78],
]

/**
 * The sample poster when there is no picture: a surface tinted with the item's series colour that follows the theme
 * (light on light themes, dark on dark ones), a candle chart rising into the corner with the accent on the last candle,
 * and the title typeset in the theme's heading font, as on a printed poster. With `typeset` off only the picture shows.
 */
function Art({ item, shape = "portrait", typeset, className }: { item: MediaItem; shape?: Shape; typeset?: boolean; className?: string }) {
  if (item.picture)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an uploaded data URL
      <img src={item.picture} alt="" className={cn("absolute inset-0 size-full object-cover", className)} />
    )
  const candles = CANDLES[Math.abs(hash(item.id)) % CANDLES.length]
  const wide = shape === "landscape"
  return (
    <div className={cn("absolute inset-0 overflow-hidden text-card-foreground", className)} style={{ background: `color-mix(in oklab, ${series(item.tone)} 30%, var(--muted))` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {candles.map((h, i) => {
          const x = (wide ? 44 : 8) + i * (wide ? 4.6 : 7.4)
          const w = wide ? 2.4 : 3.8
          const y = 100 - h * (wide ? 0.9 : 0.62) - 6
          const last = i === candles.length - 1
          return (
            <g key={i} stroke={last ? ACCENT : "currentColor"} fill={last ? ACCENT : i % 3 === 1 ? "none" : "currentColor"} opacity={last ? 0.9 : 0.14}>
              <line x1={x + w / 2} x2={x + w / 2} y1={y - 4} y2={y + 14} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
              <rect x={x} y={y} width={w} height={i % 3 === 1 ? 7 : 10} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>
      {typeset && (
        <div className={cn("absolute inset-x-0 top-0 grid gap-1.5 p-[calc(0.875rem*var(--density,1))]", wide && "max-w-[62%]")}>
          {item.kicker && <span className="truncate text-[0.6875rem] leading-4 font-medium tracking-[0.08em] uppercase opacity-70">{item.kicker}</span>}
          <PosterTitle text={item.title} sizes={wide ? [20, 13] : [28, 20, 13]} lines={wide || shape === "square" ? 2 : 3} />
        </div>
      )}
    </div>
  )
}

/** A row of posters agrees on one title size (each reports what fits it; all use the smallest). */
const TitleSizeContext = createContext<{ size: number; report: (id: string, px: number) => void } | null>(null)

function SameTitleSize({ children }: { children: React.ReactNode }) {
  const [sizes, setSizes] = useState<Record<string, number>>({})
  const report = useCallback((id: string, px: number) => setSizes((m) => (m[id] === px ? m : { ...m, [id]: px })), [])
  const size = Math.min(99, ...Object.values(sizes))
  return <TitleSizeContext.Provider value={{ size, report }}>{children}</TitleSizeContext.Provider>
}

/** The poster sizes from the type scale: 28, 20 and 13px, each with a tight leading. */
const POSTER_SIZE: Record<number, string> = { 28: "text-[1.75rem] leading-[0.98]", 20: "text-xl leading-[1.05]", 13: "text-[0.8125rem] leading-4" }

/**
 * A poster title at the largest size where every word fits on its line and the title in `lines` lines. Words never
 * break in the middle (a heading font can be wide); the smallest size truncates instead. Measured again on resize.
 */
function PosterTitle({ text, sizes, lines }: { text: string; sizes: number[]; lines: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [own, setSize] = useState(sizes[0])
  const shared = useContext(TitleSizeContext)
  useEffect(() => shared?.report(text, own), [shared, text, own])
  // Posters side by side share one size: the smallest any of them needs.
  const size = shared && shared.size < own && sizes.includes(shared.size) ? shared.size : own
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      for (const px of sizes) {
        el.style.fontSize = `${px}px`
        const lh = parseFloat(getComputedStyle(el).lineHeight) || px
        if (el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= lh * lines + 2) {
          el.style.fontSize = ""
          setSize(px)
          return
        }
      }
      el.style.fontSize = ""
      setSize(sizes[sizes.length - 1])
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement ?? el)
    return () => ro.disconnect()
    // sizes is a literal per call site; its contents are what matter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, lines, sizes.join()])
  const last = size === sizes[sizes.length - 1]
  return (
    <span ref={ref} className={cn("block overflow-hidden font-heading [font-weight:var(--w-value-weight,500)] tracking-tight text-balance break-normal uppercase", POSTER_SIZE[size])} style={last ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines } : undefined}>
      {text}
    </span>
  )
}

/** A small stable number from a string, so a poster keeps its chart. */
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

/** A small tag on a picture: a hairline pill on the faded card colour. */
function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-(--r-chip) px-1.5 text-[0.6875rem] leading-4 font-medium whitespace-nowrap",
        "border border-[color-mix(in_oklab,var(--card-foreground)_22%,transparent)] bg-[color-mix(in_oklab,var(--fade-to)_62%,transparent)] text-card-foreground",
      )}
      style={strong ? { borderColor: ACCENT, color: "var(--card-foreground)" } : undefined}
    >
      {children}
    </span>
  )
}

/** A thin progress line: the accent is the one mark on the poster. */
function Meter({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("relative block h-[3px] overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_16%,transparent)]", className)}>
      <span className="absolute inset-y-0 left-0 origin-left rounded-(--r-bar)" style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: ACCENT }} />
    </span>
  )
}

/**
 * One poster. Words on the picture (on its fade) or under it. On hover (a mouse, not a finger) the picture leans in,
 * the fade deepens and a "Start" line opens under the title; a press settles it back a touch. Reduced motion keeps the
 * reveal and drops the movement.
 */
export function Tile({ item, shape, over, className }: { item: MediaItem; shape: Shape; over: boolean; className?: string }) {
  const more = useMore("standard")
  const badges = !!item.picture
  const cta = item.locked ? `Needs ${item.locked}` : item.pct ? "Continue" : item.pct === undefined ? "Open" : "Start"
  return (
    <Link
      href={item.href}
      draggable={false}
      className={cn(FADE_TO, "group/tile relative grid min-w-0 gap-2 rounded-[min(var(--radius),10px)] outline-none select-none", "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card", className)}
    >
      <div
        className={cn(
          "@container/tile relative isolate overflow-hidden rounded-[min(var(--radius),10px)] bg-(--media-bg) ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_10%,transparent)] ring-inset",
          "transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-active/tile:scale-[0.985] motion-reduce:group-active/tile:scale-100",
          "[@media(hover:hover)]:group-hover/tile:ring-[color-mix(in_oklab,var(--card-foreground)_24%,transparent)]",
          RATIO[shape],
        )}
      >
        <div className="absolute inset-0 transition-transform duration-[700ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover/tile:scale-[1.06] motion-reduce:[@media(hover:hover)]:group-hover/tile:scale-100">
          <Art item={item} shape={shape} typeset />
        </div>
        {/* New and locked go on top of a picture; on a typeset poster the title owns the top, so they join the tags below. */}
        {badges && (item.locked || item.fresh) && <div aria-hidden className="absolute inset-x-0 top-0 h-1/2" style={{ background: FADE_DOWN }} />}
        {badges && <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {item.fresh ? <Tag strong>New</Tag> : <span />}
          {item.locked && (
            <Tag>
              <Lock className="size-3" />
              {item.locked}
            </Tag>
          )}
        </div>}
        {over && (
          <>
            <div aria-hidden className="absolute inset-0 opacity-90 transition-opacity duration-500 [@media(hover:hover)]:group-hover/tile:opacity-100" style={{ background: FADE_UP }} />
            <div className="absolute inset-x-0 bottom-0 grid gap-2 p-[calc(0.75rem*var(--density,1))]">
              {item.picture && <h4 className={cn("font-heading text-xl leading-6 [font-weight:var(--w-value-weight,500)] tracking-tight text-balance text-card-foreground", shape === "landscape" ? "line-clamp-2" : "line-clamp-3")}>{item.title}</h4>}
              {more && item.tags.length > 0 && (badges || shape !== "landscape") && (
                <div className="flex min-w-0 gap-1 overflow-hidden">
                  {!badges && item.fresh && <Tag strong>New</Tag>}
                  {!badges && item.locked && (
                    <Tag>
                      <Lock className="size-3" />
                      {item.locked}
                    </Tag>
                  )}
                  {item.tags.slice(0, badges ? 2 : 1).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}
              {/* The hover line: closed rows open to their height, so nothing jumps. Always open on touch. */}
              <div className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:grid-rows-[1fr] [@media(hover:hover)]:group-hover/tile:opacity-100 [@media(hover:hover)]:group-focus-visible/tile:grid-rows-[1fr] [@media(hover:hover)]:group-focus-visible/tile:opacity-100">
                <span className="flex min-h-0 items-center gap-1 overflow-hidden text-[0.6875rem] leading-4 font-medium text-card-foreground">
                  {item.locked ? <Lock className="size-3" /> : <Play className="size-3" />}
                  {cta}
                  <ArrowRight className="size-3 transition-transform duration-300 group-hover/tile:translate-x-0.5" />
                </span>
              </div>
            </div>
          </>
        )}
        {/* Under-the-picture layout: progress runs along the poster's bottom edge. */}
        {!over && item.pct !== undefined && item.pct > 0 && <Meter pct={item.pct} className="absolute inset-x-0 bottom-0 rounded-none" />}
      </div>
      {over ? (
        item.status && (
          <div className="flex min-w-0 items-center gap-2 px-0.5">
            {item.pct !== undefined && <Meter pct={item.pct} className="w-8 shrink-0" />}
            <span className={cn(TYPE.small, "truncate tabular-nums")}>{item.status}</span>
          </div>
        )
      ) : (
        <div className="grid min-w-0 gap-0.5 px-0.5">
          {/* The sample poster already carries the title in its type; a picture needs it written under. */}
          {item.picture && <span className={cn(TYPE.title, "truncate")}>{item.title}</span>}
          <span className={cn(TYPE.small, "truncate tabular-nums")}>{[!badges && item.fresh && "New", !badges && item.locked && `Needs ${item.locked}`, item.tags[0], item.status].filter(Boolean).join(" · ")}</span>
        </div>
      )}
    </Link>
  )
}

// ---------- Data

export type Source = "courses" | "lessons" | "downloads"

/** The default poster shape for each source: courses as posters, lessons as frames, files as squares. */
export const SHAPE_OF: Record<Source, Shape> = { courses: "portrait", lessons: "landscape", downloads: "square" }

/** The posters a Shelf shows, from the coach's catalogue, the student's progress or the coach's files. */
export function useMediaItems(source: Source): { items: MediaItem[]; title: string; href: string } {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useViewerTier(coach)
  const files = useDownloads(coach)
  const empty = useEmpty()
  const courses = studentCourses(catalog)
  const needs = (tiers: string[]) => coach.tiers.find((t) => t.id === tiers[0])?.name ?? "Locked"

  if (source === "downloads") {
    const items = [...files]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .map((d, i): MediaItem => ({
        id: d.id,
        title: d.title,
        kicker: categoryLabel(d.category),
        sub: d.file.type,
        tags: [categoryLabel(d.category), d.file.type],
        tone: d.cover ?? i,
        href: `${base}/downloads`,
        status: `${d.file.type} · ${d.file.size}`,
        locked: d.tiers.length && !(tier && d.tiers.includes(tier)) ? needs(d.tiers) : undefined,
        fresh: isRecent(d.updated),
      }))
    return { items: empty ? [] : items, title: coach.wording.downloads, href: `${base}/downloads` }
  }

  if (source === "lessons") {
    // Continue watching: the next lesson of each open course, then the rest of the current one.
    const p = empty ? { ...progress, done: [] } : progress
    const items = courses
      .filter((c) => canAccess(c, tier))
      .flatMap((c) => {
        const next = resumeLesson(c, p)
        const open = openLessons(c)
        const at = next ? open.findIndex((l) => l.id === next.lesson.id) : -1
        return open.slice(Math.max(at, 0), Math.max(at, 0) + 3).map((l, n): MediaItem => {
          // The lesson in progress shows how far in the student is; the next ones are fresh.
          const pct = n === 0 && at > 0 ? 35 : 0
          return { id: `${c.id}-${l.id}`, kicker: c.title, title: l.title, sub: c.title, tags: [c.title], tone: c.color, href: `${base}/courses/${c.id}/${l.id}`, pct, status: pct ? `${Math.round((l.minutes * (100 - pct)) / 100)} min left` : `${l.minutes} min` }
        })
      })
    return { items, title: "Continue watching", href: `${base}/courses` }
  }

  const items = courses.map((c, i): MediaItem => {
    const st = courseStats(c, empty ? { ...progress, done: [] } : progress)
    const locked = canAccess(c, tier) ? undefined : needs(c.tiers)
    return { id: c.id, kicker: `No. ${String(i + 1).padStart(2, "0")}`, title: c.title, sub: c.tagline, tags: [c.area, `${st.lessons} lessons`], tone: c.color, href: `${base}/courses/${c.id}`, pct: locked ? undefined : st.pct, locked, status: locked ? `${st.lessons} lessons · ${inWords(st.minutes)}` : `${st.pct}% complete` }
  })
  return { items, title: coach.wording.courses, href: `${base}/courses` }
}

// ---------- Shelf

/** How wide a poster is in a row, by shape and the card's width: a part of the next one always shows. */
const ROW_BASIS: Record<Shape, string> = {
  portrait: "basis-[44%] @[28rem]:basis-[30%] @[44rem]:basis-[22.5%] @[60rem]:basis-[17.5%]",
  square: "basis-[44%] @[28rem]:basis-[30%] @[44rem]:basis-[22.5%] @[60rem]:basis-[17.5%]",
  landscape: "basis-[80%] @[28rem]:basis-[46%] @[44rem]:basis-[31%] @[60rem]:basis-[23.5%]",
}

/** A carousel slide's width: three across from two columns, five on a full-width card (two for wide frames). */
const SLIDE_BASIS: Record<Shape, string> = {
  portrait: "basis-[58%] @[30rem]:basis-[36%] @[48rem]:basis-[26%] @[64rem]:basis-[21%]",
  square: "basis-[58%] @[30rem]:basis-[36%] @[48rem]:basis-[26%] @[64rem]:basis-[21%]",
  landscape: "basis-[82%] @[30rem]:basis-[62%] @[48rem]:basis-[46%] @[64rem]:basis-[38%]",
}

/** Grid columns by shape and width; under 24rem each poster becomes a line (picture left, words right). */
const GRID_COLS: Record<Shape, string> = {
  portrait: "@[24rem]:grid-cols-3 @[44rem]:grid-cols-4 @[60rem]:grid-cols-6",
  square: "@[24rem]:grid-cols-3 @[44rem]:grid-cols-4 @[60rem]:grid-cols-5",
  landscape: "@[24rem]:grid-cols-2 @[44rem]:grid-cols-3 @[60rem]:grid-cols-4",
}

/** A round arrow button for a row or a carousel. */
function Arrow({ dir, onClick, disabled, className }: { dir: "prev" | "next"; onClick: () => void; disabled?: boolean; className?: string }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border bg-card text-card-foreground shadow-[var(--card-shadow)] outline-none",
        "transition-[opacity,transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-0",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** A native scrolling row with snap, a fade at whichever edge has more, and arrows on hover. */
function Row({ items, shape, over }: { items: MediaItem[]; shape: Shape; over: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const still = useShouldReduceMotion()
  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ start: el.scrollLeft > 2, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 })
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, items.length])
  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.86, behavior: still ? "auto" : "smooth" })
  const fade = (on: boolean) => (on ? "2.5rem" : "0px")
  return (
    <div className="group/row relative -mx-[calc(1rem*var(--density,1))]">
      <div
        ref={ref}
        onScroll={measure}
        className="flex snap-x snap-mandatory scroll-px-[calc(1rem*var(--density,1))] gap-3 overflow-x-auto overscroll-x-contain px-[calc(1rem*var(--density,1))] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
          transition: "mask-image 200ms",
        }}
      >
        {items.map((it) => (
          <Tile key={it.id} item={it} shape={shape} over={over} className={cn("shrink-0 snap-start", ROW_BASIS[shape])} />
        ))}
      </div>
      {/* Arrows sit over the poster area, centred on the picture, and only with a mouse. */}
      <div className="pointer-events-none absolute inset-x-2 top-0 hidden items-center justify-between opacity-0 transition-opacity duration-200 group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:flex" style={{ height: over ? "calc(100% - 1.75rem)" : "calc(100% - 2.75rem)" }}>
        <Arrow dir="prev" onClick={() => page(-1)} disabled={!edges.start} className="pointer-events-auto" />
        <Arrow dir="next" onClick={() => page(1)} disabled={!edges.end} className="pointer-events-auto" />
      </div>
    </div>
  )
}

/** A wrapping grid; on a narrow card each poster lies down as a line. */
function Grid({ items, shape, over }: { items: MediaItem[]; shape: Shape; over: boolean }) {
  return (
    <>
      <div className={cn("hidden grid-cols-2 gap-3 @[24rem]:grid", GRID_COLS[shape])}>
        {items.map((it) => (
          <Tile key={it.id} item={it} shape={shape} over={over} />
        ))}
      </div>
      <ul className="grid gap-2 @[24rem]:hidden">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="group/line flex min-w-0 items-center gap-3 rounded-[min(var(--radius),8px)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={cn("relative w-14 shrink-0 overflow-hidden rounded-[min(var(--radius),6px)]", shape === "landscape" ? "aspect-video w-20" : RATIO[shape])}>
                <span className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover/line:scale-[1.08]">
                  <Art item={it} />
                </span>
              </span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className={cn(TYPE.title, "truncate")}>{it.title}</span>
                {it.pct !== undefined ? <Meter pct={it.pct} className="w-full max-w-32" /> : null}
                <span className={cn(TYPE.small, "truncate tabular-nums")}>{it.locked ? `Needs ${it.locked}` : it.status}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/line:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

/** The card's width, for the one layout that changes its parts with it (the carousel turns into a row when narrow). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** How much a slide shrinks and fades per snap away from the centre. */
const SCALE_STEP = 0.14
const MIN_SCALE = 0.72
const MIN_OPACITY = 0.45

/**
 * Carousel (Embla): the centred poster at full size, its neighbours smaller and dimmer, worked out from the scroll on
 * every frame so the shrink follows a drag. Loops when there are more posters than fit; dots, a counter or nothing under
 * it; optional autoplay that stops on hover, focus and a hidden tab.
 */
function Carousel({ items: posters, shape, over, nav, autoplay }: { items: MediaItem[]; shape: Shape; over: boolean; nav: string; autoplay: boolean }) {
  const still = useShouldReduceMotion()
  // A loop needs a poster more than it shows on each side: with fewer, the posters repeat (the dots still count the real ones).
  const n = posters.length
  const loop = n >= 3
  const copies = loop ? Math.max(1, Math.ceil(8 / n)) : 1
  const items = Array.from({ length: copies }, (_, c) => posters.map((it) => ({ ...it, id: c ? `${it.id}~${c}` : it.id }))).flat()
  const [ref, api] = useEmblaCarousel({ loop, align: "center", containScroll: false, duration: 30, skipSnaps: false })
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [index, setIndex] = useState(0)
  const [can, setCan] = useState({ prev: false, next: false })
  const [hold, setHold] = useState(false)

  const tween = useCallback(
    (e: EmblaCarouselType, kind?: string) => {
      const engine = e.internalEngine()
      const progress = e.scrollProgress()
      const inView = e.slidesInView()
      const snaps = e.scrollSnapList()
      const step = SCALE_STEP * snaps.length
      snaps.forEach((snap, si) => {
        let diff = snap - progress
        engine.slideRegistry[si].forEach((i) => {
          if (kind === "scroll" && !inView.includes(i)) return
          if (engine.options.loop)
            engine.slideLooper.loopPoints.forEach((lp) => {
              const target = lp.target()
              if (i === lp.index && target !== 0) diff = Math.sign(target) === -1 ? snap - (1 + progress) : snap + (1 - progress)
            })
          const d = Math.abs(diff)
          const node = slides.current[i]
          if (!node) return
          node.style.transform = still ? "" : `scale(${Math.max(MIN_SCALE, 1 - d * step)})`
          node.style.opacity = String(Math.max(MIN_OPACITY, 1 - d * step * 3.2))
        })
      })
    },
    [still],
  )

  useEffect(() => {
    if (!api) return
    const select = () => {
      setIndex(api.selectedScrollSnap())
      setCan({ prev: api.canScrollPrev(), next: api.canScrollNext() })
    }
    select()
    tween(api)
    api.on("select", select).on("reInit", select).on("reInit", tween).on("scroll", tween).on("slideFocus", tween)
    return () => {
      api.off("select", select).off("reInit", select).off("reInit", tween).off("scroll", tween).off("slideFocus", tween)
    }
  }, [api, tween])

  // Autoplay: one step every 5s, paused while the student is on it or the tab is hidden; never with reduced motion.
  useEffect(() => {
    if (!api || !autoplay || still || hold) return
    const t = setInterval(() => {
      if (document.hidden) return
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, 5000)
    return () => clearInterval(t)
  }, [api, autoplay, still, hold])

  const go = (i: number) => api?.scrollTo(i, still)
  const prev = () => (still ? api?.scrollTo((index - 1 + items.length) % items.length, true) : api?.scrollPrev())
  const next = () => (still ? api?.scrollTo((index + 1) % items.length, true) : api?.scrollNext())

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Posters"
      className="grid gap-3"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
      onKeyDownCapture={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
        e.preventDefault()
        if (e.key === "ArrowLeft") prev()
        else next()
      }}
    >
      <div ref={ref} className="-mx-[calc(1rem*var(--density,1))] overflow-hidden px-[calc(1rem*var(--density,1))] [mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)]">
        <div className="flex touch-pan-y">
          {items.map((it, i) => (
            <div key={it.id} role="group" aria-roledescription="slide" aria-label={`${(i % n) + 1} of ${n}`} aria-hidden={i >= n || undefined} className={cn("min-w-0 shrink-0 grow-0 px-1.5", SLIDE_BASIS[shape])}>
              <div ref={(n) => void (slides.current[i] = n)} className="origin-center will-change-transform" onClickCapture={(e) => {
                  // A side poster comes to the centre first; only the centred one opens.
                  if (i === index) return
                  e.preventDefault()
                  go(i)
                }}>
                <Tile item={it} shape={shape} over={over} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Arrow dir="prev" onClick={prev} disabled={!can.prev} className="disabled:opacity-40" />
        {nav === "dots" && (
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose a poster">
            {posters.map((it, i) => (
              <button
                key={it.id}
                type="button"
                role="tab"
                aria-selected={i === index % n}
                aria-label={`Go to ${i + 1}: ${it.title}`}
                onClick={() => go(index - (index % n) + i)}
                className="group/dot grid h-6 place-items-center outline-none"
              >
                <span
                  className="block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-ring"
                  style={{ width: i === index % n ? "1.25rem" : "0.375rem", background: i === index % n ? "var(--card-foreground)" : "color-mix(in oklab, var(--card-foreground) 24%, transparent)" }}
                />
              </button>
            ))}
          </div>
        )}
        {nav === "counter" && (
          <span className={cn(TYPE.small, "min-w-12 text-center tabular-nums")} aria-live="polite">
            {(index % n) + 1} / {n}
          </span>
        )}
        <Arrow dir="next" onClick={next} disabled={!can.next} className="disabled:opacity-40" />
      </div>
    </div>
  )
}

const SOURCE_ICON = { courses: BookOpen, lessons: Play, downloads: Download }

/** Shelf: row (scrolls), carousel (centred, sides shrink), grid (wraps; a list when narrow). */
export function Shelf({ variant = "row", props }: WidgetProps) {
  const source = (["courses", "lessons", "downloads"].includes(String(props.source)) ? props.source : "courses") as Source
  const shape = (["portrait", "landscape", "square"].includes(String(props.shape)) ? props.shape : SHAPE_OF[source]) as Shape
  const over = props.words !== "below"
  const { items, title, href } = useMediaItems(source)
  const { core } = useFrame()
  const [ref, width] = useWidth<HTMLDivElement>()
  const count = Number(props.count) || 0
  const shown = count ? items.slice(0, count) : items
  const Icon = SOURCE_ICON[source] ?? GalleryHorizontal

  if (shown.length === 0)
    return <WidgetEmpty icon={Icon} title={source === "downloads" ? "No files yet" : source === "lessons" ? "Nothing to continue yet" : "No courses yet"} text="What the coach publishes shows here as posters." />

  // The carousel needs room for its sides to shrink: under ~30rem it is a row.
  const carousel = variant === "carousel" && width >= 480
  return (
    <WCard icon={Icon} title={String(props.title || title)} meta={`${shown.length} ${source === "downloads" ? "files" : source === "lessons" ? "lessons" : "courses"}`} action={core ? undefined : { label: "See all", href }} bodyClassName="min-h-0">
      <SameTitleSize>
      <div ref={ref} className="min-w-0">
        {carousel ? (
          <Carousel items={shown} shape={shape} over={over} nav={String(props.nav || "dots")} autoplay={props.autoplay === true} />
        ) : variant === "grid" ? (
          <Grid items={count ? shown : shown.slice(0, 12)} shape={shape} over={over} />
        ) : (
          <Row items={shown} shape={shape} over={over} />
        )}
      </div>
      </SameTitleSize>
    </WCard>
  )
}

// ---------- Featured (the Hero's full-width layout)

const SLIDE_MS = 7000

export type Slide = { id: string; eyebrow?: string; title: string; text: string; tags: string[]; tone: number; picture?: string; href: string; cta: string; pct?: number; facts: string[] }

/** The slides: the coach's own headline first when they wrote one, then the courses. */
export function useSlides(props: WidgetProps["props"]): Slide[] {
  const { base, coach } = useCoach()
  const { items } = useMediaItems("courses")
  const own: Slide[] =
    props.title || props.image
      ? [{ id: "own", eyebrow: String(props.eyebrow || ""), title: String(props.title || "Trade with a plan"), text: String(props.text || ""), tags: [], tone: 0, picture: typeof props.image === "string" && props.image ? props.image : undefined, href: `${base}/${String(props.target || "courses")}`, cta: String(props.button || "Start here"), facts: [] }]
      : []
  const courses = items.slice(0, own.length ? 3 : 4).map(
    (c): Slide => ({
      id: c.id,
      eyebrow: c.locked ? `Needs ${c.locked}` : c.fresh ? "New" : coach.wording.courses,
      title: c.title,
      text: c.sub ?? "",
      tags: c.tags.slice(0, 1),
      tone: c.tone,
      href: c.href,
      cta: c.locked ? "See what it includes" : c.pct ? "Continue" : "Start",
      pct: c.pct,
      facts: [c.tags[1], c.status && c.pct === undefined ? c.status.split(" · ")[1] : undefined].filter(Boolean) as string[],
    }),
  )
  return [...own, ...courses]
}

/** The Featured backdrop without a picture: the tinted surface and one long, thin candle chart across it. */
function Stage({ tone, seed }: { tone: number; seed: string }) {
  const base = CANDLES[Math.abs(hash(seed)) % CANDLES.length]
  const candles = Array.from({ length: 36 }, (_, i) => base[i % base.length] * 0.55 + i * 1.1 + (i % 4) * 2)
  return (
    <div className="absolute inset-0 overflow-hidden text-card-foreground" style={{ background: `color-mix(in oklab, ${series(tone)} 26%, var(--muted))` }}>
      <svg viewBox="0 0 360 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        {candles.map((h, i) => {
          const x = 4 + i * 10
          const y = 96 - h
          const last = i === candles.length - 1
          return (
            <g key={i} stroke={last ? ACCENT : "currentColor"} fill={last ? ACCENT : i % 3 === 1 ? "none" : "currentColor"} opacity={last ? 0.85 : 0.1}>
              <line x1={x + 2} x2={x + 2} y1={y - 5} y2={y + 15} strokeWidth="0.5" />
              <rect x={x} y={y} width="4" height={i % 3 === 1 ? 7 : 10} strokeWidth="0.5" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * Featured: a full-width stage. The picture fills it and leans in slowly; the card colour rises from the bottom and
 * from the left so the words sit on it. Slides cross-fade every 7s (thin bars fill to show the time left); the timer
 * stops on hover, focus and a hidden tab, and with reduced motion the slides only change on a click. Narrow, the
 * picture sits on top and the words under it.
 */
export function Featured({ props }: WidgetProps) {
  const slides = useSlides(props)
  const still = useShouldReduceMotion()
  const { emphasis } = useFrame()
  const more = useMore("standard")
  const [i, setI] = useState(0)
  const [hold, setHold] = useState(false)
  const [hidden, setHidden] = useState(false)
  const n = slides.length
  const at = n ? i % n : 0
  const s = slides[at]
  const playing = n > 1 && !still && !hold && !hidden

  useEffect(() => {
    const on = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  if (!s) return <WidgetEmpty icon={Play} title="Nothing to feature yet" text="Add a headline and a picture, or publish a course." />

  const fadeX = "linear-gradient(to right, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 86%, transparent) 26%, color-mix(in oklab, var(--fade-to) 40%, transparent) 50%, transparent 72%)"
  return (
    <W className="gap-0 p-0">
    <div
      className={cn(FADE_TO, "relative isolate flex min-h-0 flex-1 flex-col")}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden @[40rem]:absolute @[40rem]:inset-0 @[40rem]:aspect-auto">
        <AnimatePresence initial={false}>
          <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0.15 : 0.7, ease: MOTION.ease }}>
            <motion.div className="absolute inset-0 origin-[70%_40%]" initial={{ transform: "scale(1.0)" }} animate={{ transform: still ? "scale(1.0)" : "scale(1.05)" }} transition={{ duration: SLIDE_MS / 1000 + 1, ease: "linear" }}>
              {s.picture ? <Art item={{ id: s.id, title: s.title, tags: [], tone: s.tone, href: s.href, picture: s.picture }} /> : <Stage tone={s.tone} seed={s.id} />}
            </motion.div>
          </motion.div>
        </AnimatePresence>
        {/* No picture: the course's own poster stands on the stage, on the right, and slides in with each slide. */}
        {!s.picture && (
          <AnimatePresence initial={false}>
            <motion.div
              key={s.id}
              aria-hidden
              className="absolute top-[12%] right-[6%] bottom-[12%] aspect-[2/3] overflow-hidden rounded-[min(var(--radius),10px)] shadow-[0_24px_48px_-16px_rgb(0_0_0/0.45)] ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_14%,transparent)] @container/tile @[40rem]:top-[12%] @[40rem]:right-[7%] @[40rem]:bottom-[22%]"
              initial={still ? { opacity: 0 } : { opacity: 0, transform: "translateX(24px) scale(0.98)" }}
              animate={{ opacity: 1, transform: "translateX(0px) scale(1)" }}
              exit={still ? { opacity: 0 } : { opacity: 0, transform: "translateX(-12px) scale(0.98)" }}
              transition={{ duration: still ? 0.15 : 0.6, ease: MOTION.ease }}
            >
              <Art item={{ id: s.id, kicker: s.eyebrow, title: s.title, tags: [], tone: s.tone, href: s.href }} typeset />
            </motion.div>
          </AnimatePresence>
        )}
        <div aria-hidden className="absolute inset-0" style={{ background: FADE_UP }} />
        <div aria-hidden className="absolute inset-0 hidden @[40rem]:block" style={{ background: fadeX }} />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-end gap-4 p-[calc(1rem*var(--density,1))] @[40rem]:min-h-[22rem] @[40rem]:p-[calc(2rem*var(--density,1))] @[60rem]:min-h-[26rem] @[60rem]:p-[calc(2.5rem*var(--density,1))]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={s.id}
            className="grid max-w-[34rem] gap-3 @[40rem]:max-w-[52%]"
            initial={still ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={still ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, transform: "translateY(-4px)", transition: { duration: 0.16, ease: MOTION.ease } }}
            transition={{ duration: 0.36, ease: MOTION.ease }}
          >
            {(s.eyebrow || s.tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {s.eyebrow && <Tag strong>{s.eyebrow}</Tag>}
                {s.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
            <h3 className={cn(emphasis === "star" ? TYPE.star : TYPE.valueLg, "line-clamp-2 text-balance")}>{s.title}</h3>
            {more && s.text && <p className={cn(TYPE.body, "line-clamp-2 max-w-prose text-muted-foreground")}>{s.text}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Button size="sm" className={cn("w-fit", CTA)} render={<Link href={s.href} />} nativeButton={false}>
                <Play /> <span className="truncate">{s.cta}</span>
              </Button>
              {s.pct !== undefined && (
                <span className="flex items-center gap-2">
                  <Meter pct={s.pct} className="w-16" />
                  <span className={cn(TYPE.small, "tabular-nums")}>{s.pct}% complete</span>
                </span>
              )}
              {s.facts.map((f) => (
                <span key={f} className={cn(TYPE.small, "tabular-nums")}>
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {n > 1 && (
          <div className="flex items-center gap-1.5 @[40rem]:absolute @[40rem]:right-[calc(2rem*var(--density,1))] @[40rem]:bottom-[calc(2rem*var(--density,1))]" role="tablist" aria-label="Featured">
            {slides.map((x, k) => (
              <button key={x.id} type="button" role="tab" aria-selected={k === at} aria-label={`Show ${x.title}`} onClick={() => setI(k)} className="group/bar grid h-6 w-7 place-items-center outline-none @[40rem]:w-9">
                <span className="relative block h-[3px] w-full overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_22%,transparent)] transition-colors group-hover/bar:bg-[color-mix(in_oklab,var(--card-foreground)_40%,transparent)] group-focus-visible/bar:ring-2 group-focus-visible/bar:ring-ring">
                  {k === at && (
                    <motion.span
                      key={`${x.id}-${playing}`}
                      className="absolute inset-0 origin-left bg-card-foreground"
                      initial={{ transform: playing ? "scaleX(0)" : "scaleX(1)" }}
                      animate={{ transform: "scaleX(1)" }}
                      transition={{ duration: playing ? SLIDE_MS / 1000 : 0, ease: "linear" }}
                      onAnimationComplete={() => playing && setI((v) => (v + 1) % n)}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </W>
  )
}
