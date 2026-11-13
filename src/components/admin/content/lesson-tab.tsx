"use client"

import { useId, useRef } from "react"
import { Sparkles } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { type Course, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, AdminField, AdminProgress, Dropzone, adminControl } from "../ui"
import { PHASE_LABEL, PlayerFrame, type Upload } from "./course-parts"
import { PictureField } from "./thumbs"
import { useRenameUndo } from "./use-rename-undo"

export function LessonTab({ course, lesson, upload, t, onChange, onPick, next }: { course: Course; lesson: Lesson; upload?: Upload; t: number; onChange: (p: Partial<Lesson>) => void; onPick: (f: File) => void; next?: { title: string; onPlay: () => void } }) {
  const { coach } = useCoach()
  const input = useRef<HTMLInputElement>(null)
  const thumbId = useId()
  const rename = useRenameUndo(lesson.title, (title) => onChange({ title }))
  const busy = upload && upload.phase !== "ready" && upload.phase !== "failed"
  const picker = <input ref={input} type="file" accept="video/*" aria-label="Video" className="sr-only" onChange={(e) => (e.target.files?.[0] && onPick(e.target.files[0]), (e.target.value = ""))} />
  return (
    <div className="flex flex-col gap-4">
      {lesson.video && !busy ? (
        <PlayerFrame lesson={lesson} course={course} t={t || 192} next={next} className="aspect-video sm:aspect-[2.72]">
          <AdminButton hierarchy="secondary" size="md" className="absolute top-3.5 right-3.5" onClick={() => input.current?.click()}>Replace video</AdminButton>
        </PlayerFrame>
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
        <div data-tour="lesson-video" className="flex flex-col"><Dropzone label="Video" accept="video/*" title="Drop the video, or click to upload" hint="AI writes the transcript, chapters and a summary while it uploads. You can pick the thumbnail from the video." className="aspect-[1.78] py-0" onFiles={(f) => onPick(f[0])} /></div>
      )}
      {picker}

      {/* The Getting started tour waits for a real name ("New lesson" is the placeholder title). */}
      <div data-tour="lesson-title" data-named={lesson.title.trim() && lesson.title !== "New lesson" ? true : undefined}>
      <AdminField label="Title" className="grid-cols-[minmax(0,1fr)]">
        {(p) => <input {...p} value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} {...rename} className={cn(adminControl, "h-11")} />}
      </AdminField>
      </div>
      <AdminField label="Summary" className="grid-cols-[minmax(0,1fr)]">
        {(p) => (
          <>
            <textarea {...p} value={lesson.summary ?? ""} onChange={(e) => onChange({ summary: e.target.value, aiSummary: false })} placeholder="Two or three sentences on what students take away." className={cn(adminControl, "min-h-[72px] resize-y py-3")} />
            <div className="flex items-center gap-3 t-caption text-a-text-3">
              {lesson.aiSummary && <span>Written by AI from the transcript · edit freely</span>}
              <button type="button" onClick={() => onChange({ summary: `In this ${coach.wording.lesson.toLowerCase()} you'll learn ${lesson.title.toLowerCase()}, why it matters for your trading, and how to apply it on your next session.`, takeaways: ["The one idea to remember", "How it shows on the chart", "What to practise this week"], aiSummary: true })} className="flex items-center gap-1 text-a-text-2 outline-none hover:text-a-text focus-visible:text-a-text">
                <Sparkles className="size-3" /> {lesson.summary ? "Rewrite with AI" : "Write with AI"}
              </button>
            </div>
          </>
        )}
      </AdminField>
      <AdminField label="Takeaways" hint="One per line." className="grid-cols-[minmax(0,1fr)]">
        {(p) => (
          <textarea
            {...p}
            value={(lesson.takeaways ?? []).join("\n")}
            onChange={(e) => onChange({ takeaways: e.target.value.split("\n") })}
            onBlur={() => onChange({ takeaways: (lesson.takeaways ?? []).map((x) => x.trim()).filter(Boolean) })}
            placeholder="What will students take away?"
            className={cn(adminControl, "min-h-[80px] resize-y py-3")}
          />
        )}
      </AdminField>
      <AdminField label="Task for students" className="grid-cols-[minmax(0,1fr)]">
        {(p) => <textarea {...p} value={lesson.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Optional homework, shown under the video." className={cn(adminControl, "min-h-[64px] resize-y py-3")} />}
      </AdminField>
      <div role="group" aria-labelledby={`${thumbId}-l`} className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
        <span id={`${thumbId}-l`} className="t-caption text-a-text">Thumbnail</span>
        <PictureField value={lesson.thumbnail} color={course.color} onChange={(thumbnail) => onChange({ thumbnail })} label="Thumbnail" empty="No picture yet: the list shows the course cover." />
      </div>
    </div>
  )
}
