"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { allLessons, saveCatalog, useCatalog, type Course, type Lesson } from "@/lib/data/learning"
import { StatusBadge } from "./content-board"
import { CourseSettings } from "./course-settings"
import { LessonEditor } from "./lesson-editor"
import { Tree, type Sel } from "./course-tree"

/** ADM-09 course builder, with the lesson editor (ADM-11), chapters (ADM-12) and quiz (ADM-13). */
export function CourseBuilder({ courseId }: { courseId: string }) {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const course = catalog.courses.find((c) => c.id === courseId)
  const [sel, setSel] = useState<Sel>({ kind: "course" })
  const [saved, setSaved] = useState<number | null>(null)

  if (!course) {
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="text-lg font-medium">This course no longer exists</p>
        <Button variant="outline" nativeButton={false} render={<Link href={`${base}/content`} />}>
          Back to Content
        </Button>
      </div>
    )
  }

  const edit = (fn: (c: Course) => Course) => {
    saveCatalog(coach, (cat) => ({ ...cat, courses: cat.courses.map((x) => (x.id === courseId ? fn(x) : x)) }))
    setSaved(Date.now())
  }
  const editLesson = (id: string, patch: Partial<Lesson>) =>
    edit((c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })) }))

  const lesson = sel.kind === "lesson" ? allLessons(course).find((l) => l.id === sel.id) : undefined
  const studentUrl = `/c/${coach.slug}/courses/${course.id}${lesson ? `/${lesson.id}` : ""}?preview=draft`

  return (
    <div className="-mx-4 -mt-6 -mb-10 grid min-h-[calc(100svh-4.5rem)] grid-rows-[auto_1fr] md:-mx-10 md:-mt-8 lg:h-[calc(100svh-4.5rem)]">
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`${base}/content`} />}>
          <ArrowLeft /> Content
        </Button>
        <span className="h-4 w-px bg-border" />
        <span className="truncate text-sm font-medium">{course.title}</span>
        <StatusBadge status={course.status} when={course.scheduledFor} />
        <span className="mr-auto text-xs text-muted-foreground">{saved ? "All changes saved" : ""}</span>
        <Button variant="ghost" size="sm" nativeButton={false} render={<a href={studentUrl} target="_blank" rel="noreferrer" />}>
          <ExternalLink /> Preview as student
        </Button>
        {course.status === "published" ? (
          <Button variant="outline" size="sm" onClick={() => (edit((c) => ({ ...c, status: "draft" })), toast("Unpublished. Students no longer see this course."))}>
            Unpublish
          </Button>
        ) : (
          <Button size="sm" onClick={() => (edit((c) => ({ ...c, status: "published" })), toast.success("Published. Students with access see it now."))}>
            Publish course
          </Button>
        )}
      </div>

      <div className="grid min-h-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto border-r bg-muted/30">
          <Tree course={course} sel={sel} onSelect={setSel} edit={edit} />
        </aside>
        <main className="min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-3xl p-6">
            {lesson ? (
              <LessonEditor key={lesson.id} course={course} lesson={lesson} onChange={(p) => editLesson(lesson.id, p)} />
            ) : (
              <CourseSettings course={course} edit={edit} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

