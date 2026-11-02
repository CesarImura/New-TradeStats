"use client"

import { useState } from "react"
import { Check, FileDown, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { fmtTime, uid, updateProgress, useProgress, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AiMark } from "./shared"
import { seek, toSec } from "./lesson-utils"

// ---------- tabs under the video

export function LessonTabs({ lesson, time }: { lesson: Lesson; time: number }) {
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

