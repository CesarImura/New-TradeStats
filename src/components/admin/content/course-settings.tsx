"use client"

import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { STATUS_LABEL, allLessons, useCatalog, type Course, type Status } from "@/lib/data/learning"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { STATUS_DOT } from "./content-board"

export function CourseSettings({ course, edit }: { course: Course; edit: (fn: (c: Course) => Course) => void }) {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const set = (patch: Partial<Course>) => edit((c) => ({ ...c, ...patch }))
  const lessons = allLessons(course)
  const missing = lessons.filter((l) => !l.video).length

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="text-xl font-semibold">Course settings</h2>
        <p className="text-sm text-muted-foreground">Pick a lesson on the left to edit its video, chapters and quiz.</p>
      </div>

      <section className="grid gap-4">
        <Field label="Title">
          <Input value={course.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Short description" hint="Shown under the title">
          <Input value={course.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="e.g. Six setups, step by step" />
        </Field>
        <Field label="Area">
          <SelectOptions value={course.area} onChange={(e) => set({ area: e.target.value })} className="h-9 rounded-lg border bg-background px-2 text-sm">
            {catalog.areas.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </SelectOptions>
        </Field>
      </section>

      <section className="grid gap-3">
        <div>
          <h3 className="font-medium">Who gets it</h3>
          <p className="text-sm text-muted-foreground">Students in other tiers see it locked, with an upgrade button.</p>
        </div>
        <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <Checkbox checked={course.tiers.length === 0} onCheckedChange={(v) => v && set({ tiers: [] })} />
          <span className="flex-1">Every tier</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {coach.tiers.map((t) => (
            <label key={t.id} className={cn("flex items-center gap-3 rounded-lg border p-3 text-sm", course.tiers.includes(t.id) && "border-primary/50 bg-primary/5")}>
              <Checkbox
                checked={course.tiers.includes(t.id)}
                onCheckedChange={(v) => set({ tiers: v ? [...course.tiers, t.id] : course.tiers.filter((x) => x !== t.id) })}
              />
              <span className="grid flex-1">
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.members} students</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="font-medium">Publishing</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["draft", "published", "scheduled"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => set({ status: s, scheduledFor: s === "scheduled" ? course.scheduledFor ?? "Thu 29 Oct" : course.scheduledFor })}
              className={cn("flex items-center gap-2 rounded-lg border p-3 text-left text-sm", course.status === s && "border-primary ring-1 ring-primary")}
            >
              <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {course.status === "scheduled" && (
          <Field label="Goes live on">
            <Input value={course.scheduledFor ?? ""} onChange={(e) => set({ scheduledFor: e.target.value })} placeholder="e.g. Thu 29 Oct" className="max-w-48" />
          </Field>
        )}
        {missing > 0 && <p className="text-sm text-amber-600">{missing} {missing === 1 ? "lesson still needs" : "lessons still need"} a video.</p>}
      </section>

      <section className="grid gap-3 border-t pt-6">
        <h3 className="font-medium">Archive</h3>
        <p className="text-sm text-muted-foreground">Archived courses disappear for students. Their progress is kept, so you can bring it back any time.</p>
        <Button variant="outline" className="w-fit" onClick={() => (set({ status: course.status === "archived" ? "draft" : "archived" }), toast(course.status === "archived" ? "Restored as a draft." : "Archived."))}>
          {course.status === "archived" ? "Restore as draft" : "Archive course"}
        </Button>
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
