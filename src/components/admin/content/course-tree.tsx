"use client"

import { useState } from "react"
import { ChevronDown, CircleHelp, Copy, GripVertical, Pencil, Plus, Settings2, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { STATUS_LABEL, allLessons, uid, type Course, type Lesson, type Module, type Status } from "@/lib/data/learning"
import { dropLine } from "@/components/kit/drop-line"
import { cn } from "@/lib/utils"
import { STATUS_DOT } from "./content-board"
import { Tile } from "./thumbs"

export type Sel = { kind: "course" } | { kind: "lesson"; id: string }
type Drag = { kind: "lesson" | "module"; id: string } | null

export function Tree({ course, sel, onSelect, edit, hideSettings }: { course: Course; sel: Sel; onSelect: (s: Sel) => void; edit: (fn: (c: Course) => Course) => void; hideSettings?: boolean }) {
  const [drag, setDrag] = useState<Drag>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [closed, setClosed] = useState<string[]>([])

  const moveLesson = (id: string, toModule: string, before: string | null) =>
    edit((c) => {
      const l = allLessons(c).find((x) => x.id === id)!
      const modules = c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((x) => x.id !== id) }))
      return {
        ...c,
        modules: modules.map((m) => {
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
      const m = c.modules.find((x) => x.id === id)!
      const rest = c.modules.filter((x) => x.id !== id)
      const i = rest.findIndex((x) => x.id === before)
      rest.splice(i < 0 ? rest.length : i, 0, m)
      return { ...c, modules: rest }
    })

  const rename = (id: string, title: string) =>
    edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === id ? { ...m, title } : { ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, title } : l)) })) }))
  const addLesson = (moduleId: string) => {
    const l: Lesson = { id: uid("l"), title: "New lesson", minutes: 0, status: "draft", chapters: [], downloads: [] }
    edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, l] } : m)) }))
    onSelect({ kind: "lesson", id: l.id })
    setRenaming(l.id)
  }
  const addModule = () => {
    const m: Module = { id: uid("m"), title: `Module ${course.modules.length + 1}`, lessons: [] }
    edit((c) => ({ ...c, modules: [...c.modules, m] }))
    setRenaming(m.id)
  }
  const duplicateLesson = (m: Module, l: Lesson) => {
    const copy = { ...structuredClone(l), id: uid("l"), title: `${l.title} (copy)`, status: "draft" as Status }
    edit((c) => ({ ...c, modules: c.modules.map((x) => (x.id === m.id ? { ...x, lessons: x.lessons.flatMap((y) => (y.id === l.id ? [y, copy] : [y])) } : x)) }))
  }
  const duplicateModule = (m: Module) => {
    const copy: Module = { id: uid("m"), title: `${m.title} (copy)`, lessons: m.lessons.map((l) => ({ ...structuredClone(l), id: uid("l"), status: "draft" as Status })) }
    edit((c) => ({ ...c, modules: c.modules.flatMap((x) => (x.id === m.id ? [x, copy] : [x])) }))
  }
  const remove = (id: string, label: string) => {
    let before: Course | null = null
    edit((c) => {
      before = c
      return { ...c, modules: c.modules.filter((m) => m.id !== id).map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.id !== id) })) }
    })
    if (sel.kind === "lesson" && sel.id === id) onSelect({ kind: "course" })
    toast(`${label} deleted.`, { action: { label: "Undo", onClick: () => before && edit(() => before!) } })
  }

  const dropOn = (kind: "module" | "lesson", moduleId: string, lessonId?: string) => {
    if (!drag) return
    if (drag.kind === "lesson") moveLesson(drag.id, moduleId, lessonId ?? null)
    else if (kind === "module" && drag.id !== moduleId) moveModule(drag.id, moduleId)
    setDrag(null)
    setTarget(null)
  }

  return (
    <div className="grid gap-1 p-3 [&_*]:min-w-0">
      {!hideSettings && (
      <button
        onClick={() => onSelect({ kind: "course" })}
        className={cn("flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted", sel.kind === "course" && "bg-background font-medium shadow-xs ring-1 ring-border")}
      >
        <Settings2 className="size-4 text-muted-foreground" /> Course settings
      </button>
      )}
      <div className="mt-2 mb-1 flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span>
          {course.modules.length} modules · {allLessons(course).length} lessons
        </span>
        {!hideSettings && <span>Drag to reorder</span>}
      </div>

      {course.modules.map((m) => {
        const open = !closed.includes(m.id)
        return (
          <div key={m.id} className={cn("rounded-lg", drag?.id === m.id && "opacity-50")}>
            <ContextMenu>
              <ContextMenuTrigger
                render={
                  <div
                    draggable={renaming !== m.id}
                    onDragStart={(e) => (e.stopPropagation(), setDrag({ kind: "module", id: m.id }))}
                    onDragEnd={() => (setDrag(null), setTarget(null))}
                    onDragOver={(e) => {
                      if (!drag) return
                      e.preventDefault()
                      setTarget(`m:${m.id}`)
                    }}
                    onDrop={() => dropOn("module", m.id)}
                    className={cn("group flex items-center gap-1 rounded-md px-1 py-1.5 hover:bg-muted", target === `m:${m.id}` && (drag?.kind === "module" ? dropLine("before") : "bg-primary/10"))}
                  />
                }
              >
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground/60" />
                <button onClick={() => setClosed((c) => (open ? [...c, m.id] : c.filter((x) => x !== m.id)))} aria-label={open ? "Collapse" : "Expand"} className="rounded p-0.5 hover:bg-background">
                  <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
                </button>
                <Tile src={m.lessons.find((l) => l.thumbnail)?.thumbnail ?? course.cover} color={course.color} className={cn("aspect-video w-9 shrink-0 rounded", hideSettings && "hidden")} />
                {renaming === m.id ? (
                  <RenameInput value={m.title} onDone={(v) => (v && rename(m.id, v), setRenaming(null))} />
                ) : (
                  <span className="flex-1 truncate text-sm font-medium" onDoubleClick={() => setRenaming(m.id)}>
                    {m.title}
                  </span>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">{m.lessons.length}</span>
                <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100" aria-label={`Add lesson to ${m.title}`} onClick={() => addLesson(m.id)}>
                  <Plus />
                </Button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                <ContextMenuItem onClick={() => setRenaming(m.id)}>
                  <Pencil /> Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => addLesson(m.id)}>
                  <Plus /> Add lesson
                </ContextMenuItem>
                <ContextMenuItem onClick={() => duplicateModule(m)}>
                  <Copy /> Duplicate
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onClick={() => remove(m.id, m.title)}>
                  <Trash2 /> Delete module
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {open && (
              <div className="ml-4 grid border-l pl-2">
                {m.lessons.map((l) => (
                  <ContextMenu key={l.id}>
                    <ContextMenuTrigger
                      render={
                        <div
                          draggable={renaming !== l.id}
                          onDragStart={(e) => (e.stopPropagation(), setDrag({ kind: "lesson", id: l.id }))}
                          onDragEnd={() => (setDrag(null), setTarget(null))}
                          onDragOver={(e) => {
                            if (drag?.kind !== "lesson") return
                            e.preventDefault()
                            e.stopPropagation()
                            setTarget(`l:${l.id}`)
                          }}
                          onDrop={(e) => (e.stopPropagation(), dropOn("lesson", m.id, l.id))}
                          onClick={() => onSelect({ kind: "lesson", id: l.id })}
                          className={cn(
                            "group relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                            sel.kind === "lesson" && sel.id === l.id && "bg-background shadow-xs ring-1 ring-border",
                            drag?.id === l.id && "opacity-50",
                            target === `l:${l.id}` && dropLine("before"),
                          )}
                        />
                      }
                    >
                      <Tile src={l.thumbnail ?? course.cover} color={course.color} className={cn("aspect-video w-8 shrink-0 rounded", hideSettings && "hidden")} />
                      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[l.status])} title={STATUS_LABEL[l.status]} />
                      {renaming === l.id ? (
                        <RenameInput value={l.title} onDone={(v) => (v && rename(l.id, v), setRenaming(null))} />
                      ) : (
                        <span className="min-w-0 flex-1 truncate" onDoubleClick={() => setRenaming(l.id)}>
                          {l.title}
                        </span>
                      )}
                      {l.quiz && <CircleHelp className="size-3 text-muted-foreground" />}
                      {!l.video && <span className="text-[0.6875rem] text-amber-600">no video</span>}
                      <span className="text-xs text-muted-foreground tabular-nums">{l.minutes ? `${l.minutes}′` : ""}</span>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-44">
                      <ContextMenuItem onClick={() => setRenaming(l.id)}>
                        <Pencil /> Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => duplicateLesson(m, l)}>
                        <Copy /> Duplicate
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem variant="destructive" onClick={() => remove(l.id, l.title)}>
                        <Trash2 /> Delete lesson
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                {/* Drop at the end of a module */}
                <div
                  onDragOver={(e) => {
                    if (drag?.kind !== "lesson") return
                    e.preventDefault()
                    setTarget(`end:${m.id}`)
                  }}
                  onDrop={() => dropOn("lesson", m.id)}
                  className={cn(drag?.kind === "lesson" ? "h-6" : "h-0", target === `end:${m.id}` && dropLine("before"))}
                />
                {m.lessons.length === 0 && !drag && <span className="px-2 py-1 text-xs text-muted-foreground">Empty. Add a lesson or drag one here.</span>}
              </div>
            )}
          </div>
        )
      })}

      <Button variant="ghost" size="sm" className="mt-1 justify-start text-muted-foreground" onClick={addModule}>
        <Plus /> Add module
      </Button>
      <p className="mt-2 px-2 text-xs text-muted-foreground">Double-click to rename. Right-click for more.</p>
    </div>
  )
}

function RenameInput({ value, onDone }: { value: string; onDone: (v: string) => void }) {
  const [v, setV] = useState(value)
  return (
    <input
      autoFocus
      value={v}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onDone(v.trim())}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDone(v.trim())
        if (e.key === "Escape") onDone("")
      }}
      onClick={(e) => e.stopPropagation()}
      className="h-6 min-w-0 flex-1 rounded border bg-background px-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
    />
  )
}
