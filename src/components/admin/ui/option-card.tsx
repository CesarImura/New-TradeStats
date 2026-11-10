"use client"

import { cn } from "@/lib/utils"

/** Admin / Option card (Figma 'Admin · Cards & lists'): radius 10, padding 14/16, gap 12, a radio on the left. Default, hover, active (accent edge), disabled. */
export function OptionCard({ checked, onSelect, title, description, disabled, compact, className }: { checked: boolean; onSelect: () => void; title: string; description?: string; disabled?: boolean; compact?: boolean; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={checked} disabled={disabled} onClick={onSelect}
      className={cn("flex items-start gap-3 rounded-a-10 border text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:pointer-events-none disabled:opacity-40", compact ? "p-3.5" : "px-4 py-3.5", checked ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong", className)}>
      <span aria-hidden className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]", checked ? "border-a-border-active" : "border-a-border-strong")}>{checked && <span className="size-2 rounded-full bg-a-accent" />}</span>
      <span className="grid gap-0.5">
        <span className="t-body-m text-a-text">{title}</span>
        {description && <span className="t-caption text-a-text-2">{description}</span>}
      </span>
    </button>
  )
}
