"use client"

import { useLayoutEffect, useRef, useState } from "react"
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
 * True while the block is about one row tall (under 100px; one row is 56px,
 * two are 128px). Measured, not passed in, so it follows resizing in the
 * builder. On phones the block is as tall as its content: a title without an
 * intro is short there too (a 24px title suits a phone), one with an intro
 * stays full. Either way it settles: the compact form is shorter, never taller.
 */
function useShort() {
  const ref = useRef<HTMLDivElement>(null)
  const [short, setShort] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setShort(el.clientHeight > 0 && el.clientHeight < 100)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, short] as const
}

/**
 * Page title: the title block of a page as its own widget, so the coach can
 * move it, size it, rename it and give it an intro. Layouts: plain (left,
 * large), centred, and banner (on the course artwork). The page's own tool
 * leaves its built-in title out while this widget is on the page.
 *
 * One row tall (the default), it turns compact so nothing is cut off: the
 * small label and a one-line 24px title; the intro shows from two rows up.
 */
export function PageHeader({ variant = "plain", props }: WidgetProps) {
  const { coach } = useCoach()
  const page = usePageId()
  const [ref, short] = useShort()
  const d = defaults(page, coach)
  const title = (props.title as string) || d.title
  const eyebrow = props.eyebrow === undefined ? d.eyebrow : (props.eyebrow as string)
  const text = props.text as string | undefined
  const banner = variant === "banner"
  const words = short ? (
    <>
      {/* On the banner's one-row strip there's only room for the title. */}
      {eyebrow && !banner && <span className="eyebrow block truncate leading-4">{eyebrow}</span>}
      <h1 className="max-w-full truncate text-2xl leading-8">{title}</h1>
    </>
  ) : (
    <>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="text-3xl leading-tight text-balance md:text-4xl">{title}</h1>
      {text && <p className="max-w-[60ch] text-pretty text-muted-foreground">{text}</p>}
    </>
  )
  if (banner)
    return (
      // The box carries the cover's colour too, so the colour behind the words is real (the artwork only adds the candles).
      <div
        ref={ref}
        className="relative flex h-full min-h-0 overflow-hidden rounded-(--radius)"
        style={{ boxShadow: "var(--card-shadow)", background: "var(--cover-bg, color-mix(in oklab, var(--primary) 10%, color-mix(in oklab, var(--foreground) 88%, var(--background))))" }}
      >
        <Cover className="absolute inset-0 rounded-none" />
        <div
          className={cn(
            "relative flex min-w-0 flex-col justify-end gap-1 text-[color:var(--background)] [--muted-foreground:color-mix(in_oklab,var(--background)_78%,transparent)]",
            short ? "justify-center px-[calc(1.25rem*var(--density,1))] py-2" : "p-[calc(1.25rem*var(--density,1))]",
          )}
        >
          {words}
        </div>
      </div>
    )
  // Text starts at the top, like a page heading: the rows it doesn't fill become space before the content, not above the title.
  return (
    <div ref={ref} className={cn("flex h-full min-h-0 min-w-0 flex-col justify-start", short ? "gap-0.5" : "gap-1", variant === "centered" && "items-center text-center")}>
      {words}
    </div>
  )
}
