"use client"

import { useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ArrowRight, ArrowUp, ChevronDown, GripVertical, MoreHorizontal, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { uid, type Course, type Lesson, type Module } from "@/lib/data/learning"
import { pictureFrom } from "@/lib/images"
import { cn } from "@/lib/utils"
import { AdminButton, AdminField, Callout, Dropzone, OptionCard, StepIndicator, adminControl } from "../ui"
import { uploadQueue } from "./course-parts"

type Step = "course" | "access" | "content"
type Method = "blank" | "folder" | "links"
type Access = "all" | "tiers" | "own"
type Found = { module: string; name: string; file?: File; link?: string }

const STEPS: { id: Step; label: string }[] = [{ id: "course", label: "Course" }, { id: "access", label: "Access" }, { id: "content", label: "Content" }]
/** Arrow keys move between the radio cards of a group and choose the one they land on, as a native radio group does. */
function radioArrows(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)) return
  const radios = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]:not(:disabled)")]
  const at = radios.indexOf(document.activeElement as HTMLElement)
  if (at < 0) return
  e.preventDefault()
  const next = radios[(at + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + radios.length) % radios.length]
  next.focus()
  next.click()
}

/** Open and close (rare, so it earns a little motion): the scrim fades, the window eases up from 0.97, and it leaves a touch faster than it came. */
const FADE = "transition-opacity duration-200 ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 motion-reduce:transition-none"
const POP = "transition-[opacity,scale] duration-200 ease-out data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:duration-150 motion-reduce:transition-none"
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
      setStep("course")
      setMethod(initialMethod)
    }
  }
  const idx = STEPS.findIndex((s) => s.id === step)
  const titleRef = useRef<HTMLInputElement>(null)
  const modulesRef = useRef<HTMLDivElement>(null)
  /** Which way the last step change went, so the next step slides in from that side. */
  const [dir, setDir] = useState<"forward" | "back">("forward")
  const go = (to: Step, way: "forward" | "back") => {
    setDir(way)
    setStep(to)
  }
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
  const lines = links.split("\n").map((l) => l.trim()).filter(Boolean)
  const isVideoLink = (l: string) => /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com|loom\.com)\/\S+/i.test(l)
  const badLinks = lines.filter((l) => !isVideoLink(l))
  const linkRows: Found[] = lines.filter(isVideoLink).map((l, i) => ({ module: "Module 1", name: `Lesson ${i + 1}`, link: l.replace(/^https?:\/\/(www\.)?/i, "") }))
  const skippedNow = method === "links" ? badLinks : skipped
  const rows = method === "folder" ? found : method === "links" ? linkRows : []
  const groups = rows.reduce<Record<string, Found[]>>((g, r) => ((g[r.module] ||= []).push(r), g), {})
  /** The folder result is the longest screen (Figma 680px); the others are 600px. */
  const tall = step === "content" && rows.length > 0

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
    go(STEPS[idx + 1].id, "forward")
  }
  const doneText: Record<Step, string | undefined> = {
    course: title.trim() || undefined,
    access: access === "all" ? "All tiers" : access === "own" ? "Sold on its own" : tiers.length ? coach.tiers.filter((t) => tiers.includes(t.id)).map((t) => t.name).join(", ") : undefined,
    content: undefined,
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={cn(FADE, "fixed inset-0 z-50 bg-a-scrim")} />
        <DialogPrimitive.Popup
          initialFocus={() => (step === "course" ? titleRef.current : undefined)}
          data-slot="dialog-content"
          className={cn(
            POP,
            "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-[880px] -translate-x-1/2 -translate-y-1/2 grid-cols-1 overflow-hidden rounded-a-xl border border-a-border-strong bg-a-panel text-a-text shadow-[0_30px_60px_rgb(0_0_0/0.6)] outline-none sm:grid-cols-[220px_minmax(0,1fr)]",
            tall ? "h-[680px]" : "h-[600px]"
          )}
        >
          <nav aria-label="Steps" className="hidden flex-col gap-1 border-r border-a-border bg-a-sunk px-4 py-6 sm:flex">
            <DialogPrimitive.Title className="t-heading-s text-a-text">New course</DialogPrimitive.Title>
            <ol className="mt-3 flex flex-col gap-1">
              {STEPS.map((st, i) => {
                const done = i < idx
                const now = st.id === step
                return (
                  <li key={st.id} aria-current={now ? "step" : undefined} className={cn("flex items-center gap-2.5 rounded-a-md px-2.5 py-2 transition-colors duration-300", now && "bg-a-muted")}>
                    <StepIndicator step={i + 1} state={done ? "done" : now ? "current" : "upcoming"} className="transition-colors duration-300" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className={cn("t-body-m", now || done ? "text-a-text" : "text-a-text-2")}>{st.label}</span>
                      {done && doneText[st.id] && <span className="truncate t-caption text-a-text-3">{doneText[st.id]}</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-col border-a-border sm:border-l-0">
            <header className="flex items-center gap-2 border-b border-a-border px-6 py-[18px]">
              <DialogPrimitive.Description render={<h2 />} className="t-heading-m text-a-text">
                {STEPS[idx].label}
                <span className="ml-2 t-mono-label text-a-text-3 sm:hidden">New course · {idx + 1}/{STEPS.length}</span>
              </DialogPrimitive.Description>
              <span className="flex-1" />
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Close" onClick={() => onOpenChange(false)}><X /></AdminButton>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
              {/* One keyed wrapper per step: it fades in and slides a few pixels from the side we are heading to. */}
              <div key={step} className={cn("flex min-h-0 flex-1 flex-col gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200 motion-safe:ease-out", dir === "back" ? "motion-safe:slide-in-from-left-2" : "motion-safe:slide-in-from-right-2")}>
                {step === "course" && (
                  <>
                    <AdminField label="Title">
                      {(p) => <input {...p} ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && next()} placeholder="e.g. Order flow basics" className={cn(adminControl, "h-11")} />}
                    </AdminField>
                    <AdminField label="Short description" optional hint="Students see it under the title. Up to 80 characters.">
                      {(p) => <input {...p} value={tagline} maxLength={80} placeholder="e.g. Read price like a trader" onChange={(e) => setTagline(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && next()} className={cn(adminControl, "h-11")} />}
                    </AdminField>
                    <div className="flex min-h-[140px] flex-1 flex-col gap-1.5">
                      <span className="t-caption text-a-text">Cover</span>
                      <div className="relative flex min-h-0 flex-1">
                        <Dropzone label="Cover picture" title="Drop a file here, or click to choose" hint="Up to 200 MB" icon={<ArrowUp className="size-[22px]" />} accept="image/*" size="md" className="flex-1" onFiles={(f) => void pictureFrom(f[0], { max: 960, quality: 0.8, keep: [] }).then(setCover).catch((err) => toast.error(err instanceof Error ? err.message : "That picture couldn't be used."))}>
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt="Cover" className="absolute inset-0 size-full object-cover" />
                          )}
                        </Dropzone>
                        {cover && <AdminButton hierarchy="secondary" size="md" iconOnly aria-label="Remove the cover" className="absolute top-2 right-2 bg-a-page" onClick={() => setCover(undefined)}><X /></AdminButton>}
                      </div>
                    </div>
                  </>
                )}

                {step === "access" && (
                  <div role="radiogroup" aria-label="Who can watch" onKeyDown={radioArrows} className="flex flex-1 flex-col gap-4">
                    <h3 className="t-mono-label text-a-text-2">Who can watch</h3>
                    {([["all", "All tiers", "Everyone with any paid or free tier"], ["tiers", "Pick tiers", "Only the tiers you choose"]] as const).map(([v, label, text]) => (
                      <div key={v} className="flex flex-col">
                        <OptionCard checked={access === v} onSelect={() => setAccess(v)} title={label} description={text} />
                        {v === "tiers" && (
                          <Collapse open={access === "tiers"}>
                            <ul className="flex flex-col gap-3 pt-5 pb-1 pr-4 pl-11">
                              {coach.tiers.map((t) => (
                                <li key={t.id}>
                                  <label className="flex cursor-pointer items-center gap-2.5 t-body-m text-a-text">
                                    <Checkbox checked={tiers.includes(t.id)} onCheckedChange={(c) => setTiers((x) => (c ? [...x, t.id] : x.filter((y) => y !== t.id)))} />
                                    <span className="flex-1">{t.name}</span>
                                    <span className="t-caption text-a-text-3">{t.price}/{t.cadence === "month" ? "mo" : t.cadence} · {t.members} students</span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </Collapse>
                        )}
                      </div>
                    ))}
                    <OptionCard checked={access === "own"} onSelect={() => setAccess("own")} title="Sell it on its own" description="One-time price, set it later in Sales" />
                  </div>
                )}

                {step === "content" && (
                  <>
                    <div role="radiogroup" aria-label="How to add content" onKeyDown={radioArrows} className="grid gap-2.5 sm:grid-cols-3">
                      {([["blank", "Start blank", "Empty course, add lessons later"], ["folder", "Upload a folder", "Subfolders become modules"], ["links", "Import links", "YouTube, Vimeo or Loom"]] as const).map(([v, label, text]) => (
                        <OptionCard key={v} checked={method === v} onSelect={() => setMethod(v)} title={label} description={text} />
                      ))}
                    </div>
                    {method === "folder" && rows.length === 0 && (
                      <Dropzone label="Folder of videos" title="Drop a folder of videos or browse" hint="MP4, MOV or WebM · each subfolder becomes a module" icon={<ArrowUp className="size-[22px]" />} directory size="md" onFiles={readFolder} />
                    )}
                    {method === "blank" && (
                      <div className="flex flex-col gap-3 rounded-a-10 border border-a-border px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="t-body-l text-a-text">An empty course, ready to fill</span>
                          <span className="t-caption text-a-text-2">You land on the course page. Add modules and lessons there, one by one or by dropping files.</span>
                        </div>
                        <div aria-hidden className="flex flex-col overflow-hidden rounded-a-md border border-dashed border-a-border-strong">
                          <div className="flex items-center gap-2 px-3 py-2.5"><ChevronDown className="size-3 text-a-text-3" /><span className="t-body-m text-a-text-2">1 · Module 1</span><span className="t-caption text-a-text-3">0 videos</span></div>
                          <div className="flex h-[44px] items-center gap-2.5 border-t border-dashed border-a-border-strong px-2.5"><GripVertical className="size-4 text-a-text-3" /><span className="t-body-m text-a-text-3">Lesson 1</span></div>
                        </div>
                      </div>
                    )}
                    {method === "links" && (
                      <textarea value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One link per line" aria-label="Links" className={cn(adminControl, "min-h-[96px] resize-y py-3")} />
                    )}
                    {method === "links" && rows.length === 0 && <p className="-mt-2 t-caption text-a-text-3">Paste YouTube, Vimeo or Loom links. Each link becomes a lesson.</p>}
                    {rows.length > 0 && (
                      <>
                        <Callout action={<AdminButton hierarchy="secondary" size="md" onClick={() => modulesRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })}>Review</AdminButton>}>
                          {Object.keys(groups).length} {Object.keys(groups).length === 1 ? "module" : "modules"} · {rows.length} {rows.length === 1 ? "video" : "videos"}{method === "folder" ? ` · ${sizeOf(found.reduce((n, r) => n + (r.file?.size ?? 0), 0))}` : ""}{skippedNow.length ? ` · ${skippedNow.length} ${method === "links" ? (skippedNow.length === 1 ? "line" : "lines") : skippedNow.length === 1 ? "file" : "files"} skipped` : ""}
                        </Callout>
                        {skippedNow.length > 0 && (
                          <Callout tone="warning"><span className="block truncate">{skippedNow[0]} {method === "links" ? "is not a YouTube, Vimeo or Loom link and will be skipped" : "is not a video and will be skipped"}{skippedNow.length > 1 ? ` (+${skippedNow.length - 1})` : ""}</span></Callout>
                        )}
                        <div ref={modulesRef} className="flex scroll-mt-2 flex-col gap-4">
                          {Object.entries(groups).map(([name, items], gi) => {
                            const isOpen = !shut.includes(name)
                            return (
                              <section key={name} className="overflow-hidden rounded-a-10 border border-a-border">
                                <div className="flex items-center gap-2 px-3 py-2.5">
                                  <button type="button" aria-expanded={isOpen} onClick={() => setShut((x) => (isOpen ? [...x, name] : x.filter((y) => y !== name)))} className="-my-1 -ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-a-sm py-1 pl-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus">
                                    <ChevronDown aria-hidden className={cn("size-3 shrink-0 text-a-text-3 transition-transform duration-200 ease-out motion-reduce:transition-none", !isOpen && "-rotate-90")} />
                                    <span className="truncate t-body-m text-a-text">{gi + 1} · {name}</span>
                                    <span className="shrink-0 t-caption text-a-text-3">{items.length} {items.length === 1 ? "video" : "videos"}</span>
                                  </button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="sm" iconOnly aria-label={`More for ${name}`} />}><MoreHorizontal className="size-3.5" /></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem onClick={() => (method === "folder" ? setFound((f) => f.filter((r) => r.module !== name)) : setLinks(""))}>Remove module</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => (setFound([]), setLinks(""), setSkipped([]))}>Start over</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <Collapse open={isOpen}>
                                  {items.map((r, i) => (
                                    <div key={i} className="flex h-[52px] items-center gap-2.5 border-t border-a-border px-2.5 transition-colors duration-300 hover:bg-a-hover">
                                      <GripVertical className="size-4 shrink-0 text-a-text-3" aria-hidden />
                                      <span className="min-w-0 flex-1 truncate t-body-m text-a-text">{r.name}</span>
                                      <span className="max-w-[45%] truncate t-caption text-a-text-3">{r.file?.name ?? r.link}</span>
                                    </div>
                                  ))}
                                </Collapse>
                              </section>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <footer className="flex flex-wrap items-center gap-2 border-t border-a-border px-6 py-3.5">
              <AdminButton hierarchy="ghost" onClick={() => finish(true)}>Save as draft</AdminButton>
              <div className="ml-auto flex flex-wrap justify-end gap-2">
                {idx === 0 ? <AdminButton hierarchy="secondary" onClick={() => onOpenChange(false)}>Cancel</AdminButton> : <AdminButton hierarchy="secondary" onClick={() => go(STEPS[idx - 1].id, "back")}>Back</AdminButton>}
                <AdminButton onClick={next}>{step === "content" ? (method === "folder" && rows.length ? "Upload and create" : "Create course") : <>Continue <ArrowRight /></>}</AdminButton>
              </div>
            </footer>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Height-free open and close for a block: the grid row eases between 0 and its content, so nothing is measured in JS. */
function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div data-open={open} aria-hidden={!open} inert={!open} className="grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-250 ease-out data-[open=true]:grid-rows-[1fr] max-sm:duration-200 not-data-[open=true]:opacity-0 motion-reduce:transition-none">
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

