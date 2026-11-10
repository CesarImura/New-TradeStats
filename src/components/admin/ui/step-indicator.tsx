import { Check } from "@/components/icons"
import { cn } from "@/lib/utils"

type State = "done" | "current" | "upcoming" | "warning" | "error" | "success"

const styles: Record<State, string> = {
  done: "bg-[var(--admin-color-control-on)] text-a-on-accent",
  current: "bg-a-accent-strong text-a-on-accent",
  upcoming: "bg-a-raised text-a-text-2",
  warning: "bg-[var(--admin-component-step-indicator-warning-bg)] text-[var(--admin-component-step-indicator-warning-content)]",
  error: "bg-[var(--admin-component-step-indicator-error-bg)] text-[var(--admin-component-step-indicator-error-content)]",
  success: "bg-[var(--admin-component-step-indicator-success-bg)] text-[var(--admin-component-step-indicator-success-content)]",
}

/** Admin / Step indicator (Figma): 20px circle, a check when Done, otherwise the step number (or children). */
export function StepIndicator({ state, children, className }: { state: State; children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full t-caption-medium", styles[state], className)}>
      {state === "done" || state === "success" ? <Check className="size-3" aria-hidden /> : children}
    </span>
  )
}
