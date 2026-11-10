"use client"

import { useRef, useState } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Plus, Sparkles, Trash2, Upload as UploadIcon, Wand2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { allLessons, uid, type Chapter, type Course, type Lesson, type Quiz } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminFilter, AdminProgress, AdminSegmented, AdminUnderlineTabs, Dropzone, EmptyState, FileItem, Panel, SortableRow, Tag, adminControl } from "../ui"
import { MARK_TONE, PHASE_LABEL, PlayerFrame, VISIBILITY_LABEL, clock, lessonMark, moduleOf, visibilityOf, type Upload, type Visibility } from "./course-parts"
import { PictureField } from "./thumbs"

type Tab = "lesson" | "chapters" | "quiz" | "files"
const AI_CHAPTERS = ["Intro", "The idea", "On the chart", "Common mistakes", "Recap"]
const parseTime = (v: string) => {
  const [m, s] = v.split(":").map((x) => Number(x) || 0)
  return v.includes(":") ? m * 60 + s : m * 60
}

const field = adminControl

/** Content · 08 Lesson, 09 Chapters, 10 Quiz (and Files): one lesson beside the course outline. */
export function LessonPage({ course, lesson, upload, saved, onChange, onPick, onBack, onSelect, onPreview }: { course: Course; lesson: Lesson; upload?: Upload; saved: boolean; onChange: (p: Partial<Lesson>) => void; onPick: (file: File) => void; onBack: () => void; onSelect: (id: string) => void; onPreview: () => void }) {
  const [tab, setTab] = useState<Tab>("lesson")
  const [t, setT] = useState(0)
  const lessons = allLessons(course)
  const at = lessons.findIndex((l) => l.id === lesson.id)
  const mod = moduleOf(course, lesson.id)
  const vis = visibilityOf(lesson)
  const setVis = (v: Visibility) =>
    onChange(v === "hidden" ? { status: "draft", freePreview: false } : v === "scheduled" ? { status: "scheduled", unlockAt: lesson.unlockAt ?? "Thu 15 Oct", freePreview: false } : { status: "published", freePreview: v === "free" })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <AdminButton hierarchy="secondary" size="xl" iconOnly aria-label="Back to the course" onClick={onBack}>
          <ArrowLeft />
        </AdminButton>
        <div className="min-w-0 flex-1">
          <input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} aria-label="Lesson title" className="-mx-2 block w-[calc(100%+1rem)] truncate rounded-a-sm bg-transparent px-2 t-heading-xl text-a-text outline-none transition-colors duration-300 hover:bg-a-hover focus-visible:bg-a-field" />
          <p className="t-body-m text-a-text-2">
            {course.title} · Module {course.modules.indexOf(mod!) + 1} · Lesson {mod ? mod.lessons.indexOf(lesson) + 1 : at + 1}
          </p>
        </div>
        <span className="t-caption text-a-text-3">{saved ? "Saved" : ""}</span>
        <AdminFilter
          label="Visibility"
          value={vis}
          onValueChange={(v) => setVis(v as Visibility)}
          options={(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => ({ value: v, label: VISIBILITY_LABEL[v] }))}
        />
        <AdminButton hierarchy="secondary" onClick={onPreview}>
          <ExternalLink /> Preview as student
        </AdminButton>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Panel className="gap-3 p-3">
          <div className="flex items-center justify-between px-1.5">
            <h2 className="t-body-m-medium text-a-text">Course outline</h2>
            <span className="flex gap-1">
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Previous lesson" disabled={at <= 0} onClick={() => onSelect(lessons[at - 1].id)}>
                <ChevronLeft />
              </AdminButton>
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Next lesson" disabled={at >= lessons.length - 1} onClick={() => onSelect(lessons[at + 1].id)}>
                <ChevronRight />
              </AdminButton>
            </span>
          </div>
          <nav aria-label="Course outline" className="flex flex-col gap-0.5">
            {course.modules.map((m, mi) => (
              <div key={m.id} className="flex flex-col gap-0.5">
                <span className="px-2 pt-2 pb-1 t-mono-label-s text-a-text-3">
                  {mi + 1} · {m.title}
                </span>
                {m.lessons.map((l) => {
                  const mark = lessonMark(l, l.id === lesson.id ? upload : undefined)
                  return (
                    <button key={l.id} type="button" aria-current={l.id === lesson.id ? "page" : undefined} onClick={() => onSelect(l.id)}
                      className={cn("flex h-9 items-center gap-2 rounded-a-sm px-2 text-left t-body-m outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-a-border-focus", l.id === lesson.id ? "bg-a-selected text-a-text" : "text-a-text-2 hover:bg-a-hover hover:text-a-text")}>
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      {mark && <span className={cn("shrink-0 t-micro", MARK_TONE[mark.tone])}>{mark.text}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <AdminUnderlineTabs
            label="Lesson sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "lesson", label: "Lesson" },
              { id: "chapters", label: "Chapters", count: lesson.chapters.length },
              { id: "quiz", label: "Quiz", count: lesson.quiz?.questions.length },
              { id: "files", label: "Files", count: lesson.downloads.length },
            ]}
          />
          {tab === "lesson" && <LessonTab course={course} lesson={lesson} upload={upload} t={t} onChange={onChange} onPick={onPick} />}
          {tab === "chapters" && <ChaptersTab course={course} lesson={lesson} t={t} setT={setT} onChange={onChange} />}
          {tab === "quiz" && <QuizTab lesson={lesson} onChange={onChange} />}
          {tab === "files" && <FilesTab lesson={lesson} onChange={onChange} />}
        </div>
      </div>
    </div>
  )
}

function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="t-body-m-medium text-a-text">{children}</span>
      {hint}
    </div>
  )
}

function LessonTab({ course, lesson, upload, t, onChange, onPick }: { course: Course; lesson: Lesson; upload?: Upload; t: number; onChange: (p: Partial<Lesson>) => void; onPick: (f: File) => void }) {
  const { coach } = useCoach()
  const input = useRef<HTMLInputElement>(null)
  const busy = upload && upload.phase !== "ready" && upload.phase !== "failed"
  const picker = <input ref={input} type="file" accept="video/*" aria-label="Video" className="sr-only" onChange={(e) => (e.target.files?.[0] && onPick(e.target.files[0]), (e.target.value = ""))} />
  return (
    <div className="flex flex-col gap-5">
      {lesson.video && !busy ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <PlayerFrame lesson={lesson} course={course} t={t || 192} className="aspect-[2.72]" />
          <div className="flex items-center gap-3 t-body-m text-a-text-2">
            <span className="min-w-0 flex-1 truncate">{lesson.video} · {lesson.minutes} min · {lesson.chapters.length} chapters</span>
            <AdminButton hierarchy="secondary" size="md" onClick={() => input.current?.click()}>Replace video</AdminButton>
          </div>
        </div>
      ) : busy || upload?.phase === "failed" ? (
        <div className="grid gap-3 rounded-a-lg border border-a-border bg-a-panel p-5">
          <div className="flex items-center gap-3 t-body-m">
            <span className="min-w-0 flex-1 text-a-text">{upload.phase === "failed" ? "The upload failed" : `${PHASE_LABEL[upload.phase]}…`}</span>
            <span className={cn("tabular-nums", upload.phase === "failed" ? "text-a-danger" : "text-a-text-2")}>{upload.phase === "uploading" ? `${upload.pct}%` : upload.phase === "failed" ? `at ${upload.pct}%` : ""}</span>
          </div>
          <AdminProgress label="Upload" tone={upload.phase === "failed" ? "danger" : "accent"} value={upload.phase === "uploading" || upload.phase === "failed" ? upload.pct : 100} indeterminate={upload.phase !== "uploading" && upload.phase !== "failed"} />
          <span className="t-caption text-a-text-3">{upload.phase === "failed" ? "Choose the file again to retry." : "You can keep editing. The upload continues in the background."}</span>
          {upload.phase === "failed" && <AdminButton hierarchy="secondary" size="md" className="w-fit" onClick={() => input.current?.click()}>Retry</AdminButton>}
        </div>
      ) : (
        <Dropzone label="Video" accept="video/*" title="Drop the video, or click to upload" hint="AI writes the transcript, chapters and a summary while it uploads. You can pick the thumbnail from the video." className="aspect-[1.78] py-0" onFiles={(f) => onPick(f[0])} />
      )}
      {picker}

      <div className="grid gap-2">
        <Label>Title</Label>
        <input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} className={cn(field, "h-11")} />
      </div>
      <div className="grid gap-2">
        <Label>Summary</Label>
        <textarea value={lesson.summary ?? ""} onChange={(e) => onChange({ summary: e.target.value, aiSummary: false })} placeholder="Two or three sentences on what students take away." className={cn(field, "min-h-[72px] resize-y py-3")} />
        <div className="flex items-center gap-3 t-caption text-a-text-3">
          {lesson.aiSummary && <span>Written by AI from the transcript · edit freely</span>}
          <button type="button" onClick={() => onChange({ summary: `In this ${coach.wording.lesson.toLowerCase()} you'll learn ${lesson.title.toLowerCase()}, why it matters for your trading, and how to apply it on your next session.`, takeaways: ["The one idea to remember", "How it shows on the chart", "What to practise this week"], aiSummary: true })} className="flex items-center gap-1 text-a-text-2 outline-none hover:text-a-text focus-visible:text-a-text">
            <Sparkles className="size-3" /> {lesson.summary ? "Rewrite with AI" : "Write with AI"}
          </button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Takeaways</Label>
        <textarea
          value={(lesson.takeaways ?? []).join("\n")}
          onChange={(e) => onChange({ takeaways: e.target.value.split("\n") })}
          onBlur={() => onChange({ takeaways: (lesson.takeaways ?? []).map((x) => x.trim()).filter(Boolean) })}
          placeholder="What will students take away?"
          className={cn(field, "min-h-[80px] resize-y py-3")}
        />
        <span className="t-caption text-a-text-3">One per line.</span>
      </div>
      <div className="grid gap-2">
        <Label>Task for students</Label>
        <textarea value={lesson.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Optional homework, shown under the video." className={cn(field, "min-h-[64px] resize-y py-3")} />
      </div>
      <div className="grid gap-2">
        <Label>Thumbnail</Label>
        <PictureField value={lesson.thumbnail} color={course.color} onChange={(thumbnail) => onChange({ thumbnail })} label="Thumbnail" empty="No picture yet: the list shows the course cover." />
      </div>
    </div>
  )
}

function ChaptersTab({ course, lesson, t, setT, onChange }: { course: Course; lesson: Lesson; t: number; setT: (n: number) => void; onChange: (p: Partial<Lesson>) => void }) {
  const duration = Math.max(60, lesson.minutes * 60)
  const bar = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const set = (chapters: Chapter[]) => onChange({ chapters: [...chapters].sort((a, b) => a.at - b.at) })
  const update = (i: number, patch: Partial<Chapter>) => onChange({ chapters: lesson.chapters.map((c, j) => (j === i ? { ...c, ...patch, ai: false } : c)) })
  const now = t || Math.min(duration - 5, 261)
  const active = lesson.chapters.reduce((a, c, i) => (c.at <= now ? i : a), -1)

  const onMove = (e: React.PointerEvent) => {
    if (dragging === null || !bar.current) return
    const r = bar.current.getBoundingClientRect()
    update(dragging, { at: Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration) })
  }
  const redo = () => (set(AI_CHAPTERS.map((title, i) => ({ at: Math.round((duration / AI_CHAPTERS.length) * i), title, ai: true }))), toast("AI suggested chapters from the transcript."))

  return (
    <div className="flex flex-col gap-4">
      <PlayerFrame lesson={lesson} course={course} controls={false} className="aspect-[3/1]">
        <div ref={bar} className="absolute inset-x-4 bottom-5 h-4 touch-none" onPointerMove={onMove} onPointerUp={() => (setDragging(null), set(lesson.chapters))} onPointerLeave={() => dragging !== null && (setDragging(null), set(lesson.chapters))}
          onClick={(e) => {
            if (!bar.current || dragging !== null) return
            const r = bar.current.getBoundingClientRect()
            setT(Math.round(((e.clientX - r.left) / r.width) * duration))
          }}>
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-a-track" />
          {lesson.chapters.map((c, i) => (
            <button key={i} type="button" aria-label={`Move chapter ${c.title}`} onPointerDown={(e) => (e.stopPropagation(), bar.current?.setPointerCapture(e.pointerId), setDragging(i))} onClick={(e) => e.stopPropagation()}
              className={cn("absolute inset-y-0 w-3 -translate-x-1/2 outline-none", i === 0 ? "cursor-pointer" : "cursor-ew-resize")} style={{ left: `${(c.at / duration) * 100}%` }}>
              <span className={cn("mx-auto block h-full w-1 rounded-full bg-a-accent-strong transition-all", dragging === i && "w-1.5")} />
            </button>
          ))}
        </div>
      </PlayerFrame>

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton hierarchy="secondary" onClick={() => (set([...lesson.chapters, { at: now, title: "New chapter" }]), setT(now))}>
          <Plus /> Add chapter at {clock(now)}
        </AdminButton>
        <AdminButton hierarchy="ghost" onClick={redo}>
          Redo with AI
        </AdminButton>
        <span className="ml-auto t-caption text-a-text-3">AI chapters stay marked until you edit them</span>
      </div>

      <ul className="grid gap-2">
        {lesson.chapters.map((c, i) => (
          <li key={`${i}-${c.at}`} className={cn("flex h-11 items-center gap-3 rounded-a-md border bg-a-panel px-3.5", i === active ? "border-a-accent-strong" : "border-a-border")}>
            <input defaultValue={clock(c.at)} aria-label="Start time" onFocus={() => setT(c.at)} onBlur={(e) => set(lesson.chapters.map((x, j) => (j === i ? { ...x, at: Math.min(duration, parseTime(e.target.value)), ai: false } : x)))} className="w-12 bg-transparent t-mono-data text-a-text-2 outline-none focus-visible:text-a-text" />
            <input value={c.title} aria-label="Chapter title" onFocus={() => setT(c.at)} onChange={(e) => update(i, { title: e.target.value })} className="min-w-0 flex-1 bg-transparent t-body-m text-a-text outline-none focus-visible:ring-1 focus-visible:ring-[var(--admin-color-border-focus)]" />
            {c.ai && <Tag tone="accent" dot>AI</Tag>}
            <DropdownMenu>
              <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`More for ${c.title}`} />}>
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem variant="destructive" onClick={() => set(lesson.chapters.filter((_, j) => j !== i))}>
                  <Trash2 /> Delete chapter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
        {lesson.chapters.length === 0 && <li><EmptyState compact title="No chapters yet. Add one at the current time, or let AI suggest them from the transcript." /></li>}
      </ul>
    </div>
  )
}

const PASS = [70, 80, 90]

function QuizTab({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const quiz = lesson.quiz
  const [open, setOpen] = useState<string | null>(quiz?.questions[0]?.id ?? null)
  const set = (patch: Partial<Quiz>) => onChange({ quiz: { ...(quiz as Quiz), ...patch, ai: false } })
  const draft = () => {
    const questions = [
      { id: uid("q"), q: `What is the main idea of “${lesson.title}”?`, options: ["The idea from the lesson", "Something it warns against", "Not covered"], answer: 0 },
      { id: uid("q"), q: "When should you apply it?", options: ["Every trade", "When the setup on the chart matches", "Never on news days"], answer: 1 },
      { id: uid("q"), q: "What's the most common mistake?", options: ["Doing it too late", "Skipping the checklist", "Both"], answer: 2 },
    ]
    onChange({ quiz: { passMark: 2, gate: false, ai: true, questions } })
    setOpen(questions[0].id)
  }
  const blank = () => {
    const q = { id: uid("q"), q: "", options: ["", ""], answer: 0 }
    onChange({ quiz: { passMark: 1, gate: false, questions: [q] } })
    setOpen(q.id)
  }

  if (!quiz) {
    return (
      <EmptyState title="No quiz on this lesson" description="A few questions at the end help students check they got it. You can make passing a condition for the next lesson." className="py-14"
        actions={<><AdminButton onClick={draft}><Sparkles /> Write with AI</AdminButton><AdminButton hierarchy="secondary" onClick={blank}>Start empty</AdminButton></>} />
    )
  }

  const n = quiz.questions.length
  const need = (p: number) => Math.max(1, Math.min(n, Math.ceil((p / 100) * n)))
  // The pass mark is kept as a count of right answers; the nearest percentage is the one shown as chosen.
  const chosen = PASS.reduce((best, p) => (Math.abs(p - (quiz.passMark / n) * 100) < Math.abs(best - (quiz.passMark / n) * 100) ? p : best), PASS[0])
  const updateQ = (id: string, patch: Partial<Quiz["questions"][number]>) => set({ questions: quiz.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
  const addQuestion = () => {
    const q = { id: uid("q"), q: "", options: ["", ""], answer: 0 }
    set({ questions: [...quiz.questions, q] })
    setOpen(q.id)
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <AdminButton hierarchy="secondary" onClick={addQuestion}>
            <Plus /> Add question
          </AdminButton>
          <span className="t-caption text-a-text-3">{n} {n === 1 ? "question" : "questions"}</span>
        </div>
        {quiz.ai && <div className="flex items-center gap-2 rounded-a-md bg-a-accent-soft px-3 py-2 t-body-m text-a-text-accent"><Sparkles className="size-4" /> Drafted by AI from the transcript. Check the answers before you publish.</div>}
        {quiz.questions.map((q, qi) =>
          open === q.id ? (
            <div key={q.id} className="grid gap-3 rounded-a-lg border border-a-border bg-a-panel p-4">
              <div className="flex items-center gap-3">
                <span className="t-body-m text-a-text-2 tabular-nums">{qi + 1}</span>
                <input value={q.q} placeholder="Question" onChange={(e) => updateQ(q.id, { q: e.target.value })} className="min-w-0 flex-1 bg-transparent t-body-l text-a-text outline-none placeholder:text-a-text-3" />
                <span className="t-caption text-a-text-3">{q.options.length} answers</span>
                <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Delete question" onClick={() => (set({ questions: quiz.questions.filter((x) => x.id !== q.id), passMark: Math.min(quiz.passMark, Math.max(1, n - 1)) }), setOpen(null))}>
                  <Trash2 />
                </AdminButton>
              </div>
              <div className="grid gap-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-3">
                    <button type="button" role="radio" aria-checked={q.answer === oi} aria-label={q.answer === oi ? "Correct answer" : "Mark as correct"} onClick={() => updateQ(q.id, { answer: oi })} className={cn("grid size-4 shrink-0 place-items-center rounded-full border outline-none focus-visible:ring-2 focus-visible:ring-a-border-focus", q.answer === oi ? "border-a-accent-strong" : "border-a-border-strong")}>
                      {q.answer === oi && <span className="size-2 rounded-full bg-a-accent-strong" />}
                    </button>
                    <input value={o} placeholder={`Answer ${oi + 1}`} onChange={(e) => updateQ(q.id, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} className="h-8 min-w-0 flex-1 rounded-a-sm border border-a-border bg-a-field px-3 t-body-m text-a-text outline-none placeholder:text-a-text-3 focus-visible:border-a-border-focus" />
                    {q.answer === oi && <Tag tone="success" dot>Correct</Tag>}
                    {q.options.length > 2 && q.answer !== oi && (
                      <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Remove answer" onClick={() => updateQ(q.id, { options: q.options.filter((_, j) => j !== oi), answer: q.answer > oi ? q.answer - 1 : q.answer })}>
                        <Trash2 />
                      </AdminButton>
                    )}
                  </div>
                ))}
                {q.options.length < 5 && (
                  <button type="button" onClick={() => updateQ(q.id, { options: [...q.options, ""] })} className="flex w-fit items-center gap-1.5 pl-0.5 t-body-m text-a-text-2 outline-none hover:text-a-text focus-visible:text-a-text">
                    <Plus className="size-3.5" /> Add answer
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button key={q.id} type="button" onClick={() => setOpen(q.id)} className="rounded-a-lg border border-a-border bg-a-panel px-2 py-1.5 text-left outline-none transition-colors duration-300 hover:border-a-border-strong focus-visible:ring-2 focus-visible:ring-a-border-focus">
              <SortableRow title={`${qi + 1} · ${q.q || "Untitled question"}`} trailing={<span className="t-caption text-a-text-3">{q.options.length} answers</span>} className="border-transparent hover:bg-transparent" />
            </button>
          ),
        )}
      </div>

      <Panel className="gap-4">
        <h2 className="t-heading-s text-a-text">Quiz rules</h2>
        <div className="grid gap-2">
          <span className="t-caption text-a-text-2">Pass mark</span>
          <AdminSegmented label="Pass mark" value={String(chosen)} onChange={(v) => set({ passMark: need(Number(v)) })} options={PASS.map((p) => ({ value: String(p), label: `${p}%` }))} />
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="grid">
            <span className="t-body-m text-a-text">Must pass to open the next lesson</span>
            <span className="t-caption text-a-text-2">Students see the next lesson locked</span>
          </span>
          <Switch checked={quiz.gate} onCheckedChange={(v) => set({ gate: v })} />
        </label>
        <span className="h-px bg-a-border-subtle" aria-hidden />
        <AdminButton hierarchy="secondary" className="w-fit" onClick={draft}>
          <Wand2 /> Write with AI
        </AdminButton>
        <p className="t-caption text-a-text-2">Questions come from the transcript. You review them before they go in.</p>
        <AdminButton hierarchy="ghost" size="md" className="w-fit text-a-danger" onClick={() => onChange({ quiz: undefined })}>
          <Trash2 /> Remove quiz
        </AdminButton>
      </Panel>
    </div>
  )
}

function FilesTab({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <AdminButton hierarchy="secondary" onClick={() => onChange({ downloads: [...lesson.downloads, { name: `Worksheet ${lesson.downloads.length + 1}.pdf`, size: "96 KB" }] })}>
          <UploadIcon /> Add a file
        </AdminButton>
        <span className="t-caption text-a-text-3">Students download these under the video</span>
      </div>
      <ul className="grid gap-2">
        {lesson.downloads.map((d) => (
          <li key={d.name}>
            <FileItem name={d.name} meta={d.size} trailing={<AdminButton hierarchy="ghost" size="md" iconOnly aria-label={`Remove ${d.name}`} onClick={() => onChange({ downloads: lesson.downloads.filter((x) => x.name !== d.name) })}><Trash2 /></AdminButton>} />
          </li>
        ))}
        {lesson.downloads.length === 0 && <li><EmptyState compact title="No files on this lesson yet." /></li>}
      </ul>
    </div>
  )
}

