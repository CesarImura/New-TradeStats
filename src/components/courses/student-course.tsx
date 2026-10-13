"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Check, CircleHelp, FileDown, Lock, Play } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Ring } from "@/components/widgets/kit"
import {
  asPreview,
  canAccess,
  courseStats,
  gateBefore,
  resumeLesson,
  useCatalog,
  useProgress,
  visibleLessons,
  type Lesson,
} from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { CourseCover, PreviewNotice, UpgradeDialog, hours, useStudentTier } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** STU-03: modules and lessons with progress, unlock dates and a resume button. */
export function StudentCourse({ courseId }: { courseId: string }) {
  const { coach, base, preview } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useStudentTier()
  const found = catalog.courses.find((c) => c.id === courseId && (preview || c.status === "published"))
  const course = found && preview ? asPreview(found) : found
  const [upgrade, setUpgrade] = useState(false)

  if (!course) return <NotFound />
  const open = canAccess(course, tier)
  const s = courseStats(course, progress)
  const resume = resumeLesson(course, progress)
  const downloads = course.modules.flatMap((m) => m.lessons).reduce((n, l) => n + (l.status === "published" ? l.downloads.length : 0), 0)
  const lessonHref = (id: string) => `${base}/courses/${course.id}/${id}${preview ? "?preview=draft" : ""}`
  const notes = course.modules.flatMap((m) => m.lessons).reduce((n, l) => n + (progress.notes[l.id]?.length ?? 0), 0)

  return (
    <div className="flex flex-col page-gap">
      <PreviewNotice />
      <Link href={`${base}/courses`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {coach.wording.courses}
      </Link>

      <div className="@container overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
        <CourseCover course={course} locked={!open} className="h-28 @2xl:h-36" />
        <div className="flex flex-col gap-5 p-[calc(1.25rem*var(--density,1))] @2xl:flex-row @2xl:items-center">
          <div className="grid flex-1 gap-1.5">
            <span className="eyebrow">{course.area}</span>
            <h1 className="text-3xl leading-tight">{course.title}</h1>
            <p className="text-muted-foreground">{course.tagline}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
              <span>
                {s.lessons} {coach.wording.lesson.toLowerCase()}s
              </span>
              <span>{hours(s.minutes)}</span>
              {downloads > 0 && <span>{downloads} downloads</span>}
              {notes > 0 && (
                <Link href={`${base}/courses`} className="underline-offset-4 hover:underline">
                  {notes} of your notes
                </Link>
              )}
            </div>
          </div>
          {open ? (
            <div className="flex items-center gap-4">
              <Ring value={s.pct} size={64} stroke={6}>
                <span className="text-sm font-semibold tabular-nums">{s.pct}%</span>
              </Ring>
              {resume ? (
                <Button size="lg" {...link(lessonHref(resume.lesson.id))}>
                  <Play /> {s.done === 0 ? "Start" : "Resume"}
                </Button>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Check className="size-4 text-primary" /> All done
                </span>
              )}
            </div>
          ) : (
            <Button size="lg" onClick={() => setUpgrade(true)}>
              <Lock /> Unlock
            </Button>
          )}
        </div>
      </div>

      <Accordion multiple defaultValue={course.modules.filter((m) => !resume || m.id === resume.module.id).map((m) => m.id)} className="flex flex-col gap-3">
        {course.modules.map((m, mi) => {
          const lessons = visibleLessons(m)
          if (lessons.length === 0) return null
          const done = lessons.filter((l) => progress.done.includes(l.id)).length
          const opens = lessons.every((l) => l.status === "scheduled") ? lessons[0].unlockAt : undefined
          return (
            <AccordionItem key={m.id} value={m.id} className="overflow-hidden rounded-(--radius) border-0 bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
              <AccordionTrigger className="items-center px-[calc(1rem*var(--density,1))] py-4 hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={cn("r-chip grid size-8 shrink-0 place-items-center text-sm font-semibold tabular-nums", done === lessons.length ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {done === lessons.length ? <Check className="size-4" /> : mi + 1}
                  </span>
                  <div className="grid min-w-0 text-left">
                    <span className="truncate font-heading text-base">{m.title}</span>
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">
                      {opens ? `Opens ${opens}` : `${done} of ${lessons.length} done`}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2 [&_a]:no-underline">
                <ol className="grid">
                  {lessons.map((l) => (
                    <LessonRow key={l.id} lesson={l} courseId={course.id} locked={!open} gate={open ? gateBefore(course, l.id, progress) : null} current={resume?.lesson.id === l.id} done={progress.done.includes(l.id)} onLocked={() => setUpgrade(true)} />
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <UpgradeDialog course={course} open={upgrade} onOpenChange={setUpgrade} />
    </div>
  )
}

function LessonRow({
  lesson,
  courseId,
  locked,
  gate,
  current,
  done,
  onLocked,
}: {
  lesson: Lesson
  courseId: string
  locked: boolean
  gate: Lesson | null
  current: boolean
  done: boolean
  onLocked: () => void
}) {
  const { base, preview } = useCoach()
  const scheduled = lesson.status === "scheduled"
  const blocked = locked || scheduled || !!gate
  const icon = done ? (
    <Check className="size-3.5" />
  ) : scheduled ? (
    <CalendarClock className="size-3.5" />
  ) : blocked ? (
    <Lock className="size-3.5" />
  ) : (
    <Play className="size-3.5" />
  )
  const note = scheduled ? `Opens ${lesson.unlockAt}` : gate ? `Pass the quiz in “${gate.title}” first` : null
  const inner = (
    <>
      <span className={cn("r-dot grid size-7 shrink-0 place-items-center", done ? "bg-primary text-primary-foreground" : current ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{icon}</span>
      <span className="grid min-w-0 flex-1">
        <span className={cn("truncate text-sm", current && "font-medium", blocked && "text-muted-foreground")}>{lesson.title}</span>
        {note && <span className="truncate text-xs text-muted-foreground">{note}</span>}
      </span>
      <span className="hidden items-center gap-2 text-muted-foreground sm:flex">
        {lesson.quiz && <CircleHelp className="size-3.5" aria-label="Has a quiz" />}
        {lesson.downloads.length > 0 && <FileDown className="size-3.5" aria-label="Has downloads" />}
      </span>
      <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{lesson.minutes} min</span>
    </>
  )
  const cls = cn("flex w-full items-center gap-3 px-[calc(1rem*var(--density,1))] py-2.5 text-left transition-colors", current && "bg-primary/5", !scheduled && !gate && "hover:bg-muted/60")
  if (locked) return <li><button className={cls} onClick={onLocked}>{inner}</button></li>
  if (scheduled || gate) return <li><div className={cls}>{inner}</div></li>
  return (
    <li>
      <Link href={`${base}/courses/${courseId}/${lesson.id}${preview ? "?preview=draft" : ""}`} className={cls}>
        {inner}
      </Link>
    </li>
  )
}

export function NotFound() {
  const { coach, base } = useCoach()
  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <p className="font-heading text-2xl">This page isn&apos;t available</p>
      <p className="text-muted-foreground">It may have been moved or unpublished.</p>
      <Button variant="secondary" {...link(`${base}/courses`)}>
        Back to {coach.wording.courses}
      </Button>
    </div>
  )
}
