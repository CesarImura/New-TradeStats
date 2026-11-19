"use client"

import { cn } from "@/lib/utils"
import { SlideTrack } from "@/components/admin/ui/slide-thumb"

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
      className={cn("inline-flex h-9 shrink-0 items-center rounded-a-md border border-a-border p-0.5", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return
        e.preventDefault()
        const i = options.findIndex((o) => o.value === value)
        const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        ;(e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
      }}
    >
      <SlideTrack
        items={options.map((o) => ({ key: o.value, ...o }))}
        activeKey={value}
        rowClass="flex items-center gap-0.5"
        thumbClass="rounded-a-sm bg-a-panel"
        renderItem={(o, layer, s) => {
          const item = "inline-flex h-[30px] items-center rounded-a-sm px-3 t-body-m pointer-coarse:h-10"
          if (layer === "base") return <span data-slide={o.value} aria-hidden className={cn(item, "transition-colors duration-150", s.pre ? "bg-a-panel text-a-text" : s.hovered ? "text-a-text" : "text-a-text-2")}>{o.label}</span>
          if (layer === "copy") return <span className={cn(item, "text-a-text")}>{o.label}</span>
          return (
            <button type="button" role="radio" data-value={o.value} aria-checked={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)} {...s.hover} className={cn(item, "text-transparent outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus")}>
              {o.label}
            </button>
          )
        }}
      />
    </div>
  )
}

/**
 * Admin / Selection card (Figma _Base Selection card, Gustavo 19/11): the picture, the title with its radio, a line.
 * Default = no fill, dark edge, dark radio ring. Hover = 4 % fill, white 36 % edge, brighter ring. Active = 4 % fill, orange edge
 * (#cf4500) and a filled orange radio (#ff5500). Colour, edge and press (scale 0.98) answer in 200 ms; the press in 100.
 */
export function SelectionCard({ checked, onSelect, title, description, img, media, radius = "rounded-a-md", imgClass = "aspect-[276/188]", className, "data-field": dataField }: { checked: boolean; onSelect: () => void; title: string; description?: string; img?: string; /** Instead of a picture: a drawn one (the Type specimen, the Background scene). */ media?: React.ReactNode; radius?: string; "data-field"?: string; /** The picture keeps its own proportion (never cropped at any card width). */ imgClass?: string; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      data-field={dataField}
      className={cn(
        "group flex min-w-0 flex-col gap-2 self-stretch rounded-a-lg border p-2 text-left outline-none transition-[background-color,border-color,scale] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-a-border-focus active:scale-[0.98] active:duration-100",
        checked
          ? "border-[var(--admin-component-selection-card-border-active)] bg-[var(--admin-component-selection-card-bg-hover)]"
          : "border-[var(--admin-component-selection-card-border-default)] hover:border-[var(--admin-component-selection-card-border-hover)] hover:bg-[var(--admin-component-selection-card-bg-hover)]",
        className,
      )}
    >
      {media ?? (
        // eslint-disable-next-line @next/next/no-img-element -- static thumbnail exported from Figma
        <img src={img} alt="" className={cn("w-full border border-a-border-subtle object-cover object-left-top", imgClass, radius)} />
      )}
      <span className="flex min-w-0 flex-col gap-0.5 px-1">
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate t-body-m-medium text-a-text">{title}</span>
        <span
          aria-hidden
          className={cn(
            "grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-200 ease-out",
            checked ? "border-[var(--admin-component-selection-card-radio-active)]" : "border-[var(--admin-component-selection-card-radio-default)] group-hover:border-[var(--admin-component-selection-card-radio-hover)]",
          )}
        >
          <span className={cn("size-2 rounded-full bg-[var(--admin-component-selection-card-radio-active)] transition-transform duration-200 ease-out motion-reduce:transition-none", checked ? "scale-100" : "scale-0")} />
        </span>
      </span>
      {description && <span className="t-body-m text-balance text-a-text-2">{description}</span>}
      </span>
    </button>
  )
}
