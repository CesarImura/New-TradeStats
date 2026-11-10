"use client"

import { Maximize } from "@/components/icons"
import { tintOf } from "./thumbs"
import { fmtTime, type Course, type Lesson, type Module } from "@/lib/data/learning"
import { cn } from "@/lib/utils"

/** One video going up. Lives in the builder, so the tray and the lesson page show the same progress. */
export type Upload = { id: string; lessonId: string; title: string; phase: "uploading" | "transcribing" | "chapters" | "ready" | "failed"; pct: number }

/** Videos picked in New course, waiting for the builder to start uploading them (files cannot travel in a URL). */
export const uploadQueue = new Map<string, { lessonId: string; file: File }[]>()

export const PHASE_LABEL: Record<Upload["phase"], string> = { uploading: "Uploading", transcribing: "Transcribing", chapters: "Adding chapters", ready: "Ready", failed: "Failed" }

export const minutesOf = (c: Course) => c.modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.minutes, 0)
export const fmtLength = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min` : `${min} min`)
export const clock = (s: number) => fmtTime(s).replace(/^(\d):/, "0$1:")

export type Visibility = "visible" | "free" | "hidden" | "scheduled"
export const visibilityOf = (l: Lesson): Visibility => (l.status === "draft" || l.status === "archived" ? "hidden" : l.status === "scheduled" ? "scheduled" : l.freePreview ? "free" : "visible")
export const VISIBILITY_LABEL: Record<Visibility, string> = { visible: "Visible", free: "Free preview", hidden: "Hidden", scheduled: "Scheduled" }

/** The small label beside a lesson in the outline: only what is out of the ordinary. */
export function lessonMark(l: Lesson, up?: Upload): { text: string; tone: "danger" | "warning" | "muted" | "accent" } | null {
  if (up?.phase === "failed") return { text: "Failed", tone: "danger" }
  if (up && up.phase !== "ready") return { text: up.phase === "uploading" ? `${up.pct}%` : PHASE_LABEL[up.phase], tone: "accent" }
  if (visibilityOf(l) === "hidden") return { text: "Hidden", tone: "muted" }
  if (l.status === "scheduled") return { text: l.unlockAt ?? "Scheduled", tone: "muted" }
  if (l.freePreview) return { text: "Free preview", tone: "muted" }
  if (!l.video) return { text: "No video", tone: "warning" }
  return null
}
export const MARK_TONE = { danger: "text-a-danger", warning: "text-a-warning", muted: "text-a-text-3", accent: "text-a-text-accent" } as const

/** A lesson without its own picture gets a quiet tint of the course colour: the course cover has its title baked in, so it would be cropped. */
const quiet = (color: number, state: "ok" | "failed" | "muted" = "ok") => {
  const c = state === "failed" ? "#e11d48" : state === "muted" ? "#9ca3af" : tintOf(color)
  return `linear-gradient(135deg, color-mix(in oklab, ${c} ${state === "muted" ? 12 : 17}%, #0d0d0d), color-mix(in oklab, ${c} ${state === "muted" ? 3 : 4}%, #111111))`
}

/** A course's cover in the admin lists: the coach's own picture, else a quiet tint of its colour (the sample covers carry text, so they stay on the student side). */
export function CourseCover({ course, className, children }: { course: Course; className?: string; children?: React.ReactNode }) {
  const own = course.cover?.startsWith("data:") ? course.cover : undefined
  return (
    <div className={cn("relative overflow-hidden", className)} style={own ? undefined : { background: quiet(course.color) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {own && <img src={own} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
      {children}
    </div>
  )
}

/** A lesson's picture, or a tint of the course colour, with the length in mono on the corner. */
export function LessonThumb({ lesson, course, className, showTime = true, upload }: { lesson: Lesson; course: Course; className?: string; showTime?: boolean; upload?: Upload }) {
  const state = upload?.phase === "failed" ? "failed" : visibilityOf(lesson) === "hidden" || !lesson.video ? "muted" : "ok"
  return (
    <div className={cn("relative overflow-hidden rounded-a-md border border-a-border", className)} style={lesson.thumbnail ? undefined : { background: quiet(course.color, state) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {lesson.thumbnail && <img src={lesson.thumbnail} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
      {showTime && lesson.minutes > 0 && <span className="absolute right-2 bottom-2 rounded-a-xs bg-a-scrim px-1.5 py-0.5 t-mono-data text-a-text-2">{String(lesson.minutes).padStart(2, "0")}:00</span>}
    </div>
  )
}

/** The video area: a dark frame, with the play bar when there is a video. `children` sit on top (chapter markers). */
export function PlayerFrame({ lesson, course, className, children, controls = true, t = 0 }: { lesson: Lesson; course: Course; className?: string; children?: React.ReactNode; controls?: boolean; t?: number }) {
  const total = Math.max(60, lesson.minutes * 60)
  return (
    <div className={cn("relative aspect-[1.78] overflow-hidden rounded-a-lg border border-a-border", className)} style={lesson.thumbnail ? undefined : { background: quiet(course.color) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {lesson.thumbnail && <img src={lesson.thumbnail} alt="" className="absolute inset-0 size-full object-cover" />}
      <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-a-page/40 to-a-page/70" />
      {controls && (
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 t-body-m text-a-text-2">
          <span aria-hidden className="size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-a-text" />
          <span className="t-mono-data tabular-nums">{clock(t)} / {clock(total)}</span>
          <span aria-hidden className="relative h-0.5 max-w-[42%] flex-1 rounded-full bg-a-track">
            <span className="absolute inset-y-0 left-0 rounded-full bg-a-accent-strong" style={{ width: `${Math.min(100, (t / total) * 100)}%` }} />
          </span>
          <Maximize aria-hidden className="ml-auto size-3.5 text-a-text-2" />
        </div>
      )}
      {children}
    </div>
  )
}

export const moduleOf = (c: Course, lessonId: string): Module | undefined => c.modules.find((m) => m.lessons.some((l) => l.id === lessonId))
