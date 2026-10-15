"use client"

import { useSyncExternalStore } from "react"
import type { ModuleId, Wording } from "@/lib/data/coaches"
import type { HomeLayouts, PageLayouts } from "@/lib/widgets/layout"
import type { CoachTheme, Mode, Palette } from "@/lib/theme/types"

/**
 * Prototype-only persistence, standing in for the backend. Per coach it keeps:
 * - published: what students see
 * - draft: unpublished edits from the design editor (null = none)
 * - history: earlier published versions, newest first
 * Everything lives in localStorage, so the editor and its preview frame
 * (a separate document) stay in sync through storage events.
 */

export type ThemeDraft = Partial<Omit<CoachTheme, "nav" | "fonts" | "palettes">> & {
  nav?: Partial<CoachTheme["nav"]>
  fonts?: Partial<CoachTheme["fonts"]>
  /** Single palette colours changed per mode (prototype: the template palette editor). */
  palettes?: Partial<Record<Mode, Partial<Palette>>>
}

export type ContentDraft = {
  name?: string
  mark?: string
  logo?: string // data URL of the uploaded logo
  wording?: Partial<Wording>
  menu?: ModuleId[]
  modules?: Partial<Record<ModuleId, boolean>>
  /** Older drafts kept only Home here; it now lives in pages.home. */
  home?: HomeLayouts
  pages?: PageLayouts
}

export type Overrides = { theme: ThemeDraft; content: ContentDraft }
export type Version = { at: string; label: string; snapshot: Overrides }

export const EMPTY: Overrides = { theme: {}, content: {} }

const k = {
  pub: (s: string) => `proto:pub:${s}`,
  draft: (s: string) => `proto:draft:${s}`,
  history: (s: string) => `proto:history:${s}`,
}

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {}
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = fallback
  try {
    if (raw) value = JSON.parse(raw)
  } catch {}
  cache.set(key, { raw, value })
  return value
}

function write(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => e.key?.startsWith("proto:") && cb()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

function useKey<T>(key: string, fallback: T): T {
  return useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback)
}

// ---------- reads

export function usePublished(slug: string) {
  return useKey<Overrides>(k.pub(slug), EMPTY)
}

export function useDraft(slug: string) {
  return useKey<Overrides | null>(k.draft(slug), null)
}

/** What a page shows: the draft in the editor's preview, otherwise the published design. */
export function useOverrides(slug: string, source: "published" | "draft") {
  const pub = usePublished(slug)
  const draft = useDraft(slug)
  return source === "draft" ? (draft ?? pub) : pub
}

export function useHistory(slug: string) {
  return useKey<Version[]>(k.history(slug), [])
}

// ---------- writes

export function mergeOverrides(base: Overrides, patch: Partial<Overrides>): Overrides {
  const t = patch.theme ?? {}
  const c = patch.content ?? {}
  return {
    theme: {
      ...base.theme,
      ...t,
      nav: { ...base.theme.nav, ...t.nav },
      fonts: { ...base.theme.fonts, ...t.fonts },
      palettes: { light: { ...base.theme.palettes?.light, ...t.palettes?.light }, dark: { ...base.theme.palettes?.dark, ...t.palettes?.dark } },
    },
    content: {
      ...base.content,
      ...c,
      wording: { ...base.content.wording, ...c.wording },
      modules: { ...base.content.modules, ...c.modules },
    },
  }
}

export function setDraft(slug: string, next: Overrides | null) {
  write(k.draft(slug), next)
}

export function publish(slug: string, label = "Published") {
  const draft = read<Overrides | null>(k.draft(slug), null)
  if (!draft) return
  const pub = read<Overrides>(k.pub(slug), EMPTY)
  const history = read<Version[]>(k.history(slug), [])
  write(k.history(slug), [{ at: new Date().toISOString(), label, snapshot: pub }, ...history].slice(0, 12))
  write(k.pub(slug), draft)
  write(k.draft(slug), null)
}

/** Prototype bar: change the live design directly, or reset a coach (null). */
export function patchPublishedTheme(slug: string, patch: ThemeDraft | null) {
  if (patch === null) {
    ;[k.pub(slug), k.draft(slug), k.history(slug)].forEach((key) => write(key, null))
    return
  }
  const pub = read<Overrides>(k.pub(slug), EMPTY)
  write(k.pub(slug), mergeOverrides(pub, { theme: patch }))
  const draft = read<Overrides | null>(k.draft(slug), null)
  if (draft) write(k.draft(slug), mergeOverrides(draft, { theme: patch }))
}

// ---------- other stored data (courses, calendar, student activity)

/**
 * Any other prototype data, under `proto:<key>`. `fallback` must be a stable
 * value (a module constant), since it is returned as-is until something is saved.
 */
export function useStored<T>(key: string, fallback: T): T {
  return useKey<T>(`proto:${key}`, fallback)
}

export function readStored<T>(key: string, fallback: T): T {
  return read<T>(`proto:${key}`, fallback)
}

/** Save under `proto:<key>`; pass a function to update from the current value. */
export function setStored<T>(key: string, value: T | ((current: T) => T), fallback?: T) {
  const next = typeof value === "function" ? (value as (c: T) => T)(read<T>(`proto:${key}`, fallback as T)) : value
  write(`proto:${key}`, next)
}
