"use client"

import { cn } from "@/lib/utils"

/** Admin / Tab (580:459): caption text, soft pill when Active. Controlled; arrow keys move between tabs. */
export function AdminTabs<T extends string>({ tabs, value, onChange, label, className }: { tabs: readonly { id: T; label: string; count?: number | string; dot?: boolean }[]; value: T; onChange: (id: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex max-w-full shrink-0 items-start overflow-x-auto rounded-a-md border border-a-border p-0.5 [scrollbar-width:none]", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return
        e.preventDefault()
        const i = Math.max(0, tabs.findIndex((t) => t.id === value))
        const next = e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[tabs.length - 1] : tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        ;(e.currentTarget.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus()
      }}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" data-tab={t.id} aria-selected={t.id === value} tabIndex={t.id === (tabs.some((x) => x.id === value) ? value : tabs[0]?.id) ? 0 : -1} onClick={() => onChange(t.id)}
          className={cn("relative inline-flex h-[26px] pointer-coarse:h-10 shrink-0 items-center gap-1.5 rounded-a-sm px-2.5 t-caption outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
            t.id === value ? "bg-a-raised text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text")}>
          {t.dot && <span aria-hidden className="size-1.5 rounded-full bg-a-warning-fill" />}
          {t.label}
          {t.count !== undefined && <span className="text-a-text-3 tabular-nums">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
