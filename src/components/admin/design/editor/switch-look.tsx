"use client"

import { useState } from "react"
import { History } from "@/components/icons"
import { AdminButton, AdminModal } from "@/components/admin/ui"
import { useDesign } from "../fields/design-fields"

/**
 * Switching to another look or template replaces the coach's style, so in the
 * Design editor it asks first and keeps the design as it was in Earlier
 * versions (⌘Z still undoes it too). Where nothing is kept (the setup wizard)
 * the switch happens at once, as before.
 * Returns `ask(name, apply)` and the dialog to render.
 */
export function useConfirmSwitch() {
  const { keepVersion } = useDesign()
  const [pending, setPending] = useState<{ name: string; apply: () => void } | null>(null)
  const ask = (name: string, apply: () => void) => (keepVersion ? setPending({ name, apply }) : apply())
  const dialog = (
    <AdminModal
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      title={`Switch to ${pending?.name}?`}
      subtitle={`Fonts, cards, widgets and spacing start again from ${pending?.name}. Your name, logo, colours, menu and pages stay.`}
      className="sm:max-w-md"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => setPending(null)}>
            Keep my design
          </AdminButton>
          <AdminButton
            onClick={() => {
              if (!pending) return
              keepVersion?.(`Before switching to ${pending.name}`)
              pending.apply()
              setPending(null)
            }}
          >
            Switch to {pending?.name}
          </AdminButton>
        </>
      }
    >
      <p className="flex items-start gap-2 rounded-a-lg border border-a-border p-3 t-caption text-a-text-2">
        <History className="mt-px size-3.5 shrink-0" />
        Your design as it is now is saved in Earlier versions (the ⋯ menu), so you can bring it back at any time.
      </p>
    </AdminModal>
  )
  return [ask, dialog] as const
}
