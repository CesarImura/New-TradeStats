"use client"

import { useEffect, useRef, useState } from "react"
import { CircleHelp, FileDown, FileVideo, Plus, Sparkles, Trash2, Upload } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { AdminButton, Tag } from "@/components/admin/ui"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABEL, fmtTime, uid, type Chapter, type Course, type Lesson, type Quiz, type Status } from "@/lib/data/learning"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { STATUS_DOT } from "./content-board"
import { PictureField } from "./thumbs"
import { videoFrames } from "@/lib/video-frames"
import { Field } from "./course-settings"

const parseTime = (v: string) => {
  const [m, s] = v.split(":").map((x) => Number(x) || 0)
  return v.includes(":") ? m * 60 + s : m * 60
}

export function LessonEditor({ course, lesson, onChange }: { course: Course; lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const { coach } = useCoach()
  // Frames from the video the coach just chose: kept while this lesson is open, so one can be picked as the thumbnail.
  const [frames, setFrames] = useState<string[]>([])
  return (
    <div className="grid gap-6">
      <Tabs defaultValue="content" className="gap-5">
        <TabsList className="!h-auto w-full justify-start !gap-6 !rounded-none !border-0 !border-b !border-solid !border-a-border !bg-transparent !p-0">
          {([["content", "Lesson"], ["chapters", `Chapters${lesson.chapters.length ? ` ${lesson.chapters.length}` : ""}`], ["quiz", `Quiz${lesson.quiz ? ` ${lesson.quiz.questions.length}` : ""}`], ["files", `Files${lesson.downloads.length ? ` ${lesson.downloads.length}` : ""}`], ["publish", "Visibility"]] as const).map(([v, label]) => (
            <TabsTrigger key={v} value={v} className="!h-8 !flex-none !rounded-none !border-0 !border-b-2 !border-solid !border-transparent !px-0 pb-2 !text-[0.8125rem] data-[active]:!border-[var(--admin-color-control-on)] data-[active]:!text-a-text">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="content" className="grid gap-6">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} aria-label="Lesson title" />
          </div>
          <VideoField lesson={lesson} onChange={onChange} onFrames={setFrames} />
          <div className="grid gap-2">
            <Label>Thumbnail</Label>
            <PictureField value={lesson.thumbnail} color={course.color} onChange={(thumbnail) => onChange({ thumbnail })} label="Thumbnail" empty="No picture yet: the list shows the course cover." />
            {frames.length > 0 && (
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Or pick a moment from your video</span>
                <div className="grid grid-cols-5 gap-2">
                  {frames.map((f, i) => (
                    <button key={i} type="button" aria-label={`Use moment ${i + 1}`} aria-pressed={lesson.thumbnail === f} onClick={() => onChange({ thumbnail: f })} className={cn("overflow-hidden rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring bg-card", lesson.thumbnail === f && "ring-2 ring-foreground")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f} alt="" className="aspect-video w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Summary</Label>
              <Button
                variant="ghost"
                size="xs"
                onClick={() =>
                  onChange({
                    summary: `In this ${coach.wording.lesson.toLowerCase()} you'll learn ${lesson.title.toLowerCase()}, why it matters for your trading, and how to apply it on your next session.`,
                    takeaways: ["The one idea to remember", "How it shows on the chart", "What to practise this week"],
                    aiSummary: true,
                  })
                }
              >
                <Sparkles /> {lesson.summary ? "Rewrite with AI" : "Write with AI"}
              </Button>
            </div>
            <Textarea value={lesson.summary ?? ""} onChange={(e) => onChange({ summary: e.target.value, aiSummary: false })} placeholder="Two or three sentences on what students take away." className="min-h-24" />
            {lesson.aiSummary && <span className="text-xs text-muted-foreground">Written by AI from the transcript. Students see an AI label until you edit it.</span>}
          </div>
          <div className="grid gap-2">
            <Label>Key takeaways</Label>
            {(lesson.takeaways ?? []).map((t, i) => (
              <div key={i} className="flex gap-2">
                <Input value={t} onChange={(e) => onChange({ takeaways: (lesson.takeaways ?? []).map((x, j) => (j === i ? e.target.value : x)) })} />
                <Button variant="ghost" size="icon" aria-label="Remove takeaway" onClick={() => onChange({ takeaways: (lesson.takeaways ?? []).filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => onChange({ takeaways: [...(lesson.takeaways ?? []), ""] })}>
              <Plus /> Add takeaway
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>Task for students</Label>
            <Textarea value={lesson.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Optional homework, shown under the video." />
          </div>
        </TabsContent>

        <TabsContent value="files" className="grid gap-6">
          <div className="grid gap-2">
            <Label>Downloads</Label>
            {lesson.downloads.map((d) => (
              <div key={d.name} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm bg-card">
                <FileDown className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.size}</span>
                <Button variant="ghost" size="icon-xs" aria-label={`Remove ${d.name}`} onClick={() => onChange({ downloads: lesson.downloads.filter((x) => x.name !== d.name) })}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => onChange({ downloads: [...lesson.downloads, { name: `Worksheet ${lesson.downloads.length + 1}.pdf`, size: "96 KB" }] })}>
              <Upload /> Add a file
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="chapters">
          <ChaptersEditor lesson={lesson} onChange={onChange} />
        </TabsContent>

        <TabsContent value="quiz">
          <QuizEditor lesson={lesson} onChange={onChange} />
        </TabsContent>

        <TabsContent value="publish">
          <PublishLesson course={course} lesson={lesson} onChange={onChange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AI_CHAPTERS = ["Intro", "The idea", "On the chart", "Common mistakes", "Recap"]

function VideoField({ lesson, onChange, onFrames }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void; onFrames: (f: string[]) => void }) {
  const [pct, setPct] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), [])

  const input = useRef<HTMLInputElement>(null)
  /** The video the coach chose: its real length, and frames to pick a thumbnail from (the first one is the thumbnail if there is none yet). */
  const choose = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("video/")) return void toast.error("This file isn't a video. Use an MP4, MOV or WebM.")
    try {
      const { frames, seconds } = await videoFrames(file)
      onFrames(frames)
      upload(file.name, Math.max(1, Math.round(seconds / 60)), lesson.thumbnail ? undefined : frames[Math.floor(frames.length / 2)])
    } catch (e) {
      // A video this browser can't read (some MOV and MKV files) is still uploaded; it just has no frames to pick from.
      toast(e instanceof Error ? e.message : "No frames from this video.")
      onFrames([])
      upload(file.name, lesson.minutes || 16)
    }
  }
  const upload = (name = `${lesson.title}.mp4`, length = lesson.minutes || 16, thumbnail?: string) => {
    setPct(0)
    timer.current = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, (p ?? 0) + 9)
        if (n >= 100) {
          clearInterval(timer.current!)
          const minutes = length
          onChange({ video: name, minutes, ...(thumbnail ? { thumbnail } : {}) })
          setProcessing(true)
          setTimeout(() => {
            setProcessing(false)
            setPct(null)
            if (!lesson.chapters.length) onChange({ video: name, minutes, chapters: AI_CHAPTERS.map((title, i) => ({ at: Math.round(((minutes * 60) / AI_CHAPTERS.length) * i), title, ai: true })) })
            toast.success("Video ready. AI added chapters and a transcript.")
          }, 1600)
        }
        return n
      })
    }, 180)
  }

  const picker = <input ref={input} type="file" accept="video/*" aria-label="Video" className="sr-only" onChange={(e) => (void choose(e.target.files?.[0]), (e.target.value = ""))} />
  if (pct !== null || processing) {
    return (
      <div className="grid gap-2 rounded-xl border p-4 bg-card">
        <div className="flex items-center gap-2 text-sm">
          <FileVideo className="size-4 text-muted-foreground" />
          <span className="flex-1">{processing ? "Processing: transcript and chapters…" : "Uploading your video"}</span>
          <span className="text-muted-foreground tabular-nums">{processing ? "" : `${pct}%`}</span>
        </div>
        <Progress value={processing ? 100 : pct ?? 0} className={cn("h-1.5", processing && "animate-pulse")} />
        <span className="text-xs text-muted-foreground">You can keep editing. The upload continues in the background.</span>
      </div>
    )
  }
  if (lesson.video || lesson.status === "published") {
    return (
      <div className="flex items-center gap-4 rounded-xl border p-3 bg-card">
        <div className="relative grid aspect-video w-36 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {lesson.thumbnail && <img src={lesson.thumbnail} alt="" className="absolute inset-0 size-full object-cover" />}
          <FileVideo className="relative size-6 drop-shadow" />
        </div>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-medium">{lesson.video ?? `${lesson.title}.mp4`}</span>
          <span className="text-xs text-muted-foreground">
            {lesson.minutes} min · {lesson.chapters.length} chapters{lesson.transcript ? " · transcript" : ""}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          Replace
        </Button>
        {picker}
      </div>
    )
  }
  return (
    <>
      <button onClick={() => input.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), void choose(e.dataTransfer.files[0]))} className="grid place-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center hover:bg-muted/50">
        <Upload className="size-6 text-muted-foreground" />
        <span className="font-medium">Drop the video, or click to upload</span>
        <span className="text-sm text-muted-foreground">AI writes the transcript, chapters and a summary while it uploads. You can pick the thumbnail from your video.</span>
      </button>
      {picker}
    </>
  )
}

/** ADM-12: AI-suggested chapters on a timeline. Drag markers, rename, delete. */
function ChaptersEditor({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const duration = Math.max(60, lesson.minutes * 60)
  const bar = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const set = (chapters: Chapter[]) => onChange({ chapters: [...chapters].sort((a, b) => a.at - b.at) })
  const update = (i: number, patch: Partial<Chapter>) => onChange({ chapters: lesson.chapters.map((c, j) => (j === i ? { ...c, ...patch, ai: false } : c)) })

  const onMove = (e: React.PointerEvent) => {
    if (dragging === null || !bar.current) return
    const r = bar.current.getBoundingClientRect()
    const at = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration)
    update(dragging, { at })
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 rounded-xl border p-4 bg-card">
        <div
          ref={bar}
          className="relative h-12 touch-none rounded-md bg-muted"
          onPointerMove={onMove}
          onPointerUp={() => (dragging !== null && set(lesson.chapters), setDragging(null))}
          onPointerLeave={() => {
            if (dragging === null) return
            set(lesson.chapters)
            setDragging(null)
          }}
        >
          {lesson.chapters.map((c, i) => {
            const end = lesson.chapters[i + 1]?.at ?? duration
            return (
              <div key={i} className="absolute inset-y-1 overflow-hidden rounded bg-primary/15 px-1.5 text-[0.6875rem] leading-5 whitespace-nowrap text-foreground/80" style={{ left: `${(c.at / duration) * 100}%`, width: `calc(${((end - c.at) / duration) * 100}% - 2px)` }}>
                {c.title}
              </div>
            )
          })}
          {lesson.chapters.map((c, i) => (
            <button
              key={`m${i}`}
              onPointerDown={(e) => (e.currentTarget.parentElement!.setPointerCapture(e.pointerId), setDragging(i))}
              className={cn("absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize", i === 0 && "pointer-events-none")}
              style={{ left: `${(c.at / duration) * 100}%` }}
              aria-label={`Move ${c.title}`}
            >
              <span className={cn("mx-auto block h-full w-0.5 rounded bg-primary", dragging === i && "w-1")} />
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>0:00</span>
          <span>Drag the lines to move a chapter</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <AdminButton
          hierarchy="secondary"
          onClick={() => {
            const last = lesson.chapters.at(-1)?.at ?? -60
            set([...lesson.chapters, { at: Math.min(duration - 10, last + 60), title: "New chapter" }])
          }}
        >
          <Plus /> Add chapter
        </AdminButton>
        <AdminButton
          hierarchy="ghost"
          onClick={() => (set(AI_CHAPTERS.map((title, i) => ({ at: Math.round((duration / AI_CHAPTERS.length) * i), title, ai: true }))), toast("AI suggested chapters from the transcript."))}
        >
          <Sparkles /> Redo with AI
        </AdminButton>
        <span className="flex-1" />
        <span className="t-caption text-a-text-3">AI chapters stay marked until you edit them.</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {lesson.chapters.map((c, i) => (
          <div key={i} className="flex h-[46px] items-center gap-3 rounded-a-md border border-a-border bg-a-panel px-3">
            <input
              defaultValue={fmtTime(c.at)}
              key={`${i}-${c.at}`}
              onBlur={(e) => set(lesson.chapters.map((x, j) => (j === i ? { ...x, at: Math.min(duration, parseTime(e.target.value)), ai: false } : x)))}
              className="t-caption w-12 bg-transparent font-mono text-a-text-2 tabular-nums outline-none focus:text-a-text"
              aria-label="Start time"
            />
            <input value={c.title} onChange={(e) => update(i, { title: e.target.value })} aria-label="Chapter title" className="t-body-m min-w-0 flex-1 bg-transparent text-a-text outline-none" />
            {c.ai && <Tag tone="accent"><Sparkles className="size-3" /> AI</Tag>}
            <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Delete chapter" onClick={() => set(lesson.chapters.filter((_, j) => j !== i))}>
              <Trash2 />
            </AdminButton>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ADM-13: AI-drafted questions, edit, pass mark, and whether passing unlocks the next lesson. */
function QuizEditor({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const quiz = lesson.quiz
  const set = (patch: Partial<Quiz>) => onChange({ quiz: { ...(quiz as Quiz), ...patch, ai: false } })
  const draft = () =>
    onChange({
      quiz: {
        passMark: 2,
        gate: false,
        ai: true,
        questions: [
          { id: uid("q"), q: `What is the main idea of “${lesson.title}”?`, options: ["The idea from the lesson", "Something it warns against", "Not covered"], answer: 0 },
          { id: uid("q"), q: "When should you apply it?", options: ["Every trade", "When the setup on the chart matches", "Never on news days"], answer: 1 },
          { id: uid("q"), q: "What's the most common mistake?", options: ["Doing it too late", "Skipping the checklist", "Both"], answer: 2 },
        ],
      },
    })

  if (!quiz) {
    return (
      <div className="grid place-items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
        <CircleHelp className="size-6 text-muted-foreground" />
        <p className="font-medium">No quiz on this lesson</p>
        <p className="max-w-sm text-sm text-muted-foreground">A few questions at the end help students check they got it. You can make passing a condition for the next lesson.</p>
        <div className="flex gap-2">
          <Button onClick={draft}>
            <Sparkles /> Draft with AI
          </Button>
          <Button variant="outline" onClick={() => onChange({ quiz: { passMark: 1, gate: false, questions: [{ id: uid("q"), q: "", options: ["", ""], answer: 0 }] } })}>
            Start empty
          </Button>
        </div>
      </div>
    )
  }

  const updateQ = (id: string, patch: Partial<Quiz["questions"][number]>) => set({ questions: quiz.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })

  const addQuestion = () => set({ questions: [...quiz.questions, { id: uid("q"), q: "", options: ["", ""], answer: 0 }] })
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center gap-2">
          <AdminButton hierarchy="secondary" onClick={addQuestion}><Plus /> Add question</AdminButton>
          <span className="flex-1" />
          <span className="t-caption text-a-text-3">{quiz.questions.length} {quiz.questions.length === 1 ? "question" : "questions"}</span>
        </div>
        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="flex flex-col gap-3 rounded-a-lg border border-a-border bg-a-panel p-4">
            <div className="flex items-center gap-2">
              <span className="t-caption w-4 text-a-text-3 tabular-nums">{qi + 1}</span>
              <input value={q.q} onChange={(e) => updateQ(q.id, { q: e.target.value })} placeholder="Question" aria-label="Question" className="t-body-m-medium min-w-0 flex-1 bg-transparent text-a-text outline-none placeholder:text-a-text-3" />
              <span className="t-caption text-a-text-3">{q.options.length} answers</span>
              <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Delete question" onClick={() => set({ questions: quiz.questions.filter((x) => x.id !== q.id), passMark: Math.max(1, Math.min(quiz.passMark, quiz.questions.length - 1)) })}>
                <Trash2 />
              </AdminButton>
            </div>
            <div className="flex flex-col gap-2 pl-6">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateQ(q.id, { answer: oi })}
                    className={cn("grid size-4 shrink-0 place-items-center rounded-full border border-a-border-strong", q.answer === oi && "border-a-success-fill bg-a-success-fill")}
                    aria-label={q.answer === oi ? "Correct answer" : "Mark as correct"}
                    title={q.answer === oi ? "Correct answer" : "Mark as correct"}
                  >
                    {q.answer === oi && <span className="size-1.5 rounded-full bg-black" />}
                  </button>
                  <Input value={o} onChange={(e) => updateQ(q.id, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} placeholder={`Answer ${oi + 1}`} className="h-8" />
                  {q.answer === oi && <Tag tone="success">Correct</Tag>}
                  {q.options.length > 2 && (
                    <AdminButton hierarchy="ghost" size="md" iconOnly aria-label="Remove answer" onClick={() => updateQ(q.id, { options: q.options.filter((_, j) => j !== oi), answer: q.answer >= oi && q.answer > 0 ? q.answer - 1 : q.answer })}>
                      <Trash2 />
                    </AdminButton>
                  )}
                </div>
              ))}
              {q.options.length < 5 && (
                <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => updateQ(q.id, { options: [...q.options, ""] })}><Plus /> Add answer</AdminButton>
              )}
            </div>
          </div>
        ))}
      </div>

      <aside className="flex flex-col gap-4 rounded-a-lg border border-a-border bg-a-panel p-5">
        <h3 className="t-heading-m text-a-text">Quiz rules</h3>
        <div className="grid gap-1.5">
          <Label>Pass mark</Label>
          <SelectOptions value={quiz.passMark} onChange={(e) => set({ passMark: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-2 text-sm">
            {quiz.questions.map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} of {quiz.questions.length} right
              </option>
            ))}
          </SelectOptions>
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="grid gap-0.5">
            <span className="t-body-m text-a-text">Must pass to open the next lesson</span>
            <span className="t-caption text-a-text-2">Students see the next lesson locked until they pass.</span>
          </span>
          <Switch checked={quiz.gate} onCheckedChange={(v) => set({ gate: v })} />
        </label>
        <div className="h-px bg-a-border" />
        <AdminButton hierarchy="secondary" className="w-fit" onClick={draft}><Sparkles /> Write with AI</AdminButton>
        <p className="t-caption text-a-text-2">Questions come from the transcript. Check the answers before you publish.</p>
        <AdminButton hierarchy="danger" className="w-fit" onClick={() => onChange({ quiz: undefined })}><Trash2 /> Remove quiz</AdminButton>
      </aside>
    </div>
  )
}

function PublishLesson({ course, lesson, onChange }: { course: Course; lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const { coach } = useCoach()
  const [notify, setNotify] = useState(true)
  const [channels, setChannels] = useState({ app: true, email: true, discord: !!coach.discordUrl })
  const tiers = course.tiers.length ? coach.tiers.filter((t) => course.tiers.includes(t.id)).map((t) => t.name).join(", ") : "every tier"
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 sm:grid-cols-3">
        {(["draft", "published", "scheduled"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              onChange({ status: s, unlockAt: s === "scheduled" ? lesson.unlockAt ?? "Thu 15 Oct" : lesson.unlockAt })
              if (s === "published" && notify) toast.success(`Published. ${[channels.app && "In-app", channels.email && "e-mail", channels.discord && "Discord"].filter(Boolean).join(", ")} notifications sent.`)
            }}
            className={cn("grid gap-1 rounded-lg border p-3 text-left text-sm bg-card", lesson.status === s && "border-primary ring-1 ring-primary")}
          >
            <span className="flex items-center gap-2 font-medium">
              <span className={cn("size-2 rounded-full", STATUS_DOT[s])} /> {STATUS_LABEL[s]}
            </span>
            <span className="text-xs text-muted-foreground">{s === "draft" ? "Only you see it" : s === "published" ? "Students can watch it" : "Shows locked with a date"}</span>
          </button>
        ))}
      </div>
      {lesson.status === "scheduled" && (
        <Field label="Opens on" hint="Students see this date on the locked lesson">
          <Input value={lesson.unlockAt ?? ""} onChange={(e) => onChange({ unlockAt: e.target.value })} placeholder="e.g. Thu 15 Oct" className="max-w-48" />
        </Field>
      )}
      <div className="grid gap-3 rounded-xl border p-4 bg-card">
        <label className="flex items-center justify-between gap-4">
          <span className="grid">
            <span className="text-sm font-medium">Tell students when it goes live</span>
            <span className="text-xs text-muted-foreground">Only students who have access are notified.</span>
          </span>
          <Switch checked={notify} onCheckedChange={setNotify} />
        </label>
        {notify && (
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ["app", "In the platform"],
                ["email", "E-mail"],
                ["discord", "Discord"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <Checkbox checked={channels[k]} onCheckedChange={(v) => setChannels((c) => ({ ...c, [k]: !!v }))} disabled={k === "discord" && !coach.discordUrl} /> {label}
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border p-4 text-sm bg-card">
        <span className="font-medium">Access</span>
        <p className="text-muted-foreground">
          Follows the course: {tiers}. Change it in Course settings.
        </p>
      </div>
    </div>
  )
}
