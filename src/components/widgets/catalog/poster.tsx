"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Lock, Play } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useMore } from "../parts/frame"
import { ACCENT, TYPE, series } from "../parts/tokens"
import { shows, type MediaItem, type Shape } from "./media-data"

// Media widgets: posters in a row, a carousel or a grid (Shelf), and a full-width Featured hero (content.tsx Hero).
// The one place widgets lay words over a picture with a fade (Gustavo, 30 Oct: an exception to "no gradients" for
// media). The fade is always the card's own colour, so it follows whatever the coach picked, and the words sit where it
// is solid: they are measured against the card, never against the picture.
//
// Both widgets keep their cards (or slides) in one prop, `cards`: a JSON list the coach edits in Design → Content
// (admin/design/media-cards-editor.tsx). An entry either points at a course, lesson or file (`ref`, so its progress
// stays live) and overrides what it wants, or is the coach's own card. Pictures are separate props (`img-<id>`), so
// the store keeps each picture once.

export const RATIO: Record<Shape, string> = { portrait: "aspect-[2/3]", landscape: "aspect-video", photo: "aspect-[3/2]", classic: "aspect-[4/3]", square: "aspect-square" }
/** Shapes wider than tall, where a poster's words take the left part. */
export const WIDE = new Set<Shape>(["landscape", "photo", "classic"])

/** The card colour rising from the bottom of a picture: solid under the words, gone by the middle. */
export const FADE_UP = "linear-gradient(to top, var(--fade-to) 0%, color-mix(in oklab, var(--fade-to) 88%, transparent) 22%, color-mix(in oklab, var(--fade-to) 45%, transparent) 48%, transparent 72%)"
/** Where the fade lands: the card colour, or the brand on a filled Star (whose --card is transparent). Set on each media root. */
export const FADE_TO = "[--fade-to:var(--card)] in-[.fx-hero]:[--fade-to:var(--brand,var(--chart-1))]"
/** A softer veil at the top, for a tag or a lock. */
export const FADE_DOWN = "linear-gradient(to bottom, color-mix(in oklab, var(--fade-to) 55%, transparent) 0%, transparent 28%)"

/** Candle heights for the poster's chart, one set per item so posters differ. */
export const CANDLES = [
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
export function Art({ item, shape = "portrait", typeset, className }: { item: MediaItem; shape?: Shape; typeset?: boolean; className?: string }) {
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

export function SameTitleSize({ children }: { children: React.ReactNode }) {
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
export function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

/** A small tag on a picture or a card: a hairline pill. On a picture it sits on the faded card colour. */
export function Tag({ children, strong, plain }: { children: React.ReactNode; strong?: boolean; plain?: boolean }) {
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
export function Meter({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("relative block h-[3px] overflow-hidden rounded-(--r-bar) bg-[color-mix(in_oklab,var(--card-foreground)_16%,transparent)]", className)}>
      <span className="absolute inset-y-0 left-0 rounded-(--r-bar) transition-[width] duration-500" style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%`, background: ACCENT }} />
    </span>
  )
}

/** The words a card's button says: the coach's, or what the student would do. */
export const ctaOf = (item: MediaItem) => item.button || (item.locked ? `Needs ${item.locked}` : item.pct ? "Continue" : item.pct === undefined ? "Open" : "Start")

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
