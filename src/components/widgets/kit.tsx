"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Building blocks for dashboard widgets, in a clean, Apple-like style: plain
 * cards, one big number, a compact header, and a chart in the brand colour.
 *
 * Everything follows the coach's theme:
 * - colour: --primary and its tonal ramp (--brand-a/c), series --s1…--s5
 * - geometry: bars, chips, dots and ring ends use --r-bar, --r-chip, --r-dot,
 *   --cap, so a square theme stays square and a pill theme stays round
 * - size: numbers scale with the widget's width (container query units), and
 *   secondary labels drop out when a widget is narrow
 */

export type Tone = "primary" | "profit" | "loss" | "highlight" | "muted" | "fg"
export const TONE: Record<Tone, string> = {
  primary: "var(--primary)",
  profit: "var(--profit)",
  loss: "var(--loss)",
  highlight: "var(--highlight)",
  muted: "color-mix(in oklab, var(--muted-foreground) 30%, transparent)",
  fg: "var(--foreground)",
}
const TEXT: Record<Tone, string> = {
  primary: "text-primary",
  profit: "text-profit",
  loss: "text-loss",
  highlight: "text-foreground",
  muted: "text-muted-foreground",
  fg: "text-foreground",
}

/** Solid fill with, at most, the theme's small tonal shift (none when Effects = Flat). */
export const fill = (tone: Tone | string, dir = "180deg") =>
  tone === "primary" ? `linear-gradient(${dir}, var(--brand-a), var(--brand-c))` : tone in TONE ? TONE[tone as Tone] : tone

/** Series colour by index (courses, event types…): harmonious with the brand. */
export const series = (i: number) => `var(--s${(i % 5) + 1})`

/** The card every widget sits in. */
export function W({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("@container flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-(--radius) bg-card p-[calc(1rem*var(--density,1))] text-card-foreground", className)}
      style={{ boxShadow: "var(--card-shadow)", ...style }}
    >
      {children}
    </div>
  )
}

/** Small label. Uppercase like Apple's widget captions. */
export function Caps({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[0.65rem] leading-none font-medium tracking-wide text-muted-foreground uppercase", className)}>{children}</span>
}

/** Header: icon tile + value + label; the right-hand label hides when the widget is narrow. */
export function Head({
  icon: Icon,
  value,
  unit,
  label,
  right,
  tone = "primary",
}: {
  icon?: LucideIcon
  value?: React.ReactNode
  unit?: string
  label?: string
  right?: React.ReactNode
  tone?: Tone
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 leading-none">
      {Icon && (
        <span className="r-chip grid size-6 shrink-0 place-items-center" style={{ background: `color-mix(in oklab, ${TONE[tone]} 14%, transparent)` }}>
          <Icon className={cn("size-3.5", TEXT[tone])} />
        </span>
      )}
      {value !== undefined && (
        <span className={cn("shrink-0 font-heading text-sm font-semibold tabular-nums", TEXT[tone])}>
          {value}
          {unit && <span className="ml-0.5 text-[0.65rem] font-medium tracking-wide uppercase">{unit}</span>}
        </span>
      )}
      {label && <Caps className={cn("truncate", value === undefined && "text-foreground")}>{label}</Caps>}
      {right && <span className="ml-auto hidden shrink-0 items-center gap-1.5 @[15rem]:flex">{typeof right === "string" ? <Caps>{right}</Caps> : right}</span>}
    </div>
  )
}

/** The one big number. Scales with the widget's width. */
export function Big({ value, unit, sub, tone = "fg", size = "md", fx }: { value: React.ReactNode; unit?: string; sub?: React.ReactNode; tone?: Tone; size?: "md" | "lg"; fx?: boolean }) {
  return (
    <div className="grid min-w-0 gap-1">
      <div
        className="line-clamp-2 font-heading leading-[1.05] font-semibold tracking-tight text-balance tabular-nums"
        style={{ fontSize: size === "lg" ? "clamp(2rem, 17cqi, 3.5rem)" : "clamp(1.6rem, 12cqi, 2.6rem)" }}
      >
        <span className={cn(fx ? "text-primary" : TEXT[tone])}>{value}</span>
        {unit && <span className="ml-1 text-[0.4em] font-medium tracking-normal text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="truncate text-xs text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  )
}

/** Vertical bars. With `diverging`, bars grow up (profit) and down (loss) from a zero line. */
export function Bars({
  values,
  labels,
  diverging,
  tone = "primary",
  active,
  className,
}: {
  values: number[]
  labels?: string[]
  diverging?: boolean
  tone?: Tone
  active?: number
  className?: string
}) {
  const max = Math.max(...values.map(Math.abs), 1)
  return (
    <div className={cn("flex min-h-12 flex-1 flex-col gap-1.5", className)}>
      <div className="relative flex flex-1 items-stretch gap-[min(6%,6px)]">
        {diverging && <span className="absolute inset-x-0 top-1/2 h-px bg-border" />}
        {values.map((v, i) => {
          const pct = (Math.abs(v) / max) * (diverging ? 50 : 100)
          const up = v >= 0
          const color = diverging ? TONE[up ? "profit" : "loss"] : fill(tone)
          const dim = !diverging && active !== undefined && i !== active
          return (
            <div key={i} className="relative flex-1">
              <span
                className="r-bar absolute inset-x-0"
                style={{
                  background: color,
                  opacity: dim ? 0.35 : 1,
                  height: `${Math.max(pct, v === 0 ? 0 : 3)}%`,
                  ...(diverging ? (up ? { bottom: "50%" } : { top: "50%" }) : { bottom: 0 }),
                }}
              />
            </div>
          )
        })}
      </div>
      {labels && (
        <div className="flex gap-[min(6%,6px)]">
          {labels.map((l, i) => (
            <Caps key={i} className={cn("flex-1 text-center", i === active && "text-foreground")}>
              {l}
            </Caps>
          ))}
        </div>
      )}
    </div>
  )
}

/** A clean line with a dot on the latest value. */
export function Spark({ values, tone = "primary", className, invert }: { values: number[]; tone?: Tone; className?: string; invert?: boolean }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = invert ? ((v - min) / span) * 88 + 6 : 94 - ((v - min) / span) * 88
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
  const [lx, ly] = pts[pts.length - 1]
  return (
    <div className={cn("relative min-h-10 flex-1", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {[25, 50, 75].map((y) => (
          <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeDasharray="2 3" />
        ))}
        <path d={line} fill="none" stroke={TONE[tone]} strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round", strokeLinecap: "var(--cap)" as never }} />
      </svg>
      <span className="r-dot absolute size-2.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${lx}%`, top: `${ly}%`, background: TONE[tone], boxShadow: "0 0 0 2px var(--card)" }} />
    </div>
  )
}

/** Squares shaded by intensity: profit and loss. Stretches to fill. */
export function Heat({ rows, labels, className }: { rows: number[][]; labels?: string[]; className?: string }) {
  const max = Math.max(...rows.flat().map(Math.abs), 1)
  const cols = { gridTemplateColumns: `repeat(${rows[0].length}, minmax(0,1fr))` }
  return (
    <div className={cn("flex min-h-16 flex-1 flex-col gap-1", className)}>
      {labels && (
        <div className="grid gap-1" style={cols}>
          {labels.map((l, i) => (
            <Caps key={i} className="text-center">
              {l}
            </Caps>
          ))}
        </div>
      )}
      {rows.map((r, ri) => (
        <div key={ri} className="grid min-h-2 flex-1 gap-1" style={cols}>
          {r.map((v, ci) => {
            // Four steps of intensity, like a contribution graph.
            const step = v === 0 ? 0 : Math.ceil((Math.abs(v) / max) * 4)
            return (
              <span
                key={ci}
                title={v ? `${v > 0 ? "+" : "−"}€${Math.abs(v)}` : "No trades"}
                className="r-bar"
                style={{ background: v === 0 ? "var(--muted)" : `color-mix(in oklab, ${v > 0 ? TONE.profit : TONE.loss} ${25 + step * 18}%, var(--muted))` }}
              />
            )
          })}
        </div>
      ))}
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
        <span key={i} title={p.label} className="r-bar" style={{ flex: p.w, background: p.brand ? fill("primary") : p.color }} />
      ))}
    </div>
  )
}

/** A progress track. */
export function Track({ value, color = fill("primary"), className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn("r-bar h-1.5 overflow-hidden bg-muted", className)}>
      <div className="r-bar h-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

/** Circular progress. Line ends follow the theme (round or square). */
export function Ring({ value, size = 64, stroke = 7, tone = "primary", children, className }: { value: number; size?: number; stroke?: number; tone?: Tone; children?: React.ReactNode; className?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone]}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(value, 100) / 100)}
          style={{ strokeLinecap: "var(--cap)" as never }}
        />
      </svg>
      <span className="absolute text-center leading-none">{children}</span>
    </div>
  )
}

/** Spider chart, 0–100 per axis. Labels hide when the widget is small. */
export function Radar({ axes, className }: { axes: { label: string; v: number }[]; className?: string }) {
  const n = axes.length
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as const
  }
  const poly = (r: (i: number) => number) => axes.map((_, i) => pt(i, r(i)).join(",")).join(" ")
  return (
    <svg viewBox="-14 -8 128 116" className={cn("size-full min-h-24", className)} aria-label="Discipline by area">
      {[0.5, 1].map((k) => (
        <polygon key={k} points={poly(() => 40 * k)} fill="none" stroke="var(--border)" strokeWidth={0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 40)
        return <line key={i} x1={50} y1={50} x2={x} y2={y} stroke="var(--border)" strokeWidth={0.6} />
      })}
      <polygon points={poly((i) => (40 * axes[i].v) / 100)} fill="var(--primary)" fillOpacity={0.16} stroke="var(--primary)" strokeWidth={1.4} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, (40 * a.v) / 100)
        const [lx, ly] = pt(i, 50)
        return (
          <g key={a.label}>
            <circle cx={x} cy={y} r={1.8} fill="var(--primary)" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="var(--muted-foreground)" fontWeight={500}>
              {a.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** A day timeline with event blocks and a "now" line. Hours as decimals. */
export function DayTimeline({ from, to, now, events }: { from: number; to: number; now: number; events: { title: string; start: number; end: number; color: string }[] }) {
  const pos = (h: number) => `${((h - from) / (to - from)) * 100}%`
  const ticks = Array.from({ length: Math.floor(to - from) + 1 }, (_, i) => from + i)
  return (
    <div className="relative flex min-h-20 flex-1 flex-col">
      <div className="relative flex-1">
        {ticks.map((t) => (
          <span key={t} className="absolute top-0 bottom-0 w-px bg-border" style={{ left: pos(t) }} />
        ))}
        {events.map((e, i) => (
          <span
            key={e.title}
            className="r-chip absolute truncate px-1.5 py-1 text-[0.65rem] leading-tight font-medium text-white"
            style={{ left: pos(e.start), width: `calc(${pos(e.end)} - ${pos(e.start)})`, top: `${8 + (i % 3) * 30}%`, background: e.color }}
            title={e.title}
          >
            {e.title}
          </span>
        ))}
        <span className="absolute top-0 bottom-0 w-0.5 bg-loss" style={{ left: pos(now) }}>
          <span className="r-dot absolute -top-1 -left-[3px] size-2 bg-loss" />
        </span>
      </div>
      <div className="relative mt-1.5 h-3">
        {ticks
          .filter((t) => (t - from) % 2 === 0)
          .map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>
              <Caps>{String(t).padStart(2, "0")}</Caps>
            </span>
          ))}
      </div>
    </div>
  )
}

/** Legend dot + label. */
export function Key({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <i className="r-dot size-2 shrink-0" style={{ background: color }} /> {children}
    </span>
  )
}

/** Kept for widgets that fill horizontal bars. */
export const gradientFill = (tone: Tone | string) => fill(tone, "90deg")
