"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { STATUS_LABEL, type Course } from "@/lib/data/learning"
import { pictureFrom } from "@/lib/images"
import { AdminButton, AdminDrawer, AdminField, AdminSegmented, Callout, Tag, adminControl } from "../ui"
import { CourseCover } from "./course-parts"

/** Content · 11 Settings drawer: course, access, status and the danger zone. Changes save as you type. */
export function CourseSettingsDrawer({ course, open, onOpenChange, edit, onDuplicate, onDelete, onPublish, onReviewAccess }: { course: Course; open: boolean; onOpenChange: (o: boolean) => void; edit: (fn: (c: Course) => Course) => void; onDuplicate: () => void; onDelete: () => void; onPublish: () => void; onReviewAccess: () => void }) {
  const { coach } = useCoach()
  const cover = useRef<HTMLInputElement>(null)
  const set = (patch: Partial<Course>) => edit((c) => ({ ...c, ...patch }))
  // Who could see the course when the drawer opened, to tell the coach who loses access.
  const [was, setWas] = useState<string[]>(course.tiers)
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) setWas(course.tiers)
  }

  const everyone = course.tiers.length === 0
  const members = (ids: string[]) => coach.tiers.filter((t) => (ids.length ? ids.includes(t.id) : true)).reduce((n, t) => n + t.members, 0)
  const lost = coach.tiers.filter((t) => (was.length === 0 || was.includes(t.id)) && !(everyone || course.tiers.includes(t.id))).reduce((n, t) => n + t.members, 0)
  const students = members(course.tiers)
  const section = "grid gap-3.5 border-b border-a-border-subtle py-5 first:pt-0"

  return (
    <AdminDrawer open={open} onOpenChange={onOpenChange} title="Course settings" subtitle={`${course.title} · ${STATUS_LABEL[course.status]}`} bodyClassName="gap-0 py-0"
      footer={<><AdminButton hierarchy="ghost" onClick={() => onOpenChange(false)}>Close</AdminButton><span className="flex-1" /><span className="t-caption text-a-text-3">Changes save as you type</span></>}>
      <section className={`${section} pt-5`}>
        <h3 className="t-body-l-medium text-a-text">Course</h3>
        <AdminField label="Title">{(p) => <input {...p} value={course.title} onChange={(e) => set({ title: e.target.value })} className={`${adminControl} h-11`} />}</AdminField>
        <AdminField label="Short description">{(p) => <input {...p} value={course.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="e.g. Six setups, step by step" className={`${adminControl} h-11`} />}</AdminField>
        <div className="flex items-center gap-3">
          <CourseCover course={course} className="h-[68px] w-[120px] shrink-0 rounded-a-sm border border-a-border" />
          <AdminButton hierarchy="secondary" size="sm" onClick={() => cover.current?.click()}>Change cover</AdminButton>
          {course.cover?.startsWith("data:") && <AdminButton hierarchy="ghost" size="sm" onClick={() => set({ cover: undefined })}>Remove</AdminButton>}
          <input ref={cover} type="file" accept="image/*" aria-label="Cover picture" className="sr-only" onChange={(e) => (e.target.files?.[0] && void pictureFrom(e.target.files[0], { max: 960, quality: 0.8, keep: [] }).then((c) => set({ cover: c })).catch((err) => toast.error(err instanceof Error ? err.message : "That picture couldn't be used.")), (e.target.value = ""))} />
        </div>
      </section>

      <section className={section}>
        <h3 className="t-body-l-medium text-a-text">Access</h3>
        <AdminSegmented label="Who gets this course" value={everyone ? "all" : "pick"} onChange={(v) => set({ tiers: v === "all" ? [] : coach.tiers.slice(0, 1).map((t) => t.id) })} options={[{ value: "all", label: "All tiers" }, { value: "pick", label: "Pick tiers" }]} />
        {!everyone && (
          <ul className="grid gap-1">
            {coach.tiers.map((t) => (
              <li key={t.id}>
                <label className="flex h-8 items-center gap-3 t-body-m text-a-text">
                  <Checkbox checked={course.tiers.includes(t.id)} disabled={course.tiers.length === 1 && course.tiers.includes(t.id)} onCheckedChange={(v) => set({ tiers: v ? [...course.tiers, t.id] : course.tiers.filter((x) => x !== t.id) })} />
                  <span className="flex-1">{t.name}</span>
                  <span className="t-caption text-a-text-3">{t.members} students</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {lost > 0 && <Callout tone="warning" action={<AdminButton hierarchy="secondary" size="sm" onClick={onReviewAccess}>Review</AdminButton>}>{lost} students lose access. Their progress is kept.</Callout>}
      </section>

      <section className="grid gap-4 py-5">
        <h3 className="t-body-l-medium text-a-text">Status</h3>
        <div className="flex items-center gap-3 t-body-m text-a-text-2">
          <Tag tone={course.status === "published" ? "success" : course.status === "scheduled" ? "warning" : "neutral"} dot>{STATUS_LABEL[course.status]}</Tag>
          <span className="min-w-0 flex-1">{course.status === "published" ? `since 2 Oct · ${students} students` : course.status === "scheduled" ? `goes live ${course.scheduledFor ?? "soon"}` : "Students can't see it yet"}</span>
          {course.status === "published" ? (
            <AdminButton hierarchy="secondary" size="md" onClick={() => (set({ status: "draft" }), toast("Unpublished. Students no longer see this course."))}>Unpublish</AdminButton>
          ) : (
            <AdminButton size="md" onClick={onPublish}>Publish</AdminButton>
          )}
        </div>
        <div className="grid gap-3 rounded-a-lg border border-a-border p-5">
          <h4 className="t-body-l text-a-text">Danger zone</h4>
          <div className="flex flex-wrap gap-2">
            <AdminButton hierarchy="secondary" size="md" onClick={onDuplicate}>Duplicate</AdminButton>
            <AdminButton hierarchy="danger" size="md" onClick={() => (set({ status: course.status === "archived" ? "draft" : "archived" }), toast(course.status === "archived" ? "Restored as a draft." : "Archived. Progress is kept."))}>
              {course.status === "archived" ? "Restore" : "Archive"}
            </AdminButton>
            {students === 0 && <AdminButton hierarchy="danger" size="md" onClick={onDelete}>Delete</AdminButton>}
          </div>
          {students > 0 && <p className="t-caption text-a-text-2">Delete only shows on courses without students.</p>}
        </div>
      </section>
    </AdminDrawer>
  )
}
