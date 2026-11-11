"use client"

import { useCallback, useSyncExternalStore } from "react"

const EVENT = "proto:stored-choice"

/**
 * A choice the viewer made (a view, a tab) that stays between visits, kept in localStorage.
 * Server and first client render use `fallback`, then the saved value shows, so there is no hydration mismatch.
 * Storage can be blocked: the choice then just lasts until the page is left.
 */
export function useStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (v: T) => void] {
  const read = useCallback((): T => {
    try {
      const v = window.localStorage.getItem(key)
      return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : fallback
    } catch {
      return fallback
    }
  }, [key, allowed, fallback])
  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb)
      window.addEventListener(EVENT, cb)
      return () => (window.removeEventListener("storage", cb), window.removeEventListener(EVENT, cb))
    },
    read,
    () => fallback,
  )
  const set = useCallback(
    (v: T) => {
      try {
        window.localStorage.setItem(key, v)
      } catch {
        // Not saved.
      }
      window.dispatchEvent(new Event(EVENT))
    },
    [key],
  )
  return [value, set]
}
