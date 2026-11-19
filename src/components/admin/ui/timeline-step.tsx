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
 * Locked (19/11, steps are done in order) = dashed lock marker, no fill, muted text and the action disabled at 40 % with the reason as a hint (Go live looks the same);
 * Done = green edge and a 4 % green tint; Current = default edge and a grey numbered marker, its weight is the primary action;
 * Skipped (state "open") = dashed marker and a "Skipped" tag, still reachable but not done; Upcoming = Go live until all five are done.
 * The rail is solid green up to the last done step and dashed after it.
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
  prevDone,
  disabledHint,
  guide,
  tag,
  icon: Icon,
}: {
  step: number
  state: "done" | "current" | "open" | "locked" | "upcoming"
  title: string
  description: string
  action?: string
  onAction?: () => void
  onEdit?: () => void
  /** Current step only: shows "Skip for now" before the action. */
  onSkip?: () => void
  first?: boolean
  last?: boolean
  /** The step above is done: the line coming into this one is green. */
  prevDone?: boolean
  /** Shown on hover over a Locked or Upcoming action (why it can't be clicked yet). */
  disabledHint?: string
  /** Done step only (Figma Show Guide): an extra, optional way in, before the edit icon ("Tour the design editor"). */
  guide?: { label: string; onClick: () => void }
  /** A neutral tag after the title ("Skipped": an item put off with Skip for now). */
  tag?: string
  /** Figma Show Icon / Icon: a 20 px icon before the title (palette, store, course, wallet, legal, rocket). */
  icon?: React.ComponentType<{ className?: string }>
}) {
  // The rail (Gustavo's Figma, 19/11): solid green up to the last done step, dashed 4 / 4 after it.
  const line = "w-0.5 flex-1 transition-colors duration-300 ease-out"
  // Only the end next to the marker is rounded (Figma 1753:107765); where two segments meet the line is straight and continuous.
  const solidTop = "rounded-b-full bg-a-success-fill"
  const solidBottom = "rounded-t-full bg-a-success-fill"
  const dashed = "bg-[repeating-linear-gradient(to_bottom,var(--admin-color-border-default)_0_4px,transparent_4px_8px)]"
  const muted = state === "locked" || state === "upcoming"
  return (
    <li className="flex gap-4">
      <div aria-hidden className="flex flex-col items-center gap-1.5">
        <span className={cn(line, first ? "bg-transparent" : prevDone ? solidTop : dashed)} />
        <StepIndicator step={step} state={state === "done" ? "success" : state === "open" ? "skipped" : state === "current" ? "upcoming" : "locked"} />
        <span className={cn(line, last ? "bg-transparent" : state === "done" ? solidBottom : dashed)} />
      </div>
      <div className="min-w-0 flex-1 py-1.5">
        <div className={cn("flex items-center gap-4 rounded-a-lg border py-4 pr-4 pl-5 transition-[background-color,border-color,color] duration-300 ease-out max-sm:flex-wrap max-sm:gap-3", state === "done" ? "border-[var(--admin-component-timeline-step-border-done)] bg-a-panel bg-[image:linear-gradient(var(--admin-component-timeline-step-bg-done),var(--admin-component-timeline-step-bg-done))]" : state === "current" ? "border-a-border bg-a-panel" : state === "open" ? "border-a-border-subtle bg-a-panel" : "border-a-border-subtle")}>
          {Icon && <Icon aria-hidden className={cn("size-5 shrink-0 max-sm:hidden", muted ? "text-a-text-3" : state === "done" ? "text-a-success" : "text-a-text")} />}
          <div className="flex min-w-0 flex-1 flex-col gap-1 max-sm:basis-full">
            <h2 className={cn("t-body-l transition-colors duration-300 ease-out", muted ? "text-a-text-2" : "text-a-text")}>
              <span className="sr-only">{state === "done" ? "Done: " : state === "current" ? "Next: " : state === "locked" ? "Locked: " : ""}</span>
              {title}
              {tag && (
                <>
                  {/* Read as "Create a tier, Skipped", not "Create a tierSkipped". */}
                  <span className="sr-only">, </span>
                  <Tag className="ml-2 align-middle">{tag}</Tag>
                </>
              )}
            </h2>
            <p className={cn("t-body-m transition-colors duration-300 ease-out", muted ? "text-a-text-3" : "text-a-text-2")}>{description}</p>
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
                <span className="flex shrink-0 items-center gap-2 max-sm:max-w-full max-sm:flex-wrap max-sm:justify-end" title={muted ? disabledHint : undefined}>
                  {state === "current" && onSkip && (
                    <AdminButton hierarchy="text" onClick={onSkip}>
                      Skip for now
                    </AdminButton>
                  )}
                  <AdminButton hierarchy={state === "current" ? "primary" : "secondary"} disabled={muted} onClick={onAction} className="w-[152px]">
                    {action}
                  </AdminButton>
                </span>
              )}
        </div>
      </div>
    </li>
  )
}
