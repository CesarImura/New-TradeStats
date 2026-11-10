"use client"

import { useState } from "react"
import { Check, Lock, Pencil } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { allLessons, type Course, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminProgress, FileItem, Panel, Tag } from "../ui"
import { PlayerFrame } from "./course-parts"

/** Content · 13 Preview as student: the lesson as a student of a chosen tier sees it, with a bar to go back and edit. */
export function StudentPreview({ course, lesson, onSelect, onEdit, onExit }: { course: Course; lesson: Lesson; onSelect: (id: string) => void; onEdit: () => void; onExit: () => void }) {
  const { coach } = useCoach()
  const [as, setAs] = useState<string>(course.tiers[0] ?? coach.tiers[0]?.id ?? "access")
  const lessons = allLessons(course).filter((l) => l.status === "published" || l.status === "scheduled")
  const hasAccess = as === "access" || (as !== "none" && (course.tiers.length === 0 || course.tiers.includes(as)))
  const open = (l: Lesson) => l.status === "published" && (hasAccess || !!l.freePreview)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  const done = idx > 0 ? idx : 0
  const gatedBy = (l: Lesson) => {
    const prev = lessons[lessons.indexOf(l) - 1]
    return prev?.quiz?.gate ? prev : undefined
  }
  const options = [{ id: "none", label: "No tier" }, ...coach.tiers.map((t) => ({ id: t.id, label: t.name })), { id: "access", label: "Has access" }]
  const locked = !open(lesson)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-a-lg border border-a-accent bg-a-accent-soft px-2.5 py-2">
        <Tag tone="accent" dot>Preview</Tag>
        <span className="px-1 t-body-m text-a-text-2">Viewing as</span>
        <div role="radiogroup" aria-label="Viewing as" className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={as === o.id} onClick={() => setAs(o.id)} className={cn("h-9 rounded-a-md border px-3 t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", as === o.id ? "border-a-accent-strong bg-a-raised text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover hover:text-a-text")}>
              {o.label}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <AdminButton hierarchy="secondary" onClick={onEdit}><Pencil /> Edit this lesson</AdminButton>
        <AdminButton hierarchy="ghost" className="hover:bg-transparent" onClick={onExit}>Exit preview</AdminButton>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <PlayerFrame lesson={lesson} course={course} controls={!locked} className="aspect-[1.88]">
            {locked && (
              <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-a-page/70 text-center">
                <Lock className="size-5 text-a-text-2" />
                <span className="t-body-l-medium text-a-text">{lesson.status === "scheduled" ? `Opens ${lesson.unlockAt ?? "soon"}` : "Upgrade to watch this lesson"}</span>
              </div>
            )}
          </PlayerFrame>
          <div className="grid gap-2">
            <h1 className="t-heading-xl text-a-text">{lesson.title}</h1>
            {lesson.summary && <p className="t-body-l text-a-text-2">{lesson.summary}</p>}
          </div>
          {lesson.downloads.length > 0 && !locked && (
            <Panel className="gap-3">
              <h2 className="t-heading-s text-a-text">Files</h2>
              {lesson.downloads.map((d) => <FileItem key={d.name} name={d.name} meta={d.size} />)}
            </Panel>
          )}
        </div>

        <Panel className="gap-3 p-4">
          <h2 className="t-heading-s text-a-text">{course.title}</h2>
          <AdminProgress label="Course progress" tone="accent" value={lessons.length ? (done / lessons.length) * 100 : 0} />
          <ul className="grid gap-0.5">
            {lessons.map((l, i) => {
              const gate = gatedBy(l)
              const isOpen = open(l) && !(gate && i > idx)
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => onSelect(l.id)} aria-current={l.id === lesson.id ? "true" : undefined} className={cn("flex h-9 w-full items-center gap-2 rounded-a-sm px-2.5 text-left t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", l.id === lesson.id ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover")}>
                    <span className="min-w-0 truncate">{l.title}</span>
                    {gate && !isOpen && <span className="flex shrink-0 items-center gap-1 t-micro text-a-text-3"><Lock className="size-2.5" aria-hidden /> Pass the quiz to open</span>}
                    <span className="ml-auto grid size-4 shrink-0 place-items-center text-a-text-3">
                      {!isOpen ? <Lock className="size-3" aria-label="Locked" /> : i < done ? <Check className="size-3.5" aria-label="Done" /> : l.id === lesson.id ? <span className="size-2 rounded-full bg-a-text-2" aria-label="Playing" /> : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
