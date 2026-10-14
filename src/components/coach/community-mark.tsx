"use client"

import type { Coach } from "@/lib/data/coaches"
import { usePublished } from "@/lib/prototype-store"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"
import { cn } from "@/lib/utils"

/** A community's tile in switchers: its published logo, or its mark in its brand colour. */
export function CommunityMark({ coach, className }: { coach: Coach; className?: string }) {
  const pub = usePublished(coach.slug)
  const c = resolveCoach(coach, pub.content)
  const t = resolveTheme(c, pub.theme)
  if (c.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.logo} alt="" className={cn("size-8 shrink-0 rounded-[var(--r-menu,6px)] bg-white object-contain", className)} />
  }
  return (
    <span
      className={cn("grid size-8 shrink-0 place-items-center rounded-[var(--r-menu,6px)] text-xs font-semibold", className)}
      style={{ background: t.primary, color: t.primaryForeground }}
    >
      {c.mark}
    </span>
  )
}
