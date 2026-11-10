"use client"

import { useState } from "react"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { allLessons, type Course } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminModal, AdminSegmented } from "../ui"
import type { Upload } from "./course-parts"

type Item = { tone: "danger" | "warning" | "success"; title: string; text: string; action?: { label: string; run: () => void } }
const DOT = { danger: "bg-a-danger-fill", warning: "bg-a-warning-fill", success: "bg-a-success-fill" } as const

/** Content · 12 Publish review: what blocks publishing, what to know, when, and who hears about it. */
export function PublishReview({ course, uploads, open, onOpenChange, onOpenUploads, onOpenLesson, onPublish, onSaveDraft }: { course: Course; uploads: Upload[]; open: boolean; onOpenChange: (o: boolean) => void; onOpenUploads: () => void; onOpenLesson: (id: string, tab?: "quiz") => void; onPublish: (o: { when: "now" | "later"; date: string; channels: string[] }) => void; onSaveDraft: () => void }) {
  const { coach } = useCoach()
  const lessons = allLessons(course)
  const [when, setWhen] = useState<"now" | "later">("now")
  const [date, setDate] = useState(course.scheduledFor ?? "Thu 29 Oct")
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
  const list = (items: Item[]) => (
    <ul className="grid">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 py-2.5">
          <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[it.tone])} />
          <span className="grid min-w-0 flex-1">
            <span className="t-body-m text-a-text">{it.title}</span>
            <span className="t-caption text-a-text-2">{it.text}</span>
          </span>
          {it.action && <AdminButton hierarchy="secondary" size="sm" onClick={() => (onOpenChange(false), it.action!.run())}>{it.action.label}</AdminButton>}
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
          <AdminButton disabled={blocked} onClick={() => (onPublish({ when, date, channels: Object.entries(channels).filter(([, v]) => v).map(([k]) => k) }), onOpenChange(false))}>
            {when === "later" ? `Schedule for ${date}` : `Publish to ${students} students`}
          </AdminButton>
        </>
      }>
      {blocked && (
        <section className="grid gap-1">
          <h3 className="t-mono-label text-a-text-3">Blocks publishing</h3>
          {list(blocks)}
        </section>
      )}
      <section className="grid gap-1">
        <h3 className="t-mono-label text-a-text-3">Heads up</h3>
        {list(heads)}
      </section>
      <section className="grid gap-2">
        <h3 className="t-body-m text-a-text">When</h3>
        <AdminSegmented label="When" value={when} onChange={setWhen} options={[{ value: "now", label: "Publish now" }, { value: "later", label: "Schedule" }]} />
        {when === "later" && <input value={date} onChange={(e) => setDate(e.target.value)} aria-label="Goes live on" placeholder="e.g. Thu 29 Oct" className="h-9 w-48 rounded-a-md border border-a-border-subtle bg-a-field px-3 t-body-m text-a-text outline-none focus-visible:border-a-border-focus" />}
      </section>
      <section className="grid gap-2">
        <h3 className="t-body-m text-a-text">Tell students</h3>
        {([["app", "On the platform"], ["email", "By e-mail"], ["discord", "In Discord"]] as const).map(([k, label]) => (
          <label key={k} className="flex h-7 items-center gap-3 t-body-m text-a-text">
            <Checkbox checked={channels[k]} disabled={k === "discord" && !coach.discordUrl} onCheckedChange={(v) => setChannels((c) => ({ ...c, [k]: !!v }))} /> {label}
          </label>
        ))}
      </section>
    </AdminModal>
  )
}
