"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Check, Eye, MessagesSquare, PlayCircle, X } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { setPreviewAs, usePreviewAs } from "@/lib/data/access"
import { resumeLesson, studentCourses, useCatalog, useProgress } from "@/lib/data/learning"
import { EVENTS } from "@/lib/data/sample"
import { FIRST_WEEK, saveStudentStart, useOnboardingSettings, useStudentStart, type FirstWeekItem } from "@/lib/data/student-start"
import { cn } from "@/lib/utils"

// ---------- ADM-15 Preview as: the banner on the student side

export function PreviewAsBanner() {
  const { coach, preview } = useCoach()
  const as = usePreviewAs(coach.slug)
  if (!as || preview) return null
  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-foreground px-4 py-2 text-sm text-background">
      <Eye className="size-4" />
      <span>
        Previewing as <b>{as.label}</b>. Only you see this.
      </span>
      <button onClick={() => setPreviewAs(coach.slug, null)} className="underline underline-offset-4 opacity-80 hover:opacity-100">
        Stop preview
      </button>
      <Link href={`/admin/${coach.slug}/sales?tab=access`} className="underline underline-offset-4 opacity-80 hover:opacity-100">
        Back to Access
      </Link>
    </div>
  )
}

// ---------- STO-04 Short tour: three tips over the menu

const TOUR = [
  { id: "courses", title: (w: string) => `${w} are here`, text: "Every lesson, with your progress. Start with the first one; it takes ten minutes." },
  { id: "calendar", title: (w: string) => `${w}: lives and calls`, text: "Live sessions, Q&A calls and 1:1s in your time zone. Sign up and you get a reminder." },
  { id: "community", title: (w: string) => `${w}`, text: "Say hi, ask questions, share your trades. The group answers fast." },
] as const

export function Tour() {
  const { coach } = useCoach()
  const state = useStudentStart(coach.slug)
  const steps = TOUR.filter((s) => coach.modules[s.id])
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[i]
  const on = state.tour && !!step
  const finish = () => saveStudentStart(coach.slug, (s) => ({ ...s, tour: false }))

  useLayoutEffect(() => {
    if (!on) return
    const find = () => {
      // The first visible menu item for this step: side menu, top menu or the phone's bottom bar.
      const el = [...document.querySelectorAll<HTMLElement>(`[data-tour="${step.id}"]`)].find((e) => e.getClientRects().length > 0 && e.offsetParent !== null)
      setRect(el?.getBoundingClientRect() ?? null)
    }
    find()
    window.addEventListener("resize", find)
    return () => window.removeEventListener("resize", find)
  }, [on, step?.id])

  useEffect(() => {
    if (!on) return
    const esc = (e: KeyboardEvent) => e.key === "Escape" && finish()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  })

  if (!on) return null
  const last = i === steps.length - 1

  // Place the tip beside the item: right of a side menu, below a top menu, above the phone bar.
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth
  const vh = typeof window === "undefined" ? 800 : window.innerHeight
  const W = 300
  let style: React.CSSProperties = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
  if (rect) {
    if (rect.top > vh - 120) style = { left: Math.min(Math.max(12, rect.left + rect.width / 2 - W / 2), vw - W - 12), bottom: vh - rect.top + 12 }
    else if (rect.left < 300 && rect.width < 300) style = { left: rect.right + 14, top: Math.max(12, rect.top + rect.height / 2 - 60) }
    else style = { left: Math.min(Math.max(12, rect.left + rect.width / 2 - W / 2), vw - W - 12), top: rect.bottom + 12 }
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Short tour">
      <div className={cn("absolute inset-0", !rect && "bg-black/45")} onClick={finish} />
      {rect && (
        // The menu item stays lit; everything else dims.
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[min(var(--radius),10px)] border-2 border-primary"
          style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8, boxShadow: "0 0 0 9999px rgba(0,0,0,.5)" }}
        />
      )}
      <div className="absolute grid gap-3 rounded-(--radius) bg-popover p-4 text-popover-foreground shadow-xl" style={{ ...style, width: W }}>
        <div className="flex items-start justify-between gap-3">
          <span className="eyebrow">
            Tip {i + 1} of {steps.length}
          </span>
          <button onClick={finish} aria-label="Close the tour" className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <h2 className="text-lg leading-tight">{step.title(coach.wording[step.id])}</h2>
        <p className="text-sm text-muted-foreground">{step.text}</p>
        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">
            Skip tour
          </button>
          <Button size="sm" onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------- STU-01 Start here card and first-week checklist

export function StartHere() {
  const { coach, base } = useCoach()
  const state = useStudentStart(coach.slug)
  const settings = useOnboardingSettings(coach.slug)
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  if (state.stage !== "new" || state.dismissed) return null

  const course = studentCourses(catalog)[0]
  const lesson = course ? resumeLesson(course, progress) : null
  const live = EVENTS.find((e) => e.kind === "live")
  const items = settings.firstWeek.filter((id) => {
    const m = FIRST_WEEK[id].module
    return !m || coach.modules[m]
  })
  const done = items.filter((id) => state.done.includes(id)).length
  const toggle = (id: FirstWeekItem) => saveStudentStart(coach.slug, (s) => ({ ...s, done: s.done.includes(id) ? s.done.filter((x) => x !== id) : [...s.done, id] }))
  const href: Partial<Record<FirstWeekItem, string>> = {
    lesson: course && lesson ? `${base}/courses/${course.id}/${lesson.lesson.id}` : `${base}/courses`,
    live: `${base}/calendar`,
    intro: `${base}/community`,
    trade: `${base}/journal`,
    picture: `${base}/profile`,
    discord: `${base}/profile?tab=connections`,
    call: `${base}/calendar`,
  }

  const cards = [
    settings.startHere &&
      coach.modules.courses &&
      course && { icon: PlayCircle, eyebrow: `First ${coach.wording.lesson.toLowerCase()}`, title: lesson?.lesson.title ?? course.title, text: `${course.title} · ${lesson?.lesson.minutes ?? 10} min`, href: href.lesson!, cta: "Start" },
    settings.startHere && coach.modules.calendar && live && { icon: CalendarDays, eyebrow: "Next live session", title: live.title, text: `${live.day} ${live.date} · ${live.time}`, href: href.live!, cta: "Sign up" },
    settings.startHere && coach.modules.community && { icon: MessagesSquare, eyebrow: coach.wording.community, title: "Introduce yourself", text: "Markets, goal and time zone, in two lines", href: href.intro!, cta: "Say hi" },
  ].filter(Boolean) as { icon: typeof PlayCircle; eyebrow: string; title: string; text: string; href: string; cta: string }[]

  if (!cards.length && !items.length) return null

  return (
    <section className="grid gap-[var(--page-gap,1.5rem)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Start here">
      {cards.length > 0 && (
        <div className="grid content-start gap-3 rounded-(--radius) bg-card p-[calc(1.25rem*var(--density,1))] text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-0.5">
              <span className="eyebrow">Start here</span>
              <h2 className="text-xl leading-tight">Three things for your first day</h2>
            </div>
            <button
              onClick={() => saveStudentStart(coach.slug, (s) => ({ ...s, dismissed: true }))}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Hide
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map((c) => (
              <Link key={c.eyebrow} href={c.href} className="group grid content-between gap-3 rounded-(--radius) border p-3.5 transition-colors hover:border-primary/60">
                <div className="grid gap-1">
                  <c.icon className="mb-1 size-5 text-primary" />
                  <span className="text-xs text-muted-foreground">{c.eyebrow}</span>
                  <span className="leading-snug font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.text}</span>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  {c.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {items.length > 0 && (
        <div className="grid content-start gap-3 rounded-(--radius) bg-card p-[calc(1.25rem*var(--density,1))] text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-baseline justify-between gap-3">
            <div className="grid gap-0.5">
              <span className="eyebrow">Your first week</span>
              <h2 className="text-xl leading-tight">
                {done} of {items.length} done
              </h2>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">{Math.round((done / items.length) * 100)}%</span>
          </div>
          <Progress value={(done / items.length) * 100} className="h-1.5" />
          <ul className="grid">
            {items.map((id) => {
              const isDone = state.done.includes(id)
              return (
                <li key={id} className="flex items-center gap-3 py-1.5">
                  <button
                    onClick={() => toggle(id)}
                    aria-pressed={isDone}
                    aria-label={`${FIRST_WEEK[id].label}: ${isDone ? "done" : "not done"}`}
                    className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", isDone ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary")}
                  >
                    {isDone && <Check className="size-3" strokeWidth={3} />}
                  </button>
                  <Link href={href[id] ?? base} className={cn("min-w-0 flex-1 truncate text-sm hover:underline", isDone && "text-muted-foreground line-through")}>
                    {FIRST_WEEK[id].label}
                  </Link>
                </li>
              )
            })}
          </ul>
          {done === items.length && (
            <Button size="sm" variant="outline" onClick={() => saveStudentStart(coach.slug, (s) => ({ ...s, stage: "done", dismissed: true }))}>
              All done, hide this
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
