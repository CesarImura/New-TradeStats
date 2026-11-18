"use client"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { ChevronDown, RotateCcw } from "@/components/icons"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { LABEL, VALUE } from "./field-styles"

/**
 * Click-to-edit: the setting fields picked in the preview. Folded parts of the
 * panel that hold one of them open themselves; `n` changes on every pick.
 */
export { BOX } from "./field-styles"
export { ColorField, ColorPicker, Swatches } from "./color-picker"

export const RevealContext = createContext<{ fields: string[]; n: number }>({ fields: [], n: 0 })

/** Opens when a picked field is inside `ref` (folded content stays in the DOM, hidden). */
export function useReveal(ref: React.RefObject<HTMLElement | null>, open: () => void) {
  const { fields, n } = useContext(RevealContext)
  useEffect(() => {
    if (n && fields.some((f) => ref.current?.querySelector(`[data-field="${f}"]`))) open()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])
}

/*
 * Editor controls in the spirit of toolcraft.sh: quiet, dense and monochrome,
 * so the coach's colours are the only colour in the panel. Label on the left
 * at reduced contrast, the value on the right in tabular figures (click it to
 * type), hairline sliders with a small square thumb, fields 28px tall with a
 * faint fill and edge, hex codes in mono. Focus stays our orange ring.
 */

/** A labelled row in the editor panel. `id` lets a click in the preview find it. */
export function Field({ id, label, hint, children, inline }: { id?: string; label: string; hint?: React.ReactNode; children: React.ReactNode; /** The control sits on the label's row, on the right (Figma Theme · Mode). */ inline?: boolean }) {
  if (inline)
    return (
      <div className="flex min-w-0 items-center justify-between gap-3" data-field={id}>
        <Label className={cn(LABEL, "shrink-0 whitespace-nowrap")}>{label}</Label>
        {children}
      </div>
    )
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2" data-field={id}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        {/* The label never wraps; a long hint gives way (cut, whole in its tooltip). */}
        <Label className={cn(LABEL, "shrink-0 whitespace-nowrap")}>{label}</Label>
        {hint && <span title={typeof hint === "string" ? hint : undefined} className={cn(VALUE, "min-w-0 truncate text-right")}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** A number on the right of a label: shows the formatted value, and turns into an input on click. */
function EditableValue({ value, min, max, format, unit, label, onChange }: {
  value: number
  min: number
  max: number
  format: (v: number) => string
  unit?: string
  label: string
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const done = () => {
    const n = Number.parseFloat(draft ?? "")
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
    setDraft(null)
  }
  if (draft === null)
    return (
      <button type="button" onClick={() => setDraft(String(value))} aria-label={`Edit ${label}`} className={cn(VALUE, "cursor-text text-right transition-colors hover:text-foreground")}>
        {format(value)}
      </button>
    )
  return (
    <span className={cn(VALUE, "flex items-center gap-0.5")}>
      <input
        autoFocus
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === "Enter") done()
          if (e.key === "Escape") setDraft(null)
        }}
        onFocus={(e) => e.target.select()}
        aria-label={label}
        className="w-[5ch] bg-transparent text-right text-foreground tabular-nums outline-none"
      />
      {unit}
    </span>
  )
}

/**
 * A setting on a range: label, value you can click and type, and a 1px track
 * with a 9px square thumb (an 18px area to grab). Arrow keys step; Shift
 * steps ten times as far.
 */
export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  format = (v) => `${v}${unit ?? ""}`,
  ends,
  onChange,
}: {
  id?: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  /** How the value reads on the right, e.g. "Sharp" or "12px". */
  format?: (v: number) => string
  /** Words under the two ends of the track, e.g. Warm / Direct. */
  ends?: [string, string]
  onChange: (v: number) => void
}) {
  return (
    <div className="grid gap-1" data-field={id}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className={LABEL}>{label}</span>
        <EditableValue value={value} min={min} max={max} format={format} unit={unit} label={label} onChange={onChange} />
      </div>
      <SliderPrimitive.Root
        value={value}
        min={min}
        max={max}
        step={step}
        largeStep={step * 10}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
        thumbAlignment="edge"
        aria-label={label}
        className="w-full"
      >
        <SliderPrimitive.Control className="group/slider relative flex h-[18px] w-full touch-none items-center select-none">
          <SliderPrimitive.Track className="relative h-0.5 w-full grow rounded-full bg-a-track">
            <SliderPrimitive.Indicator className="h-full rounded-full bg-a-text-3" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb aria-label={label} className="relative block size-2.5 shrink-0 cursor-grab rounded-full bg-a-text transition-transform outline-none select-none before:absolute before:top-1/2 before:left-1/2 before:size-[18px] before:-translate-1/2 hover:scale-125 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-a-border-focus active:cursor-grabbing data-[dragging]:scale-125" />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      {ends && (
        <span className="flex justify-between t-caption text-muted-foreground">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </span>
      )}
    </div>
  )
}

/** Plain-words choice between a few options, all visible at once. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  /** `hint` shows as the option's tooltip; an icon label needs `name` for screen readers. */
  options: { value: T; label: React.ReactNode; hint?: string; name?: string }[]
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-stretch gap-0.5 rounded-a-md border border-a-border p-0.5", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          aria-label={o.name}
          title={o.hint ?? o.name ?? (typeof o.label === "string" ? o.label : undefined)}
          onClick={() => onChange(o.value)}
          className={cn(
            // The Admin's Segmented item: 30 px, radius 6, secondary text; the chosen one takes the panel fill.
            "relative flex h-[30px] min-w-0 flex-[1_1_auto] items-center justify-center gap-1.5 overflow-hidden rounded-a-sm px-3 t-body-m text-ellipsis whitespace-nowrap text-a-text-2 transition-colors duration-300 outline-none hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:min-h-10 [&_svg]:size-4",
            o.value === value && "bg-a-panel text-a-text",
          )}
        >
          {o.label}
        </button>
      ))}
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
        className="flex w-fit items-center gap-1 t-caption-medium text-muted-foreground hover:text-foreground"
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

/**
 * One property of the inspector, label on the left and its control on the right (the Webflow and Framer rows). A value
 * set on this widget only (`own`) turns its label orange with a dot, and a reset arrow shows on hover; `stack` puts a
 * wide control (five options, a list of layouts) under the label. `hint` is the label's tooltip.
 */
export function Row({
  id,
  label,
  hint,
  own,
  onReset,
  from = "the default",
  stack,
  children,
}: {
  id?: string
  label: string
  hint?: string
  own?: boolean
  onReset?: () => void
  /** Where the value goes back to, for the reset's label. */
  from?: string
  stack?: boolean
  children: React.ReactNode
}) {
  const head = (
    <span className="group/row flex min-h-8 min-w-0 items-center gap-1">
      <span title={hint} className={cn(LABEL, "truncate", own && "text-foreground")}>
        {label}
      </span>
      {own && <span aria-label="Changed on this widget" className="size-1.5 shrink-0 rounded-full bg-a-accent-strong" />}
      {own && onReset && (
        <button
          type="button"
          onClick={onReset}
          aria-label={`${label}: back to ${from}`}
          title={`Back to ${from}`}
          className="grid size-5 shrink-0 place-items-center rounded-[4px] text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 hover:bg-a-selected hover:text-foreground focus-visible:opacity-100 focus-visible:outline-1 focus-visible:outline-[color:var(--ring)]"
        >
          <RotateCcw className="size-3" />
        </button>
      )}
    </span>
  )
  return stack ? (
    <div className="grid gap-1" data-field={id}>
      {head}
      {children}
    </div>
  ) : (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2" data-field={id}>
      {head}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/**
 * A titled block of the inspector that folds away (the chevron on the left, as in Webflow), with an optional action on
 * the right (a "+" that adds what the block holds, a reset). Blocks sit on hairlines that run the panel's full width.
 */
export function InspectorSection({ title, action, summary, defaultOpen = true, children }: { title: string; action?: React.ReactNode; /** Shown on the right while folded: what the block holds now. */ summary?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, () => setOpen(true))
  return (
    <section ref={ref} className="border-t border-a-border-subtle pt-1 first:border-t-0">
      <div className="flex h-11 items-center gap-1 pr-3 pl-4">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[6px] px-1 text-left t-mono-label-s text-muted-foreground outline-none hover:text-foreground focus-visible:outline-1 focus-visible:outline-[color:var(--ring)]"
        >
          <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 ease-out", !open && "-rotate-90")} />
          <span className="shrink-0">{title}</span>
          {summary && !open && <span className="ml-auto min-w-0 truncate pl-3 font-sans t-caption tracking-normal normal-case text-muted-foreground">{summary}</span>}
        </button>
        {action}
      </div>
      <div hidden={!open} className="grid grid-cols-[minmax(0,1fr)] gap-3.5 px-5 pb-6">
        {children}
      </div>
    </section>
  )
}

/** Yes or No as two halves of one control (Framer's Visible, Required): clearer than a switch in a row of values. */
export function YesNo({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Segmented
      label={label}
      value={value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
    />
  )
}
