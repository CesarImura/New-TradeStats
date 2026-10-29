"use client"

import { Check, Lock, Sparkles } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { series } from "@/components/widgets/kit"
import { Cover } from "@/components/widgets/shared"
import { useViewerTier } from "@/lib/data/access"
import type { Course } from "@/lib/data/learning"
import { UPGRADE } from "@/lib/data/sample"
import { cn } from "@/lib/utils"

/** The demo student is in the first tier; previews can ask for another with ?tier= or "Preview as". */
export function useStudentTier() {
  const { coach } = useCoach()
  return useViewerTier(coach)
}

/** Course artwork in the brand's series colours. */
export function CourseCover({ course, className, locked }: { course: Pick<Course, "color" | "title">; className?: string; locked?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Cover color={series(course.color)} className="absolute inset-0 rounded-none" />
      {locked && (
        <div className="absolute inset-0 grid place-items-center bg-black/45 text-white backdrop-blur-[1px]">
          <Lock className="size-6" />
        </div>
      )}
    </div>
  )
}

/** Shown when the coach previews unpublished content from the course builder. */
export function PreviewNotice() {
  const { preview } = useCoach()
  if (!preview) return null
  return (
    <div className="flex items-center gap-2 rounded-(--radius) border border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm">
      <span className="size-2 rounded-full bg-primary" />
      Preview: drafts are shown as students will see them once published. Only you can see this.
    </div>
  )
}

/** "AI" mark on everything AI-made. */
export function AiMark({ className }: { className?: string }) {
  return (
    // The word in the text colour: brand-text isn't checked against the brand tint behind it. The sparkle keeps the brand.
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-foreground", className)}>
      <Sparkles className="size-3 text-primary" /> AI
    </span>
  )
}

/** STU-22: content needs a higher tier. What it unlocks, the price, upgrade. */
export function UpgradeDialog({ course, open, onOpenChange }: { course: Course | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { coach } = useCoach()
  const tier = coach.tiers.find((t) => course?.tiers.includes(t.id))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-md">
        {course && <CourseCover course={course} locked className="h-28" />}
        <div className="grid gap-4 px-6 pb-6">
          <DialogHeader>
            <DialogTitle>
              {course?.title} is part of {tier?.name ?? "a higher tier"}
            </DialogTitle>
            <DialogDescription>
              Upgrade and it opens straight away, with everything else in {tier?.name}. You only pay the difference for this month.
            </DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 text-sm">
            {UPGRADE.features
              .filter((f) => f.next)
              .map((f) => (
                <li key={f.label} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> {f.label}
                </li>
              ))}
          </ul>
          <DialogFooter className="items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {tier ? (
                <>
                  <span className="font-heading text-xl text-foreground">{tier.price}</span> / {tier.cadence}
                </>
              ) : null}
            </span>
            <Button
              onClick={() => {
                onOpenChange(false)
                toast("Checkout would open here.", { description: `Upgrade to ${tier?.name ?? "the next tier"} with ${coach.coachName}.` })
              }}
            >
              Upgrade to {tier?.name ?? "unlock"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const hours = (minutes: number) => (minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60 ? `${minutes % 60} min` : ""}`.trim())
