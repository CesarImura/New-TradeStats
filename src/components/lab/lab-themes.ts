"use client"

import { useSyncExternalStore } from "react"
import type { ThemeDraft } from "@/lib/prototype-store"
import { onColor } from "@/lib/theme/derive"
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/theme/templates"
import type { CoachTheme, Mode, TemplateId } from "@/lib/theme/types"

/**
 * The library's themes (prototype only): the white-label base, the three
 * templates, and the themes made in the library. A theme is
 * a starting point (`base`) plus the settings changed on top (`draft`), the
 * same shape the Design editor saves, so the library's editor can reuse its
 * fields. Made themes live in this browser only.
 */

/**
 * The white-label base: no coach colour, no template personality. Neutral
 * greys, the accent is the text colour, Geist, plain cards. Every
 * personality setting is at its plainest, so what shows is the structure.
 */
const WHITE_LABEL: CoachTheme = {
  ...TEMPLATES.pulse.theme,
  template: "pulse",
  palettes: {
    light: {
      background: "#f4f4f5",
      card: "#ffffff",
      foreground: "#0a0a0a",
      muted: "#f4f4f5",
      mutedForeground: "#5f5f66",
      border: "#e4e4e7",
      sidebar: "#f4f4f5",
      highlight: "#e4e4e7",
      highlightForeground: "#0a0a0a",
      // A matched pair: same weight, so a loss doesn't shout louder than a profit.
      profit: "#1a7f37",
      loss: "#cf222e",
    },
    dark: {
      background: "#0a0a0b",
      card: "#161618",
      foreground: "#f4f4f5",
      muted: "#202023",
      mutedForeground: "#a1a1aa",
      border: "#2a2a2e",
      sidebar: "#0a0a0b",
      highlight: "#27272a",
      highlightForeground: "#f4f4f5",
      // Calmer than the pastel 400s on a near-black card; text still gets its 4.5:1 from derive.
      profit: "#3fb950",
      loss: "#f85149",
    },
  },
  tint: "none",
  radius: 12,
  buttonShape: "rounded",
  shadow: "none",
  borders: true,
  density: "comfortable",
  fonts: { heading: "geist", body: "geist", label: "geist" },
  labelStyle: "plain",
  headingWeight: 500,
  background: "plain",
  effects: "flat",
  widgetStyle: "soft",
  widgetFont: "body",
  widgetSet: "cards",
  cardSurface: "raised",
  headerForm: "top",
  figureStyle: "plain",
  chartStyle: "solid",
  panelStyle: "filled",
  starStyle: "spotlight",
  widgetFinish: "none",
  widgetHeader: undefined,
  trading: undefined,
  highlight: undefined,
}

export type Colour = "minimal" | "mono"

/**
 * The white-label accent. Minimal: a calm placeholder blue, like a component
 * library's demo, for the one mark per widget. Mono: the text colour (black
 * on light, near-white on dark), so only profit and loss carry colour.
 */
export const themeFor = (mode: Mode, colour: Colour): CoachTheme => ({
  ...WHITE_LABEL,
  mode,
  // The same blue on dark: white text on it keeps 5:1 (a lighter blue drops under 4.5:1); readable blue text comes from derive.
  primary: colour === "mono" ? (mode === "light" ? "#18181b" : "#f4f4f5") : "#2563eb",
  primaryForeground: colour === "mono" && mode === "dark" ? "#0a0a0a" : "#ffffff",
})

/** Where a theme starts from. */
export type ThemeBase = "whitelabel" | "mono" | TemplateId
export const BASES: { id: ThemeBase; label: string }[] = [{ id: "whitelabel", label: "Whitelabel" }, ...TEMPLATE_IDS.map((id) => ({ id, label: TEMPLATES[id].name }))]
export const baseLabel = (b: ThemeBase) => BASES.find((x) => x.id === b)?.label ?? b

/** `dark`: the brand colours used in dark mode instead, when the theme has its own (unset = the same as light). */
export type LabThemeEntry = { id: string; name: string; base: ThemeBase; draft: ThemeDraft; dark?: { primary?: string; highlight?: string }; builtIn?: boolean; updated?: number }

/** The starting points: always there, never edited (customising one makes a copy). */
export const BUILT_IN: LabThemeEntry[] = [
  { id: "whitelabel", name: "Whitelabel", base: "whitelabel", draft: {}, builtIn: true },
  ...TEMPLATE_IDS.map((id) => ({ id, name: TEMPLATES[id].name, base: id, draft: {}, builtIn: true })),
]

const baseTheme = (base: ThemeBase, mode: Mode): CoachTheme => (base === "whitelabel" || base === "mono" ? themeFor(mode, base === "mono" ? "mono" : "minimal") : { ...TEMPLATES[base].theme, template: base, mode })

/** A theme in one mode: its base, then its changes. The library's light/dark switch always wins over the theme's own mode. */
export function resolveLab(entry: Pick<LabThemeEntry, "base" | "draft" | "dark">, mode: Mode): CoachTheme {
  const base = baseTheme(entry.base, mode)
  // Dark mode's own brand colours, when the theme has them, replace the light ones.
  const own = mode === "dark" && entry.dark ? Object.fromEntries(Object.entries(entry.dark).filter(([, v]) => v)) : {}
  const d: ThemeDraft = { ...entry.draft, ...own, ...("primary" in own ? { primaryForeground: undefined } : {}) }
  const primary = d.primary ?? base.primary
  return {
    ...base,
    ...d,
    template: base.template,
    mode,
    primary,
    primaryForeground: d.primaryForeground ?? (d.primary ? onColor(primary) : base.primaryForeground),
    nav: { ...base.nav, ...d.nav },
    fonts: { ...base.fonts, ...d.fonts },
    palettes: { light: { ...base.palettes.light, ...d.palettes?.light }, dark: { ...base.palettes.dark, ...d.palettes?.dark } },
  }
}

/** The meaning colours follow the white-label mono choice; every other theme gets amber and the accent. */
export const colourOf = (entry: Pick<LabThemeEntry, "base">): Colour => (entry.base === "mono" ? "mono" : "minimal")

/** Merge a change into a draft, one level deep for the grouped settings, like the Design editor does. */
export function mergeDraft(draft: ThemeDraft, patch: ThemeDraft): ThemeDraft {
  const next: ThemeDraft = { ...draft, ...patch }
  if (patch.nav) next.nav = { ...draft.nav, ...patch.nav }
  if (patch.fonts) next.fonts = { ...draft.fonts, ...patch.fonts }
  if (patch.widgetHeader) next.widgetHeader = { ...draft.widgetHeader, ...patch.widgetHeader }
  if (patch.palettes) next.palettes = { light: { ...draft.palettes?.light, ...patch.palettes.light }, dark: { ...draft.palettes?.dark, ...patch.palettes.dark } }
  // The editor never sets the theme's own mode: the library's switch decides.
  delete next.mode
  return next
}

/* ---------- This browser's store ---------- */

const KEY = "lab-themes-v1"
const ACTIVE = "lab-theme-active"
const COMPARE = "lab-compare-v1"
const PICKED = "lab-compare-widgets-v1"
const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

export function read<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {}
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value = fallback
  try {
    if (raw !== null) value = JSON.parse(raw) as T
  } catch {}
  cache.set(key, { raw, value })
  return value
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  listeners.forEach((cb) => cb())
}
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  const onStorage = () => cb()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}
/** A JSON value in this browser, shared live by every component that reads it. */
export function useKey<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  )
}

const NONE: LabThemeEntry[] = []
const NO_IDS: string[] = []
const DEFAULT_COMPARE = ["whitelabel", ...TEMPLATE_IDS]

/** Every theme: the starting points, then the ones made here, newest first. */
export function useLabThemes() {
  const mine = useKey<LabThemeEntry[]>(KEY, NONE)
  const activeId = useKey<string>(ACTIVE, "whitelabel")
  const compareIds = useKey<string[]>(COMPARE, DEFAULT_COMPARE)
  const all = [...BUILT_IN, ...mine]
  const byId = (id: string) => all.find((t) => t.id === id)
  const active = byId(activeId) ?? BUILT_IN[0]
  const compared = compareIds.map(byId).filter((t): t is LabThemeEntry => !!t)
  const picked = useKey<string[]>(PICKED, NO_IDS)
  return { all, mine, active, byId, compared, picked, pick: setActiveTheme }
}
export type LabThemes = ReturnType<typeof useLabThemes>

const mineNow = () => read<LabThemeEntry[]>(KEY, NONE)
const uid = () => `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const setActiveTheme = (id: string) => write(ACTIVE, id)
export const setCompared = (ids: string[]) => write(COMPARE, ids)
/** The widgets picked for Compare, as their types. */
export const setPicked = (types: string[]) => write(PICKED, types)

/** Save a made theme (new or changed). */
export function saveTheme(entry: LabThemeEntry) {
  const list = mineNow()
  const next = { ...entry, builtIn: undefined, updated: Date.now() }
  write(KEY, list.some((t) => t.id === entry.id) ? list.map((t) => (t.id === entry.id ? next : t)) : [next, ...list])
}

/** A copy of any theme, named after it, saved and made the active one. Returns its id. */
export function duplicateTheme(from: LabThemeEntry, name = `${from.name} copy`): string {
  const id = uid()
  saveTheme({ id, name, base: from.base, draft: structuredClone(from.draft), dark: from.dark && { ...from.dark } })
  setActiveTheme(id)
  return id
}

/** A fresh theme on a base, with nothing changed yet. */
export function createTheme(base: ThemeBase = "whitelabel"): string {
  const n = mineNow().length + 1
  const id = uid()
  saveTheme({ id, name: `My theme ${n}`, base, draft: {} })
  setActiveTheme(id)
  return id
}

/** Remove a made theme; whoever showed it falls back to the white-label base. Returns it, for undo. */
export function deleteTheme(id: string): LabThemeEntry | undefined {
  const list = mineNow()
  const gone = list.find((t) => t.id === id)
  write(
    KEY,
    list.filter((t) => t.id !== id),
  )
  if (read(ACTIVE, "whitelabel") === id) write(ACTIVE, "whitelabel")
  const cmp = read<string[]>(COMPARE, DEFAULT_COMPARE)
  if (cmp.includes(id))
    write(
      COMPARE,
      cmp.filter((x) => x !== id),
    )
  return gone
}

/** Put a deleted theme back where it was. */
export function restoreTheme(entry: LabThemeEntry) {
  write(KEY, [entry, ...mineNow().filter((t) => t.id !== entry.id)])
}

/** A theme as a file, to share or keep. */
export function exportTheme(entry: LabThemeEntry) {
  const rest = { name: entry.name, base: entry.base, draft: entry.draft, dark: entry.dark }
  const blob = new Blob([JSON.stringify({ tradehubTheme: 1, ...rest }, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `${
    entry.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "theme"
  }.theme.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** Read a theme file and add it as a new theme. Returns its id, or throws with a reason. */
export async function importTheme(file: File): Promise<string> {
  const data = JSON.parse(await file.text()) as Partial<LabThemeEntry> & { tradehubTheme?: number }
  if (!data || typeof data !== "object" || !data.draft || !BASES.some((b) => b.id === data.base)) throw new Error("This file is not a TradeHub theme")
  const id = uid()
  saveTheme({ id, name: data.name || "Imported theme", base: data.base!, draft: data.draft, dark: data.dark })
  setActiveTheme(id)
  return id
}
