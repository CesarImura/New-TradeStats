"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import { getCoach, type Coach } from "@/lib/data/coaches"
import { useThemeDraft } from "@/lib/prototype-store"
import { themeToCss } from "@/lib/theme/css"
import { resolveTheme } from "@/lib/theme/resolve"
import type { CoachTheme } from "@/lib/theme/types"

type Ctx = { coach: Coach; theme: CoachTheme; base: string }
const CoachContext = createContext<Ctx | null>(null)

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
  const coach = getCoach(slug)!
  const draft = useThemeDraft(slug)
  const theme = useMemo(() => resolveTheme(coach, draft), [coach, draft])

  useEffect(() => {
    if (!apply) return
    const html = document.documentElement
    html.classList.toggle("dark", theme.mode === "dark")
    return () => html.classList.remove("dark")
  }, [apply, theme.mode])

  return (
    <CoachContext.Provider value={{ coach, theme, base }}>
      {apply && <style dangerouslySetInnerHTML={{ __html: themeToCss(theme) }} />}
      {children}
    </CoachContext.Provider>
  )
}
