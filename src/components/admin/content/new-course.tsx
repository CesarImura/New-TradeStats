"use client"

import { useState } from "react"
import { ArrowRight, ChevronDown, GripVertical, MoreHorizontal, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { uid, type Course, type Lesson, type Module } from "@/lib/data/learning"
import { pictureFrom } from "@/lib/images"
import { cn } from "@/lib/utils"
import { AdminButton, Callout, Dropzone, OptionCard, StepIndicator, adminControl } from "../ui"
import { uploadQueue } from "./course-parts"

type Step = "course" | "access" | "content"
type Method = "blank" | "folder" | "links"
type Access = "all" | "tiers" | "own"
type Found = { module: string; name: string; file?: File; link?: string }

const STEPS: { id: Step; label: string }[] = [{ id: "course", label: "Course" }, { id: "access", label: "Access" }, { id: "content", label: "Content" }]
const field = adminControl
const VIDEO = /\.(mp4|mov|mkv|webm|m4v)$/i
const cleanName = (f: string) => f.replace(VIDEO, "").replace(/^\d+[\s._-]*/, "").replace(/[-_]+/g, " ").trim().replace(/^./, (c) => c.toUpperCase())
const sizeOf = (bytes: number) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`)

/** Content · 04 to 06 New course: three steps (Course, Access, Content). Save as draft works as soon as there is a title. */
export function NewCourse({ open, onOpenChange, area, initialMethod = "blank", onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; area: string; initialMethod?: Method; onCreate: (c: Course, o: { open: boolean }) => void }) {
  const { coach } = useCoach()
  const [step, setStep] = useState<Step>("course")
  const [title, setTitle] = useState("")
  const [tagline, setTagline] = useState("")
  const [cover, setCover] = useState<string | undefined>()
  const [access, setAccess] = useState<Access>("all")
  const [tiers, setTiers] = useState<string[]>([])
  const [method, setMethod] = useState<Method>(initialMethod)
  const [found, setFound] = useState<Found[]>([])
  const [skipped, setSkipped] = useState<string[]>([])
  const [links, setLinks] = useState("")
  const [shut, setShut] = useState<string[]>([])
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setStep(initialMethod === "folder" ? "course" : "course")
      setMethod(initialMethod)
    }
  }
  const idx = STEPS.findIndex((s) => s.id === step)
  const reset = () => (setTitle(""), setTagline(""), setCover(undefined), setAccess("all"), setTiers([]), setFound([]), setSkipped([]), setLinks(""), setShut([]))

  const readFolder = (list: FileList | File[]) => {
    const all = [...list].sort((a, b) => ((a as File & { webkitRelativePath?: string }).webkitRelativePath || a.name).localeCompare((b as File & { webkitRelativePath?: string }).webkitRelativePath || b.name, undefined, { numeric: true }))
    const videos = all.filter((f) => f.type.startsWith("video/") || VIDEO.test(f.name))
    setSkipped(all.filter((f) => !videos.includes(f)).map((f) => f.name))
    setFound(
      videos.map((f) => {
        const parts = ((f as File & { webkitRelativePath?: string }).webkitRelativePath || "").split("/").slice(1, -1)
        return { module: parts[0] ? cleanName(parts[0]) || parts[0] : "Module 1", name: cleanName(f.name) || f.name, file: f }
      }),
    )
    if (!videos.length) toast.error("No videos in that folder. Use MP4, MOV or WebM.")
  }
  const linkRows: Found[] = links.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => ({ module: "Module 1", name: `Lesson ${i + 1}`, link: l }))
  const rows = method === "folder" ? found : method === "links" ? linkRows : []
  const groups = rows.reduce<Record<string, Found[]>>((g, r) => ((g[r.module] ||= []).push(r), g), {})

  const build = () => {
    const modules: Module[] = Object.entries(groups).map(([name, items]) => ({
      id: uid("m"),
      title: name,
      lessons: items.map((r): Lesson => ({ id: uid("l"), title: r.name, minutes: 0, status: "draft", video: r.link, chapters: [], downloads: [] })),
    }))
    const course: Course = {
      id: uid("c"),
      title: title.trim(),
      tagline: tagline.trim(),
      area,
      status: "draft",
      tiers: access === "tiers" ? tiers : [],
      soldSeparately: access === "own" || undefined,
      color: [...title].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5,
      cover,
      edited: "just now",
      modules: modules.length ? modules : [{ id: uid("m"), title: "Module 1", lessons: [] }],
    }
    const queued = Object.values(groups).flat().map((r, i) => ({ r, i })).filter(({ r }) => r.file)
    if (queued.length) {
      const lessons = course.modules.flatMap((m) => m.lessons)
      uploadQueue.set(course.id, queued.map(({ r, i }) => ({ lessonId: lessons[i].id, file: r.file! })))
    }
    return course
  }
  const finish = (draftOnly: boolean) => {
    if (!title.trim()) return void toast.error("Give the course a title first.")
    const c = build()
    onCreate(c, { open: !draftOnly })
    if (draftOnly) toast.success("Saved as a draft.")
    reset()
    setStep("course")
    onOpenChange(false)
  }

  const next = () => {
    if (step === "course" && !title.trim()) return void toast.error("Give the course a title first.")
    if (step === "access" && access === "tiers" && tiers.length === 0) return void toast.error("Pick at least one tier, or choose All tiers.")
    if (step === "content") return finish(false)
    setStep(STEPS[idx + 1].id)
  }
  const doneText: Record<Step, string | undefined> = {
    course: title.trim() || undefined,
    access: access === "all" ? "All tiers" : access === "own" ? "Sold on its own" : tiers.length ? coach.tiers.filter((t) => tiers.includes(t.id)).map((t) => t.name).join(", ") : undefined,
    content: undefined,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="grid h-[min(640px,calc(100svh-2rem))] grid-cols-1 gap-0 overflow-hidden rounded-a-xl border border-a-border bg-a-panel p-0 text-a-text ring-0 sm:max-w-[880px] sm:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Steps" className="hidden flex-col gap-4 border-r border-a-border-subtle p-4 sm:flex">
          <DialogTitle className="px-1 pt-1 t-heading-s text-a-text">New course</DialogTitle>
          <ol className="grid gap-1">
            {STEPS.map((s, i) => {
              const done = i < idx
              return (
                <li key={s.id} className={cn("flex items-center gap-3 rounded-a-md px-2.5 py-2", s.id === step && "bg-a-selected")}>
                  <StepIndicator step={i + 1} state={done ? "done" : s.id === step ? "current" : "upcoming"} />
                  <span className="grid min-w-0">
                    <span className={cn("t-body-m", s.id === step || done ? "text-a-text" : "text-a-text-2")}>{s.label}</span>
                    {done && doneText[s.id] && <span className="truncate t-caption text-a-text-3">{doneText[s.id]}</span>}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-a-border-subtle px-6 py-4">
            <DialogDescription render={<h2 />} className="t-heading-s text-a-text">{STEPS[idx].label}</DialogDescription>
            <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Close" onClick={() => onOpenChange(false)}><X /></AdminButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {step === "course" && (
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="t-body-m text-a-text">Title</span>
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order flow basics" className={cn(field, "h-11")} />
                </label>
                <label className="grid gap-2">
                  <span className="t-body-m text-a-text">Short description <span className="t-caption text-a-text-3">Optional</span></span>
                  <input value={tagline} maxLength={80} onChange={(e) => setTagline(e.target.value)} className={cn(field, "h-11")} />
                  <span className="t-caption text-a-text-2">Students see it under the title. Up to 80 characters.</span>
                </label>
                <div className="grid gap-2">
                  <span className="t-body-m text-a-text">Cover</span>
                  <Dropzone label="Cover picture" accept="image/*" size="md" className="h-[90px] py-0" onFiles={(f) => void pictureFrom(f[0], { max: 960, quality: 0.8, keep: [] }).then(setCover).catch((err) => toast.error(err instanceof Error ? err.message : "That picture couldn't be used."))}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="Cover" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <span className="t-body-m text-a-text">Drop an image or browse</span>
                    )}
                  </Dropzone>
                </div>
              </div>
            )}

            {step === "access" && (
              <div className="grid gap-3">
                <h3 className="t-mono-label text-a-text-3">Who can watch</h3>
                {([["all", "All tiers", "Everyone with any paid or free tier"], ["tiers", "Pick tiers", "Only the tiers you choose"]] as const).map(([v, label, text]) => (
                  <div key={v} className="grid gap-3">
                    <Option checked={access === v} onSelect={() => setAccess(v)} label={label} text={text} />
                    {v === "tiers" && access === "tiers" && (
                      <ul className="grid gap-1 pl-10">
                        {coach.tiers.map((t) => (
                          <li key={t.id}>
                            <label className="flex h-8 items-center gap-3 t-body-m text-a-text">
                              <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(c) => setTiers((x) => (c ? [...x, t.id] : x.filter((y) => y !== t.id)))} />
                              <span className="flex-1">{t.name}</span>
                              <span className="t-caption text-a-text-3">{t.price}/{t.cadence === "month" ? "mo" : t.cadence} · {t.members} students</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <Option checked={access === "own"} onSelect={() => setAccess("own")} label="Sell it on its own" text="One-time price, set it later in Sales" />
              </div>
            )}

            {step === "content" && (
              <div className="grid gap-4">
                <div role="radiogroup" aria-label="How to add content" className="grid gap-3 sm:grid-cols-3">
                  {([["blank", "Start blank", "Empty course, add lessons later"], ["folder", "Upload a folder", "Subfolders become modules"], ["links", "Import links", "YouTube, Vimeo or Loom"]] as const).map(([v, label, text]) => (
                    <Option key={v} compact checked={method === v} onSelect={() => setMethod(v)} label={label} text={text} />
                  ))}
                </div>
                {method === "folder" && rows.length === 0 && (
                  <Dropzone label="Folder of videos" title="Drop a folder of videos or browse" directory size="md" className="h-[120px] py-0" onFiles={readFolder} />
                )}
                {method === "links" && (
                  <textarea value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One link per line" aria-label="Links" className={cn(field, "min-h-[96px] resize-y py-3")} />
                )}
                {rows.length > 0 && (
                  <>
                    <Callout action={<AdminButton hierarchy="secondary" size="sm" onClick={() => (setFound([]), setLinks(""), setSkipped([]))}>Start over</AdminButton>}>
                      <span className="block">{Object.keys(groups).length} {Object.keys(groups).length === 1 ? "module" : "modules"} · {rows.length} {rows.length === 1 ? "video" : "videos"}{method === "folder" ? ` · ${sizeOf(found.reduce((n, r) => n + (r.file?.size ?? 0), 0))}` : ""}{skipped.length ? ` · ${skipped.length} ${skipped.length === 1 ? "file" : "files"} skipped` : ""}</span>
                    </Callout>
                    {skipped.length > 0 && (
                      <Callout tone="warning"><span className="block truncate">{skipped[0]} is not a video and will be skipped{skipped.length > 1 ? ` (+${skipped.length - 1})` : ""}</span></Callout>
                    )}
                    <div className="grid gap-3">
                      {Object.entries(groups).map(([name, items], gi) => {
                        const open = !shut.includes(name)
                        return (
                          <section key={name} className="overflow-hidden rounded-a-md border border-a-border">
                            <button type="button" aria-expanded={open} onClick={() => setShut((s) => (open ? [...s, name] : s.filter((x) => x !== name)))} className="flex h-11 w-full items-center gap-2 px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">
                              <ChevronDown className={cn("size-4 text-a-text-3 transition-transform duration-300", !open && "-rotate-90")} />
                              <span className="t-body-m text-a-text">{gi + 1} · {name}</span>
                              <span className="t-caption text-a-text-3">{items.length} {items.length === 1 ? "video" : "videos"}</span>
                              <MoreHorizontal className="ml-auto size-4 text-a-text-3" aria-hidden />
                            </button>
                            {open && items.map((r, i) => (
                              <div key={i} className="flex h-[52px] items-center gap-3 border-t border-a-border-subtle px-3 t-body-m">
                                <GripVertical className="size-3.5 text-a-text-3" aria-hidden />
                                <span className="min-w-0 flex-1 truncate text-a-text">{r.name}</span>
                                <span className="max-w-[40%] truncate t-caption text-a-text-3">{r.file?.name ?? r.link}</span>
                              </div>
                            ))}
                          </section>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-a-border-subtle px-6 py-4">
            <AdminButton hierarchy="ghost" onClick={() => finish(true)}>Save as draft</AdminButton>
            <span className="flex-1" />
            {idx === 0 ? <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>Cancel</AdminButton> : <AdminButton hierarchy="secondary" onClick={() => setStep(STEPS[idx - 1].id)}>Back</AdminButton>}
            <AdminButton onClick={next}>{step === "content" ? (method === "folder" && rows.length ? "Upload and create" : "Create course") : <>Continue <ArrowRight /></>}</AdminButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const Option = ({ checked, onSelect, label, text, compact }: { checked: boolean; onSelect: () => void; label: string; text: string; compact?: boolean }) => <OptionCard checked={checked} onSelect={onSelect} title={label} description={text} compact={compact} />
