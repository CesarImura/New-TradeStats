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
        <span className="r-chip grid size-10 shrink-0 place-items-center bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="grid flex-1 gap-0.5">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{text}</span>
        </div>
        {action}
      </div>
    </Card>
  )
}

/** Generated course artwork: the course colour with a slight tonal shift, and a few candles. */
export function Cover({ color = "var(--primary)", label, className }: { color?: string; hue?: number; label?: string; className?: string }) {
  const candles = [38, 52, 44, 61, 55, 70, 64, 78]
  return (
    <div
      className={cn("relative isolate overflow-hidden rounded-[min(var(--radius),12px)]", className)}
      style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${color} 92%, white), color-mix(in oklab, ${color} 88%, black))` }}
    >
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 size-full opacity-30" aria-hidden>
        {candles.map((h, i) => {
          const x = 8 + i * 11
          const up = i % 3 !== 1
          return (
            <g key={i} fill="white" stroke="white">
              <line x1={x + 2} x2={x + 2} y1={60 - h - 6} y2={60 - h + 22} strokeWidth="0.6" />
              <rect x={x} y={60 - h} width="4" height={up ? 14 : 10} opacity={up ? 1 : 0.5} />
            </g>
          )
        })}
      </svg>
      {label && <span className="absolute bottom-2 left-3 font-heading text-sm text-white/90 drop-shadow">{label}</span>}
    </div>
  )
}

/** Circular progress. */
export function Ring({ value, size = 64, stroke = 7, children, className }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; className?: string }) {
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
          className="r-dot grid size-7 place-items-center border-2 border-card text-[0.6rem] font-semibold text-white"
          style={{ background: `oklch(0.55 0.12 ${(n * 67) % 360})` }}
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
