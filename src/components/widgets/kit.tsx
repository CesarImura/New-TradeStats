"use client"

import { useId } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Building blocks for dashboard widgets: one big number, a compact header,
 * and a chart that fills the card. Colours come from the coach's brand ramp
 * (--brand-a → --brand-b → --brand-c) and series palette (--s1…--s5), so
 * gradients and glows always match the brand. With Effects = Flat the ramp
 * collapses to the plain brand colour.
 */

export type Tone = "primary" | "profit" | "loss" | "highlight" | "muted" | "fg"
export const TONE: Record<Tone, string> = {
  primary: "var(--primary)",
  profit: "var(--profit)",
  loss: "var(--loss)",
  highlight: "var(--highlight)",
  muted: "color-mix(in oklab, var(--muted-foreground) 35%, transparent)",
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

/** Lighter and deeper versions of a tone, for gradients that stay in the same family. */
const light = (c: string) => `color-mix(in oklab, ${c} 78%, white)`
const deep = (c: string) => `color-mix(in oklab, ${c} 82%, black)`
/** Brand tone uses the brand ramp; other tones get a gentle same-colour gradient. */
const ends = (tone: Tone) => (tone === "primary" ? ["var(--brand-a)", "var(--brand-c)"] : [light(TONE[tone]), deep(TONE[tone])])

/** Series colour by index (courses, event types…): harmonious with the brand. */
export const series = (i: number) => `var(--s${(i % 5) + 1})`

/**
 * The card every widget sits in. `accent` washes a little of that colour into
 * the top-left corner, so each widget carries its own tint of the brand.
 */
export function W({ children, className, style, accent = TONE.primary }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; accent?: string }) {
  return (
    <div
      className={cn("@container flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-(--radius) bg-card p-[calc(1rem*var(--density,1))] text-card-foreground", className)}
      style={{
        boxShadow: "var(--card-shadow)",
        backgroundImage: `radial-gradient(130% 100% at 0% 0%, color-mix(in oklab, ${accent} var(--wash, 0%), transparent), transparent 70%)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Small uppercase label. */
export function Caps({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[0.65rem] leading-none font-semibold tracking-wider text-muted-foreground uppercase", className)}>{children}</span>
}

/** Header row: coloured icon + value on the left, a short label on the right. */
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
    <div className="flex items-center gap-2 leading-none">
      {Icon && (
        <span
          className="grid size-6 shrink-0 place-items-center rounded-[min(var(--radius),7px)]"
          style={{ background: `color-mix(in oklab, ${TONE[tone]} 16%, transparent)` }}
        >
          <Icon className={cn("size-3.5", TEXT[tone])} />
        </span>
      )}
      {value !== undefined && (
        <span className={cn("font-heading text-base font-semibold tabular-nums", TEXT[tone])}>
          {value}
          {unit && <span className="ml-0.5 text-[0.65rem] font-semibold tracking-wider uppercase">{unit}</span>}
        </span>
      )}
      {label && <Caps className={cn(value === undefined && "text-foreground")}>{label}</Caps>}
      {right && <span className="ml-auto flex items-center gap-1.5">{typeof right === "string" ? <Caps>{right}</Caps> : right}</span>}
    </div>
  )
}

/** The one big number. `fx` paints it in the brand gradient. */
export function Big({ value, unit, sub, tone = "fg", size = "md", fx }: { value: React.ReactNode; unit?: string; sub?: React.ReactNode; tone?: Tone; size?: "md" | "lg"; fx?: boolean }) {
  return (
    <div className="grid gap-1">
      <div className={cn("font-heading leading-none font-semibold tracking-tight tabular-nums", size === "lg" ? "text-5xl" : "text-4xl")}>
        <span className={cn(fx ? "fx-text" : TEXT[tone])}>{value}</span>
        {unit && <span className="ml-1 text-base font-medium tracking-normal text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  )
}

/** Vertical bars with gradient fills. With `diverging`, bars grow up (profit) and down (loss) from a zero line. */
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
  const [a, c] = ends(tone)
  return (
    <div className={cn("flex min-h-12 flex-1 flex-col gap-1.5", className)}>
      <div className="relative flex flex-1 items-stretch gap-[6%]">
        {diverging && <span className="absolute inset-x-0 top-1/2 h-px bg-border" />}
        {values.map((v, i) => {
          const pct = (Math.abs(v) / max) * (diverging ? 50 : 100)
          const up = v >= 0
          const base = diverging ? TONE[up ? "profit" : "loss"] : undefined
          const fill = diverging
            ? `linear-gradient(${up ? "to top" : "to bottom"}, ${deep(base!)}, ${light(base!)})`
            : i === active
              ? `linear-gradient(to top, ${c}, ${a})`
              : `linear-gradient(to top, color-mix(in oklab, ${c} 30%, transparent), color-mix(in oklab, ${a} 55%, transparent))`
          return (
            <div key={i} className="relative flex-1">
              <span
                className={cn("absolute inset-x-0 rounded-[3px]", i === active && "fx-glow")}
                style={
                  diverging
                    ? { background: fill, height: `${Math.max(pct, v === 0 ? 0 : 2)}%`, ...(up ? { bottom: "50%" } : { top: "50%" }) }
                    : { background: fill, height: `${Math.max(pct, 3)}%`, bottom: 0 }
                }
              />
            </div>
          )
        })}
      </div>
      {labels && (
        <div className="flex gap-[6%]">
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

/** A line in a gradient over a tinted area, with a glowing dot on the latest value. */
export function Spark({ values, tone = "primary", area = true, className, invert }: { values: number[]; tone?: Tone; area?: boolean; className?: string; invert?: boolean }) {
  const id = useId().replace(/:/g, "")
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = invert ? ((v - min) / span) * 90 + 5 : 95 - ((v - min) / span) * 90
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
  const [lx, ly] = pts[pts.length - 1]
  const [a, c] = ends(tone)
  return (
    <div className={cn("relative min-h-10 flex-1", className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`l${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={c} />
            <stop offset="1" stopColor={a} />
          </linearGradient>
          <linearGradient id={`f${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={a} stopOpacity={0.35} />
            <stop offset="1" stopColor={c} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {area && <path d={`${line} L100,100 L0,100 Z`} fill={`url(#f${id})`} />}
        <path d={line} fill="none" stroke={`url(#l${id})`} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${lx}%`, top: `${ly}%`, background: a, boxShadow: `0 0 0 3px var(--card), 0 0 0 5px color-mix(in oklab, ${a} 35%, transparent), 0 0 14px var(--glow)` }}
      />
    </div>
  )
}

/** Rounded squares coloured by intensity; positive and negative values use profit and loss. Stretches to fill. */
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
            const k = Math.abs(v) / max
            const base = v > 0 ? TONE.profit : TONE.loss
            return (
              <span
                key={ci}
                title={v ? `${v > 0 ? "+" : "−"}€${Math.abs(v)}` : "No trades"}
                className="rounded-[min(var(--radius),5px)]"
                style={
                  v === 0
                    ? { background: "var(--muted)" }
                    : {
                        background: `linear-gradient(160deg, color-mix(in oklab, ${light(base)} ${35 + k * 65}%, var(--muted)), color-mix(in oklab, ${base} ${30 + k * 70}%, var(--muted)))`,
                        boxShadow: k > 0.75 ? `0 0 12px -2px ${base}` : undefined,
                      }
                }
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
        <span
          key={i}
          className="aspect-square rounded-[30%]"
          style={c === "var(--muted)" ? { background: c } : { background: `linear-gradient(150deg, ${light(c)}, ${c})`, boxShadow: `0 0 8px -3px ${c}` }}
        />
      ))}
    </div>
  )
}

/**
 * A horizontal bar made of segments. Brand-coloured segments share one
 * continuous gradient, so the filled part reads as a single sweep.
 */
export function Segments({ parts, className }: { parts: { w: number; color: string; brand?: boolean; label?: string }[]; className?: string }) {
  const total = parts.reduce((n, p) => n + p.w, 0)
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((n, p) => n + p.w, 0))
  return (
    <div className={cn("flex min-h-8 flex-1 gap-1", className)}>
      {parts.map((p, i) => {
        const start = starts[i]
        const size = (total / p.w) * 100
        const pos = p.w === total ? 0 : (start / (total - p.w)) * 100
        return (
          <span
            key={i}
            title={p.label}
            className="rounded-[min(var(--radius),6px)]"
            style={p.brand ? { flex: p.w, backgroundImage: "var(--brand-grad-h)", backgroundSize: `${size}% 100%`, backgroundPosition: `${pos}% 0` } : { flex: p.w, background: p.color }}
          />
        )
      })}
    </div>
  )
}

/** Circular progress in a gradient, with a glow. */
export function Ring({ value, size = 64, stroke = 7, tone = "primary", children, className }: { value: number; size?: number; stroke?: number; tone?: Tone; children?: React.ReactNode; className?: string }) {
  const id = useId().replace(/:/g, "")
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [a, d] = ends(tone)
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible" aria-hidden style={{ filter: "drop-shadow(0 0 6px var(--glow))" }}>
        <defs>
          <linearGradient id={`r${id}`} x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor={d} />
            <stop offset="1" stopColor={a} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#r${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(value, 100) / 100)} />
      </svg>
      <span className="absolute text-center leading-none">{children}</span>
    </div>
  )
}

/** Spider chart, 0–100 per axis, filled with the brand gradient. */
export function Radar({ axes, className }: { axes: { label: string; v: number }[]; className?: string }) {
  const id = useId().replace(/:/g, "")
  const n = axes.length
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as const
  }
  const poly = (r: (i: number) => number) => axes.map((_, i) => pt(i, r(i)).join(",")).join(" ")
  return (
    <svg viewBox="-14 -8 128 116" className={cn("size-full min-h-24 overflow-visible", className)} aria-label="Discipline by area">
      <defs>
        <radialGradient id={`g${id}`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="var(--brand-c)" stopOpacity={0.15} />
          <stop offset="1" stopColor="var(--brand-a)" stopOpacity={0.5} />
        </radialGradient>
        <linearGradient id={`s${id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--brand-a)" />
          <stop offset="1" stopColor="var(--brand-c)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={poly(() => 40 * k)} fill="none" stroke="var(--border)" strokeWidth={0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 40)
        return <line key={i} x1={50} y1={50} x2={x} y2={y} stroke="var(--border)" strokeWidth={0.6} />
      })}
      <polygon points={poly((i) => (40 * axes[i].v) / 100)} fill={`url(#g${id})`} stroke={`url(#s${id})`} strokeWidth={1.6} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 4px var(--glow))" }} />
      {axes.map((a, i) => {
        const [x, y] = pt(i, (40 * a.v) / 100)
        const [lx, ly] = pt(i, 50)
        return (
          <g key={a.label}>
            <circle cx={x} cy={y} r={2.2} fill="var(--brand-a)" stroke="var(--card)" strokeWidth={0.8} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="var(--muted-foreground)" fontWeight={600}>
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
            className="absolute truncate rounded-[min(var(--radius),6px)] px-1.5 py-1 text-[0.65rem] leading-tight font-semibold text-white"
            style={{
              left: pos(e.start),
              width: `calc(${pos(e.end)} - ${pos(e.start)})`,
              top: `${8 + (i % 3) * 30}%`,
              background: `linear-gradient(135deg, ${light(e.color)}, ${deep(e.color)})`,
              boxShadow: `0 4px 14px -6px ${e.color}`,
            }}
            title={e.title}
          >
            {e.title}
          </span>
        ))}
        <span className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{ left: pos(now) }}>
          <span className="absolute -top-1 -left-[3px] size-2 rotate-45 bg-foreground" />
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

/** Fill a bar in a tone's gradient (brand ramp for primary). */
export const gradientFill = (tone: Tone | string) => {
  if (tone in TONE) {
    const [a, c] = ends(tone as Tone)
    return `linear-gradient(90deg, ${c}, ${a})`
  }
  return `linear-gradient(90deg, ${deep(tone)}, ${light(tone)})`
}
