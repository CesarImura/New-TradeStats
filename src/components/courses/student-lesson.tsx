"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Check } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { asPreview, canAccess, findLesson, gateBefore, neighbours, openLessons, updateProgress, useCatalog, useProgress } from "@/lib/data/learning"
import { PreviewNotice, UpgradeDialog, useStudentTier } from "./shared"
import { NotFound } from "./student-course"

import { link } from "./lesson-utils"
import { LockedPlayer, Player } from "./lesson-player"
import { LessonTabs } from "./lesson-tabs"
import { QuizCard } from "./lesson-quiz"
import { AskAi, Outline } from "./lesson-side"


/** STU-04 lesson, with the quiz (STU-05) and notes (STU-29). */
export function StudentLesson({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { coach, base, preview } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useStudentTier()
  const q = preview ? "?preview=draft" : ""
  const raw = catalog.courses.find((c) => c.id === courseId && (preview || c.status === "published"))
  const course = raw && preview ? asPreview(raw) : raw
  const found = course ? findLesson(course, lessonId) : null
  const startAt = Number(useSearchParams().get("t") ?? 0)
  const [time, setTime] = useState(startAt)
  const [upgrade, setUpgrade] = useState(false)

  // Remember the last lesson opened, for "Continue" on Home and in Courses.
  useEffect(() => {
    if (found?.lesson.status === "published") updateProgress(coach.slug, (p) => (p.last === lessonId ? p : { ...p, last: lessonId }))
  }, [coach.slug, lessonId, found?.lesson.status])

  if (!course || !found || (found.lesson.status !== "published" && found.lesson.status !== "scheduled")) return <NotFound />
  const { lesson, module } = found
  const open = canAccess(course, tier)
  const gate = gateBefore(course, lesson.id, progress)
  const blocked = !open ? "tier" : lesson.status === "scheduled" ? "scheduled" : gate ? "gate" : null
  const done = progress.done.includes(lesson.id)
  const { prev, next } = neighbours(course, lesson.id)
  const index = openLessons(course).findIndex((l) => l.id === lesson.id)
  const quizPassed = !lesson.quiz || (progress.quiz[lesson.id] ?? -1) >= lesson.quiz.passMark
  const nextBlocked = !!lesson.quiz?.gate && !quizPassed

  const setDone = (v: boolean) => updateProgress(coach.slug, (p) => ({ ...p, done: v ? [...new Set([...p.done, lesson.id])] : p.done.filter((x) => x !== lesson.id) }))

  return (
    <div className="flex flex-col page-gap">
      <PreviewNotice />
      <Link href={`${base}/courses/${course.id}${q}`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {course.title}
      </Link>

      <div className="grid items-start gap-[var(--page-gap)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {blocked ? (
            <LockedPlayer course={course} lesson={lesson} reason={blocked} gate={gate} onUpgrade={() => setUpgrade(true)} />
          ) : (
            <Player
              key={lesson.id}
              lesson={lesson}
              color={course.color}
              t={time}
              setT={setTime}
              autoPlay={startAt > 0}
              onEnd={() => {
                if (done) return
                setDone(true)
                toast.success("Marked as done")
              }}
            />
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-1">
              <span className="eyebrow">
                {module.title} · {coach.wording.lesson} {index + 1} of {openLessons(course).length}
              </span>
              <h1 className="text-2xl leading-tight md:text-3xl">{lesson.title}</h1>
            </div>
            {!blocked && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant={done ? "secondary" : "outline"} onClick={() => setDone(!done)}>
                  <Check /> {done ? "Done" : "Mark as done"}
                </Button>
                {next && (
                  <Button
                    disabled={nextBlocked}
                    title={nextBlocked ? "Pass the quiz first" : undefined}
                    {...(nextBlocked ? {} : link(`${base}/courses/${course.id}/${next.id}${q}`))}
                    onClick={() => !done && setDone(true)}
                  >
                    Next {coach.wording.lesson.toLowerCase()} <ArrowRight />
                  </Button>
                )}
              </div>
            )}
          </div>

          {!blocked && <LessonTabs lesson={lesson} time={time} />}
          {!blocked && lesson.quiz && <QuizCard lesson={lesson} quiz={lesson.quiz} nextTitle={next?.title} />}

          {!blocked && (
            <div className="flex justify-between gap-3 border-t pt-4 text-sm">
              {prev ? (
                <Link href={`${base}/courses/${course.id}/${prev.id}${q}`} className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4 shrink-0" /> <span className="truncate">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && !nextBlocked && (
                <Link href={`${base}/courses/${course.id}/${next.id}${q}`} className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <span className="truncate">{next.title}</span> <ArrowRight className="size-4 shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-[var(--page-gap)] lg:sticky lg:top-20">
          <Outline course={course} current={lesson.id} />
          {coach.modules.ai && !blocked && <AskAi lesson={lesson} />}
        </aside>
      </div>

      <UpgradeDialog course={course} open={upgrade} onOpenChange={setUpgrade} />
    </div>
  )
}
