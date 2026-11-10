"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Minus, Plus, Settings } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { allLessons, saveCatalog, uid, useCatalog, type Course, type Lesson, type Status } from "@/lib/data/learning"
import { videoFrames } from "@/lib/video-frames"
import { cn } from "@/lib/utils"
import { AdminButton, AdminProgress, Tag } from "../ui"
import { Curriculum } from "./curriculum"
import { CourseCover, PHASE_LABEL, fmtLength, minutesOf, uploadQueue, type Upload } from "./course-parts"
import { CourseSettingsDrawer } from "./course-settings"
import { LessonPage } from "./lesson-page"
import { PublishReview } from "./publish-review"
import { StudentPreview } from "./student-preview"

type View = { k: "outline" } | { k: "lesson"; id: string } | { k: "preview"; id: string }
const AI_CHAPTERS = ["Intro", "The idea", "On the chart", "Common mistakes", "Recap"]
const tone = (s: Status) => (s === "published" ? "success" : s === "scheduled" ? "warning" : "neutral")

/** Course builder, as the Figma "Content" flow: curriculum (07), lesson (08 to 10), settings (11), publish review (12), preview (13). */
export function CourseBuilder({ courseId }: { courseId: string }) {
  const { coach, base } = useCoach()
  const router = useRouter()
  const catalog = useCatalog(coach)
  const course = catalog.courses.find((c) => c.id === courseId)
  const [view, setView] = useState<View>({ k: "outline" })
  const [saved, setSaved] = useState(true)
  const [settings, setSettings] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [tray, setTray] = useState(true)
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  useEffect(() => { const t = timers.current; return () => t.forEach(clearTimeout) }, [])

  const edit = useCallback((fn: (c: Course) => Course) => {
    saveCatalog(coach, (cat) => ({ ...cat, courses: cat.courses.map((x) => (x.id === courseId ? { ...fn(x), edited: "just now" } : x)) }))
    setSaved(true)
  }, [coach, courseId])
  const editLesson = useCallback((id: string, patch: Partial<Lesson>) => edit((c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })) })), [edit])
  const patchUpload = (id: string, patch: Partial<Upload>) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const later = (fn: () => void, ms: number) => { const t = setTimeout(() => (timers.current.delete(t), fn()), ms); timers.current.add(t) }

  /** A video going up: progress, then the transcript and AI chapters. The same bar shows in the tray and on the lesson. */
  const startUpload = async (lessonId: string, file: File) => {
    if (!file.type.startsWith("video/")) return void toast.error("This file isn't a video. Use an MP4, MOV or WebM.")
    const lesson = course && allLessons(course).find((l) => l.id === lessonId)
    let minutes = lesson?.minutes || 16
    let thumb: string | undefined
    try {
      const { frames, seconds } = await videoFrames(file)
      minutes = Math.max(1, Math.round(seconds / 60))
      thumb = lesson?.thumbnail ? undefined : frames[Math.floor(frames.length / 2)]
    } catch {
      // A video this browser can't read is still uploaded; it just has no frames to pick from.
    }
    const id = uid("u")
    setUploads((u) => [...u.filter((x) => x.lessonId !== lessonId), { id, lessonId, title: lesson?.title ?? file.name, phase: "uploading", pct: 0 }])
    setTray(true)
    const tick = (pct: number) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return patchUpload(id, { phase: "failed", pct })
      if (pct < 100) { patchUpload(id, { pct }); return later(() => tick(Math.min(100, pct + 9)), 180) }
      patchUpload(id, { pct: 100, phase: "transcribing" })
      editLesson(lessonId, { video: file.name, minutes, ...(thumb ? { thumbnail: thumb } : {}) })
      later(() => {
        patchUpload(id, { phase: "chapters" })
        later(() => {
          patchUpload(id, { phase: "ready" })
          edit((c) => ({ ...c, modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === lessonId && !l.chapters.length ? { ...l, chapters: AI_CHAPTERS.map((title, i) => ({ at: Math.round(((minutes * 60) / AI_CHAPTERS.length) * i), title, ai: true })) } : l)) })) }))
          toast.success("Video ready. AI added chapters and a transcript.")
        }, 1000)
      }, 1200)
    }
    tick(0)
  }

  // Videos picked in New course start going up as soon as the builder opens.
  const queued = course ? uploadQueue.get(course.id) : undefined
  useEffect(() => {
    if (!queued) return
    uploadQueue.delete(courseId)
    queued.forEach((q) => void startUpload(q.lessonId, q.file))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queued, courseId])

  if (!course) {
    return (
      <div className="grid place-items-center gap-3 py-24 text-center">
        <p className="t-heading-m text-a-text">This course no longer exists</p>
        <AdminButton hierarchy="secondary" nativeButton={false} render={<Link href={`${base}/content`} />}>Back to Content</AdminButton>
      </div>
    )
  }

  const lessons = allLessons(course)
  const current = view.k === "outline" ? undefined : lessons.find((l) => l.id === view.id)
  const first = lessons.find((l) => l.status === "published") ?? lessons[0]
  const tiers = course.tiers.length ? coach.tiers.filter((t) => course.tiers.includes(t.id)).map((t) => t.name).join(", ") : "All tiers"
  const publishNow = (o: { when: "now" | "later"; date: string; channels: string[] }) => {
    edit((c) => ({ ...c, status: o.when === "later" ? "scheduled" : "published", scheduledFor: o.when === "later" ? o.date : c.scheduledFor }))
    toast.success(o.when === "later" ? `Scheduled for ${o.date}.` : `Published.${o.channels.length ? ` Students are told ${o.channels.join(", ").replace("app", "on the platform").replace("email", "by e-mail").replace("discord", "in Discord")}.` : ""}`)
  }

  const header = (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <AdminButton hierarchy="secondary" size="xl" iconOnly aria-label="Back to Content" nativeButton={false} render={<Link href={`${base}/content`} />}><ArrowLeft /></AdminButton>
      <CourseCover course={course} className="h-10 w-16 shrink-0 rounded-a-sm border border-a-border" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h1 className="t-heading-xl truncate text-a-text">{course.title}</h1>
          <Tag tone={tone(course.status)} dot>{course.status === "scheduled" && course.scheduledFor ? `Scheduled · ${course.scheduledFor}` : course.status}</Tag>
        </div>
        <p className="t-body-m text-a-text-2">{course.modules.length} {course.modules.length === 1 ? "module" : "modules"} · {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}{minutesOf(course) > 0 ? ` · ${fmtLength(minutesOf(course))}` : ""} · {course.soldSeparately ? "Sold on its own" : tiers}</p>
      </div>
      <span className="t-caption text-a-text-3">{saved ? "All changes saved" : ""}</span>
      <AdminButton hierarchy="secondary" onClick={() => setSettings(true)}><Settings /> Settings</AdminButton>
      <AdminButton hierarchy="secondary" disabled={!first} onClick={() => first && setView({ k: "preview", id: first.id })}><ExternalLink /> Preview as student</AdminButton>
      {course.status !== "published" && <AdminButton onClick={() => setPublishing(true)}>Publish</AdminButton>}
    </header>
  )

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      {view.k === "outline" && (
        <>
          {header}
          <Curriculum course={course} edit={edit} uploads={uploads} onOpen={(id) => setView({ k: "lesson", id })} onUpload={startUpload} onReview={() => setPublishing(true)} />
        </>
      )}
      {view.k === "lesson" && current && (
        <LessonPage key={current.id} course={course} lesson={current} upload={uploads.find((u) => u.lessonId === current.id)} saved={saved} onChange={(p) => editLesson(current.id, p)} onPick={(f) => startUpload(current.id, f)} onBack={() => setView({ k: "outline" })} onSelect={(id) => setView({ k: "lesson", id })} onPreview={() => setView({ k: "preview", id: current.id })} />
      )}
      {view.k === "preview" && current && (
        <StudentPreview course={course} lesson={current} onSelect={(id) => setView({ k: "preview", id })} onEdit={() => setView({ k: "lesson", id: current.id })} onExit={() => setView({ k: "outline" })} />
      )}
      {view.k !== "outline" && !current && <p className="t-body-m text-a-text-2">That lesson no longer exists.</p>}

      <CourseSettingsDrawer
        course={course}
        open={settings}
        onOpenChange={setSettings}
        edit={edit}
        onPublish={() => (setSettings(false), setPublishing(true))}
        onReviewAccess={() => (setSettings(false), setPublishing(true))}
        onDuplicate={() => {
          const copy: Course = { ...structuredClone(course), id: uid("c"), title: `${course.title} (copy)`, status: "draft", scheduledFor: undefined }
          saveCatalog(coach, (cat) => ({ ...cat, courses: [...cat.courses, copy] }))
          setSettings(false)
          toast("Duplicated as a draft.", { action: { label: "Open", onClick: () => router.push(`${base}/content/${copy.id}`) } })
        }}
        onDelete={() => (saveCatalog(coach, (cat) => ({ ...cat, courses: cat.courses.filter((c) => c.id !== course.id) })), toast("Course deleted."), router.push(`${base}/content`))}
      />
      <PublishReview course={course} uploads={uploads} open={publishing} onOpenChange={setPublishing} onOpenUploads={() => (setTray(true), setView({ k: "outline" }))} onOpenLesson={(id) => setView({ k: "lesson", id })} onPublish={publishNow} onSaveDraft={() => (edit((c) => ({ ...c, status: "draft" })), toast("Saved as a draft."))} />
      <UploadTray uploads={uploads} open={tray} setOpen={setTray} onClear={() => setUploads((u) => u.filter((x) => x.phase !== "ready"))} />
    </div>
  )
}

/** The uploads bar (340 px, bottom right): what is going up, and what is done. */
function UploadTray({ uploads, open, setOpen, onClear }: { uploads: Upload[]; open: boolean; setOpen: (o: boolean) => void; onClear: () => void }) {
  if (!uploads.length) return null
  const ready = uploads.filter((u) => u.phase === "ready").length
  const left = uploads.reduce((n, u) => n + (u.phase === "ready" || u.phase === "failed" ? 0 : (100 - u.pct) / 100 + (u.phase === "uploading" ? 0.2 : 0)), 0)
  return (
    <aside aria-label="Uploads" className="fixed right-4 bottom-16 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-a-lg border border-a-border-strong bg-a-panel shadow-[0_8px_32px_rgb(0_0_0/0.5)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid min-w-0 flex-1">
          <span className="t-body-m text-a-text">{ready} of {uploads.length} ready</span>
          <span className="t-caption text-a-text-2">{ready === uploads.length ? "All done" : left > 0 ? `about ${Math.max(1, Math.round(left))} min left` : "Needs your attention"}</span>
        </div>
        {ready > 0 && ready === uploads.length && <AdminButton hierarchy="ghost" size="sm" onClick={onClear}>Clear</AdminButton>}
        <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label={open ? "Minimise uploads" : "Show uploads"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <Minus /> : <Plus />}</AdminButton>
      </div>
      {open && (
        <ul className="grid max-h-72 gap-3.5 overflow-y-auto border-t border-a-border-subtle px-4 py-3">
          {uploads.map((u) => (
            <li key={u.id} className="grid gap-1.5">
              <div className="flex items-baseline gap-3 t-body-m">
                <span className="min-w-0 flex-1 truncate text-a-text">{u.title}</span>
                <span className={cn("t-caption", u.phase === "failed" ? "text-a-danger" : u.phase === "ready" ? "text-a-success" : "text-a-text-2")}>{u.phase === "uploading" ? `Uploading ${u.pct}%` : u.phase === "failed" ? `Failed at ${u.pct}%` : PHASE_LABEL[u.phase]}</span>
              </div>
              <AdminProgress label={u.title} tone={u.phase === "failed" ? "danger" : u.phase === "ready" ? "success" : "accent"} value={u.phase === "uploading" || u.phase === "failed" ? u.pct : 100} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
