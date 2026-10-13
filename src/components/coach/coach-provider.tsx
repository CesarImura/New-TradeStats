"use client"

import { createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { getDemoCoach, type Coach } from "@/lib/data/coaches"
import { useCustomCommunities } from "@/lib/data/use-communities"
import { useSearchParams } from "next/navigation"
import { useOverrides } from "@/lib/prototype-store"
import { themeToCss } from "@/lib/theme/css"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"

export type CoachCtx = Ctx
type Ctx = {
  coach: Coach
  theme: CoachTheme
  base: string
  scope: string
  /** True inside the design editor's preview frame, which shows the unpublished draft. */
  preview: boolean
}
export const CoachContext = createContext<Ctx | null>(null)

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
type ProviderProps = {
  slug: string
  base: string
  apply?: boolean
  children: React.ReactNode
}

export function CoachProvider(props: ProviderProps) {
  // Saved designs and wizard-made communities live in the browser (prototype
  // only), so the server renders the original design. Keep the page invisible
  // until the saved one applies, instead of flashing the wrong brand.
  const hydrated = useSyncExternalStore(noop, () => true, () => false)
  const custom = useCustomCommunities()
  const original = getDemoCoach(props.slug) ?? custom.find((c) => c.slug === props.slug)
  if (!original) {
    if (hydrated) return <UnknownCommunity slug={props.slug} />
    // The server can't see wizard-made communities. Render the page with a
    // stand-in (kept invisible) so the server output and the first browser
    // render match; the real community takes over right after.
    return <ThemedProvider {...props} original={{ ...getDemoCoach("northline")!, slug: props.slug }} hydrated={false} />
  }
  return <ThemedProvider {...props} original={original} hydrated={hydrated} />
}

function ThemedProvider({
  slug,
  base,
  apply = true,
  children,
  original,
  hydrated,
}: ProviderProps & { original: Coach; hydrated: boolean }) {
  const preview = useSearchParams().get("preview") === "draft"
  const overrides = useOverrides(slug, preview ? "draft" : "published")
  const coach = useMemo(() => resolveCoach(original, overrides.content), [original, overrides.content])
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

  const scope = `:root[data-coach="${slug}"], :root:not([data-coach])`

  return (
    <CoachContext.Provider value={{ coach, theme, base, scope, preview }}>
      {apply && <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, scope) }} />}
      <div style={{ display: "contents", visibility: hydrated ? undefined : "hidden" }}>{children}</div>
    </CoachContext.Provider>
  )
}

function UnknownCommunity({ slug }: { slug: string }) {
  return (
    <div className="grid min-h-svh place-items-center p-6 text-center">
      <div className="grid max-w-sm gap-3">
        <h1 className="text-xl font-semibold">No community at “{slug}”</h1>
        <p className="text-sm text-muted-foreground">
          Communities made with the setup wizard are saved in this browser only (prototype). It may have been made in another browser,
          or deleted.
        </p>
        <Link href="/" className="text-sm font-medium underline underline-offset-4">
          Back to the prototype start page
        </Link>
      </div>
    </div>
  )
}
