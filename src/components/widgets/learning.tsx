"use client"

import Link from "next/link"
import { BookOpen, GraduationCap, Lock, Play, PlayCircle } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COURSES, courseProgress, nextLesson } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Dots, Head, Ring, Segments, TONE, W, gradientFill, series } from "./kit"
import { Cover, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

function NoCourses() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={BookOpen} title={`Your ${coach.wording.courses.toLowerCase()} will show here`} text={`As soon as ${coach.coachName} publishes the first ${coach.wording.lesson.toLowerCase()}.`} />
}

/** Continue lesson: progress (lesson-by-lesson bar), card (compact with ring), cover (artwork). */
export function ContinueLesson({ variant = "progress", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const course = COURSES.find((c) => c.id === props.course) ?? COURSES[0]
  const next = nextLesson(course)
  if (empty || !next) return <NoCourses />
  const lessons = course.modules.flatMap((m) => m.lessons)
  const index = lessons.findIndex((l) => l.id === next.lesson.id)
  const minutesLeft = lessons.filter((l) => !l.done).reduce((n, l) => n + l.minutes, 0)
  const pct = courseProgress(course)

  if (variant === "cover") {
    return (
      <div className="@container relative isolate flex h-full overflow-hidden rounded-(--radius) text-white" style={{ boxShadow: "var(--card-shadow)" }}>
        <Cover color={series(COURSES.indexOf(course))} className="absolute inset-0 -z-10 rounded-none" />
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="flex w-full flex-col justify-between gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2 py-1 text-[0.65rem] font-semibold tracking-wider uppercase">
              {String(props.title || "Up next")}
            </span>
            <span className="ml-auto text-xs tabular-nums text-white/80">
              {index + 1}/{lessons.length}
            </span>
          </div>
          <div className="flex flex-col gap-3 @lg:flex-row @lg:items-end @lg:justify-between">
            <div className="grid gap-1">
              <span className="font-heading text-2xl leading-tight font-semibold @lg:text-3xl">{next.lesson.title}</span>
              <span className="text-sm text-white/75">{course.title} · {next.lesson.minutes} min</span>
            </div>
            <Button size="lg" variant="secondary" {...link(`${base}/courses`)}>
              <PlayCircle /> Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={pct} size={64} stroke={6}>
          <span className="text-sm font-semibold tabular-nums">{pct}%</span>
        </Ring>
        <div className="grid min-w-0 flex-1 gap-1">
          <Caps>{String(props.title || "Up next")} · {index + 1}/{lessons.length}</Caps>
          <span className="truncate font-heading text-lg leading-tight font-semibold">{next.lesson.title}</span>
          <span className="truncate text-xs text-muted-foreground">{course.title} · {next.lesson.minutes} min</span>
        </div>
        <Button size="icon-lg" aria-label="Continue" className="shrink-0" {...link(`${base}/courses`)}>
          <Play />
        </Button>
      </W>
    )
  }

  // progress
  return (
    <W>
      <Head icon={GraduationCap} value={`${pct}%`} label={course.title} right={`${index + 1}/${lessons.length}`} />
      <div className="flex items-end justify-between gap-3">
        <Big value={next.lesson.title} sub={`${next.module.title} · ${next.lesson.minutes} min`} />
        <Button size="icon-lg" aria-label={`Continue ${coach.wording.lesson.toLowerCase()}`} className="shrink-0" {...link(`${base}/courses`)}>
          <Play />
        </Button>
      </div>
      <Segments
        className="max-h-10"
        parts={lessons.map((l, i) => ({
          w: l.minutes,
          label: l.title,
          brand: l.done,
          color: l.done ? TONE.primary : i === index ? TONE.highlight : "var(--muted)",
        }))}
      />
      <div className="flex gap-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><i className="size-2 rounded-full bg-primary" /> Done</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><i className="size-2 rounded-full bg-highlight" /> Next</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{minutesLeft} min left</span>
      </div>
    </W>
  )
}

/** Courses: rings (one per course), bars (overall + per course), dots (every lesson). */
export function CourseProgress({ variant = "rings" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  if (empty) return <NoCourses />
  const all = COURSES.flatMap((c) => c.modules.flatMap((m) => m.lessons))
  const done = all.filter((l) => l.done).length
  const overall = Math.round((done / all.length) * 100)

  if (variant === "dots") {
    return (
      <W>
        <Head icon={BookOpen} label={coach.wording.courses} right={`${done}/${all.length} lessons`} />
        <Big fx value={`${overall}%`} sub="of everything you have access to" />
        <Dots
          className="mt-auto"
          cols={Math.max(12, Math.ceil(all.length / 2))}
          total={all.length}
          groups={COURSES.map((c, i) => ({ n: c.modules.flatMap((m) => m.lessons).filter((l) => l.done).length, color: series(i) }))}
        />
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {COURSES.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <i className="size-2 rounded-full" style={{ background: series(i) }} /> {c.title}
            </span>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "bars") {
    return (
      <W>
        <Head icon={BookOpen} label={coach.wording.courses} right={`${COURSES.length} courses`} />
        <Big fx value={`${overall}%`} sub={`${done} of ${all.length} lessons done`} />
        <div className="mt-auto grid gap-2.5">
          {COURSES.map((c, ci) => {
            const p = courseProgress(c)
            return (
              <div key={c.id} className="grid gap-1">
                <div className="flex items-center gap-2 text-xs">
                  {c.locked && <Lock className="size-3 text-muted-foreground" />}
                  <span className={cn("truncate", c.locked && "text-muted-foreground")}>{c.title}</span>
                  <span className="ml-auto text-muted-foreground tabular-nums">{c.locked ? c.locked : `${p}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${c.locked ? 0 : p}%`, background: gradientFill(series(ci)), boxShadow: `0 0 10px -2px ${series(ci)}` }} />
                </div>
              </div>
            )
          })}
        </div>
      </W>
    )
  }

  // rings
  return (
    <W>
      <Head icon={BookOpen} value={`${overall}%`} label={coach.wording.courses} right={`${done}/${all.length}`} />
      <div className="grid flex-1 grid-cols-3 items-center gap-2">
        {COURSES.map((c) => {
          const p = courseProgress(c)
          return (
            <div key={c.id} className="flex flex-col items-center gap-2 text-center">
              <Ring value={c.locked ? 0 : p} size={72} stroke={8} className="@max-[14rem]:scale-75">
                {c.locked ? <Lock className="size-4 text-muted-foreground" /> : <span className="text-sm font-semibold tabular-nums">{p}</span>}
              </Ring>
              <Caps className="line-clamp-1">{c.title.split(" ")[0]}</Caps>
            </div>
          )
        })}
      </div>
    </W>
  )
}
