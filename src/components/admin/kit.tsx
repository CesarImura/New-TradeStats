"use client"

import { PlayCircle } from "@/components/icons"
import { toast } from "sonner"
import { setStored, useStored } from "@/lib/prototype-store"
import { cn } from "@/lib/utils"

/** Title row of an admin page: title, one plain sentence, the page's actions, and its video guide. */
export function PageHeader({ title, text, actions, guide }: { title: string; text?: React.ReactNode; actions?: React.ReactNode; guide?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="text-[1.75rem] leading-9 font-semibold tracking-[-0.02em]">{title}</h1>
        {text && <p className="max-w-2xl text-sm text-muted-foreground">{text}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {guide && (
          <button
            onClick={() => toast(`Video guide · ${guide}`, { description: "Plays here in the real product. It ends with the offer to let us set it up." })}
            className="flex h-7 items-center gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <PlayCircle className="size-3.5" /> {guide}
          </button>
        )}
        {actions}
      </div>
    </div>
  )
}

/** The admin's page column. */
export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn("mx-auto flex w-full flex-col gap-6", wide ? "max-w-[1400px]" : "max-w-[1200px]")}>{children}</div>
}

/** A native select in the admin style. Simple, keyboard-friendly, works in dialogs. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(
        "h-7 min-w-0 rounded-[4px] border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover",
        className,
      )}
    />
  )
}

/** One setting: label and help text on the left, the control on the right. */
export function SettingRow({ label, text, children, className }: { label: React.ReactNode; text?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 py-2.5", className)}>
      <div className="grid min-w-0 flex-1 basis-64 gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {text && <span className="text-xs text-muted-foreground">{text}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

/** Label above a control. */
export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1", className)}>
      <span className="flex items-baseline justify-between gap-3 text-xs font-medium text-muted-foreground">
        {label}
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Empty({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center">
      <Icon className="size-7 text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Small mono label in our own TradeStats style. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-[family-name:var(--coach-font-label)] text-[0.6875rem] tracking-[0.06em] uppercase", className)}>{children}</span>
}

export function HealthDot({ health, className }: { health: "red" | "amber" | "green"; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", health === "red" ? "bg-red-500" : health === "amber" ? "bg-amber-400" : "bg-emerald-500", className)} />
}

/**
 * Prototype data for one community, kept in the browser. `fallback` must be a
 * stable value (a module constant).
 */
export function useCommunityData<T>(slug: string, key: string, fallback: T): [T, (next: T | ((c: T) => T)) => void] {
  const value = useStored<T>(`${slug}:${key}`, fallback)
  return [value, (next) => setStored<T>(`${slug}:${key}`, next, fallback)]
}
