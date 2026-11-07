"use client"

import Link from "next/link"
import { useState } from "react"
import { Check, Lock, Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { fmtTime, gateBefore, useProgress, visibleLessons, type Course, type Lesson } from "@/lib/data/learning"
import { askAi } from "@/lib/data/ai"
import { cn } from "@/lib/utils"
import { seek } from "./lesson-utils"

// ---------- side

export function Outline({ course, current }: { course: Course; current: string }) {
  const { coach, base, preview } = useCoach()
  const q = preview ? "?preview=draft" : ""
  const progress = useProgress(coach.slug)
  return (
    <div className="overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="border-b px-4 py-3">
        <span className="eyebrow">In this course</span>
        <div className="font-heading">{course.title}</div>
      </div>
      <div className="max-h-[50svh] overflow-y-auto py-2">
        {course.modules.map((m) => {
          const lessons = visibleLessons(m)
          if (!lessons.length) return null
          return (
            <div key={m.id} className="py-1">
              <div className="px-4 py-1 text-xs font-medium text-muted-foreground">{m.title}</div>
              {lessons.map((l) => {
                const done = progress.done.includes(l.id)
                const locked = l.status !== "published" || !!gateBefore(course, l.id, progress)
                const row = (
                  <>
                    <span className={cn("r-dot grid size-5 shrink-0 place-items-center", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {done ? <Check className="size-3" /> : locked ? <Lock className="size-2.5" /> : null}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{l.minutes}′</span>
                  </>
                )
                const cls = cn("flex items-center gap-2.5 px-4 py-1.5 text-sm", l.id === current ? "bg-primary/10 font-medium" : !locked && "hover:bg-muted/60", locked && "text-muted-foreground")
                return locked ? (
                  <div key={l.id} className={cls}>
                    {row}
                  </div>
                ) : (
                  <Link key={l.id} href={`${base}/courses/${course.id}/${l.id}${q}`} className={cls}>
                    {row}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The AI side panel: answers from this lesson, with a jump to the moment. */
export function AskAi({ lesson }: { lesson: Lesson }) {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [asked, setAsked] = useState<string | null>(null)
  const jump = lesson.chapters[Math.min(3, lesson.chapters.length - 1)]
  return (
    <div className="grid gap-3 rounded-(--radius) bg-card p-4 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <span className="font-medium">{askAi(coach.wording.ai)}</span>
        <span className="ml-auto text-xs text-muted-foreground">about this {coach.wording.lesson.toLowerCase()}</span>
      </div>
      {asked && (
        <div className="grid gap-2 text-sm">
          <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">{asked}</div>
          <div className="max-w-[95%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
            {lesson.summary ?? `${coach.coachName} covers that in this ${coach.wording.lesson.toLowerCase()}.`}
            {jump && (
              <button onClick={() => seek(jump.at)} className="mt-1.5 block text-xs text-primary hover:underline">
                ▶ {jump.title}, {fmtTime(jump.at)}
              </button>
            )}
          </div>
        </div>
      )}
      <form
        className="flex items-center gap-2 rounded-[var(--button-radius)] border bg-background p-1 pl-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!q.trim()) return
          setAsked(q.trim())
          setQ("")
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about this lesson…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <Button size="sm" type="submit" disabled={!q.trim()}>
          Ask
        </Button>
      </form>
      <p className="text-[0.6875rem] text-muted-foreground">From {coach.coachName}&apos;s lessons. Not investment advice.</p>
    </div>
  )
}

