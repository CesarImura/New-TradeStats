"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

/** Admin / Field control (Figma 'Admin · Forms'): 44px, radius md, field fill, subtle hairline; hover strong, focus orange, error red. */
export const adminControl = "w-full rounded-a-md border border-a-border-subtle bg-a-field px-3 t-body-l text-a-text outline-none placeholder:text-a-text-3 transition-colors duration-300 hover:border-a-border-strong focus-visible:border-a-border-focus disabled:pointer-events-none disabled:opacity-40 aria-[invalid=true]:border-a-border-danger"

type ControlProps = { id: string; "aria-invalid"?: true; "aria-describedby"?: string }

/**
 * Admin / Field: a label row (label, optional), the control, a hint or an error.
 * `children` is either the control itself (the field is then one <label>, so the label names it) or a function that
 * gets the ids to put on the control.
 */
export function AdminField({ label, optional, hint, error, className, children }: { label: string; optional?: boolean; hint?: React.ReactNode; error?: React.ReactNode; className?: string; children: React.ReactNode | ((p: ControlProps) => React.ReactNode) }) {
  const id = useId()
  const note = error ?? hint
  const head = (
    <span className="flex items-baseline gap-1.5 t-caption text-a-text">
      {label}
      {optional && <span className="text-a-text-3">Optional</span>}
      {typeof children !== "function" && hint && !error && <span className="ml-auto text-a-text-3">{hint}</span>}
    </span>
  )
  if (typeof children !== "function") {
    return (
      <label className={cn("grid gap-1.5", className)}>
        {head}
        {children}
        {error && <span className="t-caption text-a-danger">{error}</span>}
      </label>
    )
  }
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id}>{head}</label>
      {children({ id, ...(error ? { "aria-invalid": true as const } : {}), ...(note ? { "aria-describedby": `${id}-note` } : {}) })}
      {note && <span id={`${id}-note`} className={cn("t-caption", error ? "text-a-danger" : "text-a-text-3")}>{note}</span>}
    </div>
  )
}
