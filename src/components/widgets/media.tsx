"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaCarouselType } from "embla-carousel"
import { AnimatePresence, motion, type Variants } from "motion/react"
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
import { webUrl } from "./brand"
import { WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

// Media widgets: posters in a row, a carousel or a grid (Shelf), and a full-width Featured hero (content.tsx Hero).
// The one place widgets lay words over a picture with a fade (Gustavo, 30 Oct: an exception to "no gradients" for
// media). The fade is always the card's own colour, so it follows whatever the coach picked, and the words sit where it
// is solid: they are measured against the card, never against the picture.
//
// Both widgets keep their cards (or slides) in one prop, `cards`: a JSON list the coach edits in Design → Content
// (admin/design/media-cards-editor.tsx). An entry either points at a course, lesson or file (`ref`, so its progress
// stays live) and overrides what it wants, or is the coach's own card. Pictures are separate props (`img-<id>`), so
// the store keeps each picture once.

export type Shape = "portrait" | "landscape" | "photo" | "classic" | "square"

const RATIO: Record<Shape, string> = { portrait: "aspect-[2/3]", landscape: "aspect-video", photo: "aspect-[3/2]", classic: "aspect-[4/3]", square: "aspect-square" }
/** Shapes wider than tall, where a poster's words take the left part. */
const WIDE = new Set<Shape>(["landscape", "photo", "classic"])

/** The card colour rising from the bottom of a picture: solid under the words, gone by the middle. */
export const FADE_UP = "linear-gradient(to top, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 88%, transparent) 22%, color-mix(in oklab, var(--fade-to) 45%, transparent) 48%, transparent 72%)"
/** Where the fade lands: the card colour, or the brand on a filled Star (whose --card is transparent). Set on each media root. */
export const FADE_TO = "[--fade-to:var(--card)] in-[.fx-hero]:[--fade-to:var(--brand,var(--chart-1))]"
/** A softer veil at the top, for a tag or a lock. */
const FADE_DOWN = "linear-gradient(to bottom, color-mix(in oklab, var(--fade-to) 55%, transparent) 0%, transparent 28%)"

/** Parts of a card the coach can switch off. */
export type Part = "kicker" | "title" | "tags" | "text" | "progress" | "button" | "facts"

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
  /** A small line above the title ("No. 01"). */
  kicker?: string
  picture?: string
  /** The button's words, when the coach wrote one. */
  button?: string
  /** Short facts ("12 lessons", "1 h 54 min"). */
  facts?: string[]
  off?: Part[]
}

/** What the coach saved for one card or slide. Empty fields fall back to the course, lesson or file it points at. */
export type MediaEntry = {
  id: string
  /** The course, lesson or file this card shows; none for the coach's own card. */
  ref?: string
  hidden?: boolean
  kicker?: string
  title?: string
  text?: string
  /** Comma separated. */
  tags?: string
  /** "" or 0 to 100. */
  pct?: string
  status?: string
  badge?: "" | "new" | "none"
  button?: string
  /** A page id, or "url" with `url`. */
  target?: string
  url?: string
  button2?: string
  target2?: string
  url2?: string
  /** Comma separated. */
  facts?: string
  off?: Part[]
}

/** The prop that holds an entry's picture. */
export const imgKey = (id: string) => `img-${id}`

/** The saved list, or null when the coach never edited it (the widget then shows its source as it is). */
export function parseEntries(raw: unknown): MediaEntry[] | null {
  if (typeof raw !== "string" || !raw.startsWith("[")) return null
  try {
    const list = JSON.parse(raw) as MediaEntry[]
    return Array.isArray(list) ? list.filter((e) => e && typeof e.id === "string") : null
  } catch {
    return null
  }
}

const words = (s?: string) =>
  (s ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

/** Where a card or button goes: one of the coach's pages, or a web address. */
export const hrefOf = (base: string, target?: string, url?: string) => (target === "url" ? (webUrl(url)?.href ?? "#") : `${base}/${target || "courses"}`)

/**
 * The cards in the coach's order: each saved entry over the item it points at, the coach's own cards as they are,
 * then (on a Shelf) anything published since that the list doesn't mention yet. Hidden entries stay out.
 */
export function applyEntries(base: MediaItem[], entries: MediaEntry[] | null, props: WidgetProps["props"], root: string, appendNew = true): MediaItem[] {
  if (!entries) return base.map((b) => ({ ...b, picture: str(props[imgKey(b.id)]) || b.picture }))
  const byId = new Map(base.map((b) => [b.id, b]))
  const seen = new Set(entries.map((e) => e.ref).filter(Boolean))
  const out: MediaItem[] = []
  entries.forEach((e, i) => {
    const b = e.ref ? byId.get(e.ref) : undefined
    if (e.ref && !b) return
    if (e.hidden) return
    const pct = e.pct !== undefined && e.pct !== "" && !Number.isNaN(Number(e.pct)) ? Math.max(0, Math.min(100, Math.round(Number(e.pct)))) : b?.pct
    out.push({
      id: e.id,
      title: e.title || b?.title || "",
      sub: e.text || b?.sub,
      tags: e.tags !== undefined && e.tags !== "" ? words(e.tags) : (b?.tags ?? []),
      tone: b?.tone ?? i,
      href: e.target ? hrefOf(root, e.target, e.url) : (b?.href ?? hrefOf(root)),
      pct,
      status: e.status || (pct !== undefined && pct !== b?.pct ? `${pct}% complete` : b?.status),
      locked: b?.locked,
      fresh: e.badge === "new" ? true : e.badge === "none" ? false : b?.fresh,
      kicker: e.kicker || b?.kicker,
      picture: str(props[imgKey(e.id)]) || b?.picture,
      button: e.button || b?.button,
      facts: e.facts !== undefined && e.facts !== "" ? words(e.facts) : b?.facts,
      off: e.off,
    })
  })
  if (appendNew) for (const b of base) if (!seen.has(b.id) && !entries.some((e) => e.id === b.id)) out.push({ ...b, picture: str(props[imgKey(b.id)]) || b.picture })
  return out
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined)
const shows = (it: { off?: Part[] }, part: Part) => !it.off?.includes(part)

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
 * and, with `typeset`, the title set in the theme's heading font, as on a printed poster.
 */
function Art({ item, shape = "portrait", typeset, className }: { item: MediaItem; shape?: Shape; typeset?: boolean; className?: string }) {
  if (item.picture)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- an uploaded data URL
      <img src={item.picture} alt="" draggable={false} className={cn("absolute inset-0 size-full object-cover", className)} />
    )
  const candles = CANDLES[Math.abs(hash(item.id)) % CANDLES.length]
  const wide = WIDE.has(shape)
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
      {typeset && (shows(item, "kicker") || shows(item, "title")) && (
        <div className={cn("absolute inset-x-0 top-0 grid gap-1.5 p-[calc(0.875rem*var(--density,1))]", wide && "max-w-[62%]")}>
          {item.kicker && shows(item, "kicker") && <span className="truncate text-[0.6875rem] leading-4 font-medium tracking-[0.08em] uppercase opacity-70">{item.kicker}</span>}
          {shows(item, "title") && <PosterTitle text={item.title} sizes={wide ? [20, 13] : [28, 20, 13]} lines={wide || shape === "square" ? 2 : 3} />}
        </div>
      )}
    </div>
  )
}

/** A row of posters agrees on one title size (each reports what fits it; all use the smallest). */
const TitleSizeContext = createContext<{ size: number; report: (id: string, px: number | null) => void } | null>(null)

function SameTitleSize({ children }: { children: React.ReactNode }) {
  const [sizes, setSizes] = useState<Record<string, number>>({})
  // `null` takes a poster out (it unmounted or its title changed), so an old size never holds the row down.
  const report = useCallback(
    (id: string, px: number | null) =>
      setSizes((m) => {
        if (px !== null) return m[id] === px ? m : { ...m, [id]: px }
        if (!(id in m)) return m
        const rest = { ...m }
        delete rest[id]
        return rest
      }),
    [],
  )
  const size = Math.min(99, ...Object.values(sizes))
  const value = useMemo(() => ({ size, report }), [size, report])
  return <TitleSizeContext.Provider value={value}>{children}</TitleSizeContext.Provider>
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
  const id = useId()
  useEffect(() => {
    shared?.report(id, own)
    return () => shared?.report(id, null)
  }, [shared, id, own])
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
    <span
      ref={ref}
      className={cn("block overflow-hidden font-heading [font-weight:var(--w-value-weight,500)] tracking-tight text-balance break-normal uppercase", POSTER_SIZE[size])}
      style={last ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines } : undefined}
    >
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

/** A small tag on a picture or a card: a hairline pill. On a picture it sits on the faded card colour. */
function Tag({ children, strong, plain }: { children: React.ReactNode; strong?: boolean; plain?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-(--r-chip) px-1.5 text-[0.6875rem] leading-4 font-medium whitespace-nowrap",
        "border border-[color-mix(in_oklab,var(--card-foreground)_20%,transparent)] text-card-foreground",
        !plain && "bg-[color-mix(in_oklab,var(--fade-to)_62%,transparent)] backdrop-blur-[2px]",
      )}
      style={strong ? { borderColor: ACCENT } : undefined}
    >
      {children}
    </span>
  )
}

/** A thin progress line: the accent is the one mark on the poster. */
function Meter({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("relative block h-[3px] overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_16%,transparent)]", className)}>
      <span className="absolute inset-y-0 left-0 rounded-(--r-bar) transition-[width] duration-500" style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: ACCENT }} />
    </span>
  )
}

/** The words a card's button says: the coach's, or what the student would do. */
const ctaOf = (item: MediaItem) => item.button || (item.locked ? `Needs ${item.locked}` : item.pct ? "Continue" : item.pct === undefined ? "Open" : "Start")

/**
 * One poster. Words on the picture (on its fade) or under it. On hover (a mouse, not a finger) the picture leans in,
 * the fade deepens and a "Start" line opens under the title; a press settles it back a touch. Reduced motion keeps the
 * reveal and drops the movement.
 */
export function Tile({ item, shape, over, className }: { item: MediaItem; shape: Shape; over: boolean; className?: string }) {
  const more = useMore("standard")
  const badges = !!item.picture
  const progress = item.pct !== undefined && shows(item, "progress")
  const status = shows(item, "progress") ? item.status : undefined
  const tags = shows(item, "tags") ? item.tags : []
  return (
    <Link
      href={item.href}
      draggable={false}
      className={cn(FADE_TO, "group/tile relative grid min-w-0 content-start gap-2 rounded-[min(var(--radius),10px)] outline-none select-none", "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card", className)}
    >
      <div
        className={cn(
          "@container/tile relative isolate overflow-hidden rounded-[min(var(--radius),10px)] bg-(--media-bg) ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_10%,transparent)] ring-inset",
          "transition-[box-shadow,transform,scale] duration-200 ease-out group-active/tile:scale-[0.985] motion-reduce:group-active/tile:scale-100",
          "[@media(hover:hover)]:group-hover/tile:ring-[color-mix(in_oklab,var(--card-foreground)_24%,transparent)]",
          RATIO[shape],
        )}
      >
        <div className="absolute inset-0 transition-transform duration-[700ms] ease-out will-change-transform motion-reduce:transition-none [@media(hover:hover)]:group-hover/tile:scale-[1.06] motion-reduce:[@media(hover:hover)]:group-hover/tile:scale-100">
          <Art item={item} shape={shape} typeset />
        </div>
        {/* New and locked go on top of a picture; on a typeset poster the title owns the top, so they join the tags below. */}
        {badges && (item.locked || item.fresh) && <div aria-hidden className="absolute inset-x-0 top-0 h-1/2" style={{ background: FADE_DOWN }} />}
        {badges && (
          <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            {item.fresh ? <Tag strong>New</Tag> : <span />}
            {item.locked && (
              <Tag>
                <Lock className="size-3" />
                {item.locked}
              </Tag>
            )}
          </div>
        )}
        {over && (
          <>
            <div aria-hidden className="absolute inset-0 opacity-90 transition-opacity duration-500 [@media(hover:hover)]:group-hover/tile:opacity-100" style={{ background: FADE_UP }} />
            <div className="absolute inset-x-0 bottom-0 grid gap-2 p-[calc(0.75rem*var(--density,1))]">
              {item.picture && shows(item, "title") && <h4 className={cn("font-heading text-xl leading-6 [font-weight:var(--w-value-weight,500)] tracking-tight text-balance text-card-foreground", WIDE.has(shape) ? "line-clamp-2" : "line-clamp-3")}>{item.title}</h4>}
              {more && (tags.length > 0 || (!badges && (item.fresh || item.locked))) && (badges || !WIDE.has(shape)) && (
                <div className="flex min-w-0 gap-1 overflow-hidden">
                  {!badges && item.fresh && <Tag strong>New</Tag>}
                  {!badges && item.locked && (
                    <Tag>
                      <Lock className="size-3" />
                      {item.locked}
                    </Tag>
                  )}
                  {tags.slice(0, badges ? 2 : 1).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              )}
              {/* The hover line: closed rows open to their height, so nothing jumps. Always open on touch. */}
              {shows(item, "button") && (
                <div className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-out [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:grid-rows-[1fr] [@media(hover:hover)]:group-hover/tile:opacity-100 [@media(hover:hover)]:group-focus-visible/tile:grid-rows-[1fr] [@media(hover:hover)]:group-focus-visible/tile:opacity-100">
                  <span className="flex min-h-0 items-center gap-1 overflow-hidden text-[0.6875rem] leading-4 font-medium text-card-foreground">
                    {item.locked ? <Lock className="size-3" /> : <Play className="size-3" />}
                    <span className="truncate">{ctaOf(item)}</span>
                    <ArrowRight className="size-3 shrink-0 transition-transform duration-300 group-hover/tile:translate-x-0.5" />
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        {/* Under-the-picture layout: progress runs along the poster's bottom edge. */}
        {!over && progress && item.pct! > 0 && <Meter pct={item.pct!} className="absolute inset-x-0 bottom-0 rounded-none" />}
      </div>
      {over ? (
        status && (
          <div className="flex min-w-0 items-center gap-2 px-0.5">
            {progress && <Meter pct={item.pct!} className="w-8 shrink-0" />}
            <span className={cn(TYPE.small, "truncate tabular-nums")}>{status}</span>
          </div>
        )
      ) : (
        <div className="grid min-w-0 gap-0.5 px-0.5">
          {/* The sample poster already carries the title in its type; a picture needs it written under. */}
          {item.picture && shows(item, "title") && <span className={cn(TYPE.title, "truncate")}>{item.title}</span>}
          <span className={cn(TYPE.small, "truncate tabular-nums")}>{[!badges && item.fresh && "New", !badges && item.locked && `Needs ${item.locked}`, tags[0], status].filter(Boolean).join(" · ")}</span>
        </div>
      )}
    </Link>
  )
}

// ---------- Data

export type Source = "courses" | "lessons" | "downloads" | "own"

/** The default poster shape for each source: courses as posters, lessons as frames, files as squares. */
export const SHAPE_OF: Record<Source, Shape> = { courses: "portrait", lessons: "landscape", downloads: "square", own: "portrait" }

/** The posters a source gives, from the coach's catalogue, the student's progress or the coach's files. */
export function useMediaItems(source: Source): { items: MediaItem[]; title: string; href: string } {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useViewerTier(coach)
  const files = useDownloads(coach)
  const empty = useEmpty()
  const courses = studentCourses(catalog)
  const needs = (tiers: string[]) => coach.tiers.find((t) => t.id === tiers[0])?.name ?? "Locked"

  if (source === "own") return { items: [], title: "Featured", href: `${base}/courses` }

  if (source === "downloads") {
    const items = [...files]
      .sort((a, b) => b.updated.localeCompare(a.updated))
      .map((d, i): MediaItem => ({
        id: d.id,
        title: d.title,
        kicker: categoryLabel(d.category),
        sub: d.description,
        tags: [categoryLabel(d.category), d.file.type],
        tone: d.cover ?? i,
        href: `${base}/downloads`,
        status: `${d.file.type} · ${d.file.size}`,
        locked: d.tiers.length && !(tier && d.tiers.includes(tier)) ? needs(d.tiers) : undefined,
        fresh: isRecent(d.updated),
        facts: [d.file.type, d.file.size],
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
          return {
            id: `${c.id}-${l.id}`,
            kicker: c.title,
            title: l.title,
            sub: l.summary ?? c.title,
            tags: [c.title],
            tone: c.color,
            href: `${base}/courses/${c.id}/${l.id}`,
            pct,
            status: pct ? `${Math.round((l.minutes * (100 - pct)) / 100)} min left` : `${l.minutes} min`,
            facts: [`${l.minutes} min`],
          }
        })
      })
    return { items, title: "Continue watching", href: `${base}/courses` }
  }

  const items = courses.map((c, i): MediaItem => {
    const st = courseStats(c, empty ? { ...progress, done: [] } : progress)
    const locked = canAccess(c, tier) ? undefined : needs(c.tiers)
    return {
      id: c.id,
      kicker: `No. ${String(i + 1).padStart(2, "0")}`,
      title: c.title,
      sub: c.tagline,
      tags: [c.area, `${st.lessons} lessons`],
      tone: c.color,
      href: `${base}/courses/${c.id}`,
      pct: locked ? undefined : st.pct,
      locked,
      status: locked ? `${st.lessons} lessons · ${inWords(st.minutes)}` : `${st.pct}% complete`,
      facts: [`${st.lessons} lessons`, inWords(st.minutes)],
    }
  })
  return { items, title: coach.wording.courses, href: `${base}/courses` }
}

const asSource = (v: unknown): Source => (["courses", "lessons", "downloads", "own"].includes(String(v)) ? (v as Source) : "courses")

/** The Shelf's cards as the student sees them: its source, in the coach's order, with the coach's changes and own cards. */
export function useShelfCards(props: WidgetProps["props"]) {
  const { base } = useCoach()
  const source = asSource(props.source)
  const { items, title, href } = useMediaItems(source)
  const entries = parseEntries(props.cards)
  return { source, base: items, cards: applyEntries(items, entries, props, base), entries, title, href }
}

// ---------- Shelf

/** How wide a poster is in a row, by shape and the card's width: a part of the next one always shows. */
const ROW_BASIS: Record<"tall" | "wide", string> = {
  tall: "basis-[44%] @[28rem]:basis-[30%] @[44rem]:basis-[22.5%] @[60rem]:basis-[17.5%]",
  wide: "basis-[80%] @[28rem]:basis-[46%] @[44rem]:basis-[31%] @[60rem]:basis-[23.5%]",
}

/** A carousel slide's width: three across from two columns, five on a full-width card (three for wide frames). */
const SLIDE_BASIS: Record<"tall" | "wide", string> = {
  tall: "basis-[58%] @[30rem]:basis-[36%] @[48rem]:basis-[26%] @[64rem]:basis-[21%]",
  wide: "basis-[82%] @[30rem]:basis-[62%] @[48rem]:basis-[46%] @[64rem]:basis-[38%]",
}

const fit = (shape: Shape) => (WIDE.has(shape) ? "wide" : "tall")

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
        "transition-[opacity,transform,scale,background-color] duration-150 ease-out hover:bg-muted active:scale-[0.97] disabled:pointer-events-none disabled:opacity-0",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** Automatic play: one step every `every` seconds while nobody is on the widget and the tab is visible. */
function useAutoplay(on: boolean, every: number, step: () => void) {
  const [hold, setHold] = useState(false)
  const still = useShouldReduceMotion()
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })
  useEffect(() => {
    if (!on || still || hold) return
    const t = setInterval(() => !document.hidden && stepRef.current(), every * 1000)
    return () => clearInterval(t)
  }, [on, still, hold, every])
  const handlers = { onMouseEnter: () => setHold(true), onMouseLeave: () => setHold(false), onFocusCapture: () => setHold(true), onBlurCapture: () => setHold(false) }
  return { handlers, playing: on && !still && !hold }
}

/** A native scrolling row with snap, a fade at whichever edge has more, and arrows (on hover, or always when manual). */
function Row({ items, shape, over, auto, every }: { items: MediaItem[]; shape: Shape; over: boolean; auto: boolean; every: number }) {
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
  const { handlers } = useAutoplay(auto, every, () => {
    const el = ref.current
    if (!el) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollTo({ left: 0, behavior: "smooth" })
    else page(1)
  })
  const fade = (on: boolean) => (on ? "2.5rem" : "0px")
  return (
    <div className="group/row relative -mx-[calc(1rem*var(--density,1))]" {...handlers}>
      <div
        ref={ref}
        onScroll={measure}
        className="flex snap-x snap-mandatory scroll-px-[calc(1rem*var(--density,1))] gap-3 overflow-x-auto overscroll-x-contain px-[calc(1rem*var(--density,1))] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, #000 ${fade(edges.start)}, #000 calc(100% - ${fade(edges.end)}), transparent 100%)`,
        }}
      >
        {items.map((it) => (
          <Tile key={it.id} item={it} shape={shape} over={over} className={cn("shrink-0 snap-start", ROW_BASIS[fit(shape)])} />
        ))}
      </div>
      {/* Arrows sit over the poster area, centred on the picture: on hover with a mouse, always when the coach chose buttons. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-2 top-0 flex items-center justify-between transition-opacity duration-200",
          auto ? "hidden opacity-0 group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:hover)]:flex" : "opacity-100",
        )}
        style={{ height: over ? "calc(100% - 1.75rem)" : "calc(100% - 2.75rem)" }}
      >
        <Arrow dir="prev" onClick={() => page(-1)} disabled={!edges.start} className="pointer-events-auto" />
        <Arrow dir="next" onClick={() => page(1)} disabled={!edges.end} className="pointer-events-auto" />
      </div>
    </div>
  )
}

/**
 * A grid card: the picture on top at 3:2 (or the shape chosen), then the words on the card itself — label, title,
 * text, tags, progress and the button. The grid fills the width (fewer cards get wider), so no column stands empty.
 */
function GridCard({ item, shape }: { item: MediaItem; shape: Shape }) {
  const more = useMore("standard")
  const progress = item.pct !== undefined && shows(item, "progress")
  return (
    <Link
      href={item.href}
      className={cn(
        FADE_TO,
        "group/card grid min-w-0 content-start overflow-hidden rounded-[min(var(--radius),12px)] outline-none",
        "bg-[color-mix(in_oklab,var(--card-foreground)_3%,var(--card))] ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_9%,transparent)] ring-inset",
        "transition-[box-shadow,transform,scale] duration-300 ease-out active:scale-[0.99] motion-reduce:active:scale-100",
        "[@media(hover:hover)]:hover:ring-[color-mix(in_oklab,var(--card-foreground)_20%,transparent)] focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className={cn("@container/tile relative overflow-hidden", RATIO[shape])}>
        <div className="absolute inset-0 transition-transform duration-[700ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/card:scale-[1.05] motion-reduce:[@media(hover:hover)]:group-hover/card:scale-100">
          <Art item={item} shape={shape} />
        </div>
        {(item.fresh || item.locked) && (
          <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
            {item.fresh ? <Tag strong>New</Tag> : <span />}
            {item.locked && (
              <Tag>
                <Lock className="size-3" />
                {item.locked}
              </Tag>
            )}
          </div>
        )}
        {progress && item.pct! > 0 && <Meter pct={item.pct!} className="absolute inset-x-0 bottom-0 rounded-none" />}
      </div>
      <div className="grid min-w-0 gap-2 p-[calc(0.875rem*var(--density,1))]">
        {(item.kicker && shows(item, "kicker")) || shows(item, "title") ? (
          <div className="grid min-w-0 gap-0.5">
            {item.kicker && shows(item, "kicker") && <span className={cn(TYPE.label, "truncate")}>{item.kicker}</span>}
            {shows(item, "title") && <h4 className={cn(TYPE.title, "line-clamp-2 text-balance")}>{item.title}</h4>}
          </div>
        ) : null}
        {more && item.sub && shows(item, "text") && <p className={cn(TYPE.small, "line-clamp-2")}>{item.sub}</p>}
        {more && item.tags.length > 0 && shows(item, "tags") && (
          <div className="flex min-w-0 flex-wrap gap-1 overflow-hidden [max-height:1.25rem]">
            {item.tags.slice(0, 3).map((t) => (
              <Tag key={t} plain>
                {t}
              </Tag>
            ))}
          </div>
        )}
        {((progress && item.status) || shows(item, "button")) && (
          // A narrow card puts the button under the progress instead of cutting either.
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pt-0.5">
            {progress ? (
              <span className="flex min-w-0 items-center gap-2">
                <Meter pct={item.pct!} className="w-10 shrink-0" />
                <span className={cn(TYPE.small, "whitespace-nowrap tabular-nums")}>{item.status}</span>
              </span>
            ) : (
              <span className={cn(TYPE.small, "truncate tabular-nums")}>{shows(item, "progress") ? item.status : ""}</span>
            )}
            {shows(item, "button") && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] leading-4 font-medium text-card-foreground">
                <span className="max-w-[10rem] truncate">{ctaOf(item)}</span>
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/card:translate-x-0.5" />
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/** A wrapping grid of cards that always fills the row; on a narrow card each one lies down as a line. */
function Grid({ items, shape }: { items: MediaItem[]; shape: Shape }) {
  // Tall posters in a grid waste height: the grid draws them at 4:5 at most.
  const gridShape: Shape = shape === "portrait" ? "classic" : shape
  return (
    <>
      <div className="hidden gap-3 @[26rem]:grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${WIDE.has(gridShape) ? 13 : 11}rem), 1fr))` }}>
        {items.map((it) => (
          <GridCard key={it.id} item={it} shape={gridShape} />
        ))}
      </div>
      <ul className="grid gap-2 @[26rem]:hidden">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className="group/line flex min-w-0 items-center gap-3 rounded-[min(var(--radius),8px)] outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-[min(var(--radius),6px)]">
                <span className="absolute inset-0 transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover/line:scale-[1.08]">
                  <Art item={it} shape="classic" />
                </span>
              </span>
              <span className="grid min-w-0 flex-1 gap-1">
                <span className={cn(TYPE.title, "truncate")}>{it.title}</span>
                {it.pct !== undefined && shows(it, "progress") ? <Meter pct={it.pct} className="w-full max-w-32" /> : null}
                <span className={cn(TYPE.small, "truncate tabular-nums")}>{it.locked ? `Needs ${it.locked}` : shows(it, "progress") ? it.status : it.tags[0]}</span>
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
  const [w, setW] = useState(0)
  // A callback ref, so it starts measuring whenever the element appears (a Shelf can mount empty and get cards later).
  const ref = useCallback((el: T | null) => {
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
 * every frame so the shrink follows a drag. Loops; dots, a counter or arrows only under it; automatic or by the buttons.
 */
function Carousel({ items: posters, shape, over, nav, auto, every }: { items: MediaItem[]; shape: Shape; over: boolean; nav: string; auto: boolean; every: number }) {
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

  const { handlers } = useAutoplay(auto, every, () => (api?.canScrollNext() ? api.scrollNext() : api?.scrollTo(0)))

  const go = (i: number) => api?.scrollTo(i, still)
  const prev = () => (still ? api?.scrollTo((index - 1 + items.length) % items.length, true) : api?.scrollPrev())
  const next = () => (still ? api?.scrollTo((index + 1) % items.length, true) : api?.scrollNext())

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Posters"
      className="grid gap-3"
      {...handlers}
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
            <div key={it.id} role="group" aria-roledescription="slide" aria-label={`${(i % n) + 1} of ${n}`} aria-hidden={i >= n || undefined} className={cn("min-w-0 shrink-0 grow-0 px-1.5", SLIDE_BASIS[fit(shape)])}>
              <div
                ref={(node) => void (slides.current[i] = node)}
                className="origin-center will-change-transform"
                onClickCapture={(e) => {
                  // A side poster comes to the centre first; only the centred one opens.
                  if (i === index) return
                  e.preventDefault()
                  go(i)
                }}
              >
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
              <button key={it.id} type="button" role="tab" aria-selected={i === index % n} aria-label={`Go to ${i + 1}: ${it.title}`} onClick={() => go(index - (index % n) + i)} className="group/dot grid h-6 place-items-center outline-none">
                <span
                  className="block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-ring"
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

const SOURCE_ICON = { courses: BookOpen, lessons: Play, downloads: Download, own: GalleryHorizontal }

/** Seconds between steps when a Shelf or Featured plays on its own. */
export const everyOf = (props: WidgetProps["props"], fallback: number) => Math.min(20, Math.max(3, Number(props.every) || fallback))
/** Automatic or by the buttons (older pages saved a switch). */
export const autoOf = (props: WidgetProps["props"], fallback: boolean) => (props.play === "auto" ? true : props.play === "manual" ? false : props.autoplay === true || fallback)

/** Shelf: row (scrolls), carousel (centred, sides shrink), grid (cards that fill the row; a list when narrow). */
export function Shelf({ variant = "row", props }: WidgetProps) {
  const { source, cards, title, href } = useShelfCards(props)
  const shape = (["portrait", "landscape", "photo", "classic", "square"].includes(String(props.shape)) ? props.shape : variant === "grid" ? "photo" : SHAPE_OF[source]) as Shape
  const over = props.words !== "below"
  const { core } = useFrame()
  const [ref, width] = useWidth<HTMLDivElement>()
  const auto = autoOf(props, false)
  const every = everyOf(props, 5)
  const Icon = SOURCE_ICON[source] ?? GalleryHorizontal

  if (cards.length === 0)
    return (
      <WidgetEmpty
        icon={Icon}
        title={source === "own" ? "No cards yet" : source === "downloads" ? "No files yet" : source === "lessons" ? "Nothing to continue yet" : "No courses yet"}
        text={source === "own" ? "Add cards in Design → Content." : "What the coach publishes shows here as posters."}
      />
    )

  // The carousel needs room for its sides to shrink: under ~30rem it is a row.
  const carousel = variant === "carousel" && width >= 480
  const unit = source === "downloads" ? "files" : source === "lessons" ? "lessons" : source === "own" ? "cards" : "courses"
  return (
    <WCard icon={Icon} title={String(props.title || title)} meta={`${cards.length} ${unit}`} action={core || source === "own" ? undefined : { label: "See all", href }} bodyClassName="min-h-0">
      <SameTitleSize>
        <div ref={ref} className="min-w-0">
          {carousel ? (
            <Carousel items={cards} shape={shape} over={over} nav={String(props.nav || "dots")} auto={auto} every={every} />
          ) : variant === "grid" ? (
            <Grid items={cards.slice(0, 12)} shape={shape} />
          ) : (
            <Row items={cards} shape={shape} over={over} auto={auto} every={every} />
          )}
        </div>
      </SameTitleSize>
    </WCard>
  )
}

// ---------- Featured (the Hero's full-width layout)

export type Slide = {
  id: string
  picture?: string
  tone: number
  eyebrow?: string
  tags: string[]
  title?: string
  text?: string
  facts: string[]
  pct?: number
  button?: { label: string; href: string }
  button2?: { label: string; href: string }
}

/** At most this many slides in a Featured hero (pictures live in the coach's browser storage). */
export const MAX_SLIDES = 6
/** At most this many cards on a Shelf. */
export const MAX_CARDS = 12

/** The slides a Featured hero starts with: the coach's older headline, then their courses. */
export function useDefaultSlides(props: WidgetProps["props"]) {
  const { base, coach } = useCoach()
  const { items } = useMediaItems("courses")
  const legacy: MediaItem[] =
    props.title || props.image
      ? [{ id: "own", title: String(props.title || "Trade with a plan"), kicker: String(props.eyebrow || ""), sub: String(props.text || ""), tags: [], tone: 0, picture: str(props.image), href: hrefOf(base, String(props.target || "courses"), str(props.url)), button: String(props.button || "Start here") }]
      : []
  const courses = items.slice(0, legacy.length ? 3 : 4).map((c) => ({ ...c, kicker: c.locked ? `Needs ${c.locked}` : c.fresh ? "New" : coach.wording.courses, tags: c.tags.slice(0, 1), button: c.locked ? "See what it includes" : c.pct ? "Continue" : "Start" }))
  return [...legacy, ...courses]
}

/** The Featured slides as the student sees them: the defaults, or the coach's own list. */
export function useSlides(props: WidgetProps["props"]): Slide[] {
  const { base } = useCoach()
  const defaults = useDefaultSlides(props)
  const entries = parseEntries(props.cards)
  const byEntry = new Map(entries?.map((e) => [e.id, e]))
  // Once the coach has a list, it is the whole list: new courses don't slip into the hero.
  return applyEntries(defaults, entries, props, base, false)
    .slice(0, MAX_SLIDES)
    .map((it) => {
      const e = byEntry.get(it.id)
      const on = (p: Part) => shows(it, p)
      const label = on("button") ? it.button : undefined
      return {
        id: it.id,
        picture: it.picture,
        tone: it.tone,
        eyebrow: on("kicker") ? it.kicker || undefined : undefined,
        tags: on("tags") ? it.tags : [],
        title: on("title") ? it.title || undefined : undefined,
        text: on("text") ? it.sub || undefined : undefined,
        facts: on("facts") ? (it.facts ?? []) : [],
        pct: on("progress") ? it.pct : undefined,
        button: label ? { label, href: it.href } : undefined,
        button2: e?.button2 && on("button") ? { label: e.button2, href: hrefOf(base, e.target2, e.url2) } : undefined,
      }
    })
}

export type Transition = "fade" | "slide-left" | "slide-right" | "blur" | "zoom"

/** How a slide comes in and goes, by the coach's choice; `d` is the direction of travel (1 forward, -1 back). */
const SLIDE_VARIANTS: Record<Transition, Variants> = {
  fade: { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } },
  blur: { enter: { opacity: 0, filter: "blur(18px)", transform: "scale(1.04)" }, center: { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }, exit: { opacity: 0, filter: "blur(18px)" } },
  zoom: { enter: { opacity: 0, transform: "scale(1.14)" }, center: { opacity: 1, transform: "scale(1)" }, exit: { opacity: 0, transform: "scale(0.94)" } },
  // Slides travel one way: from the right (the next comes in from the right) or from the left; going back reverses it.
  "slide-left": { enter: (d: number) => ({ transform: `translateX(${d * 100}%)` }), center: { transform: "translateX(0%)" }, exit: (d: number) => ({ transform: `translateX(${-d * 100}%)` }) },
  "slide-right": { enter: (d: number) => ({ transform: `translateX(${-d * 100}%)` }), center: { transform: "translateX(0%)" }, exit: (d: number) => ({ transform: `translateX(${d * 100}%)` }) },
}
const DURATION: Record<Transition, number> = { fade: 0.7, blur: 0.8, zoom: 0.9, "slide-left": 0.75, "slide-right": 0.75 }

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

const WORDS: Variants = { enter: {}, center: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } }, exit: { opacity: 0, transition: { duration: 0.16 } } }
const WORD: Variants = { enter: { opacity: 0, transform: "translateY(10px)" }, center: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.42, ease: MOTION.ease } }, exit: {} }

/**
 * Featured: a full-width stage of up to six slides, each with its own picture and parts (label, tags, title, text,
 * facts, progress, one or two buttons — any of them can be off, down to a picture alone). Slides change on their own
 * (thin bars fill to show the time left; hover, focus and a hidden tab pause it) or only by the arrows and bars, with the
 * coach's transition. One slide stands still. Narrow, the picture sits on top and the words under it.
 */
export function Featured({ props }: WidgetProps) {
  const slides = useSlides(props)
  const still = useShouldReduceMotion()
  const { emphasis } = useFrame()
  const more = useMore("standard")
  const [state, setState] = useState({ at: 0, dir: 1 })
  const n = slides.length
  const at = n ? state.at % n : 0
  const s = slides[at]
  const auto = n > 1 && autoOf(props, true)
  const every = everyOf(props, 7)
  const transition: Transition = (["fade", "slide-left", "slide-right", "blur", "zoom"].includes(String(props.transition)) ? props.transition : "fade") as Transition
  const kind: Transition = still ? "fade" : transition
  const go = (k: number, dir = k > at ? 1 : -1) => setState({ at: (k + n) % n, dir })
  const [hold, setHold] = useState(false)
  const [hidden, setHidden] = useState(false)
  const running = auto && !still && !hold && !hidden

  useEffect(() => {
    const on = () => setHidden(document.hidden)
    document.addEventListener("visibilitychange", on)
    return () => document.removeEventListener("visibilitychange", on)
  }, [])

  if (!s) return <WidgetEmpty icon={Play} title="Nothing to feature yet" text="Add a slide in Design → Content." />

  const hasWords = !!(s.eyebrow || s.tags.length || s.title || s.text || s.facts.length || s.pct !== undefined || s.button || s.button2)
  const fadeX = "linear-gradient(to right, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 86%, transparent) 26%, color-mix(in oklab, var(--fade-to) 40%, transparent) 50%, transparent 72%)"
  const controls = n > 1 && (
    <div className={cn("flex items-center gap-2", !hasWords && "rounded-full bg-[color-mix(in_oklab,var(--card)_72%,transparent)] px-1.5 py-1 backdrop-blur-sm")}>
      <Arrow dir="prev" onClick={() => go(at - 1, -1)} className="size-7" />
      <div className="flex items-center gap-1" role="tablist" aria-label="Featured">
        {slides.map((x, k) => (
          <button key={x.id} type="button" role="tab" aria-selected={k === at} aria-label={`Show slide ${k + 1}${x.title ? `: ${x.title}` : ""}`} onClick={() => go(k)} className="group/bar grid h-6 w-6 place-items-center outline-none @[40rem]:w-8">
            <span className="relative block h-[3px] w-full overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_22%,transparent)] transition-colors group-hover/bar:bg-[color-mix(in_oklab,var(--card-foreground)_40%,transparent)] group-focus-visible/bar:ring-2 group-focus-visible/bar:ring-ring">
              {k === at && (
                <motion.span
                  key={`${x.id}-${running}`}
                  className="absolute inset-0 origin-left bg-card-foreground"
                  initial={{ transform: running ? "scaleX(0)" : "scaleX(1)" }}
                  animate={{ transform: "scaleX(1)" }}
                  transition={{ duration: running ? every : 0, ease: "linear" }}
                  onAnimationComplete={() => running && go(at + 1, 1)}
                />
              )}
            </span>
          </button>
        ))}
      </div>
      <Arrow dir="next" onClick={() => go(at + 1, 1)} className="size-7" />
    </div>
  )

  return (
    <W className="gap-0 p-0">
      <div
        className={cn(FADE_TO, "relative isolate flex min-h-0 flex-1 flex-col")}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocusCapture={() => setHold(true)}
        onBlurCapture={() => setHold(false)}
        onKeyDownCapture={(e) => {
          if (n < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return
          e.preventDefault()
          go(e.key === "ArrowLeft" ? at - 1 : at + 1, e.key === "ArrowLeft" ? -1 : 1)
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured"
      >
        <div className={cn("relative w-full shrink-0 overflow-hidden", hasWords ? "aspect-video @[40rem]:absolute @[40rem]:inset-0 @[40rem]:aspect-auto" : "aspect-video @[40rem]:aspect-auto @[40rem]:min-h-[22rem] @[60rem]:min-h-[26rem]")}>
          <AnimatePresence initial={false} custom={state.dir}>
            <motion.div key={s.id} className="absolute inset-0" custom={state.dir} variants={SLIDE_VARIANTS[kind]} initial="enter" animate="center" exit="exit" transition={{ duration: still ? 0.15 : DURATION[kind], ease: MOTION.ease }}>
              <motion.div className="absolute inset-0 origin-[70%_40%]" initial={{ transform: "scale(1)" }} animate={{ transform: running ? "scale(1.05)" : "scale(1)" }} transition={{ duration: running ? every + 1 : 0.6, ease: running ? "linear" : MOTION.ease }}>
                {s.picture ? <Art item={{ id: s.id, title: s.title ?? "", tags: [], tone: s.tone, href: "#", picture: s.picture }} /> : <Stage tone={s.tone} seed={s.id} />}
              </motion.div>
              {/* No picture: a poster of the slide stands on the stage, on the right. */}
              {!s.picture && s.title && (
                <div
                  aria-hidden
                  className="@container/tile absolute top-[12%] right-[6%] bottom-[12%] aspect-[2/3] overflow-hidden rounded-[min(var(--radius),10px)] shadow-[0_24px_48px_-16px_rgb(0_0_0/0.45)] ring-1 ring-[color-mix(in_oklab,var(--card-foreground)_14%,transparent)] @[40rem]:top-[12%] @[40rem]:right-[7%] @[40rem]:bottom-[22%]"
                >
                  <Art item={{ id: s.id, kicker: s.eyebrow, title: s.title, tags: [], tone: s.tone, href: "#" }} typeset />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {hasWords && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: FADE_UP }} />
              <div aria-hidden className="pointer-events-none absolute inset-0 hidden @[40rem]:block" style={{ background: fadeX }} />
            </>
          )}
          {!hasWords && controls && <div className="absolute right-3 bottom-3 @[40rem]:right-6 @[40rem]:bottom-6">{controls}</div>}
        </div>

        {hasWords && (
          <div className="relative flex min-h-0 flex-1 flex-col justify-end gap-4 p-[calc(1rem*var(--density,1))] @[40rem]:min-h-[22rem] @[40rem]:p-[calc(2rem*var(--density,1))] @[60rem]:min-h-[26rem] @[60rem]:p-[calc(2.5rem*var(--density,1))]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={s.id} className="grid max-w-[34rem] gap-3 @[40rem]:max-w-[52%]" variants={WORDS} initial="enter" animate="center" exit="exit">
                {(s.eyebrow || s.tags.length > 0) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-1.5">
                    {s.eyebrow && <Tag strong>{s.eyebrow}</Tag>}
                    {s.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </motion.div>
                )}
                {s.title && (
                  <motion.h3 variants={WORD} className={cn(emphasis === "star" ? TYPE.star : TYPE.valueLg, "line-clamp-2 text-balance")}>
                    {s.title}
                  </motion.h3>
                )}
                {more && s.text && (
                  <motion.p variants={WORD} className={cn(TYPE.body, "line-clamp-3 max-w-prose text-muted-foreground")}>
                    {s.text}
                  </motion.p>
                )}
                {(s.pct !== undefined || s.facts.length > 0) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {s.pct !== undefined && (
                      <span className="flex items-center gap-2">
                        <Meter pct={s.pct} className="w-20" />
                        <span className={cn(TYPE.small, "tabular-nums")}>{s.pct}% complete</span>
                      </span>
                    )}
                    {s.facts.map((f, i) => (
                      <span key={f} className={cn(TYPE.small, "flex items-center gap-4 tabular-nums")}>
                        {i > 0 || s.pct !== undefined ? <span aria-hidden className="h-3 w-px bg-border" /> : null}
                        {f}
                      </span>
                    ))}
                  </motion.div>
                )}
                {(s.button || s.button2) && (
                  <motion.div variants={WORD} className="flex flex-wrap items-center gap-2 pt-1">
                    {s.button && (
                      <Button size="sm" className={cn("w-fit", CTA)} render={<Link href={s.button.href} />} nativeButton={false}>
                        <Play /> <span className="truncate">{s.button.label}</span>
                      </Button>
                    )}
                    {s.button2 && (
                      <Button size="sm" variant="outline" className={cn("w-fit bg-[color-mix(in_oklab,var(--card)_60%,transparent)]", CTA)} render={<Link href={s.button2.href} />} nativeButton={false}>
                        <span className="truncate">{s.button2.label}</span>
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            {controls && <div className="@[40rem]:absolute @[40rem]:right-[calc(2rem*var(--density,1))] @[40rem]:bottom-[calc(2rem*var(--density,1))]">{controls}</div>}
          </div>
        )}
      </div>
    </W>
  )
}
