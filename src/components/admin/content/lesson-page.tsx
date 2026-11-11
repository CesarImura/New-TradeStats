"use client"

import { useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from "@/components/icons"
import { allLessons, type Course, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminFilter, AdminUnderlineTabs, Panel } from "../ui"
import { MARK_TONE, VISIBILITY_LABEL, lessonMark, moduleOf, visibilityOf, type Upload, type Visibility } from "./course-parts"
import { ChaptersTab } from "./chapters-tab"
import { FilesTab } from "./files-tab"
import { LessonTab } from "./lesson-tab"
import { useRenameUndo } from "./use-rename-undo"
import { QuizTab } from "./quiz-tab"

type Tab = "lesson" | "chapters" | "quiz" | "files"
/** Content · 08 Lesson, 09 Chapters, 10 Quiz (and Files): one lesson beside the course outline. */
export function LessonPage({ course, lesson, upload, saved, onChange, onPick, onBack, onSelect, onPreview }: { course: Course; lesson: Lesson; upload?: Upload; saved: boolean; onChange: (p: Partial<Lesson>) => void; onPick: (file: File) => void; onBack: () => void; onSelect: (id: string) => void; onPreview: () => void }) {
  const [tab, setTab] = useState<Tab>("lesson")
  const [t, setT] = useState(0)
  const lessons = allLessons(course)
  const at = lessons.findIndex((l) => l.id === lesson.id)
  const mod = moduleOf(course, lesson.id)
  const rename = useRenameUndo(lesson.title, (title) => onChange({ title }))
  const vis = visibilityOf(lesson)
  const setVis = (v: Visibility) =>
    onChange(v === "hidden" ? { status: "draft", freePreview: false } : v === "scheduled" ? { status: "scheduled", unlockAt: lesson.unlockAt ?? "Thu 15 Oct", freePreview: false } : { status: "published", freePreview: v === "free" })

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <AdminButton hierarchy="secondary" size="xl" iconOnly aria-label="Back to the course" onClick={onBack}>
          <ArrowLeft />
        </AdminButton>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="sr-only">{lesson.title}</h1>
          <input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} {...rename} aria-label="Lesson title" className="-mx-2 block w-[calc(100%+1rem)] truncate rounded-a-sm bg-transparent px-2 t-heading-xl text-a-text outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:bg-a-field" />
          <p className="t-body-m text-a-text-2">
            {course.title} · Module {course.modules.indexOf(mod!) + 1} · Lesson {mod ? mod.lessons.indexOf(lesson) + 1 : at + 1}
          </p>
        </div>
        <span className="t-caption text-a-text-3">{saved ? "Saved" : ""}</span>
        <AdminFilter
          label="Visibility"
          value={vis}
          onValueChange={(v) => setVis(v as Visibility)}
          options={(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => ({ value: v, label: VISIBILITY_LABEL[v] }))}
        />
        <AdminButton hierarchy="secondary" onClick={onPreview}>
          <ExternalLink /> Preview as student
        </AdminButton>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel className="gap-1 px-3 py-3.5">
          <div className="flex items-center justify-between px-1.5">
            <h2 className="t-body-m-medium text-a-text">Course outline</h2>
            <span className="flex gap-1">
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Previous lesson" disabled={at <= 0} onClick={() => onSelect(lessons[at - 1].id)}>
                <ChevronLeft />
              </AdminButton>
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Next lesson" disabled={at >= lessons.length - 1} onClick={() => onSelect(lessons[at + 1].id)}>
                <ChevronRight />
              </AdminButton>
            </span>
          </div>
          <nav aria-label="Course outline" className="flex flex-col gap-1">
            {course.modules.map((m, mi) => (
              <div key={m.id} className="flex flex-col gap-1">
                <span className="px-2.5 pt-2.5 pb-1 t-mono-label-s text-a-text-3">
                  {mi + 1} · {m.title}
                </span>
                {m.lessons.map((l) => {
                  const mark = lessonMark(l, l.id === lesson.id ? upload : undefined)
                  return (
                    <button key={l.id} type="button" aria-current={l.id === lesson.id ? "page" : undefined} onClick={() => onSelect(l.id)}
                      className={cn("flex h-[34px] items-center gap-2 rounded-a-sm px-2.5 text-left t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", l.id === lesson.id ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text")}>
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      {mark && <span className={cn("shrink-0 t-micro", MARK_TONE[mark.tone])}>{mark.text}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <AdminUnderlineTabs
            label="Lesson sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "lesson", label: "Lesson" },
              { id: "chapters", label: "Chapters", count: lesson.chapters.length },
              { id: "quiz", label: "Quiz", count: lesson.quiz?.questions.length },
              { id: "files", label: "Files", count: lesson.downloads.length },
            ]}
          />
          {tab === "lesson" && <LessonTab course={course} lesson={lesson} upload={upload} t={t} onChange={onChange} onPick={onPick} next={lessons[at + 1] ? { title: lessons[at + 1].title, onPlay: () => onSelect(lessons[at + 1].id) } : undefined} />}
          {tab === "chapters" && <ChaptersTab course={course} lesson={lesson} t={t} setT={setT} onChange={onChange} />}
          {tab === "quiz" && <QuizTab lesson={lesson} onChange={onChange} />}
          {tab === "files" && <FilesTab lesson={lesson} onChange={onChange} />}
        </div>
      </div>
    </div>
  )
}
