"use client"

import { Check, ImagePlus } from "lucide-react"
import { useRef, useState } from "react"
import type { ThemeDraft } from "@/lib/prototype-store"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { chartStyleOf, figureStyleOf, headerFormOf, panelStyleOf, starStyleOf, widgetFinishOf, widgetFontOf, widgetHeaderOf, widgetSetOf, widgetStyleOf, type CoachTheme, type FigureStyle, type PanelStyle, type WidgetHeader, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"
import { DesignField, useDesign } from "./design-fields"
import { FONT_PAIRS } from "./options"

/**
 * The theme editor's own fields, beside the Design fields (design-fields.tsx):
 * where one simpler control says more than several. Shared by the admin's
 * Design and the library's theme editor; drawn in the host's shadcn tokens.
 * They edit through the same `change`, so undo and reset work the same.
 */

/** Keyboard focus ring for the fields drawn here. */
export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring"

/* ---------- Header parts: four toggle chips ---------- */

const PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title" },
  { key: "value", label: "Value", hint: "The figure on the right, like “58% win”" },
]
/** The four header parts as toggle chips: one compact row instead of four switches with captions. */
export function HeaderPartsField() {
  const { theme, change } = useDesign()
  const on = widgetHeaderOf(theme)
  return (
    <div className="grid gap-1.5" data-field="widget-header">
      <span className="text-xs text-muted-foreground">Show in every widget’s header</span>
      <div className="flex flex-wrap gap-1.5">
        {PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={on[p.key]}
            title={p.hint}
            onClick={() => change({ theme: { widgetHeader: { [p.key]: !on[p.key] } } }, `header-${p.key}`)}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-150",
              FOCUS,
              on[p.key] ? "border-transparent bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on[p.key] && <Check className="size-3" strokeWidth={3} />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Numbers: one control for how figures look ---------- */

/** How headline numbers read. Mono also sets the widget font (figures and small labels) to mono; the rest use the heading font. */
const NUMBERS: { value: FigureStyle; label: string; hint: string; font: "mono" | "heading" | "body" }[] = [
  { value: "plain", label: "Plain", hint: "The text font, nothing added", font: "body" },
  { value: "marked", label: "Marked", hint: "A bar in the accent beside the number", font: "heading" },
  { value: "display", label: "Display", hint: "The heading font, the change under it", font: "heading" },
  { value: "mono", label: "Mono", hint: "Figures and small labels in mono, like a terminal", font: "mono" },
]
export function NumbersField() {
  const { theme, change } = useDesign()
  const now = widgetFontOf(theme) === "mono" ? "mono" : figureStyleOf(theme)
  const pick = NUMBERS.find((n) => n.value === now) ?? NUMBERS[0]
  return (
    <Field id="numbers" label="Headline numbers" hint={pick.hint}>
      <Segmented
        label="Headline numbers"
        value={now}
        onChange={(v) => {
          const n = NUMBERS.find((x) => x.value === v)!
          change({ theme: { figureStyle: n.value, widgetFont: n.font } }, "numbers")
        }}
        options={NUMBERS.map((n) => ({ value: n.value, label: n.label }))}
      />
    </Field>
  )
}

/* ---------- Widget style as a preset ---------- */

/** Everything a widget style decides, as it would be with nothing changed. */
function presetOf(t: CoachTheme, style: WidgetStyle): ThemeDraft {
  const bare = { template: t.template, widgetStyle: style, background: t.background }
  return {
    widgetStyle: style,
    widgetSet: widgetSetOf(bare),
    cardSurface: "raised",
    panelStyle: panelStyleOf(bare),
    headerForm: headerFormOf(bare),
    chartStyle: chartStyleOf(bare),
    figureStyle: figureStyleOf(bare),
    widgetFont: widgetFontOf(bare),
    starStyle: starStyleOf(bare),
    widgetFinish: widgetFinishOf(bare),
  }
}
const PRESET_KEYS = ["widgetSet", "cardSurface", "panelStyle", "headerForm", "chartStyle", "figureStyle", "widgetFont", "starStyle", "widgetFinish"] as const
const STYLES: { value: WidgetStyle; label: string; hint: string }[] = [
  { value: "instrument", label: "Instrument", hint: "Mono figures, tick charts, one sheet" },
  { value: "soft", label: "Soft", hint: "Rounded cards, filled panels" },
  { value: "editorial", label: "Editorial", hint: "Heading font, hairlines, open layout" },
]
/**
 * A starting look for every widget: picking one sets all the widget settings
 * below to that style. Change any of them and the style reads Custom; pick it
 * again to go back.
 */
export function StylePresetField() {
  const { theme, change } = useDesign()
  const style = widgetStyleOf(theme)
  const p = presetOf(theme, style)
  const resolved: Record<string, unknown> = {
    widgetSet: widgetSetOf(theme),
    cardSurface: theme.cardSurface ?? "raised",
    panelStyle: panelStyleOf(theme),
    headerForm: headerFormOf(theme),
    chartStyle: chartStyleOf(theme),
    figureStyle: figureStyleOf(theme),
    widgetFont: widgetFontOf(theme),
    starStyle: starStyleOf(theme),
    widgetFinish: widgetFinishOf(theme),
  }
  const custom = PRESET_KEYS.some((k) => resolved[k] !== p[k])
  return (
    <Field id="widget-style" label="Widget look" hint={custom ? "Custom: you changed settings below" : STYLES.find((s) => s.value === style)?.hint}>
      <Segmented
        label="Widget look"
        value={custom ? ("custom" as WidgetStyle) : style}
        onChange={(v) => change({ theme: presetOf(theme, v) }, `preset-${v}`)}
        options={STYLES.map((s) => ({ value: s.value, label: s.label }))}
      />
    </Field>
  )
}

/* ---------- Colours from a logo ---------- */

export function LogoColoursField() {
  const { change } = useDesign()
  const [colours, setColours] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const onFile = async (file: File) => {
    setBusy(true)
    try {
      const url = await new Promise<string>((res) => {
        const r = new FileReader()
        r.onload = () => res(r.result as string)
        r.readAsDataURL(file)
      })
      setColours(await colorsFromLogo(url, 5))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">From a logo</span>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn("flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground", FOCUS)}
        >
          <ImagePlus className="size-3.5" /> {busy ? "Reading…" : colours.length ? "Another logo" : "Upload a logo"}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ""
          }}
        />
      </div>
      {colours.length > 0 && (
        <div className="grid gap-1.5 rounded-lg bg-muted p-2">
          <span className="text-xs text-muted-foreground">Click to use as the brand colour; ⇧-click for the highlight</span>
          <div className="flex gap-2">
            {colours.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={`Use ${c}`}
                onClick={(e) => change({ theme: e.shiftKey ? { highlight: c } : { primary: c, primaryForeground: undefined } }, e.shiftKey ? "highlight" : "primary")}
                className="size-6 rounded-full ring-1 ring-border ring-inset transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Shuffle ---------- */

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
/** A random personality on top of the theme: fonts, shape, depth, spacing and the widget look. Brand colours stay. */
export function shuffled(t: CoachTheme): ThemeDraft {
  const pair = pick(FONT_PAIRS)
  const style = pick(["instrument", "soft", "editorial"] as const)
  const radius = pick([0, 2, 6, 10, 14, 20])
  return {
    ...presetOf(t, style),
    fonts: { heading: pair.heading, body: pair.body, label: pair.label },
    radius,
    buttonShape: radius <= 3 ? "square" : radius >= 16 ? pick(["pill", "rounded"] as const) : pick(["rounded", "pill", "square"] as const),
    shadow: pick(["none", "soft", "strong"] as const),
    borders: Math.random() < 0.6,
    density: pick(["compact", "comfortable", "airy"] as const),
    headingWeight: pick([400, 500, 600, 700] as const),
    labelStyle: Math.random() < 0.35 ? "caps" : "plain",
    effects: pick(["flat", "soft", "vivid"] as const),
    chartStyle: pick(["ticks", "solid", "thin", "blocks", "dots"] as const),
  }
}

/* ---------- Card: how each widget sits on the page, as pictures ---------- */

type SurfaceId = "raised" | "grey" | "outline" | "sheet" | "open"
const SURFACES: { id: SurfaceId; label: string; hint: string; set: ThemeDraft }[] = [
  { id: "raised", label: "Raised", hint: "Cards stand on the page", set: { widgetSet: "cards", cardSurface: "raised" } },
  { id: "grey", label: "Grey", hint: "Flat grey cards on the page colour", set: { widgetSet: "cards", cardSurface: "grey" } },
  { id: "outline", label: "Outline", hint: "No fill, a fine line around each", set: { widgetSet: "cards", cardSurface: "outline" } },
  { id: "sheet", label: "Sheet", hint: "One surface, split by fine lines", set: { widgetSet: "sheet", cardSurface: "raised" } },
  { id: "open", label: "Open", hint: "No fill, the page shows through; a fine line around each", set: { widgetSet: "open" } },
]

/** Four widgets on a page, drawn the way `id` sets them. */
function SurfacePicture({ id }: { id: SurfaceId }) {
  const tile = {
    raised: "rounded-[3px] bg-background shadow-[0_1px_2px_rgb(0_0_0/0.25)]",
    grey: "rounded-[3px] bg-foreground/10",
    outline: "rounded-[3px] border border-foreground/25",
    sheet: "",
    open: "rounded-[3px] border border-dashed border-foreground/30",
  }[id]
  const bar = <span className="block h-1 w-2/3 rounded-full bg-foreground/35" />
  return (
    <span aria-hidden className="grid aspect-[4/3] w-full overflow-hidden rounded-md bg-muted p-1.5">
      <span className={cn("grid size-full grid-cols-2 grid-rows-2", id === "sheet" ? "gap-px overflow-hidden rounded-[3px] bg-foreground/20" : "gap-1")}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("grid content-start p-1", id === "sheet" ? "bg-background" : tile)}>
            {bar}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * One choice for how widgets sit on the page: three kinds of card, one
 * surface split by lines, or no box at all. Raised cards also take a shadow,
 * shown only then, so no setting here ever does nothing.
 */
export function SurfaceField() {
  const { theme, change } = useDesign()
  const set = widgetSetOf(theme)
  const now: SurfaceId = set === "cards" ? (theme.cardSurface ?? "raised") : set
  const pick = SURFACES.find((s) => s.id === now)!
  return (
    <div className="grid gap-4">
      <Field id="widget-set" label="Widgets" hint={pick.hint}>
        <div role="radiogroup" aria-label="Widgets" className="grid grid-cols-5 gap-1.5">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={s.id === now}
              title={s.hint}
              onClick={() => change({ theme: s.set }, "surface")}
              className={cn(
                "grid gap-1 rounded-lg p-1 text-[0.6875rem] transition-colors duration-150",
                FOCUS,
                s.id === now ? "bg-muted text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <SurfacePicture id={s.id} />
              {s.label}
            </button>
          ))}
        </div>
      </Field>
      {now === "raised" && <DesignField id="shadows" />}
    </div>
  )
}

/* ---------- The box behind a widget's chart, as pictures ---------- */

const PANELS: { value: PanelStyle; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "Charts sit right on the widget" },
  { value: "filled", label: "Filled", hint: "Charts sit on a soft inner panel" },
  { value: "outline", label: "Outline", hint: "Charts sit in a fine-line box" },
]
function PanelPicture({ value }: { value: PanelStyle }) {
  return (
    <span aria-hidden className="grid aspect-[4/3] w-full rounded-md bg-muted p-1.5">
      <span className="grid size-full rounded-[3px] bg-background p-1">
        <span className={cn("grid items-end rounded-[2px] p-0.5", value === "filled" && "bg-foreground/10", value === "outline" && "border border-foreground/25")}>
          <svg viewBox="0 0 40 16" className="h-3 w-full text-foreground/60" preserveAspectRatio="none">
            <polyline points="0,14 8,10 16,12 24,5 32,7 40,2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </span>
    </span>
  )
}
export function ChartPanelField() {
  const { theme, change } = useDesign()
  const now = panelStyleOf(theme)
  return (
    <Field id="panel-style" label="Chart background" hint={PANELS.find((p) => p.value === now)?.hint}>
      <div role="radiogroup" aria-label="Chart background" className="grid grid-cols-3 gap-1.5">
        {PANELS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={p.value === now}
            title={p.hint}
            onClick={() => change({ theme: { panelStyle: p.value } }, "panel-style")}
            className={cn(
              "grid gap-1 rounded-lg p-1 text-[0.6875rem] transition-colors duration-150",
              FOCUS,
              p.value === now ? "bg-muted text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <PanelPicture value={p.value} />
            {p.label}
          </button>
        ))}
      </div>
    </Field>
  )
}
