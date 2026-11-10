"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, MoreHorizontal, Plus, Settings2, Trash2, Pencil, Upload } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton, Tag } from "@/components/admin/ui"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { STATUS_LABEL, allLessons, saveCatalog, uid, useCatalog, type Course, type Lesson, type Module, type Status } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { CourseSettings } from "./course-settings"
import { LessonEditor } from "./lesson-editor"
import { Tree, type Sel } from "./course-tree"
import { Tile } from "./thumbs"

const TONE: Record<Status, "success" | "neutral" | "warning"> = { published: "success", draft: "neutral", scheduled: "warning", archived: "neutral" }

/** Content 07 (course page), 08 (lesson), 09 chapters, 10 quiz, 11 settings drawer. */
export function CourseBuilder({ courseId }: { courseId: string }) {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const course = catalog.courses.find((c) => c.id === courseId)
  const [sel, setSel] = useState<Sel>({ kind: "course" })
  const [settings, setSettings] = useState(false)
  const [review, setReview] = useState(false)
  const [when, setWhen] = useState<"now" | "later">("now")
  const [tell, setTell] = useState({ platform: true, email: false, discord: false })
  const [saved, setSaved] = useState(false)

  if (!course) {
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="t-heading-m text-a-text">This course no longer exists</p>
        <AdminButton hierarchy="secondary" nativeButton={false} render={<Link href={`${base}/content`} />}>Back to Content</AdminButton>
      </div>
    )
  }

  const edit = (fn: (c: Course) => Course) => {
    saveCatalog(coach, (cat) => ({ ...cat, courses: cat.courses.map((x) => (x.id === courseId ? fn(x) : x)) }))
    setSaved(true)
  }
  const editLesson = (id: string, patch: Partial<Lesson>) =>
    edit((c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })) }))

  const lessons = allLessons(course)
  const lesson = sel.kind === "lesson" ? lessons.find((l) => l.id === sel.id) : undefined
  const studentUrl = `/c/${coach.slug}/courses/${course.id}${lesson ? `/${lesson.id}` : ""}?preview=draft`
  const minutes = lessons.reduce((n, l) => n + l.minutes, 0)
  const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, " ").trim()} min` : `${m} min`)
  const missing = lessons.filter((l) => !l.video)
  const tiers = course.tiers.length === 0 ? "All tiers" : coach.tiers.filter((t) => course.tiers.includes(t.id)).map((t) => t.name).join(", ")
  const cover = lessons.find((l) => l.thumbnail)?.thumbnail ?? course.cover

  const addLesson = (moduleId: string) => {
    const l: Lesson = { id: uid("l"), title: "New lesson", minutes: 0, status: "draft", chapters: [], downloads: [] }
    edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, l] } : m)) }))
    setSel({ kind: "lesson", id: l.id })
  }
  const addModule = () => edit((c) => ({ ...c, modules: [...c.modules, { id: uid("m"), title: `Module ${c.modules.length + 1}`, lessons: [] } as Module] }))
  const renameModule = (id: string, title: string) => edit((c) => ({ ...c, modules: c.modules.map((m) => (m.id === id ? { ...m, title } : m)) }))
  const removeModule = (id: string) => {
    let before: Course | null = null
    edit((c) => ((before = c), { ...c, modules: c.modules.filter((m) => m.id !== id) }))
    toast("Module deleted.", { action: { label: "Undo", onClick: () => before && edit(() => before!) } })
  }

  const saveLabel = <span className="t-caption text-a-text-3">{saved ? "All changes saved" : ""}</span>

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4">
      {lesson ? (
        <>
          <header className="flex flex-wrap items-center gap-3">
            <AdminButton hierarchy="secondary" iconOnly aria-label="Back to the course" onClick={() => setSel({ kind: "course" })}><ArrowLeft /></AdminButton>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="t-title-l text-a-text [overflow-wrap:anywhere]">{lesson.title}</h1>
              <p className="t-body-m text-a-text-2">
                {course.title} · Module {course.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id)) + 1} · Lesson {(course.modules.find((m) => m.lessons.some((l) => l.id === lesson.id))?.lessons.findIndex((l) => l.id === lesson.id) ?? 0) + 1}
              </p>
            </div>
            <span className="flex-1" />
            {saveLabel}
            <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={studentUrl} target="_blank" rel="noreferrer" />}><ExternalLink /> Preview as student</AdminButton>
          </header>
          <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-a-lg border border-a-border bg-a-panel">
              <Tree course={course} sel={sel} onSelect={setSel} edit={edit} hideSettings />
            </aside>
            <main className="min-w-0">
              <LessonEditor key={lesson.id} course={course} lesson={lesson} onChange={(p) => editLesson(lesson.id, p)} />
            </main>
          </div>
        </>
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-3">
            <AdminButton hierarchy="secondary" iconOnly aria-label="Back to Content" nativeButton={false} render={<Link href={`${base}/content`} />}><ArrowLeft /></AdminButton>
            <Tile src={cover} color={course.color} className="aspect-video h-10 shrink-0 rounded-a-sm" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <h1 className="t-title-l text-a-text [overflow-wrap:anywhere]">{course.title}</h1>
                <Tag tone={TONE[course.status]} dot>{STATUS_LABEL[course.status]}{course.status === "scheduled" && course.scheduledFor ? ` · ${course.scheduledFor}` : ""}</Tag>
              </div>
              <p className="t-body-m text-a-text-2">{course.modules.length} modules · {lessons.length} lessons · {fmt(minutes)} · {tiers}</p>
            </div>
            <span className="flex-1" />
            {saveLabel}
            <AdminButton hierarchy="secondary" onClick={() => setSettings(true)}><Settings2 /> Settings</AdminButton>
            <AdminButton hierarchy="secondary" nativeButton={false} render={<a href={studentUrl} target="_blank" rel="noreferrer" />}><ExternalLink /> Preview as student</AdminButton>
            {course.status === "published" ? (
              <AdminButton hierarchy="secondary" onClick={() => (edit((c) => ({ ...c, status: "draft" })), toast("Unpublished. Students no longer see this course."))}>Unpublish</AdminButton>
            ) : (
              <AdminButton onClick={() => setReview(true)}>Publish</AdminButton>
            )}
          </header>

          {missing.length > 0 && (
            <div role="status" className="flex items-center gap-3 rounded-a-lg border border-a-border bg-a-danger-soft px-4 py-2.5">
              <span aria-hidden className="size-1.5 rounded-full bg-a-danger-fill" />
              <p className="t-body-m flex-1 text-a-danger">{missing.length} {missing.length === 1 ? "lesson still needs" : "lessons still need"} a video: {missing[0].title}{missing.length > 1 ? ` and ${missing.length - 1} more` : ""}</p>
              <AdminButton hierarchy="secondary" size="sm" onClick={() => setSel({ kind: "lesson", id: missing[0].id })}>Review</AdminButton>
            </div>
          )}

          {course.modules.map((m, i) => (
            <ModuleCard key={m.id} index={i + 1} module={m} course={course} cover={course.cover}
              onOpen={(id) => setSel({ kind: "lesson", id })} onAdd={() => addLesson(m.id)} onRename={(t) => renameModule(m.id, t)} onDelete={() => removeModule(m.id)} />
          ))}
          <div>
            <AdminButton hierarchy="secondary" onClick={addModule}><Plus /> Add module</AdminButton>
          </div>
        </>
      )}

      <Dialog open={review} onOpenChange={setReview}>
        <DialogContent className="max-w-[600px] gap-0 p-0 sm:max-w-[600px]">
          <DialogHeader className="border-b border-a-border px-6 py-5">
            <DialogTitle className="t-heading-m text-a-text">Review and publish</DialogTitle>
            <DialogDescription className="t-body-m text-a-text-2">{course.title} · {lessons.length} lessons</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-2">
              <span className="t-mono-label-s text-a-text-3 uppercase">Heads up</span>
              {missing.length === 0 && <Check tone="success" title="Every lesson has a video" text="Nothing is hidden from students." />}
              {missing.map((l) => (
                <Check key={l.id} tone="warning" title={`${l.title} has no video`} text="Students won’t see this lesson" action={<AdminButton hierarchy="secondary" size="sm" onClick={() => (setReview(false), setSel({ kind: "lesson", id: l.id }))}>Fix</AdminButton>} />
              ))}
              <Check tone="success" title={`Access: ${tiers}`} text={`${course.tiers.length === 0 ? coach.tiers.reduce((n, t) => n + t.members, 0) : coach.tiers.filter((t) => course.tiers.includes(t.id)).reduce((n, t) => n + t.members, 0)} students can see it`} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="t-caption text-a-text">When</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(["now", "later"] as const).map((w) => (
                  <button key={w} type="button" onClick={() => setWhen(w)} className={cn("h-9 rounded-a-md border t-body-m outline-none", when === w ? "border-a-border-strong bg-a-selected text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover")}>
                    {w === "now" ? "Publish now" : "Schedule"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="t-caption text-a-text">Tell students</span>
              {([["platform", "On the platform"], ["email", "By e-mail"], ["discord", "In Discord"]] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2.5 t-body-m text-a-text">
                  <Checkbox checked={tell[k]} onCheckedChange={(v) => setTell({ ...tell, [k]: !!v })} /> {label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter className="m-0 flex-row items-center gap-2 rounded-none bg-transparent border-t border-a-border px-6 py-4 sm:justify-between">
            <AdminButton hierarchy="secondary" onClick={() => (setReview(false), toast("Saved as a draft."))}>Save as draft</AdminButton>
            <div className="flex items-center gap-2">
              <AdminButton hierarchy="ghost" onClick={() => setReview(false)}>Cancel</AdminButton>
              <AdminButton
                onClick={() => {
                  edit((c) => ({ ...c, status: when === "now" ? "published" : "scheduled", scheduledFor: when === "later" ? c.scheduledFor ?? "Thu 29 Oct" : c.scheduledFor }))
                  setReview(false)
                  toast.success(when === "now" ? "Published. Students with access see it now." : "Scheduled.")
                }}
              >
                Publish to {course.tiers.length === 0 ? coach.tiers.reduce((n, t) => n + t.members, 0) : coach.tiers.filter((t) => course.tiers.includes(t.id)).reduce((n, t) => n + t.members, 0)} students
              </AdminButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={settings} onOpenChange={setSettings}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader><SheetTitle>Course settings</SheetTitle></SheetHeader>
          <div className="px-4 pb-8"><CourseSettings course={course} edit={edit} /></div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ModuleCard({ index, module: m, course, cover, onOpen, onAdd, onRename, onDelete }: { index: number; module: Module; course: Course; cover?: string; onOpen: (id: string) => void; onAdd: () => void; onRename: (t: string) => void; onDelete: () => void }) {
  const [renaming, setRenaming] = useState(false)
  const mins = m.lessons.reduce((n, l) => n + l.minutes, 0)
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-a-lg border border-a-border bg-a-panel p-5">
      <header className="flex items-center gap-3">
        {renaming ? (
          <input autoFocus defaultValue={m.title} aria-label="Module name" onBlur={(e) => (onRename(e.target.value.trim() || m.title), setRenaming(false))}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="t-heading-m h-8 rounded-a-sm bg-a-field px-2 text-a-text outline-none ring-1 ring-a-border-focus" />
        ) : (
          <h2 className="t-heading-m text-a-text">{index} · {m.title}</h2>
        )}
        <span className="t-caption text-a-text-3">{m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"}{mins ? ` · ${mins} min` : ""}</span>
        <span className="flex-1" />
        <AdminButton hierarchy="secondary" size="md" onClick={onAdd}><Upload /> Upload videos</AdminButton>
        <DropdownMenu>
          <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" iconOnly size="md" aria-label={`${m.title} actions`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setRenaming(true)}><Pencil /> Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}><Trash2 /> Delete module</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {m.lessons.map((l) => (
          <button key={l.id} type="button" onClick={() => onOpen(l.id)} className="group flex min-w-0 flex-col gap-2 text-left outline-none">
            <Tile src={l.thumbnail ?? cover} color={course.color} className="aspect-video w-full rounded-a-md border border-a-border transition-colors group-hover:border-a-border-strong group-focus-visible:ring-2 group-focus-visible:ring-a-border-focus">
              <span className="absolute bottom-2 right-2 rounded-a-xs bg-black/60 px-1.5 py-0.5 t-mono-label-s text-a-text-2">{l.minutes ? `${String(l.minutes).padStart(2, "0")}:00` : "--:--"}</span>
              {l.status !== "published" && <span className="absolute left-2 top-2"><Tag tone={TONE[l.status]} dot>{STATUS_LABEL[l.status]}</Tag></span>}
            </Tile>
            <span className="t-body-m truncate text-a-text">{l.title}</span>
            {!l.video && <span className="t-caption -mt-1 text-a-warning">No video yet</span>}
          </button>
        ))}
        <button type="button" onClick={onAdd} className={cn("flex aspect-video flex-col items-center justify-center gap-1 rounded-a-md border border-dashed border-a-border-strong t-body-m text-a-text-2 outline-none transition-colors hover:bg-a-hover hover:text-a-text focus-visible:ring-2 focus-visible:ring-a-border-focus")}>
          <Plus /> Add lesson
          <span className="t-caption text-a-text-3">or drop videos here</span>
        </button>
      </div>
    </section>
  )
}

function Check({ tone, title, text, action }: { tone: "success" | "warning" | "danger"; title: string; text: string; action?: React.ReactNode }) {
  const dot = { success: "bg-a-success-fill", warning: "bg-a-warning-fill", danger: "bg-a-danger-fill" }[tone]
  return (
    <div className="flex items-center gap-3 rounded-a-md border border-a-border px-3 py-2.5">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />
      <div className="grid min-w-0 flex-1">
        <span className="t-body-m text-a-text">{title}</span>
        <span className="t-caption text-a-text-2">{text}</span>
      </div>
      {action}
    </div>
  )
}
