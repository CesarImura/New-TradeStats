"use client"

import { useRef, useState } from "react"
import { ChevronDown, Copy, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, Upload as UploadIcon } from "@/components/icons"
import { toast } from "sonner"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { allLessons, uid, type Course, type Lesson, type Module, type Status } from "@/lib/data/learning"
import { dropLine } from "@/components/kit/drop-line"
import { cn } from "@/lib/utils"
import { AdminButton, Callout, LessonCard, Panel } from "../ui"
import { LessonThumb, MARK_TONE, fmtLength, lessonMark, type Upload } from "./course-parts"

type Drag = { kind: "lesson" | "module"; id: string } | null

/** Content · 07 Curriculum + uploads: the course's main screen. Modules hold a grid of lesson thumbnails. */
export function Curriculum({ course, edit, uploads, onOpen, onUpload, onReview }: { course: Course; edit: (fn: (c: Course) => Course) => void; uploads: Upload[]; onOpen: (lessonId: string) => void; onUpload: (lessonId: string, file: File) => void; onReview: () => void }) {
  const [drag, setDrag] = useState<Drag>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [closed, setClosed] = useState<string[]>([])
  const picker = useRef<HTMLInputElement>(null)
  const pickFor = useRef<string | null>(null)

  const upOf = (id: string) => uploads.find((u) => u.lessonId === id)
  const failed = allLessons(course).filter((l) => upOf(l.id)?.phase === "failed")
  const noVideo = allLessons(course).filter((l) => !l.video && !upOf(l.id) && l.status !== "draft")

  /** Videos dropped or chosen on a module: one new lesson per file, named after it. */
  const addFromFiles = (moduleId: string, files: File[]) => {
    const videos = files.filter((f) => f.type.startsWith("video/"))
    if (!videos.length) return void toast.error("These aren't videos. Use MP4, MOV or WebM.")
    const made = videos.map((f): [Lesson, File] => [{ id: uid("l"), title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), minutes: 0, status: "draft", chapters: [], downloads: [] }, f])
    edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, ...made.map(([l]) => l)] } : m)) }))
    made.forEach(([l, f]) => onUpload(l.id, f))
  }
  const addLesson = (moduleId: string) => {
    const l: Lesson = { id: uid("l"), title: "New lesson", minutes: 0, status: "draft", chapters: [], downloads: [] }
    edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, l] } : m)) }))
    onOpen(l.id)
  }
  const addModule = () => {
    const m: Module = { id: uid("m"), title: `Module ${course.modules.length + 1}`, lessons: [] }
    edit((c) => ({ ...c, modules: [...c.modules, m] }))
    setRenaming(m.id)
  }
  const moveLesson = (id: string, toModule: string, before: string | null) =>
    edit((c) => {
      const l = allLessons(c).find((x) => x.id === id)
      if (!l) return c
      const stripped = c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((x) => x.id !== id) }))
      return {
        ...c,
        modules: stripped.map((m) => {
          if (m.id !== toModule) return m
          const i = before ? m.lessons.findIndex((x) => x.id === before) : -1
          const lessons = [...m.lessons]
          lessons.splice(i < 0 ? lessons.length : i, 0, l)
          return { ...m, lessons }
        }),
      }
    })
  const moveModule = (id: string, before: string) =>
    edit((c) => {
      const m = c.modules.find((x) => x.id === id)
      if (!m) return c
      const rest = c.modules.filter((x) => x.id !== id)
      const i = rest.findIndex((x) => x.id === before)
      rest.splice(i < 0 ? rest.length : i, 0, m)
      return { ...c, modules: rest }
    })
  const dropOn = (moduleId: string, lessonId?: string) => {
    if (drag?.kind === "lesson") moveLesson(drag.id, moduleId, lessonId ?? null)
    else if (drag?.kind === "module" && drag.id !== moduleId) moveModule(drag.id, moduleId)
    setDrag(null)
    setTarget(null)
  }
  const duplicateModule = (m: Module) => {
    const copy: Module = { id: uid("m"), title: `${m.title} (copy)`, lessons: m.lessons.map((l) => ({ ...structuredClone(l), id: uid("l"), status: "draft" as Status })) }
    edit((c) => ({ ...c, modules: c.modules.flatMap((x) => (x.id === m.id ? [x, copy] : [x])) }))
  }
  const removeModule = (m: Module) => {
    let before: Course | null = null
    edit((c) => ((before = c), { ...c, modules: c.modules.filter((x) => x.id !== m.id) }))
    toast(`“${m.title}” deleted.`, { action: { label: "Undo", onClick: () => before && edit(() => before!) } })
  }
  const duplicateLesson = (m: Module, l: Lesson) => {
    const copy = { ...structuredClone(l), id: uid("l"), title: `${l.title} (copy)`, status: "draft" as Status }
    edit((c) => ({ ...c, modules: c.modules.map((x) => (x.id === m.id ? { ...x, lessons: x.lessons.flatMap((y) => (y.id === l.id ? [y, copy] : [y])) } : x)) }))
  }
  const removeLesson = (l: Lesson) => {
    let before: Course | null = null
    edit((c) => ((before = c), { ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((x) => x.id !== l.id) })) }))
    toast(`“${l.title}” deleted.`, { action: { label: "Undo", onClick: () => before && edit(() => before!) } })
  }

  return (
    <div className="flex flex-col gap-4">
      {(failed.length > 0 || noVideo.length > 0) && (
        <Callout tone={failed.length ? "danger" : "warning"} action={<AdminButton hierarchy="secondary" size="sm" onClick={() => (failed.length ? onOpen(failed[0].id) : onReview())}>Review</AdminButton>}>
          <span className="block truncate">
            {failed.length
              ? `Lesson ${allLessons(course).indexOf(failed[0]) + 1} · ${failed[0].title}: upload failed (connection lost at ${upOf(failed[0].id)?.pct ?? 0}%)`
              : `${noVideo.length} ${noVideo.length === 1 ? "lesson has" : "lessons have"} no video. Students won't see ${noVideo.length === 1 ? "it" : "them"}.`}
          </span>
        </Callout>
      )}

      {course.modules.map((m, mi) => {
        const open = !closed.includes(m.id)
        const mins = m.lessons.reduce((n, l) => n + l.minutes, 0)
        return (
          <Panel key={m.id} className={cn("gap-4", drag?.id === m.id && "opacity-50", target === `m:${m.id}` && drag?.kind === "module" && dropLine("before"))}
            onDragOver={(e: React.DragEvent) => {
              if (e.dataTransfer.types.includes("Files")) return e.preventDefault()
              if (!drag) return
              e.preventDefault()
              setTarget(`m:${m.id}`)
            }}
            onDrop={(e: React.DragEvent) => {
              if (e.dataTransfer.files.length) return (e.preventDefault(), addFromFiles(m.id, [...e.dataTransfer.files]))
              dropOn(m.id)
            }}>
            <header className="flex flex-wrap items-center gap-2">
              <span draggable onDragStart={() => setDrag({ kind: "module", id: m.id })} onDragEnd={() => (setDrag(null), setTarget(null))} aria-label={`Drag ${m.title} to reorder`} title="Drag to reorder" className="grid size-6 shrink-0 cursor-grab place-items-center rounded-a-sm text-a-text-3 hover:text-a-text-2">
                <GripVertical className="size-3.5" />
              </span>
              <button type="button" aria-expanded={open} aria-label={open ? "Collapse module" : "Expand module"} onClick={() => setClosed((c) => (open ? [...c, m.id] : c.filter((x) => x !== m.id)))} className="grid size-6 shrink-0 place-items-center rounded-a-sm text-a-text-3 outline-none hover:text-a-text-2 focus-visible:ring-2 focus-visible:ring-a-border-focus">
                <ChevronDown className={cn("size-4 transition-transform duration-300", !open && "-rotate-90")} />
              </button>
              {renaming === m.id ? (
                <input autoFocus defaultValue={m.title} aria-label="Module name" onBlur={(e) => (edit((c) => ({ ...c, modules: c.modules.map((x) => (x.id === m.id ? { ...x, title: e.target.value.trim() || x.title } : x)) })), setRenaming(null))} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="h-8 min-w-0 rounded-a-sm border border-a-border-strong bg-a-field px-2 t-heading-s text-a-text outline-none focus-visible:border-a-border-focus" />
              ) : (
                <h2 className="t-heading-s min-w-0 truncate text-a-text">
                  {mi + 1} · {m.title}
                </h2>
              )}
              <span className="t-caption whitespace-nowrap text-a-text-3">
                {m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"}
                {mins ? ` · ${fmtLength(mins)}` : ""}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <AdminButton hierarchy="secondary" size="sm" onClick={() => ((pickFor.current = m.id), picker.current?.click())}>
                  <UploadIcon /> Upload videos
                </AdminButton>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="sm" iconOnly aria-label={`More for ${m.title}`} />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => addLesson(m.id)}>
                      <Plus /> Add lesson
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRenaming(m.id)}>
                      <Pencil /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateModule(m)}>
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => removeModule(m)}>
                      <Trash2 /> Delete module
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </header>

            {open && (
              <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-5 lg:grid-cols-4">
                {m.lessons.map((l) => {
                  const mark = lessonMark(l, upOf(l.id))
                  return (
                    <ContextMenu key={l.id}>
                    <ContextMenuTrigger render={<li draggable onDragStart={(e) => (e.stopPropagation(), setDrag({ kind: "lesson", id: l.id }))} onDragEnd={() => (setDrag(null), setTarget(null))}
                      onDragOver={(e) => {
                        if (drag?.kind !== "lesson") return
                        e.preventDefault()
                        e.stopPropagation()
                        setTarget(`l:${l.id}`)
                      }}
                      onDrop={(e) => (e.stopPropagation(), dropOn(m.id, l.id))}
                      className={cn("group/lesson min-w-0", drag?.id === l.id && "opacity-40", target === `l:${l.id}` && drag?.kind === "lesson" && "rounded-a-md ring-2 ring-a-border-focus")} />}>
                      <LessonCard onClick={() => onOpen(l.id)} picture={<LessonThumb lesson={l} course={course} upload={upOf(l.id)} showTime={false} className="aspect-[1.78] w-full rounded-none border-0" />} time={l.minutes > 0 ? `${String(l.minutes).padStart(2, "0")}:00` : undefined} title={l.title} mark={mark?.text} markClassName={mark ? MARK_TONE[mark.tone] : undefined} />
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onOpen(l.id)}><Pencil /> Open</ContextMenuItem>
                      <ContextMenuItem onClick={() => duplicateLesson(m, l)}><Copy /> Duplicate</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem variant="destructive" onClick={() => removeLesson(l)}><Trash2 /> Delete lesson</ContextMenuItem>
                    </ContextMenuContent>
                    </ContextMenu>
                  )
                })}
                <li className="min-w-0">
                  <button type="button" onClick={() => addLesson(m.id)} className="flex aspect-[1.78] w-full flex-col items-center justify-center gap-1 rounded-a-md border border-dashed border-a-border-strong text-a-text-2 outline-none transition-colors duration-300 hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus">
                    <Plus className="size-4" aria-hidden />
                    <span className="t-body-m">Add lesson</span>
                    <span className="t-caption text-a-text-3">or drop videos here</span>
                  </button>
                </li>
              </ul>
            )}
          </Panel>
        )
      })}

      <AdminButton hierarchy="secondary" className="w-fit" onClick={addModule}>
        <Plus /> Add module
      </AdminButton>
      {course.modules.length === 0 && <p className="t-body-m text-a-text-2">No modules yet. A module groups lessons, like a chapter of a book.</p>}

      <input ref={picker} type="file" accept="video/*" multiple aria-label="Choose videos" className="sr-only" onChange={(e) => (pickFor.current && addFromFiles(pickFor.current, [...(e.target.files ?? [])]), (e.target.value = ""))} />
    </div>
  )
}

