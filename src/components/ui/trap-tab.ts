import type * as React from "react"

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab inside a dialog or sheet: after the last control it goes back to the first, and Shift+Tab from the first goes to the last.
 * The base-ui focus guards let focus out to the page behind after a few turns; this closes that gap and runs after any handler passed in.
 */
export function trapTab<T extends HTMLElement>(e: React.KeyboardEvent<T>, next?: (e: React.KeyboardEvent<T>) => void) {
  next?.(e)
  if (e.defaultPrevented || e.key !== "Tab") return
  const root = e.currentTarget
  const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest("[inert], [hidden]") && el.getClientRects().length > 0)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (!active || !root.contains(active) || active === root) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return }
  if (e.shiftKey && active === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
  else {
    // The guards the focus manager leaves next to the popup can take focus between two controls: put it back on the end it was heading for.
    const back = e.shiftKey
    setTimeout(() => {
      const now = document.activeElement
      if (root.isConnected && !root.contains(now)) (back ? last : first).focus()
    }, 0)
  }
}
