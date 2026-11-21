"use client"

import { useCoach } from "@/components/coach/coach-provider"
import { useWizardCommunity } from "@/components/admin/setup-checklist"
import { updateCommunity } from "@/lib/data/communities"
import { useStored } from "@/lib/prototype-store"
import { openLessons, useCatalog } from "@/lib/data/learning"

/**
 * Getting started (Figma 1090:58716; a step skipped 1237:61209): five setup items and Go live, in order (Gustavo, 19/11).
 * Only the first item that is not done and not put off is open to start (the current one, "Skip for now"); the items
 * after it are locked until it is done or put off. Put-off items stay reachable but do not count as done. Go live is
 * phase 3 and unlocks when all five are done; until then it says what is still open. Nothing is stored for the lock:
 * it is worked out from what exists, so accounts that already did items out of order keep them done. Each item is done when the coach really did it: the screens set the flags (`setup.design`, `firstTier`,
 * `firstCourse`, `legal`); payouts also count from the Payouts screen itself.
 */
export type SetupStepId = "design" | "tier" | "course" | "payouts" | "legal" | "live"

export type SetupStep = { id: SetupStepId; title: string; short: string; description: string; action: string; href: string; done: boolean }

const NO_RECORD: Record<string, unknown> = {}
const NO_TEXTS: Record<string, string> = {}

export function useSetupSteps() {
  const { coach, base } = useCoach()
  const community = useWizardCommunity(coach.slug)
  const payouts = useStored<{ done?: boolean } | null>(`${coach.slug}:payouts-v2`, null)
  const s = community?.setup
  // Done comes only from what really exists (QA 14/11, Gustavo: "the tour only guides"): at least one saved tier, a course
  // with a visible lesson that has its video, all four legal pages. A tour finished on the way doesn't count by itself.
  const tierExtra = useStored<Record<string, unknown>>(`${coach.slug}:tier-extra`, NO_RECORD)
  const catalog = useCatalog(coach)
  const legalTexts = useStored<Record<string, string>>(`${coach.slug}:legal-v2`, NO_TEXTS)
  const imprint = useStored<{ name?: string } | null>(`${coach.slug}:legal-imprint`, null)
  const tierDone = Object.keys(tierExtra).length > 0
  const courseDone = catalog.courses.some((c) => c.status !== "archived" && openLessons(c).some((l) => !!l.video))
  const legalDone = !!imprint?.name && ["privacy", "terms", "risk"].every((k) => legalTexts[k] !== undefined)
  const skipped = s?.skipped ?? []
  const items: SetupStep[] = [
    { id: "design", title: "Design your platform", short: "Design", description: "Your logo, colours, look and layout.", action: "Open Design", href: "/setup", done: !!s?.design },
    { id: "tier", title: "Create a tier", short: "Tier", description: "What students get and what they pay.", action: "Create tier", href: `${base}/sales?tab=tiers&tour=tier`, done: tierDone },
    { id: "course", title: "Add your first course", short: "Course", description: "One course with at least one lesson.", action: "Add course", href: `${base}/content?tour=course`, done: courseDone },
    { id: "payouts", title: "Connect payouts", short: "Payouts", description: "Your bank details, so you get paid.", action: "Connect payouts", href: `${base}/sales?tab=payouts&tour=payouts`, done: !!payouts?.done || s?.payouts === "connected" },
    { id: "legal", title: "Add your legal pages", short: "Legal pages", description: "Imprint, privacy policy, terms and risk disclaimer.", action: "Add legal pages", href: `${base}/settings?tab=legal&tour=legal`, done: legalDone },
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
  // Every item still open was put off: the suggestion goes back to the first one put off (QA 14/11, Gustavo).
  const allPutOff = open.length > 0 && open.every((x) => skipped.includes(x.id))
  // Locked (19/11): not done, not put off, and after the current one. With everything left put off, nothing is locked.
  const currentAt = items.findIndex((x) => x.id === current)
  const locked: SetupStepId[] = currentAt < 0 ? [] : items.filter((x, i) => i > currentAt && !x.done && !skipped.includes(x.id)).map((x) => x.id)
  return { community, steps, doneCount, total: items.length, current, locked, skip, skipped, allPutOff, ready: open.length === 0 }
}
