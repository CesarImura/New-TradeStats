"use client"

import { cn } from "@/lib/utils"

/**
 * Cards the setup wizard and the Design editor share (Figma Admin / Selection card, Admin / Segmented): one
 * component, so the editor's Theme, Layout, Type and Background cards look and behave like the setup's.
 */

/** Admin / Segmented (Figma: 36 px, padding 2, items 30 px; the active one on the panel fill). Radio semantics, arrows move. */
export function PillSegmented<T extends string>({ value, onChange, options, label, className, style }: { value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; label: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={style}
      className={cn("inline-flex h-9 shrink-0 items-center gap-0.5 rounded-a-md border border-a-border p-0.5", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cn("h-[30px] rounded-a-sm px-3 t-body-m outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-a-border-focus pointer-coarse:h-10", o.value === value ? "bg-a-panel text-a-text" : "text-a-text-2 hover:text-a-text")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Admin / Selection card (Figma _Base Selection card): the picture, the title with its radio, a line. Active = accent edge on the raised fill. */
export function SelectionCard({ checked, onSelect, title, description, img, media, radius = "rounded-a-md", imgClass = "h-[100px]", className, "data-field": dataField }: { checked: boolean; onSelect: () => void; title: string; description?: string; img?: string; /** Instead of a picture: a drawn one (the Type specimen, the Background scene). */ media?: React.ReactNode; radius?: string; "data-field"?: string; /** The picture's size: the setup uses 100 px high, the editor keeps the picture's own proportion. */ imgClass?: string; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      data-field={dataField}
      className={cn(
        "flex min-w-0 flex-col gap-1.5 self-stretch rounded-a-lg border p-2 text-left outline-none transition-[background-color,border-color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.99]",
        checked ? "border-a-border-active bg-a-raised" : "border-a-border hover:border-a-border-strong",
        className,
      )}
    >
      {media ?? (
        // eslint-disable-next-line @next/next/no-img-element -- static thumbnail exported from Figma
        <img src={img} alt="" className={cn("w-full border border-a-border-subtle object-cover object-left-top", imgClass, radius)} />
      )}
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate t-body-m-medium text-a-text">{title}</span>
        <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150", checked ? "border-[var(--admin-color-control-on)]" : "border-a-border-strong")}>
          <span className={cn("size-2 rounded-full bg-[var(--admin-color-control-on)] transition-transform duration-200 ease-out motion-reduce:transition-none", checked ? "scale-100" : "scale-0")} />
        </span>
      </span>
      {description && <span className="t-body-m text-balance text-a-text-2">{description}</span>}
    </button>
  )
}

