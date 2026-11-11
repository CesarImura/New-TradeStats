import { Check } from "@/components/icons"
import { cn } from "@/lib/utils"

const STATE = {
  done: "bg-a-accent text-a-on-accent",
  current: "bg-a-accent-strong text-a-on-accent",
  upcoming: "bg-a-raised text-a-text-2",
  success: "bg-a-success-fill text-a-on-accent",
  warning: "bg-a-warning-fill text-a-on-highlight",
  error: "bg-a-danger-fill text-a-on-accent",
} as const

/** Admin / Step indicator (Figma 'Admin · Data display'): a 20px circle with a number, or a check when done or successful. */
export function StepIndicator({ step, state = "upcoming", className }: { step: number; state?: keyof typeof STATE; className?: string }) {
  return (
    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full t-micro-medium", STATE[state], className)}>
      {state === "done" || state === "success" ? <Check className="size-3" aria-label={state === "done" ? "Done" : "Success"} /> : state === "warning" || state === "error" ? "!" : step}
    </span>
  )
}
