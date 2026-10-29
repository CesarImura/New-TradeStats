"use client"

import { ImagePlus } from "lucide-react"
import { createContext, useContext, useRef, useState } from "react"
import { Field, Segmented, Swatches } from "@/components/admin/design/controls"
import { useDesign } from "@/components/admin/design/design-fields"
import { BRAND_COLORS, FONT_PAIRS, HIGHLIGHT_COLORS } from "@/components/admin/design/options"
import type { ThemeDraft } from "@/lib/prototype-store"
import { colorsFromLogo } from "@/lib/theme/logo-colors"
import { chartStyleOf, figureStyleOf, headerFormOf, panelStyleOf, starStyleOf, widgetFinishOf, widgetFontOf, widgetSetOf, widgetStyleOf, type CoachTheme, type FigureStyle, type WidgetStyle } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { CONTROL_FOCUS } from "./lab-controls"
import { saveTheme, type LabThemeEntry } from "./lab-themes"

/**
 * The library editor's own fields (prototype only), beside the Design
 * editor's: where the library needs a simpler or a new control. They edit
 * through the same `change` as the Design fields, so undo and the per-group
 * reset work the same; the theme itself comes from EntryContext.
 */
export const EntryContext = createContext<LabThemeEntry | null>(null)

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
        <span className="text-xs text-(--c-t2)">From a logo</span>
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn("flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs text-(--c-t2) transition-colors duration-150 hover:bg-(--c-on) hover:text-(--c-t1)", CONTROL_FOCUS)}
          style={{ borderColor: "var(--c-hair)" }}
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
        <div className="grid gap-1.5 rounded-lg p-2" style={{ background: "var(--c-on)" }}>
          <span className="text-xs text-(--c-t3)">Click to use as the brand colour; ⇧-click for the highlight</span>
          <div className="flex gap-2">
            {colours.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={`Use ${c}`}
                onClick={(e) => change({ theme: e.shiftKey ? { highlight: c } : { primary: c, primaryForeground: undefined } }, e.shiftKey ? "highlight" : "primary")}
                className="size-6 rounded-full ring-1 ring-(--c-hair) ring-inset transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Dark mode's own brand colours ---------- */

export function DarkColoursField() {
  const entry = useContext(EntryContext)
  const { theme } = useDesign()
  if (!entry) return null
  const own = !!entry.dark
  const set = (dark: LabThemeEntry["dark"]) => saveTheme({ ...entry, dark })
  return (
    <div className="grid gap-4">
      <Field label="In dark mode">
        <Segmented
          label="In dark mode"
          value={own ? "own" : "same"}
          onChange={(v) => set(v === "own" ? { primary: entry.dark?.primary ?? theme.primary } : undefined)}
          options={[
            { value: "same", label: "Same colours" },
            { value: "own", label: "Own colours" },
          ]}
        />
      </Field>
      {own && (
        <>
          <Field label="Brand colour in dark" hint="Often a lighter shade">
            <Swatches label="Brand colour in dark" value={entry.dark?.primary ?? theme.primary} colors={BRAND_COLORS} onChange={(c) => set({ ...entry.dark, primary: c })} />
          </Field>
          <Field label="Highlight in dark">
            <Swatches label="Highlight in dark" value={entry.dark?.highlight ?? theme.highlight ?? theme.palettes.dark.highlight} colors={HIGHLIGHT_COLORS} onChange={(c) => set({ ...entry.dark, highlight: c })} />
          </Field>
        </>
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
