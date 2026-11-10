"use client"

import { cn } from "@/lib/utils"

/**
 * Admin / Segmented option (Figma): 36px, radius 8, 1px border, padding 8/12, Body/M.
 * Default border + secondary text, Hover border strong, Active raised fill + accent border.
 */
export function AdminSegmented<T extends string>({ options, value, onChange, label, className }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void; label?: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-1.5", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.id === value
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)}
            className={cn(
              "h-9 rounded-a-md border px-3 t-body-m outline-none transition-colors duration-300 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus",
              on ? "border-[var(--admin-color-border-active)] bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:border-a-border-strong hover:text-a-text"
            )}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
