"use client"

import { createContext, useContext, useState } from "react"
import type { LucideIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * Building blocks for dashboard widgets. Quiet by default, one star per page.
 *
 * The system decides, the coach can't break it:
 * - Type: five sizes only (TYPE). Label 11px, text 13px, number 20px, large
 *   number 28px, and 40px only on the page's star widget.
 * - Colour budget: cards are neutral. The accent (the coach's colour, or the
 *   text colour when a widget is Quiet) marks ONE thing per widget: the
 *   current bar, the latest point, the progress fill, the button. Profit and
 *   loss are text and thin marks, never big blocks. Series are shades of one
 *   hue, not a rainbow. No gradients.
 * - Charts: hairlines, faint gridlines, a dot on the latest value.
 * - Geometry still follows the theme: --r-bar, --r-chip, --r-dot, --cap.
 *
 * The coach decides, per widget (WidgetFrame): Emphasis (Quiet, Accent, Star)
 * and Detail (Compact, Standard, Detailed). Read them with useFrame().
 */

export type Emphasis = "quiet" | "accent" | "star"
export type Detail = "compact" | "standard" | "detailed"
const FrameCtx = createContext<{ emphasis: Emphasis; detail: Detail }>({ emphasis: "accent", detail: "standard" })

/** Wraps one placed widget with its Emphasis and Detail. */
export function WidgetFrame({ emphasis = "accent", detail = "standard", children }: { emphasis?: Emphasis; detail?: Detail; children: React.ReactNode }) {
  return <FrameCtx.Provider value={{ emphasis, detail }}>{children}</FrameCtx.Provider>
}
export const useFrame = () => useContext(FrameCtx)
/** True from the given detail level up: `useMore("detailed")` is only true on Detailed. */
export function useMore(level: Detail = "standard") {
  const { detail } = useFrame()
  const rank = { compact: 0, standard: 1, detailed: 2 }
  return rank[detail] >= rank[level]
}

/** The only type sizes widgets use. */
export const TYPE = {
  label: "text-[0.6875rem] leading-4 font-medium text-muted-foreground [text-transform:var(--label-transform,none)] [letter-spacing:var(--label-tracking,0)]",
  body: "text-[0.8125rem] leading-5",
  small: "text-xs leading-4 text-muted-foreground",
  title: "text-[0.8125rem] leading-5 font-medium",
  value: "font-heading text-xl leading-7 font-medium tracking-tight tabular-nums",
  valueLg: "font-heading text-[1.75rem] leading-8 font-medium tracking-tight tabular-nums",
  star: "font-heading text-[2.5rem] leading-[2.75rem] font-medium tracking-tight tabular-nums",
} as const

/** The widget's one accent: the coach's colour, or the text colour when the widget is Quiet. */
export const ACCENT = "var(--w-accent, var(--primary))"
/**
 * The accent as text: the brand colour adjusted to stay readable on the card
 * (--brand-text), the text colour when Quiet, the brand's own text colour on a Star card.
 */
export const ACCENT_TEXT = "var(--w-accent-text, var(--brand-text, var(--primary)))"

export type Tone = "primary" | "profit" | "loss" | "highlight" | "muted" | "fg"
export const TONE: Record<Tone, string> = {
  primary: ACCENT,
  profit: "var(--profit)",
  loss: "var(--loss)",
  highlight: "var(--highlight)",
  muted: "color-mix(in oklab, var(--foreground) 14%, transparent)",
  fg: "var(--foreground)",
}
const TEXT: Record<Tone, string> = {
  primary: "text-[color:var(--w-accent-text,var(--brand-text,var(--primary)))]",
  profit: "text-profit",
  loss: "text-loss",
  highlight: "text-foreground",
  muted: "text-muted-foreground",
  fg: "text-foreground",
}

/** A flat fill. (Gradients were tried and look cheap; see the vault.) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fill = (tone: Tone | string, _dir?: string) => (tone in TONE ? TONE[tone as Tone] : tone)

/** Series colour by index: shades of the accent, from full to faint. Never a rainbow. */
export const series = (i: number) => `color-mix(in oklab, ${ACCENT} ${[100, 64, 40, 24, 14][i % 5]}%, var(--muted))`

/** Profit or loss as a soft mark (thin bars, small cells); text uses text-profit / text-loss. */
export const pl = (v: number, strength = 80) => `color-mix(in oklab, ${v >= 0 ? "var(--profit)" : "var(--loss)"} ${strength}%, var(--card))`

/**
 * The card every widget sits in. Emphasis comes from the WidgetFrame: Quiet
 * swaps the accent for the text colour; Star puts the card on the coach's
 * colour (the contents re-tint, see .fx-hero). `brand` forces Star.
 */
export function W({ children, className, style, brand, row }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; brand?: boolean; /** A one-row layout: tighter top and bottom padding, so it fits 56px on every spacing setting. */ row?: boolean }) {
  const { emphasis } = useFrame()
  const star = brand || emphasis === "star"
  return (
    <div
      data-slot="widget"
      data-emphasis={star ? "star" : emphasis}
      className={cn(
        "@container flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-(--radius) p-[calc(1rem*var(--density,1))]",
        row && "py-2",
        star ? "fx-hero" : "bg-card text-card-foreground",
        className,
      )}
      style={
        {
          boxShadow: "var(--card-shadow)",
          // The brand colour itself (.fx-hero re-points --primary to the text colour inside).
          // Secondary text stays at full strength: on a mid-tone brand, faded text fails contrast.
          // Profit and loss become the text colour too: green or red on a brand colour is unreadable, and ▲/▼, +/− still say it.
          ...(star
            ? {
                "--w-accent-text": "var(--on)",
                "--muted-foreground": "var(--on)",
                "--profit": "var(--on)",
                "--loss": "var(--on)",
                // Chips, avatars and pictures sit on shades away from the text colour, so they keep contrast.
                "--muted": "var(--brand-shade)",
                "--background": "var(--brand-shade)",
                "--cover-bg": "var(--brand-deep)",
                "--cover-fg": "var(--on)",
                background: "var(--brand)",
              }
            : emphasis === "quiet" ? { "--w-accent": "var(--foreground)", "--w-accent-text": "var(--foreground)" } : {}),
          ...style,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

/** Small label (11px). Follows the coach's small-label setting (plain or uppercase). */
export function Caps({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn(TYPE.label, "leading-none", className)}>{children}</span>
}

/**
 * Header: the widget's title (13px), an optional value next to it, and a
 * quiet detail on the right that hides when the widget is narrow. The icon
 * is small and muted: no coloured tiles.
 */
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
    <div className="flex min-w-0 items-center gap-1.5 leading-none">
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
      {label && <span className={cn(TYPE.title, "truncate leading-none")}>{label}</span>}
      {value !== undefined && (
        <span className={cn("shrink-0 text-[0.8125rem] leading-none font-medium tabular-nums", TEXT[tone])}>
          {value}
          {unit && <span className="ml-0.5 text-[0.6875rem] text-muted-foreground">{unit}</span>}
        </span>
      )}
      {right && <span className="ml-auto hidden shrink-0 items-center gap-1.5 @[15rem]:flex">{typeof right === "string" ? <Caps>{right}</Caps> : right}</span>}
    </div>
  )
}

/**
 * The one number. 20px, or 28px with size "lg"; on the page's Star widget
 * 28px and 40px. Medium weight, even-width digits.
 */
export function Big({ value, unit, sub, tone = "fg", size = "md", fx }: { value: React.ReactNode; unit?: string; sub?: React.ReactNode; tone?: Tone; size?: "md" | "lg"; fx?: boolean }) {
  const { emphasis } = useFrame()
  const star = emphasis === "star"
  const cls = size === "lg" ? (star ? TYPE.star : TYPE.valueLg) : star ? TYPE.valueLg : TYPE.value
  return (
    <div className="grid min-w-0 gap-0.5">
      <div className={cn(cls, "line-clamp-2 text-balance")}>
        <span className={cn(fx ? TEXT.primary : TEXT[tone])}>{value}</span>
        {unit && <span className="ml-1 text-[0.8125rem] font-normal tracking-normal text-muted-foreground">{unit}</span>}
      </div>
      {sub && <div className={cn(TYPE.small, "truncate tabular-nums")}>{sub}</div>}
    </div>
  )
}

/** A small change figure: ▲ 4.2% in profit colour, ▼ in loss colour, as text only. */
export function Delta({ value, suffix = "%", className }: { value: number; suffix?: string; className?: string }) {
  return (
    <span className={cn("text-xs font-medium tabular-nums", value >= 0 ? "text-profit" : "text-loss", className)}>
      {value >= 0 ? "▲" : "▼"} {Math.abs(value).toLocaleString("en")}
      {suffix}
    </span>
  )
}

/** A label over a value, for rows of two or three small stats. */
export function Stat({ label, value, sub, tone = "fg" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone }) {
  return (
    <div className="grid min-w-0 gap-1">
      <Caps className="truncate">{label}</Caps>
      <span className={cn("truncate text-[0.9375rem] leading-5 font-medium tabular-nums", TEXT[tone])}>{value}</span>
      {sub && <span className={cn(TYPE.small, "truncate")}>{sub}</span>}
    </div>
  )
}

/** A list row: optional rank or picture, title and line under it, a value on the right. `me` marks the student's own row. */
export function Row({
  rank,
  avatar,
  title,
  sub,
  value,
  me,
  className,
}: {
  rank?: number
  avatar?: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  value?: React.ReactNode
  me?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5 last:border-b-0", me && "-mx-1.5 rounded-[min(var(--radius),6px)] border-transparent bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] px-1.5", className)}>
      {rank !== undefined && <span className={cn("w-4 shrink-0 text-right text-xs tabular-nums", me ? "font-medium text-foreground" : "text-muted-foreground")}>{rank}</span>}
      {avatar}
      <span className="grid min-w-0 flex-1">
        <span className={cn(TYPE.body, "truncate", me && "font-medium")}>{title}</span>
        {sub && <span className={cn(TYPE.small, "truncate")}>{sub}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-[0.8125rem] tabular-nums">{value}</span>}
    </div>
  )
}

/** Initials in a neutral circle (no rainbow avatars). */
export function Avatar({ initials, src, size = 24 }: { initials: string; src?: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="r-dot shrink-0 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="r-dot grid shrink-0 place-items-center bg-muted text-[0.625rem] font-medium text-muted-foreground" style={{ width: size, height: size }}>
      {initials}
    </span>
  )
}

/** Large countdown digits in the label font: 06:30 or 2d 04h. */
export function Countdown({ parts, className }: { parts: { value: string | number; unit?: string }[]; className?: string }) {
  const { emphasis } = useFrame()
  return (
    <div className={cn("flex items-baseline gap-2 tabular-nums", className)}>
      {parts.map((p, i) => (
        <span key={i} className="flex items-baseline gap-0.5">
          <span className={emphasis === "star" ? TYPE.star : TYPE.valueLg}>{String(p.value).padStart(2, "0")}</span>
          {p.unit && <span className="text-xs text-muted-foreground">{p.unit}</span>}
        </span>
      ))}
    </div>
  )
}

/** Target against actual: a thin track, the actual in the accent, a tick at the target. */
export function Bullet({ value, target, max, tone = "primary", className }: { value: number; target?: number; max: number; tone?: Tone; className?: string }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`
  return (
    <div className={cn("relative h-1.5", className)}>
      <span className="r-bar absolute inset-0 bg-muted" />
      <span className="r-bar absolute inset-y-0 left-0" style={{ width: pct(value), background: TONE[tone] }} />
      {target !== undefined && <span className="absolute -inset-y-1 w-px bg-foreground" style={{ left: pct(target) }} />}
    </div>
  )
}

/** One dot per day: done, missed, or still to come. The latest done day carries the accent. */
export function Streak({ days, className }: { days: (boolean | null)[]; className?: string }) {
  const last = days.lastIndexOf(true)
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {days.map((d, i) => (
        <span
          key={i}
          className={cn("r-dot size-2 shrink-0", d === null && "border border-[color:color-mix(in_oklab,var(--foreground)_20%,transparent)]")}
          style={{ background: d === null ? undefined : d ? (i === last ? ACCENT : "color-mix(in oklab, var(--foreground) 55%, transparent)") : "var(--muted)" }}
        />
      ))}
    </div>
  )
}

/**
 * A picture with words under or beside it: course covers, the coach's photo,
 * lesson thumbnails. Pictures give a dashboard interest without colour.
 */
export function Media({ image, title, sub, side, children, className }: { image: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; side?: boolean; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 gap-3", side ? "flex-row items-center" : "flex-col", className)}>
      <div className={cn("relative shrink-0 overflow-hidden rounded-[min(var(--radius),8px)]", side ? "aspect-[4/3] h-full max-h-28" : "min-h-16 flex-1")}>{image}</div>
      <div className="grid min-w-0 gap-1">
        <span className={cn(TYPE.title, "truncate")}>{title}</span>
        {sub && <span className={cn(TYPE.small, "truncate")}>{sub}</span>}
        {children}
      </div>
    </div>
  )
}

/**
 * Hover label for charts. Sits above the point (or below it when the point is
 * near the top) and stays inside the chart horizontally.
 */
export function Tip({ x, y, label, value, place }: { x: number; y: number; label?: React.ReactNode; value: React.ReactNode; place?: "above" | "below" }) {
  const below = place ? place === "below" : y < 22
  const tx = x < 15 ? "-12%" : x > 85 ? "-88%" : "-50%"
  return (
    <span
      className="r-chip pointer-events-none absolute z-10 flex items-baseline gap-1.5 bg-foreground px-1.5 py-1 whitespace-nowrap text-background shadow-sm"
      style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${tx}, ${below ? "8px" : "calc(-100% - 8px)"})` }}
    >
      {label && <span className="text-[0.6875rem] leading-none opacity-60">{label}</span>}
      <span className="text-xs leading-none font-semibold tabular-nums">{value}</span>
    </span>
  )
}

const num = (v: number) => v.toLocaleString("en")

/** Vertical bars. With `diverging`, bars grow up (profit) and down (loss) from a zero line. */
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
  const max = Math.max(...values.map(Math.abs), 1)
  // One accent: the active bar (by default the latest); the rest stay neutral.
  const current = active ?? values.length - 1
  const lit = hover ?? current
  return (
    <div className={cn("flex min-h-12 flex-1 flex-col gap-1.5", className)}>
      <div className="relative flex flex-1 items-stretch gap-[min(8%,4px)]" onPointerLeave={() => setHover(undefined)}>
        {diverging && <span className="absolute inset-x-0 top-1/2 h-px bg-border" />}
        {values.map((v, i) => {
          const pct = (Math.abs(v) / max) * (diverging ? 50 : 100)
          const h = Math.max(pct, v === 0 ? 0 : 3)
          const up = v >= 0
          const color = diverging ? pl(v) : i === lit ? fill(tone) : TONE.muted
          const dim = diverging && hover !== undefined && i !== hover
          return (
            <div key={i} className="relative flex-1" onPointerEnter={() => setHover(i)}>
              {hover === i && <span className="r-bar absolute -inset-x-[3px] inset-y-0 bg-muted" />}
              <span
                className="r-bar absolute inset-x-0 transition-opacity duration-150"
                style={{
                  background: color,
                  opacity: dim ? 0.4 : 1,
                  height: `${h}%`,
                  ...(diverging ? (up ? { bottom: "50%" } : { top: "50%" }) : { bottom: 0 }),
                }}
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
          />
        )}
      </div>
      {labels && (
        <div className="flex gap-[min(8%,4px)]">
          {labels.map((l, i) => (
            <Caps key={i} className={cn("flex-1 text-center", i === lit && "text-foreground")}>
              {l}
            </Caps>
          ))}
        </div>
      )}
    </div>
  )
}

/** A clean line with a dot on the latest value. */
export function Spark({
  values,
  tone = "primary",
  className,
  invert,
  format = num,
  tip,
}: {
  values: number[]
  tone?: Tone
  className?: string
  invert?: boolean
  /** Formats the value in the hover label. */
  format?: (v: number) => string
  /** Names a point in the hover label, e.g. "Day 4". */
  tip?: (i: number) => string
}) {
  const [hover, setHover] = useState<number>()
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = invert ? ((v - min) / span) * 88 + 6 : 94 - ((v - min) / span) * 88
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ")
  const [lx, ly] = pts[hover ?? pts.length - 1]
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const t = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    setHover(Math.round(t * (values.length - 1)))
  }
  return (
    <div className={cn("relative min-h-10 flex-1 touch-none", className)} onPointerMove={onMove} onPointerLeave={() => setHover(undefined)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {[25, 50, 75].map((y) => (
          <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="color-mix(in oklab, var(--foreground) 6%, transparent)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        {hover !== undefined && <line x1={lx} x2={lx} y1={0} y2={100} stroke="var(--muted-foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.5} />}
        <path d={line} fill="none" stroke={TONE[tone]} strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round", strokeLinecap: "var(--cap)" as never }} />
      </svg>
      <span className="r-dot absolute size-1.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${lx}%`, top: `${ly}%`, background: TONE[tone], boxShadow: "0 0 0 2px var(--card)" }} />
      {hover !== undefined && <Tip x={lx} y={ly} label={tip?.(hover)} value={format(values[hover])} />}
    </div>
  )
}

/** Squares shaded by intensity: profit and loss. Stretches to fill. */
export function Heat({ rows, labels, className }: { rows: number[][]; labels?: string[]; className?: string }) {
  const [hover, setHover] = useState<[number, number]>()
  const max = Math.max(...rows.flat().map(Math.abs), 1)
  const cols = { gridTemplateColumns: `repeat(${rows[0].length}, minmax(0,1fr))` }
  return (
    <div className={cn("flex min-h-16 flex-1 flex-col gap-1", className)} onPointerLeave={() => setHover(undefined)}>
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
            const on = hover?.[0] === ri && hover?.[1] === ci
            return (
              <span
                key={ci}
                onPointerEnter={() => setHover([ri, ci])}
                className={cn("r-bar relative transition-opacity duration-150", hover && !on && "opacity-50", on && "z-10 outline-2 outline-offset-1 outline-foreground")}
                style={{ background: v === 0 ? "var(--muted)" : `color-mix(in oklab, ${v > 0 ? TONE.profit : TONE.loss} ${10 + step * 12}%, var(--muted))` }}
              >
                {on && (
                  <Tip
                    x={50}
                    y={ri === 0 ? 100 : 0}
                    place={ri === 0 ? "below" : "above"}
                    label={`Wk ${ri + 1}${labels ? ` · ${labels[ci]}` : ""}`}
                    value={v ? `${v > 0 ? "+" : "−"}€${Math.abs(v)}` : "No trades"}
                  />
                )}
              </span>
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
        <span key={i} title={p.label} className="r-bar" style={{ flex: p.w, background: p.brand ? ACCENT : p.color }} />
      ))}
    </div>
  )
}

/** A progress track. */
export function Track({ value, color = fill("primary"), className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cn("r-bar h-1 overflow-hidden bg-muted", className)}>
      <div className="r-bar h-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

/** Circular progress. Line ends follow the theme (round or square). */
export function Ring({ value, size = 56, stroke = 4, tone = "primary", children, className }: { value: number; size?: number; stroke?: number; tone?: Tone; children?: React.ReactNode; className?: string }) {
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
  const [hover, setHover] = useState<number>()
  const n = axes.length
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as const
  }
  const poly = (r: (i: number) => number) => axes.map((_, i) => pt(i, r(i)).join(",")).join(" ")
  return (
    <svg viewBox="-14 -8 128 116" className={cn("size-full min-h-24", className)} aria-label="Discipline by area" onPointerLeave={() => setHover(undefined)}>
      {[0.5, 1].map((k) => (
        <polygon key={k} points={poly(() => 40 * k)} fill="none" stroke="var(--border)" strokeWidth={0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 40)
        return <line key={i} x1={50} y1={50} x2={x} y2={y} stroke={hover === i ? "var(--muted-foreground)" : "var(--border)"} strokeWidth={hover === i ? 0.8 : 0.6} />
      })}
      <polygon points={poly((i) => (40 * axes[i].v) / 100)} fill={ACCENT} fillOpacity={0.08} stroke={ACCENT} strokeWidth={1} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, (40 * a.v) / 100)
        const [lx, ly] = pt(i, 50)
        const on = hover === i
        // A wedge around each axis catches the pointer, so the whole chart is hoverable.
        const [ax, ay] = pt(i - 0.5, 56)
        const [bx, by] = pt(i + 0.5, 56)
        const [cx, cy] = pt(i, 56)
        return (
          <g key={a.label} onPointerEnter={() => setHover(i)}>
            <polygon points={`50,50 ${ax},${ay} ${cx},${cy} ${bx},${by}`} fill="transparent" />
            <circle cx={x} cy={y} r={on ? 2.6 : 1.4} fill={ACCENT} stroke={on ? "var(--card)" : "none"} strokeWidth={1.2} className="transition-[r] duration-150" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill={on ? "var(--foreground)" : "var(--muted-foreground)"} fontWeight={on ? 600 : 500}>
              {on ? `${a.label} ${a.v}%` : a.label}
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
          <span key={t} className="absolute top-0 bottom-0 w-px bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)]" style={{ left: pos(t) }} />
        ))}
        {events.map((e, i) => (
          <span
            key={e.title}
            className="r-chip absolute truncate border-l-2 bg-muted px-1.5 py-1 text-[0.6875rem] leading-tight font-medium text-foreground"
            style={{ left: pos(e.start), width: `calc(${pos(e.end)} - ${pos(e.start)})`, top: `${8 + (i % 3) * 30}%`, borderLeftColor: e.color }}
            title={e.title}
          >
            {e.title}
          </span>
        ))}
        <span className="absolute top-0 bottom-0 w-px bg-foreground" style={{ left: pos(now) }}>
          <span className="r-dot absolute -top-1 -left-[3px] size-[7px]" style={{ background: ACCENT }} />
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
