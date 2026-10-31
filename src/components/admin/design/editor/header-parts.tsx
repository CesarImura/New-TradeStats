"use client"

import { Switch } from "@/components/ui/switch"
import type { WidgetHeader } from "@/lib/theme/types"

const PARTS: { key: keyof WidgetHeader; label: string; hint: string }[] = [
  { key: "icon", label: "Icon", hint: "The small icon before the title" },
  { key: "title", label: "Title", hint: "The widget's name" },
  { key: "description", label: "Description", hint: "The grey line under the title" },
  { key: "value", label: "Value chip", hint: "The figure on the right, like “58% win”" },
]

/**
 * The four parts of a widget's header as switches, for one widget (its settings panel in Pages).
 * `own`: the parts this widget sets itself; each says so, the rest follow Widgets → Header.
 */
export function HeaderParts({ value, own, onChange, idPrefix }: { value: WidgetHeader; own?: Partial<WidgetHeader>; onChange: (key: keyof WidgetHeader, on: boolean) => void; idPrefix: string }) {
  return (
    <div className="grid gap-2.5">
      {PARTS.map((p) => (
        <label key={p.key} htmlFor={`${idPrefix}-${p.key}`} className="flex cursor-pointer items-center justify-between gap-3">
          <span className="grid min-w-0">
            <span className="flex items-center gap-1.5 text-sm">
              {p.label}
              {own?.[p.key] !== undefined && <span className="rounded-[3px] bg-[#ff5500]/15 px-1 text-[0.65rem] leading-4 text-[#ff8a4c]">only this widget</span>}
            </span>
            <span className="truncate text-xs text-muted-foreground">{p.hint}</span>
          </span>
          <Switch id={`${idPrefix}-${p.key}`} checked={value[p.key]} onCheckedChange={(on) => onChange(p.key, on)} />
        </label>
      ))}
    </div>
  )
}
