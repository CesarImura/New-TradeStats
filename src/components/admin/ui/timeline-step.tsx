import { Pencil } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"
import { StepIndicator } from "./step-indicator"

/**
 * Admin / Timeline step (Figma 957:2923): one step of a vertical timeline (Getting started). The rail holds the step
 * indicator between two 2 px lines; the card sits 6 px in from the top and bottom so the indicator lines up with the
 * card's middle. Done = green check and an edit icon; Current = orange edge and the primary action; Upcoming = muted
 * text and the action disabled at 40 %. Steps unlock in order.
 */
export function TimelineStep({
  step,
  state,
  title,
  description,
  action,
  onAction,
  onEdit,
  first,
  last,
  disabledHint,
}: {
  step: number
  state: "done" | "current" | "upcoming"
  title: string
  description: string
  action?: string
  onAction?: () => void
  onEdit?: () => void
  first?: boolean
  last?: boolean
  /** Shown on hover over an Upcoming action (why it can't be clicked yet). */
  disabledHint?: string
}) {
  const line = "w-0.5 flex-1 rounded-full"
  return (
    <li className="flex gap-4">
      <div aria-hidden className="flex flex-col items-center gap-1.5">
        <span className={cn(line, first ? "bg-transparent" : "bg-a-border")} />
        <StepIndicator step={step} state={state === "done" ? "success" : state} />
        <span className={cn(line, last ? "bg-transparent" : "bg-a-border")} />
      </div>
      <div className="min-w-0 flex-1 py-1.5">
        <div className={cn("flex items-center gap-4 rounded-a-lg border py-4 pr-4 pl-5 max-sm:flex-wrap max-sm:gap-3", state === "current" ? "border-a-border-active bg-a-panel" : state === "done" ? "border-a-border-subtle bg-a-panel" : "border-a-border-subtle")}>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className={cn("t-body-l", state === "upcoming" ? "text-a-text-2" : "text-a-text")}>
              <span className="sr-only">{state === "done" ? "Done: " : state === "current" ? "Next: " : ""}</span>
              {title}
            </h3>
            <p className={cn("t-body-m", state === "upcoming" ? "text-a-text-3" : "text-a-text-2")}>{description}</p>
          </div>
          {state === "done"
            ? onEdit && (
                <AdminButton hierarchy="ghost" iconOnly aria-label={`Edit ${title.toLowerCase()}`} title="Edit" onClick={onEdit} className="text-a-text-3">
                  <Pencil />
                </AdminButton>
              )
            : action && (
                <span title={state === "upcoming" ? disabledHint : undefined}>
                  <AdminButton hierarchy={state === "current" ? "primary" : "secondary"} disabled={state === "upcoming"} onClick={onAction}>
                    {action}
                  </AdminButton>
                </span>
              )}
        </div>
      </div>
    </li>
  )
}
