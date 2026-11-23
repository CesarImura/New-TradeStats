"use client"

import { cn } from "@/lib/utils"
import { SlideTrack } from "./slide-thumb"

const ITEM = "relative inline-flex h-[26px] pointer-coarse:h-10 shrink-0 items-center gap-1.5 rounded-a-sm px-2.5 t-caption"

/**
 * Admin / Tab (580:459): caption text, soft pill when Active. Controlled; arrow keys move between tabs.
 * The pill is one thumb that slides to the chosen tab on a spring (see `SlideTrack`), carrying a copy of the labels in the active colour.
 */
export function AdminTabs<T extends string>({ tabs, value, onChange, label, className }: { tabs: readonly { id: T; label: string; count?: number | string; dot?: boolean }[]; value: T; onChange: (id: T) => void; label: string; className?: string }) {
  const current = tabs.some((x) => x.id === value) ? value : tabs[0]?.id
  return (
    <div role="tablist" aria-label={label} className={cn("flex max-w-full shrink-0 items-start overflow-x-auto rounded-a-md border border-a-border p-0.5 [scrollbar-width:none]", className)}
      onKeyDown={(e) => {
        if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return
        e.preventDefault()
        const i = Math.max(0, tabs.findIndex((t) => t.id === value))
        const next = e.key === "Home" ? tabs[0] : e.key === "End" ? tabs[tabs.length - 1] : tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]
        onChange(next.id)
        ;(e.currentTarget.querySelector(`[data-tab="${next.id}"]`) as HTMLElement | null)?.focus()
      }}>
      <SlideTrack
        items={tabs.map((t) => ({ key: t.id, ...t }))}
        activeKey={current}
        rowClass="flex items-start"
        wrapClass="shrink-0"
        thumbClass="rounded-a-sm bg-a-raised"
        renderItem={(t, layer, s) => {
          const body = (
            <>
              {t.dot && <span aria-hidden className="size-1.5 rounded-full bg-a-warning-fill" />}
              <span>{t.label}</span>
              {t.count !== undefined && <span className="text-a-text-3 tabular-nums">{t.count}</span>}
            </>
          )
          if (layer === "base") return <span data-slide={t.id} aria-hidden className={cn(ITEM, "transition-colors duration-150", s.pre ? "bg-a-raised text-a-text" : s.hovered ? "bg-a-hover text-a-text" : "text-a-text-2")}>{body}</span>
          if (layer === "copy") return <span className={cn(ITEM, "text-a-text")}>{body}</span>
          return (
            <button type="button" role="tab" data-tab={t.id} aria-selected={t.id === value} tabIndex={t.id === current ? 0 : -1} onClick={() => onChange(t.id)} {...s.hover}
              className={cn(ITEM, "text-transparent outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus [&>*]:invisible")}>
              {body}
            </button>
          )
        }}
      />
    </div>
  )
}
