"use client"

import Link from "next/link"
import { BookOpen, GraduationCap, Lock, Play } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COURSES, courseProgress, nextLesson } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Dots, Head, Key, Ring, Segments, TONE, Track, W, fill, series } from "./kit"
import { Cover, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const lessonsOf = (c: (typeof COURSES)[number]) => c.modules.flatMap((m) => m.lessons)

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
  const lessons = lessonsOf(course)
  const index = lessons.findIndex((l) => l.id === next.lesson.id)
  const minutesLeft = lessons.filter((l) => !l.done).reduce((n, l) => n + l.minutes, 0)
  const pct = courseProgress(course)

  if (variant === "cover") {
    return (
      <div className="@container relative isolate flex h-full overflow-hidden rounded-(--radius) text-white" style={{ boxShadow: "var(--card-shadow)" }}>
        <Cover color={series(COURSES.indexOf(course))} className="absolute inset-0 -z-10 rounded-none" />
        <div className="absolute inset-0 -z-10 bg-black/35" />
        <div className="flex w-full flex-col justify-between gap-3 p-[calc(1.25rem*var(--density,1))]">
          <div className="flex items-center gap-2">
            <span className="r-chip bg-white/20 px-2 py-1 text-[0.65rem] font-medium tracking-wide uppercase backdrop-blur-sm">{String(props.title || "Up next")}</span>
            <span className="ml-auto text-xs tabular-nums text-white/80">
              {index + 1}/{lessons.length}
            </span>
          </div>
          <div className="flex flex-col gap-3 @lg:flex-row @lg:items-end @lg:justify-between">
            <div className="grid min-w-0 gap-1">
              <span className="font-heading leading-tight font-semibold" style={{ fontSize: "clamp(1.25rem, 6cqi, 2rem)" }}>
                {next.lesson.title}
              </span>
              <span className="truncate text-sm text-white/75">
                {course.title} · {next.lesson.minutes} min
              </span>
            </div>
            <Button size="lg" variant="secondary" className="shrink-0 self-start @lg:self-auto" {...link(`${base}/courses/${course.id}/${next.lesson.id}`)}>
              <Play /> Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <W className="flex-row items-center gap-4">
        <Ring value={pct} size={60} stroke={6} className="hidden @[16rem]:grid">
          <span className="text-sm font-semibold tabular-nums">{pct}%</span>
        </Ring>
        <div className="grid min-w-0 flex-1 gap-1">
          <Caps>
            {String(props.title || "Up next")} · {index + 1}/{lessons.length}
          </Caps>
          <span className="truncate font-heading text-lg leading-tight font-semibold">{next.lesson.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {course.title} · {next.lesson.minutes} min
          </span>
        </div>
        <Button size="icon-lg" aria-label="Continue" className="shrink-0" {...link(`${base}/courses/${course.id}/${next.lesson.id}`)}>
          <Play />
        </Button>
      </W>
    )
  }

  return (
    <W>
      <Head icon={GraduationCap} value={`${pct}%`} label={course.title} right={`${index + 1} of ${lessons.length}`} />
      <div className="flex items-end justify-between gap-3">
        <Big value={next.lesson.title} sub={`${next.module.title} · ${next.lesson.minutes} min`} />
        <Button size="icon-lg" aria-label={`Continue ${coach.wording.lesson.toLowerCase()}`} className="shrink-0" {...link(`${base}/courses/${course.id}/${next.lesson.id}`)}>
          <Play />
        </Button>
      </div>
      <Segments
        className="mt-auto h-2"
        parts={lessons.map((l, i) => ({ w: l.minutes, label: l.title, brand: l.done, color: i === index ? `color-mix(in oklab, ${TONE.primary} 40%, var(--muted))` : "var(--muted)" }))}
      />
      <div className="flex items-center gap-3">
        <Key color={TONE.primary}>Done</Key>
        <Key color={`color-mix(in oklab, ${TONE.primary} 40%, var(--muted))`}>Next</Key>
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
  const all = COURSES.flatMap(lessonsOf)
  const done = all.filter((l) => l.done).length
  const overall = Math.round((done / all.length) * 100)

  if (variant === "dots") {
    return (
      <W>
        <Head icon={BookOpen} label={coach.wording.courses} right={`${done} of ${all.length} lessons`} />
        <Big value={`${overall}%`} sub="of everything you can access" />
        <Dots className="mt-auto" cols={Math.max(12, Math.ceil(all.length / 2))} total={all.length} groups={COURSES.map((c, i) => ({ n: lessonsOf(c).filter((l) => l.done).length, color: series(i) }))} />
        <div className="hidden flex-wrap gap-x-3 gap-y-1 @[18rem]:flex">
          {COURSES.map((c, i) => (
            <Key key={c.id} color={series(i)}>
              {c.title}
            </Key>
          ))}
        </div>
      </W>
    )
  }

  if (variant === "bars") {
    return (
      <W>
        <Head icon={BookOpen} label={coach.wording.courses} right={`${COURSES.length} courses`} />
        <Big value={`${overall}%`} sub={`${done} of ${all.length} lessons`} />
        <div className="mt-auto grid gap-2.5">
          {COURSES.map((c, i) => {
            const p = courseProgress(c)
            return (
              <div key={c.id} className="grid gap-1">
                <div className="flex items-center gap-2 text-xs">
                  {c.locked && <Lock className="size-3 text-muted-foreground" />}
                  <span className={cn("truncate", c.locked && "text-muted-foreground")}>{c.title}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">{c.locked ? c.locked : `${p}%`}</span>
                </div>
                <Track value={c.locked ? 0 : p} color={i === 0 ? fill("primary", "90deg") : series(i)} />
              </div>
            )
          })}
        </div>
      </W>
    )
  }

  return (
    <W>
      <Head icon={BookOpen} value={`${overall}%`} label={coach.wording.courses} right={`${done} of ${all.length}`} />
      <div className="grid flex-1 grid-cols-3 items-center gap-2">
        {COURSES.map((c) => {
          const p = courseProgress(c)
          return (
            <div key={c.id} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <Ring value={c.locked ? 0 : p} size={68} stroke={7} className="scale-75 @[18rem]:scale-100">
                {c.locked ? <Lock className="size-4 text-muted-foreground" /> : <span className="text-sm font-semibold tabular-nums">{p}%</span>}
              </Ring>
              <Caps className="max-w-full truncate">{c.title.split(" ")[0]}</Caps>
            </div>
          )
        })}
      </div>
    </W>
  )
}
