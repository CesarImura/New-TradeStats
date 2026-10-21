"use client"

import { useId, useState } from "react"
import type { LucideIcon } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { chartStyleOf, widgetFontOf, widgetHeaderOf, widgetStyleOf, type ChartStyle, type WidgetFont, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ACCENT, ACCENT_TEXT, TYPE, W, link, useFrame } from "./kit"

/**
 * The widget anatomy and signature visuals (Instrument, Soft, Editorial).
 *
 * Every widget is the same card: a header (icon, title, a grey line of the
 * student's own context, a chip on the right) and a body. Each widget then
 * gets its OWN visual from this file (tick gauge, tick bar, step chart, dot
 * strip, hatched bar, timeline) and packs information with legend rows.
 *
 * The coach's Widget style (Design → Look) decides how the same card is drawn:
 * - instrument: dashed icon square, an inset lighter body panel, figures in a
 *   mono (--font-figures), small labels in mono capitals. Dense and precise.
 * - soft: one rounded surface, a soft filled icon tile, figures in the heading
 *   font. Calm, Apple-like.
 * - editorial: no icon tile, title in the heading font, a hairline under the
 *   header, figures in the heading font. Airy.
 *
 * Figures and small labels follow the Widget font (Design → Look), which
 * defaults to mono in Instrument and the heading font otherwise.
 *
 * Colour: the accent (coach's colour) marks the main mark; greys (GREY) carry
 * the rest; profit/loss only where results are meant. Meaning colours are
 * allowed in legends and timelines, never decoration. Type stays on TYPE sizes.
 */

export function useWidgetStyle(): WidgetStyle {
  const { theme } = useCoach()
  return widgetStyleOf(theme)
}

/** How bars and gauges are drawn (Design → Look → Chart style): ticks, solid or thin. */
export function useChartStyle(): ChartStyle {
  const { theme } = useCoach()
  return chartStyleOf(theme)
}

/** The font for figures and small labels (Design → Look → Widget font). */
export function useWidgetFont(): WidgetFont {
  const { theme } = useCoach()
  return widgetFontOf(theme)
}

/** Greys for secondary series and legend swatches, strongest first. */
export const GREY = [
  "color-mix(in oklab, var(--foreground) 78%, transparent)",
  "color-mix(in oklab, var(--foreground) 48%, transparent)",
  "color-mix(in oklab, var(--foreground) 28%, transparent)",
  "color-mix(in oklab, var(--foreground) 14%, transparent)",
]
/** Coloured text, nudged toward the text colour so it stays readable on tints and inset panels. */
export const ink = (c: string) => `color-mix(in oklab, ${c} 74%, var(--foreground))`

/** An empty tick or track. */
export const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"

/** Figures, in the widget font. */
export function useFigureFont() {
  const f = useWidgetFont()
  return f === "mono" ? "var(--font-figures)" : f === "heading" ? "var(--font-heading)" : "var(--coach-font-body, var(--font-sans))"
}

/** Small label: mono capitals with the mono widget font, the coach's label style otherwise. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  const mono = useWidgetFont() === "mono"
  return (
    <span
      className={cn(mono ? "text-[0.6875rem] leading-4 tracking-[0.04em] text-muted-foreground uppercase" : TYPE.label, className)}
      style={mono ? { fontFamily: "var(--font-figures)" } : undefined}
    >
      {children}
    </span>
  )
}

/** A short value in a tinted pill: "58% win", "4 inputs". Accent by default. */
export function Chip({ children, tone = "accent", className }: { children: React.ReactNode; tone?: "accent" | "neutral" | "profit" | "loss"; className?: string }) {
  const s = useWidgetStyle()
  const mono = useWidgetFont() === "mono"
  const star = useFrame().emphasis === "star"
  const color = tone === "accent" ? ACCENT : tone === "profit" ? "var(--profit)" : tone === "loss" ? "var(--loss)" : "var(--foreground)"
  // On its own tint a colour loses contrast, so the text leans toward the text colour (darker on light cards, lighter on dark).
  const base = tone === "accent" ? ACCENT_TEXT : tone === "neutral" ? "var(--muted-foreground)" : color
  // Stronger than ink(): it sits on its own tint.
  const text = `color-mix(in oklab, ${base} ${tone === "neutral" ? 72 : 62}%, var(--foreground))`
  return (
    <span
      className={cn("inline-flex h-5 shrink-0 items-center px-1.5 text-[0.6875rem] leading-none whitespace-nowrap tabular-nums", s === "soft" ? "rounded-full px-2" : "r-chip", className)}
      style={{ background: star ? "var(--brand-shade)" : `color-mix(in oklab, ${color} ${tone === "neutral" ? 8 : 11}%, transparent)`, color: text, fontFamily: mono ? "var(--font-figures)" : undefined }}
    >
      {children}
    </span>
  )
}

/** Where the coach's note button goes, or nothing when it has no label or no place to go. */
function useNoteHref() {
  const { base } = useCoach()
  const { note } = useFrame()
  if (!note?.button?.trim()) return undefined
  if (note.target === "url") {
    const u = note.url?.trim()
    return u ? (/^[a-z][a-z\d+.-]*:/i.test(u) ? u : `https://${u}`) : undefined
  }
  return `${base}/${note.target || "courses"}`
}

/** The coach's own button on a widget. */
function NoteButton({ className }: { className?: string }) {
  const href = useNoteHref()
  const { note } = useFrame()
  if (!href) return null
  return (
    <Button variant="outline" size="sm" className={cn("w-fit shrink-0", className)} {...link(href)}>
      {note?.button}
    </Button>
  )
}

/** The coach's own picture and text with a button, between a card's header and its body. */
function Note({ inset }: { inset?: boolean }) {
  const { note } = useFrame()
  const href = useNoteHref()
  const text = note?.text?.trim()
  if (!note || (!note.image && !text && !href)) return null
  return (
    <div className={cn("flex shrink-0 flex-col gap-2", inset && "px-2 pb-2.5")}>
      {note.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={note.image} alt="" className="aspect-video max-h-40 w-full rounded-(--radius) object-cover" />
      )}
      {(text || href) && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          {text && <p className={cn(TYPE.small, "line-clamp-2 min-w-0 flex-1 basis-40")}>{text}</p>}
          <NoteButton />
        </div>
      )}
    </div>
  )
}

/**
 * The widget card. `title` and `meta` (the grey context line) on the left,
 * `chip` on the right; `crumb` puts a "Section / Title" breadcrumb instead of
 * the icon. `flush` drops the inset body panel (for media and lists that fill
 * the card). The body is a flex column with 12px gaps.
 *
 * Which header parts show (icon, title, description, value chip) follows
 * Design → Look → Widget header, then the widget's own choice (widgetHeaderOf).
 * With every part off there's no header at all. A one-row card always keeps
 * its title: there it is the content.
 */
export function WCard({
  icon: Icon,
  title,
  meta,
  chip,
  crumb,
  flush,
  row,
  children,
  className,
  bodyClassName,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  meta?: React.ReactNode
  chip?: React.ReactNode
  crumb?: string
  flush?: boolean
  /** One-row layout: header only, the body sits inline on the right. */
  row?: boolean
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const s = useWidgetStyle()
  const { emphasis, header, core } = useFrame()
  const { theme } = useCoach()
  const h = widgetHeaderOf(theme, header)
  const star = emphasis === "star"
  const inset = s === "instrument" && !flush
  const showTitle = row || h.title
  const showIcon = !!Icon && h.icon
  const showMeta = !!meta && h.description
  const showChip = !!chip && h.value
  const head = !showTitle && !showIcon && !showMeta && !showChip ? null : (
    <div className={cn("flex min-w-0 items-center gap-2.5", s === "instrument" && !row ? "px-2 pt-2 pb-2.5" : "", s === "editorial" && !row && "border-b border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)] pb-3")}>
      {crumb && showTitle ? (
        <span className="flex min-w-0 items-baseline gap-1.5 text-[0.8125rem] leading-5">
          <span className="shrink-0 text-muted-foreground">{crumb}</span>
          <span className="text-muted-foreground" aria-hidden>
            /
          </span>
          <span className="truncate font-medium">{title}</span>
        </span>
      ) : (
        <>
          {showIcon && Icon && (
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center",
                s === "instrument" ? "rounded-[min(var(--radius),7px)] border border-dashed border-[color:color-mix(in_oklab,var(--foreground)_28%,transparent)]" : "rounded-[min(calc(var(--radius)*0.8),10px)] bg-muted",
              )}
            >
              <Icon className="size-3.5" />
            </span>
          )}
          <span className="grid min-w-0 flex-1">
            {showTitle && <span className={cn("truncate leading-5", s === "editorial" ? "font-heading text-[0.9375rem]" : "text-[0.8125rem] font-medium")}>{title}</span>}
            {showMeta && <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">{meta}</span>}
          </span>
        </>
      )}
      {showChip && <span className={cn("hidden shrink-0 @[14rem]:inline-flex", crumb && "ml-auto")}>{chip}</span>}
      {row && children}
      {row && !core && <NoteButton />}
    </div>
  )
  if (row) return <W row className={cn("justify-center", className)}>{head}</W>
  return (
    <W className={cn(s === "instrument" && "gap-0 p-1.5", s === "soft" && "gap-3.5", className)}>
      {head}
      {!core && <Note inset={s === "instrument"} />}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3",
          inset && "rounded-[max(2px,calc(var(--radius)-4px))] p-[calc(0.875rem*var(--density,1))]",
          bodyClassName,
        )}
        style={inset ? { background: star ? "var(--brand-shade)" : "color-mix(in oklab, var(--foreground) 3%, var(--card))" } : undefined}
      >
        {children}
      </div>
    </W>
  )
}

/** The headline figure with its change right next to it. size: md 20px, lg 28px (40px on a Star). */
export function Num({ value, unit, delta, deltaTone, size = "lg", className }: { value: React.ReactNode; unit?: string; delta?: React.ReactNode; deltaTone?: "profit" | "loss" | "accent" | "muted"; size?: "md" | "lg"; className?: string }) {
  const { emphasis } = useFrame()
  const font = useFigureFont()
  const star = emphasis === "star"
  const cls = size === "lg" ? (star ? TYPE.star : TYPE.valueLg) : star ? TYPE.valueLg : TYPE.value
  const tone = deltaTone === "profit" ? ink("var(--profit)") : deltaTone === "loss" ? ink("var(--loss)") : deltaTone === "muted" ? "var(--muted-foreground)" : ink(ACCENT_TEXT)
  return (
    <div className={cn("flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn(cls, "tracking-[-0.02em]")} style={{ fontFamily: font }}>
        {value}
        {unit && <span className="ml-1 text-[0.8125rem] font-normal tracking-normal text-muted-foreground">{unit}</span>}
      </span>
      {delta !== undefined && (
        <span className="text-xs leading-none tabular-nums" style={{ color: tone, fontFamily: font }}>
          {delta}
        </span>
      )}
    </div>
  )
}

/** Legend rows: a square, a label, the value on the right. The packing tool. */
export function Legend({ items, className }: { items: { color?: string; label: React.ReactNode; value?: React.ReactNode; valueTone?: "profit" | "loss" | "accent"; dot?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  const mono = useWidgetStyle() === "instrument"
  return (
    <div className={cn("grid gap-1", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-xs leading-5" style={mono ? { fontFamily: font } : undefined}>
          {it.color && <span className={cn("size-2 shrink-0", it.dot ? "r-dot" : "rounded-[2px]")} style={{ background: it.color }} />}
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{it.label}</span>
          {it.value !== undefined && (
            <span
              className="shrink-0 tabular-nums"
              style={{ color: it.valueTone === "profit" ? ink("var(--profit)") : it.valueTone === "loss" ? ink("var(--loss)") : it.valueTone === "accent" ? ink(ACCENT_TEXT) : "var(--foreground)", fontFamily: font }}
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
export function Axis({ labels, className }: { labels: React.ReactNode[]; className?: string }) {
  const font = useFigureFont()
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
export function TickGauge({ value, max = 100, ticks = 40, children, className }: { value: number; max?: number; ticks?: number; children?: React.ReactNode; className?: string }) {
  const style = useChartStyle()
  const on = Math.round((Math.min(value, max) / max) * ticks)
  const pct = Math.min(Math.max(value, 0), max) / max
  // Solid and thin: one arc with the share in the accent (thin is a hairline with a dot at the end).
  const arc = (from: number, to: number) => {
    const a0 = Math.PI + Math.PI * from
    const a1 = Math.PI + Math.PI * to
    return `M${r2(110 + Math.cos(a0) * 93)} ${r2(108 + Math.sin(a0) * 93)} A93 93 0 0 1 ${r2(110 + Math.cos(a1) * 93)} ${r2(108 + Math.sin(a1) * 93)}`
  }
  const w = style === "thin" ? 3 : 13
  return (
    <div className={cn("relative mx-auto w-full max-w-60", className)}>
      <svg viewBox="0 0 220 116" className="w-full" aria-hidden>
        {style === "ticks" ? (
          Array.from({ length: ticks }, (_, i) => {
            const a = Math.PI + (Math.PI * i) / (ticks - 1)
            const lit = i < on
            const head = lit && i >= on - Math.max(2, Math.round(ticks * 0.12))
            return (
              <line
                key={i}
                x1={r2(110 + Math.cos(a) * 86)}
                y1={r2(108 + Math.sin(a) * 86)}
                x2={r2(110 + Math.cos(a) * 100)}
                y2={r2(108 + Math.sin(a) * 100)}
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
            {pct > 0 && <path d={arc(0, pct)} fill="none" stroke={ACCENT} strokeWidth={w} style={{ strokeLinecap: "var(--cap)" as never }} />}
            {style === "thin" && pct > 0 && (
              <circle cx={r2(110 + Math.cos(Math.PI + Math.PI * pct) * 93)} cy={r2(108 + Math.sin(Math.PI + Math.PI * pct) * 93)} r={5} fill={ACCENT} />
            )}
          </>
        )}
      </svg>
      {children && <div className="absolute inset-x-0 bottom-0 grid justify-items-center gap-0.5 text-center">{children}</div>}
    </div>
  )
}

/** A segmented bar: segments up to the value in the accent (or a tone), the rest faint. `now` marks one segment taller. */
export function TickBar({ value, max = 100, segments = 48, color = ACCENT, mark, now, height = 10, className }: { value: number; max?: number; segments?: number; color?: string; mark?: (i: number) => string | undefined; now?: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const on = Math.round((Math.min(Math.max(value, 0), max) / max) * segments)
  const h = style === "thin" ? 3 : style === "solid" ? Math.max(6, height - 2) : height
  // Ticks: separate segments. Solid and thin: the same segments joined into one rounded bar.
  return (
    <div className={cn("relative flex items-end", style === "ticks" ? "gap-[2px]" : "r-bar overflow-hidden", className)} style={{ height: style === "ticks" ? height + 6 : h }} aria-hidden>
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
    </div>
  )
}

/**
 * Step lines on a dotted grid. The first series is the accent with a faint
 * fill; the others are grey lines. Hover shows the value at a step.
 */
export function StepChart({ series, format = (v) => v.toLocaleString("en"), height = 112, className }: { series: { values: number[]; label?: string; color?: string }[]; format?: (v: number) => string; height?: number; className?: string }) {
  const id = useId()
  const [hover, setHover] = useState<number>()
  const all = series.flatMap((s) => s.values)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const n = series[0].values.length
  const x = (i: number) => (i / n) * 300
  const y = (v: number) => 100 - ((v - min) / (max - min || 1)) * 84
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "H" + x(i).toFixed(1) + " V" : "M0 "}${y(v).toFixed(1)}`).join(" ") + ` H300`
  const peak = series[0].values.indexOf(Math.max(...series[0].values))
  const at = hover ?? peak
  const font = useFigureFont()
  return (
    <div className={cn("relative", className)} style={{ height }} onPointerLeave={() => setHover(undefined)}>
      <svg viewBox="0 0 300 110" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <pattern id={`dots${id}`} width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="var(--foreground)" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="300" height="110" fill={`url(#dots${id})`} />
        <path d={`${path(series[0].values)} V110 H0 Z`} fill={ACCENT} opacity={0.08} />
        {series.slice(1).map((s, i) => (
          <path key={i} d={path(s.values)} fill="none" stroke={s.color ?? GREY[i + 1]} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={path(series[0].values)} fill="none" stroke={series[0].color ?? ACCENT} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute inset-0 flex">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="flex-1" onPointerEnter={() => setHover(i)} />
        ))}
      </div>
      <span
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full border-[1.5px] bg-card"
        style={{ left: `${((at + 0.5) / n) * 100}%`, top: `${(y(series[0].values[at]) / 110) * 100}%`, borderColor: ACCENT }}
      />
      <span
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-[min(var(--radius),4px)] bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums"
        style={{ left: `${Math.min(88, Math.max(12, ((at + 0.5) / n) * 100))}%`, top: `${(y(series[0].values[at]) / 110) * 100}%`, fontFamily: font }}
      >
        {format(series[0].values[at])}
      </span>
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
          {c.slice(0, 9).map((v, k) => (
            <span key={k} className="r-dot aspect-square w-full max-w-[5px]" style={{ background: split !== undefined && v >= split ? ACCENT : GREY[2] }} />
          ))}
          {i === meCol && <span className="absolute inset-y-0 w-px" style={{ left: `${((i + 0.5) / bins) * 100}%`, background: "var(--foreground)" }} />}
        </div>
      ))}
      {mean !== undefined && <span className="absolute inset-y-0 w-px border-l border-dashed border-[color:color-mix(in_oklab,var(--foreground)_35%,transparent)]" style={{ left: `${((mean - lo) / (hi - lo || 1)) * 100}%` }} />}
    </div>
  )
}

/** A stacked bar with a hatched remainder: done | in progress | what's left. */
export function HatchBar({ parts, total, height = 10, className }: { parts: { value: number; color: string }[]; total: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const used = parts.reduce((a, p) => a + p.value, 0)
  const hatch = style === "ticks"
  return (
    <div className={cn("flex", hatch ? "gap-[3px]" : "r-bar gap-px overflow-hidden", className)} style={{ height: style === "thin" ? 4 : height }} aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="r-bar" style={{ flex: p.value, background: p.color }} />
      ))}
      {total > used && (
        <span
          className="r-bar"
          style={hatch ? { flex: total - used, background: `repeating-linear-gradient(135deg, ${TRACK} 0 2px, transparent 2px 5px)`, boxShadow: `inset 0 0 0 1px ${TRACK}` } : { flex: total - used, background: TRACK }}
        />
      )}
    </div>
  )
}

/** A list of times with a coloured dot each: schedules, agendas, releases. */
export function Timeline({ items, className }: { items: { time: string; title: React.ReactNode; value?: React.ReactNode; color?: string; strong?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  return (
    <div className={cn("grid gap-0.5", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-xs leading-6">
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
  return <hr className={cn("border-0 border-t border-[color:color-mix(in_oklab,var(--foreground)_9%,transparent)]", className)} />
}
