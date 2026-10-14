"use client"

import { useCoach } from "@/components/coach/coach-provider"
import type { ModuleId } from "@/lib/data/coaches"
import { cn } from "@/lib/utils"
import { Cover, usePageId, type WidgetProps } from "./shared"

/** What a page's title block says before the coach writes their own. */
function defaults(page: string, coach: ReturnType<typeof useCoach>["coach"]) {
  const eyebrow: Record<string, string> = {
    courses: coach.name,
    calendar: "Times in your time zone · CET",
    charts: "Markets",
    journal: "Your trades",
    community: coach.name,
    ranking: "This month",
    ai: `Answers from ${coach.coachName}'s lessons`,
  }
  return { title: page === "home" ? coach.name : coach.wording[page as ModuleId], eyebrow: eyebrow[page] ?? coach.name }
}

/**
 * Page title: the title block of a page as its own widget, so the coach can
 * move it, size it, rename it and give it an intro. Layouts: plain (left,
 * large), centred, and banner (on the course artwork). The page's own tool
 * leaves its built-in title out while this widget is on the page.
 */
export function PageHeader({ variant = "plain", props }: WidgetProps) {
  const { coach } = useCoach()
  const page = usePageId()
  const d = defaults(page, coach)
  const title = (props.title as string) || d.title
  const eyebrow = props.eyebrow === undefined ? d.eyebrow : (props.eyebrow as string)
  const text = props.text as string | undefined
  const words = (
    <>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="text-3xl leading-tight text-balance md:text-4xl">{title}</h1>
      {text && <p className="max-w-[60ch] text-pretty text-muted-foreground">{text}</p>}
    </>
  )
  if (variant === "banner")
    return (
      <div className="relative flex h-full min-h-0 overflow-hidden rounded-(--radius)" style={{ boxShadow: "var(--card-shadow)" }}>
        <Cover className="absolute inset-0 rounded-none" />
        <div className="relative flex flex-col justify-end gap-1 p-[calc(1.25rem*var(--density,1))] text-[color:var(--background)] [--muted-foreground:color-mix(in_oklab,var(--background)_78%,transparent)]">
          {words}
        </div>
      </div>
    )
  // Text starts at the top, like a page heading: the rows it doesn't fill become space before the content, not above the title.
  return <div className={cn("flex h-full min-h-0 flex-col justify-start gap-1", variant === "centered" && "items-center text-center")}>{words}</div>
}
