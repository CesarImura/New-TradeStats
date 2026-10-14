"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Copy,
  Eye,
  FileVideo,
  FolderUp,
  GripVertical,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABEL, allLessons, saveCatalog, uid, useCatalog, type Catalog, type Course, type Status } from "@/lib/data/learning"
import { cn } from "@/lib/utils"

export const STATUS_DOT: Record<Status, string> = {
  published: "bg-emerald-500",
  draft: "bg-muted-foreground/50",
  scheduled: "bg-amber-500",
  archived: "bg-muted-foreground/25",
}

export function StatusBadge({ status, when }: { status: Status; when?: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-muted-foreground">
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
      {status === "scheduled" && when ? ` · ${when}` : ""}
    </Badge>
  )
}

/** Thumbnail tints for the admin, which keeps its own neutral look. */
export const THUMB = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#e11d48"]

type Filter = "all" | Status

/** ADM-08: areas and courses as a board; drafts, scheduled and archived. */
export function ContentBoard() {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [creating, setCreating] = useState<string | null>(null)
  const [bulk, setBulk] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const edit = (fn: (c: Catalog) => Catalog) => saveCatalog(coach, fn)
  const count = (s: Filter) => catalog.courses.filter((c) => (s === "all" ? c.status !== "archived" : c.status === s)).length
  const shown = (area: string) => catalog.courses.filter((c) => c.area === area && (filter === "all" ? c.status !== "archived" : c.status === filter))

  const setStatus = (id: string, status: Status) => {
    edit((c) => ({ ...c, courses: c.courses.map((x) => (x.id === id ? { ...x, status } : x)) }))
    toast(status === "archived" ? "Archived. Students no longer see it; progress is kept." : status === "published" ? "Published. Students with access see it now." : "Moved to drafts.")
  }
  const duplicate = (course: Course) => {
    const copy: Course = {
      ...structuredClone(course),
      id: uid("c"),
      title: `${course.title} (copy)`,
      status: "draft",
      modules: course.modules.map((m) => ({ ...m, id: uid("m"), lessons: m.lessons.map((l) => ({ ...structuredClone(l), id: uid("l"), status: "draft" as const })) })),
    }
    edit((c) => ({ ...c, courses: [...c.courses, copy] }))
    toast(`Duplicated as a draft: ${copy.title}`)
  }
  const remove = (course: Course) => {
    const before = catalog
    edit((c) => ({ ...c, courses: c.courses.filter((x) => x.id !== course.id) }))
    toast(`${course.title} deleted.`, { action: { label: "Undo", onClick: () => edit(() => before) } })
  }
  const moveTo = (id: string, area: string) => edit((c) => ({ ...c, courses: c.courses.map((x) => (x.id === id ? { ...x, area } : x)) }))

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-9 font-normal tracking-[-0.005em]">Content</h1>
          <p className="text-sm text-muted-foreground">
            Areas and courses. Students see what&apos;s published, in your words: “{coach.wording.courses}”.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulk(true)}>
            <FolderUp /> Bulk upload
          </Button>
          <Button onClick={() => setCreating(catalog.areas[0] ?? "Core")}>
            <Plus /> New course
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {(["all", "published", "draft", "scheduled", "archived"] as Filter[]).map((f) => (
            <TabsTrigger key={f} value={f}>
              {f === "all" ? "All" : STATUS_LABEL[f as Status]}
              <span className="text-muted-foreground tabular-nums">{count(f)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {catalog.areas.map((area) => {
          const list = shown(area)
          return (
            <section
              key={area}
              onDragOver={(e) => {
                if (!dragging) return
                e.preventDefault()
                setOver(area)
              }}
              onDragLeave={() => setOver((o) => (o === area ? null : o))}
              onDrop={() => {
                if (dragging) moveTo(dragging, area)
                setDragging(null)
                setOver(null)
              }}
              className={cn("flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3 transition-colors", over === area && "bg-primary/10 ring-2 ring-primary/30")}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm font-medium">{area}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{list.length}</span>
                <Button variant="ghost" size="icon-xs" className="ml-auto" aria-label={`New course in ${area}`} onClick={() => setCreating(area)}>
                  <Plus />
                </Button>
              </div>
              {list.map((c) => {
                const lessons = allLessons(c)
                const tiers = c.tiers.length ? coach.tiers.filter((t) => c.tiers.includes(t.id)).map((t) => t.name).join(", ") : "All tiers"
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragging(c.id)}
                    onDragEnd={() => (setDragging(null), setOver(null))}
                    className={cn("group relative overflow-hidden rounded-lg border bg-background shadow-xs transition-shadow hover:shadow-md", dragging === c.id && "opacity-50", c.status === "archived" && "opacity-70")}
                  >
                    <Link href={`${base}/content/${c.id}`} className="block">
                      <div className="flex h-16 items-end p-2.5" style={{ background: `linear-gradient(135deg, ${THUMB[c.color % 5]}, color-mix(in oklab, ${THUMB[c.color % 5]} 70%, black))` }}>
                        <span className="rounded bg-black/30 px-1.5 py-0.5 text-[0.65rem] text-white backdrop-blur-sm">
                          {c.modules.length} {c.modules.length === 1 ? "module" : "modules"} · {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                        </span>
                      </div>
                      <div className="grid gap-2 p-3">
                        <div className="grid gap-0.5">
                          <span className="text-sm leading-tight font-medium">{c.title}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">{c.tagline}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={c.status} when={c.scheduledFor} />
                          <span className="truncate text-xs text-muted-foreground">{tiers}</span>
                        </div>
                      </div>
                    </Link>
                    <GripVertical className="absolute top-2 left-1 size-4 text-white/70 opacity-0 group-hover:opacity-100" />
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="secondary" size="icon-xs" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 data-popup-open:opacity-100" aria-label={`Actions for ${c.title}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`${base}/content/${c.id}`)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/c/${coach.slug}/courses/${c.id}`, "_blank")} disabled={c.status !== "published"}>
                          <Eye /> Preview as student
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(c)}>
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {c.status !== "published" && c.status !== "archived" && (
                          <DropdownMenuItem onClick={() => setStatus(c.id, "published")}>
                            <Upload /> Publish now
                          </DropdownMenuItem>
                        )}
                        {c.status === "archived" ? (
                          <DropdownMenuItem onClick={() => setStatus(c.id, "draft")}>
                            <ArchiveRestore /> Restore as draft
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setStatus(c.id, "archived")}>
                            <Archive /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => remove(c)}>
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
              {list.length === 0 && (
                <button onClick={() => setCreating(area)} className="grid place-items-center gap-1 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground hover:bg-background">
                  <BookOpen className="size-4" />
                  {filter === "all" ? "No courses yet. Add one." : `Nothing ${STATUS_LABEL[filter as Status].toLowerCase()} here.`}
                </button>
              )}
            </section>
          )
        })}
        <NewArea onAdd={(name) => edit((c) => ({ ...c, areas: [...c.areas, name] }))} />
      </div>

      <NewCourseDialog
        area={creating}
        areas={catalog.areas}
        onClose={() => setCreating(null)}
        onCreate={(course) => {
          edit((c) => ({ ...c, courses: [...c.courses, course] }))
          router.push(`${base}/content/${course.id}`)
        }}
      />
      <BulkUpload
        open={bulk}
        onOpenChange={setBulk}
        areas={catalog.areas}
        onCreate={(course) => {
          edit((c) => ({ ...c, courses: [...c.courses, course] }))
          router.push(`${base}/content/${course.id}`)
        }}
      />
    </div>
  )
}

function NewArea({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="flex h-12 w-56 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/50">
        <Plus className="size-4" /> Add area
      </button>
    )
  return (
    <form
      className="flex w-64 shrink-0 flex-col gap-2 self-start rounded-xl bg-muted/50 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onAdd(name.trim())
        setName("")
        setOpen(false)
      }}
    >
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Area name, e.g. Bonus" />
      <div className="flex gap-2">
        <Button size="sm" type="submit">
          Add
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function NewCourseDialog({ area, areas, onClose, onCreate }: { area: string | null; areas: string[]; onClose: () => void; onCreate: (c: Course) => void }) {
  const [title, setTitle] = useState("")
  const [pick, setPick] = useState(area ?? "")
  const [lastArea, setLastArea] = useState(area)
  if (area !== lastArea) {
    setLastArea(area)
    setPick(area ?? "")
  }
  return (
    <Dialog open={area !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New course</DialogTitle>
          <DialogDescription>It starts as a draft. Students see it once you publish.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            onCreate({
              id: uid("c"),
              title: title.trim(),
              tagline: "",
              area: pick || areas[0],
              status: "draft",
              tiers: [],
              color: Math.floor(Math.random() * 5),
              modules: [{ id: uid("m"), title: "Module 1", lessons: [{ id: uid("l"), title: "First lesson", minutes: 0, status: "draft", chapters: [], downloads: [] }] }],
            })
            setTitle("")
            onClose()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="nc-title">Title</Label>
            <Input id="nc-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order flow basics" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nc-area">Area</Label>
            <select id="nc-area" value={pick} onChange={(e) => setPick(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {areas.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim()}>
              Create and open
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- ADM-10 bulk upload

const SAMPLE_FOLDER = [
  { name: "01 Intro - what order flow is.mp4", size: "412 MB", minutes: 11 },
  { name: "02 Reading the tape.mp4", size: "688 MB", minutes: 18 },
  { name: "03 Footprint charts.mp4", size: "903 MB", minutes: 24 },
  { name: "04 Absorption.mp4", size: "541 MB", minutes: 15 },
  { name: "05 Exhaustion.mp4", size: "498 MB", minutes: 14 },
  { name: "06 Live example ES.mp4", size: "1.2 GB", minutes: 32 },
  { name: "07 Live example NQ.mp4", size: "1.1 GB", minutes: 29 },
]
const AI_MODULES = [
  { title: "Basics", files: [0, 1] },
  { title: "Reading the footprint", files: [2, 3, 4] },
  { title: "Live examples", files: [5, 6] },
]
const cleanName = (f: string) => f.replace(/^\d+\s*/, "").replace(/\.mp4$/, "").replace(/ - /, ": ").replace(/^./, (c) => c.toUpperCase())

/** ADM-10: drop a folder or paste links; uploads run in the background while AI proposes the structure. */
function BulkUpload({ open, onOpenChange, areas, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; areas: string[]; onCreate: (c: Course) => void }) {
  const [files, setFiles] = useState<typeof SAMPLE_FOLDER>([])
  const [pct, setPct] = useState<number[]>([])
  const [links, setLinks] = useState("")
  const [title, setTitle] = useState("Order flow")
  const [area, setArea] = useState(areas[1] ?? areas[0])
  const [over, setOver] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = (list = SAMPLE_FOLDER) => {
    setFiles(list)
    setPct(list.map(() => 0))
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      setPct((p) => {
        const next = p.map((v, i) => Math.min(100, v + (8 + ((i * 7) % 11)) * (i < 3 ? 1.4 : 1)))
        if (next.every((v) => v >= 100) && timer.current) clearInterval(timer.current)
        return next
      })
    }, 300)
  }
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), [])

  const doneCount = pct.filter((v) => v >= 100).length
  const ready = files.length > 0 && doneCount === files.length

  const reset = () => {
    setFiles([])
    setPct([])
    setLinks("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o && !files.length) reset()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk upload</DialogTitle>
          <DialogDescription>Drop a folder of videos or paste links. Uploads keep going in the background, and AI suggests modules and lessons for you to accept or change.</DialogDescription>
        </DialogHeader>

        {files.length === 0 ? (
          <div className="grid gap-4">
            <button
              onDragOver={(e) => (e.preventDefault(), setOver(true))}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => (e.preventDefault(), setOver(false), start())}
              onClick={() => start()}
              className={cn("grid place-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50", over && "border-primary bg-primary/5")}
            >
              <FolderUp className="size-8 text-muted-foreground" />
              <span className="font-medium">Drop a folder here, or click to pick one</span>
              <span className="text-sm text-muted-foreground">MP4, MOV or MKV. Numbered file names keep their order.</span>
            </button>
            <div className="grid gap-2">
              <Label htmlFor="bu-links" className="flex items-center gap-1.5">
                <Link2 className="size-3.5" /> Or import links
              </Label>
              <Textarea id="bu-links" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="One per line: YouTube, Vimeo, Google Drive or Dropbox" className="min-h-20" />
              <Button
                variant="outline"
                className="w-fit"
                disabled={!links.trim()}
                onClick={() => start(links.split("\n").filter(Boolean).map((l, i) => ({ name: `${String(i + 1).padStart(2, "0")} ${l.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}.mp4`, size: "link", minutes: 12 + i })))}
              >
                Import {links.split("\n").filter(Boolean).length || ""} links
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Uploading</span>
                <span className="text-muted-foreground tabular-nums">
                  {doneCount} of {files.length}
                </span>
              </div>
              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                {files.map((f, i) => (
                  <div key={f.name} className="grid gap-1 rounded-lg border p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <FileVideo className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-muted-foreground tabular-nums">{pct[i] >= 100 ? "Done" : `${Math.round(pct[i])}%`}</span>
                    </div>
                    <Progress value={pct[i]} className="h-1" />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid content-start gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                Suggested structure
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="size-3" /> AI
                </Badge>
              </div>
              <div className="grid gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Course title" />
                <select value={area} onChange={(e) => setArea(e.target.value)} className="h-9 rounded-lg border bg-background px-2 text-sm" aria-label="Area">
                  {areas.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 rounded-lg border p-3 text-sm">
                {(files === SAMPLE_FOLDER ? AI_MODULES : [{ title: "Module 1", files: files.map((_, i) => i) }]).map((m) => (
                  <div key={m.title} className="grid gap-1">
                    <span className="font-medium">{m.title}</span>
                    {m.files.map((i) => (
                      <span key={i} className="flex items-center gap-2 pl-3 text-muted-foreground">
                        <span className="size-1 rounded-full bg-current" /> {cleanName(files[i].name)}
                        <span className="ml-auto text-xs tabular-nums">{files[i].minutes}′</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">You can rearrange everything in the course builder. Transcripts and chapters follow when each video is processed.</p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={reset}>
              Start over
            </Button>
            <Button
              onClick={() => {
                const groups = files === SAMPLE_FOLDER ? AI_MODULES : [{ title: "Module 1", files: files.map((_, i) => i) }]
                onCreate({
                  id: uid("c"),
                  title: title || "New course",
                  tagline: "",
                  area,
                  status: "draft",
                  tiers: [],
                  color: 3,
                  modules: groups.map((g) => ({
                    id: uid("m"),
                    title: g.title,
                    lessons: g.files.map((i) => ({ id: uid("l"), title: cleanName(files[i].name), minutes: files[i].minutes, status: "draft" as const, video: files[i].name, chapters: [], downloads: [] })),
                  })),
                })
                toast.success(ready ? "Course created as a draft." : "Course created. Uploads continue in the background.")
                reset()
                onOpenChange(false)
              }}
            >
              Accept and open the course
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
