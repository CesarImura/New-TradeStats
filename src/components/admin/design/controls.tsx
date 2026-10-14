"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "@/components/icons"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Click-to-edit: the setting fields picked in the preview. Folded parts of the
 * panel that hold one of them open themselves; `n` changes on every pick.
 */
export const RevealContext = createContext<{ fields: string[]; n: number }>({ fields: [], n: 0 })

/** Opens when a picked field is inside `ref` (folded content stays in the DOM, hidden). */
export function useReveal(ref: React.RefObject<HTMLElement | null>, open: () => void) {
  const { fields, n } = useContext(RevealContext)
  useEffect(() => {
    if (n && fields.some((f) => ref.current?.querySelector(`[data-field="${f}"]`))) open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
}

/** A labelled row in the editor panel. `id` lets a click in the preview find it. */
export function Field({ id, label, hint, children }: { id?: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2" data-field={id}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-[0.8rem] font-medium">{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** Plain-words choice between a few options, all visible at once. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: React.ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs whitespace-nowrap text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            o.value === value && "bg-background font-medium text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Colour presets plus a custom picker. */
export function Swatches({
  value,
  colors,
  onChange,
  label,
}: {
  value: string
  colors: string[]
  onChange: (c: string) => void
  label: string
}) {
  const custom = !colors.some((c) => c.toLowerCase() === value.toLowerCase())
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((c) => {
        const on = c.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={c}
            role="radio"
            aria-checked={on}
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              "grid size-7 place-items-center rounded-full ring-1 ring-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
            style={{ background: c }}
          >
            {on && <Check className="size-3.5 mix-blend-difference text-white" />}
          </button>
        )
      })}
      <label
        className={cn(
          "relative grid size-7 cursor-pointer place-items-center rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] ring-1 ring-black/10",
          custom && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
        )}
        title="Pick any colour"
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`Custom ${label.toLowerCase()}`}
        />
      </label>
    </div>
  )
}

/** "Simple first, advanced on demand": extra settings stay folded away. */
export function More({ label = "More options", children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref, () => setOpen(true))
  return (
    <div ref={ref} className="grid gap-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Fewer options" : label}
      </button>
      <div hidden={!open} className="grid gap-5 border-l pl-4">
        {children}
      </div>
    </div>
  )
}
