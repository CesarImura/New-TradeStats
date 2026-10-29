"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * The review page's own controls (prototype only), shared by the library bar
 * and the widget modal: 36px tall, 14px text, a raised surface for the
 * chosen option. Colours come from the page's chrome ladder (--c-*).
 */
export const CONTROL_FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-(--brand-mark) focus-visible:ring-offset-1 focus-visible:ring-offset-(--c-page)"

/**
 * A segmented control that names itself: the label sits inside the control,
 * before the options and behind a hairline, so a row of controls shares one
 * baseline and one height. A panel can set --seg-label so stacked labels
 * line up. `inline` is kept for older callers; it no longer
 * changes anything.
 */
export function LabSeg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][]; inline?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 max-w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg border p-[3px] [scrollbar-width:none]" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
      <span aria-hidden className="flex h-full min-w-(--seg-label,0) shrink-0 items-center px-2.5 text-[0.8125rem] whitespace-nowrap text-(--c-t3)">
        {label}
      </span>
      <span aria-hidden className="mr-0.5 h-4 w-px shrink-0" style={{ background: "var(--c-hair)" }} />
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={cn(
            "h-full shrink-0 rounded-md px-3 text-sm whitespace-nowrap transition-colors duration-150",
            CONTROL_FOCUS,
            v === value ? "bg-(--c-bar) font-medium text-(--c-t1) shadow-[0_0_0_1px_var(--c-hair),0_1px_2px_0_rgb(0_0_0/0.1)]" : "text-(--c-t2) hover:text-(--c-t1)",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** A 36px square icon button with a tooltip. */
export function LabIconButton({
  ref,
  onClick,
  label,
  disabled,
  pressed,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>
  onClick: () => void
  label: string
  disabled?: boolean
  pressed?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border transition-colors duration-150 hover:bg-(--c-on) disabled:opacity-40 disabled:hover:bg-transparent",
        CONTROL_FOCUS,
        pressed && "bg-(--c-on)",
      )}
      style={{ borderColor: "var(--c-hair)" }}
    >
      {children}
    </button>
  )
}

/** A 36px button with an icon and a label. */
/** `expanded` instead of `pressed` when the button opens a panel. */
export function LabButton({ onClick, label, hint, pressed, expanded, children }: { onClick: () => void; label: string; hint?: string; pressed?: boolean; expanded?: boolean; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      aria-pressed={expanded === undefined ? pressed : undefined}
      aria-expanded={expanded}
      className={cn("flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-150", CONTROL_FOCUS, pressed || expanded ? "bg-(--c-on) font-medium" : "hover:bg-(--c-on)")}
      style={{ borderColor: "var(--c-hair)" }}
    >
      {children}
      {label}
    </button>
  )
}

/** A thin vertical line between groups of controls. */
export function LabDivider() {
  return <span aria-hidden className="h-5 w-px shrink-0 self-center" style={{ background: "var(--c-hair)" }} />
}

/** A button that opens a small panel under it; closes on Escape or a click outside. */
export function LabPopover({ label, icon, align = "end", children }: { label: string; icon?: React.ReactNode; align?: "start" | "end"; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", out)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("pointerdown", out)
      document.removeEventListener("keydown", esc)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <LabButton onClick={() => setOpen(!open)} label={label} pressed={open}>
        {icon}
      </LabButton>
      {open && (
        <div
          className={cn("absolute top-11 z-40 grid w-max max-w-[calc(100vw-2rem)] gap-2 rounded-xl border p-2 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]", align === "end" ? "right-0" : "left-0")}
          style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)", "--seg-label": "4.75rem" } as React.CSSProperties}
        >
          {children}
        </div>
      )}
    </div>
  )
}

/** A native select in the same 36px shape as LabSeg, its label inside. */
export function LabSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex h-9 shrink-0 items-center rounded-lg border p-[3px] focus-within:ring-2 focus-within:ring-(--brand-mark)" style={{ borderColor: "var(--c-hair)", background: "var(--c-page)" }}>
      <span className="flex h-full items-center px-2.5 text-[0.8125rem] whitespace-nowrap text-(--c-t3)">{label}</span>
      <span aria-hidden className="mr-0.5 h-4 w-px shrink-0" style={{ background: "var(--c-hair)" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full max-w-[16rem] min-w-0 rounded-md bg-transparent px-2 text-sm text-(--c-t1) outline-none">
        {children}
      </select>
    </label>
  )
}

/** A tool's controls under the page heading: one wrapping row of LabSeg-sized controls. */
export function LabToolbar({ children }: { children: React.ReactNode }) {
  // On a phone a control wider than the screen scrolls inside itself (LabSeg's max-w-full) instead of widening the page.
  return <div className="flex min-w-0 flex-wrap items-center gap-3">{children}</div>
}

/** A summary card: a big ratio, a line of text and a row of pass/fail chips. */
export function LabSummary({ value, total, text, chips }: { value: number; total: number; text: string; chips: { label: string; fails: number; note?: string }[] }) {
  return (
    <section aria-label="Summary" className="grid gap-3 rounded-xl border p-4" style={{ borderColor: "var(--c-hair)", background: "var(--c-bar)" }}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[1.375rem] leading-7 font-medium tabular-nums">
          {value}
          <span className="text-(--c-t3)">/{total}</span>
        </span>
        <span className="text-sm text-(--c-t2)">{text}</span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <li
            key={c.label}
            className={cn("flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[0.8125rem]", c.fails ? "text-(--c-t1)" : "text-(--c-t3)")}
            style={{ borderColor: c.fails ? "color-mix(in oklab, var(--loss) 45%, var(--c-hair))" : "var(--c-hair)" }}
          >
            <span className="size-1.5 rounded-full" style={{ background: c.fails ? "var(--loss)" : "var(--c-hair)" }} />
            {c.label}
            <span className="text-(--c-t3) tabular-nums">{c.note ?? (c.fails ? `fails ${c.fails}` : "ok")}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
