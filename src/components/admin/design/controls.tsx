"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { ChevronDown } from "@/components/icons"
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

/*
 * Editor controls in the spirit of toolcraft.sh: quiet, dense and monochrome,
 * so the coach's colours are the only colour in the panel. Label on the left
 * at reduced contrast, the value on the right in tabular figures (click it to
 * type), hairline sliders with a small square thumb, fields 28px tall with a
 * faint fill and edge, hex codes in mono. Focus stays our orange ring.
 */

const LABEL = "text-xs leading-5 font-medium text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] select-none"
const VALUE = "text-xs leading-5 tabular-nums text-muted-foreground"
const BOX =
  "h-7 rounded-[4px] border border-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] text-xs outline-none transition-colors hover:border-[color:color-mix(in_oklab,var(--foreground)_20%,transparent)] focus-within:border-[color:var(--ring)]"

/** A labelled row in the editor panel. `id` lets a click in the preview find it. */
export function Field({ id, label, hint, children }: { id?: string; label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5" data-field={id}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <Label className={LABEL}>{label}</Label>
        {hint && <span className={cn(VALUE, "truncate text-right")}>{hint}</span>}
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
          <SliderPrimitive.Track className="relative h-px w-full grow rounded-full bg-[color:color-mix(in_oklab,var(--muted-foreground)_38%,transparent)]">
            <SliderPrimitive.Indicator className="h-full bg-foreground" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="relative block size-[9px] shrink-0 cursor-grab rounded-[2px] bg-foreground transition-transform outline-none select-none before:absolute before:top-1/2 before:left-1/2 before:size-[18px] before:-translate-1/2 hover:scale-125 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)] active:cursor-grabbing data-[dragging]:scale-125" />
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      {ends && (
        <span className="flex justify-between text-[0.6875rem] text-muted-foreground">
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
}: {
  value: T
  options: { value: T; label: React.ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn(BOX, "flex items-stretch gap-0.5 p-0.5 focus-within:border-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)]")}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[3px] px-2 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-1 focus-visible:outline-[color:var(--ring)]",
            o.value === value && "bg-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const normHex = (v: string) => {
  const h = v.replace("#", "").toLowerCase()
  return `#${h.length === 3 ? [...h].map((c) => c + c).join("") : h}`
}

/**
 * Any colour, the toolcraft way: a swatch (opens the system picker) and the
 * hex code in mono, typed or pasted. Bad codes snap back on leaving the field.
 */
export function ColorField({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = (v: string) => {
    if (HEX.test(v.trim())) onChange(normHex(v.trim()))
    setDraft(null)
  }
  return (
    <div className={cn(BOX, "flex items-center gap-2 pr-2 pl-1")}>
      <label className="relative size-5 shrink-0 cursor-pointer rounded-[3px] ring-1 ring-[color:color-mix(in_oklab,var(--foreground)_16%,transparent)] ring-inset" style={{ background: value }} title="Pick any colour">
        <input type="color" value={normHex(value)} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Pick ${label.toLowerCase()}`} />
      </label>
      <input
        value={draft ?? value.toUpperCase()}
        onChange={(e) => {
          setDraft(e.target.value)
          if (HEX.test(e.target.value.trim()) && e.target.value.replace("#", "").length === 6) onChange(normHex(e.target.value.trim()))
        }}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value)
          if (e.key === "Escape") setDraft(null)
        }}
        spellCheck={false}
        aria-label={`${label} hex code`}
        className="min-w-0 flex-1 bg-transparent font-[family-name:var(--ff-plex-mono)] text-xs tracking-wide uppercase outline-none"
      />
    </div>
  )
}

/** Colour presets as round chips (the selected one ringed), with the exact colour as a hex field under them. */
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
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c) => {
          const on = c.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                "size-5 rounded-full ring-1 ring-[color:color-mix(in_oklab,var(--foreground)_14%,transparent)] ring-inset transition-transform outline-none hover:scale-110 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)]",
                on && "scale-110 outline-2 outline-offset-2 outline-foreground hover:scale-110",
              )}
              style={{ background: c }}
            />
          )
        })}
      </div>
      <ColorField value={value} onChange={onChange} label={label} />
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
