"use client"

import { WidgetEmpty } from "../parts/shared"
import { Link2 } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { GREY, Label, useFigureFont } from "../parts/anatomy"


export const rr = (v: number, digits = 1) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}R`
export const euro = (n: number) => `€${Math.round(n).toLocaleString("en")}`
/** A result tint: profit or loss, softened. Mixed with transparent so it also works on a Star card. */
export const soft = (v: number, strength: number) => `color-mix(in oklab, ${v >= 0 ? "var(--profit)" : "var(--loss)"} ${strength}%, transparent)`
/** Profit or loss as text: the readable shades, not the fill colours. */
export const plColor = (v: number) => (v > 0 ? "var(--profit-text)" : v < 0 ? "var(--loss-text)" : "var(--muted-foreground)")
export const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"

export function ConnectBroker() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={Link2} title="Connect your broker" text={`Trades sync into your ${coach.wording.journal.toLowerCase()} automatically.`} action={<Button size="sm">Connect</Button>} />
}

/** A small label over a figure: used in the Edge strip. */
export function Fig({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  const font = useFigureFont()
  return (
    <div className="grid min-w-0 gap-0.5">
      <Label className="truncate">{label}</Label>
      <span className="truncate text-[0.8125rem] leading-5 [font-weight:var(--w-value-weight,500)] tabular-nums" style={{ fontFamily: font, color }}>
        {value}
      </span>
    </div>
  )
}

/** A big mono figure with its thousands commas set in half a cell, so "+€1,220" doesn't read as "+€1 , 220". */
export function tightComma(text: string) {
  return text.split(",").flatMap((part, i) => (i ? [<span key={i} className="-mx-[0.25ch]">,</span>, part] : [part]))
}

/** The model account's key: a short dashed grey stroke, as the line it names in the step chart. */
export function ModelKey() {
  return (
    <svg aria-hidden viewBox="0 0 12 2" className="h-0.5 w-3 shrink-0 overflow-visible">
      <line x1="0" y1="1" x2="12" y2="1" stroke={GREY[1]} strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  )
}

// ---------- Performance
