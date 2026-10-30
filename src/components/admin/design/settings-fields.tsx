"use client"

import { Check, ImagePlus } from "lucide-react"
import { useRef, useState } from "react"
import type { ThemeDraft } from "@/lib/prototype-store"
import { toast } from "sonner"
import { readAsDataUrl } from "@/lib/images"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { chartStyleOf, figureStyleOf, headerFormOf, panelStyleOf, starStyleOf, widgetFinishOf, widgetFontOf, widgetHeaderOf, widgetSetOf, widgetStyleOf, type CoachTheme, type FigureStyle, type PanelStyle, type WidgetHeader, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { Field, Segmented } from "./controls"
import { useDesign } from "./design-fields"
import { card, chip } from "./states"

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
/** The four header parts as toggle chips: one compact row instead of four switches with captions. Each click saves all four (the theme merge replaces the whole object). */
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
            onClick={() => change({ theme: { widgetHeader: { ...on, [p.key]: !on[p.key] } } }, `header-${p.key}`)}
            className={cn(
              "flex h-7 items-center gap-1.5 px-2.5 text-xs",
              FOCUS,
              chip(on[p.key]),
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
  { value: "instrument", label: "Instrument", hint: "Mono figures, tick charts, corner marks" },
  { value: "soft", label: "Soft", hint: "Rounded cards, filled panels" },
  { value: "editorial", label: "Editorial", hint: "Heading font, hairlines, open layout" },
]
/**
 * A starting look for every widget: picking one sets all the widget settings
 * (Card, Header, Numbers, Charts, Finish, and the Star) to that style. Change any
 * of them and the style reads Custom; pick it again to go back. In Widgets →
 * Advanced, apart from the platform's Look.
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
    <Field id="widget-style" label="Widget look" hint={custom ? "Custom: you changed settings above" : STYLES.find((s) => s.value === style)?.hint}>
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
      setColours(await colorsFromLogo(await readAsDataUrl(file), 5))
    } catch {
      toast.error("Couldn't read that image", { description: "Try a PNG, JPG or SVG." })
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

/* ---------- Card: how each widget sits on the page, as pictures ---------- */

type SurfaceId = "raised" | "grey" | "outline"
const SURFACES: { id: SurfaceId; label: string; hint: string; set: ThemeDraft }[] = [
  { id: "raised", label: "Raised", hint: "Cards stand on the page", set: { widgetSet: "cards", cardSurface: "raised" } },
  { id: "grey", label: "Grey", hint: "Flat grey cards on the page colour", set: { widgetSet: "cards", cardSurface: "grey" } },
  { id: "outline", label: "Outline", hint: "No fill, a fine line around each", set: { widgetSet: "cards", cardSurface: "outline" } },
]

/** The page behind every card picture: a step off the panel, with a faint edge, the same in Widgets, Shadows and Chart background. */
const PICTURE_PAGE = "grid aspect-[4/3] w-full overflow-hidden rounded-md bg-[color-mix(in_oklab,var(--foreground)_4%,var(--background))] p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
/** A raised card in the pictures: lighter than the page in dark mode, white on a light one. */
const PICTURE_RAISED = "bg-background dark:bg-[color-mix(in_oklab,var(--foreground)_15%,var(--background))] dark:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]"

/** What a card holds in the pictures: a name, a figure and a small line chart. */
function PictureContent() {
  return (
    <>
      <span className="block h-[3px] w-3/5 rounded-full bg-foreground/35" />
      <span className="block h-1.5 w-2/5 rounded-full bg-foreground/75" />
      <svg viewBox="0 0 40 10" preserveAspectRatio="none" className="h-2 w-full text-foreground/50">
        <polyline points="0,8 7,6 13,7 20,3 27,5 33,2 40,3" fill="none" stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  )
}

/**
 * One widget on a page, drawn the way `id` sets it, so the box is the only difference: Raised is a lighter
 * card with a shadow, Grey a flat grey card, Outline the page colour inside a fine line.
 */
function SurfacePicture({ id }: { id: SurfaceId }) {
  const box = {
    raised: cn(PICTURE_RAISED, "shadow-[0_2px_5px_-1px_rgb(0_0_0/0.22)] dark:shadow-[0_3px_6px_-2px_rgb(0_0_0/0.5),inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]"),
    grey: "bg-[color-mix(in_oklab,var(--foreground)_9%,var(--background))]",
    outline: "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_35%,transparent)]",
  }[id]
  return (
    <span aria-hidden className={PICTURE_PAGE}>
      <span className={cn("grid min-h-0 content-center gap-1 rounded-[4px] px-1.5 py-1", box)}>
        <PictureContent />
      </span>
    </span>
  )
}

/**
 * One choice for how widgets sit on the page: three kinds of card. Raised cards also take a shadow, shown only
 * then, so no setting here ever does nothing.
 */
export function SurfaceField() {
  const { theme, change } = useDesign()
  const now: SurfaceId = theme.cardSurface ?? "raised"
  const pick = SURFACES.find((s) => s.id === now)!
  return (
    <div className="grid gap-5">
      <Field id="widget-set" label="Widgets" hint={pick.hint}>
        <div role="radiogroup" aria-label="Widgets" className="grid grid-cols-3 gap-2">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={s.id === now}
              title={s.hint}
              onClick={() => change({ theme: s.set }, "surface")}
              className={cn("grid gap-1 p-1 text-[0.6875rem]", FOCUS, card(s.id === now), s.id === now ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <SurfacePicture id={s.id} />
              {s.label}
            </button>
          ))}
        </div>
      </Field>
      {now === "raised" && <ShadowField />}
    </div>
  )
}

/* ---------- Shadows under raised cards, as pictures ---------- */

type ShadowId = "none" | "soft" | "strong"
const SHADOWS: { id: ShadowId; label: string; hint: string }[] = [
  { id: "none", label: "None", hint: "Cards sit flat on the page" },
  { id: "soft", label: "Soft", hint: "A light shadow lifts each card" },
  { id: "strong", label: "Strong", hint: "A deep shadow, tinted with your brand colour" },
]
/** A raised card with the shadow `id` sets, a little higher in its frame so the shadow under it shows. */
function ShadowPicture({ id }: { id: ShadowId }) {
  const shadow = {
    none: "",
    soft: "shadow-[0_3px_7px_-2px_rgb(0_0_0/0.25)] dark:shadow-[0_5px_10px_-2px_rgb(0_0_0/0.95),inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]",
    strong: "shadow-[0_8px_14px_-4px_color-mix(in_oklab,var(--primary)_45%,rgb(0_0_0/0.35))] dark:shadow-[0_9px_16px_-4px_color-mix(in_oklab,var(--primary)_40%,rgb(0_0_0/0.9)),inset_0_1px_0_color-mix(in_oklab,var(--foreground)_12%,transparent)]",
  }[id]
  return (
    <span aria-hidden className={cn(PICTURE_PAGE, "px-2 pt-1.5 pb-2.5")}>
      <span className={cn("grid min-h-0 content-center gap-1 rounded-[4px] px-1.5 py-1", PICTURE_RAISED, shadow)}>
        <PictureContent />
      </span>
    </span>
  )
}
function ShadowField() {
  const { theme, change } = useDesign()
  const now = (theme.shadow ?? "none") as ShadowId
  return (
    <Field id="shadows" label="Shadows" hint={SHADOWS.find((s) => s.id === now)?.hint}>
      <div role="radiogroup" aria-label="Shadows" className="grid grid-cols-3 gap-2">
        {SHADOWS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === now}
            title={s.hint}
            onClick={() => change({ theme: { shadow: s.id } }, "shadow")}
            className={cn("grid gap-1 p-1 text-[0.6875rem]", FOCUS, card(s.id === now), s.id === now ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <ShadowPicture id={s.id} />
            {s.label}
          </button>
        ))}
      </div>
    </Field>
  )
}

/* ---------- The box behind a widget's chart, as pictures ---------- */

const PANELS: { value: PanelStyle; label: string; hint: string }[] = [
  { value: "none", label: "None", hint: "Charts sit right on the widget" },
  { value: "filled", label: "Filled", hint: "Charts sit on a soft inner panel" },
  { value: "outline", label: "Outline", hint: "Charts sit in a fine-line box" },
]
/** A widget with a small area chart in it: a title, a figure, then the chart in the box `value` draws around it. */
function PanelPicture({ value }: { value: PanelStyle }) {
  return (
    <span aria-hidden className="grid aspect-[4/3] w-full rounded-md bg-muted p-1.5">
      <span className="grid size-full grid-rows-[auto_auto_minmax(0,1fr)] gap-1 rounded-[3px] bg-background p-1.5">
        <span className="block h-1 w-1/2 rounded-full bg-foreground/30" />
        <span className="block h-1.5 w-1/3 rounded-full bg-foreground/60" />
        <span className={cn("relative min-h-0 overflow-hidden rounded-[2px]", value === "filled" && "bg-foreground/10", value === "outline" && "border border-foreground/30")}>
          <svg viewBox="0 0 60 30" preserveAspectRatio="none" className="absolute inset-0 size-full text-foreground">
            {[8, 16, 24].map((y) => (
              <line key={y} x1="0" x2="60" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.6" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
            ))}
            <path d="M0,24 L8,20 L16,22 L24,14 L32,16 L40,9 L48,11 L60,4 L60,30 L0,30 Z" fill="var(--primary, currentColor)" fillOpacity="0.18" />
            <polyline points="0,24 8,20 16,22 24,14 32,16 40,9 48,11 60,4" fill="none" stroke="var(--primary, currentColor)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
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
      <div role="radiogroup" aria-label="Chart background" className="grid grid-cols-3 gap-2">
        {PANELS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={p.value === now}
            title={p.hint}
            onClick={() => change({ theme: { panelStyle: p.value } }, "panel-style")}
            className={cn(
              "grid gap-1 p-1 text-[0.6875rem]",
              FOCUS,
              card(p.value === now),
              p.value === now ? "text-foreground" : "text-muted-foreground hover:text-foreground",
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
