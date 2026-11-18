"use client"

import { createContext, useContext } from "react"
import type { Coach, ModuleId } from "@/lib/data/coaches"
import type { Overrides } from "@/lib/prototype-store"
import type { CoachTheme } from "@/lib/theme/types"

export type DesignCtx = {
  coach: Coach
  theme: CoachTheme
  working: Overrides
  change: (patch: Partial<Overrides>, key: string) => void
  commit: (next: Overrides, key: string) => void
  /** Keeps the design as it is now in Earlier versions (the Design editor; the wizard and the lab have none). */
  keepVersion?: (label: string) => void
  /** Goes back one step (the Design editor), so a toast can offer Undo right after a big change. */
  undo?: () => void
  /** Opens a page of the platform on the canvas to arrange and edit it (the Design editor; the wizard has none). */
  openPage?: (id: string) => void
}

const Ctx = createContext<DesignCtx | null>(null)
export const DesignProvider = Ctx.Provider
/** The coach, theme and draft the fields are editing. */
export const useDesign = () => useContext(Ctx)!

export function move<T>(list: T[], i: number, by: number) {
  const next = [...list]
  const [item] = next.splice(i, 1)
  next.splice(i + by, 0, item)
  return next
}

export const MODULE_NAMES: Record<ModuleId, string> = {
  courses: "Courses",
  calendar: "Calendar",
  charts: "Charts",
  community: "Community",
  journal: "Journal",
  ranking: "Ranking",
  ai: "AI assistant",
  downloads: "Downloads",
  partners: "Partners",
}
