import { cn } from "@/lib/utils"

/** Admin / Progress (Figma 'Admin · Data display'): 4px track, radius full; Default and Accent use the control colour, Success and Danger their fills. */
const FILL = { default: "bg-a-accent", accent: "bg-a-accent-strong", success: "bg-a-success-fill", danger: "bg-a-danger-fill" } as const
export function AdminProgress({ value, tone = "default", label, className, indeterminate }: { value: number; tone?: keyof typeof FILL; label?: string; className?: string; indeterminate?: boolean }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <span role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={indeterminate ? undefined : Math.round(v)} className={cn("block h-1 overflow-hidden rounded-full bg-a-track", className)}>
      <span className={cn("block h-full rounded-full transition-[width] duration-300 ease-out", FILL[tone], indeterminate && "animate-pulse")} style={{ width: indeterminate ? "100%" : `${v}%` }} />
    </span>
  )
}
