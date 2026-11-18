import { Pencil, PlayCircle } from "@/components/icons"
import { cn } from "@/lib/utils"
import { AdminButton } from "./button"
import { StepIndicator } from "./step-indicator"
import { Tag } from "./tag"

/**
 * Admin / Timeline step (Figma 957:2923): one step of a vertical timeline (Getting started). The rail holds the step
 * indicator between two 2 px lines; the card sits 6 px in from the top and bottom so the indicator lines up with the
 * card's middle. Done = green check and an edit icon; Current = white edge (white step marker with a dark number), the primary action and, with `onSkip`, a
 * "Skip for now" text button before it; Open (14/11) = a step you may start any time (panel card, secondary action);
 * Upcoming = muted text and the action disabled at 40 %, for what is still locked (Go live).
 */
export function TimelineStep({
  step,
  state,
  title,
  description,
  action,
  onAction,
  onEdit,
  onSkip,
  first,
  last,
  disabledHint,
  guide,
  tag,
  icon: Icon,
}: {
  step: number
  state: "done" | "current" | "open" | "upcoming"
  title: string
  description: string
  action?: string
  onAction?: () => void
  onEdit?: () => void
  /** Current step only: shows "Skip for now" before the action. */
  onSkip?: () => void
  first?: boolean
  last?: boolean
  /** Shown on hover over an Upcoming action (why it can't be clicked yet). */
  disabledHint?: string
  /** Done step only (Figma Show Guide): an extra, optional way in, before the edit icon ("Tour the design editor"). */
  guide?: { label: string; onClick: () => void }
  /** A neutral tag after the title ("Skipped": an item put off with Skip for now). */
  tag?: string
  /** Figma Show Icon / Icon: a 20 px icon before the title (palette, store, course, wallet, legal, rocket). */
  icon?: React.ComponentType<{ className?: string }>
}) {
  const line = "w-0.5 flex-1 rounded-full"
  return (
    <li className="flex gap-4">
      <div aria-hidden className="flex flex-col items-center gap-1.5">
        <span className={cn(line, first ? "bg-transparent" : "bg-a-border")} />
        <StepIndicator step={step} state={state === "done" ? "success" : state === "open" ? "upcoming" : state} />
        <span className={cn(line, last ? "bg-transparent" : "bg-a-border")} />
      </div>
      <div className="min-w-0 flex-1 py-1.5">
        <div className={cn("flex items-center gap-4 rounded-a-lg border py-4 pr-4 pl-5 max-sm:flex-wrap max-sm:gap-3", state === "current" ? "border-a-border-active bg-a-panel" : state === "done" || state === "open" ? "border-a-border-subtle bg-a-panel" : "border-a-border-subtle")}>
          {Icon && <Icon aria-hidden className={cn("size-5 shrink-0 max-sm:hidden", state === "upcoming" ? "text-a-text-3" : "text-a-text-2")} />}
          <div className="flex min-w-0 flex-1 flex-col gap-1 max-sm:basis-full">
            <h2 className={cn("t-body-l", state === "upcoming" ? "text-a-text-2" : "text-a-text")}>
              <span className="sr-only">{state === "done" ? "Done: " : state === "current" ? "Next: " : ""}</span>
              {title}
              {tag && (
                <>
                  {/* Read as "Create a tier, Skipped", not "Create a tierSkipped". */}
                  <span className="sr-only">, </span>
                  <Tag className="ml-2 align-middle">{tag}</Tag>
                </>
              )}
            </h2>
            <p className={cn("t-body-m", state === "upcoming" ? "text-a-text-3" : "text-a-text-2")}>{description}</p>
          </div>
          {state === "done"
            ? (guide || onEdit) && (
                <span className="flex shrink-0 items-center gap-2">
                  {guide && (
                    <AdminButton hierarchy="ghost" onClick={guide.onClick} className="text-a-text-2">
                      <PlayCircle /> {guide.label}
                    </AdminButton>
                  )}
                  {onEdit && (
                    <AdminButton hierarchy="ghost" iconOnly aria-label={`Edit ${title.toLowerCase()}`} title="Edit" onClick={onEdit} className="text-a-text-3">
                      <Pencil />
                    </AdminButton>
                  )}
                </span>
              )
            : action && (
                <span className="flex shrink-0 items-center gap-2" title={state === "upcoming" ? disabledHint : undefined}>
                  {state === "current" && onSkip && (
                    <AdminButton hierarchy="ghost" onClick={onSkip}>
                      Skip for now
                    </AdminButton>
                  )}
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
