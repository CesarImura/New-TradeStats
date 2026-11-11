"use client"

import { cn } from "@/lib/utils"

/** Admin / Option card (Figma 674:2167): radius 10, padding 14/16, gap 12, a 16px radio centred on the left, title 14, text 12. Default, hover (strong edge), active (accent edge, raised fill), disabled. */
export function OptionCard({ checked, onSelect, title, description, disabled, className }: { checked: boolean; onSelect: () => void; title: string; description?: string; disabled?: boolean; /** @deprecated Same padding as the default; kept so old calls still compile. */ compact?: boolean; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={checked} disabled={disabled} onClick={onSelect}
      className={cn("flex items-center gap-3 rounded-a-10 border px-4 py-3.5 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus disabled:pointer-events-none disabled:opacity-40", checked ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong", className)}>
      <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-300", checked ? "border-a-border-active" : "border-a-border-strong")}>
        <span className={cn("size-2 rounded-full bg-a-accent transition-transform duration-200 ease-out motion-reduce:transition-none", checked ? "scale-100" : "scale-0")} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="t-body-l text-a-text">{title}</span>
        {description && <span className="t-caption text-a-text-2">{description}</span>}
      </span>
    </button>
  )
}
