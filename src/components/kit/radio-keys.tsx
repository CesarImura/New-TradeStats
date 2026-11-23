"use client"

import { useEffect } from "react"

/**
 * One keyboard rule for every `role="radiogroup"` of the product (Admin, Editor, onboarding, student site): the four arrow keys move the choice
 * to the next or the previous option and focus it, skipping the disabled ones, and the group wraps around. Home and End jump to the ends.
 * Groups that already handle the arrows themselves (segmented controls, choice cards) are left alone: the listener is in the capture phase
 * (a dialog stops the key before it reaches the document) and acts one tick later, only if nobody moved the focus or the choice meanwhile.
 * Mounted once in the root layout; a new radio group needs nothing but `role="radiogroup"` and `role="radio"` on its options.
 */
export function RadioKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return
      const from = (e.target as HTMLElement | null)?.closest<HTMLElement>('[role="radio"]')
      const group = from?.closest<HTMLElement>('[role="radiogroup"]')
      if (!from || !group) return
      const state = () => `${document.activeElement === from}|${[...group.querySelectorAll('[role="radio"]')].map((r) => r.getAttribute("aria-checked")).join()}`
      const before = state()
      e.preventDefault() // the page must not scroll under the arrows
      setTimeout(() => state() === before && move(e.key, from, group), 0)
    }
    const move = (key: string, from: HTMLElement, group: HTMLElement) => {
      const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')].filter((r) => !(r as HTMLButtonElement).disabled && r.getAttribute("aria-disabled") !== "true" && r.closest('[role="radiogroup"]') === group)
      const i = radios.indexOf(from)
      if (i < 0 || radios.length < 2) return
      const forward = key === "ArrowRight" || key === "ArrowDown"
      const next = key === "Home" ? radios[0] : key === "End" ? radios[radios.length - 1] : radios[(i + (forward ? 1 : radios.length - 1)) % radios.length]
      if (!next || next === from) return
      next.focus()
      next.click()
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [])
  return null
}
