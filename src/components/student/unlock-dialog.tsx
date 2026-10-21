"use client"

import { Lock } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/** Something is part of a higher tier: what it is, which tier, the price, upgrade. Same pattern as a locked course (STU-22). */
export function UnlockDialog({ title, tiers, open, onOpenChange }: { title?: string; tiers: string[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { coach } = useCoach()
  const tier = coach.tiers.find((t) => tiers.includes(t.id))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-4" />
          </span>
          <DialogTitle>
            {title} is part of {tier?.name ?? "a higher tier"}
          </DialogTitle>
          <DialogDescription>Upgrade and it opens straight away, with everything else in {tier?.name ?? "that tier"}. You only pay the difference for this month.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {tier && (
              <>
                <span className="font-heading text-xl text-foreground">{tier.price}</span> / {tier.cadence}
              </>
            )}
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
      </DialogContent>
    </Dialog>
  )
}
