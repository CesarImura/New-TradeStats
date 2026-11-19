"use client"

import { useRef } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useSlideBox } from "./slide-thumb"

/**
 * Admin / Underline tab (Figma 'Admin · Navigation'): caption text, a 2px accent underline when open. Not the bordered Toolbar tab group.
 * The underline is one bar that slides (and resizes) to the open tab on the same spring as the segmented thumb.
 */
export function AdminUnderlineTabs<T extends string>({ tabs, value, onChange, label }: { tabs: readonly { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { x, w, measured } = useSlideBox(ref, value, tabs.map((t) => `${t.id}${t.count ?? ""}`).join("|"))
  return (
    <div ref={ref} role="tablist" aria-label={label} className="relative flex items-start gap-6 border-b border-a-selected"
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = tabs.findIndex((t) => t.id === value)
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        ;(e.currentTarget.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus()
      }}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" data-tab={t.id} data-slide={t.id} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} onClick={() => onChange(t.id)}
          className={cn("pb-2 pointer-coarse:h-11 border-b-2 border-transparent t-body-m outline-none transition-colors duration-150 focus-visible:text-a-text", t.id === value ? "text-a-text" : "text-a-text-2 hover:text-a-text", t.id === value && !measured && "border-a-accent-strong")}>
          {t.label}
          {t.count ? <span className="ml-1 tabular-nums">{t.count}</span> : null}
        </button>
      ))}
      <motion.span aria-hidden className={cn("pointer-events-none absolute bottom-0 left-0 h-0.5 bg-a-accent-strong", !measured && "invisible")} style={{ x, width: w }} />
    </div>
  )
}
