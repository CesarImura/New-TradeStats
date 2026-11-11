"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, Copy, MoreHorizontal, Pencil, Plus, Trash2, Upload as UploadIcon } from "@/components/icons"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { allLessons, uid, type Course, type Lesson, type Module, type Status } from "@/lib/data/learning"
import { dropLine } from "@/components/kit/drop-line"
import { cn } from "@/lib/utils"
import { AdminButton, AdminSearch, Callout, EmptyState, LessonCard, Panel, ReorderHandle, SortHint, useMoveFeedback } from "../ui"
import { LessonSelectionBar } from "./lesson-selection-bar"
import { LessonThumb, MARK_TONE, fmtLength, lessonMark, type Upload } from "./course-parts"

/** One undo at a time: a new change replaces the last toast, so Undo always takes back the latest thing and never an older one with later work on top. */
const UNDO_TOAST = "curriculum-undo"

type Drag = { kind: "lesson" | "module"; id: string } | null

/** `id` moved into `toModule`, before the lesson `before` (or last). */
const moved = (c: Course, id: string, toModule: string, before: string | null): Course => {
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
}
/** Module `id` moved before the module `before` (or last). */
const modulesMoved = (c: Course, id: string, before: string): Course => {
  const m = c.modules.find((x) => x.id === id)
  if (!m) return c
  const rest = c.modules.filter((x) => x.id !== id)
  const i = rest.findIndex((x) => x.id === before)
  rest.splice(i < 0 ? rest.length : i, 0, m)
  return { ...c, modules: rest }
}

/** Content · 07 Curriculum + uploads: the course's main screen. Modules hold a grid of lesson thumbnails. */
export function Curriculum({ course, edit, uploads, onOpen, onUpload, onReview }: { course: Course; edit: (fn: (c: Course) => Course) => void; uploads: Upload[]; onOpen: (lessonId: string) => void; onUpload: (lessonId: string, file: File) => void; onReview: () => void }) {
  const [drag, setDrag] = useState<Drag>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [closed, setClosed] = useState<string[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [q, setQ] = useState("")
  const { flashed, moved: movedFeedback, Live } = useMoveFeedback()
  const picker = useRef<HTMLInputElement>(null)
  const pickFor = useRef<string | null>(null)

  const upOf = (id: string) => uploads.find((u) => u.lessonId === id)
  const failed = allLessons(course).filter((l) => upOf(l.id)?.phase === "failed")
  const noVideo = allLessons(course).filter((l) => !l.video && !upOf(l.id) && l.status !== "draft")

  /** Runs a change and offers to take it back: the whole course goes back to how it was. */
  const undoable = (message: string, change: (c: Course) => Course) => {
    let before: Course | null = null
    edit((c) => ((before = c), change(c)))
    toast(message, { id: UNDO_TOAST, action: { label: "Undo", onClick: () => before && edit(() => before!) } })
  }

  const total = allLessons(course).length
  const searching = q.trim().length > 0
  const matches = (l: Lesson) => l.title.toLowerCase().includes(q.trim().toLowerCase())
  const shownIn = (m: Module) => (searching ? m.lessons.filter(matches) : m.lessons)
  const found = searching ? course.modules.reduce((n, m) => n + shownIn(m).length, 0) : total
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  // Esc leaves the selection, from anywhere on the page.
  useEffect(() => {
    if (!picked.length) return
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog], [role=menu]") && setPicked([])
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [picked.length])
  // A lesson that no longer exists (deleted, undone away) cannot stay selected.
  const alive = picked.filter((id) => allLessons(course).some((l) => l.id === id))
  const selection = alive
  const moveSelected = (toModule: string) => {
    const ids = new Set(selection)
    const target = course.modules.find((m) => m.id === toModule)
    undoable(`${ids.size} ${ids.size === 1 ? "lesson" : "lessons"} moved to “${target?.title}”.`, (c) => {
      const moving = allLessons(c).filter((l) => ids.has(l.id))
      return { ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.id === toModule ? [...m.lessons.filter((l) => !ids.has(l.id)), ...moving] : m.lessons.filter((l) => !ids.has(l.id)) })) }
    })
    setPicked([])
  }
  const hideSelected = () => {
    const ids = new Set(selection)
    undoable(`${ids.size} ${ids.size === 1 ? "lesson" : "lessons"} hidden from students.`, (c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (ids.has(l.id) ? { ...l, status: "draft" as Status, freePreview: false } : l)) })) }))
    setPicked([])
  }
  const deleteSelected = () => {
    const ids = new Set(selection)
    undoable(`${ids.size} ${ids.size === 1 ? "lesson" : "lessons"} deleted.`, (c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((l) => !ids.has(l.id)) })) }))
    setPicked([])
  }

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
  /** One step up or down, for the keyboard and the menus (dragging is for the mouse). The moved card keeps focus. */
  const keep = useRef<string | null>(null)
  useEffect(() => {
    if (!keep.current) return
    // After a move the focus stays where it was: on the handle that was used, or on the card.
    const [kind, id] = keep.current.split(":")
    const sel = kind === "h" ? `[data-lesson="${id}"] [aria-label^="Reorder"]` : kind === "m" ? `[data-module="${id}"] [aria-label^="Reorder module"]` : `[data-lesson="${id}"] button, [data-lesson="${id}"] a`
    document.querySelector<HTMLElement>(sel)?.focus()
    keep.current = null
  })
  const stepModule = (m: Module, by: -1 | 1, viaHandle = false) => {
    const i = course.modules.findIndex((x) => x.id === m.id)
    const to = i + by
    if (to < 0 || to >= course.modules.length) return
    undoable(`“${m.title}” is now module ${to + 1}.`, (c) => modulesMoved(c, m.id, by < 0 ? course.modules[to].id : (course.modules[to + 1]?.id ?? "")))
    if (viaHandle) keep.current = `m:${m.id}`
    movedFeedback(m.id, `Module “${m.title}” moved to ${to + 1} of ${course.modules.length}.`)
  }
  const stepLesson = (m: Module, l: Lesson, by: -1 | 1, viaHandle = false) => {
    const i = m.lessons.findIndex((x) => x.id === l.id)
    const to = i + by
    if (to < 0 || to >= m.lessons.length) return
    keep.current = viaHandle ? `h:${l.id}` : `c:${l.id}`
    movedFeedback(l.id, `“${l.title}” moved to ${to + 1} of ${m.lessons.length} in “${m.title}”.`)
    undoable(`“${l.title}” is now lesson ${to + 1} of ${m.lessons.length}.`, (c) => moved(c, l.id, m.id, by < 0 ? m.lessons[to].id : (m.lessons[to + 1]?.id ?? null)))
  }
  /** Keys on a lesson card: Alt + arrows move it, X selects it (the mouse has drag and the checkbox). */
  const onLessonKey = (e: React.KeyboardEvent, m: Module, l: Lesson) => {
    const k = e.key.toLowerCase()
    if (e.altKey && (k === "arrowleft" || k === "arrowright") && !searching) {
      e.preventDefault()
      stepLesson(m, l, k === "arrowleft" ? -1 : 1)
    } else if (k === "x" && !e.altKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      toggle(l.id)
    }
  }
  /** A drop takes the place of the item it lands on (a drag forward goes after it, a drag back before it), as in the other sortable lists. */
  const edgeOf = (kind: "lesson" | "module", targetId: string): "before" | "after" => {
    if (!drag || drag.kind !== kind) return "before"
    if (kind === "module") return course.modules.findIndex((x) => x.id === drag.id) < course.modules.findIndex((x) => x.id === targetId) ? "after" : "before"
    const from = course.modules.find((x) => x.lessons.some((l) => l.id === drag.id))
    const into = course.modules.find((x) => x.lessons.some((l) => l.id === targetId))
    return from && into && from.id === into.id && from.lessons.findIndex((l) => l.id === drag.id) < from.lessons.findIndex((l) => l.id === targetId) ? "after" : "before"
  }
  const dropOn = (moduleId: string, lessonId?: string) => {
    if (drag?.kind === "lesson") {
      const into = course.modules.find((x) => x.id === moduleId)
      const at = lessonId && into ? into.lessons.findIndex((l) => l.id === lessonId) : -1
      const before = lessonId ? (edgeOf("lesson", lessonId) === "after" ? (into?.lessons[at + 1]?.id ?? null) : lessonId) : null
      const lesson = allLessons(course).find((l) => l.id === drag.id)
      undoable("Lesson moved.", (c) => moved(c, drag.id, moduleId, before))
      if (lesson) movedFeedback(lesson.id, `“${lesson.title}” moved to “${into?.title}”.`)
    } else if (drag?.kind === "module" && drag.id !== moduleId) {
      const at = course.modules.findIndex((x) => x.id === moduleId)
      const before = edgeOf("module", moduleId) === "after" ? (course.modules[at + 1]?.id ?? "") : moduleId
      const mod = course.modules.find((x) => x.id === drag.id)
      undoable("Module moved.", (c) => modulesMoved(c, drag.id, before))
      if (mod) movedFeedback(mod.id, `Module “${mod.title}” moved.`)
    }
    setDrag(null)
    setTarget(null)
  }
  const duplicateModule = (m: Module) => {
    const copy: Module = { id: uid("m"), title: `${m.title} (copy)`, lessons: m.lessons.map((l) => ({ ...structuredClone(l), id: uid("l"), status: "draft" as Status })) }
    edit((c) => ({ ...c, modules: c.modules.flatMap((x) => (x.id === m.id ? [x, copy] : [x])) }))
  }
  const removeModule = (m: Module) => undoable(`“${m.title}” deleted.`, (c) => ({ ...c, modules: c.modules.filter((x) => x.id !== m.id) }))
  const duplicateLesson = (m: Module, l: Lesson) => {
    const copy = { ...structuredClone(l), id: uid("l"), title: `${l.title} (copy)`, status: "draft" as Status }
    edit((c) => ({ ...c, modules: c.modules.map((x) => (x.id === m.id ? { ...x, lessons: x.lessons.flatMap((y) => (y.id === l.id ? [y, copy] : [y])) } : x)) }))
  }
  const removeLesson = (l: Lesson) => undoable(`“${l.title}” deleted.`, (c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((x) => x.id !== l.id) })) }))

  return (
    <div className="flex flex-col gap-4">
      {(failed.length > 0 || noVideo.length > 0) && (
        <Callout tone={failed.length ? "danger" : "warning"} action={<AdminButton hierarchy="secondary" size="md" onClick={() => (failed.length ? onOpen(failed[0].id) : onReview())}>Review</AdminButton>}>
          <span className="block truncate">
            {failed.length
              ? `Lesson ${allLessons(course).indexOf(failed[0]) + 1} · ${failed[0].title}: upload failed (connection lost at ${upOf(failed[0].id)?.pct ?? 0}%)`
              : `${noVideo.length} ${noVideo.length === 1 ? "lesson has" : "lessons have"} no video. Students won't see ${noVideo.length === 1 ? "it" : "them"}.`}
          </span>
        </Callout>
      )}

      <SortHint id="curriculum-sort-hint" keys="the arrow keys" />
      <Live />
      {total >= 8 && (
        <div className="flex flex-wrap items-center gap-3">
          <AdminSearch value={q} onChange={setQ} placeholder="Search lessons" label="Search lessons" className="w-full sm:w-72" />
          {searching && (
            <span role="status" className="t-caption text-a-text-2">
              {found} of {total} {total === 1 ? "lesson" : "lessons"}
            </span>
          )}
        </div>
      )}
      {searching && found === 0 && <EmptyState title={`No lesson matches “${q.trim()}”`} description="Check the spelling, or clear the search to see every module." actions={<AdminButton hierarchy="secondary" onClick={() => setQ("")}>Clear search</AdminButton>} />}

      {course.modules.map((m, mi) => {
        if (searching && shownIn(m).length === 0) return null
        const open = searching || !closed.includes(m.id)
        const mins = m.lessons.reduce((n, l) => n + l.minutes, 0)
        return (
          <Panel key={m.id} data-module={m.id} className={cn("gap-4 transition-colors duration-300", (drag?.id === m.id || flashed(m.id) || (target === `m:${m.id}` && drag?.kind === "lesson")) && "border-a-border-active", target === `m:${m.id}` && drag?.kind === "module" && drag.id !== m.id && dropLine(edgeOf("module", m.id)))}
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
              <ReorderHandle
                label={`Reorder module ${m.title}`}
                hintId="curriculum-sort-hint"
                onMove={(by) => stepModule(m, by, true)}
                draggable
                onDragStart={(e) => {
                  setDrag({ kind: "module", id: m.id })
                  e.dataTransfer.effectAllowed = "move"
                  const panel = e.currentTarget.closest("section")
                  if (panel) e.dataTransfer.setDragImage(panel, 24, 24)
                }}
                onDragEnd={() => (setDrag(null), setTarget(null))}
              />
              <button type="button" aria-expanded={open} aria-label={open ? "Collapse module" : "Expand module"} onClick={() => setClosed((c) => (open ? [...c, m.id] : c.filter((x) => x !== m.id)))} className="grid size-6 shrink-0 place-items-center rounded-a-sm text-a-text-3 outline-none hover:text-a-text-2 focus-visible:ring-2 focus-visible:ring-a-border-focus">
                <ChevronDown className={cn("size-4 transition-transform duration-300", !open && "-rotate-90")} />
              </button>
              {renaming === m.id ? (
                <input autoFocus defaultValue={m.title} aria-label="Module name" onBlur={(e) => {
                    const name = e.target.value.trim()
                    setRenaming(null)
                    if (!name || name === m.title) return
                    undoable(`Module renamed to “${name}”.`, (c) => ({ ...c, modules: c.modules.map((x) => (x.id === m.id ? { ...x, title: name } : x)) }))
                  }} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="h-8 min-w-0 rounded-a-sm border border-a-border-strong bg-a-field px-2 t-heading-s text-a-text outline-none focus-visible:border-a-border-focus" />
              ) : (
                <h2 className="t-heading-s min-w-0 truncate text-a-text">
                  {mi + 1} · {m.title}
                </h2>
              )}
              <span className="t-caption whitespace-nowrap text-a-text-3">
                {searching ? `${shownIn(m).length} of ${m.lessons.length}` : m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"}
                {mins ? ` · ${fmtLength(mins)}` : ""}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <AdminButton hierarchy="secondary" size="md" onClick={() => ((pickFor.current = m.id), picker.current?.click())}>
                  <UploadIcon /> Upload videos
                </AdminButton>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`More for ${m.title}`} />}>
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => addLesson(m.id)}>
                      <Plus /> Add lesson
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRenaming(m.id)}>
                      <Pencil /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={m.lessons.length === 0} onClick={() => setPicked(m.lessons.map((x) => x.id))}>
                      <Check /> Select lessons
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={mi === 0} onClick={() => stepModule(m, -1)}>
                      <ArrowUp /> Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={mi === course.modules.length - 1} onClick={() => stepModule(m, 1)}>
                      <ArrowDown /> Move down
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
              <ul className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 lg:grid-cols-4">
                {shownIn(m).map((l) => {
                  const mark = lessonMark(l, upOf(l.id))
                  const isPicked = selection.includes(l.id)
                  return (
                    <ContextMenu key={l.id}>
                    <ContextMenuTrigger render={<li draggable={!searching} data-lesson={l.id} data-picked={isPicked || undefined} onKeyDown={(e) => onLessonKey(e, m, l)} onDragStart={(e) => (e.stopPropagation(), setDrag({ kind: "lesson", id: l.id }))} onDragEnd={() => (setDrag(null), setTarget(null))}
                      onDragOver={(e) => {
                        if (drag?.kind !== "lesson") return
                        e.preventDefault()
                        e.stopPropagation()
                        setTarget(`l:${l.id}`)
                      }}
                      onDrop={(e) => (e.stopPropagation(), dropOn(m.id, l.id))}
                      className={cn("group/lesson relative min-w-0 rounded-a-md", drag?.id === l.id && "opacity-60", target === `l:${l.id}` && drag?.kind === "lesson" && drag.id !== l.id && dropLine(edgeOf("lesson", l.id), "x"))} />}>
                      <LessonCard selected={isPicked || flashed(l.id)} dragging={drag?.id === l.id} onClick={() => (selection.length ? toggle(l.id) : onOpen(l.id))} aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight X" picture={<LessonThumb lesson={l} course={course} upload={upOf(l.id)} showTime={false} className="aspect-[1.78] w-full rounded-none border-0" />} time={l.minutes > 0 ? `${String(l.minutes).padStart(2, "0")}:00` : undefined} title={l.title} mark={mark?.text} markClassName={mark ? MARK_TONE[mark.tone] : undefined} />
                                          <label
                        className={cn(
                          "absolute top-2 left-2 z-[2] grid size-7 cursor-pointer place-items-center rounded-a-sm bg-a-scrim transition-opacity duration-150 ease-out motion-reduce:transition-none",
                          isPicked || selection.length ? "opacity-100" : "opacity-0 group-hover/lesson:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
                        )}
                      >
                        <Checkbox checked={isPicked} onCheckedChange={() => toggle(l.id)} aria-label={`Select ${l.title}`} />
                      </label>
                      <ReorderHandle
                        label={`Reorder ${l.title}`}
                        hintId="curriculum-sort-hint"
                        keys="grid"
                        onMove={(by) => stepLesson(m, l, by, true)}
                        className={cn("absolute top-2 right-2 z-[2] bg-a-scrim transition-opacity", !searching ? "opacity-0 group-hover/lesson:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100" : "hidden")}
                      />
                      <span aria-hidden className="pointer-events-none absolute top-10 right-2 z-[2] hidden rounded-a-xs bg-a-scrim px-1.5 py-0.5 t-micro text-a-text group-has-[:focus-visible]/lesson:block">
                        Alt ← → move · X select
                      </span>
</ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onOpen(l.id)}><Pencil /> Open</ContextMenuItem>
                      <ContextMenuItem disabled={m.lessons[0]?.id === l.id} onClick={() => stepLesson(m, l, -1)}><ArrowLeft /> Move earlier</ContextMenuItem>
                      <ContextMenuItem disabled={m.lessons[m.lessons.length - 1]?.id === l.id} onClick={() => stepLesson(m, l, 1)}><ArrowRight /> Move later</ContextMenuItem>
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

      {selection.length > 0 && <LessonSelectionBar count={selection.length} modules={course.modules} onMove={moveSelected} onHide={hideSelected} onDelete={deleteSelected} onClear={() => setPicked([])} />}

      <input ref={picker} type="file" accept="video/*" multiple aria-label="Choose videos" className="sr-only" onChange={(e) => (pickFor.current && addFromFiles(pickFor.current, [...(e.target.files ?? [])]), (e.target.value = ""))} />
    </div>
  )
}

