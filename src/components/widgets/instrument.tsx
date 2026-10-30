"use client"

import { Highlight, HighlightItem } from "@animate-ui/react/primitives/effects/highlight"
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number"
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number"
import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { motion, useReducedMotion } from "motion/react"
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { ArrowRight, type LucideIcon } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { chartStyleOf, figureStyleOf, headerFormOf, panelStyleOf, widgetFontOf, widgetHeaderOf, widgetStyleOf, type ChartStyle, type FigureStyle, type PanelStyle, type WidgetFont, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ACCENT, ACCENT_TEXT, AreaFill, CTA, MOTION, TYPE, W, link, useBrokenImage, useFrame, useMore } from "./kit"

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

/** How the headline number is drawn (Design → Look → Widgets → Numbers). */
export function useFigureStyle(): FigureStyle {
  const { theme } = useCoach()
  return figureStyleOf(theme)
}

/** Whether charts and small stats sit on an inner panel (Design → Look → Widgets → Panels). */
export function usePanelStyle(): PanelStyle {
  const { theme } = useCoach()
  return panelStyleOf(theme)
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

/** An empty tick or track: the theme's track step (derive.ts surfaces), always visible against the card and the panel. */
export const TRACK = "var(--w-track, color-mix(in oklab, var(--foreground) 12%, transparent))"
/** A hairline inside a widget. */
export const HAIR = "var(--w-hair, color-mix(in oklab, var(--foreground) 10%, transparent))"
/** The card's own lines: its edge and the rules between header, body and foot. A step stronger than --border. */
export const LINE = "color-mix(in oklab, var(--border), var(--foreground) 6%)"
/** A chart that runs edge to edge of the card body (it cancels the body's side padding): line and step charts have no panel. */
export const BLEED = "-mx-[calc(1rem*var(--density,1))]"
/** A step off the card: the foot band and the header's icon tile. */
export const RAISED = "color-mix(in oklab, var(--muted), var(--foreground) 2%)"

/** Figures, in the widget font; the Numbers setting wins when it names a font (Mono, Display). */
export function useFigureFont() {
  const f = useWidgetFont()
  const fig = useFigureStyle()
  if (fig === "mono") return "var(--font-figures)"
  if (fig === "display") return "var(--font-heading)"
  return f === "mono" ? "var(--font-figures)" : f === "heading" ? "var(--font-heading)" : "var(--coach-font-body, var(--font-sans))"
}

/** Are figures in the mono (Widget font Mono, or Numbers Mono)? Small labels and chips follow. */
export function useMonoFigures() {
  return useFigureFont() === "var(--font-figures)"
}

/** Small label: mono capitals with mono figures, the coach's label style otherwise. */
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  const mono = useMonoFigures()
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
/** Inside a Label header the chip is plain text: the label line carries no pills. */
const PlainChipCtx = createContext(false)

export function Chip({ children, tone = "accent", className }: { children: React.ReactNode; tone?: "accent" | "neutral" | "profit" | "loss" | "warning" | "info"; className?: string }) {
  const s = useWidgetStyle()
  const mono = useMonoFigures()
  const star = useFrame().emphasis === "star"
  const plain = useContext(PlainChipCtx)
  const color = tone === "accent" ? ACCENT : tone === "neutral" ? "var(--foreground)" : `var(--${tone})`
  if (plain)
    return (
      <span
        className={cn("inline-flex shrink-0 items-baseline text-[0.6875rem] leading-4 whitespace-nowrap tabular-nums", className)}
        style={{ color: tone === "neutral" ? "var(--muted-foreground)" : tone === "accent" ? ink(ACCENT_TEXT) : `var(--${tone}-text)`, fontFamily: mono ? "var(--font-figures)" : undefined }}
      >
        {children}
      </span>
    )
  // On its own tint a colour loses contrast, so the text leans toward the text colour (darker on light cards, lighter on dark).
  const base = tone === "accent" ? ACCENT_TEXT : tone === "neutral" ? "var(--muted-foreground)" : color
  // Stronger than ink(): it sits on its own tint.
  const text = `color-mix(in oklab, ${base} ${tone === "neutral" ? 72 : 62}%, var(--foreground))`
  // ReUI Badge: outline for neutral and accent, the "light" tint (fill and border from the colour) for the meaning colours.
  const tinted = tone !== "accent" && tone !== "neutral"
  return (
    <span
      data-slot="badge"
      className={cn("inline-flex h-5 shrink-0 items-center gap-1 border px-1.5 text-[0.6875rem] leading-none font-medium whitespace-nowrap tabular-nums", s === "soft" ? "rounded-full px-2" : "rounded-sm", className)}
      style={{
        background: star ? "var(--brand-shade)" : tinted ? `color-mix(in oklab, ${color} 10%, transparent)` : "var(--card)",
        borderColor: star ? "transparent" : tinted ? `color-mix(in oklab, ${color} 22%, transparent)` : "var(--border)",
        // On a Star card every chip takes the card's own text colour: amber or green on the brand is unreadable.
        color: star ? "inherit" : tinted ? text : tone === "neutral" ? "var(--muted-foreground)" : "var(--foreground)",
        fontFamily: mono ? "var(--font-figures)" : undefined,
      }}
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
    // The coach's label: it gives way with the card and ends in "…" (full label in the tooltip), never past the card.
    <Button variant="outline" size="sm" className={cn("w-fit", CTA, className)} title={note?.button} {...link(href)}>
      <span className="truncate">{note?.button}</span>
    </Button>
  )
}

/** The coach's own picture and text with a button, between a card's header and its body. */
function Note({ inset }: { inset?: boolean }) {
  const { note } = useFrame()
  const href = useNoteHref()
  const text = note?.text?.trim()
  // A picture that fails to load is left out, as if there were none.
  const [broken, onError, ref] = useBrokenImage(note?.image)
  const image = note?.image && !broken
  if (!note || (!image && !text && !href)) return null
  return (
    <div className={cn("flex shrink-0 flex-col gap-2", inset && "px-4 pt-4")}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={note.image} alt="" onError={onError} className="aspect-video max-h-40 w-full rounded-(--radius) object-cover" />
      )}
      {(text || href) && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          {text && <p className={cn(TYPE.body, "line-clamp-2 min-w-0 flex-1 basis-40 text-muted-foreground")}>{text}</p>}
          <NoteButton />
        </div>
      )}
    </div>
  )
}

/**
 * The header's icon: a 20px glyph (Carbon's own grid, so it stays crisp) on a
 * 35px square tile (no taller than the name block) a step off the card, centred on the whole name block (title
 * and context line together). Muted, so the name leads.
 */
function HeadIcon({ icon: Icon }: { icon: LucideIcon }) {
  const star = useFrame().emphasis === "star"
  return (
    <span
      className="flex size-[2.1875rem] shrink-0 items-center justify-center self-center rounded-[max(2px,calc(var(--radius)/3))] border text-muted-foreground"
      style={star ? { borderColor: "transparent", background: "var(--brand-shade)" } : { borderColor: "transparent", background: RAISED }}
      aria-hidden
    >
      <Icon className="size-5" />
    </span>
  )
}

/**
 * The widget card. `title` and `meta` (the grey context line) on the left,
 * `chip` on the right; `crumb` puts a "Section / Title" breadcrumb instead of
 * the icon. `flush` drops the inset body panel (for media and lists that fill
 * the card). The body is a flex column with 12px gaps.
 *
 * `bands`: the widget is built on the base structure (five bands, always in
 * this order: name, number, visual, detail, foot). The body then has no inset
 * of its own (charts sit on a Panel), bands are spaced by the density, and
 * `control` (a Seg) sits in the header, `action` and `footnote` in the foot.
 *
 * Which header parts show (icon, title, description, value chip) follows
 * Design → Look → Widget header, then the widget's own choice (widgetHeaderOf).
 * Where the name sits follows Widget names (headerFormOf): Top, Label,
 * Caption, Tag or Path. With every part off there's no header at all. A
 * one-row card always keeps its title: there it is the content.
 */
export function WCard({
  icon: Icon,
  title,
  meta,
  chip,
  crumb,
  section: sectionProp,
  row,
  bands,
  control,
  action,
  footnote,
  children,
  className,
  bodyClassName,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  meta?: React.ReactNode
  chip?: React.ReactNode
  crumb?: string
  /** The section a Path header names before the title ("Journal / Performance"); defaults to `crumb` or the context line's first part. */
  section?: string
  /** Ignored in the library copy: the panel always keeps its padding. */
  flush?: boolean
  /** One-row layout: header only, the body sits inline on the right. */
  row?: boolean
  /** Built on the five-band base structure (see above). */
  bands?: boolean
  /** A control in the header: period or unit (Seg). */
  control?: React.ReactNode
  /** The foot's action: where this widget leads ("Open journal"). */
  action?: { label: string; href?: string; onClick?: () => void }
  /** The foot's short note, with a square in the accent. */
  footnote?: React.ReactNode
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const s = useWidgetStyle()
  const { emphasis, header, core } = useFrame()
  const { theme, base } = useCoach()
  const h = widgetHeaderOf(theme, header)
  // A one-row card keeps the Top header: there the title is the content.
  const form = row ? "top" : headerFormOf(theme)
  const star = emphasis === "star"
  const showTitle = row || h.title
  // Label, Caption and Path headers carry no icon: the name is type, not a badge. Top and Tag show the bare glyph.
  const showIcon = !!Icon && h.icon && (form === "top" || form === "tag")
  const detailed = useMore("detailed")
  // Less on the card: the context line shows on Detailed (and in a one-row card, where it is the content); otherwise it is the name's tooltip.
  const showMeta = !!meta && h.description && (row || detailed)
  const metaTip = typeof meta === "string" ? meta : undefined
  const showChip = !!chip && h.value
  const empty = !showTitle && !showIcon && !showMeta && !showChip && !control
  // In a one-row card the chip gives way first, so the name and the action keep their room.
  const chipEl = showChip && <span className={cn("hidden shrink-0", row ? "@[30rem]:inline-flex" : "@[14rem]:inline-flex", crumb && "ml-auto")}>{chip}</span>
  const ctrlEl = control && <span className="hidden shrink-0 @[18rem]:inline-flex">{control}</span>
  // Path: the section comes from `crumb`, or the first part of the context line ("Journal · last 20 days" → Journal).
  const metaParts = typeof meta === "string" ? meta.split(" · ") : undefined
  const section = sectionProp ?? crumb ?? (metaParts && metaParts.length > 1 ? metaParts[0] : undefined)
  // The context line never repeats the section the path already names ("Journal / Performance" over "Journal · last 20 days").
  const pathMeta = metaParts && metaParts.length > 1 && (metaParts[0] === section || !(sectionProp || crumb)) ? metaParts.slice(1).join(" · ") : meta
  const titleEl = (big?: boolean) =>
    crumb ? (
      <span className="flex min-w-0 items-baseline gap-1.5 text-[0.8125rem] leading-5">
        {/* A long crumb gives way before the title does. */}
        <span className="min-w-0 shrink-[2] truncate text-muted-foreground">{crumb}</span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          /
        </span>
        <span className="min-w-0 truncate [font-weight:var(--w-title-weight,500)]">{title}</span>
      </span>
    ) : (
      <span title={showMeta ? undefined : metaTip} className={cn("truncate leading-5", big && s === "editorial" ? "font-heading text-[0.8125rem]" : "text-[0.8125rem] [font-weight:var(--w-title-weight,500)]")}>{title}</span>
    )
  let head: React.ReactNode = null
  let foot: React.ReactNode = null
  if (!empty && form === "label") {
    // Label: one quiet line, the name as a small label, the context after it, the value as plain text.
    head = (
      <PlainChipCtx.Provider value>
        <div className="flex min-w-0 items-baseline gap-2 px-4 pt-4">
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
            {/* A long name truncates too, but the context line gives way first. */}
            {showTitle && <Label className="min-w-0 truncate [font-weight:var(--w-title-weight,500)] text-foreground">{crumb ? `${crumb} / ${title}` : title}</Label>}
            {showTitle && showMeta && (
              <span className="shrink-0 text-[0.6875rem] leading-4 text-muted-foreground" aria-hidden>
                ·
              </span>
            )}
            {showMeta && <span className="min-w-0 shrink-[999] truncate text-[0.6875rem] leading-4 text-muted-foreground">{meta}</span>}
          </span>
          {ctrlEl}
          {chipEl}
        </div>
      </PlainChipCtx.Provider>
    )
  } else if (!empty && form === "path") {
    // Path: "Journal / Performance" in small capitals or plain, the value on the right, the context under it, a hairline below.
    head = (
      <div className="grid shrink-0 gap-1 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {showTitle && (
            <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
              {section && (
                <>
                  <Label className="shrink-0">{section}</Label>
                  <Label className="shrink-0" aria-hidden>
                    /
                  </Label>
                </>
              )}
              <Label className="min-w-0 truncate font-medium text-foreground">{title}</Label>
            </span>
          )}
          {!showTitle && <span className="flex-1" />}
          {ctrlEl}
          {chipEl}
        </div>
        {showMeta && pathMeta && <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">{pathMeta}</span>}
      </div>
    )
  } else if (!empty && form === "tag") {
    // Tag: the icon and the name in a pill beside it, the context as a sentence under them.
    head = (
      // The pill row is 24px, so the Tag header keeps its padding and gap tight: it is already the tallest header.
      <div className="grid shrink-0 gap-1 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {showIcon && Icon && <HeadIcon icon={Icon} />}
          {showTitle && (
            <span className="r-chip flex h-6 min-w-0 items-center px-2.5" style={{ boxShadow: `inset 0 0 0 1px ${star ? "var(--border)" : HAIR}` }}>
              <span className="truncate text-[0.8125rem] leading-5 font-medium">{title}</span>
            </span>
          )}
          <span className="flex-1" />
          {ctrlEl}
          {chipEl}
        </div>
        {showMeta && <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">{meta}</span>}
      </div>
    )
  } else if (!empty && form === "caption") {
    // Caption: the content leads; the name sits under it, after a hairline, like a caption. The value is plain text, as in Label.
    foot = (
      <PlainChipCtx.Provider value>
        <div className="flex min-w-0 shrink-0 items-baseline gap-2 px-4 pb-4">
          <span className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
            {showTitle && <span className="flex min-w-0">{titleEl(true)}</span>}
            {showMeta && <span className="min-w-0 shrink-[999] truncate text-[0.6875rem] leading-4 text-muted-foreground">{meta}</span>}
          </span>
          {ctrlEl}
          {chipEl}
        </div>
      </PlainChipCtx.Provider>
    )
  } else if (!empty) {
    head = (
      <div className={cn("flex min-w-0 items-center gap-2", !row && "px-4 pt-4")}>
        {crumb && showTitle ? (
          titleEl()
        ) : (
          <>
            {showIcon && Icon && <HeadIcon icon={Icon} />}
            {/* In a one-row card the name keeps room for itself: the content beside it truncates first. */}
            <span className={cn("grid min-w-0 flex-1", row && "min-w-[5.5rem]")}>
              {showTitle && titleEl(true)}
              {showMeta && <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground">{meta}</span>}
            </span>
          </>
        )}
        {ctrlEl}
        {chipEl}
        {row && children}
        {row && !core && <NoteButton />}
      </div>
    )
  }
  if (row) return <W row className={cn("justify-center", className)}>{head}</W>
  // Band 5: the way out of the widget. The action is a full-width row (label left,
  // the note and an arrow right), inset 8px so it reads as part of the card rather than a link left in a corner.
  // Its look is fixed (a soft fill a step off the card), whatever Design → Chart background says: it is a button, not a chart panel.
  // Without an action, the note is a plain line.
  const actionHref = action?.href && (action.href.startsWith("/") || /^https?:/.test(action.href) ? action.href : `${base}/${action.href}`)
  const note = footnote && detailed ? <span className="min-w-0 shrink-[999] truncate text-[0.6875rem] leading-4 text-muted-foreground">{footnote}</span> : null
  const rowCls =
    "group flex h-8 w-full min-w-0 items-center gap-3 rounded-(--r-inner) px-2 text-left text-[0.8125rem] leading-5 outline-none transition-[box-shadow,scale] hover:shadow-[inset_0_0_0_100vmax_color-mix(in_oklab,var(--foreground)_5%,transparent)] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-(--brand-mark)"
  const rowStyle: React.CSSProperties = { background: star ? "var(--brand-shade)" : RAISED }
  const rowInner = action && (
    <>
      <span className="min-w-0 truncate [font-weight:var(--w-title-weight,500)]">{action.label}</span>
      <span className="flex-1" />
      {note}
      {actionHref && <ArrowRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />}
    </>
  )
  const foot5 =
    bands && (action || note) ? (
      // The foot gives way last when the card is too short (data-drop 1).
      action ? (
        <div data-drop="1" className="flex min-w-0 shrink-0 px-2 pb-2">
          {actionHref ? (
            <Link href={actionHref} className={rowCls} style={rowStyle}>
              {rowInner}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={rowCls} style={rowStyle}>
              {rowInner}
            </button>
          )}
        </div>
      ) : (
        <div data-drop="1" className="flex min-w-0 shrink-0 px-4 pb-4">
          {note}
        </div>
      )
    ) : null
  return (
    <W
      className={cn("gap-0 p-0", className)}
      // Fill, outline or both follow Design → Cards and Borders (W's bg-card and the theme's --card-edge): nothing forced here.
    >
      {head}
      {!core && <Note inset />}
      <div
        data-slot="frame-panel"
        className={cn(
          // Flat on the card: the header and foot rules frame it, no inset panel of its own.
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          bands ? "gap-[calc(1rem*var(--density,1))]" : "gap-3",
          // Always padded, so text never touches the edge; a chart can bleed to the edges with Bleed.
          "p-[calc(1rem*var(--density,1))]",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {foot5}
      {foot}
    </W>
  )
}

/**
 * The headline figure and its change. size: md 20px, lg 28px (40px on a Star).
 * `caption` is the short word after the change ("this week", "of rules kept").
 * Numbers (Design → Look → Widgets) decides the arrangement of a large figure:
 * Plain and Mono keep the change on the same line; Marked puts a bar in the
 * accent beside the figure and stacks the change over the caption; Display
 * puts the change and caption on a line under the figure.
 */
export function Num({ value, unit, delta, deltaTone, caption, size = "lg", className }: { value: React.ReactNode; unit?: string; delta?: React.ReactNode; deltaTone?: "profit" | "loss" | "accent" | "muted"; caption?: React.ReactNode; size?: "md" | "lg"; className?: string }) {
  const { emphasis } = useFrame()
  const font = useFigureFont()
  const fig = useFigureStyle()
  const star = emphasis === "star"
  const cls = size === "lg" ? (star ? TYPE.star : TYPE.valueLg) : star ? TYPE.valueLg : TYPE.value
  const tone = deltaTone === "profit" ? "var(--profit-text)" : deltaTone === "loss" ? "var(--loss-text)" : deltaTone === "muted" ? "var(--muted-foreground)" : ink(ACCENT_TEXT)
  const number = (
    <span className={cn(cls, "min-w-0 tracking-[-0.02em]")} style={{ fontFamily: font }}>
      <Counting value={value} />
      {unit && <span className="ml-1 text-[0.8125rem] font-normal tracking-normal text-muted-foreground">{unit}</span>}
    </span>
  )
  const change = delta !== undefined && (
    <span className="text-[0.8125rem] leading-4 font-medium whitespace-nowrap tabular-nums" style={{ color: tone, fontFamily: font }}>
      {delta}
    </span>
  )
  const word = caption !== undefined && <span className="truncate text-[0.8125rem] leading-4 text-muted-foreground">{caption}</span>
  if (size === "lg" && fig === "marked")
    return (
      <div className={cn("flex min-w-0 flex-wrap items-stretch gap-x-3 gap-y-1", className)}>
        <span className="r-bar w-[3px] shrink-0" style={{ background: ACCENT }} aria-hidden />
        {number}
        {(change || word) && (
          <span className="grid min-w-0 content-center gap-0.5">
            {change}
            {word}
          </span>
        )}
      </div>
    )
  if (size === "lg" && fig === "display")
    return (
      <div className={cn("grid min-w-0 gap-1", className)}>
        {number}
        {(change || word) && (
          <span className="flex min-w-0 items-baseline gap-1.5">
            {change}
            {word}
          </span>
        )}
      </div>
    )
  return (
    <div className={cn("flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {number}
      {change}
      {word}
    </div>
  )
}

/**
 * A live value (P&L that ticks, a countdown) whose digits roll to the next one
 * like an odometer, each on its own, so the ones place moves every second and
 * the rest stays still. Digits are keyed from the right, so a value that gains
 * a digit does not make every place roll. Plain text when motion is reduced.
 */
export function Rolling({ value }: { value: string | number }) {
  const still = useShouldReduceMotion()
  const text = String(value)
  if (still) return <>{text}</>
  const chars = [...text]
  return (
    // The rolling columns hold every digit, so readers and copy get the value from the hidden twin instead.
    <span data-rolling className="relative inline-flex whitespace-pre tabular-nums">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex select-none">
        {chars.map((ch, i) => {
          const key = chars.length - i
          return /\d/.test(ch) ? <SlidingNumber key={key} number={Number(ch)} initiallyStable transition={{ stiffness: 320, damping: 32, mass: 0.4 }} /> : <span key={key}>{ch}</span>
        })}
      </span>
    </span>
  )
}

/**
 * A figure like "+€1,220", "58%" or "1,204" counts to its new value when it
 * changes (never on first show). Anything else (clocks, "3/5", words) is
 * shown as it is. Off when the viewer asks for reduced motion.
 */
function Counting({ value }: { value: React.ReactNode }) {
  // Follows Animate UI's motion settings, so the review modal's Slow ×4 and Off apply to the count too.
  const still = useShouldReduceMotion()
  const transition = useTempoTransition({ type: "tween", duration: 0.25, ease: "easeOut" } as const)
  const m = typeof value === "number" ? ["", "", String(value), ""] : typeof value === "string" ? /^([^\d:/]*?)(\d[\d,]*(?:\.\d+)?)([^\d:/]*)$/.exec(value) : null
  if (!m || still) return <>{value}</>
  const [, pre, num, post] = m
  const decimals = num.includes(".") ? num.split(".")[1].length : 0
  return (
    <>
      {pre}
      <CountingNumber
        number={Number(num.replace(/,/g, ""))}
        decimalPlaces={decimals}
        thousandSeparator={num.includes(",") ? "," : undefined}
        initiallyStable
        transition={transition}
      />
      {post}
    </>
  )
}

/**
 * The inner panel a chart or small stats sit on (Design → Look → Widgets → Panels):
 * Filled is a step off the card, Outline a hairline box, None no box at all.
 * On a Star card the panel is a shade of the brand.
 */
export function Panel({ children, className, pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) {
  const panel = usePanelStyle()
  const star = useFrame().emphasis === "star"
  if (panel === "none") return <div className={cn("flex min-h-0 flex-col", className)}>{children}</div>
  return (
    <div
      className={cn("flex min-h-0 flex-col rounded-(--r-inner)", pad && "p-3", className)}
      style={panel === "filled" ? { background: star ? "var(--brand-shade)" : "var(--w-panel, var(--muted))" } : { boxShadow: `inset 0 0 0 1px ${star ? "var(--border)" : HAIR}` }}
    >
      {children}
    </div>
  )
}

/** Up to three small stats side by side, each on its own panel: a label over a 20px figure, centred. */
export function MiniStats({ items, className }: { items: { label: React.ReactNode; value: React.ReactNode; tone?: "profit" | "loss" | "accent" }[]; className?: string }) {
  const font = useFigureFont()
  const panel = usePanelStyle()
  return (
    // Side by side; in a tall, narrow cell (taller than 5:4) they stack as rows (name left, figure right), which uses the height and reads better than three squeezed tiles.
    <div
      className={cn("grid shrink-0 grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-2 [@container_card_(max-aspect-ratio:4/5)]:grid-cols-1", panel === "none" && "gap-4", className)}
      style={{ "--n": items.length } as React.CSSProperties}
    >
      {items.map((it, i) => (
        <Panel key={i} className={cn("items-center justify-center gap-1 text-center [@container_card_(max-aspect-ratio:4/5)]:flex-row [@container_card_(max-aspect-ratio:4/5)]:text-left [@container_card_(max-aspect-ratio:4/5)]:items-baseline [@container_card_(max-aspect-ratio:4/5)]:justify-between")} pad={panel !== "none"}>
          {/* A long name takes a second line rather than ending in "…" when the tiles are narrow. */}
          <Label className="line-clamp-2">{it.label}</Label>
          <span
            className={cn(TYPE.value, "truncate leading-6")}
            style={{ fontFamily: font, color: it.tone === "profit" ? "var(--profit-text)" : it.tone === "loss" ? "var(--loss-text)" : it.tone === "accent" ? ink(ACCENT_TEXT) : undefined }}
          >
            {it.value}
          </span>
        </Panel>
      ))}
    </div>
  )
}

/** A small segmented control for the header (period, unit): "1W 2W 4W". The selected option is raised on a muted track, and the raise slides to the new option (Animate UI Highlight). */
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  const font = useFigureFont()
  const still = useReducedMotion()
  // Highlight renders different markup on the server and in the browser, so it only takes over once the page is live.
  const live = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const raised = "rounded-[5px] bg-card shadow-[0_1px_2px_0_rgb(0_0_0/0.08)]"
  const button = (v: T, l: string, onClick?: () => void) => (
    <button
      key={v}
      type="button"
      role="radio"
      aria-checked={v === value}
      onClick={onClick}
      className={cn(
        // 20px to see, 24px to hit: the pseudo-element takes the clicks 2px above and below (the track's padding).
        "relative z-[1] h-5 rounded-[5px] px-1.5 text-[0.6875rem] leading-none font-medium tabular-nums transition-colors duration-150 outline-none before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] focus-visible:ring-2 focus-visible:ring-(--brand-mark)",
        v === value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        !live && v === value && raised,
      )}
      style={{ fontFamily: font }}
    >
      {l}
    </button>
  )
  return (
    <span role="radiogroup" aria-label={label} className="inline-flex h-6 shrink-0 items-center gap-0.5 rounded-md p-0.5" style={{ background: "var(--muted)" }}>
      {live ? (
        <Highlight controlledItems value={value} click={false} className={raised} transition={still ? { duration: 0 } : { type: "tween", duration: 0.2, ease: "easeOut" }}>
          {options.map(([v, l]) => (
            // The item owns the click: Highlight replaces the child's own handler.
            <HighlightItem key={v} value={v} onClick={() => onChange(v)}>
              {button(v, l)}
            </HighlightItem>
          ))}
        </Highlight>
      ) : (
        options.map(([v, l]) => button(v, l, () => onChange(v)))
      )}
    </span>
  )
}

/** Legend rows: a square, a label, the value on the right. The packing tool. */
export function Legend({ items, className }: { items: { color?: string; label: React.ReactNode; value?: React.ReactNode; valueTone?: "profit" | "loss" | "accent"; dot?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  const mono = useWidgetStyle() === "instrument"
  return (
    <div data-legend className={cn("grid gap-1.5", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-5" style={mono ? { fontFamily: font } : undefined}>
          {it.color && <span className={cn("size-2 shrink-0", it.dot ? "r-dot" : "rounded-[2px]")} style={{ background: it.color }} />}
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{it.label}</span>
          {it.value !== undefined && (
            <span
              className="shrink-0 tabular-nums"
              style={{ color: it.valueTone === "profit" ? "var(--profit-text)" : it.valueTone === "loss" ? "var(--loss-text)" : it.valueTone === "accent" ? ink(ACCENT_TEXT) : "var(--foreground)", fontFamily: font }}
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
export function Axis({ labels: all, className }: { labels: React.ReactNode[]; className?: string }) {
  const font = useFigureFont()
  // Only the ends until Detailed: the chart says the rest.
  const labels = useMore("detailed") || all.length <= 2 ? all : [all[0], all[all.length - 1]]
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
export function TickGauge({ value, max = 100, ticks = 40, ring, children, className }: { value: number; max?: number; ticks?: number; /** A 270° ring instead of a half circle: for a gauge with room in both directions (the figure then sits in its middle). */ ring?: boolean; children?: React.ReactNode; className?: string }) {
  const style = useChartStyle()
  const still = useShouldReduceMotion()
  const sweep = useTempoTransition({ duration: MOTION.draw + 0.25, ease: MOTION.ease })
  // The arc's geometry: a half circle on its baseline, or a ring open at the bottom.
  const start = ring ? Math.PI * 0.75 : Math.PI
  const span = ring ? Math.PI * 1.5 : Math.PI
  const cy = ring ? 110 : 108
  const at = (t: number) => start + span * t
  const on = Math.round((Math.min(value, max) / max) * ticks)
  const pct = Math.min(Math.max(value, 0), max) / max
  // Solid and thin: one arc with the share in the accent (thin is a hairline with a dot at the end).
  const arc = (from: number, to: number) => {
    const a0 = at(from)
    const a1 = at(to)
    return `M${r2(110 + Math.cos(a0) * 93)} ${r2(cy + Math.sin(a0) * 93)} A93 93 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r2(110 + Math.cos(a1) * 93)} ${r2(cy + Math.sin(a1) * 93)}`
  }
  const w = style === "thin" ? 3 : 13
  // Blocks: a few thick segments; Dots: a row of dots. Both light up to the value, the last lit one in the accent.
  const pieces = style === "blocks" ? 11 : 26
  const litPieces = Math.round(pct * pieces)
  return (
    // A size reference for what sits inside it: a figure in a large gauge can grow with it (cqw).
    <div className={cn("relative mx-auto w-full max-w-60 [container-type:inline-size]", className)}>
      <svg viewBox={ring ? "0 0 220 196" : "0 0 220 116"} className="w-full" aria-hidden>
        {style === "blocks" || style === "dots" ? (
          Array.from({ length: pieces }, (_, i) => {
            const lit = i < litPieces
            const head = lit && i === litPieces - 1
            const fill = !lit ? TRACK : head ? ACCENT : "var(--foreground)"
            const opacity = !lit || head ? 1 : r2(0.4 + (0.45 * i) / Math.max(litPieces, 1))
            if (style === "dots") {
              const a = at(i / (pieces - 1))
              return <circle key={i} cx={r2(110 + Math.cos(a) * 94)} cy={r2(cy + Math.sin(a) * 94)} r={4.2} fill={fill} fillOpacity={opacity} />
            }
            const gap = 0.05
            const a0 = i / pieces + gap / 2 / pieces * 2
            const a1 = (i + 1) / pieces - gap / 2 / pieces * 2
            return <path key={i} d={arc(a0, a1)} fill="none" stroke={fill} strokeOpacity={opacity} strokeWidth={20} style={{ strokeLinecap: "var(--cap)" as never }} />
          })
        ) : style === "ticks" ? (
          Array.from({ length: ticks }, (_, i) => {
            const a = at(i / (ticks - 1))
            const lit = i < on
            const head = lit && i >= on - Math.max(2, Math.round(ticks * 0.12))
            return (
              <line
                key={i}
                x1={r2(110 + Math.cos(a) * 86)}
                y1={r2(cy + Math.sin(a) * 86)}
                x2={r2(110 + Math.cos(a) * 100)}
                y2={r2(cy + Math.sin(a) * 100)}
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
            {/* The value sweeps in along the arc once. */}
            {pct > 0 && <motion.path d={arc(0, pct)} fill="none" stroke={ACCENT} strokeWidth={w} style={{ strokeLinecap: "var(--cap)" as never }} initial={still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={sweep} />}
            {style === "thin" && pct > 0 && (
              <circle cx={r2(110 + Math.cos(at(pct)) * 93)} cy={r2(cy + Math.sin(at(pct)) * 93)} r={5} fill={ACCENT} />
            )}
          </>
        )}
      </svg>
      {/* The figure: in a ring, at its centre; in a half circle, on the baseline, where the open space is. */}
      {children && <div className={cn("absolute inset-x-0 grid justify-items-center gap-[clamp(0.125rem,1cqw,0.5rem)] text-center", ring ? "top-[56%] -translate-y-1/2" : "bottom-0")}>{children}</div>}
    </div>
  )
}

/**
 * A gauge that fits whatever room the card leaves it, on both axes. Where
 * that room is wide and short it is a half circle with the figure on its
 * baseline; where it is roughly square (a tall card, or beside a legend) it
 * becomes a 270° ring with the figure in its middle, so a big gauge is a full
 * shape instead of an arc over a blank band.
 */
export function FitGauge({ value, max = 100, children, className }: { value: number; max?: number; children?: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [ring, setRing] = useState(false)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setRing(el.clientHeight >= 150 && el.clientWidth / el.clientHeight < 1.6))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className={cn("flex aspect-[3/1] min-h-20 flex-1 items-center justify-center [container-type:size]", className)}>
      <TickGauge ring={ring} value={value} max={max} className={ring ? "w-[min(100cqw,110cqh)] max-w-[26rem]" : "w-[min(100cqw,165cqh)] max-w-[26rem]"}>
        {children}
      </TickGauge>
    </div>
  )
}

/**
 * A ring on a track, the figure in its middle: the shape that replaces the
 * half-circle gauge. `parts` run clockwise from the top. It follows Design →
 * Bars and gauges like every gauge and bar: Solid is a band on a hatched
 * track, Thin a fine line with a dot at its end, Ticks a ring of radial
 * ticks, Blocks a ring of short segments, Dots a ring of dots. The ring is
 * square and as large as its box allows; the middle's type scales with it.
 */
export function Donut({ parts, total, children, className, label }: { parts: { value: number; color: string; hatch?: boolean }[]; total: number; children?: React.ReactNode; className?: string; /** For screen readers: what the ring shows. */ label?: string }) {
  const style = useChartStyle()
  const still = useShouldReduceMotion()
  const draw = useTempoTransition({ duration: MOTION.draw + 0.2, ease: MOTION.ease })
  const id = useId().replace(/[^a-z0-9]/gi, "")
  const shares = parts.map((p) => Math.max(0, Math.min(1, p.value / (total || 1))))
  const ends = shares.map((_, i) => shares.slice(0, i + 1).reduce((a, b) => a + b, 0))
  // The part a point of the ring (0 to 1, from the top) belongs to, or undefined on the track.
  const partAt = (t: number) => {
    const i = ends.findIndex((e) => t < e - 1e-6)
    return i >= 0 ? parts[i] : undefined
  }
  const pt = (t: number, rad: number) => [r2(50 + Math.sin(t * 2 * Math.PI) * rad), r2(50 - Math.cos(t * 2 * Math.PI) * rad)]
  let ring: React.ReactNode
  if (style === "ticks" || style === "dots" || style === "blocks") {
    // Discrete marks: each one in its part's colour, or the track's.
    const n = style === "ticks" ? 60 : style === "dots" ? 36 : 20
    ring = (
      <motion.g initial={still ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={draw}>
        {Array.from({ length: n }, (_, k) => {
          const t = (k + 0.5) / n
          const color = partAt(t)?.color ?? TRACK
          if (style === "dots") {
            const [x, y] = pt(t, 44)
            return <circle key={k} cx={x} cy={y} r={2.6} fill={color} />
          }
          if (style === "ticks") {
            const [x1, y1] = pt(t, 47)
            const [x2, y2] = pt(t, 38)
            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
          }
          // Blocks: short arcs with a gap between them.
          const a = k / n + 0.006
          const b = (k + 1) / n - 0.006
          const [x1, y1] = pt(a, 44)
          const [x2, y2] = pt(b, 44)
          return <path key={k} d={`M${x1} ${y1} A44 44 0 0 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={8} />
        })}
      </motion.g>
    )
  } else {
    const thin = style === "thin"
    const w = thin ? 3 : 9 // stroke width, in a 100-unit box
    const rad = 50 - (thin ? 6 : w / 2 + 0.5)
    const c = 2 * Math.PI * rad
    const gap = parts.length > 1 ? 2.2 : 0 // % of the ring between parts
    const last = parts.length - 1
    const tip = pt(ends[last] ?? 0, rad)
    ring = (
      <>
        <defs>
          <pattern id={`h${id}`} width="3.7" height="3.7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" style={{ color: TRACK }}>
            <rect width="1.5" height="3.7" style={{ fill: "currentColor" }} />
          </pattern>
        </defs>
        {/* The rest of the ring: hatched like the empty part of a bar (Solid), or a plain fine line (Thin). */}
        <circle cx="50" cy="50" r={rad} fill="none" stroke={thin ? TRACK : `url(#h${id})`} strokeWidth={w} />
        <g transform="rotate(-90 50 50)">
          {parts.map((p, i) => {
            const share = shares[i]
            // Each part gives up the gap at its end, so parts keep their share and stay apart.
            const len = Math.max(0.01, share * c - (gap / 100) * c)
            if (share <= 0) return null
            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r={rad}
                fill="none"
                stroke={p.hatch ? `url(#h${id})` : p.color}
                strokeWidth={w}
                strokeLinecap={thin ? "round" : "butt"}
                strokeDashoffset={-(ends[i] - share) * c}
                initial={still ? false : { strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${len} ${c}` }}
                transition={{ ...draw, delay: still ? 0 : i * 0.06 }}
              />
            )
          })}
        </g>
        {thin && shares[last] > 0 && <circle cx={tip[0]} cy={tip[1]} r={3.4} fill={parts[last].color} />}
      </>
    )
  }
  return (
    <div role="img" aria-label={label} className={cn("relative aspect-square [container-type:inline-size]", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {ring}
      </svg>
      <div className="absolute inset-[14%] grid place-content-center justify-items-center gap-0.5 text-center">{children}</div>
    </div>
  )
}

/** The figure in a Donut's middle: 20px in a small ring, 28px from a ring of about 11rem. */
export function DonutFigure({ value, caption }: { value: React.ReactNode; caption?: React.ReactNode }) {
  const font = useFigureFont()
  return (
    <>
      <span className="font-heading text-xl leading-7 [font-weight:var(--w-value-weight,500)] tracking-[-0.02em] tabular-nums @[11rem]:text-[1.75rem] @[11rem]:leading-8" style={{ fontFamily: font }}>
        {value}
      </span>
      {caption && <span className="max-w-full truncate text-[0.6875rem] leading-4 text-muted-foreground">{caption}</span>}
    </>
  )
}

/**
 * Rows that explain a ring or a total: the name, its figure, and a thin bar
 * of its share under them (a TickBar, so it follows Bars and gauges). Space between rows, no lines. One row can carry
 * the accent (`on`); the rest are grey, a loss in the loss colour.
 */
export function ShareRows({ rows, className, onFocus }: { rows: { label: React.ReactNode; value: React.ReactNode; share: number; tone?: "accent" | "loss" | "muted"; on?: boolean }[]; className?: string; /** Pointing at a row (undefined when the pointer leaves). */ onFocus?: (i: number | undefined) => void }) {
  const font = useFigureFont()
  return (
    <div className={cn("grid min-w-0 content-center gap-3", className)} onPointerLeave={() => onFocus?.(undefined)}>
      {rows.map((r, i) => {
        const color = r.tone === "loss" ? "var(--loss)" : r.on || r.tone === "accent" ? ACCENT : GREY[1]
        return (
          <div key={i} className="grid min-w-0 gap-1.5" onPointerEnter={() => onFocus?.(i)}>
            <div className="flex min-w-0 items-baseline gap-3 text-[0.8125rem] leading-5">
              <span className={cn("min-w-0 flex-1 truncate", r.on ? "text-foreground" : "text-muted-foreground")}>{r.label}</span>
              <span className="shrink-0 tabular-nums" style={{ fontFamily: font, color: r.tone === "loss" ? "var(--loss-text)" : undefined }}>
                {r.value}
              </span>
            </div>
            {/* The share as a bar in Design → Bars and gauges' style, like every other bar. */}
            <TickBar value={Math.max(0, Math.min(1, r.share)) * 100} segments={30} color={color} height={4} />
          </div>
        )
      })}
    </div>
  )
}

/**
 * Body classes for a ring beside its rows: side by side in any cell wider than
 * tall, stacked (ring on top) in a tall narrow one. The ring sizes to the
 * height in a fixed cell. Put on WCard's bodyClassName; the ring gets RING.
 */
// Wide (two or three columns): the ring and its rows stay together in the middle, the rows no longer than they read well.
export const RING_BODY = "flex-row items-center gap-[clamp(1rem,5cqw,2rem)] [@container_card_(max-aspect-ratio:4/5)]:flex-col [@container_card_(max-aspect-ratio:4/5)]:items-stretch [@container_card_(min-width:40rem)]:justify-center [@container_card_(min-width:40rem)]:gap-12 [@container_card_(min-width:40rem)]:*:max-w-[26rem]"
export const RING = "w-[min(42%,11.5rem)] [@container_card_(min-width:40rem)]:w-[13rem] shrink-0 self-center [@container_card_(min-height:0px)]:max-w-[calc(100cqh-7.5rem)] [@container_card_(max-aspect-ratio:4/5)]:w-[min(66%,12rem)]"

/** A segmented bar: segments up to the value in the accent (or a tone), the rest faint. `now` marks one segment taller. */
/** A bar that fills in once, left to right (a clip, so segments and rounded ends keep their shape); still with reduced motion. */
function useFillIn() {
  const still = useShouldReduceMotion()
  const t = useTempoTransition({ duration: MOTION.draw, ease: MOTION.ease })
  return still ? {} : { initial: { clipPath: "inset(0 100% 0 0)" }, animate: { clipPath: "inset(0 0% 0 0)" }, transition: t }
}

export function TickBar({ value, max = 100, segments = 48, color = ACCENT, mark, now, height = 10, className }: { value: number; max?: number; segments?: number; color?: string; mark?: (i: number) => string | undefined; now?: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const fill = useFillIn()
  if (style === "blocks" || style === "dots") return <BlockBar {...{ value, max, segments, color, mark, now, height, className, dots: style === "dots" }} />
  const on = Math.round((Math.min(Math.max(value, 0), max) / max) * segments)
  const h = style === "thin" ? 3 : style === "solid" ? Math.max(6, height - 2) : height
  // Ticks: separate segments. Solid and thin: the same segments joined into one rounded bar.
  return (
    <motion.div {...fill} className={cn("relative flex items-end", style === "ticks" ? "gap-[2px]" : "r-bar overflow-hidden", className)} style={{ height: style === "ticks" ? height + 6 : h }} aria-hidden>
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
    </motion.div>
  )
}

/**
 * TickBar in Blocks (a quarter as many thick rounded blocks, ref. segmented gauges) or Dots (every segment a small
 * square). `mark` and `now` still speak in the caller's segments; blocks take the mark of their first segment.
 */
function BlockBar({ value, max, segments, color, mark, now, height, className, dots }: { value: number; max: number; segments: number; color: string; mark?: (i: number) => string | undefined; now?: number; height: number; className?: string; dots?: boolean }) {
  const n = dots ? segments : Math.max(6, Math.round(segments / 4))
  const k = segments / n
  const on = Math.round((Math.min(Math.max(value, 0), max) / max) * n)
  const nowAt = now === undefined ? undefined : Math.floor(now / k)
  return (
    <div className={cn("relative flex items-center", dots ? "gap-[2px]" : "gap-1", className)} style={{ height: dots ? undefined : height + 6 }} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const m = mark?.(Math.floor(i * k))
        return (
          <span
            key={i}
            className={cn("flex-1", dots ? "aspect-square max-h-2 rounded-[1.5px]" : "r-bar h-full")}
            style={{ background: nowAt === i ? "var(--foreground)" : (m ?? (i < on ? color : TRACK)), ...(dots && nowAt === i ? { transform: "scale(1.35)" } : {}) }}
          />
        )
      })}
    </div>
  )
}

/** Faint solid hairlines across a 300×110 chart: gridlines are never dotted or dashed. */
export function GridLines() {
  return (
    <g aria-hidden>
      {[12, 37, 62, 87].map((y) => (
        <line key={y} x1={0} x2={300} y1={y} y2={y} stroke="color-mix(in oklab, var(--foreground) 9%, transparent)" strokeWidth={1} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
      ))}
    </g>
  )
}

/**
 * Step lines on hairline gridlines. The first series is the accent with a
 * barely-there tint under it; the others are grey lines. Hover shows the value at a step.
 */
export function StepChart({ series, format = (v) => v.toLocaleString("en"), height = 112, className }: { series: { values: number[]; label?: string; color?: string }[]; format?: (v: number) => string; height?: number; className?: string }) {
  const [hover, setHover] = useState<number>()
  const still = useShouldReduceMotion()
  const draw = useTempoTransition({ duration: MOTION.draw + 0.15, ease: MOTION.ease })
  const all = series.flatMap((s) => s.values)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const n = series[0].values.length
  const x = (i: number) => (i / n) * 300
  const y = (v: number) => 100 - ((v - min) / (max - min || 1)) * 84
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "H" + x(i).toFixed(1) + " V" : "M0 "}${y(v).toFixed(1)}`).join(" ") + ` H300`
  // At rest the marker sits on the latest value (where the series is now); hover moves it.
  const peak = n - 1
  const at = hover ?? peak
  const accent = series[0].color ?? ACCENT
  const keys = (e: React.KeyboardEvent) => {
    const i = hover ?? peak
    const next = e.key === "ArrowRight" ? Math.min(n - 1, i + 1) : e.key === "ArrowLeft" ? Math.max(0, i - 1) : undefined
    if (next === undefined) return
    e.preventDefault()
    setHover(next)
  }
  const left = ((at + 0.5) / n) * 100
  const top = (y(series[0].values[at]) / 110) * 100
  return (
    <div
      tabIndex={0}
      role="img"
      aria-label={`${series[0].label ?? "Series"}: ${format(series[0].values[0])} to ${format(series[0].values[n - 1])}`}
      className={cn("relative rounded-[min(var(--radius),6px)] outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-2 focus-visible:ring-offset-(--card)", className)}
      style={{ height }}
      onPointerLeave={() => setHover(undefined)}
      onKeyDown={keys}
      onBlur={() => setHover(undefined)}
    >
      {/* Draws itself in once, left to right (a clip, so the hairline strokes keep their width). */}
      <motion.svg
        viewBox="0 0 300 110"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
        initial={still ? false : { clipPath: "inset(-10% 100% -10% 0)" }}
        animate={{ clipPath: "inset(-10% 0% -10% 0)" }}
        transition={draw}
      >
        <GridLines />
        <AreaFill d={`${path(series[0].values)} V110 H0 Z`} color={accent} />
        {series.slice(1).map((s, i) => (
          <path key={i} d={path(s.values)} fill="none" stroke={s.color ?? GREY[i + 1]} strokeWidth={1.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        ))}
        {hover !== undefined && <line x1={x(at) + 150 / n} x2={x(at) + 150 / n} y1={0} y2={110} stroke="color-mix(in oklab, var(--foreground) 35%, transparent)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
        <path d={path(series[0].values)} fill="none" stroke={accent} strokeWidth={1.75} vectorEffect="non-scaling-stroke" style={{ strokeLinejoin: "round" }} />
      </motion.svg>
      <div className="absolute inset-0 flex">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="flex-1" onPointerEnter={() => setHover(i)} />
        ))}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute size-2 -translate-1/2 rounded-full transition-[left,top] duration-75"
        style={{ left: `${left}%`, top: `${top}%`, background: accent, boxShadow: `0 0 0 2px var(--card), 0 0 0 5px color-mix(in oklab, ${accent} 18%, transparent)` }}
      />
      {/* Hovered: every series at that step. At rest nothing covers the line: the card's headline already says the value. */}
      {hover !== undefined && (
        <span
          role="tooltip"
          className="pointer-events-none absolute z-20 grid gap-0.5 rounded-[min(var(--radius),8px)] border px-2 py-1.5 whitespace-nowrap tabular-nums shadow-[0_6px_20px_-6px_rgb(0_0_0/0.25),0_1px_2px_rgb(0_0_0/0.06)] duration-100 animate-in fade-in-0 zoom-in-95"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            transform: `translate(${left < 15 ? "-8%" : left > 85 ? "-92%" : "-50%"}, ${top < 33 ? "10px" : "calc(-100% - 10px)"})`,
            background: "var(--popover)",
            borderColor: "var(--border)",
          }}
        >
          {series.map((s, k) => (
            <span key={k} className="flex items-center gap-1.5 text-[0.75rem] leading-4">
              <i className="r-chip size-2 shrink-0" style={{ background: k === 0 ? accent : (s.color ?? GREY[k]) }} />
              <span className="text-muted-foreground">{s.label ?? (k === 0 ? "You" : "Compare")}</span>
              <span className="ml-auto pl-3 font-medium">{format(s.values[at])}</span>
            </span>
          ))}
        </span>
      )}
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
          {/* Nine dots (6px + 2px gap) fill the 80px strip; a taller stack would spill over the axis. */}
          {c.slice(0, 9).map((v, k) => (
            <span key={k} className="r-dot aspect-square w-full max-w-[6px]" style={{ background: split !== undefined && v >= split ? ACCENT : GREY[2], opacity: split !== undefined && v >= split ? 1 : 0.85 }} />
          ))}
          {/* You: a solid line through your column with a ringed dot at its head. */}
          {i === meCol && (
            <>
              <span className="absolute inset-y-1 w-px" style={{ left: `${((i + 0.5) / bins) * 100}%`, background: "var(--foreground)" }} />
              <span className="r-dot absolute top-0.5 size-2 -translate-x-1/2" style={{ left: `${((i + 0.5) / bins) * 100}%`, background: "var(--foreground)", boxShadow: "0 0 0 2px var(--card)" }} />
            </>
          )}
        </div>
      ))}
      {mean !== undefined && <span className="absolute inset-y-0 w-px border-l border-dashed border-[color:color-mix(in_oklab,var(--foreground)_35%,transparent)]" style={{ left: `${((mean - lo) / (hi - lo || 1)) * 100}%` }} />}
    </div>
  )
}

/** A stacked bar with a hatched remainder: done | in progress | what's left. */
export function HatchBar({ parts, total, height = 10, className }: { parts: { value: number; color: string }[]; total: number; height?: number; className?: string }) {
  const style = useChartStyle()
  const fill = useFillIn()
  const used = parts.reduce((a, p) => a + p.value, 0)
  const hatch = style === "ticks" || style === "blocks"
  return (
    // Parts side by side with a hairline gap; what's left is hatched, so "used" and "left" read apart without a legend.
    <motion.div {...fill} className={cn("flex", hatch ? "gap-[3px]" : "gap-[2px]", className)} style={{ height: style === "thin" ? 4 : height }} aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="r-bar" style={{ flex: p.value, background: p.color }} />
      ))}
      {total > used && (
        <span
          className="r-bar"
          style={{ flex: total - used, background: `repeating-linear-gradient(135deg, ${TRACK} 0 2px, transparent 2px ${hatch ? 5 : 6}px)`, boxShadow: `inset 0 0 0 1px ${TRACK}` }}
        />
      )}
    </motion.div>
  )
}

/** A list of times with a coloured dot each: schedules, agendas, releases. */
export function Timeline({ items, className }: { items: { time: string; title: React.ReactNode; value?: React.ReactNode; color?: string; strong?: boolean }[]; className?: string }) {
  const font = useFigureFont()
  return (
    <div className={cn("grid gap-3", className)}>
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-2 text-[0.8125rem] leading-6">
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
  // Blocks are set apart by space, not lines: the rule keeps its place in the flow but draws nothing.
  return <hr aria-hidden className={cn("border-0", className)} />
}
