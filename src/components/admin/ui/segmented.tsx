"use client"

import { cn } from "@/lib/utils"

/** Admin / Segmented option, in a row (Figma 'Admin · Navigation'). 36px, radius md, 1px hairline; hover strengthens it; the chosen one is raised with the active edge. Radio semantics, arrow keys move. */
export function AdminSegmented<T extends string>({ value, onChange, options, label, className, size = "md" }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label: string; className?: string; size?: "sm" | "md" }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" data-value={o.value} aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)}
          className={cn("rounded-a-md border outline-none transition-colors duration-300 t-body-m focus-visible:ring-2 focus-visible:ring-a-border-focus", size === "md" ? "h-9 pointer-coarse:h-10" : "h-8 pointer-coarse:h-10", o.value === value ? "border-a-border-active bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:border-a-border-strong hover:text-a-text")}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
