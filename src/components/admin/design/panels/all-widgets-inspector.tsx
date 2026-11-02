"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Check } from "@/components/icons"
import type { ThemeDraft } from "@/lib/prototype-store"
import { chartStyleOf, headerFormOf, panelStyleOf, widgetFinishOf, widgetFontOf, figureStyleOf, widgetHeaderOf, type ChartStyle, type HeaderForm, type WidgetHeader } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { InspectorSection, Row, Segmented, SliderField } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { NUMBERS, PANELS, StylePresetField, SURFACES, surfaceOf, type SurfaceId } from "../fields/settings-fields"
import { chip } from "../states"
import { CardArt, OptionTiles } from "../thumbs/option-art"
import { changedIn } from "./settings-panel"
import { Flyout } from "./flyout"
import { InspectorTop, OpenRow } from "./widget-inspector"

/*
 * Every widget's style, in the right panel: the same panel as one widget's (name on top, folding sections, one row per
 * property with its reset, the header and the charts opening beside the panel), so the two read as one place. The
 * values are the theme's; a row is marked when it differs from the look, and its reset puts the look's value back.
 */

const HEADER_FORMS: { value: HeaderForm; label: string; hint: string }[] = [
  { value: "top", label: "Top", hint: "Icon, name and value on top" },
  { value: "label", label: "Label", hint: "A small label line, no icon" },
  { value: "caption", label: "Caption", hint: "Under the content, like a caption" },
  { value: "tag", label: "Tag", hint: "The icon in a tile, the name in a pill" },
  { value: "path", label: "Path", hint: "Section / name, a fine line under it" },
]
const HEADER_PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title, when a widget shows More" },
  { key: "value", label: "Value chip", hint: "The figure on the right, like “58% win”" },
]
const CHARTS: { value: ChartStyle; label: string; hint: string }[] = [
  { value: "ticks", label: "Ticks", hint: "Segments, like an instrument" },
  { value: "solid", label: "Solid", hint: "One filled bar" },
  { value: "thin", label: "Thin", hint: "A fine line" },
  { value: "blocks", label: "Blocks", hint: "A few thick blocks" },
  { value: "dots", label: "Dots", hint: "A row of small squares" },
]
const SHADOWS = [
  { value: "none", label: "None", hint: "Cards sit flat on the page" },
  { value: "soft", label: "Soft", hint: "A light shadow lifts each card" },
  { value: "strong", label: "Strong", hint: "A deep shadow, tinted with your brand colour" },
] as const
const FINISHES = [
  { value: "none", label: "None", hint: "Nothing extra" },
  { value: "corners", label: "Corners", hint: "Small brackets on each widget's corners" },
  { value: "grid", label: "Grid", hint: "A field of small crosses behind the widgets" },
] as const
const BUTTONS = [
  { value: "square", radius: "2px", label: "Square" },
  { value: "rounded", radius: "5px", label: "Rounded" },
  { value: "pill", radius: "999px", label: "Pill" },
] as const

export function AllWidgetsInspector({ draft, onReset, onBack, back, own }: { draft: ThemeDraft; onReset: (keys: (keyof ThemeDraft)[]) => void; onBack: () => void; /** Where the arrow goes back to: the selected widget or the page. */ back: string; /** Widgets that keep their own style. */ own: number }) {
  const { theme, change } = useDesign()
  const [fly, setFly] = useState<"header" | "charts" | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const panelEdge = useRef<HTMLElement | null>(null)
  useEffect(() => {
    panelEdge.current = root.current?.closest("aside") ?? null
  })
  const set = (patch: ThemeDraft, key: string) => change({ theme: patch }, key)
  const changed = (...keys: (keyof ThemeDraft)[]) => changedIn(draft, keys)
  const surface: SurfaceId = surfaceOf(theme)
  const header = widgetHeaderOf(theme)
  const form = headerFormOf(theme)
  const numbers = widgetFontOf(theme) === "mono" ? "mono" : figureStyleOf(theme)
  const radius = theme.radius
  return (
    <div ref={root}>
      <InspectorTop>
        <div className="flex min-w-0 items-center gap-1">
          <button type="button" onClick={onBack} aria-label={`Back to ${back}`} title={`Back to ${back}`} className="-ml-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]">
            <ArrowLeft className="size-4" />
          </button>
          <span className="truncate text-[0.9375rem] font-semibold">All widgets</span>
        </div>
      </InspectorTop>
      <p className="-mt-1 px-5 pb-3 text-xs leading-4 text-muted-foreground">Every page.{own ? ` ${own} widget${own === 1 ? " keeps its" : "s keep their"} own style.` : ""}</p>

      <InspectorSection title="Card">
        <Row label="Card" hint={SURFACES.find((s) => s.id === surface)?.hint} own={changed("widgetSet", "cardSurface")} onReset={() => onReset(["widgetSet", "cardSurface", "shadow"])} from="the look" stack>
          {/* A choice of shape: pictures (the editor's rule), the rest in words. */}
          <OptionTiles label="Card" cols={2} value={surface} onChange={(v) => set(SURFACES.find((s) => s.id === v)!.set, "surface")} options={SURFACES.map((s) => ({ value: s.id, label: s.label, hint: s.hint, art: <CardArt surface={s.id} /> }))} />
        </Row>
        {/* Only raised cards take a shadow: the row shows then, so it never does nothing. */}
        {surface === "raised" && (
          <Row label="Shadow" hint={SHADOWS.find((s) => s.value === (theme.shadow ?? "none"))?.hint} own={changed("shadow")} onReset={() => onReset(["shadow"])} from="the look" stack>
            <OptionTiles label="Shadow" value={theme.shadow ?? "none"} onChange={(shadow) => set({ shadow }, "shadow")} options={SHADOWS.map((s) => ({ ...s, art: <CardArt shadow={s.value} /> }))} />
          </Row>
        )}
        <Row label="Chart background" hint={PANELS.find((p) => p.value === panelStyleOf(theme))?.hint} own={changed("panelStyle")} onReset={() => onReset(["panelStyle"])} from="the look" stack>
          <OptionTiles label="Chart background" value={panelStyleOf(theme)} onChange={(panelStyle) => set({ panelStyle }, "panel-style")} options={PANELS.map((p) => ({ ...p, art: <CardArt panel={p.value} /> }))} />
        </Row>
        <Row label="Outline" hint="A fine line round every card, the Star included" own={changed("borders")} onReset={() => onReset(["borders"])} from="the look">
          <Segmented label="Outline on cards" value={theme.borders ? "yes" : "no"} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} onChange={(v) => set({ borders: v === "yes" }, "borders")} />
        </Row>
      </InspectorSection>

      <InspectorSection title="Shape">
        {/* The slider carries its own name and value. */}
        <SliderField label="Corners" value={radius} min={0} max={24} unit="px" format={(r) => `${r <= 3 ? "Sharp" : r >= 16 ? "Very round" : "Round"} · ${r}px`} onChange={(r) => set({ radius: r }, "radius")} />
        <Row label="Buttons" hint="The buttons, menus and forms of your whole platform" own={changed("buttonShape")} onReset={() => onReset(["buttonShape"])} from="the look">
          <Segmented
            label="Button shape"
            value={theme.buttonShape}
            options={BUTTONS.map((b) => ({ value: b.value, name: b.label, hint: b.label, label: <span aria-hidden className="h-3.5 w-7 bg-current opacity-70" style={{ borderRadius: b.radius }} /> }))}
            onChange={(buttonShape) => set({ buttonShape }, "buttons")}
          />
        </Row>
        <Row label="Spacing" hint="Between and inside widgets, and across your platform" own={changed("density")} onReset={() => onReset(["density"])} from="the look">
          <Segmented label="Spacing" value={theme.density} options={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfy", hint: "Comfortable" }, { value: "airy", label: "Airy" }]} onChange={(density) => set({ density }, "density")} />
        </Row>
        <Row label="Finish" hint={FINISHES.find((f) => f.value === widgetFinishOf(theme))?.hint} own={changed("widgetFinish")} onReset={() => onReset(["widgetFinish"])} from="the look">
          <Segmented label="Finish" value={widgetFinishOf(theme)} options={FINISHES.map((f) => ({ ...f }))} onChange={(widgetFinish) => set({ widgetFinish }, "widget-finish")} />
        </Row>
      </InspectorSection>

      <InspectorSection title="Details">
        <Row label="Header" hint="Where the title sits and what the header shows" own={changed("headerForm", "widgetHeader")} onReset={() => onReset(["headerForm", "widgetHeader"])} from="the look">
          <OpenRow open={fly === "header"} onClick={() => setFly(fly === "header" ? null : "header")} value={`${HEADER_FORMS.find((f) => f.value === form)?.label} · ${HEADER_PARTS.filter((p) => header[p.key]).length} of 4 parts`} />
        </Row>
        <Row label="Charts" hint="How bars, gauges and the main number are drawn" own={changed("chartStyle", "figureStyle", "widgetFont")} onReset={() => onReset(["chartStyle", "figureStyle", "widgetFont"])} from="the look">
          <OpenRow open={fly === "charts"} onClick={() => setFly(fly === "charts" ? null : "charts")} value={`${CHARTS.find((c) => c.value === chartStyleOf(theme))?.label} · ${NUMBERS.find((n) => n.value === numbers)?.label}`} />
        </Row>
      </InspectorSection>

      <InspectorSection title="Advanced" defaultOpen={false}>
        <StylePresetField />
      </InspectorSection>

      <Flyout open={fly === "header"} onClose={() => setFly(null)} anchor={panelEdge} side="left" width={360} title="All widgets · Header">
        <div className="grid gap-5">
          <Row label="Title" stack hint={HEADER_FORMS.find((f) => f.value === form)?.hint} own={changed("headerForm")} onReset={() => onReset(["headerForm"])} from="the look">
            <Segmented label="Title style" value={form} options={HEADER_FORMS} onChange={(headerForm) => set({ headerForm }, "header-form")} />
          </Row>
          <Row label="Shows" stack hint="The parts of every widget's header" own={changed("widgetHeader")} onReset={() => onReset(["widgetHeader"])} from="the look">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Header parts">
              {HEADER_PARTS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={header[p.key]}
                  title={p.hint}
                  // The theme merge replaces the whole object: each click saves all four.
                  onClick={() => set({ widgetHeader: { ...header, [p.key]: !header[p.key] } }, `header-${p.key}`)}
                  className={cn("flex h-8 items-center gap-1.5 px-3 text-[0.8125rem]", chip(header[p.key]))}
                >
                  {header[p.key] && <Check className="size-3.5" />}
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[0.6875rem] leading-4 text-muted-foreground">The icon shows with a Top or Tag title, the description when a widget shows More.</p>
          </Row>
        </div>
      </Flyout>
      <Flyout open={fly === "charts"} onClose={() => setFly(null)} anchor={panelEdge} side="left" width={360} title="All widgets · Charts">
        <div className="grid gap-5">
          <Row label="Bars and gauges" stack hint={CHARTS.find((c) => c.value === chartStyleOf(theme))?.hint} own={changed("chartStyle")} onReset={() => onReset(["chartStyle"])} from="the look">
            <Segmented label="Bars and gauges" value={chartStyleOf(theme)} options={CHARTS} onChange={(chartStyle) => set({ chartStyle }, "chart-style")} />
          </Row>
          <Row label="Main number" stack hint={NUMBERS.find((n) => n.value === numbers)?.hint} own={changed("figureStyle", "widgetFont")} onReset={() => onReset(["figureStyle", "widgetFont"])} from="the look">
            <Segmented
              label="Main number"
              value={numbers}
              options={NUMBERS.map((n) => ({ value: n.value, label: n.label, hint: n.hint }))}
              onChange={(v) => {
                const n = NUMBERS.find((x) => x.value === v)!
                set({ figureStyle: n.value, widgetFont: n.font }, "numbers")
              }}
            />
          </Row>
        </div>
      </Flyout>
    </div>
  )
}
