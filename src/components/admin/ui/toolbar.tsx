"use client"

import { Search } from "@/components/icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"

/** Toolbar row of the Admin screens (Figma "Toolbar"): tabs on the left, search, filters and view toggle on the right, 8px apart. */
export function AdminToolbar({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="admin-toolbar" className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
}

/** Admin / Field with a search icon and an optional trailing hint ("⌘K"): 32px, field fill, 1px border, radius md. */
export function AdminSearch({ value, onChange, placeholder, label, hint, className }: { value: string; onChange: (v: string) => void; placeholder: string; label?: string; hint?: string; className?: string }) {
  return (
    <label className={cn("relative flex h-8 w-60 max-w-full shrink-0 items-center gap-2 rounded-a-md border border-a-border bg-a-field px-3 transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong", className)}>
      <Search className="size-4 shrink-0 text-a-icon" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="min-w-0 flex-1 bg-transparent t-body-m text-a-text outline-none placeholder:text-a-text-3"
      />
      {hint && (
        <span aria-hidden className="t-caption text-a-text-3">
          {hint}
        </span>
      )}
    </label>
  )
}

/** Admin / Filter: a 32px bordered select, "Label | value ⌄". `label` is optional ("All tiers" alone is fine). */
export function AdminFilter({ label, value, onValueChange, options, ariaLabel, className }: { label?: string; value: string; onValueChange: (v: string) => void; options: readonly { value: string; label: string }[]; ariaLabel?: string; className?: string }) {
  return (
    <Select items={options as { value: string; label: string }[]} value={value} onValueChange={(v) => v != null && onValueChange(String(v))}>
      <SelectTrigger
        aria-label={ariaLabel ?? label}
        className={cn("h-8! shrink-0 gap-2 rounded-a-md! border-a-border! bg-transparent! pr-2.5 pl-3 t-caption text-a-text hover:bg-a-hover!", className)}
      >
        {label && (
          <>
            <span className="text-a-text-2">{label}</span>
            <span aria-hidden className="h-3.5 w-px bg-a-border" />
          </>
        )}
        <SelectValue className="flex-none" />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Grid / list switch (Figma Content toolbar): two square icon buttons, the open one framed. */
export function AdminViewToggle<T extends string>({ value, onChange, label = "View" }: { value: T; onChange: (v: T) => void; label?: string }) {
  const items = [
    { id: "grid", name: "Grid", icon: <path d="M3 3h4.5v4.5H3zM8.5 3H13v4.5H8.5zM3 8.5h4.5V13H3zM8.5 8.5H13V13H8.5z" /> },
    { id: "list", name: "List", icon: <path d="M2.5 4h1M5.5 4h8M2.5 8h1M5.5 8h8M2.5 12h1M5.5 12h8" /> },
  ] as const
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {items.map((it) => (
        <AdminButton key={it.id} type="button" hierarchy={value === it.id ? "secondary" : "ghost"} size="lg" iconOnly aria-label={it.name} aria-pressed={value === it.id} onClick={() => onChange(it.id as T)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {it.icon}
          </svg>
        </AdminButton>
      ))}
    </div>
  )
}
