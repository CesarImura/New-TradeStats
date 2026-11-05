"use client"

import { useId, useLayoutEffect, useRef, useState } from "react"
import { useFrame } from "./frame"

// Shared tokens for widgets: interaction (FX), type sizes (TYPE), accent and tones, row helpers, series colours and MOTION.

/**
 * Interaction, the same everywhere: one duration (150ms), one ease (ease-out),
 * one focus ring in the accent. Text links underline on hover; chips and
 * tiles take the muted fill; tiles and buttons press in to 98%.
 */
export const FX = {
  focus: "outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-1 focus-visible:ring-offset-(--card)",
  text: "rounded-sm underline-offset-[3px] decoration-1 transition-colors duration-150 ease-out hover:underline",
  // Press shrinks a touch and comes back fast; the hover tint is a colour change only.
  chip: "transition-[background-color,border-color,scale] duration-150 ease-out hover:bg-muted active:scale-[0.97] motion-reduce:active:scale-100",
  tile: "transition-[background-color,border-color,scale] duration-150 ease-out hover:bg-muted active:scale-[0.98] motion-reduce:active:scale-100",
} as const

/**
 * A button whose label a coach writes: it may shrink with the card, and a
 * long label ends in "…" instead of pushing out of it. Put the label in
 * <span className="truncate">. The full label stays in the title tooltip.
 */
export const CTA = "min-w-0 max-w-full shrink"

/**
 * Height, for lists in a cell that sets the height (builder, desktop grid):
 * when the rows don't fill the card, each row grows a little (up to 4.5rem,
 * content centred) instead of leaving a blank band under the last one. Put it
 * on a Fit list (flex-col flex-wrap): rows only grow when they all fit. Where
 * a card is as tall as its content it does nothing.
 */
export const GROW_ROWS = "[@container_card_(min-height:0px)]:*:grow [@container_card_(min-height:0px)]:*:max-h-[4.5rem]"

/**
 * The gap between a list's rows, in a cell that sets the height: as many whole
 * rows as fit with at least `min` between them, then the spare height shared
 * between those rows up to `max` (the design's gap is 12). So a row that
 * almost fits squeezes in instead of dropping out and leaving a hole, and a
 * roomy card spaces its rows out a little. Where the card is as tall as its
 * content the gap is just `base`. Returns the ref for the list (flex-col
 * flex-wrap, `min-h-0 flex-1`) and its row-gap.
 */
export function useFitGap<T extends HTMLElement>({ min = 4, base = 12, max = 20 }: { min?: number; base?: number; max?: number } = {}) {
  const { fixed } = useFrame()
  const ref = useRef<T>(null)
  const [gap, setGap] = useState(base)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !fixed) return setGap(base)
    const fit = () => {
      const rows = [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement && getComputedStyle(c).display !== "none")
      if (rows.length < 2) return
      const H = el.clientHeight
      let sum = 0
      let m = 0
      for (const r of rows) {
        const h = r.offsetHeight
        if (sum + h + m * min > H + 0.5) break
        sum += h
        m++
      }
      const next = m < 2 ? base : Math.max(min, Math.min(max, (H - sum) / (m - 1)))
      // Whole pixels, a hair under the exact share: rows that add up to the list's height to the pixel would wrap away.
      const px = Math.max(min, Math.floor(next - 0.25))
      setGap((g) => (g === px ? g : px))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fixed, min, base, max])
  return [ref, gap] as const
}
/** The same for rows without separators (bars, tracks): the free height is shared out between them instead. */
export const SPREAD_ROWS = "[@container_card_(min-height:0px)]:justify-evenly"

/**
 * Shape, for a card body with one main visual (a chart, a gauge, a picture;
 * mark it `data-main`) and parts that explain it (figures, legend, list): in a
 * cell that is wide and short (twice as wide as tall, 34rem up) the visual
 * takes the left and full height, the rest stack beside it, centred; in any
 * other shape it stays one column. Put it on WCard's bodyClassName.
 */
export const SPLIT = "[@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:flex-wrap [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:content-start [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:justify-center [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:gap-x-6 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:w-[min(38%,18rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:shrink-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:grow-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:basis-auto [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:w-[min(38%,18rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:shrink-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:grow-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:basis-auto [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:order-first [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:basis-full [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:w-[calc(100%-min(38%,18rem)-1.5rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:order-first [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:basis-full [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:w-[calc(100%-min(38%,18rem)-1.5rem)]"

/**
 * SPLIT turned round: the figures and parts that explain the visual take the left column, the visual (`data-main`) the right and
 * the full height. Same condition as SPLIT (a cell twice as wide as tall, 34rem up). Used by the layouts that read as "numbers, then
 * the chart" (Performance curve and bars); SPLIT keeps the visual on the left for the widgets that already use it.
 */
export const SPLIT_STATS = "[@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:flex-wrap [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:content-start [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:justify-center [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:gap-x-6 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:w-[min(38%,18rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:shrink-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:grow-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:*:basis-auto [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:w-[min(38%,18rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:shrink-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:grow-0 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>*]:basis-auto [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:order-last [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:basis-full [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>[data-main]]:w-[calc(100%-min(38%,18rem)-1.5rem)] [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:order-last [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:basis-full [@container_card_(min-aspect-ratio:2/1)_and_(min-width:34rem)]:[&>.contents>[data-main]]:w-[calc(100%-min(38%,18rem)-1.5rem)]"

/** The only type sizes widgets use. */
export const TYPE = {
  label: "text-[0.6875rem] leading-4 font-medium text-muted-foreground [text-transform:var(--label-transform,none)] [letter-spacing:var(--label-tracking,0)]",
  body: "text-[0.8125rem] leading-5",
  small: "text-[0.6875rem] leading-4 text-muted-foreground",
  title: "text-[0.8125rem] leading-5 [font-weight:var(--w-title-weight,500)]",
  value: "font-heading text-xl leading-7 [font-weight:var(--w-value-weight,500)] tracking-tight tabular-nums",
  valueLg: "font-heading text-[1.75rem] leading-8 [font-weight:var(--w-value-weight,500)] tracking-tight tabular-nums",
  star: "font-heading text-[2.5rem] leading-[2.75rem] [font-weight:var(--w-value-weight,500)] tracking-tight tabular-nums",
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
export const TEXT: Record<Tone, string> = {
  primary: "text-[color:var(--w-accent-text,var(--brand-text,var(--primary)))]",
  profit: "text-profit",
  loss: "text-loss",
  highlight: "text-foreground",
  muted: "text-muted-foreground",
  fg: "text-foreground",
}

/**
 * The tint under a chart's main line: the colour fading to nothing at the
 * baseline, so a chart that runs to the card's edges has no hard bottom edge.
 * The one gradient widgets use (asked for on 2026-10-29); decoration stays flat.
 */
export function AreaFill({ d, color = ACCENT, strength = 0.18 }: { d: string; color?: string; strength?: number }) {
  const id = `af${useId().replace(/[^a-z0-9]/gi, "")}`
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: color, stopOpacity: strength }} />
          <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </>
  )
}

/** A flat fill. (Gradients were tried and look cheap; see the vault.) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fill = (tone: Tone | string, _dir?: string) => (tone in TONE ? TONE[tone as Tone] : tone)

/** Series colour by index: shades of the accent, from full to faint. Never a rainbow. */
export const series = (i: number) => `color-mix(in oklab, ${ACCENT} ${[100, 64, 40, 24, 14][i % 5]}%, var(--muted))`

/** Profit or loss as a soft mark (thin bars, small cells); text uses text-profit / text-loss. */
export const pl = (v: number, strength = 80) => `color-mix(in oklab, ${v >= 0 ? "var(--profit)" : "var(--loss)"} ${strength}%, var(--card))`

/**
 * Motion, the same everywhere (and through Animate UI's provider, so the
 * review modal's Slow and Off apply). One strong ease-out for anything that
 * enters or fills; durations under 300ms for UI, a little longer only where a
 * chart explains itself as it draws. Reduced motion keeps the end state and
 * drops the movement.
 */
export const MOTION = {
  ease: [0.23, 1, 0.32, 1] as const,
  /** Hover, press, small state changes. */
  fast: 0.16,
  /** A card or panel entering. */
  enter: 0.24,
  /** A chart drawing in, a bar or ring filling. */
  draw: 0.45,
} as const


/** The headline figure at 2.5rem once the card is wide (at 1.75rem a figure in a 700px or 1100px card looks lost). */
export const BIG_FIGURE = "[@container_card_(min-width:34rem)]:text-[2.5rem] [@container_card_(min-width:34rem)]:leading-[2.75rem] [@container_card_(min-width:34rem)]:mb-1.5"
