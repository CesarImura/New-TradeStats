"use client"

import { useEffect, useRef, useState } from "react"
import { Captions, Lock, Maximize, Pause, Play, RotateCcw, RotateCw } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { series } from "@/components/widgets/parts/tokens"
import { Cover } from "@/components/widgets/parts/shared"
import { fmtTime, type Course, type Lesson } from "@/lib/data/learning"
import { cn } from "@/lib/utils"
import { link, toSec } from "./lesson-utils"

// ---------- player

/** Stand-in video player: plays in real time, with chapters on the bar. */
export function Player({
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


function CtrlButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cn("grid size-8 place-items-center rounded hover:bg-white/15", active && "bg-white/20")}>
      {children}
    </button>
  )
}


export function LockedPlayer({ course, lesson, reason, gate, onUpgrade }: { course: Course; lesson: Lesson; reason: "tier" | "scheduled" | "gate"; gate: Lesson | null; onUpgrade: () => void }) {
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

