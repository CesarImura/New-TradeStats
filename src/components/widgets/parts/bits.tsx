"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useFrame } from "./frame"
import { ACCENT, FX, TYPE } from "./tokens"

// Small pieces inside widgets: chips, avatar, countdown, streak, media row, chart tip, broken-image check.

/**
 * True once a picture failed to load (a corrupt upload, an address that went away), so the widget can show what it
 * shows with no picture instead of the browser's broken-image icon and alt text. A new address tries again. Give the
 * <img> both `onError` and `ref`: a picture that failed before the page hydrated fires no event React sees.
 */
export function useBrokenImage(src?: string) {
  const [broken, setBroken] = useState<string>()
  // Remembered for the page, not just this mount: a card the masonry moves is mounted again, and finding out once more
  // would change its height back and forth.
  const failed = () => {
    if (src) BROKEN.add(src)
    setBroken(src)
  }
  const ref = (img: HTMLImageElement | null) => {
    if (img?.complete && !img.naturalWidth) failed()
  }
  return [!!src && (broken === src || BROKEN.has(src)), failed, ref] as const
}
const BROKEN = new Set<string>()

/**
 * A one-row strip of chips (Links "One row", Partner links "Chips") that shows only whole chips: the ones that fit,
 * then a "+N" control (`more`, given the index of the first chip left out) that opens the rest. It measures with
 * every chip laid out in wrapping rows, keeps the first row, and does it again when the strip changes width.
 */
export function FitChips({ chips, more, className }: { chips: React.ReactNode[]; more: (from: number) => React.ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)
  const total = chips.length
  const [n, setN] = useState(total)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // A new width (or new chips) measures again from every chip.
  const [measured, setMeasured] = useState({ width, total })
  if (measured.width !== width || measured.total !== total) {
    setMeasured({ width, total })
    setN(total)
  }
  useLayoutEffect(() => {
    const el = row.current
    if (!el || n !== total || !width) return
    const kids = [...el.children] as HTMLElement[]
    if (!kids.length) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const room = width
    const widths = kids.map((k) => k.offsetWidth)
    if (widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1) <= room) return
    // As many whole chips as fit beside the "+N" control (about 2.5rem wide).
    let used = 40 + gap
    let fit = 0
    while (fit < widths.length && used + widths[fit] <= room) used += widths[fit++] + gap
    setN(fit)
  }, [n, total, width])
  return (
    <div ref={outer} className={cn("hidden min-w-0 flex-[2] items-center justify-end gap-1.5 @[26rem]:flex", className)}>
      <div ref={row} className="flex min-w-0 flex-wrap justify-end gap-1.5">
        {chips.slice(0, n)}
      </div>
      {n < total && more(n)}
    </div>
  )
}

/** The "+N" chip at the end of a FitChips strip: opens the chips left out, as a list (`children`). */
export function ChipMore({ count, label, children }: { count: number; label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        render={<button type="button" className={cn("r-chip flex shrink-0 items-center border px-2 py-1 text-[0.6875rem] tabular-nums", FX.chip, FX.focus)} aria-label={`${count} more ${label}`} />}
      >
        +{count}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 p-1">
        {children}
      </PopoverContent>
    </Popover>
  )
}

/** Initials in a neutral circle (no rainbow avatars). */
export function Avatar({ initials, src, size = 24 }: { initials: string; src?: string; size?: number }) {
  const [broken, onError, ref] = useBrokenImage(src)
  return src && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={src} alt="" onError={onError} className="r-dot shrink-0 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="r-dot grid shrink-0 place-items-center bg-muted text-[0.6875rem] leading-none font-medium text-muted-foreground" style={{ width: size, height: size }}>
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
          {p.unit && <span className="text-[0.6875rem] text-muted-foreground">{p.unit}</span>}
        </span>
      ))}
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
 * near the top) and stays inside the chart horizontally. Inverted (the text
 * colour as its fill), so it reads above any series.
 */
export function Tip({ x, y, label, value, place, color }: { x: number; y: number; label?: React.ReactNode; value: React.ReactNode; place?: "above" | "below"; /** A swatch before the value: the series' colour. */ color?: string }) {
  const below = place ? place === "below" : y < 22
  // Near an edge the label opens away from it instead of being cut by the card.
  const tx = x < 15 ? "-8%" : x > 85 ? "-92%" : "-50%"
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute z-20 grid gap-0.5 rounded-[min(var(--radius),8px)] border px-2 py-1.5 whitespace-nowrap shadow-[0_6px_20px_-6px_rgb(0_0_0/0.25),0_1px_2px_rgb(0_0_0/0.06)] duration-100 animate-in fade-in-0 zoom-in-95"
      // It grows from the point it labels (its bottom edge when above, its top when below), not from its own centre.
      style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${tx}, ${below ? "10px" : "calc(-100% - 10px)"})`, transformOrigin: below ? "top center" : "bottom center", background: "var(--foreground)", color: "var(--background)", borderColor: "transparent" }}
    >
      {label && <span className="text-[0.6875rem] leading-4 opacity-70">{label}</span>}
      <span className="flex items-center gap-1.5 text-[0.8125rem] leading-4 font-medium tabular-nums">
        {color && <i className="r-chip size-2 shrink-0" style={{ background: color }} />}
        {value}
      </span>
    </span>
  )
}
