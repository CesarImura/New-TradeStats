"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarClock, Check, CircleHelp, FileDown, Lock, Play } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Ring } from "@/components/widgets/parts/charts"
import { Avatar } from "@/components/widgets/parts/bits"
import { courseSections } from "@/lib/data/course-page"
import {
  asPreview,
  canAccess,
  courseStats,
  gateBefore,
  openLessons,
  resumeLesson,
  studentCourses,
  useCatalog,
  useProgress,
  visibleLessons,
  type Course,
  type Lesson,
} from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { moduleTiers, useAccess } from "@/lib/data/access"
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
  const access = useAccess(coach.slug)
  const allTiers = coach.tiers.map((t) => t.id)

  if (!course) return <NotFound />
  const open = canAccess(course, tier)
  // A module can be set apart from its course in the access overview (ADM-14).
  const moduleOpen = (id: string) => open && moduleTiers(access, course, id, allTiers).includes(tier ?? "")
  const s = courseStats(course, progress)
  const resume = resumeLesson(course, progress)
  const downloads = course.modules.flatMap((m) => m.lessons).reduce((n, l) => n + (l.status === "published" ? l.downloads.length : 0), 0)
  const lessonHref = (id: string) => `${base}/courses/${course.id}/${id}${preview ? "?preview=draft" : ""}`
  const notes = course.modules.flatMap((m) => m.lessons).reduce((n, l) => n + (progress.notes[l.id]?.length ?? 0), 0)
  // The coach's layout for the page inside a course (Design → Course): the same for every course.
  const page = coach.coursePage
  const cards = page?.lessons === "cards"
  const upNext = open ? openLessons(course).filter((l) => !progress.done.includes(l.id)).slice(0, 3) : []
  const others = studentCourses(catalog).filter((c) => c.id !== course.id)

  const hero = (
      <div className="@container overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
        {page?.hero !== "plain" && <CourseCover course={course} locked={!open} className="h-28 @2xl:h-36" />}
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
  )

  const keepWatching = upNext.length > 0 && (
    <section className="grid gap-3">
      <h2 className="font-heading text-xl">{s.done === 0 ? "Start here" : "Keep watching"}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {upNext.map((l, i) => (
          <LessonCard key={l.id} lesson={l} course={course} href={lessonHref(l.id)} current={i === 0} done={false} blocked={false} />
        ))}
      </div>
    </section>
  )

  const modules = (
      <Accordion multiple defaultValue={course.modules.filter((m) => !resume || m.id === resume.module.id).map((m) => m.id)} className="flex flex-col gap-3">
        {course.modules.map((m, mi) => {
          const lessons = visibleLessons(m)
          if (lessons.length === 0) return null
          const mOpen = moduleOpen(m.id)
          if (open && !mOpen && access.locked === "hide") return null
          const needs = coach.tiers.find((t) => moduleTiers(access, course, m.id, allTiers).includes(t.id))
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
                      {open && !mOpen ? `Part of ${needs?.name ?? "a higher tier"}` : opens ? `Opens ${opens}` : `${done} of ${lessons.length} done`}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2 [&_a]:no-underline">
                {cards ? (
                  <div className="grid gap-3 px-[calc(1rem*var(--density,1))] pb-2 sm:grid-cols-2 lg:grid-cols-3">
                    {lessons.map((l) => {
                      const gate = mOpen ? gateBefore(course, l.id, progress) : null
                      const blocked = !mOpen || l.status === "scheduled" || !!gate
                      return <LessonCard key={l.id} lesson={l} course={course} href={lessonHref(l.id)} current={resume?.lesson.id === l.id} done={progress.done.includes(l.id)} blocked={blocked} onLocked={!mOpen ? () => setUpgrade(true) : undefined} />
                    })}
                  </div>
                ) : (
                <ol className="grid">
                  {lessons.map((l) => (
                    <LessonRow key={l.id} lesson={l} courseId={course.id} locked={!mOpen} gate={mOpen ? gateBefore(course, l.id, progress) : null} current={resume?.lesson.id === l.id} done={progress.done.includes(l.id)} onLocked={() => setUpgrade(true)} />
                  ))}
                </ol>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
  )

  const teacher = (
    <section className="flex items-center gap-4 rounded-(--radius) bg-card p-[calc(1.25rem*var(--density,1))] text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <Avatar initials={coach.coachName.slice(0, 2).toUpperCase()} size={48} />
      <div className="grid min-w-0">
        <span className="eyebrow">Taught by</span>
        <span className="font-heading text-lg">{coach.coachName}</span>
        <span className="line-clamp-2 text-sm text-muted-foreground">{coach.tagline}</span>
      </div>
    </section>
  )

  const more = others.length > 0 && (
    <section className="grid gap-3">
      <h2 className="font-heading text-xl">More {coach.wording.courses.toLowerCase()}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.slice(0, 3).map((c) => (
          <Link key={c.id} href={`${base}/courses/${c.id}${preview ? "?preview=draft" : ""}`} className="group grid overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
            <CourseCover course={c} className="aspect-[16/8]" />
            <span className="p-3 text-sm font-medium group-hover:underline">{c.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )

  const parts = { hero, continue: keepWatching, modules, coach: teacher, others: more }

  return (
    <div className="flex flex-col page-gap">
      <PreviewNotice />
      <Link href={`${base}/courses`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {coach.wording.courses}
      </Link>
      {courseSections(page).filter((x) => x.on).map((x) => <div key={x.id} className="contents">{parts[x.id]}</div>)}
      <UpgradeDialog course={course} open={upgrade} onOpenChange={setUpgrade} />
    </div>
  )
}

/** A lesson as a card: a picture (the lesson's own, else the course's), the play button, its length, and where the student is. */
function LessonCard({ lesson, course, href, current, done, blocked, onLocked }: { lesson: Lesson; course: Course; href: string; current: boolean; done: boolean; blocked: boolean; onLocked?: () => void }) {
  const icon = done ? <Check className="size-5" /> : lesson.status === "scheduled" ? <CalendarClock className="size-5" /> : blocked ? <Lock className="size-5" /> : <Play className="size-5" />
  const inner = (
    <>
      <div className="relative overflow-hidden">
        <CourseCover course={{ ...course, cover: lesson.thumbnail ?? course.cover }} className="aspect-video" />
        <span className={cn("absolute inset-0 grid place-items-center text-white", blocked ? "bg-black/45" : "bg-black/10 transition-colors group-hover:bg-black/25")}>
          <span className="grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur-sm">{icon}</span>
        </span>
        <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[0.6875rem] text-white tabular-nums">{lesson.minutes} min</span>
        {done && <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[0.6875rem] font-medium text-primary-foreground">Done</span>}
      </div>
      <div className="grid gap-0.5 p-3 text-left">
        <span className={cn("line-clamp-2 text-sm", current && "font-medium", blocked && "text-muted-foreground")}>{lesson.title}</span>
        {current && !done && <span className="text-xs text-muted-foreground">Up next</span>}
        {lesson.status === "scheduled" && <span className="text-xs text-muted-foreground">Opens {lesson.unlockAt}</span>}
      </div>
    </>
  )
  const cls = "group grid overflow-hidden rounded-(--radius) bg-card text-card-foreground"
  const style = { boxShadow: "var(--card-shadow)" }
  if (onLocked) return <button className={cls} style={style} onClick={onLocked}>{inner}</button>
  if (blocked) return <div className={cls} style={style}>{inner}</div>
  return <Link href={href} className={cls} style={style}>{inner}</Link>
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
