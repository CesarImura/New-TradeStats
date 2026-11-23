"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { useWizardCommunity } from "@/components/admin/setup-checklist"

/**
 * True on a platform the coach made in setup: it starts empty on every screen, with no sample students, trades, sales or files.
 * The demo platforms (Kairo and the others) keep their sample data.
 */
export function useNewPlatform(): boolean {
  const { coach } = useCoach()
  return !!useWizardCommunity(coach.slug)
}
