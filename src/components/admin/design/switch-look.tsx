"use client"

import { useState } from "react"
import { History } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDesign } from "./design-fields"

/**
 * Switching to another look or template replaces the coach's style, so in the
 * Design editor it asks first and keeps the design as it was in Earlier
 * versions (⌘Z still undoes it too). Where nothing is kept (the setup wizard,
 * the lab) the switch happens at once, as before.
 * Returns `ask(name, apply)` and the dialog to render.
 */
export function useConfirmSwitch() {
  const { keepVersion } = useDesign()
  const [pending, setPending] = useState<{ name: string; apply: () => void } | null>(null)
  const ask = (name: string, apply: () => void) => (keepVersion ? setPending({ name, apply }) : apply())
  const dialog = (
    <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch to {pending?.name}?</DialogTitle>
          <DialogDescription>
            Fonts, cards, widgets and spacing start again from {pending?.name}. Your name, logo, colours, menu and pages stay.
          </DialogDescription>
        </DialogHeader>
        <p className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground">
          <History className="mt-px size-3.5 shrink-0" />
          Your design as it is now is saved in Earlier versions (the ⋯ menu), so you can bring it back at any time.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPending(null)}>
            Keep my design
          </Button>
          <Button
            onClick={() => {
              if (!pending) return
              keepVersion?.(`Before switching to ${pending.name}`)
              pending.apply()
              setPending(null)
            }}
          >
            Switch to {pending?.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  return [ask, dialog] as const
}
