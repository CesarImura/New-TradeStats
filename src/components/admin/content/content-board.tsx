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
import { PageHeader } from "../kit"
import { AdminFilter, AdminSearch, AdminTabs, AdminToolbar, AdminViewToggle, StatPanel } from "../ui"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABEL, allLessons, isSampleCourse, saveCatalog, uid, useCatalog, type Catalog, type Course, type Status } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { Tile } from "./thumbs"
import { videoFrames } from "@/lib/video-frames"
import { SampleNotice, SetupTip, useWizardCommunity } from "../setup-checklist"

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
export { COVER_TINTS as THUMB } from "./thumbs"

type Filter = "all" | "attention" | Status

/** Published and still holding a lesson that is not ready for students. */
const needsAttention = (c: Course) => c.status === "published" && allLessons(c).some((l) => l.status === "draft")

/** ADM-08: areas and courses as a board; drafts, scheduled and archived. */
export function ContentBoard() {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  // A community made in setup starts on the sample courses; they carry a "Sample" label until replaced.
  const wizard = useWizardCommunity(coach.slug)
  const sample = (id: string) => !!wizard && isSampleCourse(coach, id)
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [creating, setCreating] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [q, setQ] = useState("")
  const [tierSel, setTierSel] = useState("all")
  const [sort, setSort] = useState("edited")
  const [view, setView] = useState<"grid" | "list">("grid")

  const edit = (fn: (c: Catalog) => Catalog) => saveCatalog(coach, fn)
  const inFilter = (c: Course, f: Filter) => (f === "all" ? c.status !== "archived" : f === "attention" ? needsAttention(c) : c.status === f)
  const count = (f: Filter) => catalog.courses.filter((c) => inFilter(c, f)).length
  const list = catalog.courses
    .filter((c) => inFilter(c, filter) && (tierSel === "all" || !c.tiers.length || c.tiers.includes(tierSel)) && `${c.title} ${c.tagline}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === "name" ? a.title.localeCompare(b.title) : 0))

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

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="Content"
        text={`${catalog.courses.length} ${catalog.courses.length === 1 ? "course" : "courses"} · ${catalog.courses.reduce((n, c) => n + allLessons(c).length, 0)} lessons`}
        actions={
          <>
            <Button variant="outline" onClick={() => setBulk(true)}>
              <FolderUp /> Bulk upload
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus /> New course
            </Button>
          </>
        }
      />
      <StatPanel
        stats={[
          { label: "Enrolled students", value: "201", delta: "+12 vs last 30 days" },
          { label: "Active this week", value: 86, delta: "43% of enrolled" },
          { label: "Avg. completion", value: "44%", delta: "+3 pp vs last 30 days", tone: "success" },
          { label: "Where students stop", value: "Lesson 2", delta: "Price action playbook · 31% don't go past it" },
        ]}
      />
      <SetupTip task="course" />
      <SampleNotice show={catalog.courses.some((c) => sample(c.id))}>
        Courses marked Sample are examples, so you can see how your courses look. Replace or delete them before you invite students.
      </SampleNotice>

      <AdminToolbar>
        <AdminTabs
          label="Courses"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          tabs={(["all", "attention", "published", "scheduled", "draft", "archived"] as Filter[]).map((f) => ({
            id: f,
            label: f === "all" ? "All" : f === "attention" ? "Needs attention" : STATUS_LABEL[f as Status],
            count: count(f),
            dot: f === "attention" && count(f) > 0,
          }))}
        />
        <div className="flex-1" />
        <AdminSearch value={q} onChange={setQ} placeholder="Search courses and lessons" hint="⌘K" className="w-60" />
        <AdminFilter ariaLabel="Tier" value={tierSel} onValueChange={setTierSel} options={[{ value: "all", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
        <AdminFilter ariaLabel="Sort" value={sort} onValueChange={setSort} options={[{ value: "edited", label: "Last edited" }, { value: "name", label: "Name" }]} />
        <AdminViewToggle value={view} onChange={setView} />
      </AdminToolbar>

      {view === "list" && list.length > 0 && (
        <div className="overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tiers</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`${base}/content/${c.id}`)}>
                  <TableCell>
                    <div className="grid min-w-0">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.tagline}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} when={c.scheduledFor} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.tiers.length ? coach.tiers.filter((t) => c.tiers.includes(t.id)).map((t) => t.name).join(", ") : "All tiers"}</TableCell>
                  <TableCell className="text-right tabular-nums">{allLessons(c).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", view === "list" && list.length > 0 && "hidden")}>
        {list.map((c) => {
          const lessons = allLessons(c)
          const live = c.status === "published"
          const seed = [...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0)
          const tiers = c.tiers.length ? coach.tiers.filter((t) => c.tiers.includes(t.id)).map((t) => t.name).join(", ") : "All tiers"
          return (
            <div key={c.id} data-interactive className={cn("group relative overflow-hidden rounded-xl border bg-card", c.status === "archived" && "opacity-70")}>
              <Link href={`${base}/content/${c.id}`} className="block">
                <div data-media>
                  <Tile src={c.cover} color={c.color} className="aspect-[16/7]">
                    <span className="absolute top-2.5 left-2.5"><StatusBadge status={c.status} when={c.scheduledFor} /></span>
                  </Tile>
                </div>
                <div className="grid gap-3 px-4 pt-4">
                  <div className="grid gap-0.5">
                    <span className="text-sm leading-tight font-medium">{c.title}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{c.tagline}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sample(c.id) && <Badge variant="outline">Sample</Badge>}
                    <span className="truncate text-xs text-muted-foreground">{tiers}</span>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-a-border-subtle px-4 py-3">
                  {[
                    [String(lessons.length), "Lessons"],
                    [live ? String(80 + ((seed * 37) % 120)) : "—", "Students"],
                    [live ? `${20 + ((seed * 13) % 60)}%` : "—", "Completed"],
                  ].map(([v, l]) => (
                    <div key={l} className="grid gap-0.5">
                      <dd className="text-sm font-medium tabular-nums">{v}</dd>
                      <dt className="t-caption text-a-text-2">{l}</dt>
                    </div>
                  ))}
                </dl>
              </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="secondary" size="icon-xs" className="absolute top-2.5 right-2.5" aria-label={`Actions for ${c.title}`} />}>
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
          <button onClick={() => setCreating(true)} className="grid place-items-center gap-1 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground hover:bg-muted/50 sm:col-span-2 xl:col-span-3">
            <BookOpen className="size-5" />
            {filter === "all" ? "No courses yet. Add your first one." : filter === "attention" ? "Nothing needs attention." : `Nothing ${STATUS_LABEL[filter as Status].toLowerCase()} here.`}
          </button>
        )}
      </div>

      <NewCourseDialog
        open={creating}
        area={catalog.areas[0] ?? "Core"}
        onClose={() => setCreating(false)}
        onCreate={(course) => {
          edit((c) => ({ ...c, courses: [...c.courses, course] }))
          router.push(`${base}/content/${course.id}`)
        }}
      />
      <BulkUpload
        open={bulk}
        onOpenChange={setBulk}
        area={catalog.areas[0] ?? "Core"}
        onCreate={(course) => {
          edit((c) => ({ ...c, courses: [...c.courses, course] }))
          router.push(`${base}/content/${course.id}`)
        }}
      />
    </div>
  )
}

function NewCourseDialog({ open, area, onClose, onCreate }: { open: boolean; area: string; onClose: () => void; onCreate: (c: Course) => void }) {
  const [title, setTitle] = useState("")
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
              area,
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
type Entry = { name: string; size: string; minutes: number; thumb?: string }
const sizeOf = (bytes: number) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1e6))} MB`)
const AI_MODULES = [
  { title: "Basics", files: [0, 1] },
  { title: "Reading the footprint", files: [2, 3, 4] },
  { title: "Live examples", files: [5, 6] },
]
const cleanName = (f: string) => f.replace(/^\d+\s*/, "").replace(/\.(mp4|mov|mkv|webm|m4v)$/i, "").replace(/ - /, ": ").replace(/^./, (c) => c.toUpperCase())

/** ADM-10: drop a folder or paste links; uploads run in the background while AI proposes the structure. */
function BulkUpload({ open, onOpenChange, area, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; area: string; onCreate: (c: Course) => void }) {
  const [files, setFiles] = useState<Entry[]>([])
  const [reading, setReading] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number[]>([])
  const [links, setLinks] = useState("")
  const [title, setTitle] = useState("Order flow")
  const [over, setOver] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Real videos the coach dropped or picked: each gets its real length and a thumbnail from the middle of the video. */
  const startWith = async (picked: File[]) => {
    const videos = picked.filter((f) => f.type.startsWith("video/")).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    // Nothing readable (a folder dropped, say): the sample folder keeps the demo working.
    if (!videos.length) return start()
    setReading(true)
    const list = await Promise.all(
      videos.map(async (f): Promise<Entry> => {
        try {
          const { frames, seconds } = await videoFrames(f, { count: 1, width: 480 })
          return { name: f.name, size: sizeOf(f.size), minutes: Math.max(1, Math.round(seconds / 60)), thumb: frames[0] }
        } catch {
          // A video this browser can't read is still added, with the course cover as its thumbnail.
          return { name: f.name, size: sizeOf(f.size), minutes: 10 }
        }
      }),
    )
    setReading(false)
    start(list)
  }
  const start = (list: Entry[] = SAMPLE_FOLDER) => {
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
              onDrop={(e) => (e.preventDefault(), setOver(false), void startWith([...e.dataTransfer.files]))}
              onClick={() => input.current?.click()}
              className={cn("grid place-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/50", over && "border-primary bg-primary/5")}
            >
              <FolderUp className="size-8 text-muted-foreground" />
              <span className="font-medium">{reading ? "Reading your videos…" : "Drop your videos here, or click to pick them"}</span>
              <span className="text-sm text-muted-foreground">MP4, MOV or WebM. Numbered file names keep their order, and each lesson gets a thumbnail from its video.</span>
            </button>
            <input ref={input} type="file" accept="video/*" multiple aria-label="Videos" className="sr-only" onChange={(e) => (void startWith([...(e.target.files ?? [])]), (e.target.value = ""))} />
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
                  <div key={f.name} className="grid gap-1 rounded-lg border p-2 bg-card">
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
              </div>
              <div className="grid gap-2 rounded-lg border p-3 text-sm bg-card">
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
                    lessons: g.files.map((i) => ({ id: uid("l"), title: cleanName(files[i].name), minutes: files[i].minutes, status: "draft" as const, video: files[i].name, thumbnail: files[i].thumb, chapters: [], downloads: [] })),
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
