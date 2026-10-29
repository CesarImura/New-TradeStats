"use client"

import { createContext, useContext } from "react"
import { Field, Segmented, Swatches } from "@/components/admin/design/controls"
export { LogoColoursField, NumbersField, shuffled, StylePresetField } from "@/components/admin/design/settings-fields"
import { useDesign } from "@/components/admin/design/design-fields"
import { BRAND_COLORS, HIGHLIGHT_COLORS } from "@/components/admin/design/options"
import { saveTheme, type LabThemeEntry } from "./lab-themes"

/**
 * The library editor's own field (prototype only): a theme made in the
 * library can have its own brand colours in dark mode. The fields shared
 * with the admin's Design live in admin/design/settings-fields.tsx.
 */
export const EntryContext = createContext<LabThemeEntry | null>(null)

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

