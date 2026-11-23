"use client"
import { useEffect, useRef, useState } from "react"
import { toast } from "@/lib/toast"
import { ArrowRight, Check, ChevronRight, ImagePlus } from "@/components/icons"
import { fitWidth, getWidget, lookOf, styleParts } from "@/components/widgets/registry"
import { filledStar } from "@/components/widgets/parts/widget-scope"
import { pictureFrom } from "@/lib/images"
import { BACKDROPS, MIN_WIDGET_DIM, widgetDimOf } from "@/lib/theme/backdrops"
import { chartStyleOf, figureStyleOf, headerFormOf, widgetFontOf, widgetHeaderOf, widgetSetOf, type CardSurface, type ChartStyle, type FigureStyle, type HeaderForm, type WidgetHeader } from "@/lib/theme/types"
import type { WidgetInstance, WidgetOwnStyle } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { BOX, InspectorSection, Row, Segmented, SliderField } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { card, chip } from "../states"
import { DETAIL, EMPHASIS, type AddOptions } from "./builder-panels"
import { ThumbCard, WidgetThumb, dragGhost } from "../thumbs/widget-thumb"
import { CardArt, OptionTiles } from "../thumbs/option-art"
import { Flyout } from "./flyout"
import { capsOf, headerParts } from "./widget-caps"

export const HEADER_NAME = { top: "Top", label: "Label", caption: "Caption", tag: "Tag", path: "Path" } as const
export const CHART_NAME = { ticks: "Ticks", solid: "Solid", thin: "Thin", blocks: "Blocks", dots: "Dots" } as const
export const NUMBER_NAME = { plain: "Plain", marked: "Marked", display: "Display", mono: "Mono" } as const

export const SURFACES: { value: CardSurface | "blended"; label: string; hint: string }[] = [
  { value: "raised", label: "Raised", hint: "The card colour, standing on the page" },
  { value: "grey", label: "Grey", hint: "A flat grey card on the page colour" },
  { value: "outline", label: "Outline", hint: "No fill, a fine line around it" },
  { value: "blended", label: "Blended", hint: "No card: it sits right on the page" },
]
export const HEADER_FORMS: { value: HeaderForm; label: string }[] = (Object.keys(HEADER_NAME) as HeaderForm[]).map((value) => ({ value, label: HEADER_NAME[value] }))
export const CHARTS: { value: ChartStyle; label: string }[] = (Object.keys(CHART_NAME) as ChartStyle[]).map((value) => ({ value, label: CHART_NAME[value] }))
export const FIGURES: { value: FigureStyle; label: string }[] = (["plain", "marked", "display", "mono"] as const).map((value) => ({ value, label: NUMBER_NAME[value] }))
export type Fill = "card" | "brand" | "highlight" | "image"
export const FILL_HINT: Record<Fill, string> = {
  card: "The card colour, as every widget has it",
  brand: "A touch of your brand colour in the card",
  highlight: "A touch of your highlight colour in the card",
  image: "A picture under the card colour, so the text stays readable",
}
/** Detail, in plain words: how much of its data a widget shows. */
export const SHOWS = { compact: "Less", standard: "Standard", detailed: "More" } as const

export const HEADER_PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title" },
  { key: "value", label: "Value chip", hint: "The figure on the right, like “58% win”" },
]

export function StyleTab({
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
  const pick = (v: (typeof def.variants)[number]) => onChange({ variant: v.value }, `${w.id}-variant`)
  const detail = w.detail ?? "standard"
  const emphasis = w.emphasis ?? "accent"
  const baseDetail = start?.detail ?? "standard"
  const baseEmphasis = start?.emphasis ?? "accent"
  // One flyout at a time beside the panel: the header, or the charts and numbers.
  const [fly, setFly] = useState<"header" | "charts" | null>(null)
  // The flyouts open against the inspector's edge: the panel (aside) that holds this block. Taken from the block's own
  // root, so it is there in both parts (it was read from the Layout button, absent in Style: Header and Charts never opened).
  const root = useRef<HTMLDivElement>(null)
  const panelEdge = useRef<HTMLElement | null>(null)
  useEffect(() => {
    panelEdge.current = root.current?.closest("aside,[data-editor-panel]") ?? null
  })
  const header = widgetHeaderOf(theme, w.header)
  const own = w.style ?? {}
  const caps = capsOf(w.type, look.value, theme)
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
        {!pinned && def.type !== "page-header" && <p className="px-0.5 t-caption text-muted-foreground">Drag the lines between cards to resize.</p>}
        {def.variants.length > 1 && (
          // Every layout of this widget as a picture, open under Size: one click swaps it on the page (the gallery's tiles, same widget, same draft).
          <Row label="Layout" stack own={look.value !== first} onReset={() => pick(lookOf(def, first))}>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Layout">
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
                          onDrag({ variant: v.value, w: 12, detail, props: {} })
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
                  tight
                  dragHint={!!onDrag && !pinned}
                  thumb={<WidgetThumb inset={0.03} w={{ ...w, variant: v.value, w: fitWidth(def, v.value, w.w) }} />}
                  title={v.label}
                />
              ))}
            </div>
          </Row>
        )}
        {caps.shows.length > 1 && (
          <Row label="Shows" hint={DETAIL.find((o) => o.value === shown)?.hint} own={detail !== baseDetail} onReset={() => onChange({ detail: baseDetail }, `${w.id}-detail`)}>
            <Segmented label="How much it shows" value={shown} options={DETAIL.filter((o) => caps.shows.includes(o.value)).map((o) => ({ value: o.value, label: SHOWS[o.value], hint: o.hint }))} onChange={(v) => onChange({ detail: v }, `${w.id}-detail`)} />
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
        <button type="button" onClick={onAllWidgets} className="mt-1 flex w-fit items-center gap-1.5 t-body-m text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:outline-1 focus-visible:outline-[color:var(--ring)]">
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
                  className={cn("flex h-8 items-center gap-1.5 px-3 t-body-m", chip(header[p.key]))}
                >
                  {header[p.key] && <Check className="size-3.5" />}
                  {p.label}
                </button>
              ))}
            </div>
            {((caps.icon && !canShow.includes("icon")) || (caps.description && !canShow.includes("description"))) && (
              <p className="t-caption text-muted-foreground">
                {[caps.icon && !canShow.includes("icon") && "The icon shows with a Top or Tag title.", caps.description && !canShow.includes("description") && "The description shows with More."].filter(Boolean).join(" ")}
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
export function useOwnStyle(w: WidgetInstance, onChange: (patch: Partial<WidgetInstance>, key: string) => void) {
  return (patch: Partial<WidgetOwnStyle>, key: string) => {
    const next = Object.fromEntries(Object.entries({ ...(w.style ?? {}), ...patch }).filter(([, v]) => v !== undefined && v !== "")) as WidgetOwnStyle
    onChange({ style: Object.keys(next).length ? next : undefined }, `${w.id}-style-${key}`)
  }
}

/**
 * The widget's background: a tone of the theme, or on content widgets a picture under the card colour. A Star that
 * fills its card (Brand or Inverted Star) keeps that surface, so its background can't change.
 */
export function OwnBackground({ w, onChange }: { w: WidgetInstance; onChange: (patch: Partial<WidgetInstance>, key: string) => void }) {
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
        <p className="t-caption text-muted-foreground">The page&apos;s Star keeps its colour fill. Set Stand out to Accent or Quiet to give it a background.</p>
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
                    {/* Exception: #0b0c10 is the student page ground under the background thumbnail, not an Admin colour. */}
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

/** A property whose choice opens beside the panel: its current value and a chevron (Layout, Header, Charts). */
export function OpenRow({ open, onClick, value }: { open: boolean; onClick: () => void; value: string }) {
  return (
    <button type="button" aria-expanded={open} onClick={onClick} className={cn(BOX, "flex w-full items-center justify-between gap-2 pr-1.5 pl-3 text-left hover:text-foreground", open && "border-[color:var(--ts-interactive)]")}>
      <span className="truncate">{value}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
