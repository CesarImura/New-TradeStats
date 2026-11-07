"use client"

import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { motion } from "motion/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Tip } from "./bits"
import { Caps } from "./card"
import { ACCENT, AreaFill, MOTION, TONE, type Tone, fill, pl } from "./tokens"

// Small charts for widgets: Bars, Spark, Heat, Dots, Segments, Track, Ring and their Key.

const num = (v: number) => v.toLocaleString("en")

/**
 * ← → step through a chart's points (or bars) with the keyboard; the chart
 * shows the same label as on hover. Home/End jump to the ends.
 */
function useStepKeys(n: number, set: (i: number | undefined) => void, at: number | undefined, from: number) {
  return (e: React.KeyboardEvent) => {
    const i = at ?? from
    const next = e.key === "ArrowRight" ? Math.min(n - 1, i + 1) : e.key === "ArrowLeft" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : undefined
    if (next === undefined) return
    e.preventDefault()
    set(next)
  }
}
const FOCUS_CHART = "outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-2 focus-visible:ring-offset-(--card) rounded-[min(var(--radius),6px)]"

/**
 * Vertical bars. With `diverging`, bars grow up (profit) and down (loss) from
 * a dashed zero line. Bars keep a slim, steady width (never slabs) and sit on
 * a hairline baseline; they rise into place once, and the hovered (or
 * keyboard-selected) bar gets a column highlight and a label.
 */
export function Bars({
  values,
  labels,
  diverging,
  tone = "primary",
  active,
  format = num,
  tips,
  className,
}: {
  values: number[]
  labels?: string[]
  diverging?: boolean
  tone?: Tone
  active?: number
  /** Formats the value in the hover label. */
  format?: (v: number) => string
  /** Longer names for the hover label, e.g. "Monday" where the axis says "M". */
  tips?: string[]
  className?: string
}) {
  const [hover, setHover] = useState<number>()
  const still = useShouldReduceMotion()
  const grow = useTempoTransition({ duration: MOTION.draw, ease: MOTION.ease })
  const max = Math.max(...values.map(Math.abs), 1)
  // One accent: the active bar (by default the latest); the rest stay neutral.
  const current = active ?? values.length - 1
  const lit = hover ?? current
  const keys = useStepKeys(values.length, setHover, hover, current)
  const colorOf = (v: number, i: number) => (diverging ? pl(v, hover === undefined || hover === i ? 78 : 45) : i === lit ? fill(tone) : TONE.muted)
  return (
    <div className={cn("flex min-h-12 flex-1 flex-col gap-1.5", className)}>
      <div
        tabIndex={0}
        role="img"
        aria-label={`${values.length} bars, from ${format(Math.min(...values))} to ${format(Math.max(...values))}`}
        onKeyDown={keys}
        onBlur={() => setHover(undefined)}
        className={cn("relative flex flex-1 items-stretch", FOCUS_CHART)}
        onPointerLeave={() => setHover(undefined)}
      >
        {diverging ? (
          <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed" style={{ borderColor: "color-mix(in oklab, var(--foreground) 22%, transparent)" }} />
        ) : null}
        {values.map((v, i) => {
          const pct = (Math.abs(v) / max) * (diverging ? 50 : 100)
          const h = Math.max(pct, v === 0 ? 0 : 3)
          const up = v >= 0
          return (
            <div key={i} className="relative flex flex-1 justify-center" onPointerEnter={() => setHover(i)}>
              {hover === i && <span aria-hidden className="absolute inset-y-0 inset-x-[8%] rounded-[min(var(--radius),6px)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)]" />}
              {/* A ghost track to the top: the bar reads against its full height, with no baseline or grid. */}
              {!diverging && <span aria-hidden className="r-bar absolute inset-y-0 w-[min(62%,1.125rem)] [@container_card_(min-width:34rem)]:w-[min(62%,2rem)] [@container_card_(min-width:56rem)]:w-[min(62%,2.75rem)]" style={{ background: "color-mix(in oklab, var(--foreground) 5%, transparent)" }} />}
              <motion.span
                aria-hidden
                className="r-bar absolute w-[min(62%,1.125rem)] [@container_card_(min-width:34rem)]:w-[min(62%,2rem)] [@container_card_(min-width:56rem)]:w-[min(62%,2.75rem)] transition-[background-color] duration-150"
                style={{
                  background: colorOf(v, i),
                  height: `${h}%`,
                  transformOrigin: diverging ? (up ? "bottom" : "top") : "bottom",
                  ...(diverging ? (up ? { bottom: "50%" } : { top: "50%" }) : { bottom: 0 }),
                }}
                initial={still ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                // A short stagger (left to right, capped) so the series reads as one gesture, never a wait.
                transition={{ ...grow, delay: Math.min(i * 0.015, 0.18) }}
              />
            </div>
          )
        })}
        {hover !== undefined && (
          <Tip
            x={((hover + 0.5) / values.length) * 100}
            y={(() => {
              const pct = (Math.abs(values[hover]) / max) * (diverging ? 50 : 100)
              return diverging ? (values[hover] >= 0 ? 50 - pct : 50) : 100 - pct
            })()}
            label={tips?.[hover] ?? labels?.[hover]}
            value={format(values[hover])}
            color={diverging ? (values[hover] >= 0 ? "var(--profit)" : "var(--loss)") : fill(tone)}
          />
        )}
      </div>
      {labels && (
        <div className="flex" aria-hidden>
          {labels.map((l, i) => (
            <Caps key={i} className={cn("flex-1 text-center tabular-nums transition-colors duration-150", i === lit ? "text-foreground" : "")}>
              {l}
            </Caps>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * A line (trace) on three dashed hairlines, with a faint area under it and a
 * ringed dot on the latest value. It draws itself in once; hover or ← → move
 * a dashed crosshair and a label along it.
 */
export function Spark({
  values,
  tone = "primary",
  className,
  invert,
  format = num,
  tip,
  area = tone === "primary",
  grid = true,
}: {
  values: number[]
  tone?: Tone
  className?: string
  invert?: boolean
  /** Formats the value in the hover label. */
  format?: (v: number) => string
  /** Names a point in the hover label, e.g. "Day 4". */
  tip?: (i: number) => string
  /** The faint fill under the line (on by default for the accent). */
  area?: boolean
  /** The dashed hairlines behind it; off for a small trace inside a tile, where they'd be noise. */
  grid?: boolean
}) {
  const [hover, setHover] = useState<number>()
  const still = useShouldReduceMotion()
  const draw = useTempoTransition({ duration: MOTION.draw + 0.1, ease: MOTION.ease })
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = invert ? ((v - min) / span) * 84 + 8 : 92 - ((v - min) / span) * 84
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
  const last = pts.length - 1
  const [lx, ly] = pts[hover ?? last]
  const keys = useStepKeys(values.length, setHover, hover, last)
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const t = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    setHover(Math.round(t * (values.length - 1)))
  }
  const color = TONE[tone]
  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`Trend from ${format(values[0])} to ${format(values[last])}`}
      className={cn("relative min-h-10 flex-1 touch-none", FOCUS_CHART, className)}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(undefined)}
      onKeyDown={keys}
      onBlur={() => setHover(undefined)}
    >
      {/* It draws itself in once, left to right (a clip, so the hairline stroke keeps its width). */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
        initial={still ? false : { clipPath: "inset(-10% 100% -10% 0)" }}
        animate={{ clipPath: "inset(-10% 0% -10% 0)" }}
        transition={draw}
      >
        {grid &&
          [20, 50, 80].map((y) => (
            <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="color-mix(in oklab, var(--foreground) 9%, transparent)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ))}
        {area && <AreaFill d={`${line} L100,100 L0,100 Z`} color={color} />}
        {hover !== undefined && <line x1={lx} x2={lx} y1={0} y2={100} stroke="color-mix(in oklab, var(--foreground) 35%, transparent)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round", strokeLinecap: "round" }} />
      </motion.svg>
      {/* The latest value (or the hovered one): a dot ringed in the card colour, with a soft halo. */}
      <span
        aria-hidden
        className="r-dot absolute size-2 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-75"
        style={{ left: `${lx}%`, top: `${ly}%`, background: color, boxShadow: `0 0 0 2px var(--card), 0 0 0 5px color-mix(in oklab, ${color} 18%, transparent)` }}
      />
      {hover !== undefined && <Tip x={lx} y={ly} label={tip?.(hover)} value={format(values[hover])} color={color} />}
    </div>
  )
}

/**
 * Squares shaded by intensity (profit and loss, four steps each way, like a
 * contribution graph), with a small "loss · profit" key. Cells keep a calm,
 * near-square shape at rest (at least 1.25rem tall) and stretch with the
 * card. Hover dims the others and rings the cell; its row and column labels
 * light up.
 */
export function Heat({ rows, labels, rowLabels, className }: { rows: number[][]; labels?: string[]; /** One per row, at its start ("Wk 1"). */ rowLabels?: string[]; className?: string }) {
  const [hover, setHover] = useState<[number, number]>()
  const max = Math.max(...rows.flat().map(Math.abs), 1)
  const tint = (v: number) => (v === 0 ? "var(--muted)" : `color-mix(in oklab, ${v > 0 ? TONE.profit : TONE.loss} ${10 + Math.ceil((Math.abs(v) / max) * 4) * 11}%, var(--card))`)
  // One fixed label column for every row (and the head), so the cells line up whatever the label's width.
  const cols = { gridTemplateColumns: `${rowLabels ? "2.25rem " : ""}repeat(${rows[0].length}, minmax(0,1fr))` }
  return (
    <div className={cn("flex min-h-16 flex-1 flex-col gap-[3px]", className)} onPointerLeave={() => setHover(undefined)}>
      {labels && (
        <div className="grid gap-[3px]" style={cols} aria-hidden>
          {rowLabels && <span />}
          {labels.map((l, i) => (
            <Caps key={i} className={cn("pb-0.5 text-center transition-colors duration-150", hover?.[1] === i && "text-foreground")}>
              {l}
            </Caps>
          ))}
        </div>
      )}
      {rows.map((r, ri) => (
        <div key={ri} className="grid min-h-5 flex-1 gap-[3px]" style={cols}>
          {rowLabels && <Caps className={cn("self-center pr-1.5 transition-colors duration-150", hover?.[0] === ri && "text-foreground")}>{rowLabels[ri]}</Caps>}
          {r.map((v, ci) => {
            const on = hover?.[0] === ri && hover?.[1] === ci
            return (
              <span
                key={ci}
                onPointerEnter={() => setHover([ri, ci])}
                className={cn("relative rounded-[min(var(--radius),4px)] transition-[opacity,box-shadow] duration-150", hover && !on && "opacity-45")}
                style={{ background: tint(v), boxShadow: on ? "0 0 0 1.5px var(--card), 0 0 0 3px var(--foreground)" : undefined }}
              >
                {on && (
                  <Tip
                    x={50}
                    y={ri === 0 ? 100 : 0}
                    place={ri === 0 ? "below" : "above"}
                    label={`${rowLabels?.[ri] ?? `Wk ${ri + 1}`}${labels ? ` · ${labels[ci]}` : ""}`}
                    value={v ? `${v > 0 ? "+" : "−"}€${Math.abs(v)}` : "No trades"}
                    color={v ? (v > 0 ? "var(--profit)" : "var(--loss)") : undefined}
                  />
                )}
              </span>
            )
          })}
        </div>
      ))}
      {/* The key: what the shades mean, small and out of the way. */}
      <div className="mt-1 flex items-center justify-end gap-1.5 text-[0.6875rem] leading-4 text-muted-foreground" aria-hidden>
        Loss
        {[4, 2].map((k) => (
          <i key={`l${k}`} className="size-2.5 rounded-[2px]" style={{ background: tint(-(k / 4) * max) }} />
        ))}
        <i className="size-2.5 rounded-[2px]" style={{ background: "var(--muted)" }} />
        {[2, 4].map((k) => (
          <i key={`p${k}`} className="size-2.5 rounded-[2px]" style={{ background: tint((k / 4) * max) }} />
        ))}
        Profit
      </div>
    </div>
  )
}

/** A grid of dots split into coloured groups, e.g. lessons per course. */
export function Dots({ groups, total, cols = 14, className }: { groups: { n: number; color: string }[]; total: number; cols?: number; className?: string }) {
  const dots: string[] = []
  groups.forEach((g) => dots.push(...Array(g.n).fill(g.color)))
  while (dots.length < total) dots.push("var(--muted)")
  return (
    <div className={cn("grid content-end gap-1", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {dots.map((c, i) => (
        <span key={i} className="r-dot aspect-square" style={{ background: c }} />
      ))}
    </div>
  )
}

/** A horizontal bar made of segments, e.g. lessons in a module. */
export function Segments({ parts, className }: { parts: { w: number; color: string; brand?: boolean; label?: string }[]; className?: string }) {
  return (
    <div className={cn("flex min-h-2 gap-1", className)}>
      {parts.map((p, i) => (
        <span key={i} title={p.label} className="r-bar" style={{ flex: p.w, background: p.brand ? ACCENT : p.color }} />
      ))}
    </div>
  )
}

/** A progress track. */
export function Track({ value, color = fill("primary"), className }: { value: number; color?: string; className?: string }) {
  const still = useShouldReduceMotion()
  const fillIn = useTempoTransition({ duration: MOTION.draw, ease: MOTION.ease })
  return (
    <div className={cn("r-bar h-1 overflow-hidden bg-muted", className)}>
      {/* Fills from the left once (a transform, not width), then follows the value. */}
      <motion.div className="r-bar h-full origin-left" style={{ width: `${Math.min(100, value)}%`, background: color }} initial={still ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={fillIn} />
    </div>
  )
}

/** Circular progress. Line ends follow the theme (round or square). */
export function Ring({ value, size = 56, stroke = 4, tone = "primary", fluid, children, className }: { value: number; size?: number; stroke?: number; tone?: Tone; /** Sized by className (it scales with the card) instead of `size` px; `size` then only sets the stroke's proportion. */ fluid?: boolean; children?: React.ReactNode; className?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const still = useShouldReduceMotion()
  const fillIn = useTempoTransition({ duration: MOTION.draw + 0.15, ease: MOTION.ease })
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={fluid ? undefined : { width: size, height: size }}>
      <svg width={fluid ? undefined : size} height={fluid ? undefined : size} viewBox={`0 0 ${size} ${size}`} className={cn("-rotate-90", fluid && "size-full")} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        {/* The arc fills to its value once, then moves smoothly when the value changes. */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone]}
          strokeWidth={stroke}
          strokeDasharray={c}
          initial={still ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(value, 100) / 100) }}
          transition={fillIn}
          style={{ strokeLinecap: "var(--cap)" as never }}
        />
      </svg>
      <span className="absolute text-center leading-none">{children}</span>
    </div>
  )
}

/** Legend dot + label. */
export function Key({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
      <i className="r-dot size-2 shrink-0" style={{ background: color }} /> {children}
    </span>
  )
}
