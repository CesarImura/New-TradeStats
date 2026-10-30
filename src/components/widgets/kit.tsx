"use client"

import Link from "next/link"
import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { motion } from "motion/react"
import { createContext, useContext, useId, useLayoutEffect, useRef, useState } from "react"
import { starStyleOf, widgetFinishOf, type WidgetHeader } from "@/lib/theme/types"
import { CoachContext } from "@/components/coach/coach-provider"
import type { WidgetNote } from "@/lib/widgets/layout"
import type { LucideIcon } from "@/components/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
 *
 * Card anatomy and signature visuals live in instrument.tsx (WCard, Num,
 * Legend, Chip, TickGauge, TickBar, StepChart, DotStrip, HatchBar, Timeline):
 * every widget uses WCard, and the coach's Widget style (Instrument, Soft,
 * Editorial) decides how it is drawn. Data widgets may use meaning colours in
 * legends and timelines (profit, loss, greys from GREY), never decoration.
 */

export type Emphasis = "quiet" | "accent" | "star"
export type Detail = "compact" | "standard" | "detailed"
/** The picture behind one widget's card and how much the card colour covers it (widget-scope.tsx sets it, W draws it). */
export type WidgetPicture = { style: React.CSSProperties; dim: number }
export const WidgetPictureContext = createContext<WidgetPicture | null>(null)

const FrameCtx = createContext<{ emphasis: Emphasis; detail: Detail; header?: Partial<WidgetHeader>; note?: WidgetNote; core?: boolean; fixed?: boolean }>({ emphasis: "accent", detail: "standard" })

/** Wraps one placed widget with its Emphasis, Detail, own header parts and own content (note). `core`: the page's own tool, which takes no note. */
export function WidgetFrame({
  emphasis = "accent",
  detail = "standard",
  header,
  note,
  core,
  fixed,
  live,
  children,
}: {
  emphasis?: Emphasis
  detail?: Detail
  header?: Partial<WidgetHeader>
  note?: WidgetNote
  core?: boolean
  /**
   * The cell gives the widget its height (the builder, the desktop grid), not its content (the library, phones).
   * Only then can the card be a size container: its shape (wide, tall) and its height can steer the layout.
   */
  fixed?: boolean
  /** On the student's own pages links navigate and forms submit; everywhere else (library, thumbnails, the editor) they stay inert. */
  live?: boolean
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const shown = useFitDetail(detail, box)
  return (
    <FrameCtx.Provider value={{ emphasis, detail: shown, header, note, core, fixed }}>
      {/* Outside the live page widgets show interactions only: links and buttons keep hover, focus and press, but never leave the page. */}
      <div ref={box} className="contents [&_:is(button,a[href],[role=button],summary):not(:disabled)]:cursor-pointer" onClickCapture={live ? undefined : stayOnPage} onSubmitCapture={live ? undefined : (e) => e.preventDefault()}>
        {children}
      </div>
    </FrameCtx.Provider>
  )
}

const LEVELS: Detail[] = ["compact", "standard", "detailed"]

/**
 * The Detail a widget actually shows. When the card is too short for the
 * chosen level even after its optional parts gave way (useDropToFit), it
 * steps down one level at a time (Detailed → Standard → Compact) rather than
 * cut anything; when the card grows, it tries the chosen level again. The
 * card carries `data-detail-shown` while it shows less than was chosen, so
 * the builder can say why.
 */
function useFitDetail(detail: Detail, box: React.RefObject<HTMLDivElement | null>) {
  const [chosen, setChosen] = useState(detail)
  const [shown, setShown] = useState(detail)
  // A new choice starts over from that level (adjusting state while rendering, as React recommends).
  if (chosen !== detail) {
    setChosen(detail)
    setShown(detail)
  }
  useLayoutEffect(() => {
    const card = box.current?.querySelector<HTMLElement>("[data-slot=widget]")
    if (!card) return
    if (shown !== detail) card.dataset.detailShown = shown
    else delete card.dataset.detailShown
    const w = card.clientWidth
    const h = card.clientHeight
    const step = () => {
      const i = LEVELS.indexOf(shown)
      if (i > 0 && cut(card)) setShown(LEVELS[i - 1])
    }
    // Measured once things settle: lists pick their row count and parts give way first, so a level is only
    // dropped when that wasn't enough. A bigger card gets the chosen level back; a smaller one is checked again.
    let t = setTimeout(step, 250)
    const ro = new ResizeObserver(() => {
      if (shown !== detail && (card.clientHeight > h + 1 || card.clientWidth > w + 1)) return setShown(detail)
      clearTimeout(t)
      t = setTimeout(step, 250)
    })
    ro.observe(card)
    return () => {
      clearTimeout(t)
      ro.disconnect()
    }
  }, [shown, detail, box])
  return shown
}

/** Cancels a link's navigation before Next's Link or the browser acts on it (both skip a prevented click). */
function stayOnPage(e: React.MouseEvent) {
  if ((e.target as Element).closest("a[href]")) e.preventDefault()
}

/** Props that turn a Button into a link: inside the app for a path, a new tab for a web address. */
export const link = (p: string) => ({ nativeButton: false as const, render: /^(https?:|mailto:)/.test(p) ? <a href={p} target="_blank" rel="noreferrer" /> : <Link href={p} /> })
export const useFrame = () => useContext(FrameCtx)
/** True from the given detail level up: `useMore("detailed")` is only true on Detailed. */
export function useMore(level: Detail = "standard") {
  const { detail } = useFrame()
  const rank = { compact: 0, standard: 1, detailed: 2 }
  return rank[detail] >= rank[level]
}

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
const TEXT: Record<Tone, string> = {
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
 * The card every widget sits in. Emphasis comes from the WidgetFrame: Quiet
 * swaps the accent for the text colour; Star puts the card on the coach's
 * colour (the contents re-tint, see .fx-hero). `brand` forces Star.
 */
export function W({ children, className, style, brand, row }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; brand?: boolean; /** A one-row layout: tighter top and bottom padding, so it fits 56px on every spacing setting. */ row?: boolean }) {
  const { emphasis, fixed } = useFrame()
  const theme = useContext(CoachContext)?.theme
  const starred = brand || emphasis === "star"
  // Spotlight Star (the default, Design → Look → Widgets): a plain card, the figure at Star size, the brand on its marks,
  // the usual card edge. Only Brand and Inverted fill the card.
  const spotlight = starred && !brand && (!theme || starStyleOf(theme) === "spotlight")
  const star = starred && !spotlight
  // Inverted Star: the text colour as the card, the brand only as the one mark.
  const inverted = star && !brand && !!theme && starStyleOf(theme) === "inverted"
  const corners = !!theme && widgetFinishOf(theme) === "corners" && !row
  // This widget's own picture (widget-scope.tsx): under the card colour, never on a Star.
  const picture = useContext(WidgetPictureContext)
  const pic = !starred ? picture : null
  const ref = useRef<HTMLDivElement>(null)
  useDropToFit(ref)
  // The card settles in once when it appears (a short rise and fade); with reduced motion it only fades.
  const still = useShouldReduceMotion()
  const enter = useTempoTransition({ duration: MOTION.enter, ease: MOTION.ease })
  return (
    <motion.div
      ref={ref}
      initial={still ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={enter}
      data-slot="widget"
      data-emphasis={starred ? "star" : emphasis}
      data-spotlight={spotlight || undefined}
      className={cn(
        // The card is the container its contents ask about, named "card": by width always, by shape and height when its cell sets the height.
        fixed ? "[container:card/size]" : "@container/card",
        "relative flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-(--radius) p-[calc(1rem*var(--density,1))]",
        row && "py-2",
        star ? "fx-hero" : "bg-card text-card-foreground",
        pic && "isolate",
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
                "--profit-text": "var(--on)",
                "--loss-text": "var(--on)",
                // Chips, avatars and pictures sit on shades away from the text colour, so they keep contrast.
                "--muted": "var(--brand-shade)",
                "--background": "var(--brand-shade)",
                // Outline buttons fill with --input on dark pages: a shade of the brand keeps their text readable.
                "--input": "var(--brand-deep)",
                "--cover-bg": "var(--brand-deep)",
                "--cover-fg": "var(--on)",
                "--media-bg": "var(--brand-deep)",
                "--media-fg": "var(--on)",
                background: "var(--brand)",
                ...(inverted
                  ? {
                      "--brand": "var(--inv-bg)",
                      "--on-brand": "var(--inv-fg)",
                      "--w-accent": "var(--inv-accent)",
                      "--brand-shade": "color-mix(in oklab, var(--inv-bg) 88%, var(--inv-fg))",
                      "--brand-deep": "color-mix(in oklab, var(--inv-bg) 74%, var(--inv-fg))",
                    }
                  : {}),
              }
            : {
                // Pictures and covers: a dark panel in both modes (inverting it on a dark page makes it glare), the text colour that reads on it.
                "--media-bg": "light-dark(color-mix(in oklab, var(--foreground) 90%, var(--background)), color-mix(in oklab, var(--foreground) 10%, var(--background)))",
                "--media-fg": "light-dark(var(--background), var(--foreground))",
                ...(emphasis === "quiet" ? { "--w-accent": "var(--foreground)", "--w-accent-text": "var(--foreground)" } : {}),
                // Spotlight: parts that sit on a brand shade on a filled Star (chips, the icon tile, panels) take the card's own shades.
                // Its edge is every card's (Outline on cards): the Star size of its figure and its brand marks say it is the one Star.
                ...(spotlight ? { "--brand-shade": "var(--muted)", "--brand-deep": "var(--muted)" } : {}),
                // On a picture, secondary text moves toward the text colour: the picture under the card colour can shift the ground.
                ...(pic ? { "--muted-foreground": "color-mix(in oklab, var(--card-foreground) 80%, var(--card))" } : {}),
              }),
          ...style,
        } as React.CSSProperties
      }
    >
      {pic && (
        <span aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <span className="absolute inset-0" style={pic.style} />
          <span className="absolute inset-0 bg-card" style={{ opacity: pic.dim / 100 }} />
        </span>
      )}
      {children}
      {corners && <Corners />}
    </motion.div>
  )
}

/**
 * Height, the same rule in every widget: when the card is too short for
 * everything, the parts marked `data-drop` give way one at a time, the highest
 * number first (3: a legend or second stat, 2: a secondary block, 1: the
 * footer), until nothing is cut through the middle. When the card grows they
 * all come back and the check runs again. Width is handled with container
 * queries; height can't be, because in the library and on phones a card is
 * as tall as its content.
 */
function useDropToFit(ref: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const card = ref.current
    if (!card) return
    let size = ""
    let frame = 0
    const fit = () => {
      const drops = [...card.querySelectorAll<HTMLElement>("[data-drop]")].filter((d) => d.closest("[data-slot=widget]") === card)
      if (!drops.length) return
      // A new size: everything comes back and gets measured again.
      const now = `${card.clientWidth}x${card.clientHeight}`
      if (now !== size) drops.forEach(show)
      size = now
      drops.sort((a, b) => Number(b.dataset.drop) - Number(a.dataset.drop))
      for (const d of drops) {
        if (!cut(card)) break
        hide(d)
      }
      size = `${card.clientWidth}x${card.clientHeight}`
    }
    const later = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(card)
    // Charts and pictures settle a moment later, and the coach's fonts load late: measure again then.
    const t = setTimeout(fit, 300)
    document.fonts?.ready.then(later)
    // New content (a layout or a setting changed) is measured on the next frame.
    const mo = new MutationObserver(later)
    mo.observe(card, { childList: true, subtree: true, characterData: true })
    fit()
    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(t)
    }
  }, [ref])
}

/** On-screen px per CSS px for an element (below 1 inside a scaled preview such as the Design canvas). */
const scaleOf = (el: HTMLElement) => (el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1) || 1

/** Drop parts are ours alone (no React style on them), so they are hidden inline. */
const hide = (d: HTMLElement) => {
  d.setAttribute("data-dropped", "")
  d.style.display = "none"
}
const show = (d: HTMLElement) => {
  d.removeAttribute("data-dropped")
  d.style.removeProperty("display")
}

/**
 * Is anything in the card cut off at the bottom? Text, icons, charts and
 * controls are checked against the box that clips them. Lists that scroll,
 * and rows a Fit list wraps out of sight to the side, don't count.
 */
function cut(card: HTMLElement) {
  // Boxes are measured on screen, paddings in CSS px: in a scaled view (the Design canvas) CSS px are scaled by k.
  const k = scaleOf(card)
  for (const el of card.querySelectorAll<HTMLElement>("*")) {
    const tag = el.tagName
    const leaf = tag === "svg" || tag === "BUTTON" || tag === "IMG" || tag === "INPUT" || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())
    // An odometer's off-screen digits are clipped on purpose.
    if (!leaf || el.closest("[data-dropped], [data-rolling] [aria-hidden]")) continue
    const r = el.getBoundingClientRect()
    if (r.height < 1 || r.width < 1) continue
    // Every box that clips it, up to the card: it must fit inside all of them. A list that scrolls is fine as it is.
    let limit = Infinity
    let right = Infinity
    let scrolls = false
    for (let box: HTMLElement | null = el.parentElement; box; box = box === card ? null : box.parentElement) {
      const o = getComputedStyle(box)
      if (o.overflowY === "auto" || o.overflowY === "scroll") {
        scrolls = true
        break
      }
      if (o.overflowY === "visible" && o.overflowX === "visible") continue
      const b = box.getBoundingClientRect()
      // The card may lend half its bottom padding; an inner panel keeps its padding (2px slack, as the overflow rule allows).
      limit = Math.min(limit, b.bottom - k * (box === card ? parseFloat(o.paddingBottom) / 2 : parseFloat(o.paddingBottom) + parseFloat(o.borderBottomWidth) - 2))
      right = Math.min(right, b.right)
    }
    // Rows a Fit list wraps out of sight sit to the right of its box.
    if (scrolls || r.left >= right - k) continue
    if (r.bottom > limit + k) return true
  }
  return false
}

/**
 * How many rows fit, for tables and lists that page or count: a taller card
 * shows more rows, a shorter one fewer, and the rest go to the next page or
 * "+N more". `undefined` until measured (use the Detail default then). The
 * element should be `min-h-0 flex-1` and hold the rows (`item` selects them).
 * It looks at what is actually on screen: rows cut off by the card mean fewer,
 * free room under the last row means more. So where a card is as tall as its
 * content (library, phones) nothing changes, and nothing feeds back on itself.
 */
export function useFitRows<T extends HTMLElement>(row: number, { min = 1, item }: { min?: number; /** The rows, as a selector inside the element. */ item: string }) {
  const ref = useRef<T>(null)
  const [n, setN] = useState<number>()
  const check = useRef<() => void>(undefined)
  // After every render too: rows of a new page or sort can be taller or shorter.
  useLayoutEffect(() => check.current?.())
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const rows = [...el.querySelectorAll<HTMLElement>(item)]
      if (!rows.length) return
      // The bottom of what can be seen: the element and every box above it that clips, up to the card.
      let limit = Infinity
      for (let box: HTMLElement | null = el; box; box = box.dataset.slot === "widget" ? null : box.parentElement) {
        const o = getComputedStyle(box)
        if (o.overflowY !== "visible") limit = Math.min(limit, box.getBoundingClientRect().bottom)
      }
      const shown = rows.filter((r) => r.getBoundingClientRect().bottom <= limit + 1).length
      if (shown < rows.length) return setN(Math.max(min, shown))
      const last = rows[rows.length - 1].getBoundingClientRect()
      const h = rows[0].getBoundingClientRect().height || row
      const more = Math.floor((Math.min(limit, el.getBoundingClientRect().bottom) - last.bottom + 1) / h)
      // More room than rows: ask for more, unless the list already ran out of rows to show.
      if (more > 0) setN((x) => (x !== undefined && rows.length < x ? x : rows.length + more))
    }
    check.current = fit
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [row, min, item])
  return [ref, n] as const
}

/**
 * A paragraph clamped to `lines`, that in a cell setting the height takes the
 * room left over (flex-1) and shows as many whole lines as fit there: a tall
 * card reads more of the text instead of a blank band under two lines, a
 * short one ends on a whole line.
 */
export function FitText({ lines, className, children }: { lines: number; className?: string; children: React.ReactNode }) {
  const { fixed } = useFrame()
  const ref = useRef<HTMLParagraphElement>(null)
  const [n, setN] = useState(lines)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !fixed) return setN(lines)
    const ro = new ResizeObserver(() => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 20
      // Never a cut line: as many whole lines as the box holds (at least one; a box too short for one makes the card drop it).
      setN(Math.max(1, Math.floor((el.clientHeight + 1) / lh)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fixed, lines])
  return (
    <p ref={ref} className={cn("overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical]", fixed && "min-h-[1lh] flex-1", className)} style={{ WebkitLineClamp: n }}>
      {children}
    </p>
  )
}

/**
 * A part that may give way when the card is too short (see useDropToFit).
 * The convention: 3 for what only Detailed adds, 2 for what Standard adds
 * over Compact, 1 for the foot; under 1 for the tiles of a grid, so the last
 * tiles go after everything else (`tileDrop(i)`). It takes no room of its own
 * (display: contents).
 */
export function Drop({ level = 3, children }: { level?: number; children: React.ReactNode }) {
  return (
    // A span, so it is valid anywhere (in a line of text too); display: contents lets its children lay out as before.
    <span data-drop={level} className="contents">
      {children}
    </span>
  )
}

/** A grid tile's drop level: below every part, the last tile first, so a short card shows whole tiles from the start. */
export const tileDrop = (i: number) => 0.5 + i / 100

/**
 * Widget finish Corners: four small brackets at the widget's corners, in a
 * strong hairline. They follow Corners (Design → Shape): on a round card each
 * bracket is the corner's own curve, as long as the radius and at least 10px.
 */
function Corners() {
  const c = "pointer-events-none absolute size-[max(0.625rem,var(--radius))] border-[color:color-mix(in_oklab,var(--foreground)_45%,transparent)]"
  return (
    <>
      <span aria-hidden data-corner className={cn(c, "top-0 left-0 rounded-tl-(--radius) border-t-[1.5px] border-l-[1.5px]")} />
      <span aria-hidden data-corner className={cn(c, "top-0 right-0 rounded-tr-(--radius) border-t-[1.5px] border-r-[1.5px]")} />
      <span aria-hidden data-corner className={cn(c, "bottom-0 left-0 rounded-bl-(--radius) border-b-[1.5px] border-l-[1.5px]")} />
      <span aria-hidden data-corner className={cn(c, "right-0 bottom-0 rounded-br-(--radius) border-r-[1.5px] border-b-[1.5px]")} />
    </>
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

/** A label over a value, for rows of two or three small stats. */
export function Stat({ label, value, sub, tone = "fg" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: Tone }) {
  return (
    <div className="grid min-w-0 gap-1">
      <Caps className="truncate">{label}</Caps>
      <span className={cn("truncate text-xl leading-7 font-medium tracking-tight tabular-nums", TEXT[tone])}>{value}</span>
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
    <div className={cn("flex min-w-0 items-center gap-2.5 border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1.5", me && "-mx-1.5 rounded-[min(var(--radius),6px)] border-transparent bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] px-1.5", className)}>
      {rank !== undefined && <span className={cn("w-4 shrink-0 text-right text-[0.6875rem] tabular-nums", me ? "font-medium text-foreground" : "text-muted-foreground")}>{rank}</span>}
      {avatar}
      <span className="grid min-w-0 flex-1">
        <span className={cn(TYPE.body, "truncate", me && "font-medium")}>{title}</span>
        {sub && <span className={cn(TYPE.small, "truncate")}>{sub}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-[0.8125rem] tabular-nums">{value}</span>}
    </div>
  )
}

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

const num = (v: number) => v.toLocaleString("en")
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

