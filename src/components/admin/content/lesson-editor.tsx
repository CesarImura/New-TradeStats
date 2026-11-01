"use client"

import { useEffect, useRef, useState } from "react"
import { CircleHelp, FileDown, FileVideo, Plus, Sparkles, Trash2, Upload } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABEL, fmtTime, uid, type Chapter, type Course, type Lesson, type Quiz, type Status } from "@/lib/data/learning"
import { SelectOptions } from "@/components/kit/select-field"
import { cn } from "@/lib/utils"
import { STATUS_DOT, StatusBadge } from "./content-board"
import { Field } from "./course-settings"

const parseTime = (v: string) => {
  const [m, s] = v.split(":").map((x) => Number(x) || 0)
  return v.includes(":") ? m * 60 + s : m * 60
}

export function LessonEditor({ course, lesson, onChange }: { course: Course; lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const { coach } = useCoach()
  const mod = course.modules.find((m) => m.lessons.some((l) => l.id === lesson.id))
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="text-xs text-muted-foreground">
          {course.title} · {mod?.title}
        </span>
        <input
          value={lesson.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="-mx-2 rounded-md px-2 py-1 text-xl font-semibold outline-none hover:bg-muted focus:bg-muted"
          aria-label="Lesson title"
        />
        <div className="flex items-center gap-2">
          <StatusBadge status={lesson.status} when={lesson.unlockAt} />
          {lesson.minutes > 0 && <span className="text-xs text-muted-foreground">{lesson.minutes} min</span>}
        </div>
      </div>

      <Tabs defaultValue="content" className="gap-5">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="chapters">
            Chapters <span className="text-muted-foreground tabular-nums">{lesson.chapters.length || ""}</span>
          </TabsTrigger>
          <TabsTrigger value="quiz">Quiz {lesson.quiz && <span className="size-1.5 rounded-full bg-primary" />}</TabsTrigger>
          <TabsTrigger value="publish">Access and publishing</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="grid gap-6">
          <VideoField lesson={lesson} onChange={onChange} />
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
          <div className="grid gap-2">
            <Label>Downloads</Label>
            {lesson.downloads.map((d) => (
              <div key={d.name} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
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

function VideoField({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const [pct, setPct] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), [])

  const upload = () => {
    setPct(0)
    timer.current = setInterval(() => {
      setPct((p) => {
        const n = Math.min(100, (p ?? 0) + 9)
        if (n >= 100) {
          clearInterval(timer.current!)
          const minutes = lesson.minutes || 16
          onChange({ video: `${lesson.title}.mp4`, minutes })
          setProcessing(true)
          setTimeout(() => {
            setProcessing(false)
            setPct(null)
            if (!lesson.chapters.length) onChange({ video: `${lesson.title}.mp4`, minutes, chapters: AI_CHAPTERS.map((title, i) => ({ at: Math.round(((minutes * 60) / AI_CHAPTERS.length) * i), title, ai: true })) })
            toast.success("Video ready. AI added chapters and a transcript.")
          }, 1600)
        }
        return n
      })
    }, 180)
  }

  if (pct !== null || processing) {
    return (
      <div className="grid gap-2 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-sm">
          <FileVideo className="size-4 text-muted-foreground" />
          <span className="flex-1">{processing ? "Processing: transcript and chapters…" : `Uploading ${lesson.title}.mp4`}</span>
          <span className="text-muted-foreground tabular-nums">{processing ? "" : `${pct}%`}</span>
        </div>
        <Progress value={processing ? 100 : pct ?? 0} className={cn("h-1.5", processing && "animate-pulse")} />
        <span className="text-xs text-muted-foreground">You can keep editing. The upload continues in the background.</span>
      </div>
    )
  }
  if (lesson.video || lesson.status === "published") {
    return (
      <div className="flex items-center gap-4 rounded-xl border p-3">
        <div className="grid aspect-video w-36 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-900 text-white">
          <FileVideo className="size-6 opacity-80" />
        </div>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-medium">{lesson.video ?? `${lesson.title}.mp4`}</span>
          <span className="text-xs text-muted-foreground">
            {lesson.minutes} min · {lesson.chapters.length} chapters{lesson.transcript ? " · transcript" : ""}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={upload}>
          Replace
        </Button>
      </div>
    )
  }
  return (
    <button onClick={upload} onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), upload())} className="grid place-items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center hover:bg-muted/50">
      <Upload className="size-6 text-muted-foreground" />
      <span className="font-medium">Drop the video, or click to upload</span>
      <span className="text-sm text-muted-foreground">AI writes the transcript, chapters and a summary while it uploads.</span>
    </button>
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Students use chapters to jump around the video and in search.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (set(AI_CHAPTERS.map((title, i) => ({ at: Math.round((duration / AI_CHAPTERS.length) * i), title, ai: true }))), toast("AI suggested chapters from the transcript."))}
        >
          <Sparkles /> Suggest with AI
        </Button>
      </div>

      <div className="grid gap-2 rounded-xl border p-4">
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
              <div key={i} className="absolute inset-y-1 overflow-hidden rounded bg-primary/15 px-1.5 text-[0.65rem] leading-5 whitespace-nowrap text-foreground/80" style={{ left: `${(c.at / duration) * 100}%`, width: `calc(${((end - c.at) / duration) * 100}% - 2px)` }}>
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

      <div className="grid gap-2">
        {lesson.chapters.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              defaultValue={fmtTime(c.at)}
              key={`${i}-${c.at}`}
              onBlur={(e) => set(lesson.chapters.map((x, j) => (j === i ? { ...x, at: Math.min(duration, parseTime(e.target.value)), ai: false } : x)))}
              className="w-20 tabular-nums"
              aria-label="Start time"
            />
            <Input value={c.title} onChange={(e) => update(i, { title: e.target.value })} aria-label="Chapter title" />
            {c.ai && (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Sparkles className="size-3" /> AI
              </Badge>
            )}
            <Button variant="ghost" size="icon" aria-label="Delete chapter" onClick={() => set(lesson.chapters.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => {
            const last = lesson.chapters.at(-1)?.at ?? -60
            set([...lesson.chapters, { at: Math.min(duration - 10, last + 60), title: "New chapter" }])
          }}
        >
          <Plus /> Add chapter
        </Button>
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

  return (
    <div className="grid gap-5">
      {quiz.ai && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
          <Sparkles className="size-4 text-primary" /> Drafted by AI from the transcript. Check the answers before you publish.
        </div>
      )}
      {quiz.questions.map((q, qi) => (
        <div key={q.id} className="grid gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground tabular-nums">{qi + 1}.</span>
            <Input value={q.q} onChange={(e) => updateQ(q.id, { q: e.target.value })} placeholder="Question" />
            <Button variant="ghost" size="icon" aria-label="Delete question" onClick={() => set({ questions: quiz.questions.filter((x) => x.id !== q.id), passMark: Math.min(quiz.passMark, quiz.questions.length - 1) })}>
              <Trash2 />
            </Button>
          </div>
          <div className="grid gap-2 pl-6">
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <button
                  onClick={() => updateQ(q.id, { answer: oi })}
                  className={cn("grid size-5 shrink-0 place-items-center rounded-full border", q.answer === oi && "border-emerald-500 bg-emerald-500 text-white")}
                  aria-label={q.answer === oi ? "Correct answer" : "Mark as correct"}
                  title={q.answer === oi ? "Correct answer" : "Mark as correct"}
                >
                  {q.answer === oi && <span className="size-1.5 rounded-full bg-current" />}
                </button>
                <Input value={o} onChange={(e) => updateQ(q.id, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} placeholder={`Answer ${oi + 1}`} className="h-8" />
                {q.options.length > 2 && (
                  <Button variant="ghost" size="icon-xs" aria-label="Remove answer" onClick={() => updateQ(q.id, { options: q.options.filter((_, j) => j !== oi), answer: q.answer >= oi && q.answer > 0 ? q.answer - 1 : q.answer })}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            ))}
            {q.options.length < 5 && (
              <Button variant="ghost" size="xs" className="w-fit" onClick={() => updateQ(q.id, { options: [...q.options, ""] })}>
                <Plus /> Add answer
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-fit" onClick={() => set({ questions: [...quiz.questions, { id: uid("q"), q: "", options: ["", ""], answer: 0 }] })}>
        <Plus /> Add question
      </Button>

      <div className="grid gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="grid">
            <Label>Pass mark</Label>
            <span className="text-xs text-muted-foreground">Right answers needed to pass</span>
          </div>
          <SelectOptions value={quiz.passMark} onChange={(e) => set({ passMark: Number(e.target.value) })} className="h-9 rounded-lg border bg-background px-2 text-sm">
            {quiz.questions.map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} of {quiz.questions.length}
              </option>
            ))}
          </SelectOptions>
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="grid">
            <span className="text-sm font-medium">Must pass to open the next lesson</span>
            <span className="text-xs text-muted-foreground">Students see the next lesson locked until they pass.</span>
          </span>
          <Switch checked={quiz.gate} onCheckedChange={(v) => set({ gate: v })} />
        </label>
      </div>
      <Button variant="ghost" className="w-fit text-destructive hover:text-destructive" onClick={() => onChange({ quiz: undefined })}>
        <Trash2 /> Remove quiz
      </Button>
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
            className={cn("grid gap-1 rounded-lg border p-3 text-left text-sm", lesson.status === s && "border-primary ring-1 ring-primary")}
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
      <div className="grid gap-3 rounded-xl border p-4">
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
      <div className="rounded-xl border p-4 text-sm">
        <span className="font-medium">Access</span>
        <p className="text-muted-foreground">
          Follows the course: {tiers}. Change it in Course settings.
        </p>
      </div>
    </div>
  )
}
