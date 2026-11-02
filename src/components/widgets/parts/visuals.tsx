"use client"

import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { motion } from "motion/react"
import { useId, useState } from "react"
import { cn } from "@/lib/utils"
import { useMore } from "./frame"
import { ACCENT, ACCENT_TEXT, AreaFill, MOTION } from "./tokens"
import { GREY, TRACK, ink, useChartStyle, useFigureFont, useWidgetStyle } from "./anatomy"

// The signature visuals every widget picks from: legend, axis, tick gauge and bar, donut, step chart, dot strip, hatched bar, timeline.

/** Legend rows: a square, a label, the value on the right. The packing tool. */
export function Legend({ items, className }: { items: { color?: string; label: React.ReactNode; value?: React.ReactNode; valueTone?: "profit" | "loss" | "accent"; dot?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  const mono = useWidgetStyle() === "instrument"
  return (
    <div data-legend className={cn("grid gap-1.5", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-5" style={mono ? { fontFamily: font } : undefined}>
          {it.color && <span className={cn("size-2 shrink-0", it.dot ? "r-dot" : "rounded-[2px]")} style={{ background: it.color }} />}
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{it.label}</span>
          {it.value !== undefined && (
            <span
              className="shrink-0 tabular-nums"
              style={{ color: it.valueTone === "profit" ? "var(--profit-text)" : it.valueTone === "loss" ? "var(--loss-text)" : it.valueTone === "accent" ? ink(ACCENT_TEXT) : "var(--foreground)", fontFamily: font }}
            >
              {it.value}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Axis labels spread under a chart: "0%  25%  50%  75%  100%". */
export function Axis({ labels: all, className }: { labels: React.ReactNode[]; className?: string }) {
  const font = useFigureFont()
  // Only the ends until Detailed: the chart says the rest.
  const labels = useMore("detailed") || all.length <= 2 ? all : [all[0], all[all.length - 1]]
  return (
    <div className={cn("flex justify-between text-[0.6875rem] leading-4 text-muted-foreground tabular-nums", className)} style={{ fontFamily: font }}>
      {labels.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </div>
  )
}

/** Rounded to 2 decimals, so server and browser draw the same numbers. */
const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * A semicircle of ticks. Filled ticks ramp from grey to the accent at the
 * value; empty ticks are faint. `children` sits in the middle (the number).
 */
export function TickGauge({ value, max = 100, ticks = 40, ring, children, className }: { value: number; max?: number; ticks?: number; /** A 270° ring instead of a half circle: for a gauge with room in both directions (the figure then sits in its middle). */ ring?: boolean; children?: React.ReactNode; className?: string }) {
  const style = useChartStyle()
  const still = useShouldReduceMotion()
  const sweep = useTempoTransition({ duration: MOTION.draw + 0.25, ease: MOTION.ease })
  // The arc's geometry: a half circle on its baseline, or a ring open at the bottom.
  const start = ring ? Math.PI * 0.75 : Math.PI
  const span = ring ? Math.PI * 1.5 : Math.PI
  const cy = ring ? 110 : 108
  const at = (t: number) => start + span * t
  const on = Math.round((Math.min(value, max) / max) * ticks)
  const pct = Math.min(Math.max(value, 0), max) / max
  // Solid and thin: one arc with the share in the accent (thin is a hairline with a dot at the end).
  const arc = (from: number, to: number) => {
    const a0 = at(from)
    const a1 = at(to)
    return `M${r2(110 + Math.cos(a0) * 93)} ${r2(cy + Math.sin(a0) * 93)} A93 93 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r2(110 + Math.cos(a1) * 93)} ${r2(cy + Math.sin(a1) * 93)}`
  }
  const w = style === "thin" ? 3 : 13
  // Blocks: a few thick segments; Dots: a row of dots. Both light up to the value, the last lit one in the accent.
  const pieces = style === "blocks" ? 11 : 26
  const litPieces = Math.round(pct * pieces)
  return (
    // A size reference for what sits inside it: a figure in a large gauge can grow with it (cqw).
    <div className={cn("relative mx-auto w-full max-w-60 [container-type:inline-size]", className)}>
      <svg viewBox={ring ? "0 0 220 196" : "0 0 220 116"} className="w-full" aria-hidden>
        {style === "blocks" || style === "dots" ? (
          Array.from({ length: pieces }, (_, i) => {
            const lit = i < litPieces
            const head = lit && i === litPieces - 1
            const fill = !lit ? TRACK : head ? ACCENT : "var(--foreground)"
            const opacity = !lit || head ? 1 : r2(0.4 + (0.45 * i) / Math.max(litPieces, 1))
            if (style === "dots") {
              const a = at(i / (pieces - 1))
              return <circle key={i} cx={r2(110 + Math.cos(a) * 94)} cy={r2(cy + Math.sin(a) * 94)} r={4.2} fill={fill} fillOpacity={opacity} />
            }
            const gap = 0.05
            const a0 = i / pieces + gap / 2 / pieces * 2
            const a1 = (i + 1) / pieces - gap / 2 / pieces * 2
            return <path key={i} d={arc(a0, a1)} fill="none" stroke={fill} strokeOpacity={opacity} strokeWidth={20} style={{ strokeLinecap: "var(--cap)" as never }} />
          })
        ) : style === "ticks" ? (
          Array.from({ length: ticks }, (_, i) => {
            const a = at(i / (ticks - 1))
            const lit = i < on
            const head = lit && i >= on - Math.max(2, Math.round(ticks * 0.12))
            return (
              <line
                key={i}
                x1={r2(110 + Math.cos(a) * 86)}
                y1={r2(cy + Math.sin(a) * 86)}
                x2={r2(110 + Math.cos(a) * 100)}
                y2={r2(cy + Math.sin(a) * 100)}
                stroke={!lit ? TRACK : head ? ACCENT : "var(--foreground)"}
                strokeOpacity={!lit || head ? 1 : r2(0.35 + (0.5 * i) / Math.max(on, 1))}
                strokeWidth={3.2}
                style={{ strokeLinecap: "var(--cap)" as never }}
              />
            )
          })
        ) : (
          <>
            <path d={arc(0, 1)} fill="none" stroke={TRACK} strokeWidth={w} style={{ strokeLinecap: "var(--cap)" as never }} />
            {/* The value sweeps in along the arc once. */}
            {pct > 0 && <motion.path d={arc(0, pct)} fill="none" stroke={ACCENT} strokeWidth={w} style={{ strokeLinecap: "var(--cap)" as never }} initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={sweep} />}
            {style === "thin" && pct > 0 && (
              <circle cx={r2(110 + Math.cos(at(pct)) * 93)} cy={r2(cy + Math.sin(at(pct)) * 93)} r={5} fill={ACCENT} />
            )}
          </>
        )}
      </svg>
      {/* The figure: in a ring, at its centre; in a half circle, on the baseline, where the open space is. */}
      {children && <div className={cn("absolute inset-x-0 grid justify-items-center gap-[clamp(0.125rem,1cqw,0.5rem)] text-center", ring ? "top-[56%] -translate-y-1/2" : "bottom-0")}>{children}</div>}
    </div>
  )
}

/**
 * A ring on a track, the figure in its middle: the shape that replaces the
 * half-circle gauge. `parts` run clockwise from the top. It follows Design →
 * Bars and gauges like every gauge and bar: Solid is a band on a hatched
 * track, Thin a fine line with a dot at its end, Ticks a ring of radial
 * ticks, Blocks a ring of short segments, Dots a ring of dots. The ring is
 * square and as large as its box allows; the middle's type scales with it.
 */
export function Donut({ parts, total, children, className, label }: { parts: { value: number; color: string; hatch?: boolean }[]; total: number; children?: React.ReactNode; className?: string; /** For screen readers: what the ring shows. */ label?: string }) {
  const style = useChartStyle()
  const still = useShouldReduceMotion()
  const draw = useTempoTransition({ duration: MOTION.draw + 0.2, ease: MOTION.ease })
  const id = useId().replace(/[^a-z0-9]/gi, "")
  const shares = parts.map((p) => Math.max(0, Math.min(1, p.value / (total || 1))))
  const ends = shares.map((_, i) => shares.slice(0, i + 1).reduce((a, b) => a + b, 0))
  // The part a point of the ring (0 to 1, from the top) belongs to, or undefined on the track.
  const partAt = (t: number) => {
    const i = ends.findIndex((e) => t < e - 1e-6)
    return i >= 0 ? parts[i] : undefined
  }
  const pt = (t: number, rad: number) => [r2(50 + Math.sin(t * 2 * Math.PI) * rad), r2(50 - Math.cos(t * 2 * Math.PI) * rad)]
  let ring: React.ReactNode
  if (style === "ticks" || style === "dots" || style === "blocks") {
    // Discrete marks: each one in its part's colour, or the track's.
    const n = style === "ticks" ? 60 : style === "dots" ? 36 : 20
    ring = (
      <motion.g initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={draw}>
        {Array.from({ length: n }, (_, k) => {
          const t = (k + 0.5) / n
          const color = partAt(t)?.color ?? TRACK
          if (style === "dots") {
            const [x, y] = pt(t, 44)
            return <circle key={k} cx={x} cy={y} r={2.6} fill={color} />
          }
          if (style === "ticks") {
            const [x1, y1] = pt(t, 47)
            const [x2, y2] = pt(t, 38)
            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          }
          // Blocks: short arcs with a gap between them.
          const a = k / n + 0.006
          const b = (k + 1) / n - 0.006
          const [x1, y1] = pt(a, 44)
          const [x2, y2] = pt(b, 44)
          return <path key={k} d={`M${x1} ${y1} A44 44 0 0 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={8} />
        })}
      </motion.g>
    )
  } else {
    const thin = style === "thin"
    const w = thin ? 3 : 9 // stroke width, in a 100-unit box
    const rad = 50 - (thin ? 6 : w / 2 + 0.5)
    const c = 2 * Math.PI * rad
    const gap = parts.length > 1 ? 2.2 : 0 // % of the ring between parts
    const last = parts.length - 1
    const tip = pt(ends[last] ?? 0, rad)
    ring = (
      <>
        <defs>
          <pattern id={`h${id}`} width="3.7" height="3.7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" style={{ color: TRACK }}>
            <rect width="1.5" height="3.7" style={{ fill: "currentColor" }} />
          </pattern>
        </defs>
        {/* The rest of the ring: hatched like the empty part of a bar (Solid), or a plain fine line (Thin). */}
        <circle cx="50" cy="50" r={rad} fill="none" stroke={thin ? TRACK : `url(#h${id})`} strokeWidth={w} />
        <g transform="rotate(-90 50 50)">
          {parts.map((p, i) => {
            const share = shares[i]
            // Each part gives up the gap at its end, so parts keep their share and stay apart.
            const len = Math.max(0.01, share * c - (gap / 100) * c)
            if (share <= 0) return null
            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r={rad}
                fill="none"
                stroke={p.hatch ? `url(#h${id})` : p.color}
                strokeWidth={w}
                strokeLinecap={thin ? "round" : "butt"}
                strokeDashoffset={-(ends[i] - share) * c}
                initial={still ? false : { strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${len} ${c}` }}
                transition={{ ...draw, delay: still ? 0 : i * 0.06 }}
              />
            )
          })}
        </g>
        {thin && shares[last] > 0 && <circle cx={tip[0]} cy={tip[1]} r={3.4} fill={parts[last].color} />}
      </>
    )
  }
  return (
    <div role="img" aria-label={label} className={cn("relative aspect-square [container-type:inline-size]", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {ring}
      </svg>
      <div className="absolute inset-[14%] grid place-content-center justify-items-center gap-0.5 text-center">{children}</div>
    </div>
  )
}

/** The figure in a Donut's middle: 20px in a small ring, 28px from a ring of about 11rem. */
export function DonutFigure({ value, caption }: { value: React.ReactNode; caption?: React.ReactNode }) {
  const font = useFigureFont()
  return (
    <>
      <span className="font-heading text-xl leading-7 [font-weight:var(--w-value-weight,500)] tracking-[-0.02em] tabular-nums @[11rem]:text-[1.75rem] @[11rem]:leading-8" style={{ fontFamily: font }}>
        {value}
      </span>
      {caption && <span className="max-w-full truncate text-[0.6875rem] leading-4 text-muted-foreground">{caption}</span>}
    </>
  )
}

/**
 * Rows that explain a ring or a total: the name, its figure, and a thin bar
 * of its share under them (a TickBar, so it follows Bars and gauges). Space between rows, no lines. One row can carry
 * the accent (`on`); the rest are grey, a loss in the loss colour.
 */
export function ShareRows({ rows, className, onFocus }: { rows: { label: React.ReactNode; value: React.ReactNode; share: number; tone?: "accent" | "loss" | "muted"; on?: boolean }[]; className?: string; /** Pointing at a row (undefined when the pointer leaves). */ onFocus?: (i: number | undefined) => void }) {
  const font = useFigureFont()
  return (
    <div className={cn("grid min-w-0 content-center gap-3", className)} onPointerLeave={() => onFocus?.(undefined)}>
      {rows.map((r, i) => {
        const color = r.tone === "loss" ? "var(--loss)" : r.on || r.tone === "accent" ? ACCENT : GREY[1]
        return (
          <div key={i} className="grid min-w-0 gap-1.5" onPointerEnter={() => onFocus?.(i)}>
            <div className="flex min-w-0 items-baseline gap-3 text-[0.8125rem] leading-5">
              <span className={cn("min-w-0 flex-1 truncate", r.on ? "text-foreground" : "text-muted-foreground")}>{r.label}</span>
              <span className="shrink-0 tabular-nums" style={{ fontFamily: font, color: r.tone === "loss" ? "var(--loss-text)" : undefined }}>
                {r.value}
              </span>
            </div>
            {/* The share as a bar in Design → Bars and gauges' style, like every other bar. */}
            <TickBar value={Math.max(0, Math.min(1, r.share)) * 100} segments={30} color={color} height={4} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Body classes for a ring beside its rows: side by side in any cell wider than
 * tall, stacked (ring on top) in a tall narrow one. The ring sizes to the
 * height in a fixed cell. Put on WCard's bodyClassName; the ring gets RING.
 */
// Wide (two or three columns): the ring and its rows stay together in the middle, the rows no longer than they read well.
export const RING_BODY = "flex-row items-center gap-[clamp(1rem,5cqw,2rem)] [@container_card_(max-aspect-ratio:4/5)]:flex-col [@container_card_(max-aspect-ratio:4/5)]:items-stretch [@container_card_(min-width:40rem)]:justify-center [@container_card_(min-width:40rem)]:gap-12 [@container_card_(min-width:40rem)]:*:max-w-[26rem]"
export const RING = "w-[min(42%,11.5rem)] [@container_card_(min-width:40rem)]:w-[13rem] shrink-0 self-center [@container_card_(min-height:0px)]:max-w-[calc(100cqh-7.5rem)] [@container_card_(max-aspect-ratio:4/5)]:w-[min(66%,12rem)]"

/** A segmented bar: segments up to the value in the accent (or a tone), the rest faint. `now` marks one segment taller. */
/** A bar that fills in once, left to right (a clip, so segments and rounded ends keep their shape); still with reduced motion. */
function useFillIn() {
  const still = useShouldReduceMotion()
  const t = useTempoTransition({ duration: MOTION.draw, ease: MOTION.ease })
  return still ? {} : { initial: { clipPath: "inset(0 100% 0 0)" }, animate: { clipPath: "inset(0 0% 0 0)" }, transition: t }
}

export function TickBar({ value, max = 100, segments = 48, color = ACCENT, mark, now, height = 10, className }: { value: number; max?: number; segments?: number; color?: string; mark?: (i: number) => string | undefined; now?: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const fill = useFillIn()
  if (style === "blocks" || style === "dots") return <BlockBar {...{ value, max, segments, color, mark, now, height, className, dots: style === "dots" }} />
  const on = Math.round((Math.min(Math.max(value, 0), max) / max) * segments)
  const h = style === "thin" ? 3 : style === "solid" ? Math.max(6, height - 2) : height
  // Ticks: separate segments. Solid and thin: the same segments joined into one rounded bar.
  return (
    <motion.div {...fill} className={cn("relative flex items-end", style === "ticks" ? "gap-[2px]" : "r-bar overflow-hidden", className)} style={{ height: style === "ticks" ? height + 6 : h }} aria-hidden>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={cn("flex-1", style === "ticks" && "rounded-[1px]")}
          style={{ height: style === "ticks" && now === i ? height + 6 : h, background: style === "ticks" && now === i ? "var(--foreground)" : (mark?.(i) ?? (i < on ? color : TRACK)) }}
        />
      ))}
      {style !== "ticks" && now !== undefined && (
        <span className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${((now + 0.5) / segments) * 100}%` }} />
      )}
    </motion.div>
  )
}

/**
 * TickBar in Blocks (a quarter as many thick rounded blocks, ref. segmented gauges) or Dots (every segment a small
 * square). `mark` and `now` still speak in the caller's segments; blocks take the mark of their first segment.
 */
function BlockBar({ value, max, segments, color, mark, now, height, className, dots }: { value: number; max: number; segments: number; color: string; mark?: (i: number) => string | undefined; now?: number; height: number; className?: string; dots?: boolean }) {
  const n = dots ? segments : Math.max(6, Math.round(segments / 4))
  const k = segments / n
  const on = Math.round((Math.min(Math.max(value, 0), max) / max) * n)
  const nowAt = now === undefined ? undefined : Math.floor(now / k)
  return (
    <div className={cn("relative flex items-center", dots ? "gap-[2px]" : "gap-1", className)} style={{ height: dots ? undefined : height + 6 }} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const m = mark?.(Math.floor(i * k))
        return (
          <span
            key={i}
            className={cn("flex-1", dots ? "aspect-square max-h-2 rounded-[1.5px]" : "r-bar h-full")}
            style={{ background: nowAt === i ? "var(--foreground)" : (m ?? (i < on ? color : TRACK)), ...(dots && nowAt === i ? { transform: "scale(1.35)" } : {}) }}
          />
        )
      })}
    </div>
  )
}

/** Faint solid hairlines across a 300×110 chart: gridlines are never dotted or dashed. */
export function GridLines() {
  return (
    <g aria-hidden>
      {[12, 37, 62, 87].map((y) => (
        <line key={y} x1={0} x2={300} y1={y} y2={y} stroke="color-mix(in oklab, var(--foreground) 9%, transparent)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
}

/**
 * Step lines on hairline gridlines. The first series is the accent with a
 * barely-there tint under it; the others are grey lines. Hover shows the value at a step.
 */
export function StepChart({ series, format = (v) => v.toLocaleString("en"), height = 112, className }: { series: { values: number[]; label?: string; color?: string }[]; format?: (v: number) => string; height?: number; className?: string }) {
  const [hover, setHover] = useState<number>()
  const still = useShouldReduceMotion()
  const draw = useTempoTransition({ duration: MOTION.draw + 0.15, ease: MOTION.ease })
  const all = series.flatMap((s) => s.values)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const n = series[0].values.length
  const x = (i: number) => (i / n) * 300
  const y = (v: number) => 100 - ((v - min) / (max - min || 1)) * 84
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "H" + x(i).toFixed(1) + " V" : "M0 "}${y(v).toFixed(1)}`).join(" ") + ` H300`
  // At rest the marker sits on the latest value (where the series is now); hover moves it.
  const peak = n - 1
  const at = hover ?? peak
  const accent = series[0].color ?? ACCENT
  const keys = (e: React.KeyboardEvent) => {
    const i = hover ?? peak
    const next = e.key === "ArrowRight" ? Math.min(n - 1, i + 1) : e.key === "ArrowLeft" ? Math.max(0, i - 1) : undefined
    if (next === undefined) return
    e.preventDefault()
    setHover(next)
  }
  const left = ((at + 0.5) / n) * 100
  const top = (y(series[0].values[at]) / 110) * 100
  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`${series[0].label ?? "Series"}: ${format(series[0].values[0])} to ${format(series[0].values[n - 1])}`}
      className={cn("relative rounded-[min(var(--radius),6px)] outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-2 focus-visible:ring-offset-(--card)", className)}
      style={{ height }}
      onPointerLeave={() => setHover(undefined)}
      onKeyDown={keys}
      onBlur={() => setHover(undefined)}
    >
      {/* Draws itself in once, left to right (a clip, so the hairline strokes keep their width). */}
      <motion.svg
        viewBox="0 0 300 110"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
        initial={still ? false : { clipPath: "inset(-10% 100% -10% 0)" }}
        animate={{ clipPath: "inset(-10% 0% -10% 0)" }}
        transition={draw}
      >
        <GridLines />
        <AreaFill d={`${path(series[0].values)} V110 H0 Z`} color={accent} />
        {series.slice(1).map((s, i) => (
          <path key={i} d={path(s.values)} fill="none" stroke={s.color ?? GREY[i + 1]} strokeWidth={1.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        ))}
        {hover !== undefined && <line x1={x(at) + 150 / n} x2={x(at) + 150 / n} y1={0} y2={110} stroke="color-mix(in oklab, var(--foreground) 35%, transparent)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        <path d={path(series[0].values)} fill="none" stroke={accent} strokeWidth={1.75} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round" }} />
      </motion.svg>
      <div className="absolute inset-0 flex">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="flex-1" onPointerEnter={() => setHover(i)} />
        ))}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full transition-[left,top] duration-75"
        style={{ left: `${left}%`, top: `${top}%`, background: accent, boxShadow: `0 0 0 2px var(--card), 0 0 0 5px color-mix(in oklab, ${accent} 18%, transparent)` }}
      />
      {/* Hovered: every series at that step. At rest nothing covers the line: the card's headline already says the value. */}
      {hover !== undefined && (
        <span
          role="tooltip"
          className="pointer-events-none absolute z-20 grid gap-0.5 rounded-[min(var(--radius),8px)] border px-2 py-1.5 whitespace-nowrap tabular-nums shadow-[0_6px_20px_-6px_rgb(0_0_0/0.25),0_1px_2px_rgb(0_0_0/0.06)] duration-100 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            transform: `translate(${left < 15 ? "-8%" : left > 85 ? "-92%" : "-50%"}, ${top < 33 ? "10px" : "calc(-100% - 10px)"})`,
            background: "var(--popover)",
            borderColor: "var(--border)",
          }}
        >
          {series.map((s, k) => (
            <span key={k} className="flex items-center gap-1.5 text-xs leading-4">
              <i className="r-chip size-2 shrink-0" style={{ background: k === 0 ? accent : (s.color ?? GREY[k]) }} />
              <span className="text-muted-foreground">{s.label ?? (k === 0 ? "You" : "Compare")}</span>
              <span className="ml-auto pl-3 font-medium">{format(s.values[at])}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

/**
 * Every value as a dot, stacked where they bunch up (a beeswarm). The
 * student's own value is the accent and taller; values above `split` are in
 * the accent tone, the rest grey. Optional `mean` line.
 */
export function DotStrip({ values, me, min, max, split, mean, className }: { values: number[]; me?: number; min?: number; max?: number; split?: number; mean?: number; className?: string }) {
  const lo = min ?? Math.min(...values)
  const hi = max ?? Math.max(...values)
  const bins = 40
  const cols: number[][] = Array.from({ length: bins }, () => [])
  values.forEach((v) => cols[Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins))].push(v))
  const meCol = me !== undefined ? Math.min(bins - 1, Math.floor(((me - lo) / (hi - lo || 1)) * bins)) : -1
  return (
    <div className={cn("relative flex h-20 items-center gap-[2px]", className)} aria-hidden>
      {cols.map((c, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-center gap-[2px]">
          {/* Nine dots (6px + 2px gap) fill the 80px strip; a taller stack would spill over the axis. */}
          {c.slice(0, 9).map((v, k) => (
            <span key={k} className="r-dot aspect-square w-full max-w-[6px]" style={{ background: split !== undefined && v >= split ? ACCENT : GREY[2], opacity: split !== undefined && v >= split ? 1 : 0.85 }} />
          ))}
          {/* You: a solid line through your column with a ringed dot at its head. */}
          {i === meCol && (
            <>
              <span className="absolute inset-y-1 w-px" style={{ left: `${((i + 0.5) / bins) * 100}%`, background: "var(--foreground)" }} />
              <span className="r-dot absolute top-0.5 size-2 -translate-x-1/2" style={{ left: `${((i + 0.5) / bins) * 100}%`, background: "var(--foreground)", boxShadow: "0 0 0 2px var(--card)" }} />
            </>
          )}
        </div>
      ))}
      {mean !== undefined && <span className="absolute inset-y-0 w-px border-l border-dashed border-[color:color-mix(in_oklab,var(--foreground)_35%,transparent)]" style={{ left: `${((mean - lo) / (hi - lo || 1)) * 100}%` }} />}
    </div>
  )
}

/** A stacked bar with a hatched remainder: done | in progress | what's left. */
export function HatchBar({ parts, total, height = 10, className }: { parts: { value: number; color: string }[]; total: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const fill = useFillIn()
  const used = parts.reduce((a, p) => a + p.value, 0)
  const hatch = style === "ticks" || style === "blocks"
  return (
    // Parts side by side with a hairline gap; what's left is hatched, so "used" and "left" read apart without a legend.
    <motion.div {...fill} className={cn("flex", hatch ? "gap-[3px]" : "gap-[2px]", className)} style={{ height: style === "thin" ? 4 : height }} aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="r-bar" style={{ flex: p.value, background: p.color }} />
      ))}
      {total > used && (
        <span
          className="r-bar"
          style={{ flex: total - used, background: `repeating-linear-gradient(135deg, ${TRACK} 0 2px, transparent 2px ${hatch ? 5 : 6}px)`, boxShadow: `inset 0 0 0 1px ${TRACK}` }}
        />
      )}
    </motion.div>
  )
}

/** A list of times with a coloured dot each: schedules, agendas, releases. */
export function Timeline({ items, className }: { items: { time: string; title: React.ReactNode; value?: React.ReactNode; color?: string; strong?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  return (
    <div className={cn("grid gap-3", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-6">
          <span className="r-dot size-[7px] shrink-0" style={{ background: it.color ?? GREY[1] }} />
          <span className="w-10 shrink-0 tabular-nums" style={{ fontFamily: font, color: it.strong ? ink(ACCENT_TEXT) : "var(--muted-foreground)" }}>
            {it.time}
          </span>
          <span className={cn("min-w-0 flex-1 truncate", it.strong && "font-medium")}>{it.title}</span>
          {it.value !== undefined && (
            <span className="shrink-0 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
              {it.value}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** A hairline divider inside a widget body. */
export function Rule({ className }: { className?: string }) {
  // Blocks are set apart by space, not lines: the rule keeps its place in the flow but draws nothing.
  return <hr aria-hidden className={cn("border-0", className)} />
}
