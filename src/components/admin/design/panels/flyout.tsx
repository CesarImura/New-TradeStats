"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { X } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A panel that opens beside a sidebar, over the page being edited (the Framer and Flory flyouts): for choices too big
 * or too specific for the sidebar (a group's widgets, a widget's layouts), so the sidebars never change width. It sits
 * against the side of `anchor` (the sidebar), the full height of it, and closes with Esc, a click outside or its ×.
 */
export function Flyout({
  open,
  onClose,
  anchor,
  side,
  title,
  width = 360,
  children,
}: {
  open: boolean
  onClose: () => void
  /** The sidebar it opens from. */
  anchor: React.RefObject<HTMLElement | null>
  /** Which side of the sidebar it opens on: right of the left sidebar, left of the right one. */
  side: "right" | "left"
  title: React.ReactNode
  width?: number
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  useLayoutEffect(() => {
    if (!open) return
    const place = () => anchor.current && setRect(anchor.current.getBoundingClientRect())
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [open, anchor])
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => e.key === "Escape" && (e.stopPropagation(), onClose())
    // A click outside closes it, but not one on the sidebar it came from (that click chooses what it shows).
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (box.current?.contains(t) || anchor.current?.contains(t)) return
      if (t instanceof Element && t.closest("[data-slot=dropdown-menu-content],[data-slot=popover-content],[data-slot=select-content]")) return
      onClose()
    }
    window.addEventListener("keydown", key, true)
    document.addEventListener("pointerdown", down)
    return () => {
      window.removeEventListener("keydown", key, true)
      document.removeEventListener("pointerdown", down)
    }
  }, [open, onClose, anchor])
  if (!open || !rect) return null
  const gap = 8
  return (
    <div
      ref={box}
      role="dialog"
      aria-label={typeof title === "string" ? title : undefined}
      className={cn(
        "fixed z-[45] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111113] text-foreground",
        "animate-in fade-in-0 duration-150 ease-out motion-reduce:animate-none",
        side === "right" ? "slide-in-from-left-2" : "slide-in-from-right-2",
      )}
      style={{
        top: rect.top + gap,
        bottom: window.innerHeight - rect.bottom + gap,
        width,
        left: side === "right" ? rect.right + gap : rect.left - gap - width,
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 pr-3 pl-5">
        <div className="min-w-0 flex-1 truncate text-[0.875rem] font-semibold">{title}</div>
        <Button variant="ghost" size="icon" aria-label="Close" title="Close (Esc)" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </div>
  )
}
