"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUp, ArrowUpToLine, Check, ChevronRight, Copy, ImagePlus, Lock, MoreHorizontal, Plus, RotateCcw, Trash2, X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectOptions } from "@/components/kit/select-field"
import { fitWidth, getWidget, heightFor, lookOf, pageWidth, settingApplies, settingsFor, styleParts, widthsFor } from "@/components/widgets/registry"
import { filledStar } from "@/components/widgets/parts/widget-scope"
import { useGroups } from "@/lib/data/access"
import { pictureFrom } from "@/lib/images"
import { BACKDROPS, MIN_WIDGET_DIM, widgetDimOf } from "@/lib/theme/backdrops"
import { chartStyleOf, figureStyleOf, headerFormOf, widgetFontOf, widgetHeaderOf, widgetSetOf, type CardSurface, type ChartStyle, type FigureStyle, type HeaderForm, type WidgetHeader } from "@/lib/theme/types"
import type { WidgetInstance, WidgetNote, WidgetOwnStyle } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { BOX, InspectorSection, Row, Segmented, SliderField, YesNo } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { card, chip } from "../states"
import { DETAIL, EMPHASIS, PHASES, PictureUpload, WIDTH, noteTargets, type AddOptions } from "./builder-panels"
import { ThumbCard, WidgetThumb, dragGhost } from "../thumbs/widget-thumb"
import { CardArt, OptionTiles } from "../thumbs/option-art"
import { MediaCardsEditor } from "./media-cards-editor"
import { Flyout } from "./flyout"
import { capsOf, headerParts } from "./widget-caps"

/** Labels for the style a widget takes from All widgets, for the summaries in its rows. */
const HEADER_NAME = { top: "Top", label: "Label", caption: "Caption", tag: "Tag", path: "Path" } as const
const CHART_NAME = { ticks: "Ticks", solid: "Solid", thin: "Thin", blocks: "Blocks", dots: "Dots" } as const
const NUMBER_NAME = { plain: "Plain", marked: "Marked", display: "Display", mono: "Mono" } as const

const SURFACES: { value: CardSurface | "blended"; label: string; hint: string }[] = [
  { value: "raised", label: "Raised", hint: "The card colour, standing on the page" },
  { value: "grey", label: "Grey", hint: "A flat grey card on the page colour" },
  { value: "outline", label: "Outline", hint: "No fill, a fine line around it" },
  { value: "blended", label: "Blended", hint: "No card: it sits right on the page" },
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
/** Detail, in plain words: how much of its data a widget shows. */
const SHOWS = { compact: "Less", standard: "Standard", detailed: "More" } as const

const HEADER_PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title" },
  { key: "value", label: "Value chip", hint: "The figure on the right, like “58% win”" },
]

/** The page's three columns as a small picture: the ones a width takes are filled. */
function ColumnsIcon({ span }: { span: number }) {
  return (
    <span aria-hidden className="grid h-3 w-5 grid-cols-3 gap-px">
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("rounded-[1.5px]", i < span ? "bg-current" : "bg-current opacity-25")} />
      ))}
    </span>
  )
}

/**
 * The top of the right panel, the Framer way: no title block (the bar above already says which page, and the page
 * shows what is selected), just the panel's tabs or name on the left and its actions on the right.
 */
export function InspectorTop({ children, menu, onClose }: { children: React.ReactNode; menu?: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex h-14 min-w-0 items-center gap-1 pr-3 pl-4">
      <div className="min-w-0 flex-1">{children}</div>
      {menu}
      {onClose && (
        <Button variant="ghost" size="icon" aria-label="Close" title="Close (Esc)" onClick={onClose}>
          <X />
        </Button>
      )}
    </div>
  )
}

/**
 * The selected widget, in the right panel (the Framer inspector): its name and actions on top, then one column, no
 * tabs, in the order a coach needs it: Layout (size, how much it shows, its layout), Content (what it says), Style (stand out, card, background; the header and charts open beside the panel) and Visibility. Each
 * property is one row; a value set on this widget only is marked with a dot and its reset on hover. Every widget's
 * style is a place of its own, one link away. Reset this widget (⋯) puts its look and size back in one step.
 */
export function WidgetInspector({
  w,
  pinned,
  count,
  onScope,
  onChange,
  onDuplicate,
  onRemove,
  onMove,
  onClose,
  start,
  onDrag,
  phone,
}: {
  w: WidgetInstance
  /** The page's core widget: it can't be removed, duplicated or hidden. */
  pinned?: boolean
  count: { total: number; own: number }
  onScope: (s: "one" | "all") => void
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDuplicate: () => void
  onRemove: () => void
  onMove: (where: "top" | "bottom") => void
  onClose: () => void
  /** This widget as the page starts (the template's page), if it was there; else the widget's own defaults. */
  start?: WidgetInstance
  /** A layout dragged onto the page adds another widget of this type in that layout (starts with what it adds, ends with null). */
  onDrag?: (opts: AddOptions | null) => void
  /** Where phones show this widget, and how to change it. */
  phone?: PhoneOrder
}) {
  const def = getWidget(w.type)!
  const look = lookOf(def, w.variant)
  const first = lookOf(def, start?.variant).value
  const detail = w.detail ?? "standard"
  const emphasis = w.emphasis ?? "accent"
  const baseDetail = start?.detail ?? "standard"
  const baseEmphasis = start?.emphasis ?? "accent"
  const defaultW = fitWidth(def, first, start?.w ?? def.defaultW)
  const own = w.style ?? {}
  const changed =
    look.value !== first ||
    detail !== baseDetail ||
    emphasis !== baseEmphasis ||
    (!!w.header && Object.keys(w.header).length > 0) ||
    pageWidth(w.w) !== pageWidth(fitWidth(def, w.variant, start?.w ?? def.defaultW)) ||
    Object.values(own).some((v) => v !== undefined)
  const reset = () => {
    // One change, so one undo brings it all back. Content, visibility and phones stay.
    onChange({ variant: first, w: pinned ? w.w : defaultW, h: heightFor(def, first, start?.detail), detail: start?.detail, emphasis: start?.emphasis, header: start?.header, style: start?.style }, `${w.id}-reset-widget`)
    toast("This widget is back to its default look.", { description: "Its content stays. Press ⌘Z to undo." })
  }
  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`${def.name}: more actions`} title="More actions" />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!pinned && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy /> Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onMove("top")}>
          <ArrowUpToLine /> Bring to top
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove("bottom")}>
          <ArrowDownToLine /> Send to bottom
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!changed} onClick={reset}>
          <RotateCcw /> Reset this widget
        </DropdownMenuItem>
        {!pinned && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 /> Remove
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex min-h-full flex-col">
      {/* The widget's name and its actions; then one column, the Framer way: what it says first, then its size and its look. */}
      <InspectorTop menu={menu} onClose={onClose}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.06] [&_svg]:size-4">
            <def.icon />
          </span>
          <span className="truncate text-[0.9375rem] font-semibold">{def.name}</span>
        </span>
      </InspectorTop>
      {pinned && (
        <p className="m-4 mb-0 flex gap-2 rounded-[6px] bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] p-2.5 text-[0.6875rem] leading-4 text-muted-foreground">
          <Lock className="mt-px size-3.5 shrink-0" />
          The main part of this page. It always stays.
        </p>
      )}
      <StyleTab part="layout" w={w} pinned={pinned} start={start} onChange={onChange} onDrag={onDrag} onAllWidgets={() => onScope("all")} count={count} />
      <ContentTab w={w} pinned={pinned} onChange={onChange} part="content" />
      <StyleTab part="style" w={w} pinned={pinned} start={start} onChange={onChange} onDrag={onDrag} onAllWidgets={() => onScope("all")} count={count} />
      <ContentTab w={w} pinned={pinned} onChange={onChange} part="visibility" phone={phone} />
    </div>
  )
}

function StyleTab({
  part,
  w,
  pinned,
  start,
  onChange,
  onDrag,
  onAllWidgets,
  count,
}: {
  w: WidgetInstance
  pinned?: boolean
  start?: WidgetInstance
  onChange: (patch: Partial<WidgetInstance>, key: string) => void
  onDrag?: (opts: AddOptions | null) => void
  onAllWidgets: () => void
  count: { total: number; own: number }
  /** Which block: the layout (first in the panel) or the look (after the content). */
  part: "layout" | "style"
}) {
  const { theme } = useDesign()
  const def = getWidget(w.type)!
  const look = lookOf(def, w.variant)
  const first = lookOf(def, start?.variant).value
  const pick = (v: (typeof def.variants)[number]) => onChange({ variant: v.value, h: Math.max(w.h, v.minH) }, `${w.id}-variant`)
  const detail = w.detail ?? "standard"
  const emphasis = w.emphasis ?? "accent"
  const baseDetail = start?.detail ?? "standard"
  const baseEmphasis = start?.emphasis ?? "accent"
  // One flyout at a time beside the panel: the layouts, the header, or the charts and numbers.
  const [fly, setFly] = useState<"layout" | "header" | "charts" | null>(null)
  const layoutsOpen = fly === "layout"
  const setLayoutsOpen = (o: boolean) => setFly(o ? "layout" : null)
  // The flyouts open against the inspector's edge: the panel (aside) that holds this block. Taken from the block's own
  // root, so it is there in both parts (it was read from the Layout button, absent in Style: Header and Charts never opened).
  const layoutBtn = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const panelEdge = useRef<HTMLElement | null>(null)
  useEffect(() => {
    panelEdge.current = root.current?.closest("aside") ?? null
  })
  const widths = widthsFor(def, w.variant)
  const width = pageWidth(w.w)
  const startW = pageWidth(fitWidth(def, w.variant, start?.w ?? def.defaultW))
  const header = widgetHeaderOf(theme, w.header)
  const own = w.style ?? {}
  const caps = capsOf(w.type, look.value)
  // Shows as the card looks: a level this layout draws like Standard reads as Standard.
  const shown = caps.shows.includes(detail) ? detail : "standard"
  const form = own.headerForm ?? headerFormOf(theme)
  const canShow = headerParts(caps, form, detail)
  const surface = own.surface ?? (widgetSetOf(theme) === "open" ? "blended" : (theme.cardSurface ?? "raised"))
  const figure = own.figureStyle ?? (widgetFontOf(theme) === "mono" ? "mono" : figureStyleOf(theme))
  const setStyle = useOwnStyle(w, onChange)
  const ownHeader = !!w.header && Object.keys(w.header).length > 0
  return (
    <>
      <div ref={root} className="contents" />
      {/* First in the panel: its size, how much it shows and its layout. */}
      {part === "layout" && (
      <InspectorSection title="Layout">
        {!pinned && def.type !== "page-header" && widths.length > 1 && (
          <Row label="Size" hint={WIDTH.find((o) => o.value === width)?.hint} own={width !== startW} onReset={() => onChange({ w: fitWidth(def, w.variant, start?.w ?? def.defaultW) }, `${w.id}-width`)}>
            <Segmented
              label="Size"
              value={width}
              onChange={(v) => onChange({ w: v }, `${w.id}-width`)}
              options={WIDTH.filter((o) => widths.includes(o.value)).map((o) => ({ value: o.value, label: <ColumnsIcon span={o.value / 4} />, name: o.label, hint: `${o.label}. ${o.hint}` }))}
            />
          </Row>
        )}
        {caps.shows.length > 1 && (
          <Row label="Shows" hint={DETAIL.find((o) => o.value === shown)?.hint} own={detail !== baseDetail} onReset={() => onChange({ detail: baseDetail }, `${w.id}-detail`)}>
            <Segmented label="How much it shows" value={shown} options={DETAIL.filter((o) => caps.shows.includes(o.value)).map((o) => ({ value: o.value, label: SHOWS[o.value], hint: o.hint }))} onChange={(v) => onChange({ detail: v }, `${w.id}-detail`)} />
          </Row>
        )}
        {def.variants.length > 1 && (
          // The current layout as one row; the choice opens beside the panel, large, over the page (the sidebar keeps its width).
          <Row label="Layout" own={look.value !== first} onReset={() => pick(lookOf(def, first))}>
            <button
              ref={layoutBtn}
              type="button"
              aria-expanded={layoutsOpen}
              onClick={() => setLayoutsOpen(!layoutsOpen)}
              className={cn(BOX, "flex w-full items-center justify-between gap-2 pr-1.5 pl-3 text-left hover:text-foreground", layoutsOpen && "border-[color:var(--ts-interactive)]")}
            >
              <span className="truncate">{look.label}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <Flyout open={layoutsOpen} onClose={() => setLayoutsOpen(false)} anchor={panelEdge} side="left" width={360} title={`${def.name} · Layout`}>
              <div className="grid gap-3" role="radiogroup" aria-label="Layout">
              {def.variants.map((v) => (
                // A div, not a button: the thumbnail contains the widget's own buttons.
                <ThumbCard
                  key={v.value}
                  // Not the page's core widget, which is on the page once: drag a layout to add another one.
                  {...(onDrag && !pinned
                    ? {
                        draggable: true,
                        onDragStart: (e: React.DragEvent) => {
                          e.dataTransfer.setData("text/plain", def.type)
                          e.dataTransfer.effectAllowed = "copy"
                          dragGhost(e, `${def.name} · ${v.label}`)
                          onDrag({ variant: v.value, w: fitWidth(def, v.value, w.w), detail, props: {} })
                        },
                        onDragEnd: () => onDrag(null),
                      }
                    : {})}
                  role="radio"
                  tabIndex={0}
                  aria-checked={look.value === v.value}
                  aria-label={v.label}
                  onClick={() => pick(v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      pick(v)
                    }
                  }}
                  selected={look.value === v.value}
                  thumb={<WidgetThumb w={{ ...w, variant: v.value, w: fitWidth(def, v.value, w.w) }} />}
                  title={v.label}
                />
              ))}
              </div>
            </Flyout>
          </Row>
        )}
      </InspectorSection>
      )}

      {/* The look, open: the few choices that change it most, in words; the finer ones open beside the panel. */}
      {part === "style" && (
      <>
      <InspectorSection title="Style">
        {caps.standOut.length > 1 && (
          <Row label="Stand out" hint={EMPHASIS.find((o) => o.value === emphasis)?.hint} own={emphasis !== baseEmphasis} onReset={() => onChange({ emphasis: baseEmphasis }, `${w.id}-emphasis`)}>
            <Segmented label="Stand out" value={caps.standOut.includes(emphasis) ? emphasis : "accent"} options={EMPHASIS.filter((o) => caps.standOut.includes(o.value)).map((o) => ({ value: o.value, label: o.label, hint: o.hint }))} onChange={(v) => onChange({ emphasis: v }, `${w.id}-emphasis`)} />
          </Row>
        )}
        <Row label="Card" hint={SURFACES.find((o) => o.value === surface)?.hint} own={!!own.surface} from="all widgets" onReset={() => setStyle({ surface: undefined }, "surface")} stack>
          {/* A choice of shape: pictures (the editor's rule), the rest in words. */}
          <OptionTiles label="Card" cols={2} value={surface} onChange={(v) => setStyle({ surface: v }, "surface")} options={SURFACES.map((o) => ({ value: o.value, label: o.label, hint: o.hint, art: <CardArt surface={o.value} /> }))} />
        </Row>
        <OwnBackground w={w} onChange={onChange} />
        {!pinned && caps.header && (caps.titleStyle || canShow.length > 0) && (
          <Row label="Header" hint="Where the title sits and what the header shows" own={ownHeader || !!own.headerForm} from="all widgets" onReset={() => (onChange({ header: undefined, style: own.headerForm ? { ...own, headerForm: undefined } : w.style }, `${w.id}-header-reset`))}>
            <OpenRow open={fly === "header"} onClick={() => setFly(fly === "header" ? null : "header")} value={[caps.titleStyle && HEADER_NAME[form], `${HEADER_PARTS.filter((p) => canShow.includes(p.key) && header[p.key]).length} of ${canShow.length} parts`].filter(Boolean).join(" · ")} />
          </Row>
        )}
        {(caps.chart || caps.figure) && (
          <Row label="Charts" hint="How bars, gauges and the main number are drawn" own={!!own.chartStyle || !!own.figureStyle} from="all widgets" onReset={() => setStyle({ chartStyle: undefined, figureStyle: undefined }, "charts")}>
            <OpenRow open={fly === "charts"} onClick={() => setFly(fly === "charts" ? null : "charts")} value={[caps.chart && CHART_NAME[own.chartStyle ?? chartStyleOf(theme)], caps.figure && NUMBER_NAME[figure]].filter(Boolean).join(" · ")} />
          </Row>
        )}
        <button type="button" onClick={onAllWidgets} className="mt-1 flex w-fit items-center gap-1.5 text-[0.8125rem] text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:outline-1 focus-visible:outline-[color:var(--ring)]">
          Style of all {count.total} widgets <ArrowRight className="size-3.5" />
        </button>
      </InspectorSection>

      <Flyout open={fly === "header"} onClose={() => setFly(null)} anchor={panelEdge} side="left" width={360} title={`${def.name} · Header`}>
        <div className="grid gap-5">
          {caps.titleStyle && (
            <Row label="Title" stack hint="Where the widget's title sits" own={!!own.headerForm} from="all widgets" onReset={() => setStyle({ headerForm: undefined }, "header-form")}>
              <Segmented label="Title style" value={form} options={HEADER_FORMS} onChange={(v) => setStyle({ headerForm: v }, "header-form")} />
            </Row>
          )}
          <Row label="Shows" stack hint="The parts of the header this widget shows" own={ownHeader} from="all widgets" onReset={() => onChange({ header: undefined }, `${w.id}-header-reset`)}>
            {/* The parts as chips, on or off at a glance (not a column of switches). */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Header parts">
              {HEADER_PARTS.filter((p) => canShow.includes(p.key)).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={header[p.key]}
                  title={p.hint}
                  onClick={() => onChange({ header: { ...w.header, [p.key]: !header[p.key] } }, `${w.id}-header-${p.key}`)}
                  className={cn("flex h-8 items-center gap-1.5 px-3 text-[0.8125rem]", chip(header[p.key]))}
                >
                  {header[p.key] && <Check className="size-3.5" />}
                  {p.label}
                </button>
              ))}
            </div>
            {(!canShow.includes("icon") || !canShow.includes("description")) && (
              <p className="text-[0.6875rem] leading-4 text-muted-foreground">
                {[!canShow.includes("icon") && "The icon shows with a Top or Tag title.", !canShow.includes("description") && "The description shows with More."].filter(Boolean).join(" ")}
              </p>
            )}
          </Row>
        </div>
      </Flyout>
      <Flyout open={fly === "charts"} onClose={() => setFly(null)} anchor={panelEdge} side="left" width={360} title={`${def.name} · Charts`}>
        <div className="grid gap-5">
          {caps.chart && (
            <Row label="Bars and gauges" stack own={!!own.chartStyle} from="all widgets" onReset={() => setStyle({ chartStyle: undefined }, "chart")}>
              <Segmented label="Bars and gauges" value={own.chartStyle ?? chartStyleOf(theme)} options={CHARTS} onChange={(v) => setStyle({ chartStyle: v }, "chart")} />
            </Row>
          )}
          {caps.figure && (
            <Row label="Main number" stack own={!!own.figureStyle} from="all widgets" onReset={() => setStyle({ figureStyle: undefined }, "figure")}>
              <Segmented label="Main number" value={figure} options={FIGURES} onChange={(v) => setStyle({ figureStyle: v }, "figure")} />
            </Row>
          )}
        </div>
      </Flyout>
      </>
      )}
    </>
  )
}

/** Writes this widget's own style, dropping what went back to All widgets (so an empty style is no style). */
function useOwnStyle(w: WidgetInstance, onChange: (patch: Partial<WidgetInstance>, key: string) => void) {
  return (patch: Partial<WidgetOwnStyle>, key: string) => {
    const next = Object.fromEntries(Object.entries({ ...(w.style ?? {}), ...patch }).filter(([, v]) => v !== undefined && v !== "")) as WidgetOwnStyle
    onChange({ style: Object.keys(next).length ? next : undefined }, `${w.id}-style-${key}`)
  }
}

/**
 * The widget's background: a tone of the theme, or on content widgets a picture under the card colour. A Star that
 * fills its card (Brand or Inverted Star) keeps that surface, so its background can't change.
 */
function OwnBackground({ w, onChange }: { w: WidgetInstance; onChange: (patch: Partial<WidgetInstance>, key: string) => void }) {
  const { theme } = useDesign()
  const file = useRef<HTMLInputElement>(null)
  const own = w.style ?? {}
  const parts = styleParts(w.type)
  const set = useOwnStyle(w, onChange)
  const star = filledStar(theme, w.emphasis)
  const fill: Fill = own.image && parts.image ? "image" : (own.tone ?? "card")
  const fills: { value: Fill; label: string; hint: string }[] = [
    { value: "card", label: "Card", hint: FILL_HINT.card },
    { value: "brand", label: "Brand", hint: FILL_HINT.brand },
    { value: "highlight", label: "Highlight", hint: FILL_HINT.highlight },
    ...(parts.image ? [{ value: "image" as const, label: "Image", hint: FILL_HINT.image }] : []),
  ]
  const uploaded = own.image && !own.image.startsWith("preset:") ? own.image : undefined
  return (
    <>
      {star ? (
        <p className="text-[0.6875rem] leading-4 text-muted-foreground">The page&apos;s Star keeps its colour fill. Set Stand out to Accent or Quiet to give it a background.</p>
      ) : (
        <>
          <Row label="Background" stack={fills.length > 3} hint={FILL_HINT[fill]} own={fill !== "card"} onReset={() => set({ tone: undefined, image: undefined, dim: undefined }, "fill")}>
            <Segmented
              label="Background"
              value={fill}
              options={fills}
              onChange={(v) =>
                v === "image" ? set({ tone: undefined, image: own.image ?? `preset:${BACKDROPS[0].id}` }, "fill") : set({ tone: v === "card" ? undefined : v, image: undefined, dim: undefined }, "fill")
              }
            />
          </Row>
          
          {fill === "image" && (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {BACKDROPS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => set({ image: `preset:${b.id}` }, "image")}
                    aria-pressed={own.image === `preset:${b.id}`}
                    title={b.name}
                    aria-label={b.name}
                    className={cn("grid rounded-[6px] p-0.5", card(own.image === `preset:${b.id}`))}
                  >
                    <span className="aspect-[4/3] rounded-[4px] bg-[#0b0c10]" style={{ backgroundImage: b.css, backgroundSize: "cover", backgroundPosition: "center" }} />
                  </button>
                ))}
                <button type="button" onClick={() => file.current?.click()} aria-pressed={!!uploaded} title={uploaded ? "Your picture: replace it" : "Upload a picture"} aria-label={uploaded ? "Replace your picture" : "Upload a picture"} className={cn("grid rounded-[6px] p-0.5", card(!!uploaded))}>
                  <span className="grid aspect-[4/3] place-items-center rounded-[4px] border border-dashed bg-cover bg-center" style={uploaded ? { backgroundImage: `url("${uploaded}")` } : undefined}>
                    {!uploaded && <ImagePlus className="size-3.5 text-muted-foreground" />}
                  </span>
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
              <SliderField label="Readability" value={widgetDimOf(own.dim)} min={MIN_WIDGET_DIM} max={95} unit="%" format={(v) => `${v}% card on top`} onChange={(dim) => set({ dim }, "dim")} />
            </>
          )}
        </>
      )}
    </>
  )
}

/** The widget's own fields (from the registry), the coach's own text, button and picture, and who sees it. */
export type PhoneOrder = { index: number; total: number; custom: boolean; onMove: (step: -1 | 1) => void; onReset: () => void }

function ContentTab({ w, pinned, onChange, part, phone }: { w: WidgetInstance; pinned?: boolean; onChange: (patch: Partial<WidgetInstance>, key: string) => void; part: "content" | "visibility"; phone?: PhoneOrder }) {
  const def = getWidget(w.type)!
  const { coach } = useDesign()
  const groups = useGroups(coach)
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  const note = w.note ?? {}
  const hasNote = Object.values(note).some(Boolean)
  const [adding, setAdding] = useState(false)
  const setNote = (k: keyof WidgetNote, v: string) => onChange({ note: { ...w.note, [k]: v || undefined } }, `${w.id}-note-${k}`)
  const setShow = (k: "phase" | "group", v: string) => onChange({ show: { ...w.show, [k]: v || undefined } }, `${w.id}-show-${k}`)
  const select = cn(BOX, "w-full px-2")
  const variant = lookOf(def, w.variant).value
  // A field this layout draws only with More waits for More, and says so (as the header's description does).
  const all = settingsFor(def, w.variant)
  const unlocked = all.filter((s) => !s.more?.includes(variant) || w.detail === "detailed")
  const settings = unlocked.filter((s) => settingApplies(def, s, props))
  const later = all.filter((s) => !unlocked.includes(s))
  const free = !pinned && def.type !== "page-header"
  // Only where the layout draws it: the coach's own text, button and picture.
  const drawsNote = free && capsOf(w.type, variant).note
  if (part === "visibility")
    return free ? <Visibility w={w} onChange={onChange} groups={groups} setShow={setShow} select={select} phone={phone} /> : null
  return (
    <>
      {/* One block for everything the widget says: its own fields, then the coach's extra text, button or picture. */}
      {(all.length > 0 || drawsNote) && (
        <InspectorSection title="Content">
          {settings.map((s) => {
            if (s.type === "cards")
              return <MediaCardsEditor key={s.key} kind={s.kind} max={s.max} label={s.label} props={props} onProps={(patch, key) => onChange({ props: { ...props, ...patch } }, `${w.id}-${key}`)} picture={(value, onPick) => <PictureUpload value={value} onChange={onPick} />} />
            if (s.type === "toggle")
              return (
                <Row key={s.key} label={s.label} stack={s.label.length > 14}>
                  <YesNo label={s.label} value={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onChange={(v) => setProp(s.key, v)} />
                </Row>
              )
            if (s.type === "select")
              return (
                <Row key={s.key} label={s.label} stack={s.label.length > 14}>
                  <SelectOptions value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProp(s.key, e.target.value)} aria-label={s.label} className={select}>
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectOptions>
                </Row>
              )
            if (s.type === "image")
              return (
                <Row key={s.key} label={s.label} stack>
                  <PictureUpload value={typeof props[s.key] === "string" ? String(props[s.key]) : ""} onChange={(v) => setProp(s.key, v)} />
                </Row>
              )
            return (
              <Row key={s.key} label={s.label} stack>
                {s.type === "textarea" ? (
                  <Textarea value={String(props[s.key] ?? "")} placeholder="Leave empty for the default text" aria-label={s.label} onChange={(e) => setProp(s.key, e.target.value)} className="min-h-20 text-[0.8125rem]" />
                ) : (
                  <Input value={String(props[s.key] ?? "")} placeholder={s.placeholder ?? "Leave empty for the default"} aria-label={s.label} onChange={(e) => setProp(s.key, e.target.value)} className="h-8 text-[0.8125rem]" />
                )}
              </Row>
            )
          })}
          {later.length > 0 && <p className="text-[0.6875rem] leading-4 text-muted-foreground">{later.map((s) => s.label).join(", ")} shows with More.</p>}
          {drawsNote && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {hasNote || adding ? (
            <>
              <Row label="Text" stack>
                <Textarea value={note.text ?? ""} aria-label="Text" onChange={(e) => setNote("text", e.target.value)} className="min-h-20 text-[0.8125rem]" />
              </Row>
              <Row label="Button">
                <Input value={note.button ?? ""} placeholder="Button text" aria-label="Button text" onChange={(e) => setNote("button", e.target.value)} className="h-8 text-[0.8125rem]" />
              </Row>
              <Row label="Opens">
                <SelectOptions value={note.target ?? noteTargets()[0].value} aria-label="Opens" onChange={(e) => setNote("target", e.target.value)} className={select}>
                  {noteTargets().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectOptions>
              </Row>
              {note.target === "url" && (
                <Row label="Address">
                  <Input value={note.url ?? ""} placeholder="https://" aria-label="Web address" onChange={(e) => setNote("url", e.target.value)} className="h-8 text-[0.8125rem]" />
                </Row>
              )}
              <Row label="Picture" stack>
                <PictureUpload value={note.image} onChange={(v) => setNote("image", v)} />
              </Row>
            </>
          ) : (
            // Its own text, button or picture, one click away, under the widget's own fields.
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => setAdding(true)}>
              <Plus /> Add text, button or picture
            </Button>
          )}
            </div>
          )}
        </InspectorSection>
      )}


    </>
  )
}

/** Who sees the widget: phones, a phase of the student's life, a group. Last in the panel: set once, rarely changed. */
/** A control that can't be used right now: dimmed, dashed edge, not-allowed cursor. */
const DISABLED = "cursor-not-allowed border-dashed opacity-40"

function Visibility({ w, onChange, groups, setShow, select, phone }: { w: WidgetInstance; onChange: (patch: Partial<WidgetInstance>, key: string) => void; groups: { id: string; name: string }[]; setShow: (k: "phase" | "group", v: string) => void; select: string; phone?: PhoneOrder }) {
  // Hidden: who sees it doesn't apply, so Phase and Group stay in view, plainly off (dimmed, dashed, no pointer), with why.
  const off = !!w.hideOnPhone
  return (
      <InspectorSection title="Visibility">
        <Row label="On phones" own={!!w.hideOnPhone} onReset={() => onChange({ hideOnPhone: false }, `${w.id}-phone`)} from="shown">
          <Segmented
            label="On phones"
            value={w.hideOnPhone ? "hide" : "show"}
            onChange={(v) => onChange({ hideOnPhone: v === "hide" }, `${w.id}-phone`)}
            options={[
              { value: "show", label: "Show" },
              { value: "hide", label: "Hide" },
            ]}
          />
        </Row>
        {phone && !off && phone.index >= 0 && (
          <Row label="Order on phones" hint={phone.custom ? `Number ${phone.index + 1} of ${phone.total}, set for phones` : `Number ${phone.index + 1} of ${phone.total}, same as the desktop`} own={phone.custom} onReset={phone.onReset} from="desktop order">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={phone.index === 0} onClick={() => phone.onMove(-1)}>
                <ArrowUp /> Earlier
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={phone.index === phone.total - 1} onClick={() => phone.onMove(1)}>
                <ArrowDown /> Later
              </Button>
            </div>
          </Row>
        )}
        <Row label="Phase" hint={off ? "Hidden on phones: shown again with Show" : "Show it only in one phase of a student's life"} own={!!w.show?.phase} onReset={() => setShow("phase", "")} from="everyone">
          <SelectOptions disabled={off} value={w.show?.phase ?? ""} aria-label="Phase" onChange={(e) => setShow("phase", e.target.value)} className={cn(select, off && DISABLED)}>
            {PHASES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectOptions>
        </Row>
        <Row label="Group" hint={off ? "Hidden on phones: shown again with Show" : "Show it only to one group"} own={!!w.show?.group} onReset={() => setShow("group", "")} from="everyone">
          <SelectOptions disabled={off} value={w.show?.group ?? ""} aria-label="Group" onChange={(e) => setShow("group", e.target.value)} className={cn(select, off && DISABLED)}>
            <option value="">Everyone</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </SelectOptions>
        </Row>
      </InspectorSection>
  )
}

/** A property whose choice opens beside the panel: its current value and a chevron (Layout, Header, Charts). */
export function OpenRow({ open, onClick, value }: { open: boolean; onClick: () => void; value: string }) {
  return (
    <button type="button" aria-expanded={open} onClick={onClick} className={cn(BOX, "flex w-full items-center justify-between gap-2 pr-1.5 pl-3 text-left hover:text-foreground", open && "border-[color:var(--ts-interactive)]")}>
      <span className="truncate">{value}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
