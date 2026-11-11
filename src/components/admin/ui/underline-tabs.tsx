"use client"

import { cn } from "@/lib/utils"

/** Admin / Underline tab (Figma 'Admin · Navigation'): caption text, a 2px accent underline when open. Not the bordered Toolbar tab group. */
export function AdminUnderlineTabs<T extends string>({ tabs, value, onChange, label }: { tabs: readonly { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex items-start gap-6 border-b border-a-selected"
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = tabs.findIndex((t) => t.id === value)
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        ;(e.currentTarget.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus()
      }}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" data-tab={t.id} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} onClick={() => onChange(t.id)}
          className={cn("pb-2 pointer-coarse:h-11 border-b-2 t-body-m outline-none transition-colors duration-300 focus-visible:text-a-text", t.id === value ? "border-a-accent-strong text-a-text" : "border-transparent text-a-text-2 hover:text-a-text")}>
          {t.label}
          {t.count ? <span className="ml-1 tabular-nums">{t.count}</span> : null}
        </button>
      ))}
    </div>
  )
}
