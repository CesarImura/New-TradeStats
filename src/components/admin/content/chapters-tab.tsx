"use client"

import { useRef, useState } from "react"
import { MoreHorizontal, Plus, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { type Chapter, type Course, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { AdminButton, EmptyState, Tag } from "../ui"
import { PlayerFrame, clock } from "./course-parts"

const AI_CHAPTERS = ["Intro", "The idea", "On the chart", "Common mistakes", "Recap"]
const parseTime = (v: string) => {
  const [m, s] = v.split(":").map((x) => Number(x) || 0)
  return v.includes(":") ? m * 60 + s : m * 60
}

export function ChaptersTab({ course, lesson, t, setT, onChange }: { course: Course; lesson: Lesson; t: number; setT: (n: number) => void; onChange: (p: Partial<Lesson>) => void }) {
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
      <PlayerFrame lesson={lesson} course={course} controls={false} className="aspect-[3.08]">
        <div ref={bar} className="absolute inset-x-3.5 bottom-3.5 h-6 touch-none" onPointerMove={onMove} onPointerUp={() => (setDragging(null), set(lesson.chapters))} onPointerLeave={() => dragging !== null && (setDragging(null), set(lesson.chapters))}
          onClick={(e) => {
            if (!bar.current || dragging !== null) return
            const r = bar.current.getBoundingClientRect()
            setT(Math.round(((e.clientX - r.left) / r.width) * duration))
          }}>
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-a-track" />
          {lesson.chapters.map((c, i) => (
            <button key={i} type="button" aria-label={`Move chapter ${c.title}`} onPointerDown={(e) => (e.stopPropagation(), bar.current?.setPointerCapture(e.pointerId), setDragging(i))} onClick={(e) => e.stopPropagation()}
              className={cn("absolute inset-y-1 w-3 -translate-x-1/2 outline-none", i === 0 ? "cursor-pointer" : "cursor-ew-resize")} style={{ left: `${(c.at / duration) * 100}%` }}>
              <span className={cn("mx-auto block h-full w-1 rounded-full bg-a-accent-strong transition-[width] duration-200 ease-out motion-reduce:transition-none", dragging === i && "w-1.5")} />
            </button>
          ))}
        </div>
      </PlayerFrame>

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton hierarchy="secondary" size="xl" onClick={() => (set([...lesson.chapters, { at: now, title: "New chapter" }]), setT(now))}>
          <Plus /> Add chapter at {clock(now)}
        </AdminButton>
        <AdminButton hierarchy="ghost" size="xl" onClick={redo}>
          Redo with AI
        </AdminButton>
        <span className="ml-auto t-caption text-a-text-3">AI chapters stay marked until you edit them</span>
      </div>

      <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
        {lesson.chapters.map((c, i) => (
          <li key={`${i}-${c.at}`} className={cn("flex h-[46px] items-center gap-3 rounded-a-md border px-3.5", i === active ? "border-a-accent-strong" : "border-a-border")}>
            <input defaultValue={clock(c.at)} aria-label="Start time" onFocus={() => setT(c.at)} onBlur={(e) => set(lesson.chapters.map((x, j) => (j === i ? { ...x, at: Math.min(duration, parseTime(e.target.value)), ai: false } : x)))} className="w-11 bg-transparent t-caption text-a-text-2 outline-none focus-visible:text-a-text" />
            <input value={c.title} aria-label="Chapter title" onFocus={() => setT(c.at)} onChange={(e) => update(i, { title: e.target.value })} className="min-w-[4ch] max-w-full bg-transparent t-body-m text-a-text outline-none [field-sizing:content] focus-visible:ring-1 focus-visible:ring-[var(--admin-color-border-focus)]" />
            {c.ai && <Tag tone="accent" dot>AI</Tag>}
            <span aria-hidden className="min-w-0 flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger render={<AdminButton hierarchy="ghost" size="sm" iconOnly aria-label={`More for ${c.title}`} />}>
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
