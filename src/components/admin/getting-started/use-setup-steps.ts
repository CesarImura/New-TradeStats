"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { useWizardCommunity } from "@/components/admin/setup-checklist"
import { updateCommunity } from "@/lib/data/communities"
import { useStored } from "@/lib/prototype-store"

/**
 * Getting started (Figma 1090:58716; a step skipped 1237:61209): five setup items and Go live. The items are done in any
 * order (Flavio, 14/11): every one can be opened any time; the first one not done and not put off is the suggested
 * one (orange edge, "Skip for now"). Go live is phase 3 and unlocks when all five are done; until then it says what is
 * still open. Each item is done when the coach really did it: the screens set the flags (`setup.design`, `firstTier`,
 * `firstCourse`, `legal`); payouts also count from the Payouts screen itself.
 */
export type SetupStepId = "design" | "tier" | "course" | "payouts" | "legal" | "live"

export type SetupStep = { id: SetupStepId; title: string; short: string; description: string; action: string; href: string; done: boolean }

export function useSetupSteps() {
  const { coach, base } = useCoach()
  const community = useWizardCommunity(coach.slug)
  const payouts = useStored<{ done?: boolean } | null>(`${coach.slug}:payouts-v2`, null)
  const s = community?.setup
  const skipped = s?.skipped ?? []
  const items: SetupStep[] = [
    { id: "design", title: "Design your platform", short: "Design", description: "Your logo, colours, look and layout.", action: "Open Design", href: "/setup", done: !!s?.design },
    { id: "tier", title: "Create a tier", short: "Tier", description: "What students get and what they pay.", action: "Create tier", href: `${base}/sales?tab=tiers&tour=tier`, done: !!s?.firstTier },
    { id: "course", title: "Add your first course", short: "Course", description: "One course with at least one lesson.", action: "Add course", href: `${base}/content?tour=course`, done: !!s?.firstCourse },
    { id: "payouts", title: "Connect payouts", short: "Payouts", description: "Your bank details, so you get paid.", action: "Connect payouts", href: `${base}/sales?tab=payouts&tour=payouts`, done: !!payouts?.done || s?.payouts === "connected" },
    { id: "legal", title: "Add your legal pages", short: "Legal pages", description: "Imprint, privacy policy, terms and risk disclaimer.", action: "Add legal pages", href: `${base}/settings?tab=legal&tour=legal`, done: !!s?.legal },
  ]
  const open = items.filter((x) => !x.done)
  const live = community?.status === "live"
  const steps: SetupStep[] = [
    ...items,
    { id: "live", title: "Go live", short: "Go live", description: open.length ? `Still open: ${open.map((x) => x.short).join(", ")}.` : "Choose your web address and launch.", action: "Go live", href: "", done: live },
  ]
  const doneCount = items.length - open.length
  // The suggested item: the first one not done that wasn't put off; when all that is left was put off, the one put off
  // longest ago (skipping it again sends it to the back). With all five done, Go live is the one.
  const putOff = skipped.map((id) => open.find((x) => x.id === id)).filter(Boolean)
  const current: SetupStepId | undefined = live ? undefined : (open.find((x) => !skipped.includes(x.id)) ?? putOff[0])?.id ?? "live"
  const skip = (id: SetupStepId) => {
    if (community) updateCommunity(community.slug, { setup: { ...community.setup, skipped: [...skipped.filter((x) => x !== id), id] } })
  }
  return { community, steps, doneCount, total: items.length, current, skip, ready: open.length === 0 }
}
