"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Check, ChevronRight, Copy, EyeOff, ImagePlus, Lock, Plus, RotateCcw, Search, Trash2, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fitWidth, getWidget, heightFor, librarySections, lookOf, pageWidth, styleParts, widthsFor, type WidgetDef } from "@/components/widgets/registry"
import { WidgetFrame } from "@/components/widgets/kit"
import { DataModeProvider } from "@/components/widgets/shared"
import { useGroups } from "@/lib/data/access"
import type { Coach } from "@/lib/data/coaches"
import { pictureFrom } from "@/lib/images"
import { COLS, ROW_HEIGHT, type Detail, type Emphasis, type PageId, type WidgetInstance, type WidgetNote, type WidgetOwnStyle, type WidgetPhase } from "@/lib/widgets/layout"
import { BACKDROPS, MIN_WIDGET_DIM, widgetDimOf } from "@/lib/theme/backdrops"
import { cn } from "@/lib/utils"
import { Field, Segmented, SliderField } from "./controls"
import { useDesign } from "./design-fields"
import { HeaderParts } from "./header-parts"
import { chartStyleOf, figureStyleOf, headerFormOf, widgetFontOf, widgetHeaderOf, widgetSetOf, type CardSurface, type ChartStyle, type FigureStyle, type HeaderForm } from "@/lib/theme/types"
import { CARD, CARD_IDLE, CARD_ON, EASE, card, chip as chipState } from "./states"

/** Per-widget Emphasis and Detail (see the rules in widgets/kit.tsx). Shared with the grid's right-click menu. */
export const EMPHASIS: { value: Emphasis; label: string; hint: string }[] = [
  { value: "quiet", label: "Quiet", hint: "No colour. Sits back so other widgets stand out." },
  { value: "accent", label: "Accent", hint: "One mark in your brand colour." },
  { value: "star", label: "Star", hint: "On your brand colour, bigger numbers. One per page." },
]
export const DETAIL: { value: Detail; label: string; hint: string }[] = [
  { value: "compact", label: "Compact", hint: "Just the headline number or item." },
  { value: "standard", label: "Standard", hint: "The headline plus its main context." },
  { value: "detailed", label: "Detailed", hint: "Everything this widget can show." },
]

/** Page widths (grid columns, see PAGE_WIDTHS) and what each does on every screen. Shared with the grid's right-click menu. */
export const WIDTH: { value: number; label: string; hint: string }[] = [
  { value: 4, label: "One column", hint: "Desktop: a third of the page. Tablet: half (the full width when the side menu leaves room for one column). Phone: the full width." },
  { value: 8, label: "Two columns", hint: "Desktop: two thirds, the next widgets beside and under it. Tablet: like One column. Phone: the full width." },
  { value: COLS, label: "Full width", hint: "The whole page on every screen." },
]

/** Visibility rules: the phases of a student's life a widget can be limited to. */
export const PHASE_LABEL: Record<WidgetPhase, string> = { "first-week": "First week", inactive: "Inactive", finished: "Finished a course" }
const PHASES: { value: WidgetPhase | ""; label: string }[] = [
  { value: "", label: "Everyone" },
  { value: "first-week", label: "Their first week" },
  { value: "inactive", label: "Inactive students" },
  { value: "finished", label: "Finished a course" },
]

/** Where a widget's own button can lead: the pages the banner offers, plus any web address. */
function noteTargets() {
  const t = getWidget("banner")?.settings?.find((s) => s.key === "target")
  const pages = t?.type === "select" ? t.options : [{ value: "courses", label: "Courses" }]
  return [...pages, { value: "url", label: "A web address" }]
}

/** Upload a picture: a thumbnail, Upload or Replace, and Remove. An empty value means the widget's sample picture. */
function PictureUpload({ value, onChange, label = "picture" }: { value?: string; onChange: (dataUrl: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-10 w-16 shrink-0 rounded-md border object-cover" />
      ) : (
        <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md border border-dashed text-muted-foreground">
          <ImagePlus className="size-4" />
        </span>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          {value ? "Replace" : `Upload ${label}`}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (!f) return
          try {
            // Scaled down so saved pages stay small.
            onChange(await pictureFrom(f, { max: 960 }))
          } catch (err) {
            toast.error((err as Error).message)
          }
        }}
      />
    </div>
  )
}

const MODULE_LABEL = { courses: "Courses", calendar: "Calendar", charts: "Charts", community: "Community", journal: "Journal", ranking: "Ranking", ai: "AI assistant", downloads: "Downloads", partners: "Partners" }

/** Size of one column and one gap on the 1180px desktop canvas, for thumbnails. */
const COL_PX = 72
const GAP_PX = 24

/**
 * A widget drawn small, in the coach's draft design and with sample data: laid out at the size it gets on the page
 * by default, then scaled down so the whole widget fits. `fill` (the gallery and layouts): laid out at its narrowest
 * page width and scaled to the full width of the box, measured, so its text stays readable; every box is `box.h`
 * tall, a short widget sits in its middle and a tall one is cut at the bottom and fades out.
 */
export function WidgetThumb({ def, variant, canvasClass, box, header, fill }: { def: WidgetDef; variant?: string; canvasClass: string; box: { w: number; h: number }; header?: WidgetInstance["header"]; fill?: boolean }) {
  const look = lookOf(def, variant)
  const [boxW, setBoxW] = useState(box.w)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!fill || !el) return
    const ro = new ResizeObserver(() => el.clientWidth && setBoxW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [fill])
  const cols = fill ? widthsFor(def, look.value)[0] : def.defaultW
  const width = cols * COL_PX + (cols - 1) * GAP_PX
  const height = look.h * ROW_HEIGHT + (look.h - 1) * GAP_PX
  const pad = fill ? 20 : 16
  const scale = fill ? (boxW - pad) / width : Math.min((box.w - pad) / width, (box.h - pad) / height)
  const tall = fill && height * scale + pad > box.h
  const C = def.Component
  return (
    <div
      ref={ref}
      className={cn("grid overflow-hidden bg-muted/50", fill ? (tall ? "content-start justify-center pt-2.5" : "content-center justify-center") : "place-items-center")}
      style={{ height: box.h, maskImage: tall ? "linear-gradient(to bottom, #000 72%, transparent)" : undefined }}
      aria-hidden
      inert
    >
      <DataModeProvider value="sample">
        <div
          className={cn(canvasClass, "pointer-events-none flex flex-col bg-background font-sans text-foreground select-none [&>*]:flex-1")}
          style={{ width, height, zoom: scale, containerType: "inline-size" }}
        >
          {/* Library and layout thumbnails show the default Emphasis and Detail; a layout thumbnail shows the widget's own header. */}
          <WidgetFrame header={header}>
            <C variant={look.value} props={{}} />
          </WidgetFrame>
        </div>
      </DataModeProvider>
    </div>
  )
}

/** One line per widget for the gallery: what it is, no more. The registry's description stays the long one. */
const SHORT: Record<string, string> = {
  "page-header": "Page title and intro",
  "continue-lesson": "The next lesson to watch",
  "course-progress": "Progress in every course",
  "next-live": "The next live session",
  "econ-news": "Market events this week",
  "journal-pnl": "Results from the journal",
  "rules-followed": "How well your rules are kept",
  "first-week": "A new member's first steps",
  "my-rank": "Place on your leaderboard",
  announcement: "Your newest announcement",
  "community-feed": "Newest posts from your feed",
  discord: "Invite to your Discord",
  "welcome-video": "A personal message from you",
  banner: "A headline with a button",
  text: "A heading and a paragraph",
  image: "A picture, with a caption",
  button: "One call to action",
  embed: "A video or page from elsewhere",
  hero: "A big picture with a headline",
  faq: "Questions and answers",
  links: "A list of links",
  countdown: "Counts down to a date",
  "partner-links": "Brokers and tools you recommend",
  "latest-downloads": "The newest files",
  "ai-ask": "Ask your AI assistant",
  "book-call": "Book a call with you",
  drawdown: "Distance to the loss limits",
  "coach-feedback": "Trade reviews",
  upgrade: "Their tier and the next one",
  "coach-profile": "Your photo and socials",
}
export const shortOf = (d: WidgetDef) => SHORT[d.type] ?? d.description.split(/,|:| e\.g\./)[0]

/** The one card for a widget's thumbnail (gallery, layouts): the thumbnail inset in the card, its name, and a short line. */
function ThumbCard({
  thumb,
  title,
  meta,
  sub,
  chevron,
  selected,
  off,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { thumb: React.ReactNode; title: string; meta?: React.ReactNode; sub?: string; chevron?: boolean; selected?: boolean; off?: boolean }) {
  return (
    <div
      {...rest}
      className={cn(
        "group/card grid gap-1.5 rounded-xl p-1.5 text-left",
        CARD,
        "rounded-xl",
        off ? "opacity-55 active:scale-100" : cn("cursor-pointer", selected ? CARD_ON : CARD_IDLE),
        className,
      )}
    >
      <div className="overflow-hidden rounded-lg">{thumb}</div>
      <div className="grid gap-0.5 px-1.5 pb-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium">{title}</span>
          {meta && <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">{meta}</span>}
          {chevron && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover/card:translate-x-0.5" />}
        </span>
        {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}

/** Width as pictures: the page's three columns, with the ones the widget takes filled. Widths the layout can't take are off. */
export function SizePicker({ value, allowed, onChange, expanded }: { value: number; allowed: number[]; onChange: (w: number) => void; expanded?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Width" className="grid grid-cols-3 gap-2">
      {WIDTH.map((o) => {
        const on = value === o.value
        const ok = allowed.includes(o.value)
        const span = o.value / 4
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!ok}
            title={ok ? o.hint : "This layout can't take this width"}
            onClick={() => onChange(o.value)}
            className={cn(
              "grid gap-1.5 p-2 text-left disabled:opacity-40 disabled:active:scale-100",
              card(on),
            )}
          >
            <span aria-hidden className="grid h-6 grid-cols-3 gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className={cn("rounded-[3px] transition-colors duration-150", i < span ? (on ? "bg-[var(--ts-interactive)]" : "bg-muted-foreground/60") : "border border-dashed border-muted-foreground/40")} />
              ))}
            </span>
            <span className="text-[0.6875rem] leading-tight font-medium">{o.value === 8 && expanded ? "Two cols (full)" : o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** The widths the widget can take, as small icons, for the dark bar under a selected widget on the page. */
export function SizeIcons({ value, allowed, onChange }: { value: number; allowed: number[]; onChange: (w: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Width" className="flex items-center gap-1">
      {WIDTH.filter((o) => allowed.includes(o.value)).map((o) => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={(e) => {
              e.stopPropagation()
              onChange(o.value)
            }}
            className={cn(
              "grid h-7 w-10 grid-cols-3 gap-[2px] rounded-md border p-1 outline-none active:scale-[0.94]",
              EASE,
              on ? "border-[var(--ts-interactive)] bg-[rgb(255_85_0/0.14)]" : "border-white/15 hover:border-white/45 hover:bg-white/[0.08]",
            )}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("rounded-[2px] transition-colors duration-150", i < o.value / 4 ? (on ? "bg-[var(--ts-interactive)]" : "bg-white/70") : "bg-white/15")} />
            ))}
          </button>
        )
      })}
    </div>
  )
}

/** What a widget from the gallery is added with: chosen in its details before it goes on the page. */
export type AddOptions = { variant: string; w: number; detail: Detail; props: Record<string, string | boolean> }

/**
 * The widget gallery, Pages with nothing selected. Filter by what is on this page or by group, or search. A click on
 * a widget on this page selects it; a click on any other opens its details here: a big preview, the size and layout
 * it can have, its detail and its options, then Add to the page (it is added at the bottom and selected, so
 * everything else about it is one panel away). Dragging a widget onto the page places it where it is dropped.
 */
export function WidgetLibrary({
  page,
  pageLabel,
  coach,
  canvasClass,
  onPage,
  onAdd,
  onSelect,
  onDragType,
}: {
  page: PageId
  pageLabel: string
  coach: Coach
  canvasClass: string
  /** The widgets already on the page, in reading order. */
  onPage: WidgetInstance[]
  onAdd: (type: string, opts: AddOptions) => void
  onSelect: (id: string) => void
  /** Tells the grid which widget is being dragged in, and with what chosen in its details (if from there). */
  onDragType: (type: string | null, opts?: AddOptions) => void
}) {
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const q = query.trim().toLowerCase()
  const match = (w: WidgetDef) => !q || `${w.name} ${w.description} ${w.group} ${w.variants.map((v) => v.label).join(" ")}`.toLowerCase().includes(q)
  const sections = librarySections(page).filter((s) => s.types.length)
  const count = (type: string) => onPage.filter((w) => w.type === type).length
  const groups = sections
    .filter((s) => !group || s.title === group)
    .map((s) => ({ g: s.title, items: s.types.map((t) => getWidget(t)!).filter(match) }))
    .filter((x) => x.items.length)
  const here = onPage.filter((w) => getWidget(w.type) && match(getWidget(w.type)!))
  const chip = (on: boolean) =>
    cn("h-7 shrink-0 px-3 text-xs whitespace-nowrap", chipState(on))

  const def = picked ? getWidget(picked) : undefined
  if (def) return <WidgetDetails key={def.type} def={def} pageLabel={pageLabel} canvasClass={canvasClass} onPage={onPage.filter((w) => w.type === def.type)} onBack={() => setPicked(null)} onAdd={(o) => onAdd(def.type, o)} onSelect={onSelect} onDrag={(o) => onDragType(o && def.type, o ?? undefined)} />

  return (
    <div className="grid gap-4">
      <div className="sticky top-0 z-10 grid gap-3 border-b bg-background px-5 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search widgets" aria-label="Search widgets" className="pl-8" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        {/* One row, scrolled sideways (a mouse wheel scrolls it too), as in the reference. */}
        <div
          role="group"
          aria-label="Widget groups"
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY
          }}
          className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_88%,transparent)]">
          <button type="button" aria-pressed={!group} onClick={() => setGroup(null)} className={chip(!group)}>
            All
          </button>
          <button type="button" aria-pressed={group === HERE} onClick={() => setGroup(group === HERE ? null : HERE)} className={chip(group === HERE)}>
            On this page · {onPage.length}
          </button>
          {sections.length > 1 &&
            sections.map((s) => (
              <button key={s.title} type="button" aria-pressed={group === s.title} onClick={() => setGroup(group === s.title ? null : s.title)} className={chip(group === s.title)}>
                {s.title}
              </button>
            ))}
        </div>
      </div>
      <div className="grid gap-6 px-5 pt-1 pb-6">
        {group === HERE ? (
          here.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{onPage.length ? `No widget on this page matches “${query}”.` : "No widgets on this page yet. Pick one in All."}</p>
          ) : (
            <div className="grid gap-3">
              {here.map((w) => {
                const d = getWidget(w.type)!
                return (
                  // A div, not a button: the thumbnail contains the widget's own buttons.
                  <ThumbCard
                    key={w.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(w.id)
                      }
                    }}
                    aria-label={`Edit ${d.name}`}
                    thumb={<WidgetThumb def={d} variant={w.variant} header={w.header} canvasClass={canvasClass} box={{ w: 280, h: 140 }} fill />}
                    title={d.name}
                    sub={[d.variants.length > 1 && lookOf(d, w.variant).label, w.emphasis === "star" && "Star", w.hideOnPhone && "Not on phones"].filter(Boolean).join(" · ") || shortOf(d)}
                    chevron
                  />
                )
              })}
            </div>
          )
        ) : (
          <>
            {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No widget matches “{query}”. Try “calendar”, “progress” or “banner”.</p>}
            {groups.map(({ g, items }) => (
              <div key={g} className="grid gap-2.5">
                <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{g}</span>
                <div className="grid gap-3">
                  {items.map((w) => {
                    const off = !!w.module && !coach.modules[w.module]
                    const n = count(w.type)
                    return (
                      <ThumbCard
                        key={w.type}
                        role="button"
                        tabIndex={off ? -1 : 0}
                        aria-disabled={off || undefined}
                        draggable={!off}
                        // Native drag and drop: the grid accepts drops from outside.
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", w.type)
                          e.dataTransfer.effectAllowed = "copy"
                          onDragType(w.type)
                        }}
                        onDragEnd={() => onDragType(null)}
                        onClick={() => !off && setPicked(w.type)}
                        onKeyDown={(e) => {
                          if (!off && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            setPicked(w.type)
                          }
                        }}
                        className={off ? undefined : "active:cursor-grabbing"}
                        aria-label={off ? `${w.name}. Switch on ${MODULE_LABEL[w.module!]} to use it.` : `${w.name}: see its options`}
                        off={off}
                        thumb={<WidgetThumb def={w} canvasClass={canvasClass} box={{ w: 280, h: 140 }} fill />}
                        title={w.name}
                        meta={
                          n > 0 ? (
                            <>
                              <Check className="size-3" /> On page{n > 1 ? ` · ${n}` : ""}
                            </>
                          ) : undefined
                        }
                        sub={off ? `Switch on ${MODULE_LABEL[w.module!]} to use it` : shortOf(w)}
                        chevron={!off}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const HERE = "__on-this-page"

/**
 * One widget from the gallery, before it is added: a big preview of the chosen layout, then what can be set for it
 * (size, layout, detail and its own switches and choices), and Add to the page. Text and pictures are set once it
 * is on the page, in its panel.
 */
function WidgetDetails({
  def,
  pageLabel,
  canvasClass,
  onPage,
  onBack,
  onAdd,
  onSelect,
  onDrag,
}: {
  def: WidgetDef
  pageLabel: string
  canvasClass: string
  onPage: WidgetInstance[]
  onBack: () => void
  onAdd: (opts: AddOptions) => void
  onSelect: (id: string) => void
  /** A drag of the preview or of a layout onto the page starts (with what is chosen) or ends (null). */
  onDrag: (opts: AddOptions | null) => void
}) {
  const [variant, setVariant] = useState(def.variants[0].value)
  const [w, setW] = useState(fitWidth(def, def.variants[0].value, def.defaultW))
  const [detail, setDetail] = useState<Detail>("standard")
  const [props, setProps] = useState<Record<string, string | boolean>>({})
  const widths = widthsFor(def, variant)
  const choices = def.settings?.filter((s) => s.type === "toggle" || s.type === "select") ?? []
  const more = (def.settings?.length ?? 0) > choices.length
  const top = useRef<HTMLDivElement>(null)
  // The preview and each layout drag onto the page as chosen here (a layout with its own width, if the size does not fit it).
  const drag = (v: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", def.type)
      e.dataTransfer.effectAllowed = "copy"
      onDrag({ variant: v, w: fitWidth(def, v, w), detail, props })
    },
    onDragEnd: () => onDrag(null),
  })
  // Opens at its top, wherever the gallery was scrolled to.
  useEffect(() => {
    top.current?.scrollIntoView({ block: "start" })
  }, [])
  return (
    <div ref={top} className="flex min-h-full flex-col">
      <div className="border-b px-4 py-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> Widgets
        </Button>
      </div>
      <div className="grid flex-1 content-start gap-6 p-5">
        <div className="grid gap-3">
          <div {...drag(variant)} title="Drag onto the page" className="cursor-grab overflow-hidden rounded-xl border p-1.5 active:cursor-grabbing">
            <div className="pointer-events-none overflow-hidden rounded-lg">
              <WidgetThumb def={def} variant={variant} canvasClass={canvasClass} box={{ w: 360, h: 220 }} fill />
            </div>
          </div>
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">{def.name}</span>
            <span className="text-xs text-muted-foreground">{shortOf(def)}</span>
          </div>
        </div>
        {onPage.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            <Check className="size-3" /> Already on this page.
            <button type="button" className="font-medium text-foreground underline underline-offset-2" onClick={() => onSelect(onPage[0].id)}>
              Edit that one
            </button>
            or add another.
          </p>
        )}
        {def.type !== "page-header" && widths.length > 1 && (
          <div className="grid gap-2">
            <span className="text-[0.8rem] font-medium">Size</span>
            <SizePicker value={pageWidth(w)} allowed={widths} onChange={setW} />
          </div>
        )}
        {def.variants.length > 1 && (
          <div className="grid gap-2">
            <span className="text-[0.8rem] font-medium">Layout</span>
            <div role="radiogroup" aria-label="Layout" className="grid grid-cols-2 gap-2">
              {def.variants.map((v) => (
                <ThumbCard
                  key={v.value}
                  {...drag(v.value)}
                  role="radio"
                  tabIndex={0}
                  aria-checked={variant === v.value}
                  aria-label={v.label}
                  onClick={() => {
                    setVariant(v.value)
                    setW(fitWidth(def, v.value, w))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setVariant(v.value)
                      setW(fitWidth(def, v.value, w))
                    }
                  }}
                  selected={variant === v.value}
                  thumb={<WidgetThumb def={def} variant={v.value} canvasClass={canvasClass} box={{ w: 160, h: 88 }} fill />}
                  title={v.label}
                />
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <span className="text-[0.8rem] font-medium">Detail</span>
          <Segmented label="Detail" value={detail} options={DETAIL} onChange={setDetail} />
          <p className="text-xs text-muted-foreground">{DETAIL.find((o) => o.value === detail)?.hint}</p>
        </div>
        {choices.length > 0 && (
          <div className="grid gap-3">
            <span className="text-[0.8rem] font-medium">Shows</span>
            {choices.map((s) =>
              s.type === "toggle" ? (
                <label key={s.key} className="flex items-center justify-between gap-3 text-[0.8rem]">
                  {s.label}
                  <Switch checked={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onCheckedChange={(v) => setProps({ ...props, [s.key]: v })} />
                </label>
              ) : s.type === "select" ? (
                <Field key={s.key} label={s.label}>
                  <select value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProps({ ...props, [s.key]: e.target.value })} className="h-8 rounded-lg border bg-background px-2 text-sm">
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null,
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {more ? "Its text and pictures, " : ""}Emphasis, header and who sees it are set once it is on the page, in its panel. Or drag the preview, or a layout, onto the page.
        </p>
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t bg-background px-5 py-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Cancel
        </Button>
        <Button className="flex-[2]" onClick={() => onAdd({ variant, w, detail, props })}>
          <Plus /> Add to {pageLabel}
        </Button>
      </div>
    </div>
  )
}

/** Labels for the widget style a widget takes from Widgets (all widgets), shown in its panel. */
const SURFACE_NAME = { raised: "Raised cards", grey: "Grey cards", outline: "Outline cards", open: "Open" } as const
const HEADER_NAME = { top: "Top", label: "Label", caption: "Caption", tag: "Tag", path: "Path" } as const
const CHART_NAME = { ticks: "Ticks", solid: "Solid", thin: "Thin", blocks: "Blocks", dots: "Dots" } as const
const NUMBER_NAME = { plain: "Plain", marked: "Marked", display: "Display", mono: "Mono" } as const

/**
 * Where a setting of this widget comes from: the default (the widget's own, or Widgets for every widget), or
 * changed for this widget only, with a way back to the default.
 */
function Scope({ own, from = "Default", onReset }: { own: boolean; from?: string; onReset?: () => void }) {
  return own ? (
    <span className="flex items-center gap-1.5 text-xs text-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-[#ff5500]" />
      Only this widget
      {onReset && (
        <button type="button" onClick={onReset} title={`Back to ${from.toLowerCase()}`} aria-label={`Back to ${from.toLowerCase()}`} className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
          <RotateCcw className="size-3" />
        </button>
      )}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full border border-muted-foreground" />
      {from}
    </span>
  )
}

const SURFACES: { value: CardSurface; label: string; hint: string }[] = [
  { value: "raised", label: "Raised", hint: "The card colour, standing on the page" },
  { value: "grey", label: "Grey", hint: "A flat grey card on the page colour" },
  { value: "outline", label: "Outline", hint: "No fill, a fine line around it" },
]
const HEADER_FORMS: { value: HeaderForm; label: string }[] = (Object.keys(HEADER_NAME) as HeaderForm[]).map((value) => ({ value, label: HEADER_NAME[value] }))
const CHARTS: { value: ChartStyle; label: string }[] = (Object.keys(CHART_NAME) as ChartStyle[]).map((value) => ({ value, label: CHART_NAME[value] }))
const FIGURES: { value: FigureStyle; label: string }[] = (["plain", "marked", "display", "mono"] as const).map((value) => ({ value, label: NUMBER_NAME[value] }))
type Fill = "card" | "brand" | "highlight" | "image"
const FILL_HINT: Record<Fill, string> = {
  card: "The card colour, as every widget has it",
  brand: "A touch of your brand colour in the card",
  highlight: "A touch of your highlight colour in the card",
  image: "A picture under the card colour, so the text stays readable",
}

/**
 * This widget's own style: Card, Names, Charts and Numbers instead of All widgets (each with the way back), and its
 * background: a tone of the theme, or on content widgets a picture under the card colour. Charts and Numbers show
 * only on widgets that draw them; a Star keeps its own surface, so its background can't change.
 */
function OwnStyleFields({ w, pinned, onChange }: { w: WidgetInstance; pinned?: boolean; onChange: (patch: Partial<WidgetInstance>, key: string) => void }) {
  const { theme } = useDesign()
  const file = useRef<HTMLInputElement>(null)
  const own = w.style ?? {}
  const parts = styleParts(w.type)
  const set = (patch: Partial<WidgetOwnStyle>, key: string) => {
    const next = Object.fromEntries(Object.entries({ ...own, ...patch }).filter(([, v]) => v !== undefined && v !== "")) as WidgetOwnStyle
    onChange({ style: Object.keys(next).length ? next : undefined }, `${w.id}-style-${key}`)
  }
  const star = w.emphasis === "star"
  const fill: Fill = own.image && parts.image ? "image" : (own.tone ?? "card")
  const fills: { value: Fill; label: string }[] = [
    { value: "card", label: "Card" },
    { value: "brand", label: "Brand" },
    { value: "highlight", label: "Highlight" },
    ...(parts.image ? [{ value: "image" as const, label: "Image" }] : []),
  ]
  const surface = own.surface ?? theme.cardSurface ?? "raised"
  const figure = own.figureStyle ?? (widgetFontOf(theme) === "mono" ? "mono" : figureStyleOf(theme))
  const uploaded = own.image && !own.image.startsWith("preset:") ? own.image : undefined
  return (
    <>
      <Scoped label="Card" scope={<Scope own={!!own.surface} from="From all widgets" onReset={() => set({ surface: undefined }, "surface")} />}>
        <Segmented label="Card" value={surface} options={SURFACES} onChange={(v) => set({ surface: v }, "surface")} />
        <p className="text-xs text-muted-foreground">{SURFACES.find((o) => o.value === surface)?.hint}</p>
      </Scoped>
      {!pinned && (
        <Scoped label="Name" scope={<Scope own={!!own.headerForm} from="From all widgets" onReset={() => set({ headerForm: undefined }, "header-form")} />}>
          <Segmented label="Name" value={own.headerForm ?? headerFormOf(theme)} options={HEADER_FORMS} onChange={(v) => set({ headerForm: v }, "header-form")} />
        </Scoped>
      )}
      {parts.chart && (
        <Scoped label="Bars and gauges" scope={<Scope own={!!own.chartStyle} from="From all widgets" onReset={() => set({ chartStyle: undefined }, "chart")} />}>
          <Segmented label="Bars and gauges" value={own.chartStyle ?? chartStyleOf(theme)} options={CHARTS} onChange={(v) => set({ chartStyle: v }, "chart")} />
        </Scoped>
      )}
      {parts.figure && (
        <Scoped label="Headline number" scope={<Scope own={!!own.figureStyle} from="From all widgets" onReset={() => set({ figureStyle: undefined }, "figure")} />}>
          <Segmented label="Headline number" value={figure} options={FIGURES} onChange={(v) => set({ figureStyle: v }, "figure")} />
        </Scoped>
      )}
      <Scoped label="Background" scope={<Scope own={fill !== "card"} onReset={() => set({ tone: undefined, image: undefined, dim: undefined }, "fill")} />}>
        {star ? (
          <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">The Star widget keeps its own surface. Set Emphasis to Accent or Quiet to give it a background.</p>
        ) : (
          <>
            <Segmented
              label="Background"
              value={fill}
              options={fills}
              onChange={(v) =>
                v === "image"
                  ? set({ tone: undefined, image: own.image ?? `preset:${BACKDROPS[0].id}` }, "fill")
                  : set({ tone: v === "card" ? undefined : v, image: undefined, dim: undefined }, "fill")
              }
            />
            <p className="text-xs text-muted-foreground">{FILL_HINT[fill]}</p>
            {!parts.image && <p className="text-xs text-muted-foreground">Pictures go on content widgets only: behind charts and figures they would get in the way of the data.</p>}
            {fill === "image" && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {BACKDROPS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => set({ image: `preset:${b.id}` }, "image")}
                      aria-pressed={own.image === `preset:${b.id}`}
                      className={cn("grid gap-1 p-1 text-left text-[0.7rem]", card(own.image === `preset:${b.id}`))}
                    >
                      <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10] ring-1 ring-white/10" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
                      <span className="truncate px-0.5 text-muted-foreground">{b.name}</span>
                    </button>
                  ))}
                  <button type="button" onClick={() => file.current?.click()} aria-pressed={!!uploaded} className={cn("grid gap-1 p-1 text-left text-[0.7rem]", card(!!uploaded))}>
                    <span className="grid aspect-[4/3] place-items-center rounded-[4px] border border-dashed bg-cover bg-center" style={uploaded ? { backgroundImage: `url("${uploaded}")` } : undefined}>
                      {!uploaded && <ImagePlus className="size-4 text-muted-foreground" />}
                    </span>
                    <span className="truncate px-0.5 text-muted-foreground">{uploaded ? "Yours" : "Upload"}</span>
                  </button>
                </div>
                <input
                  ref={file}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ""
                    if (!f) return
                    try {
                      // A card is small: 1200px wide is plenty, as a JPEG.
                      set({ image: await pictureFrom(f, { max: 1200, side: "width", quality: 0.8, keep: [] }) }, "image")
                    } catch (err) {
                      toast.error((err as Error).message)
                    }
                  }}
                />
                <SliderField
                  label="Readability"
                  value={widgetDimOf(own.dim)}
                  min={MIN_WIDGET_DIM}
                  max={95}
                  unit="%"
                  format={(v) => `${v}% card colour on top`}
                  onChange={(dim) => set({ dim }, "dim")}
                />
              </>
            )}
          </>
        )}
      </Scoped>
    </>
  )
}

/** A block of the widget's panel: Content, Size and place, Style, Who sees it. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t pt-5">
      <h3 className="text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

/** A field label with where its value comes from on the right. */
function Scoped({ label, scope, children }: { label: string; scope: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <span className="text-[0.8rem] font-medium">{label}</span>
        {scope}
      </div>
      {children}
    </div>
  )
}

/**
 * The selected widget's panel in Pages, the one place a single widget is edited. Four blocks: Content, Size and
 * place, Style, Who sees it. Every look setting says whether it is the default or this widget's own; the style
 * every widget shares is summed up, with the way to Widgets to change it for all of them. Reset this widget puts
 * its look and size back (its content stays) in one step, so one undo brings them back.
 */
export function WidgetSettings({
  w,
  pinned,
  expanded,
  canvasClass,
  onChange,
  onDuplicate,
  onRemove,
  onAllWidgets,
  start,
  head,
}: {
  w: WidgetInstance
  /** The page's core widget: it can't be removed, duplicated or hidden. */
  pinned?: boolean
  /** Two columns wide, but drawn at the whole width on desktop right now: nothing after it fits beside it (page-renderer masonry). */
  expanded?: boolean
  canvasClass: string
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
  /** Switches the panel to All widgets, where the style of every widget is set. */
  onAllWidgets: () => void
  /** Replaces the widget's own name and description at the top (Design: the name with the This widget / All widgets switch). */
  head?: React.ReactNode
  /** This widget as the page starts (the template's page), if it was there; else the widget's own defaults. */
  start?: WidgetInstance
}) {
  const def = getWidget(w.type)!
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  const look = lookOf(def, w.variant)
  const pick = (v: (typeof def.variants)[number]) => onChange({ variant: v.value, h: Math.max(w.h, v.minH) }, `${w.id}-variant`)
  const emphasis = w.emphasis ?? "accent"
  const detail = w.detail ?? "standard"
  const widths = widthsFor(def, w.variant)
  const width = pageWidth(w.w)
  const { theme, coach } = useDesign()
  const groups = useGroups(coach)
  const header = widgetHeaderOf(theme, w.header)
  const ownHeader = !!w.header && Object.keys(w.header).length > 0
  const note = w.note ?? {}
  const setNote = (k: keyof WidgetNote, v: string) => onChange({ note: { ...w.note, [k]: v || undefined } }, `${w.id}-note-${k}`)
  const setShow = (k: "phase" | "group", v: string) => onChange({ show: { ...w.show, [k]: v || undefined } }, `${w.id}-show-${k}`)
  const selectClass = "h-8 rounded-lg border bg-background px-2 text-sm"
  // The default of each setting: as the page starts (the template's page), else the widget's first layout, Standard, Accent, its default width.
  const first = lookOf(def, start?.variant).value
  const baseDetail = start?.detail ?? "standard"
  const baseEmphasis = start?.emphasis ?? "accent"
  const defaultW = fitWidth(def, first, start?.w ?? def.defaultW)
  const ownLayout = look.value !== first
  const ownWidth = width !== pageWidth(fitWidth(def, w.variant, start?.w ?? def.defaultW))
  const own = w.style ?? {}
  const ownStyle = Object.values(own).some((v) => v !== undefined)
  const changed = ownLayout || detail !== baseDetail || emphasis !== baseEmphasis || ownHeader || ownWidth || ownStyle
  const set = widgetSetOf(theme)
  // What this widget still takes from All widgets: the parts it set itself show above, with their own scope.
  const parts = styleParts(w.type)
  const shared = [
    !own.surface && SURFACE_NAME[set === "open" ? "open" : (theme.cardSurface ?? "raised")],
    !own.headerForm && `${HEADER_NAME[headerFormOf(theme)]} names`,
    parts.chart && !own.chartStyle && `${CHART_NAME[chartStyleOf(theme)]} bars`,
    parts.figure && !own.figureStyle && `${NUMBER_NAME[widgetFontOf(theme) === "mono" ? "mono" : figureStyleOf(theme)]} numbers`,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <div className="grid gap-6 p-5">
      {head ?? (
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
            <def.icon className="size-4" />
          </span>
          <div className="grid min-w-0">
            <span className="text-sm font-semibold">{def.name}</span>
            <span className="text-xs text-muted-foreground">{def.description}</span>
            <span className="mt-1 text-xs text-muted-foreground">Changes here are for this widget only.</span>
          </div>
        </div>
      )}

      {pinned && (
        <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          The main part of this page. It always stays on the page and spans its full width; drag it to move it. On the live page it grows
          with its content.
        </p>
      )}

      {/* Size, layout and detail first, as in the gallery's details: what a coach changes most. */}
      <div className="grid gap-6">
        {!pinned && def.type !== "page-header" && widths.length > 1 && (
          <Scoped label="Size" scope={<Scope own={ownWidth} onReset={() => onChange({ w: fitWidth(def, w.variant, start?.w ?? def.defaultW) }, `${w.id}-width`)} />}>
            {/* Drawn at the whole width right now: the choice says so, not just the note under it. */}
            <SizePicker value={width} allowed={widths} expanded={expanded} onChange={(v) => onChange({ w: v }, `${w.id}-width`)} />
            {expanded && width === 8 ? (
              <p className="text-xs text-foreground">
                Full width on desktop now: no widget after it fits beside it. It takes two columns again when one does. Tablet: like One column. Phone: the full width.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{WIDTH.find((o) => o.value === width)?.hint}</p>
            )}
          </Scoped>
        )}
        {def.variants.length > 1 && (
          <Scoped label="Layout" scope={<Scope own={ownLayout} onReset={() => pick(lookOf(def, first))} />}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Layout">
              {def.variants.map((v) => (
                // A div, not a button: the thumbnail contains the widget's own buttons.
                <ThumbCard
                  key={v.value}
                  role="radio"
                  tabIndex={0}
                  aria-checked={look.value === v.value}
                  aria-label={v.label}
                  // A taller look grows the widget so its content fits.
                  onClick={() => pick(v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      pick(v)
                    }
                  }}
                  selected={look.value === v.value}
                  thumb={<WidgetThumb def={def} variant={v.value} canvasClass={canvasClass} box={{ w: 160, h: 88 }} header={w.header} fill />}
                  title={v.label}
                />
              ))}
            </div>
          </Scoped>
        )}
        <Scoped label="Detail" scope={<Scope own={detail !== baseDetail} onReset={() => onChange({ detail: baseDetail }, `${w.id}-detail`)} />}>
          <Segmented label="Detail" value={detail} options={DETAIL} onChange={(v) => onChange({ detail: v }, `${w.id}-detail`)} />
          <p className="text-xs text-muted-foreground">{DETAIL.find((o) => o.value === detail)?.hint}</p>
        </Scoped>
      </div>

      {(!!def.settings?.length || (!pinned && def.type !== "page-header")) && (
        <Block title="Content">
          {def.settings?.map((s) => {
            if (s.type === "toggle")
              return (
                <label key={s.key} className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
                  {s.label}
                  <Switch checked={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onCheckedChange={(v) => setProp(s.key, v)} />
                </label>
              )
            if (s.type === "select")
              return (
                <Field key={s.key} label={s.label}>
                  <select value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProp(s.key, e.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm">
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )
            if (s.type === "image")
              return (
                <Field key={s.key} label={s.label}>
                  <PictureUpload value={typeof props[s.key] === "string" ? String(props[s.key]) : ""} onChange={(v) => setProp(s.key, v)} />
                </Field>
              )
            return (
              <Field key={s.key} label={s.label}>
                {s.type === "textarea" ? (
                  <Textarea value={String(props[s.key] ?? "")} placeholder="Leave empty for the default text" onChange={(e) => setProp(s.key, e.target.value)} />
                ) : (
                  <Input value={String(props[s.key] ?? "")} placeholder={s.placeholder ?? "Leave empty for the default"} onChange={(e) => setProp(s.key, e.target.value)} />
                )}
              </Field>
            )
          })}
          {!pinned && def.type !== "page-header" && (
            <Field label="Your own content">
              <Textarea value={note.text ?? ""} placeholder="Text" aria-label="Text" onChange={(e) => setNote("text", e.target.value)} />
              <Input value={note.button ?? ""} placeholder="Button text" aria-label="Button text" onChange={(e) => setNote("button", e.target.value)} />
              <select value={note.target ?? noteTargets()[0].value} aria-label="Opens" onChange={(e) => setNote("target", e.target.value)} className={selectClass}>
                {noteTargets().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {note.target === "url" && <Input value={note.url ?? ""} placeholder="Web address" aria-label="Web address" onChange={(e) => setNote("url", e.target.value)} />}
              <PictureUpload value={note.image} onChange={(v) => setNote("image", v)} />
              <p className="text-xs text-muted-foreground">Shows under the widget&apos;s header, next to its data. The button needs a text.</p>
            </Field>
          )}
        </Block>
      )}

      <Block title="Style">
        <Scoped label="Emphasis" scope={<Scope own={emphasis !== baseEmphasis} onReset={() => onChange({ emphasis: baseEmphasis }, `${w.id}-emphasis`)} />}>
          <Segmented label="Emphasis" value={emphasis} options={EMPHASIS} onChange={(v) => onChange({ emphasis: v }, `${w.id}-emphasis`)} />
          <p className="text-xs text-muted-foreground">{EMPHASIS.find((o) => o.value === emphasis)?.hint}</p>
        </Scoped>
        {!pinned && (
          <Scoped label="Header" scope={<Scope own={ownHeader} from="From all widgets" onReset={() => onChange({ header: undefined }, `${w.id}-header-reset`)} />}>
            <HeaderParts idPrefix={`${w.id}-header`} value={header} own={w.header} onChange={(key, on) => onChange({ header: { ...w.header, [key]: on } }, `${w.id}-header-${key}`)} />
            <p className="text-xs text-muted-foreground">
              {ownHeader ? "This widget's own header. The arrow puts it back to the header every widget has." : "The header every widget has (All widgets → Header). Change a switch to make this widget different."}
            </p>
          </Scoped>
        )}
        <OwnStyleFields w={w} pinned={pinned} onChange={onChange} />
        <div className="grid gap-1.5 rounded-lg bg-muted/60 p-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full border border-muted-foreground" />
            From all widgets, the same for every widget
          </span>
          {shared && <span className="text-[0.8rem]">{shared}</span>}
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onAllWidgets}>
            Change for all widgets <ArrowRight />
          </Button>
        </div>
      </Block>

      {!pinned && (
        <Block title="Who sees it">
          <label className="flex items-center justify-between gap-3 text-[0.8rem] font-medium">
            <span className="flex items-center gap-2">
              <EyeOff className="size-4 text-muted-foreground" /> Hide on phones
            </span>
            <Switch checked={!!w.hideOnPhone} onCheckedChange={(hideOnPhone) => onChange({ hideOnPhone }, `${w.id}-phone`)} />
          </label>
          <select value={w.show?.phase ?? ""} aria-label="Phase" onChange={(e) => setShow("phase", e.target.value)} className={selectClass}>
            {PHASES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select value={w.show?.group ?? ""} aria-label="Group" onChange={(e) => setShow("group", e.target.value)} className={selectClass}>
            <option value="">Everyone</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Tiers have their own layouts: pick one with Layout for, above the page.</p>
        </Block>
      )}

      <div className="flex flex-wrap gap-2 border-t pt-5">
        {!pinned && (
          <>
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy /> Duplicate
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
              <Trash2 /> Remove
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          disabled={!changed}
          title="Layout, width, detail, emphasis, header and style back to the default. Its content stays."
          onClick={() => {
            // One change, so one undo brings it all back. Content, visibility and phones stay.
            onChange({ variant: first, w: pinned ? w.w : defaultW, h: heightFor(def, first, start?.detail), detail: start?.detail, emphasis: start?.emphasis, header: start?.header, style: start?.style }, `${w.id}-reset-widget`)
            toast("This widget is back to its default look.", { description: "Its content stays. Press ⌘Z to undo." })
          }}
        >
          <RotateCcw /> Reset this widget
        </Button>
      </div>
    </div>
  )
}
