"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Check, Lock, NotebookPen, Play, Search } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  allLessons,
  canAccess,
  courseStats,
  fmtTime,
  resumeLesson,
  studentCourses,
  useCatalog,
  useProgress,
  type Course,
} from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { groupOpening, useAccess, useViewerGroup } from "@/lib/data/access"
import { CourseCover, UpgradeDialog, hours, useStudentTier } from "./shared"
import { OwnTitle } from "@/components/student/own-title"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** Courses per row, by the gallery's "Courses per row" setting (Design → Pages). */
const COLUMNS: Record<string, string> = {
  auto: "sm:grid-cols-2 xl:grid-cols-3",
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
}

/**
 * STU-02 courses overview, with My notes (STU-29) as a second tab. As the
 * Courses page's core widget it is a gallery the coach sets up: courses per
 * row, card style (cover on top, cover beside, list), the area filter and the
 * "pick up where you left off" card.
 */
export function StudentCourses({ props = {} }: { props?: Record<string, string | boolean> } = {}) {
  const columns = COLUMNS[(props.columns as string) ?? "auto"] ?? COLUMNS.auto
  const card = (props.card as string) ?? "cover"
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useStudentTier()
  const access = useAccess(coach.slug)
  const group = useViewerGroup(coach)
  // The coach decides whether courses of other tiers show locked (as an upsell) or not at all.
  const courses = studentCourses(catalog).filter((c) => access.locked === "show" || canAccess(c, tier))
  const [area, setArea] = useState("all")
  const [locked, setLocked] = useState<Course | null>(null)

  const areas = catalog.areas.filter((a) => courses.some((c) => c.area === a))
  const shown = courses.filter((c) => area === "all" || c.area === area)

  // Resume: the last lesson opened, else the first unfinished one in an open course.
  const resume = (() => {
    for (const c of courses) {
      if (!canAccess(c, tier)) continue
      const l = allLessons(c).find((x) => x.id === progress.last && x.status === "published" && !progress.done.includes(x.id))
      if (l) return { course: c, lesson: l }
    }
    for (const c of courses) {
      if (!canAccess(c, tier)) continue
      const r = resumeLesson(c, progress)
      if (r) return { course: c, lesson: r.lesson }
    }
    return null
  })()

  const noteCount = Object.values(progress.notes).reduce((n, list) => n + list.length, 0)

  return (
    <div className="flex flex-col page-gap">
      <OwnTitle>
        <div className="flex flex-col gap-1">
        <span className="eyebrow">
          {courses.length} {courses.length === 1 ? "course" : "courses"} · {coach.name}
        </span>
        <h1 className="text-3xl leading-tight md:text-4xl">{coach.wording.courses}</h1>
      </div>
      </OwnTitle>

      {courses.length === 0 ? (
        <Card className="items-center gap-3 rounded-(--radius) px-6 py-12 text-center">
          <BookOpen className="size-8 text-muted-foreground" />
          <p className="font-medium">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {coach.coachName}&apos;s first {coach.wording.lesson.toLowerCase()} will show here as soon as it&apos;s published.
          </p>
        </Card>
      ) : (
        <Tabs defaultValue="courses" className="gap-5">
          <TabsList>
            <TabsTrigger value="courses">All {coach.wording.courses.toLowerCase()}</TabsTrigger>
            <TabsTrigger value="notes">
              My notes {noteCount > 0 && <span className="text-muted-foreground tabular-nums">{noteCount}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="flex flex-col page-gap">
            {resume && props.resume !== false && <ResumeCard course={resume.course} lessonId={resume.lesson.id} />}

            {areas.length > 1 && props.filters !== false && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Area">
                {["all", ...areas].map((a) => (
                  <button
                    key={a}
                    role="radio"
                    aria-checked={area === a}
                    onClick={() => setArea(a)}
                    className={cn(
                      "r-chip border px-3 py-1.5 text-sm transition-colors",
                      area === a ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {a === "all" ? "Everything" : a}
                  </button>
                ))}
              </div>
            )}

            <div className={cn("grid gap-[var(--page-gap)]", card === "list" ? "" : columns)}>
              {shown.map((c) => {
                const opening = groupOpening(access, c.id, group)
                const open = canAccess(c, tier) && (!opening || opening.open)
                const waits = canAccess(c, tier) && !open
                const s = courseStats(c, progress)
                const needs = coach.tiers.find((t) => c.tiers.includes(t.id))
                const body = (
                  <>
                    {card !== "list" && <CourseCover course={c} locked={!open} className={card === "side" ? "aspect-[4/3] w-2/5 shrink-0 self-stretch" : "aspect-[16/8]"} />}
                    <div className="flex flex-1 flex-col gap-3 p-[calc(1rem*var(--density,1))]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid gap-0.5">
                          <span className="eyebrow">{c.area}</span>
                          <h3 className="text-lg leading-tight">{c.title}</h3>
                        </div>
                        {waits ? (
                          <Badge variant="secondary" className="shrink-0 gap-1">
                            <Lock className="size-3" /> Opens {opening?.date}
                          </Badge>
                        ) : !open ? (
                          <Badge variant="secondary" className="shrink-0 gap-1">
                            <Lock className="size-3" /> {needs?.name}
                          </Badge>
                        ) : s.pct === 100 ? (
                          <Badge className="shrink-0 gap-1">
                            <Check className="size-3" /> Done
                          </Badge>
                        ) : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{c.tagline}</p>
                      <div className="mt-auto grid gap-2">
                        {open && <Progress value={s.pct} className="h-1.5" />}
                        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                          <span>
                            {open ? `${s.done} of ${s.lessons}` : s.lessons} {coach.wording.lesson.toLowerCase()}s · {hours(s.minutes)}
                          </span>
                          {open && <span>{s.pct}%</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )
                const cls = cn(
                  "group flex overflow-hidden rounded-(--radius) bg-card text-left text-card-foreground transition-transform hover:-translate-y-0.5",
                  card === "cover" ? "flex-col" : "flex-row",
                )
                if (waits)
                  return (
                    <div key={c.id} className={cls} style={{ boxShadow: "var(--card-shadow)" }} title={`Opens for ${group?.name} on ${opening?.date}`}>
                      {body}
                    </div>
                  )
                return open ? (
                  <Link key={c.id} href={`${base}/courses/${c.id}`} className={cls} style={{ boxShadow: "var(--card-shadow)" }}>
                    {body}
                  </Link>
                ) : (
                  <button key={c.id} onClick={() => setLocked(c)} className={cls} style={{ boxShadow: "var(--card-shadow)" }}>
                    {body}
                  </button>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <MyNotes />
          </TabsContent>
        </Tabs>
      )}

      <UpgradeDialog course={locked} open={!!locked} onOpenChange={(o) => !o && setLocked(null)} />
    </div>
  )
}

function ResumeCard({ course, lessonId }: { course: Course; lessonId: string }) {
  const { base, coach } = useCoach()
  const progress = useProgress(coach.slug)
  const s = courseStats(course, progress)
  const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lessonId))
  const lesson = mod?.lessons.find((l) => l.id === lessonId)
  if (!lesson) return null
  return (
    <div className="@container relative isolate overflow-hidden rounded-(--radius) text-white" style={{ boxShadow: "var(--card-shadow)" }}>
      <CourseCover course={course} className="absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />
      <div className="flex flex-col gap-4 p-[calc(1.5rem*var(--density,1))] @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div className="grid max-w-xl gap-1.5">
          <span className="text-[0.7rem] font-medium tracking-wide text-white/75 uppercase">Pick up where you left off</span>
          <span className="font-heading text-2xl leading-tight @lg:text-3xl">{lesson.title}</span>
          <span className="text-sm text-white/80">
            {course.title} · {mod?.title} · {lesson.minutes} min
          </span>
          <div className="mt-2 flex max-w-xs items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${s.pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-white/80">{s.pct}%</span>
          </div>
        </div>
        <Button size="lg" variant="secondary" className="self-start @2xl:self-auto" {...link(`${base}/courses/${course.id}/${lesson.id}`)}>
          <Play /> Continue
        </Button>
      </div>
    </div>
  )
}

/** STU-29: every note across lessons, searchable, each with its video moment. */
function MyNotes() {
  const { coach, base } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const [q, setQ] = useState("")
  const rows = catalog.courses.flatMap((c) =>
    c.modules.flatMap((m) =>
      m.lessons.flatMap((l) => (progress.notes[l.id] ?? []).map((n) => ({ ...n, course: c, lesson: l }))),
    ),
  )
  const hits = rows.filter((r) => !q || `${r.text} ${r.lesson.title} ${r.course.title}`.toLowerCase().includes(q.toLowerCase()))

  if (rows.length === 0) {
    return (
      <Card className="items-center gap-3 rounded-(--radius) px-6 py-12 text-center">
        <NotebookPen className="size-8 text-muted-foreground" />
        <p className="font-medium">No notes yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          While you watch, add a note under the video. It&apos;s saved with the exact moment, so you can jump straight back.
        </p>
      </Card>
    )
  }
  return (
    <div className="grid gap-4">
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your notes" className="pl-9" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {hits.map((r) => (
          <Link
            key={r.id}
            href={`${base}/courses/${r.course.id}/${r.lesson.id}?t=${r.at}`}
            className="grid gap-2 rounded-(--radius) bg-card p-4 text-card-foreground transition-colors hover:bg-muted/60"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="r-chip bg-primary/10 px-1.5 py-0.5 font-medium text-primary tabular-nums">{fmtTime(r.at)}</span>
              <span className="truncate">
                {r.course.title} · {r.lesson.title}
              </span>
            </div>
            <p className="text-sm whitespace-pre-line">{r.text}</p>
          </Link>
        ))}
        {hits.length === 0 && <p className="text-sm text-muted-foreground">No notes match “{q}”.</p>}
      </div>
    </div>
  )
}
