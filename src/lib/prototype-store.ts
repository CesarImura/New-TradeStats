"use client"

import { useSyncExternalStore } from "react"
import type { CoachTheme } from "@/lib/theme/types"

/**
 * Prototype-only persistence. Stands in for the backend: whatever the coach
 * changes in the design editor or the prototype bar is kept per coach in
 * localStorage, and every open page re-renders with it.
 */
export type ThemeDraft = Partial<Omit<CoachTheme, "nav" | "fonts">> & {
  nav?: Partial<CoachTheme["nav"]>
  fonts?: Partial<CoachTheme["fonts"]>
}

const key = (slug: string) => `proto:theme:${slug}`
const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: ThemeDraft }>()

function read(slug: string): ThemeDraft {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key(slug))
  } catch {}
  const hit = cache.get(slug)
  if (hit && hit.raw === raw) return hit.value
  let value: ThemeDraft = {}
  try {
    value = raw ? JSON.parse(raw) : {}
  } catch {}
  cache.set(slug, { raw, value })
  return value
}

const EMPTY: ThemeDraft = {}

export function useThemeDraft(slug: string) {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const onStorage = (e: StorageEvent) => e.key === key(slug) && cb()
      window.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(cb)
        window.removeEventListener("storage", onStorage)
      }
    },
    () => read(slug),
    () => EMPTY,
  )
}

export function updateThemeDraft(slug: string, patch: ThemeDraft | null) {
  const current = read(slug)
  const next: ThemeDraft | null = patch === null ? null : {
    ...current,
    ...patch,
    nav: { ...current.nav, ...patch.nav },
    fonts: { ...current.fonts, ...patch.fonts },
  }
  try {
    if (next === null) localStorage.removeItem(key(slug))
    else localStorage.setItem(key(slug), JSON.stringify(next))
  } catch {}
  listeners.forEach((l) => l())
}
