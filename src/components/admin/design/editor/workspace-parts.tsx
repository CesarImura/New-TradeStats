"use client"
import { Fragment, useEffect, useRef, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminButton, AdminModal } from "@/components/admin/ui"
import { targetsForField, type PickMessage, type PickTarget } from "@/lib/design-pick"
import { usePanelSearching } from "../panels/settings-panel"

/**
 * A click in the preview tells the workspace which part was clicked; `onPick`
 * opens the step and returns the settings to show. Hovering a setting outlines
 * what it changes in the preview.
 */
export function usePreviewPick(on: boolean, onPick: (target: PickTarget) => string[], onEditWidget: (m: { id: string; path: string }) => void) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [reveal, setReveal] = useState<{ fields: string[]; n: number }>({ fields: [], n: 0 })
  const shown = useRef("")
  const pickRef = useRef(onPick)
  const editRef = useRef(onEditWidget)
  useEffect(() => {
    pickRef.current = onPick
    editRef.current = onEditWidget
  })

  useEffect(() => {
    const send = (m: PickMessage) => frame.current?.contentWindow?.postMessage(m, window.location.origin)
    send({ type: "design-pick-mode", on })
    const onMessage = (e: MessageEvent<PickMessage>) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const m = e.data
      if (m?.type === "design-pick-ready") send({ type: "design-pick-mode", on })
      if (m?.type === "design-edit-widget") editRef.current({ id: m.id, path: m.path })
      if (m?.type === "design-pick") {
        const fields = pickRef.current(m.target)
        setReveal((r) => ({ fields, n: r.n + 1 }))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [on])

  const show = (targets: PickTarget[]) => {
    const key = targets.join()
    if (key === shown.current) return
    shown.current = key
    frame.current?.contentWindow?.postMessage({ type: "design-show", targets } satisfies PickMessage, window.location.origin)
  }

  return {
    frameRef: frame,
    reveal,
    /** A click on the canvas (the one screen) does what a click in the preview frame did. */
    pick: (target: PickTarget) => setReveal((r) => ({ fields: pickRef.current(target), n: r.n + 1 })),
    onPanelHover: (e: React.PointerEvent) => {
      if (!on) return
      const field = (e.target as Element).closest("[data-field]")?.getAttribute("data-field")
      show(field ? targetsForField(field) : [])
    },
    onPanelLeave: () => show([]),
  }
}

/** After a pick (and the step and folds have opened): scroll to the first setting and flash them all. */
export function useFlash(panel: React.RefObject<HTMLDivElement | null>, reveal: { fields: string[]; n: number }) {
  useEffect(() => {
    if (!reveal.n) return
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => {
        const els = reveal.fields.flatMap((f) => [...(panel.current?.querySelectorAll<HTMLElement>(`[data-field="${f}"]`) ?? [])])
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        els[0]?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" })
        for (const el of els)
          el.animate(
            [
              { outline: "2px solid var(--admin-color-border-active)", outlineOffset: "6px", borderRadius: "4px" },
              { outline: "2px solid transparent", outlineOffset: "6px", borderRadius: "4px" },
            ],
            { duration: still ? 600 : 1600, easing: "ease-out" },
          )
        if (reveal.fields[0]?.startsWith("menu-")) els[0]?.querySelector<HTMLInputElement>("input:not(:disabled)")?.select()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [panel, reveal])
}

/** Hidden while the panel search is open: the search and its results are all the panel shows then. */
export function SearchHides({ children }: { children: React.ReactNode }) {
  return usePanelSearching() ? null : <>{children}</>
}

/** Back to the original design, from the ⋯ menu: asks first, says what goes back, and can put the pages back too. Undoable. */
export function ResetDialog({ open, onOpenChange, name, onReset }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; onReset: (pagesToo: boolean) => void }) {
  const [pagesToo, setPagesToo] = useState(false)
  // The dialog's one field takes the focus when it opens (the dialog itself would start on the close button).
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => document.getElementById("reset-pages")?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])
  return (
    <AdminModal overlay="plain"
      open={open}
      onOpenChange={(o) => (onOpenChange(o), setPagesToo(false))}
      title="Back to the original design?"
      subtitle={`Colours, type, shapes, widgets and background go back to how ${name} started. Your name, logo and menu stay. You can undo it (⌘Z).`}
      className="sm:max-w-[560px]"
      footer={
        <>
          <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>
            Keep
          </AdminButton>
          <AdminButton
            hierarchy="danger"
            onClick={() => {
              onReset(pagesToo)
              onOpenChange(false)
            }}
          >
            Reset
          </AdminButton>
        </>
      }
    >
      <label className="flex cursor-pointer items-center gap-2 t-body-m">
        <Checkbox id="reset-pages" autoFocus checked={pagesToo} onCheckedChange={(v) => setPagesToo(!!v)} />
        Also put every page&apos;s layout back
      </label>
    </AdminModal>
  )
}

