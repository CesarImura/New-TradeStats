"use client"

import { useState } from "react"
import { Check, RotateCcw, TriangleAlert } from "@/components/icons"
import { auditTheme } from "@/lib/theme/contrast"
import { TEMPLATES } from "@/lib/theme/templates"
import type { Mode, Palette } from "@/lib/theme/types"
import { cn } from "@/lib/utils"
import { ColorField, Field, Segmented } from "./controls"
import { useDesign } from "./design-fields"

/** The template's greys and result colours, in the order a page is built: surfaces, lines, text, results. */
const KEYS: { key: keyof Palette; label: string; hint?: string }[] = [
  { key: "background", label: "Page" },
  { key: "card", label: "Cards" },
  { key: "sidebar", label: "Side menu" },
  { key: "muted", label: "Subtle surfaces", hint: "hover, tracks, secondary buttons" },
  { key: "border", label: "Borders" },
  { key: "foreground", label: "Text" },
  { key: "mutedForeground", label: "Secondary text" },
  { key: "profit", label: "Profit" },
  { key: "loss", label: "Loss" },
]

/**
 * A CSS colour as #rrggbb for the picker. Templates use rgba() for some greys
 * (Terminal's secondary text); those are flattened onto the page colour, so
 * editing one saves it as the solid colour it looks like on the page.
 */
function toHex(css: string, over: string): string {
  if (/^#[0-9a-f]{6}$/i.test(css)) return css
  if (/^#[0-9a-f]{3}$/i.test(css)) return `#${css.slice(1).replace(/./g, (c) => c + c)}`
  const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?/)
  if (!m) return "#808080"
  const a = m[4] === undefined ? 1 : Number(m[4])
  const bg = toHex(over, "#ffffff")
  const b = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16))
  return `#${[1, 2, 3].map((i, k) => Math.round(Number(m[i]) * a + b[k] * (1 - a)).toString(16).padStart(2, "0")).join("")}`
}

/**
 * Prototype only: edit the template palette (Design → Look → Advanced). The
 * edits are part of the draft like any other change, show in the preview
 * when that mode is on, and go into the template with Save as template.
 */
export function PaletteField() {
  const { theme, working, change } = useDesign()
  const [mode, setMode] = useState<Mode>(theme.mode)
  const palette = theme.palettes[mode]
  const base = TEMPLATES[theme.template].theme.palettes[mode]
  const edited = working.theme.palettes?.[mode] ?? {}
  const anyEdited = Object.keys(edited).length > 0

  const set = (key: keyof Palette, value: string | undefined) => {
    // The hex field re-sends its value on blur: an unchanged colour is no edit, and the template's own colour is a reset.
    if (value !== undefined && value.toLowerCase() === toHex(palette[key], palette.background).toLowerCase()) return
    if (value !== undefined && value.toLowerCase() === toHex(base[key], base.background).toLowerCase()) value = undefined
    const next = { ...edited, [key]: value }
    if (value === undefined) delete next[key]
    // The draft merges palettes per mode, so send the whole mode back.
    change({ theme: { palettes: { ...working.theme.palettes, [mode]: next } } }, `palette-${mode}-${key}`)
  }
  const resetMode = () => change({ theme: { palettes: { ...working.theme.palettes, [mode]: {} } } }, `palette-${mode}-reset`)

  const checks = auditTheme({ ...theme, mode }).filter((c) => ["text", "text-card", "muted", "profit", "loss"].includes(c.id))
  const failing = checks.filter((c) => !c.pass)

  return (
    <Field id="palette" label="Template greys (prototype)" hint="Saved into the template with Save as template">
      <div className="grid gap-3">
        <Segmented
          label="Palette"
          value={mode}
          onChange={setMode}
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
        {mode !== theme.mode && <p className="text-xs text-muted-foreground">The preview is in {theme.mode} mode. Switch Light or dark in Brand to see these.</p>}
        <div className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">Greys follow</span>
          <Segmented
            label="Greys follow"
            value={theme.tint ?? "brand"}
            onChange={(tint) => change({ theme: { tint } }, "tint")}
            options={[
              { value: "brand", label: "Brand colour" },
              { value: "template", label: "Exactly these" },
              { value: "none", label: "Pure grey" },
            ]}
          />
          <p className="text-[0.6875rem] text-muted-foreground">
            {(theme.tint ?? "brand") === "brand"
              ? "Each grey keeps its lightness but takes the coach's brand hue, so these show slightly recoloured."
              : theme.tint === "none"
                ? "Each grey keeps its lightness with no colour at all."
                : "The greys show exactly as set here, whatever the coach's colour."}{" "}
            Saved with the template.
          </p>
        </div>
        <div className="grid gap-1.5">
          {KEYS.map(({ key, label, hint }) => {
            const changed = key in edited
            return (
              // The label beside a field that runs to the panel's edge; a changed colour's reset sits inside its field.
              <div key={key} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-center gap-3">
                <span className="grid min-w-0 gap-0.5">
                  <span className={cn("truncate text-xs", changed && "font-medium")}>{label}</span>
                  {hint && <span className="text-[0.6875rem] leading-tight text-muted-foreground">{hint}</span>}
                </span>
                <div className="relative min-w-0">
                  <ColorField label={`${label} (${mode})`} value={toHex(palette[key], palette.background)} onChange={(c) => set(key, c)} />
                  {changed && (
                    <button
                      type="button"
                      onClick={() => set(key, undefined)}
                      aria-label={`Reset ${label} to the template's colour`}
                      title={`Back to the template's ${base[key]}`}
                      className="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className={cn("flex items-start gap-2 rounded-[4px] p-2 text-xs", failing.length ? "bg-amber-500/10" : "bg-muted")}>
          {failing.length ? <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" /> : <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />}
          <span className="grid gap-0.5">
            {failing.length ? (
              failing.map((c) => (
                <span key={c.id}>
                  {c.label}: {c.ratio.toFixed(1)}:1, needs {c.min}:1
                </span>
              ))
            ) : (
              <span>Text, secondary text, profit and loss are readable in {mode} mode.</span>
            )}
          </span>
        </div>
        {anyEdited && (
          <button type="button" onClick={resetMode} className="w-fit text-xs font-medium text-muted-foreground hover:text-foreground">
            Reset all {mode} colours to {TEMPLATES[theme.template].name}
          </button>
        )}
      </div>
    </Field>
  )
}
