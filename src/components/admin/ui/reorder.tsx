"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GripVertical } from "@/components/icons"
import { cn } from "@/lib/utils"

/**
 * The shared pieces of reordering in the Admin, as in Design → Menu: a handle that is a real button (drag it, or focus it and press the arrows),
 * a hint the handle points to, a brief flash on the item that moved, and a line a screen reader hears. Every list sorted by hand uses them.
 */

/** One sentence for the handles to point to (`aria-describedby`); sighted users see the grip and the drag. */
export function SortHint({ id, keys = "↑ ↓" }: { id: string; keys?: string }) {
  return (
    <p id={id} className="sr-only">
      Drag the handle to reorder, or focus it and press {keys}.
    </p>
  )
}

/** The grip: hover and focus lift it from tertiary to primary. Arrow keys call `onMove(-1 | 1)` (up and left are earlier). Drag props come from the list. */
export function ReorderHandle({ label, hintId, keys = "vertical", onMove, className, ...drag }: { label: string; hintId: string; keys?: "vertical" | "grid"; onMove?: (by: -1 | 1) => void } & Omit<React.ComponentProps<"button">, "onKeyDown">) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-describedby={hintId}
      title={`Drag to reorder, or press ${keys === "grid" ? "← → ↑ ↓" : "↑ ↓"}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const by = e.key === "ArrowUp" || (keys === "grid" && e.key === "ArrowLeft") ? -1 : e.key === "ArrowDown" || (keys === "grid" && e.key === "ArrowRight") ? 1 : 0
        if (!by || !onMove) return
        e.preventDefault()
        e.stopPropagation()
        onMove(by)
      }}
      className={cn("grid h-7 w-6 shrink-0 cursor-grab touch-none place-items-center rounded-a-sm text-a-text-3 outline-none transition-colors duration-150 ease-out hover:bg-a-hover hover:text-a-text focus-visible:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus active:cursor-grabbing motion-reduce:transition-none", className)}
      {...drag}
    >
      <GripVertical aria-hidden className="size-3.5" />
    </button>
  )
}

/** After a move: the item that moved shows the active edge for a moment (`flashed(id)`), and `Live` says where it went to screen readers. */
export function useMoveFeedback() {
  const [flashId, setFlashId] = useState<string | null>(null)
  const [said, setSaid] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])
  const moved = useCallback((id: string, message: string) => {
    if (timer.current) clearTimeout(timer.current)
    setFlashId(id)
    setSaid(message)
    timer.current = setTimeout(() => setFlashId(null), 900)
  }, [])
  const Live = () => (
    <p role="status" aria-live="polite" className="sr-only">
      {said}
    </p>
  )
  return { flashed: (id: string) => flashId === id, moved, Live }
}
