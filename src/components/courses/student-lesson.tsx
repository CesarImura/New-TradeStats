"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Captions,
  Check,
  CircleHelp,
  FileDown,
  Lock,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { series } from "@/components/widgets/kit"
import { Cover } from "@/components/widgets/shared"
import {
  asPreview,
  canAccess,
  findLesson,
  fmtTime,
  gateBefore,
  neighbours,
  openLessons,
  uid,
  updateProgress,
  useCatalog,
  useProgress,
  visibleLessons,
  type Course,
  type Lesson,
  type Quiz,
} from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AiMark, PreviewNotice, UpgradeDialog, useStudentTier } from "./shared"
import { NotFound } from "./student-course"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** STU-04 lesson, with the quiz (STU-05) and notes (STU-29). */
export function StudentLesson({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { coach, base, preview } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useStudentTier()
  const q = preview ? "?preview=draft" : ""
  const raw = catalog.courses.find((c) => c.id === courseId && (preview || c.status === "published"))
  const course = raw && preview ? asPreview(raw) : raw
  const found = course ? findLesson(course, lessonId) : null
  const startAt = Number(useSearchParams().get("t") ?? 0)
  const [time, setTime] = useState(startAt)
  const [upgrade, setUpgrade] = useState(false)

  // Remember the last lesson opened, for "Continue" on Home and in Courses.
  useEffect(() => {
    if (found?.lesson.status === "published") updateProgress(coach.slug, (p) => (p.last === lessonId ? p : { ...p, last: lessonId }))
  }, [coach.slug, lessonId, found?.lesson.status])

  if (!course || !found || (found.lesson.status !== "published" && found.lesson.status !== "scheduled")) return <NotFound />
  const { lesson, module } = found
  const open = canAccess(course, tier)
  const gate = gateBefore(course, lesson.id, progress)
  const blocked = !open ? "tier" : lesson.status === "scheduled" ? "scheduled" : gate ? "gate" : null
  const done = progress.done.includes(lesson.id)
  const { prev, next } = neighbours(course, lesson.id)
  const index = openLessons(course).findIndex((l) => l.id === lesson.id)
  const quizPassed = !lesson.quiz || (progress.quiz[lesson.id] ?? -1) >= lesson.quiz.passMark
  const nextBlocked = !!lesson.quiz?.gate && !quizPassed

  const setDone = (v: boolean) => updateProgress(coach.slug, (p) => ({ ...p, done: v ? [...new Set([...p.done, lesson.id])] : p.done.filter((x) => x !== lesson.id) }))

  return (
    <div className="flex flex-col page-gap">
      <PreviewNotice />
      <Link href={`${base}/courses/${course.id}${q}`} className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {course.title}
      </Link>

      <div className="grid items-start gap-[var(--page-gap)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {blocked ? (
            <LockedPlayer course={course} lesson={lesson} reason={blocked} gate={gate} onUpgrade={() => setUpgrade(true)} />
          ) : (
            <Player
              key={lesson.id}
              lesson={lesson}
              color={course.color}
              t={time}
              setT={setTime}
              autoPlay={startAt > 0}
              onEnd={() => {
                if (done) return
                setDone(true)
                toast.success("Marked as done")
              }}
            />
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-1">
              <span className="eyebrow">
                {module.title} · {coach.wording.lesson} {index + 1} of {openLessons(course).length}
              </span>
              <h1 className="text-2xl leading-tight md:text-3xl">{lesson.title}</h1>
            </div>
            {!blocked && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant={done ? "secondary" : "outline"} onClick={() => setDone(!done)}>
                  <Check /> {done ? "Done" : "Mark as done"}
                </Button>
                {next && (
                  <Button
                    disabled={nextBlocked}
                    title={nextBlocked ? "Pass the quiz first" : undefined}
                    {...(nextBlocked ? {} : link(`${base}/courses/${course.id}/${next.id}${q}`))}
                    onClick={() => !done && setDone(true)}
                  >
                    Next {coach.wording.lesson.toLowerCase()} <ArrowRight />
                  </Button>
                )}
              </div>
            )}
          </div>

          {!blocked && <LessonTabs lesson={lesson} time={time} />}
          {!blocked && lesson.quiz && <QuizCard lesson={lesson} quiz={lesson.quiz} nextTitle={next?.title} />}

          {!blocked && (
            <div className="flex justify-between gap-3 border-t pt-4 text-sm">
              {prev ? (
                <Link href={`${base}/courses/${course.id}/${prev.id}${q}`} className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-4 shrink-0" /> <span className="truncate">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && !nextBlocked && (
                <Link href={`${base}/courses/${course.id}/${next.id}${q}`} className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <span className="truncate">{next.title}</span> <ArrowRight className="size-4 shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-[var(--page-gap)] lg:sticky lg:top-20">
          <Outline course={course} current={lesson.id} />
          {coach.modules.ai && !blocked && <AskAi lesson={lesson} />}
        </aside>
      </div>

      <UpgradeDialog course={course} open={upgrade} onOpenChange={setUpgrade} />
    </div>
  )
}

// ---------- player

/** Stand-in video player: plays in real time, with chapters on the bar. */
function Player({
  lesson,
  color,
  t,
  setT,
  autoPlay,
  onEnd,
}: {
  lesson: Lesson
  color: number
  t: number
  setT: React.Dispatch<React.SetStateAction<number>>
  autoPlay: boolean
  onEnd: () => void
}) {
  const duration = lesson.minutes * 60
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const [captions, setCaptions] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const bar = useRef<HTMLDivElement>(null)

  // Plays in real time; stops and reports the end when it gets there.
  const now = useRef(t)
  const end = useRef(onEnd)
  useEffect(() => {
    now.current = t
    end.current = onEnd
  })
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const next = Math.min(duration, now.current + 0.25 * speed)
      setT(next)
      if (next >= duration) {
        setPlaying(false)
        end.current()
      }
    }, 250)
    return () => clearInterval(id)
  }, [playing, speed, duration, setT])

  // Jumps from chapters, notes and the AI panel.
  useEffect(() => {
    const onSeek = (e: Event) => {
      setT((e as CustomEvent<number>).detail)
      setPlaying(true)
    }
    window.addEventListener("lesson-seek", onSeek)
    return () => window.removeEventListener("lesson-seek", onSeek)
  }, [setT])

  const chapter = [...lesson.chapters].reverse().find((c) => c.at <= t)
  const line = lesson.transcript?.slice().reverse().find((l) => toSec(l) <= t)
  const fromX = (x: number) => {
    const r = bar.current!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (x - r.left) / r.width)) * duration
  }

  return (
    <div className="group/player relative overflow-hidden rounded-(--radius) bg-black text-white select-none" style={{ boxShadow: "var(--card-shadow)" }}>
      <button className="relative block aspect-video w-full" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
        <Cover color={series(color)} className="absolute inset-0 rounded-none" />
        <div className={cn("absolute inset-0 bg-black/30 transition-opacity", playing && "opacity-0")} />
        {!playing && (
          <span className="absolute top-1/2 left-1/2 grid size-16 -translate-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover/player:scale-105">
            <Play className="ml-1 size-7 fill-current" />
          </span>
        )}
        {captions && line && (
          <span className="absolute bottom-16 left-1/2 max-w-[80%] -translate-x-1/2 rounded bg-black/75 px-3 py-1.5 text-sm">{line.replace(/^\d+:\d+\s*/, "")}</span>
        )}
      </button>

      <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 transition-opacity", playing && "opacity-0 group-hover/player:opacity-100")}>
        <div
          ref={bar}
          className="relative mb-2 h-4 cursor-pointer"
          onPointerMove={(e) => setHover(fromX(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => setT(fromX(e.clientX))}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25" />
          <div className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ width: `${(t / duration) * 100}%` }} />
          {lesson.chapters.slice(1).map((c) => (
            <span key={c.at} className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-black/70" style={{ left: `${(c.at / duration) * 100}%` }} />
          ))}
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${(t / duration) * 100}%` }} />
          {hover !== null && (
            <span className="pointer-events-none absolute bottom-5 -translate-x-1/2 rounded bg-black/85 px-2 py-1 text-xs whitespace-nowrap" style={{ left: `${(hover / duration) * 100}%` }}>
              {fmtTime(hover)}
              {lesson.chapters.length > 0 && ` · ${[...lesson.chapters].reverse().find((c) => c.at <= hover)?.title ?? ""}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <CtrlButton label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
          </CtrlButton>
          <CtrlButton label="Back 10 seconds" onClick={() => setT((x) => Math.max(0, x - 10))}>
            <RotateCcw className="size-4" />
          </CtrlButton>
          <CtrlButton label="Forward 10 seconds" onClick={() => setT((x) => Math.min(duration, x + 10))}>
            <RotateCw className="size-4" />
          </CtrlButton>
          <span className="ml-1 tabular-nums">
            {fmtTime(t)} <span className="text-white/60">/ {fmtTime(duration)}</span>
          </span>
          {chapter && <span className="ml-2 hidden truncate text-white/80 sm:inline">· {chapter.title}</span>}
          <span className="ml-auto" />
          <button className="rounded px-2 py-1 text-xs font-medium tabular-nums hover:bg-white/15" onClick={() => setSpeed((s) => (s >= 2 ? 1 : s + 0.25))} aria-label="Playback speed">
            {speed}×
          </button>
          <CtrlButton label="Captions" onClick={() => setCaptions((c) => !c)} active={captions}>
            <Captions className="size-4" />
          </CtrlButton>
          <CtrlButton label="Full screen" onClick={() => toast("Full screen in the real player.")}>
            <Maximize className="size-4" />
          </CtrlButton>
        </div>
      </div>
    </div>
  )
}

const toSec = (line: string) => {
  const m = line.match(/^(\d+):(\d+)/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0
}

function CtrlButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cn("grid size-8 place-items-center rounded hover:bg-white/15", active && "bg-white/20")}>
      {children}
    </button>
  )
}

const seek = (at: number) => window.dispatchEvent(new CustomEvent("lesson-seek", { detail: at }))

function LockedPlayer({ course, lesson, reason, gate, onUpgrade }: { course: Course; lesson: Lesson; reason: "tier" | "scheduled" | "gate"; gate: Lesson | null; onUpgrade: () => void }) {
  const { base, coach, preview } = useCoach()
  const q = preview ? "?preview=draft" : ""
  const tier = coach.tiers.find((t) => course.tiers.includes(t.id))
  return (
    <div className="relative grid aspect-video place-items-center overflow-hidden rounded-(--radius) text-center text-white" style={{ boxShadow: "var(--card-shadow)" }}>
      <Cover color={series(course.color)} className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative grid max-w-sm justify-items-center gap-3 px-6">
        <Lock className="size-7" />
        <p className="font-heading text-xl">
          {reason === "tier" ? `Part of ${tier?.name ?? "a higher tier"}` : reason === "scheduled" ? `Opens ${lesson.unlockAt}` : "Pass the quiz first"}
        </p>
        <p className="text-sm text-white/80">
          {reason === "tier"
            ? `Upgrade to watch ${course.title} and everything else in ${tier?.name}.`
            : reason === "scheduled"
              ? `${coach.coachName} releases it then. We'll let you know.`
              : `“${gate?.title}” ends with a short quiz. Pass it and this ${coach.wording.lesson.toLowerCase()} opens.`}
        </p>
        {reason === "tier" && (
          <Button variant="secondary" onClick={onUpgrade}>
            Upgrade
          </Button>
        )}
        {reason === "gate" && gate && (
          <Button variant="secondary" {...link(`${base}/courses/${course.id}/${gate.id}${q}`)}>
            Go to the quiz
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------- tabs under the video

function LessonTabs({ lesson, time }: { lesson: Lesson; time: number }) {
  const { coach } = useCoach()
  const progress = useProgress(coach.slug)
  const notes = progress.notes[lesson.id] ?? []
  const [draft, setDraft] = useState("")

  const addNote = () => {
    if (!draft.trim()) return
    const at = Math.floor(time)
    updateProgress(coach.slug, (p) => ({ ...p, notes: { ...p.notes, [lesson.id]: [...(p.notes[lesson.id] ?? []), { id: uid("n"), at, text: draft.trim() }].sort((a, b) => a.at - b.at) } }))
    setDraft("")
    toast.success(`Note saved at ${fmtTime(at)}`)
  }
  const removeNote = (id: string) => updateProgress(coach.slug, (p) => ({ ...p, notes: { ...p.notes, [lesson.id]: (p.notes[lesson.id] ?? []).filter((n) => n.id !== id) } }))

  const tabs = [
    { id: "overview", label: "Overview", show: true },
    { id: "chapters", label: "Chapters", n: lesson.chapters.length, show: lesson.chapters.length > 0 },
    { id: "transcript", label: "Transcript", show: !!lesson.transcript?.length },
    { id: "downloads", label: "Downloads", n: lesson.downloads.length, show: lesson.downloads.length > 0 },
    { id: "notes", label: "My notes", n: notes.length, show: true },
  ].filter((t) => t.show)

  return (
    <Tabs defaultValue="overview" className="gap-4">
      <TabsList className="max-w-full justify-start overflow-x-auto">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
            {t.n ? <span className="text-muted-foreground tabular-nums">{t.n}</span> : null}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="grid gap-4">
        {lesson.summary ? (
          <div className="grid gap-3 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Summary</span>
              {lesson.aiSummary && <AiMark />}
            </div>
            <p className="leading-relaxed">{lesson.summary}</p>
            {lesson.takeaways && (
              <ul className="grid gap-2 border-t pt-3">
                {lesson.takeaways.map((t) => (
                  <li key={t} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">{lesson.minutes} minutes. Watch it through, then mark it as done.</p>
        )}
        {lesson.text && (
          <div className="grid gap-1.5">
            <span className="eyebrow">Your task</span>
            <p className="leading-relaxed text-muted-foreground">{lesson.text}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="chapters">
        <ol className="grid gap-1">
          {lesson.chapters.map((c, i) => {
            const nextAt = lesson.chapters[i + 1]?.at ?? lesson.minutes * 60
            const on = time >= c.at && time < nextAt
            return (
              <li key={c.at}>
                <button onClick={() => seek(c.at)} className={cn("flex w-full items-center gap-3 rounded-[var(--r-inner)] px-3 py-2 text-left text-sm transition-colors hover:bg-muted", on && "bg-primary/10 font-medium")}>
                  <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{fmtTime(c.at)}</span>
                  <span className="flex-1">{c.title}</span>
                  {on && <span className="text-xs text-primary">Playing</span>}
                </button>
              </li>
            )
          })}
        </ol>
        {lesson.chapters.some((c) => c.ai) && <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><AiMark /> Chapters suggested by AI, checked by {coach.coachName}.</p>}
      </TabsContent>

      <TabsContent value="transcript">
        <div className="grid gap-2">
          {lesson.transcript?.map((line) => {
            const at = toSec(line)
            return (
              <button key={line} onClick={() => seek(at)} className="flex gap-3 rounded-[var(--r-inner)] px-3 py-1.5 text-left text-sm hover:bg-muted">
                <span className="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">{fmtTime(at)}</span>
                <span>{line.replace(/^\d+:\d+\s*/, "")}</span>
              </button>
            )
          })}
        </div>
      </TabsContent>

      <TabsContent value="downloads">
        <div className="grid gap-2 sm:grid-cols-2">
          {lesson.downloads.map((d) => (
            <button
              key={d.name}
              onClick={() => toast(`${d.name} would download here.`)}
              className="flex items-center gap-3 rounded-(--radius) bg-card p-3 text-left text-card-foreground hover:bg-muted/60"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <span className="r-chip grid size-9 shrink-0 place-items-center bg-primary/10 text-primary">
                <FileDown className="size-4" />
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-sm font-medium">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.size}</span>
              </span>
            </button>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="notes" className="grid gap-3">
        <div className="grid gap-2 rounded-(--radius) bg-card p-3 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && addNote()}
            placeholder="Write a note. It's saved at the current moment in the video."
            className="min-h-20 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Only you can see your notes.</span>
            <Button size="sm" onClick={addNote} disabled={!draft.trim()}>
              Add note at {fmtTime(time)}
            </Button>
          </div>
        </div>
        {notes.map((n) => (
          <div key={n.id} className="group flex items-start gap-3 rounded-[var(--r-inner)] px-1 py-1.5">
            <button onClick={() => seek(n.at)} className="r-chip shrink-0 bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary tabular-nums hover:bg-primary/20">
              {fmtTime(n.at)}
            </button>
            <p className="flex-1 text-sm whitespace-pre-line">{n.text}</p>
            <button onClick={() => removeNote(n.id)} className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive" aria-label="Delete note">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </TabsContent>
    </Tabs>
  )
}

// ---------- quiz

/** STU-05: questions at the end of the lesson; passing can unlock the next one. */
function QuizCard({ lesson, quiz, nextTitle }: { lesson: Lesson; quiz: Quiz; nextTitle?: string }) {
  const { coach } = useCoach()
  const progress = useProgress(coach.slug)
  const best = progress.quiz[lesson.id]
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(best === undefined)
  const score = useMemo(() => quiz.questions.filter((q) => answers[q.id] === q.answer).length, [answers, quiz.questions])
  const passed = (best ?? -1) >= quiz.passMark

  const check = () => {
    setChecked(true)
    updateProgress(coach.slug, (p) => ({ ...p, quiz: { ...p.quiz, [lesson.id]: Math.max(p.quiz[lesson.id] ?? 0, score) } }))
    if (score >= quiz.passMark) toast.success(nextTitle && quiz.gate ? `Passed. “${nextTitle}” is open.` : "Passed")
  }

  return (
    <div className="grid gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="r-chip grid size-9 place-items-center bg-primary/10 text-primary">
          <CircleHelp className="size-4" />
        </span>
        <div className="grid flex-1">
          <span className="font-heading text-lg leading-tight">Quick check</span>
          <span className="text-sm text-muted-foreground">
            {quiz.questions.length} questions · pass with {quiz.passMark} right{quiz.gate && nextTitle ? ` to open “${nextTitle}”` : ""}
          </span>
        </div>
        {passed ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Check className="size-4" /> Passed · {best}/{quiz.questions.length}
          </span>
        ) : best !== undefined ? (
          <span className="text-sm text-muted-foreground">Best so far: {best}/{quiz.questions.length}</span>
        ) : null}
        {!open && (
          <Button variant="outline" size="sm" onClick={() => (setOpen(true), setChecked(false), setAnswers({}))}>
            {passed ? "Take it again" : "Try again"}
          </Button>
        )}
      </div>

      {open && (
        <>
          <ol className="grid gap-5">
            {quiz.questions.map((q, qi) => (
              <li key={q.id} className="grid gap-2">
                <span className="text-sm font-medium">
                  {qi + 1}. {q.q}
                </span>
                <div className="grid gap-1.5">
                  {q.options.map((o, oi) => {
                    const picked = answers[q.id] === oi
                    const right = checked && oi === q.answer
                    const wrong = checked && picked && oi !== q.answer
                    return (
                      <button
                        key={o}
                        disabled={checked}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--r-inner)] border px-3 py-2 text-left text-sm transition-colors",
                          picked && !checked && "border-primary bg-primary/5",
                          right && "border-profit bg-profit/10",
                          wrong && "border-loss bg-loss/10",
                          !checked && "hover:bg-muted",
                        )}
                      >
                        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", picked && "border-primary bg-primary text-primary-foreground")}>
                          {picked && <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <span className="flex-1">{o}</span>
                        {right && <Check className="size-4 text-profit" />}
                        {wrong && <X className="size-4 text-loss" />}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ol>
          {checked ? (
            <div className={cn("flex flex-wrap items-center gap-3 rounded-[var(--r-inner)] px-4 py-3 text-sm", score >= quiz.passMark ? "bg-profit/10" : "bg-loss/10")}>
              <span className="flex-1">
                {score >= quiz.passMark
                  ? `${score} of ${quiz.questions.length}. Well done.`
                  : `${score} of ${quiz.questions.length}. You need ${quiz.passMark}. Have another look at the chapters, then try again.`}
              </span>
              <Button size="sm" variant="outline" onClick={() => (setChecked(false), setAnswers({}))}>
                Try again
              </Button>
              {score >= quiz.passMark && (
                <Button size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          ) : (
            <Button className="w-fit" onClick={check} disabled={Object.keys(answers).length < quiz.questions.length}>
              Check answers
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// ---------- side

function Outline({ course, current }: { course: Course; current: string }) {
  const { coach, base, preview } = useCoach()
  const q = preview ? "?preview=draft" : ""
  const progress = useProgress(coach.slug)
  return (
    <div className="overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="border-b px-4 py-3">
        <span className="eyebrow">In this course</span>
        <div className="font-heading">{course.title}</div>
      </div>
      <div className="max-h-[50svh] overflow-y-auto py-2">
        {course.modules.map((m) => {
          const lessons = visibleLessons(m)
          if (!lessons.length) return null
          return (
            <div key={m.id} className="py-1">
              <div className="px-4 py-1 text-xs font-medium text-muted-foreground">{m.title}</div>
              {lessons.map((l) => {
                const done = progress.done.includes(l.id)
                const locked = l.status !== "published" || !!gateBefore(course, l.id, progress)
                const row = (
                  <>
                    <span className={cn("r-dot grid size-5 shrink-0 place-items-center", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {done ? <Check className="size-3" /> : locked ? <Lock className="size-2.5" /> : null}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{l.minutes}′</span>
                  </>
                )
                const cls = cn("flex items-center gap-2.5 px-4 py-1.5 text-sm", l.id === current ? "bg-primary/10 font-medium" : !locked && "hover:bg-muted/60", locked && "text-muted-foreground")
                return locked ? (
                  <div key={l.id} className={cls}>
                    {row}
                  </div>
                ) : (
                  <Link key={l.id} href={`${base}/courses/${course.id}/${l.id}${q}`} className={cls}>
                    {row}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** The AI side panel: answers from this lesson, with a jump to the moment. */
function AskAi({ lesson }: { lesson: Lesson }) {
  const { coach } = useCoach()
  const [q, setQ] = useState("")
  const [asked, setAsked] = useState<string | null>(null)
  const jump = lesson.chapters[Math.min(3, lesson.chapters.length - 1)]
  return (
    <div className="grid gap-3 rounded-(--radius) bg-card p-4 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <span className="font-medium">{/^ask\b/i.test(coach.wording.ai) ? coach.wording.ai : `Ask ${coach.wording.ai}`}</span>
        <span className="ml-auto text-xs text-muted-foreground">about this {coach.wording.lesson.toLowerCase()}</span>
      </div>
      {asked && (
        <div className="grid gap-2 text-sm">
          <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">{asked}</div>
          <div className="max-w-[95%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
            {lesson.summary ?? `${coach.coachName} covers that in this ${coach.wording.lesson.toLowerCase()}.`}
            {jump && (
              <button onClick={() => seek(jump.at)} className="mt-1.5 block text-xs text-primary hover:underline">
                ▶ {jump.title}, {fmtTime(jump.at)}
              </button>
            )}
          </div>
        </div>
      )}
      <form
        className="flex items-center gap-2 rounded-[var(--button-radius)] border bg-background p-1 pl-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!q.trim()) return
          setAsked(q.trim())
          setQ("")
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about this lesson…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <Button size="sm" type="submit" disabled={!q.trim()}>
          Ask
        </Button>
      </form>
      <p className="text-[0.7rem] text-muted-foreground">From {coach.coachName}&apos;s lessons. Not investment advice.</p>
    </div>
  )
}
