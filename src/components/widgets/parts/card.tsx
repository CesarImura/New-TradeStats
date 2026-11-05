"use client"

import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { motion } from "motion/react"
import { useContext, useLayoutEffect, useRef, useState } from "react"
import { starStyleOf, widgetFinishOf } from "@/lib/theme/types"
import { CoachContext } from "@/components/coach/coach-provider"
import type { LucideIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { WidgetPictureContext, useFrame } from "./frame"
import { MOTION, TEXT, TYPE, type Tone } from "./tokens"

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
 * Card anatomy lives in anatomy.tsx (WCard, Num, Label, Chip) and the signature visuals in
 * visuals.tsx (Legend, TickGauge, TickBar, StepChart, DotStrip, HatchBar, Timeline):
 * every widget uses WCard, and the coach's Widget style (Instrument, Soft,
 * Editorial) decides how it is drawn. Data widgets may use meaning colours in
 * legends and timelines (profit, loss, greys from GREY), never decoration.
 */


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
  // This widget's own picture (widget-scope.tsx): under the card colour, never on a filled Star (a Spotlight Star is a plain card).
  const picture = useContext(WidgetPictureContext)
  const pic = !star && !brand ? picture : null
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
    // A resize is measured at once, and again from everything shown once the card has stopped changing: the first measurement after a
    // resize (a card made narrower, in the editor or in a window) can be taken before its layout has settled and hide parts that fit, and
    // with the size unchanged afterwards nothing would bring them back (a widget taken from 3 columns to 1 lost its stats for good).
    let settle = 0
    const ro = new ResizeObserver(() => {
      fit()
      clearTimeout(settle)
      settle = window.setTimeout(() => {
        size = ""
        fit()
      }, 300)
    })
    ro.observe(card)
    // Charts and pictures settle a moment later, and the coach's fonts load late: measure again then, from everything shown.
    // (The first measurement after a resize can be taken before the layout has settled, and it can hide parts that fit; with the
    // size unchanged nothing would ever bring them back, so these re-measurements start over: shown and hidden in one task, no paint between.)
    const t = setTimeout(() => {
      size = ""
      fit()
    }, 300)
    document.fonts?.ready.then(() => {
      size = ""
      later()
    })
    // New content (a layout or a setting changed) is measured on the next frame.
    const mo = new MutationObserver(later)
    mo.observe(card, { childList: true, subtree: true, characterData: true })
    fit()
    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(t)
      clearTimeout(settle)
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
export function cut(card: HTMLElement) {
  // Boxes are measured on screen, paddings in CSS px: in a scaled view (the Design canvas) CSS px are scaled by k.
  const k = scaleOf(card)
  for (const el of card.querySelectorAll<HTMLElement>("*")) {
    const tag = el.tagName
    const leaf = tag === "svg" || tag === "BUTTON" || tag === "IMG" || tag === "INPUT" || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())
    // An odometer's off-screen digits and a path header's section that does not fit (`data-clip`) are clipped on purpose.
    if (!leaf || el.closest("[data-dropped], [data-rolling] [aria-hidden], [data-clip]")) continue
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
      // A box with no padding (a list that clips its rows) has no padding to keep, so the 2px slack does not apply: only the 1px for rounding below.
      const pad = parseFloat(o.paddingBottom)
      limit = Math.min(limit, b.bottom - k * (box === card ? pad / 2 : pad > 0 ? pad + parseFloat(o.borderBottomWidth) - 2 : parseFloat(o.borderBottomWidth)))
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
