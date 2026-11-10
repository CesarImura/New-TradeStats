"use client"

import { useState } from "react"
import { Check, FolderUp, Plus, X } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { AdminButton } from "@/components/admin/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uid, type Course } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { PictureField } from "./thumbs"

const STEPS = ["Course", "Access", "Content"] as const

/** Content 04–06: New course in three steps (Course, Access, Content), as in Figma. */
export function NewCourseWizard({ open, area, onClose, onCreate }: { open: boolean; area: string; onClose: () => void; onCreate: (c: Course) => void }) {
  const { coach } = useCoach()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [cover, setCover] = useState<string | undefined>()
  const [tiers, setTiers] = useState<string[]>([])
  const [start, setStart] = useState<"empty" | "folder">("empty")
  const color = 0

  const reset = () => (setStep(0), setTitle(""), setTagline(""), setCover(undefined), setTiers([]), setStart("empty"))
  const close = () => (reset(), onClose())
  const create = (status: "draft") => {
    const lesson = (t: string, minutes = 0) => ({ id: uid("l"), title: t, minutes, status: "draft" as const, chapters: [], downloads: [] })
    onCreate({
      id: uid("c"),
      title: title.trim() || "New course",
      tagline,
      area,
      status,
      tiers,
      color: Math.floor(Math.random() * 5),
      cover,
      modules: start === "folder"
        ? [{ id: uid("m"), title: "Basics", lessons: [lesson("Intro: what order flow is", 11), lesson("Reading the tape", 18)] }, { id: uid("m"), title: "Reading the footprint", lessons: [lesson("Footprint charts", 24), lesson("Absorption", 15)] }]
        : [{ id: uid("m"), title: "Module 1", lessons: [lesson("First lesson")] }],
    })
    reset()
    onClose()
  }
  const valid = title.trim().length > 0
  const last = step === STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent showCloseButton={false} className="max-w-[880px] gap-0 overflow-hidden p-0 sm:max-w-[880px]">
        <DialogTitle className="sr-only">New course</DialogTitle>
        <DialogDescription className="sr-only">It starts as a draft. Students see it once you publish.</DialogDescription>
        <div className="grid min-h-[600px] sm:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Steps" className="flex flex-col gap-1 border-b border-a-border p-4 sm:border-r sm:border-b-0">
            <p className="t-heading-m px-1 pt-2 pb-3 text-a-text">New course</p>
            {STEPS.map((name, i) => {
              const done = i < step
              return (
                <button key={name} type="button" disabled={i > step && !valid} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                  className={cn("flex h-9 items-center gap-2.5 rounded-a-md px-2.5 t-body-m outline-none transition-colors focus-visible:ring-2 focus-visible:ring-a-border-focus", i === step ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover")}>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full t-caption", done ? "bg-a-success-fill text-black" : i === step ? "bg-a-accent-strong text-white" : "bg-a-muted text-a-text-2")}>
                    {done ? <Check className="size-3" /> : i + 1}
                  </span>
                  {name}
                </button>
              )
            })}
          </nav>

          <div className="flex min-w-0 flex-col">
            <header className="flex h-16 items-center justify-between border-b border-a-border px-6">
              <h2 className="t-heading-m text-a-text">{STEPS[step]}</h2>
              <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Close" onClick={close}><X /></AdminButton>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              {step === 0 && (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nc-title">Title</Label>
                    <Input id="nc-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order flow basics" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="nc-desc">Short description</Label>
                    <Textarea id="nc-desc" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line students see under the title" className="min-h-16" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Cover</Label>
                    <PictureField value={cover} color={color} onChange={setCover} label="Cover" empty="No picture yet: students see your brand colour." />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="t-body-m text-a-text-2">Students in other tiers see the course locked, with an upgrade button.</p>
                  <label className="flex items-center gap-3 rounded-a-md border border-a-border px-3 py-2.5 t-body-m text-a-text">
                    <Checkbox checked={tiers.length === 0} onCheckedChange={(v) => v && setTiers([])} /> Every tier
                  </label>
                  {coach.tiers.map((t) => (
                    <label key={t.id} className={cn("flex items-center gap-3 rounded-a-md border px-3 py-2.5 t-body-m text-a-text", tiers.includes(t.id) ? "border-a-border-strong bg-a-selected" : "border-a-border")}>
                      <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(v) => setTiers(v ? [...tiers, t.id] : tiers.filter((x) => x !== t.id))} />
                      <span className="flex-1">{t.name}</span>
                      <span className="t-caption text-a-text-2">{t.members} students</span>
                    </label>
                  ))}
                </>
              )}
              {step === 2 && (
                <>
                  <p className="t-body-m text-a-text-2">Start with a folder of videos, or build the course lesson by lesson.</p>
                  {([["folder", "Upload a folder", "AI proposes modules and lesson names from your files.", FolderUp], ["empty", "Start empty", "One module with a first lesson. Add videos later.", Plus]] as const).map(([k, label, text, Icon]) => (
                    <button key={k} type="button" onClick={() => setStart(k)} className={cn("flex items-center gap-3 rounded-a-lg border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", start === k ? "border-a-border-strong bg-a-selected" : "border-a-border hover:bg-a-hover")}>
                      <Icon className="size-4 text-a-text-2" />
                      <span className="grid gap-0.5"><span className="t-body-m text-a-text">{label}</span><span className="t-caption text-a-text-2">{text}</span></span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <footer className="flex h-[66px] items-center gap-2 border-t border-a-border px-6">
              <AdminButton hierarchy="secondary" disabled={!valid} onClick={() => create("draft")}>Save as draft</AdminButton>
              <span className="flex-1" />
              <AdminButton hierarchy="ghost" onClick={close}>Cancel</AdminButton>
              {last ? (
                <AdminButton disabled={!valid} onClick={() => create("draft")}>Create and open</AdminButton>
              ) : (
                <AdminButton disabled={!valid} onClick={() => setStep(step + 1)}>Continue</AdminButton>
              )}
            </footer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
