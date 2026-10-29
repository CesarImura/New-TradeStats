"use client"

import { useId, useState } from "react"
import { cn } from "@/lib/utils"
import { useCoach } from "@/components/coach/coach-provider"
import { widgetHeaderOf } from "@/lib/theme/types"
import { ACCENT, ACCENT_TEXT, Drop, GROW_ROWS, SPREAD_ROWS, Tip, TYPE, useFrame, W } from "./kit"
import { GREY, Label, Num, TRACK, ink, useFigureFont } from "./instrument"

/**
 * Shared layout types, so widgets differ in SHAPE, not just in their chart:
 * - Hero: one figure owns the card, a sentence says what it means, a visual
 *   bleeds off the bottom edge. Big through space, not type: the figure stays
 *   28px (40px only on the page's Star), per the type rules in kit.tsx.
 * - Split: a picture or poster panel beside the details; stacks when narrow.
 * - Rail: a vertical timeline with a "now" marker; past above, ahead below.
 * - Media: a picture fills the card and the words sit on it.
 * - HeatGrid: a labelled grid of cells (hour × day, rule × day).
 * - Compare: two sides (you and the coach, this week and last) row by row.
 */

/** Card padding, the same as W's, for layouts that pad their own parts. */
const PAD = "px-[calc(1rem*var(--density,1))]"

// ---------- Hero

export function HeroCard({
  title,
  chip,
  label,
  value,
  unit,
  delta,
  deltaTone,
  line,
  stats,
  foot,
}: {
  title: React.ReactNode
  chip?: React.ReactNode
  /** Small label over the figure: "Left before the floor". */
  label?: React.ReactNode
  value: React.ReactNode
  unit?: string
  delta?: React.ReactNode
  deltaTone?: "profit" | "loss" | "accent" | "muted"
  /** One sentence that says what the figure means (Standard and up). */
  line?: React.ReactNode
  /** Small figures in a row under the sentence (Detailed). */
  stats?: {
    label: string
    value: React.ReactNode
    tone?: "profit" | "loss" | "accent"
  }[]
  /** Full-bleed visual along the bottom edge. */
  foot?: React.ReactNode
}) {
  const font = useFigureFont()
  const { header } = useFrame()
  const { theme } = useCoach()
  const h = widgetHeaderOf(theme, header)
  return (
    <W className="gap-0 p-0">
      {(h.title || (chip && h.value)) && (
        <div className={cn("flex min-w-0 shrink-0 items-center gap-2 pt-[calc(0.875rem*var(--density,1))]", PAD)}>
          <Label className="min-w-0 flex-1 truncate">{h.title ? title : null}</Label>
          {chip && h.value && <span className="hidden shrink-0 @[13rem]:inline-flex">{chip}</span>}
        </div>
      )}
      <div className={cn("flex min-h-0 flex-1 flex-col justify-end gap-1 pb-[calc(0.875rem*var(--density,1))]", PAD)}>
        {label && <span className={cn(TYPE.small, "truncate")}>{label}</span>}
        <Num value={value} unit={unit} delta={delta} deltaTone={deltaTone} />
        {line && <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>{line}</p>}
        {stats && (
          <div
            className="mt-2 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))`,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} className="grid min-w-0 gap-0.5">
                <Label className="truncate">{s.label}</Label>
                <span
                  className="truncate text-[0.8125rem] leading-5 tabular-nums"
                  style={{
                    fontFamily: font,
                    color: s.tone === "profit" ? "var(--profit-text)" : s.tone === "loss" ? "var(--loss-text)" : s.tone === "accent" ? ink(ACCENT_TEXT) : undefined,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* The visual along the bottom; in a cell that sets the height it takes a larger share (and no cap), so a tall hero isn't a blank band over a strip. */}
      {foot && <div className="relative h-[28%] max-h-20 min-h-9 shrink-0 [@container_card_(min-height:0px)]:h-[42%] [@container_card_(min-height:0px)]:max-h-none">{foot}</div>}
    </W>
  )
}

/** An area line that runs edge to edge: a barely-there tint, a hairline, a dot on the latest value. `floor` draws a dashed loss line. */
export function BleedArea({ values, floor, invert }: { values: number[]; floor?: number; invert?: boolean }) {
  const id = useId()
  const pts = invert ? values.map((v) => -v) : values
  const fl = floor === undefined ? undefined : invert ? -floor : floor
  const hi = Math.max(...pts)
  const lo = Math.min(...pts, fl ?? Infinity)
  const span = hi - lo || 1
  const x = (i: number) => (i / (pts.length - 1)) * 100
  const y = (v: number) => 6 + ((hi - v) / span) * 44
  const line = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ")
  const last = pts.length - 1
  return (
    <>
      <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <clipPath id={`c${id}`}>
            <rect width="100" height="52" />
          </clipPath>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <path d={`${line} L100 52 L0 52 Z`} fill={ACCENT} opacity={0.05} />
          {fl !== undefined && <line x1={0} x2={100} y1={y(fl)} y2={y(fl)} stroke="var(--loss)" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
          <path d={line} fill="none" stroke={ACCENT} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      <span
        className="r-dot absolute size-2 -translate-x-full -translate-y-1/2 border-[1.5px] bg-card"
        style={{
          left: "100%",
          top: `${(y(pts[last]) / 52) * 100}%`,
          borderColor: ACCENT,
          marginLeft: -2,
        }}
      />
    </>
  )
}

/** A row of thin bars along the bottom edge: one per day or trade. */
export function BleedBars({ bars }: { bars: { h: number; color: string; ring?: boolean; title?: string }[] }) {
  return (
    <div className={cn("absolute inset-0 flex items-end gap-[3px] pb-[calc(0.875rem*var(--density,1))]", PAD)}>
      {bars.map((b, i) => (
        <span
          key={i}
          title={b.title}
          className="r-bar min-w-0 flex-1"
          style={{
            height: `${Math.max(12, b.h * 100)}%`,
            ...(b.ring ? { boxShadow: `inset 0 0 0 1.5px ${b.color}` } : { background: b.color }),
          }}
        />
      ))}
    </div>
  )
}

// ---------- Split

/**
 * A panel (picture, poster, photo) beside the details. From 22rem wide the
 * panel takes the left ~40% at full height; narrower, it becomes a thin band
 * on top (parts marked data-split-narrow="hide" drop out there).
 */
export function SplitCard({ panel, children, className }: { panel: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <W className={cn("gap-0 p-0 @[22rem]:flex-row", className)}>
      <div className="relative h-10 shrink-0 overflow-hidden @[22rem]:h-auto @[22rem]:w-[40%] @[22rem]:max-w-72 [&_[data-split-narrow=hide]]:hidden @[22rem]:[&_[data-split-narrow=hide]]:flex">{panel}</div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-[calc(1rem*var(--density,1))]">{children}</div>
    </W>
  )
}

/**
 * A dark poster for the Split panel: the coach's artwork (a candlestick
 * line), a small label on top and a title at the bottom, in the heading font.
 */
/** The coach's artwork until they upload their own: a dark panel with a fine candlestick line. Fills its parent. */
export function Artwork({ className, children }: { className?: string; children?: React.ReactNode }) {
  const candles = [30, 44, 38, 52, 47, 60, 55, 68, 62, 74, 70, 80]
  // The line sits in the top-right corner: the kicker is top-left and the title bottom-left, so no candle runs through the words.
  const top = (h: number) => 34 - h * 0.34
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: MEDIA_BG, color: MEDIA_FG }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {candles.map((h, i) => {
          const x = 58 + i * 3.4
          return (
            <g key={i} stroke="currentColor" fill={i % 3 === 1 ? "none" : "currentColor"} opacity={i === candles.length - 1 ? 0.36 : 0.16}>
              <line x1={x + 0.9} x2={x + 0.9} y1={top(h) - 2.5} y2={top(h) + 7} strokeWidth="0.3" />
              <rect x={x} y={top(h)} width="1.8" height="4.5" strokeWidth="0.3" />
            </g>
          )
        })}
      </svg>
      {children}
    </div>
  )
}

/** A dark poster for the Split panel: the artwork, a small label on top, a title at the bottom in the heading font. */
export function Poster({ kicker, title, sub }: { kicker?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Artwork>
      <div data-split-narrow="hide" className="absolute inset-0 flex flex-col justify-between gap-2 p-3">
        {kicker ? <span className="text-[0.6875rem] leading-4 font-medium tracking-[0.04em] uppercase">{kicker}</span> : <span />}
        <div className="grid min-w-0 gap-0.5">
          <span className="line-clamp-2 font-heading text-[0.8125rem] leading-5">{title}</span>
          {sub && (
            <span className="truncate text-[0.6875rem] leading-4" style={{ color: MEDIA_FG2 }}>
              {sub}
            </span>
          )}
        </div>
      </div>
    </Artwork>
  )
}

// ---------- Media

/** Media colours: the dark artwork panel and the text on it (a Star card re-points both, see W). */
export const MEDIA_BG = "var(--cover-bg, var(--media-bg))"
export const MEDIA_FG = "var(--cover-fg, var(--media-fg))"
/** Secondary text on media: the text colour pulled a little toward the panel, still well above AA. */
export const MEDIA_FG2 = `color-mix(in oklab, ${MEDIA_FG} 78%, ${MEDIA_BG})`

/**
 * A picture fills the card and the words sit on it: a small label and an
 * aside on top, the title (20px, heading font) and a line at the bottom, then
 * an optional footer row (progress, reactions, a button). The picture is a
 * flat dark panel, never a gradient scrim, so text contrast is known.
 */
export function MediaCard({
  image,
  kicker,
  aside,
  title,
  sub,
  footer,
  side,
}: {
  /** Fills the card, e.g. <Artwork /> or a coach photo. */
  image: React.ReactNode
  /** A photo: it takes the right ~45% and the words stay on the plain panel, so a busy picture never sits behind text. */
  side?: boolean
  kicker?: React.ReactNode
  aside?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    // The card itself carries the media colour, so the colour behind the text is real (the picture layer only adds detail).
    <W className="relative gap-0 p-0" style={{ background: MEDIA_BG }}>
      <div className={side ? "absolute inset-y-0 right-0 w-[45%]" : "absolute inset-0"}>{image}</div>
      <div className="relative flex min-h-0 flex-1 flex-col gap-2 p-[calc(1rem*var(--density,1))]" style={{ color: MEDIA_FG }}>
        <div className="flex min-w-0 items-center gap-2">
          {kicker && <span className="min-w-0 flex-1 truncate text-[0.6875rem] leading-4 font-medium tracking-[0.04em] uppercase">{kicker}</span>}
          {aside && <span className="ml-auto shrink-0">{aside}</span>}
        </div>
        <div className={cn("mt-auto grid min-w-0 gap-1", side && "max-w-[55%] pr-3")}>
          <span className="line-clamp-2 font-heading text-xl leading-7 font-medium tracking-tight">{title}</span>
          {sub && (
            <span className="line-clamp-2 text-[0.8125rem] leading-5" style={{ color: MEDIA_FG2 }}>
              {sub}
            </span>
          )}
        </div>
        {footer && <div className="flex min-w-0 shrink-0 items-center gap-3 pt-1">{footer}</div>}
      </div>
    </W>
  )
}

/** A thin progress line for media cards, in the media text colour. */
export function MediaProgress({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("relative block h-1 min-w-0 flex-1 overflow-hidden rounded-full", className)} style={{ background: `color-mix(in oklab, ${MEDIA_FG} 22%, transparent)` }}>
      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: MEDIA_FG }} />
    </span>
  )
}

// ---------- Heatmap

/** `dot`: a small mark in the cell (profit or loss), so results never need a red or green block. */
export type HeatCell = { fill?: string; ring?: string; title?: string; text?: React.ReactNode; dot?: string }

/**
 * A labelled grid of cells: row labels on the left, sparse column labels
 * under it, cells that stretch to fill the card. The widget decides each
 * cell's colour (results, activity, rules); the grid only lays them out.
 */
export function HeatGrid({ rows, rowLabels, colLabels, className }: { rows: HeatCell[][]; rowLabels: string[]; colLabels: (string | undefined)[]; className?: string }) {
  const font = useFigureFont()
  const [hover, setHover] = useState<[number, number]>()
  const n = rows[0]?.length ?? 1
  // Cells grow with the card up to a calm size (2.25rem wide, 2rem tall), then the grid stays centred: no grey slabs on a big card.
  const grid = { gridTemplateColumns: `2rem repeat(${n}, minmax(0,2.25rem))` }
  return (
    <div className={cn("flex min-h-16 flex-1 flex-col justify-center gap-[3px]", className)} onPointerLeave={() => setHover(undefined)}>
      {rows.map((r, ri) => (
        <div key={ri} className="grid min-h-2 max-h-8 flex-1 justify-center gap-[3px]" style={grid}>
          {/* A tight line: the label must not make a row taller than its cells need, or a short card's grid spills. */}
          <span className={cn("self-center truncate text-[0.6875rem] leading-[0.875rem] transition-colors duration-150", hover?.[0] === ri ? "text-foreground" : "text-muted-foreground")} style={{ fontFamily: font }}>
            {rowLabels[ri]}
          </span>
          {r.map((c, ci) => {
            const on = hover?.[0] === ri && hover?.[1] === ci
            return (
              <span
                key={ci}
                onPointerEnter={() => setHover([ri, ci])}
                className={cn("r-bar relative grid min-w-0 place-items-center text-[0.6875rem] leading-none tabular-nums transition-opacity duration-150", hover && !on && "opacity-50")}
                style={{
                  background: c.fill ?? `color-mix(in oklab, var(--foreground) 6%, transparent)`,
                  boxShadow: on ? "0 0 0 1.5px var(--card), 0 0 0 3px var(--foreground)" : c.ring ? `inset 0 0 0 1.5px ${c.ring}` : undefined,
                  fontFamily: font,
                }}
              >
                {c.text ?? (c.dot && <i className="r-dot size-[5px]" style={{ background: c.dot }} />)}
                {on && c.title && <Tip x={50} y={ri < 2 ? 100 : 0} place={ri < 2 ? "below" : "above"} value={c.title} />}
              </span>
            )
          })}
        </div>
      ))}
      {/* The hour labels give way first on a very short card. */}
      <Drop level={2}>
        <div className="grid justify-center gap-[3px]" style={grid}>
          <span />
          {colLabels.map((l, i) => (
            <span
              key={i}
              // The last label ends at the grid's edge and runs left, so a long one ("today") never pokes out of the card.
              className={cn("overflow-visible text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums transition-colors duration-150", i === colLabels.length - 1 && "justify-self-end", hover?.[1] === i ? "text-foreground" : "text-muted-foreground")}
              style={{ fontFamily: font }}
            >
              {l ?? ""}
            </span>
          ))}
        </div>
      </Drop>
    </div>
  )
}

/** A grey shade for activity-like values (0..1), faint to strong. Greys, not the accent: a full grid in the brand colour would swamp the card. */
export const heatShade = (t: number) => (t <= 0 ? undefined : `color-mix(in oklab, var(--foreground) ${Math.round(10 + t * 52)}%, transparent)`)
/** A result (−1..1 of the largest) as a cell: a neutral shade for its size, a profit or loss dot for its sign. */
export const heatPl = (t: number): HeatCell => (t === 0 ? {} : { fill: `color-mix(in oklab, var(--foreground) ${Math.round(5 + Math.abs(t) * 20)}%, transparent)`, dot: t > 0 ? "var(--profit)" : "var(--loss)" })

// ---------- Compare

export type CompareRow = {
  label: string
  a: number
  b: number
  aText: string
  bText: string
  /** Which way is better; marks who's ahead on the row. */
  better?: "higher" | "lower"
}

/**
 * Two sides, one row per measure: the label with both values, then two thin
 * bars (side A in the accent, side B in grey) on the same scale. Who's ahead
 * on a row gets the stronger text.
 */
export function Compare({ a, b, rows, className }: { a: string; b: string; rows: CompareRow[]; className?: string }) {
  const font = useFigureFont()
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2.5", className)}>
      <div className="flex min-w-0 items-center gap-3 text-[0.6875rem] leading-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <i className="size-2 shrink-0 rounded-[2px]" style={{ background: ACCENT }} />
          <span className="truncate">{a}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <i className="size-2 shrink-0 rounded-[2px]" style={{ background: GREY[1] }} />
          <span className="truncate">{b}</span>
        </span>
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start gap-y-2.5 overflow-hidden *:w-full", SPREAD_ROWS)}>
        {rows.map((r) => {
          const max = Math.max(Math.abs(r.a), Math.abs(r.b), 1e-9)
          const aAhead = r.better ? (r.better === "higher" ? r.a > r.b : r.a < r.b) : false
          const bAhead = r.better ? (r.better === "higher" ? r.b > r.a : r.b < r.a) : false
          return (
            <div key={r.label} className="grid gap-1">
              <div className="flex min-w-0 items-baseline gap-2 text-[0.6875rem] leading-4">
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{r.label}</span>
                <span className="shrink-0 tabular-nums" style={{ fontFamily: font, color: aAhead ? ink(ACCENT_TEXT) : undefined, fontWeight: aAhead ? 500 : undefined }}>
                  {r.aText}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums" style={{ fontFamily: font, fontWeight: bAhead ? 500 : undefined }}>
                  {r.bText}
                </span>
              </div>
              <div className="grid gap-[2px]">
                {/* In a tall cell the bars thicken a little with the card (cqh), so the chart keeps its weight. */}
                <span className="r-bar h-[5px] [@container_card_(min-height:0px)]:h-[clamp(5px,1.1cqh,9px)]" style={{ width: `${Math.max(2, (Math.abs(r.a) / max) * 100)}%`, background: ACCENT }} />
                <span className="r-bar h-[5px] [@container_card_(min-height:0px)]:h-[clamp(5px,1.1cqh,9px)]" style={{ width: `${Math.max(2, (Math.abs(r.b) / max) * 100)}%`, background: GREY[2] }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Rail

export type RailItem =
  | {
      /** Left column: a time, a day, a step number. */
      time: string
      title: React.ReactNode
      sub?: React.ReactNode
      /** Right column. */
      aside?: React.ReactNode
      /** past: done (grey dot); next: the accent; ahead: still open (hollow). The line is solid on the past side of the now marker. */
      state: "past" | "next" | "ahead"
      /** Dot colour override (e.g. the loss colour for a no-trade release). */
      color?: string
    }
  | { now: string }
  | { group: string }

/**
 * A vertical timeline. The rail is drawn per row, so rows that don't fit the
 * card's height drop out whole (the list wraps into a hidden second column).
 * `newestFirst`: the now marker sits on top and the past runs down from it.
 */
export function Rail({ items, newestFirst, className }: { items: RailItem[]; newestFirst?: boolean; className?: string }) {
  const font = useFigureFont()
  const nowAt = items.findIndex((it) => "now" in it)
  const cols = "grid grid-cols-[2.75rem_0.75rem_minmax(0,1fr)_auto] gap-x-2"
  // A day heading travels with the row after it, so a heading is never left without its rows.
  const rows: {
    it: Exclude<RailItem, { group: string }>
    head?: string
    i: number
  }[] = []
  let head: string | undefined
  items.forEach((it, i) => {
    if ("group" in it) head = it.group
    else {
      rows.push({ it, head, i })
      head = undefined
    }
  })
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS, className)}>
      {rows.map(({ it, head, i }, n) => {
        const past = nowAt >= 0 && (newestFirst ? i > nowAt : i < nowAt)
        const lineStyle = past
          ? { background: GREY[2] }
          : {
              backgroundImage: `linear-gradient(${TRACK} 50%, transparent 50%)`,
              backgroundSize: "1px 4px",
            }
        const last = n === rows.length - 1
        const heading = head && (
          <div className={cols}>
            <Label className="truncate pt-1.5 pb-0.5">{head}</Label>
            <span className="relative">
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2" style={lineStyle} />
            </span>
            <span />
            <span />
          </div>
        )
        if ("now" in it)
          return (
            <div key={i} className={cn(cols, "items-center py-1")}>
              <span className="text-right text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font, color: ink(ACCENT_TEXT) }}>
                {it.now}
              </span>
              <span className="relative grid h-full place-items-center">
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2" style={{ background: GREY[2] }} />
                <span className="relative size-2.5 rotate-45 rounded-[1px]" style={{ background: ACCENT }} />
              </span>
              <span
                className="h-px self-center"
                style={{
                  background: `color-mix(in oklab, ${ACCENT} 45%, transparent)`,
                }}
              />
              <Label className="pl-1">Now</Label>
            </div>
          )
        const dot =
          it.state === "next"
            ? {
                background: it.color ?? ACCENT,
                boxShadow: `0 0 0 3px color-mix(in oklab, ${it.color ?? ACCENT} 22%, transparent)`,
              }
            : it.state === "past"
              ? { background: it.color ?? GREY[1] }
              : {
                  boxShadow: `inset 0 0 0 1.5px ${it.color ?? GREY[1]}`,
                  background: "var(--card)",
                }
        return (
          <div key={i}>
            {heading}
            <div className={cn(cols, "py-1")}>
              <span
                className="truncate pt-px text-right text-[0.6875rem] leading-5 tabular-nums"
                style={{
                  fontFamily: font,
                  color: it.state === "next" ? ink(ACCENT_TEXT) : "var(--muted-foreground)",
                }}
              >
                {it.time}
              </span>
              <span className="relative">
                <span className={cn("absolute left-1/2 w-px -translate-x-1/2", last ? "top-0 h-2.5" : "-inset-y-1")} style={lineStyle} />
                <span className="r-dot absolute top-1.5 left-1/2 size-2 -translate-x-1/2" style={dot} />
              </span>
              <span className="grid min-w-0">
                <span className={cn("truncate text-[0.8125rem] leading-5", it.state === "next" && "font-medium", it.state === "past" && "text-muted-foreground")}>{it.title}</span>
                {it.sub && <span className="line-clamp-2 text-[0.6875rem] leading-4 text-muted-foreground">{it.sub}</span>}
              </span>
              {it.aside !== undefined ? (
                <span className="flex shrink-0 items-start pt-0.5 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
                  {it.aside}
                </span>
              ) : (
                <span />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
