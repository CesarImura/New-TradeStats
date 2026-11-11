"use client"

import { useEffect, useState } from "react"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { allLessons, type Course } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminModal, AdminSegmented } from "../ui"
import { dayLabel, localIso, type Upload } from "./course-parts"

type Item = { tone: "danger" | "warning" | "success"; title: string; text: string; action?: { label: string; run: () => void } }
const DOT = { danger: "bg-a-danger-fill", warning: "bg-a-warning-fill", success: "bg-a-success-fill" } as const

/** Content · 12 Publish review: what blocks publishing, what to know, when, and who hears about it. */
export function PublishReview({ course, uploads, open, onOpenChange, onOpenUploads, onOpenLesson, onPublish, onSaveDraft }: { course: Course; uploads: Upload[]; open: boolean; onOpenChange: (o: boolean) => void; onOpenUploads: () => void; onOpenLesson: (id: string, tab?: "quiz") => void; onPublish: (o: { when: "now" | "later"; date: string; at: string; channels: string[] }) => void; onSaveDraft: () => void }) {
  const { coach } = useCoach()
  const lessons = allLessons(course)
  const [when, setWhen] = useState<"now" | "later">("now")
  // The day and time it goes live: what was set before, else tomorrow morning.
  const [first] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return course.scheduledAt ?? localIso(d)
  })
  const [day, setDay] = useState(first.slice(0, 10))
  const [time, setTime] = useState(first.slice(11, 16))
  const at = `${day}T${time}`
  // "Now" moves on while the dialog stays open, so a time that was ahead can pass.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(id)
  }, [])
  const valid = !Number.isNaN(new Date(at).getTime()) && new Date(at).getTime() > now
  const date = valid ? dayLabel(at) : "…"
  const [channels, setChannels] = useState({ app: true, email: true, discord: false })

  const uploading = uploads.filter((u) => u.phase !== "ready" && u.phase !== "failed")
  const failed = uploads.filter((u) => u.phase === "failed")
  const noVideo = lessons.filter((l) => !l.video && !uploads.some((u) => u.lessonId === l.id))
  const badQuiz = lessons.filter((l) => l.quiz?.questions.some((q) => !q.q.trim() || q.options.some((o) => !o.trim())))
  const tiers = course.tiers.length ? coach.tiers.filter((t) => course.tiers.includes(t.id)) : coach.tiers
  const students = tiers.reduce((n, t) => n + t.members, 0)

  const blocks: Item[] = [
    ...(uploading.length ? [{ tone: "danger" as const, title: `${uploading.length} ${uploading.length === 1 ? "video" : "videos"} still uploading`, text: "Wait or remove them from the course", action: { label: "Open uploads", run: onOpenUploads } }] : []),
    ...failed.map((u) => ({ tone: "danger" as const, title: `${u.title}: upload failed`, text: "Upload it again or remove the lesson", action: { label: "Open lesson", run: () => onOpenLesson(u.lessonId) } })),
  ]
  const heads: Item[] = [
    ...noVideo.slice(0, 3).map((l) => ({ tone: "warning" as const, title: `${l.title} has no video`, text: "Students won't see this lesson", action: { label: "Open", run: () => onOpenLesson(l.id) } })),
    ...badQuiz.slice(0, 2).map((l) => ({ tone: "warning" as const, title: `Quiz in ${l.title} has empty questions or answers`, text: "Hidden until you fill them in", action: { label: "Fix", run: () => onOpenLesson(l.id, "quiz") } })),
    { tone: "success" as const, title: `Access: ${course.tiers.length ? tiers.map((t) => t.name).join(", ") : "every tier"}`, text: `${students} students can see it` },
  ]
  const blocked = blocks.length > 0
  const list = (items: Item[], quiet = false) => (
    <ul className="grid gap-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex min-h-14 items-center gap-3 py-2.5">
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[it.tone])} />
          <span className="grid min-w-0 flex-1">
            <span className="t-body-m text-a-text">{it.title}</span>
            <span className="t-caption text-a-text-2">{it.text}</span>
          </span>
          {it.action && <AdminButton hierarchy={quiet ? "ghost" : "secondary"} size="md" onClick={() => (onOpenChange(false), it.action!.run())}>{it.action.label}</AdminButton>}
        </li>
      ))}
    </ul>
  )

  return (
    <AdminModal open={open} onOpenChange={onOpenChange} title="Review and publish" subtitle={`${course.title} · ${lessons.length} lessons`} className="sm:max-w-[600px]" bodyClassName="gap-5"
      footer={
        <>
          <AdminButton hierarchy="ghost" onClick={() => (onSaveDraft(), onOpenChange(false))}>Save as draft</AdminButton>
          <span className="flex-1" />
          <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>Cancel</AdminButton>
          <AdminButton disabled={blocked || (when === "later" && !valid)} onClick={() => (onPublish({ when, date, at, channels: Object.entries(channels).filter(([, v]) => v).map(([k]) => k) }), onOpenChange(false))}>
            {when === "later" ? `Schedule for ${date}` : `Publish to ${students} students`}
          </AdminButton>
        </>
      }>
      {blocked && (
        <section className="grid gap-1.5">
          <h3 className="t-mono-label text-a-text-3">Blocks publishing</h3>
          {list(blocks)}
        </section>
      )}
      <section className="grid gap-1.5">
        <h3 className="t-mono-label text-a-text-3">Heads up</h3>
        {list(heads, true)}
      </section>
      <div className="grid gap-4">
      <section className="grid gap-1.5">
        <h3 className="t-caption text-a-text">When</h3>
        <AdminSegmented label="When" value={when} onChange={setWhen} options={[{ value: "now", label: "Publish now" }, { value: "later", label: "Schedule" }]} />
        {when === "later" && (
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={day} min={localIso(new Date()).slice(0, 10)} onChange={(e) => setDay(e.target.value)} aria-label="Goes live on (day)" aria-invalid={!valid || undefined} className="h-9 w-44 rounded-a-md border border-a-border-subtle bg-a-field px-3 t-body-m text-a-text outline-none transition-colors duration-300 [color-scheme:dark] hover:border-a-border-strong focus-visible:border-a-border-focus aria-[invalid=true]:border-a-border-danger" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Goes live at (time)" aria-invalid={!valid || undefined} className="h-9 w-32 rounded-a-md border border-a-border-subtle bg-a-field px-3 t-body-m text-a-text outline-none transition-colors duration-300 [color-scheme:dark] hover:border-a-border-strong focus-visible:border-a-border-focus aria-[invalid=true]:border-a-border-danger" />
            </div>
            <span role="status" className={cn("t-caption", valid ? "text-a-text-2" : "text-a-danger")}>{valid ? `Goes live ${dayLabel(at)} at ${time}, in your time zone.` : "Pick a day and time in the future."}</span>
          </div>
        )}
      </section>
      <section className="grid gap-2">
        <h3 className="t-caption text-a-text">Tell students</h3>
        {([["app", "On the platform"], ["email", "By e-mail"], ["discord", "In Discord"]] as const).map(([k, label]) => (
          <label key={k} className="flex h-[18px] items-center gap-2.5 t-body-m text-a-text">
            <Checkbox checked={channels[k]} disabled={k === "discord" && !coach.discordUrl} onCheckedChange={(v) => setChannels((c) => ({ ...c, [k]: !!v }))} /> {label}
          </label>
        ))}
      </section>
      </div>
    </AdminModal>
  )
}
