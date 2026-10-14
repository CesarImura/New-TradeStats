"use client"

import { createContext, useContext } from "react"
import type { LucideIcon } from "@/components/icons"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type WidgetProps = { variant?: string; props: Record<string, string | boolean> }

/**
 * "sample": widgets show realistic example data.
 * "empty": what a brand-new student in a brand-new community sees.
 */
export type DataMode = "sample" | "empty"
const DataModeContext = createContext<DataMode>("sample")
export const DataModeProvider = DataModeContext.Provider
export const useEmpty = () => useContext(DataModeContext) === "empty"

/** Shown instead of a widget's content when there is nothing to show yet. */
export function WidgetEmpty({
  icon: Icon,
  title,
  text,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  text: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("@container rounded-(--radius)", className)}>
      <div className="flex flex-col items-start gap-3 px-(--card-spacing) @md:flex-row @md:items-center">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <div className="grid flex-1 gap-0.5">
          <span className="text-[0.8125rem] font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{text}</span>
        </div>
        {action}
      </div>
    </Card>
  )
}

/**
 * Course artwork until coaches upload their own: a near-black (or near-white)
 * panel with a fine candlestick line and the course name in the heading font.
 * `color` only tints it slightly; it never becomes a block of brand colour.
 */
export function Cover({ color = "var(--primary)", label, className }: { color?: string; hue?: number; label?: string; className?: string }) {
  const candles = [38, 52, 44, 61, 55, 70, 64, 78, 72, 84]
  return (
    <div
      className={cn("relative isolate overflow-hidden rounded-[min(var(--radius),8px)]", className)}
      style={{ background: `var(--cover-bg, color-mix(in oklab, ${color} 10%, color-mix(in oklab, var(--foreground) 88%, var(--background))))` }}
    >
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
        {candles.map((h, i) => {
          const x = 6 + i * 9
          const up = i % 3 !== 1
          return (
            <g key={i} stroke="var(--cover-fg, var(--background))" fill={up ? "var(--cover-fg, var(--background))" : "none"} opacity={i === candles.length - 1 ? 0.9 : 0.28}>
              <line x1={x + 1.5} x2={x + 1.5} y1={60 - h - 5} y2={60 - h + 17} strokeWidth="0.4" />
              <rect x={x} y={60 - h} width="3" height={up ? 11 : 8} strokeWidth="0.4" />
            </g>
          )
        })}
      </svg>
      {label && <span className="absolute bottom-2.5 left-3 font-heading text-[0.9375rem] leading-tight text-[color:var(--cover-fg,var(--background))]">{label}</span>}
    </div>
  )
}

/** Circular progress (kit.tsx has the themed one widgets should use). */
export function Ring({ value, size = 56, stroke = 4, children, className }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; className?: string }) {
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
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute text-center leading-none">{children}</span>
    </div>
  )
}

export function AvatarStack({ initials, className }: { initials: string[]; className?: string }) {
  return (
    <div className={cn("flex -space-x-2", className)}>
      {initials.map((i, n) => (
        <span
          key={i}
          className="r-dot grid size-6 place-items-center border-2 border-card bg-muted text-[0.625rem] font-medium text-muted-foreground"
          data-n={n}
        >
          {i}
        </span>
      ))}
    </div>
  )
}

/** "6 h 30 min", "2 days" */
export function inWords(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ""}`.trim()
  const d = Math.round(minutes / 60 / 24)
  return `${d} day${d === 1 ? "" : "s"}`
}

export const signed = (n: number) => `${n >= 0 ? "+" : "−"}€${Math.abs(n).toLocaleString("en")}`
