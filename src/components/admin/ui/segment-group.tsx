"use client"

import { cn } from "@/lib/utils"

/**
 * Admin / Segmented (Figma 934:7156): a bordered group (radius 8, 2 px inside) of items (radius 6, py 6, px 12; icon-only px 8, 28 high).
 * The chosen item takes the panel fill; the others are secondary text and brighten on hover. Radio semantics, arrow keys move.
 * (`AdminSegmented` is Figma's "Segmented option": separate bordered cells for choices with more weight, like a billing period.)
 * `fill` stretches the group and shares the width between the items (a panel's Light / Dark).
 */
export function AdminSegmentGroup<T extends string>({ value, onChange, options, label, fill, className }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label?: string; icon?: React.ReactNode; disabled?: boolean; title?: string }[]; label: string; fill?: boolean; className?: string }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex shrink-0 items-center gap-0.5 rounded-a-md border border-a-border p-0.5", fill && "w-full", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const on = options.filter((o) => !o.disabled)
        const i = on.findIndex((o) => o.value === value)
        const next = on[(i + (e.key === "ArrowRight" ? 1 : on.length - 1)) % on.length]
        if (!next) return
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            data-value={o.value}
            aria-checked={on}
            aria-label={o.label ? undefined : o.title ?? o.value}
            title={o.title}
            disabled={o.disabled}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-a-sm t-body-m whitespace-nowrap outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-10 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
              o.label ? "h-[30px] px-3" : "h-7 w-8 px-2",
              fill && o.label && "flex-1",
              on ? "bg-a-panel text-a-text" : "text-a-text-2 hover:text-a-text"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
