"use client"

import { Highlight, HighlightItem } from "@animate-ui/react/primitives/effects/highlight"
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number"
import { SlidingNumber } from "@animate-ui/react/primitives/texts/sliding-number"
import { useShouldReduceMotion, useTempoTransition } from "@animate-ui/react/utils/motion"
import { useReducedMotion } from "motion/react"
import { createContext, useContext, useSyncExternalStore } from "react"
import { ArrowRight, type LucideIcon } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { chartStyleOf, figureStyleOf, headerFormOf, panelStyleOf, widgetFontOf, widgetHeaderOf, widgetStyleOf, type ChartStyle, type FigureStyle, type PanelStyle, type WidgetFont, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { link, useFrame, useMore } from "./frame"
import { ACCENT, ACCENT_TEXT, CTA, MOTION, TYPE } from "./tokens"
import { W } from "./card"
import { useBrokenImage } from "./bits"

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
    "group flex h-8 max-lg:h-10 w-full min-w-0 items-center gap-3 rounded-(--r-inner) px-2 text-left text-[0.8125rem] leading-5 outline-none transition-[box-shadow,scale] hover:shadow-[inset_0_0_0_100vmax_color-mix(in_oklab,var(--foreground)_5%,transparent)] duration-150 ease-out active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-(--brand-mark)"
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
  const transition = useTempoTransition({ type: "tween", duration: 0.25, ease: MOTION.ease } as const)
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
        "relative z-[1] h-5 rounded-[5px] px-1.5 text-[0.6875rem] leading-none font-medium tabular-nums transition-colors duration-150 outline-none before:absolute before:inset-x-0 before:-inset-y-0.5 max-lg:before:-inset-y-3 max-lg:before:-inset-x-1 before:content-[''] focus-visible:ring-2 focus-visible:ring-(--brand-mark)",
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
        <Highlight controlledItems value={value} click={false} className={raised} transition={still ? { duration: 0 } : { type: "tween", duration: 0.2, ease: MOTION.ease }}>
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
