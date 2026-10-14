"use client"

import Link from "next/link"
import { BookOpen, Check, GraduationCap, Hourglass, Lock, Play } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COURSES, UNLOCKS, courseProgress, nextLesson } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Big, Caps, Countdown, Head, Ring, Row, Segments, TYPE, Track, W, series, useFrame, useMore } from "./kit"
import { Cover, WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const lessonsOf = (c: (typeof COURSES)[number]) => c.modules.flatMap((m) => m.lessons)
/** A neutral stand-in for the accent, so only one thing per widget carries the coach's colour. */
const NEUTRAL = "color-mix(in oklab, var(--foreground) 45%, transparent)"
const quietAccent = { "--w-accent": NEUTRAL } as React.CSSProperties

function NoCourses() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={BookOpen} title={`Your ${coach.wording.courses.toLowerCase()} will show here`} text={`As soon as ${coach.coachName} publishes the first ${coach.wording.lesson.toLowerCase()}.`} />
}

/** The play button. The widget's one accent; on a Quiet widget it steps back to an outline. */
function Go({ href, label, text }: { href: string; label: string; text?: boolean }) {
  const { emphasis } = useFrame()
  const variant = emphasis === "quiet" ? "outline" : "default"
  if (!text) return <Button size="icon" variant={variant} aria-label={label} className="shrink-0" {...link(href)}><Play /></Button>
  return (
    <>
      <Button size="icon" variant={variant} aria-label={label} className="shrink-0 @[22rem]:hidden" {...link(href)}>
        <Play />
      </Button>
      <Button size="sm" variant={variant} className="hidden shrink-0 @[22rem]:inline-flex" {...link(href)}>
        <Play /> Continue
      </Button>
    </>
  )
}

/**
 * Continue lesson.
 * progress: the lesson title with a lesson-by-lesson strip.
 * cover: the course artwork beside (or above) the lesson.
 * card: a progress ring and the lesson in one line.
 */
export function ContinueLesson({ variant = "progress", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const course = COURSES.find((c) => c.id === props.course) ?? COURSES[0]
  const next = nextLesson(course)
  if (empty || !next) return <NoCourses />
  const lessons = lessonsOf(course)
  const index = lessons.findIndex((l) => l.id === next.lesson.id)
  const minutesLeft = lessons.filter((l) => !l.done).reduce((n, l) => n + l.minutes, 0)
  const pct = courseProgress(course)
  const href = `${base}/courses/${course.id}/${next.lesson.id}`
  const word = coach.wording.lesson.toLowerCase()
  const label = String(props.title || "Up next")
  const after = lessons.slice(index + 1, index + 4)

  const upcoming = detailed && after.length > 0 && (
    <div className="hidden min-h-0 @[18rem]:grid">
      <Caps className="mb-1">After this</Caps>
      {after.map((l) => (
        <Row key={l.id} title={l.title} value={<span className="text-xs text-muted-foreground">{l.minutes} min</span>} />
      ))}
    </div>
  )

  if (variant === "cover") {
    return (
      <W className="@[26rem]:flex-row @[26rem]:items-stretch">
        <Cover color={series(COURSES.indexOf(course))} label={course.title} className="min-h-12 flex-1 @[26rem]:max-w-[45%] @[26rem]:min-w-40" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 @[26rem]:justify-center">
          <Caps>
            {label} · {index + 1} of {lessons.length}
          </Caps>
          <div className="flex items-center gap-3">
            <div className="grid min-w-0 flex-1 gap-0.5">
              <span className={cn(TYPE.title, "line-clamp-1 @[26rem]:line-clamp-2")}>{next.lesson.title}</span>
              <span className={cn(TYPE.small, "hidden truncate @[26rem]:block")}>
                {next.module.title} · {next.lesson.minutes} min
              </span>
            </div>
            <Go href={href} label={`Continue ${word}`} />
          </div>
          {standard && (
            <div className="grid gap-1.5" style={quietAccent}>
              <Track value={pct} />
              <span className={cn(TYPE.small, "tabular-nums")}>
                {pct}% done{detailed ? ` · ${inWords(minutesLeft)} left` : ""}
              </span>
            </div>
          )}
          {upcoming}
        </div>
      </W>
    )
  }

  if (variant === "card") {
    return (
      <W className="justify-center">
        <div className="flex items-center gap-3">
          <span className="hidden @[14rem]:block" style={quietAccent}>
            <Ring value={pct} size={44} stroke={4}>
              <span className="text-[0.6875rem] font-medium tabular-nums">{pct}%</span>
            </Ring>
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <span className={cn(TYPE.title, "truncate")}>{next.lesson.title}</span>
            {standard && (
              <span className={cn(TYPE.small, "truncate")}>
                {course.title} · {next.lesson.minutes} min
              </span>
            )}
          </div>
          <Go href={href} label={`Continue ${word}`} />
        </div>
        {upcoming}
      </W>
    )
  }

  // progress
  return (
    <W>
      <Head icon={GraduationCap} label={course.title} right={`${index + 1} of ${lessons.length}`} />
      <div className="flex items-end justify-between gap-3">
        <Big value={next.lesson.title} sub={`${next.module.title} · ${next.lesson.minutes} min`} />
        <Go href={href} label={`Continue ${word}`} text />
      </div>
      {standard && (
        <div className="mt-auto grid gap-1.5">
          <Segments
            className="h-1.5"
            parts={lessons.map((l, i) => ({
              w: l.minutes,
              label: l.title,
              color: l.done ? NEUTRAL : i === index ? `color-mix(in oklab, var(--foreground) 20%, var(--muted))` : "var(--muted)",
            }))}
          />
          <div className={cn(TYPE.small, "flex items-center gap-2 tabular-nums")}>
            <span>{pct}% done</span>
            <span className="ml-auto">{inWords(minutesLeft)} left</span>
          </div>
        </div>
      )}
      {upcoming}
    </W>
  )
}

/** Days and hours until an unlock, as countdown parts. */
const untilParts = (h: number) => [
  { value: Math.floor(h / 24), unit: "d" },
  { value: h % 24, unit: "h" },
]

/** The next module that opens, as one quiet row (used at Detail = detailed). */
function UnlockRow() {
  const u = UNLOCKS[0]
  return (
    <Row
      avatar={
        <span className="r-chip grid size-6 shrink-0 place-items-center bg-muted">
          <Hourglass className="size-3 text-muted-foreground" />
        </span>
      }
      title={u.title}
      sub={`${u.lessons} lessons · ${u.date}`}
      value={<span className="text-xs text-muted-foreground">in {inWords(u.inHours * 60)}</span>}
    />
  )
}

/**
 * Courses.
 * rings: one ring per course; the course in progress carries the accent.
 * bars: a list with course artwork, a thin track and the tier on locked ones.
 * unlocks: what opens next, with a countdown and the schedule after it.
 */
export function CourseProgress({ variant = "rings" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  if (empty) {
    if (variant === "unlocks") return <WidgetEmpty icon={Lock} title="Everything is unlocked" text={`New ${coach.wording.courses.toLowerCase()} content appears here when it's scheduled.`} />
    return <NoCourses />
  }
  const all = COURSES.flatMap(lessonsOf)
  const done = all.filter((l) => l.done).length
  const overall = Math.round((done / all.length) * 100)
  // The course the student is in: the first open one that isn't finished.
  const current = COURSES.find((c) => !c.locked && courseProgress(c) < 100) ?? COURSES[0]

  if (variant === "unlocks") {
    const [first, ...later] = UNLOCKS
    return (
      <W>
        <Head icon={Hourglass} label="Next unlock" right={standard ? first.date : undefined} />
        <div className="flex flex-col gap-3 @[24rem]:flex-row @[24rem]:items-end @[24rem]:justify-between">
          <Countdown parts={untilParts(first.inHours)} />
          <div className="grid min-w-0 gap-0.5 @[24rem]:text-right">
            <span className={cn(TYPE.title, "truncate")}>{first.title}</span>
            {standard && <span className={TYPE.small}>{first.lessons} lessons</span>}
          </div>
        </div>
        {detailed && (
          <div className="mt-auto grid">
            <Caps className="mb-1">After that</Caps>
            {later.map((u) => (
              <Row key={u.title} title={u.title} sub={`${u.lessons} lessons`} value={<span className="text-xs text-muted-foreground">{u.date}</span>} />
            ))}
          </div>
        )}
      </W>
    )
  }

  if (variant === "bars") {
    const shown = detailed ? COURSES : COURSES.slice(0, standard ? COURSES.length : 2)
    return (
      <W>
        <Head icon={BookOpen} label={coach.wording.courses} value={standard ? `${overall}%` : undefined} right={`${done} of ${all.length} lessons`} />
        <div className="grid flex-1 content-start">
          {shown.map((c, i) => {
            const p = courseProgress(c)
            const n = lessonsOf(c)
            return (
              <div key={c.id} className="flex min-w-0 items-center gap-3 border-b border-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)] py-2 last:border-b-0">
                <Cover color={series(i)} className="hidden h-9 w-12 shrink-0 @[16rem]:block" />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn(TYPE.body, "truncate", c.locked && "text-muted-foreground")}>{c.title}</span>
                    <span className={cn(TYPE.small, "ml-auto flex shrink-0 items-center gap-1 tabular-nums")}>
                      {c.locked ? (
                        <>
                          <Lock className="size-3" /> {c.locked}
                        </>
                      ) : p === 100 ? (
                        <>
                          <Check className="size-3" /> Done
                        </>
                      ) : (
                        `${n.filter((l) => l.done).length}/${n.length}`
                      )}
                    </span>
                  </div>
                  {!c.locked && (
                    <span style={c === current ? undefined : quietAccent}>
                      <Track value={p} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {detailed && <UnlockRow />}
      </W>
    )
  }

  // rings
  return (
    <W>
      <Head icon={BookOpen} label={coach.wording.courses} value={standard ? `${overall}%` : undefined} right={`${done} of ${all.length} lessons`} />
      <div className="grid flex-1 grid-cols-3 items-center gap-2">
        {COURSES.map((c) => {
          const p = courseProgress(c)
          return (
            <div key={c.id} className="flex min-w-0 flex-col items-center gap-2 text-center" style={c === current ? undefined : quietAccent}>
              <Ring value={c.locked ? 0 : p} size={52} stroke={4} className="@[20rem]:hidden">
                {c.locked ? <Lock className="size-3.5 text-muted-foreground" /> : <span className="text-[0.6875rem] font-medium tabular-nums">{p}%</span>}
              </Ring>
              <Ring value={c.locked ? 0 : p} size={68} stroke={5} className="hidden @[20rem]:grid">
                {c.locked ? <Lock className="size-4 text-muted-foreground" /> : <span className="text-[0.8125rem] font-medium tabular-nums">{p}%</span>}
              </Ring>
              <div className="grid max-w-full gap-0.5">
                <span className={cn(TYPE.small, "truncate", c === current && "text-foreground")}>{c.title}</span>
                {standard && c.locked && <span className={cn(TYPE.small, "hidden truncate @[20rem]:block")}>{c.locked}</span>}
              </div>
            </div>
          )
        })}
      </div>
      {detailed && <UnlockRow />}
    </W>
  )
}
