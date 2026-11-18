"use client"

import { MoreHorizontal } from "@/components/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table } from "../ui/table"
import { cn } from "@/lib/utils"
import { AdminButton } from "../ui"

export function SettingsPage({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <h2 className="t-heading-m text-a-text">{title}</h2>
        <p className="t-body-m text-a-text-2">{text}</p>
      </header>
      {children}
    </div>
  )
}

/** Table inside a bordered panel surface (Figma "Table"). */
export function DataCard({ children, className, rowHeight, scrollLabel }: { children: React.ReactNode; className?: string; /** Names the sideways-scrolling table so the keyboard can reach it. */ scrollLabel?: string; /** Rows that hold one line are 53 high in Figma (the table standard is 61 for two lines). */ rowHeight?: 45 | 53 }) {
  return (
    <div className={cn("overflow-hidden rounded-a-lg border border-a-border bg-a-panel", rowHeight === 53 && "[&_td]:h-[53px]", rowHeight === 45 && "[&_td]:h-[45px]", className)}>
      <div className="overflow-x-auto">
        <Table scrollLabel={scrollLabel}>{children}</Table>
      </div>
    </div>
  )
}

/** Choice shown as equal buttons; the chosen one has an orange border (Figma "Segmented"). */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "h-8 rounded-a-md border t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus",
            value === id ? "border-a-border-active bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover hover:text-a-text"
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

/** A field with something fixed before or after what you type: "https://", ".traderhub.io", a button. One 44px control. */
export function Affix({ before, after, children }: { before?: React.ReactNode; after?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-11 items-stretch overflow-hidden rounded-a-md border border-a-border-subtle bg-a-field transition-colors duration-300 focus-within:border-a-border-focus hover:border-a-border-strong">
      {before && <span className="flex items-center border-r border-a-border-subtle px-3 t-body-m text-a-text-2">{before}</span>}
      {children}
      {after}
    </div>
  )
}
export const bareInput = "min-w-0 flex-1 bg-transparent px-3 t-body-l text-a-text outline-none placeholder:text-a-text-3"

export const RowMenu = ({ label, items }: { label: string; items: { text: string; onClick: () => void }[] }) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={label} />}>
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {items.map((it) => (
        <DropdownMenuItem key={it.text} onClick={it.onClick}>
          {it.text}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

export const handleOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

