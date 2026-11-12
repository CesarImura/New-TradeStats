"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { useWizardCommunity } from "@/components/admin/setup-checklist"
import { useStored } from "@/lib/prototype-store"

/**
 * Getting started (Figma 958:6684): five setup items and Go live. Lionel's onboarding PDF counts the five items
 * ("Ready to go live: 0 of 5"); Go live is phase 3 and unlocks when all five are done. Each item is done when the
 * coach really did it: the screens set the flags (`setup.design`, `firstCourse`, `firstTier`, `legal`); payouts
 * also count from the Payouts screen itself.
 */
export type SetupStepId = "design" | "course" | "tier" | "payouts" | "legal" | "live"

export type SetupStep = { id: SetupStepId; title: string; description: string; action: string; href: string; done: boolean }

export function useSetupSteps() {
  const { coach, base } = useCoach()
  const community = useWizardCommunity(coach.slug)
  const payouts = useStored<{ done?: boolean } | null>(`${coach.slug}:payouts-v2`, null)
  const s = community?.setup
  const steps: SetupStep[] = [
    { id: "design", title: "Design your platform", description: "Your logo, colours, look and layout.", action: "Open Design", href: "/setup", done: !!s?.design },
    { id: "course", title: "Add your first course", description: "One course with at least one lesson.", action: "Add course", href: `${base}/content?tour=course`, done: !!s?.firstCourse },
    { id: "tier", title: "Create a tier", description: "What students get and what they pay.", action: "Create tier", href: `${base}/sales?tab=tiers&tour=tier`, done: !!s?.firstTier },
    { id: "payouts", title: "Connect payouts", description: "Your bank details, so you get paid.", action: "Connect payouts", href: `${base}/sales?tab=payouts&tour=payouts`, done: !!payouts?.done || s?.payouts === "connected" },
    { id: "legal", title: "Add your legal pages", description: "Imprint, privacy policy, terms and risk disclaimer.", action: "Add legal pages", href: `${base}/settings?tab=legal&tour=legal`, done: !!s?.legal },
    { id: "live", title: "Go live", description: "Choose your web address and launch.", action: "Go live", href: "", done: community?.status === "live" },
  ]
  const items = steps.slice(0, 5)
  const doneCount = items.filter((x) => x.done).length
  // Steps unlock in order: the first one not done is current.
  const current = steps.find((x) => !x.done)?.id
  return { community, steps, doneCount, total: items.length, current, ready: doneCount === items.length }
}
