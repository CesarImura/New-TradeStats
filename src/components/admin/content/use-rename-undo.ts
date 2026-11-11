"use client"

import { useRef } from "react"
import { toast } from "sonner"

/**
 * For a title that is saved as you type: when the field is left with a new name, a toast offers to take the rename back.
 * Spread the result on the input (`onFocus`, `onBlur`).
 */
export function useRenameUndo(title: string, rename: (title: string) => void) {
  const before = useRef(title)
  return {
    onFocus: () => {
      before.current = title
    },
    onBlur: () => {
      const was = before.current
      if (!title.trim() || title === was) return
      toast(`Renamed to “${title}”.`, { action: { label: "Undo", onClick: () => rename(was) } })
    },
  }
}
