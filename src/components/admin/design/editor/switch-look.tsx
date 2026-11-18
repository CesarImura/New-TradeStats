"use client"

import { useState } from "react"
import { History } from "@/components/icons"
import { AdminButton, AdminModal, Callout } from "@/components/admin/ui"
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
  /** `confirm` false: nothing the coach did by hand would be lost, so it applies at once (the toast has Undo). */
  const ask = (name: string, apply: () => void, confirm = true) => (keepVersion && confirm ? setPending({ name, apply }) : apply())
  const dialog = (
    <AdminModal overlay="plain"
      open={!!pending}
      onOpenChange={(o) => !o && setPending(null)}
      title={`Switch to ${pending?.name}?`}
      subtitle={`${pending?.name} starts again from its own settings. Everything else stays as it is.`}
      className="sm:max-w-xl"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => setPending(null)}>
            Keep my design
          </AdminButton>
          <AdminButton
            autoFocus
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
      {/* Figma Style · 07 Switch: what is redone and what stays, then where the design as it is now is kept. */}
      <div className="grid grid-cols-2 gap-4">
        <ChangeList title={`Redone from ${pending?.name ?? ""}`} items={["Fonts and heading weight", "Corners, buttons, shadow and borders", "Widget style"]} />
        <ChangeList title="Stays as it is" items={["Name and logo", "Colours and Dark or Light", "Menu, pages, spacing and background"]} />
      </div>
      <Callout icon={<History className="size-4" />}>Your design as it is now is saved in Earlier versions (the ⋯ menu), so you can bring it back at any time.</Callout>
    </AdminModal>
  )
  return [ask, dialog] as const
}

function ChangeList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="grid content-start gap-2">
      <span className="t-mono-label-s uppercase text-a-text-3">{title}</span>
      {items.map((i) => (
        <span key={i} className="t-body-m text-a-text">
          {i}
        </span>
      ))}
    </div>
  )
}
