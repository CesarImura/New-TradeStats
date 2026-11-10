"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
} from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader } from "../kit"
import { AdminButton, AdminFilter, AdminSearch, AdminTabs, AdminToolbar, AdminViewToggle, EmptyState, MediaCard, StatPanel, Tag } from "../ui"
import { CourseCover } from "./course-parts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { STATUS_LABEL, allLessons, isSampleCourse, saveCatalog, uid, useCatalog, type Catalog, type Course, type Status } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { NewCourse } from "./new-course"
import { SampleNotice, SetupTip, useWizardCommunity } from "../setup-checklist"

/** Thumbnail tints for the admin, which keeps its own neutral look. */
export { COVER_TINTS as THUMB } from "./thumbs"

type Filter = "all" | "attention" | Status

/** Published and still holding a lesson that is not ready for students. */
const needsAttention = (c: Course) => c.status === "published" && allLessons(c).some((l) => l.status === "draft")

/** What the card says is out of the ordinary, if anything. */
const attentionOf = (c: Course): { tone: "warning" | "muted"; text: string; action: string } | null => {
  if (c.status === "draft") return { tone: "muted", text: "No one can see this course", action: "Publish" }
  const waiting = allLessons(c).filter((l) => l.status === "draft" || !l.video).length
  return c.status === "published" && waiting ? { tone: "warning", text: `${waiting} ${waiting === 1 ? "lesson isn't" : "lessons aren't"} ready`, action: "Review" } : null
}
const accessOf = (c: Course, tiers: { id: string; name: string }[]) => (c.soldSeparately ? "Sold on its own" : c.tiers.length ? tiers.filter((t) => c.tiers.includes(t.id)).map((t) => t.name).join(", ") : "All tiers")
const statusTone = (s: Status) => (s === "published" ? "success" : s === "scheduled" ? "warning" : "neutral")
const StatusTag = ({ course }: { course: Course }) => (
  <Tag tone={statusTone(course.status)} dot>
    {STATUS_LABEL[course.status]}
    {course.status === "scheduled" && course.scheduledFor ? ` · ${course.scheduledFor}` : ""}
  </Tag>
)

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
  const [method, setMethod] = useState<"blank" | "folder">("blank")
  const [picked, setPicked] = useState<string[]>([])
  const openWizard = (m: "blank" | "folder") => (setMethod(m), setCreating(true))
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

  const menu = (c: Course, hierarchy: "ghost" | "secondary") => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<AdminButton hierarchy={hierarchy} size="md" iconOnly aria-label={`Actions for ${c.title}`} />}>
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
  )

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="Content"
        text={catalog.courses.length === 0 ? "No courses yet" : `${catalog.courses.length} ${catalog.courses.length === 1 ? "course" : "courses"} · ${catalog.courses.reduce((n, c) => n + allLessons(c).length, 0)} lessons`}
        actions={
          <AdminButton onClick={() => openWizard("blank")}>
            <Plus /> New course
          </AdminButton>
        }
      />
      {catalog.courses.length === 0 ? (
        <EmptyState icon={Play} title="Create your first course" description="Start blank, upload a folder of videos or import links. Videos keep uploading while you work."
          actions={<><AdminButton onClick={() => openWizard("blank")}><Plus /> New course</AdminButton><AdminButton hierarchy="secondary" onClick={() => openWizard("folder")}><Upload /> Upload a folder</AdminButton></>} className="py-14" />
      ) : (
        <>
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
        <AdminSearch value={q} onChange={setQ} placeholder="Search courses and lessons" hint="⌘K" className="w-[240px]" />
        <AdminFilter ariaLabel="Tier" value={tierSel} onValueChange={setTierSel} options={[{ value: "all", label: "All tiers" }, ...coach.tiers.map((t) => ({ value: t.id, label: t.name }))]} />
        <AdminFilter ariaLabel="Sort" value={sort} onValueChange={setSort} options={[{ value: "edited", label: "Last edited" }, { value: "name", label: "Name" }]} />
        <AdminViewToggle value={view} onChange={setView} />
      </AdminToolbar>

      {view === "list" && list.length > 0 && (
        <div className="overflow-hidden rounded-a-lg border border-a-border bg-a-panel">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10"><Checkbox aria-label="Select all courses" checked={picked.length > 0 && picked.length === list.length} onCheckedChange={(v) => setPicked(v ? list.map((c) => c.id) : [])} /></TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attention</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Done</TableHead>
                <TableHead className="text-right">Edited</TableHead>
                <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => {
                const live = c.status === "published"
                const seed = [...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0)
                const att = attentionOf(c)
                return (
                  <TableRow key={c.id} className="cursor-pointer" data-state={picked.includes(c.id) ? "selected" : undefined} onClick={() => router.push(`${base}/content/${c.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${c.title}`} checked={picked.includes(c.id)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))} /></TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <CourseCover course={c} className="h-8 w-12 shrink-0 rounded-a-xs border border-a-border" />
                        <div className="grid min-w-0">
                          <span className="truncate t-body-m text-a-text">{c.title}</span>
                          <span className="truncate t-caption text-a-text-2">{c.tagline}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><StatusTag course={c} /></TableCell>
                    <TableCell>{att ? <span className="flex items-center gap-2 t-body-m text-a-text-2"><span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", att.tone === "warning" ? "bg-a-warning-fill" : "bg-a-text-3")} />{att.text}</span> : <span className="text-a-text-3">—</span>}</TableCell>
                    <TableCell className="t-body-m text-a-text">{accessOf(c, coach.tiers)}</TableCell>
                    <TableCell className="text-right tabular-nums">{allLessons(c).length}</TableCell>
                    <TableCell className="text-right tabular-nums">{live ? 80 + ((seed * 37) % 120) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{live ? `${20 + ((seed * 13) % 60)}%` : "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-a-text-3">{c.edited ?? "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{menu(c, "ghost")}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex min-h-11 items-center gap-2 border-t border-a-border-subtle px-5 py-2 t-body-m text-a-text-2">
            {picked.length === 0 ? (
              <span>{list.length} {list.length === 1 ? "course" : "courses"} · select rows to publish or archive several</span>
            ) : (
              <>
                <span className="flex-1 text-a-text">{picked.length} selected</span>
                <AdminButton hierarchy="secondary" size="md" onClick={() => (picked.forEach((id) => setStatus(id, "published")), setPicked([]))}>Publish</AdminButton>
                <AdminButton hierarchy="secondary" size="md" onClick={() => (picked.forEach((id) => setStatus(id, "archived")), setPicked([]))}>Archive</AdminButton>
                <AdminButton hierarchy="ghost" size="md" onClick={() => setPicked([])}>Clear</AdminButton>
              </>
            )}
          </div>
        </div>
      )}

      <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", view === "list" && list.length > 0 && "hidden")}>
        {list.map((c) => {
          const lessons = allLessons(c)
          const live = c.status === "published"
          const seed = [...c.id].reduce((n, ch) => n + ch.charCodeAt(0), 0)
          const att = attentionOf(c)
          return (
            <MediaCard key={c.id} data-interactive className={cn(c.status === "archived" && "opacity-70")}
              cover={
                <>
                  <Link href={`${base}/content/${c.id}`} aria-label={c.title} className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus" />
                  <CourseCover course={c} className="aspect-[2.3] w-full">
                    <span className="absolute top-3 left-3"><StatusTag course={c} /></span>
                    {att && (
                      <span className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-a-md bg-a-page/80 px-3 py-2 t-body-m text-a-text backdrop-blur-sm">
                        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", att.tone === "warning" ? "bg-a-warning-fill" : "bg-a-text-3")} />
                        <span className="min-w-0 flex-1 truncate">{att.text}</span>
                        <span className="shrink-0 text-a-text-2">{att.action}</span>
                      </span>
                    )}
                  </CourseCover>
                  <span className="absolute top-2.5 right-2.5 z-20">{menu(c, "ghost")}</span>
                </>
              }
              title={c.title} subtitle={c.tagline}
              meta={<>{sample(c.id) && <Tag>Sample</Tag>}<span className="min-w-0 flex-1 truncate text-a-text-2">{accessOf(c, coach.tiers)}</span>{c.edited && <span className="shrink-0 text-a-text-3">Edited {c.edited}</span>}</>}
              stats={[[String(lessons.length), "Lessons"], [live ? String(80 + ((seed * 37) % 120)) : "—", "Students"], [live ? `${20 + ((seed * 13) % 60)}%` : "—", "Completed"]]} />
          )
        })}
        {list.length === 0 && (
          <button onClick={() => openWizard("blank")} className="grid place-items-center gap-1 rounded-a-lg border border-dashed border-a-border-strong p-10 text-center t-body-m text-a-text-2 outline-none transition-colors duration-300 hover:bg-a-hover sm:col-span-2 xl:col-span-3">
            <BookOpen className="size-5" />
            {filter === "all" ? "No courses yet. Add your first one." : filter === "attention" ? "Nothing needs attention." : `Nothing ${STATUS_LABEL[filter as Status].toLowerCase()} here.`}
          </button>
        )}
      </div>
        </>
      )}

      <NewCourse
        open={creating}
        onOpenChange={setCreating}
        area={catalog.areas[0] ?? "Core"}
        initialMethod={method}
        onCreate={(course, o) => {
          edit((c) => ({ ...c, courses: [...c.courses, course] }))
          if (o.open) router.push(`${base}/content/${course.id}`)
        }}
      />
    </div>
  )
}
