"use client"

import { createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from "react"
import { getCoach, type Coach } from "@/lib/data/coaches"
import { useSearchParams } from "next/navigation"
import { useOverrides } from "@/lib/prototype-store"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"

type Ctx = {
  coach: Coach
  theme: CoachTheme
  base: string
  scope: string
  /** True inside the design editor's preview frame, which shows the unpublished draft. */
  preview: boolean
}
const CoachContext = createContext<Ctx | null>(null)

const noop = () => () => {}

export function useCoach() {
  const ctx = useContext(CoachContext)
  if (!ctx) throw new Error("useCoach must be used inside CoachProvider")
  return ctx
}

/**
 * Applies the coach's theme to the whole page (student side) and exposes the
 * coach's data and wording. Pass `apply={false}` to only provide data, e.g.
 * in the admin area, which keeps its own fixed look.
 */
export function CoachProvider({
  slug,
  base,
  apply = true,
  children,
}: {
  slug: string
  base: string
  apply?: boolean
  children: React.ReactNode
}) {
  const preview = useSearchParams().get("preview") === "draft"
  const overrides = useOverrides(slug, preview ? "draft" : "published")
  const coach = useMemo(() => resolveCoach(getCoach(slug)!, overrides.content), [slug, overrides.content])
  const theme = useMemo(() => resolveTheme(coach, overrides.theme), [coach, overrides.theme])

  // Next.js keeps the previous page mounted but hidden, so several coaches'
  // styles can be in the DOM at once. Each style is scoped to
  // :root[data-coach=slug] and only the visible coach sets that attribute.
  useLayoutEffect(() => {
    const html = document.documentElement
    html.dataset.coach = slug
    if (apply) html.classList.toggle("dark", theme.mode === "dark")
    return () => {
      if (html.dataset.coach === slug) {
        delete html.dataset.coach
        if (apply) html.classList.remove("dark")
      }
    }
  }, [slug, apply, theme.mode])

  // Before hydration no attribute is set yet; the server page holds a single
  // coach, so `:not([data-coach])` covers the first paint.
  // Saved designs live in the browser (prototype only), so the server renders
  // the original design. Keep the page invisible until the saved one applies,
  // instead of flashing the wrong brand.
  const hydrated = useSyncExternalStore(noop, () => true, () => false)

  const scope = `:root[data-coach="${slug}"], :root:not([data-coach])`

  return (
    <CoachContext.Provider value={{ coach, theme, base, scope, preview }}>
      {apply && <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />}
      <div style={{ display: "contents", visibility: hydrated ? undefined : "hidden" }}>{children}</div>
    </CoachContext.Provider>
  )
}
