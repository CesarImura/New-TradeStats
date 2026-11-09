"use client"

import { cn } from "@/lib/utils"

/** Admin / Tab (580:459): caption text, soft pill when Active. Controlled; arrow keys move between tabs. */
export function AdminTabs<T extends string>({ tabs, value, onChange, label, className }: { tabs: readonly { id: T; label: string; dot?: boolean }[]; value: T; onChange: (id: T) => void; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex max-w-full gap-1 overflow-x-auto", className)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        const i = tabs.findIndex((t) => t.id === value)
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        ;(e.currentTarget.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus()
      }}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" data-tab={t.id} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} onClick={() => onChange(t.id)}
          className={cn("relative inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-a-sm px-2.5 t-caption outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
            t.id === value ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text")}>
          {t.label}
          {t.dot && <span aria-label="needs attention" className="size-1.5 rounded-full bg-a-accent-strong" />}
        </button>
      ))}
    </div>
  )
}
