import { Check, Lock } from "@/components/icons"
import { cn } from "@/lib/utils"

const STATE = {
  done: "bg-a-success-fill text-a-on-accent",
  current: "bg-a-accent text-a-on-highlight",
  upcoming: "border border-[var(--admin-component-step-indicator-upcoming-border)] bg-[var(--admin-component-step-indicator-upcoming-bg)] text-a-text",
  success: "bg-a-success-fill text-a-on-accent",
  warning: "bg-a-warning-fill text-a-on-highlight",
  error: "bg-a-danger-fill text-a-on-accent",
  locked: "border-[1.5px] border-dashed border-a-border text-a-icon-subtle",
  skipped: "border border-dashed border-a-border-strong text-a-text-2",
} as const

/** Admin / Step indicator (Figma 'Admin · Data display'): a 20px circle with a number, or a check when done or successful. */
export function StepIndicator({ step, state = "upcoming", className }: { step: number; state?: keyof typeof STATE; className?: string }) {
  return (
    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full transition-colors duration-300 ease-out t-micro-medium", STATE[state], className)}>
      {state === "done" || state === "success" ? <Check className="size-3" aria-label={state === "done" ? "Done" : "Success"} /> : state === "locked" ? <Lock className="size-3" aria-label="Locked" /> : state === "warning" || state === "error" ? "!" : step}
    </span>
  )
}
