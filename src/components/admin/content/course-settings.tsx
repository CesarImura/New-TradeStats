"use client"

import { useRef } from "react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton, Tag } from "@/components/admin/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { STATUS_LABEL, type Course } from "@/lib/data/learning"
import { pictureFrom } from "@/lib/images"
import { cn } from "@/lib/utils"
import { Tile } from "./thumbs"

const TONE = { published: "success", draft: "neutral", scheduled: "warning", archived: "neutral" } as const

/** Content 11: Course settings drawer: Course, Access, Status and Danger zone (Figma 530:7542 family). */
export function CourseSettings({ course, edit, onPublish, onDuplicate }: { course: Course; edit: (fn: (c: Course) => Course) => void; onPublish: () => void; onDuplicate: () => void }) {
  const { coach } = useCoach()
  const set = (patch: Partial<Course>) => edit((c) => ({ ...c, ...patch }))
  const cover = useRef<HTMLInputElement>(null)
  const everyone = course.tiers.length === 0
  const total = coach.tiers.reduce((n, t) => n + t.members, 0)
  const losing = !everyone && course.status === "published" ? coach.tiers.filter((t) => !course.tiers.includes(t.id)).reduce((n, t) => n + t.members, 0) : 0
  const reach = everyone ? total : coach.tiers.filter((t) => course.tiers.includes(t.id)).reduce((n, t) => n + t.members, 0)

  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      set({ cover: await pictureFrom(file, { max: 960, quality: 0.8, keep: [] }) })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "That picture couldn't be used.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h3 className="t-body-m text-a-text">Course</h3>
        <div className="grid gap-1.5">
          <Label htmlFor="cs-title">Title</Label>
          <Input id="cs-title" value={course.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cs-desc">Short description</Label>
          <Input id="cs-desc" value={course.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="e.g. Six setups, step by step" />
        </div>
        <div className="flex items-center gap-3">
          <Tile src={course.cover} color={course.color} className="aspect-video w-[124px] shrink-0 rounded-a-md border border-a-border" />
          <AdminButton hierarchy="secondary" size="md" onClick={() => cover.current?.click()}>Change cover</AdminButton>
          {course.cover && <AdminButton hierarchy="ghost" size="md" onClick={() => set({ cover: undefined })}>Remove</AdminButton>}
          <input ref={cover} type="file" accept="image/*" aria-label="Cover" className="sr-only" onChange={(e) => (void pick(e.target.files?.[0]), (e.target.value = ""))} />
        </div>
      </section>

      <div className="h-px bg-a-border" />

      <section className="flex flex-col gap-3">
        <h3 className="t-body-m text-a-text">Access</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {([["all", "All tiers"], ["pick", "Pick tiers"]] as const).map(([k, label]) => {
            const on = (k === "all") === everyone
            return (
              <button key={k} type="button" onClick={() => set({ tiers: k === "all" ? [] : coach.tiers.slice(0, 1).map((t) => t.id) })}
                className={cn("h-9 rounded-a-md border t-body-m outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", on ? "border-a-border-active bg-a-selected text-a-text" : "border-a-border text-a-text-2 hover:bg-a-hover")}>
                {label}
              </button>
            )
          })}
        </div>
        {!everyone && (
          <div className="flex flex-col gap-2">
            {coach.tiers.map((t) => (
              <label key={t.id} className="flex items-center gap-2.5 t-body-m text-a-text">
                <Checkbox checked={course.tiers.includes(t.id)} onCheckedChange={(v) => set({ tiers: v ? [...course.tiers, t.id] : course.tiers.filter((x) => x !== t.id) })} />
                <span className="flex-1">{t.name}</span>
                <span className="t-caption text-a-text-2">{t.members} students</span>
              </label>
            ))}
          </div>
        )}
        {losing > 0 && (
          <div role="status" className="flex items-center gap-3 rounded-a-md bg-a-warning-soft px-3 py-2.5">
            <p className="t-body-m flex-1 text-a-warning">{losing} students lose access. Their progress is kept.</p>
          </div>
        )}
      </section>

      <div className="h-px bg-a-border" />

      <section className="flex flex-col gap-3">
        <h3 className="t-body-m text-a-text">Status</h3>
        <div className="flex items-center gap-3">
          <Tag tone={TONE[course.status]} dot>{STATUS_LABEL[course.status]}</Tag>
          <span className="t-body-m flex-1 text-a-text-2">{course.status === "scheduled" ? `Goes live ${course.scheduledFor ?? "soon"}` : course.status === "published" ? `${reach} students can see it` : "Only you see it"}</span>
          {course.status === "published" ? (
            <AdminButton hierarchy="secondary" onClick={() => (set({ status: "draft" }), toast("Unpublished. Students no longer see this course."))}>Unpublish</AdminButton>
          ) : course.status === "archived" ? (
            <AdminButton hierarchy="secondary" onClick={() => (set({ status: "draft" }), toast("Restored as a draft."))}>Restore</AdminButton>
          ) : (
            <AdminButton onClick={onPublish}>Publish</AdminButton>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-a-lg border border-a-border p-5">
        <h3 className="t-body-m text-a-text">Danger zone</h3>
        <div className="flex gap-2">
          <AdminButton hierarchy="secondary" onClick={onDuplicate}>Duplicate</AdminButton>
          <AdminButton hierarchy="danger" disabled={course.status === "archived"} onClick={() => (set({ status: "archived" }), toast("Archived."))}>Archive</AdminButton>
        </div>
        <p className="t-caption text-a-text-2">Archived courses disappear for students. Their progress is kept. Delete only shows on courses without students.</p>
      </section>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
