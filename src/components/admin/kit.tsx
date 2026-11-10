"use client"

import { useId } from "react"
import { PlayCircle } from "@/components/icons"
import { toast } from "sonner"
import { setStored, useStored } from "@/lib/prototype-store"
import { SelectOptions } from "@/components/kit/select-field"
import { ControlLabel } from "@/components/kit/control-label"
import { cn } from "@/lib/utils"
import { AdminPageHeader, EmptyState } from "@/components/admin/ui"

/** Title row of an admin page (Admin / Page header): title, one plain sentence, the page's actions, and its video guide. */
export function PageHeader({ title, text, actions, guide }: { title: string; text?: React.ReactNode; actions?: React.ReactNode; guide?: string }) {
  return (
    <AdminPageHeader
      title={title}
      subtitle={text}
      actions={
        (guide || actions) && (
          <>
            {guide && (
              <button
                onClick={() => toast(`Video guide · ${guide}`, { description: "Plays here in the real product. It ends with the offer to let us set it up." })}
                className="flex h-8 items-center gap-1.5 rounded-a-sm px-2 t-caption text-a-text-2 transition-colors duration-300 hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus focus-visible:outline-none"
              >
                <PlayCircle className="size-3.5" /> {guide}
              </button>
            )}
            {actions}
          </>
        )
      }
    />
  )
}

/** The admin's page column. */
/** Admin v2 content is 1200 px wide (Figma "Stack"), capped by the shell. */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">{children}</div>
}

/** The admin's dropdown: the app's own (ui/select), with a native select's props and <option>s. Works in dialogs. */
export function NativeSelect({ className, ...props }: React.ComponentProps<typeof SelectOptions>) {
  return <SelectOptions {...props} className={cn("h-7 rounded-[4px]", className)} />
}

/** One setting: label and help text on the left, the control on the right (a switch or checkbox there is named by the label). */
export function SettingRow({ label, text, children, className }: { label: React.ReactNode; text?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 py-2.5", className)}>
      <div className="grid min-w-0 flex-1 basis-64 gap-0.5">
        <span id={id} className="t-body-m-medium">
          {label}
        </span>
        {text && <span className="t-caption text-a-text-2">{text}</span>}
      </div>
      <ControlLabel value={id}>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </ControlLabel>
    </div>
  )
}

/** Label above a control. */
export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1", className)}>
      <span className="t-caption-medium flex items-baseline justify-between gap-3 text-a-text">
        {label}
        {hint && <span className="t-caption text-a-text-2">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Empty({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return <EmptyState icon={Icon} title={title} text={text} action={action} />
}

/** Small mono label in our own TradeStats style. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("t-mono-label", className)}>{children}</span>
}

export function HealthDot({ health, className }: { health: "red" | "amber" | "green"; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", health === "red" ? "bg-a-danger-fill" : health === "amber" ? "bg-a-warning-fill" : "bg-a-success-fill", className)} />
}

/**
 * Prototype data for one community, kept in the browser. `fallback` must be a
 * stable value (a module constant).
 */
export function useCommunityData<T>(slug: string, key: string, fallback: T): [T, (next: T | ((c: T) => T)) => void] {
  const value = useStored<T>(`${slug}:${key}`, fallback)
  return [value, (next) => setStored<T>(`${slug}:${key}`, next, fallback)]
}
