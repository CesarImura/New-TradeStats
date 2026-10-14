"use client"

import Link from "next/link"
import { BookOpen, Check, Hourglass, Lock, Play, PlayCircle } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { COURSES, DEMO_STUDENT, UNLOCKS, courseProgress, nextLesson } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, TYPE, series, useFrame, useMore } from "./kit"
import { Axis, Chip, GREY, HatchBar, Label, Legend, Num, Rule, TickBar, Timeline, WCard, useFigureFont, useChartStyle } from "./instrument"
import { Cover, WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"

type Course = (typeof COURSES)[number]

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
const lessonsOf = (c: Course) => c.modules.flatMap((m) => m.lessons)
/** An empty tick or track (the same faint grey instrument.tsx uses). */
const TRACK = "color-mix(in oklab, var(--foreground) 12%, transparent)"
/** What's still ahead: faint diagonal hatching, like HatchBar's remainder. */
const HATCH = { background: `repeating-linear-gradient(135deg, ${TRACK} 0 2px, transparent 2px 5px)`, boxShadow: `inset 0 0 0 1px ${TRACK}` }
/** Lessons the student finished this week (sample). */
const DONE_THIS_WEEK = 2

function NoCourses() {
  const { coach } = useCoach()
  return <WidgetEmpty icon={BookOpen} title={`Your ${coach.wording.courses.toLowerCase()} will show here`} text={`As soon as ${coach.coachName} publishes the first ${coach.wording.lesson.toLowerCase()}.`} />
}

/** The play button. The widget's one action; on a Quiet widget it steps back to an outline. */
function Go({ href, label, text }: { href: string; label: string; text?: boolean }) {
  const { emphasis } = useFrame()
  const variant = emphasis === "quiet" ? "outline" : "default"
  if (!text)
    return (
      <Button size="icon" variant={variant} aria-label={label} className="shrink-0" {...link(href)}>
        <Play />
      </Button>
    )
  return (
    <>
      <Button size="icon" variant={variant} aria-label={label} className="shrink-0 @[24rem]:hidden" {...link(href)}>
        <Play />
      </Button>
      <Button size="sm" variant={variant} className="hidden shrink-0 @[24rem]:inline-flex" {...link(href)}>
        <Play /> Continue
      </Button>
    </>
  )
}

/**
 * The course lesson by lesson: one segment per lesson (width by its minutes),
 * grouped by module. Done lessons grey, the current one in the accent and a
 * little taller, the rest hatched. `modules` adds M1 · M2 · M3 under the groups.
 */
function LessonBar({ course, current, height: h0 = 8, modules, className }: { course: Course; current: string; height?: number; modules?: boolean; className?: string }) {
  const font = useFigureFont()
  // Chart style: ticks (separate lessons, the rest hatched), solid (lessons joined, plain track), thin (a hairline).
  const style = useChartStyle()
  const height = style === "thin" ? 3 : h0
  const rest = style === "ticks" ? HATCH : { background: TRACK }
  const mi = course.modules.findIndex((m) => m.lessons.some((l) => l.id === current))
  return (
    <div className={cn("grid gap-1", className)}>
      <div className={cn("flex items-end", style === "ticks" ? "gap-[5px]" : "gap-[3px]")} style={{ height: height + 4 }} aria-hidden>
        {course.modules.map((m) => (
          <div key={m.id} className={cn("flex h-full items-end", style === "ticks" ? "gap-[2px]" : "gap-px")} style={{ flex: m.lessons.reduce((n, l) => n + l.minutes, 0) }}>
            {m.lessons.map((l) => {
              const now = l.id === current
              return <span key={l.id} title={l.title} className="r-bar" style={{ flex: l.minutes, height: now && style !== "thin" ? height + 4 : height, ...(l.done ? { background: GREY[1] } : now ? { background: ACCENT } : rest) }} />
            })}
          </div>
        ))}
      </div>
      {modules && (
        <div className="flex gap-[5px] text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
          {course.modules.map((m, i) => (
            <span key={m.id} className={cn("min-w-0 truncate", i === mi ? "text-foreground" : "text-muted-foreground")} style={{ flex: m.lessons.reduce((n, l) => n + l.minutes, 0) }}>
              M{i + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Continue lesson.
 * progress: the lesson title over a lesson-by-lesson bar of the whole course.
 * cover: the course artwork beside the lesson and its bar.
 * card: one line, the lesson and a small bar beside the play button.
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
  const done = lessons.filter((l) => l.done).length
  const mi = course.modules.indexOf(next.module)
  const moduleName = next.module.title.split(" · ").pop()
  const minutesLeft = lessons.filter((l) => !l.done).reduce((n, l) => n + l.minutes, 0)
  const href = `${base}/courses/${course.id}/${next.lesson.id}`
  const word = coach.wording.lesson.toLowerCase()
  const label = String(props.title || "Up next")
  const meta = `${course.title} · Module ${mi + 1} · ${word} ${index + 1} of ${lessons.length}`
  const chip = <Chip>{inWords(minutesLeft)} left</Chip>

  /** This lesson and the next ones, as a timeline (Detail = detailed). */
  const upcoming = detailed && (
    <div className="mt-auto hidden min-h-0 gap-1 @[16rem]:grid">
      <Rule />
      <Timeline
        items={lessons.slice(index, index + 4).map((l, k) => ({
          time: String(index + k + 1).padStart(2, "0"),
          title: l.title,
          value: `${l.minutes} min`,
          color: k === 0 ? ACCENT : GREY[2],
          strong: k === 0,
        }))}
      />
    </div>
  )
  const footer = <Axis labels={[`${done}/${lessons.length} done`, `${inWords(minutesLeft)} left`]} />

  if (variant === "cover") {
    return (
      <WCard icon={PlayCircle} title="Continue lesson" meta={meta} chip={chip} bodyClassName="@[26rem]:flex-row @[26rem]:items-stretch @[26rem]:gap-4">
        <Cover color={series(COURSES.indexOf(course))} label={course.title} className="hidden min-h-16 @[26rem]:block @[26rem]:w-[42%] @[26rem]:max-w-64 @[26rem]:shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Cover color={series(COURSES.indexOf(course))} className="hidden h-10 w-14 shrink-0 @[16rem]:block @[26rem]:hidden" />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <Label className="truncate">
                {label} · {next.lesson.minutes} min
              </Label>
              <span className={cn(TYPE.title, "line-clamp-1 @[26rem]:line-clamp-2")}>{next.lesson.title}</span>
            </div>
            <Go href={href} label={`Continue ${word}`} />
          </div>
          <div className="mt-auto grid gap-1.5">
            <LessonBar course={course} current={next.lesson.id} height={6} />
            {standard && footer}
          </div>
          {upcoming}
        </div>
      </WCard>
    )
  }

  if (variant === "card") {
    const line = (
      <>
        <LessonBar course={course} current={next.lesson.id} height={6} className="hidden w-28 shrink-0 @[30rem]:grid" />
        <Go href={href} label={`Continue ${word}`} />
      </>
    )
    if (!detailed)
      return (
        <WCard row icon={PlayCircle} title={next.lesson.title} meta={standard ? `${meta} · ${next.lesson.minutes} min` : `${index + 1} of ${lessons.length}`}>
          {line}
        </WCard>
      )
    return (
      <WCard icon={PlayCircle} title="Continue lesson" meta={meta} chip={chip}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn(TYPE.title, "min-w-0 flex-1 truncate")}>{next.lesson.title}</span>
          {line}
        </div>
        {upcoming}
      </WCard>
    )
  }

  // progress
  return (
    <WCard icon={PlayCircle} title="Continue lesson" meta={meta} chip={chip}>
      <div className="flex min-w-0 items-end gap-3">
        <div className="grid min-w-0 flex-1 gap-0.5">
          {standard && (
            <Label className="truncate">
              {label} · {moduleName} · {next.lesson.minutes} min
            </Label>
          )}
          <span className={cn(TYPE.value, "truncate")}>{next.lesson.title}</span>
        </div>
        <Go href={href} label={`Continue ${word}`} text />
      </div>
      <div className="mt-auto grid gap-1.5">
        <LessonBar course={course} current={next.lesson.id} modules={detailed} />
        {standard && footer}
      </div>
      {upcoming}
    </WCard>
  )
}

/** "3d 02h" until an unlock. */
const until = (h: number) => `${Math.floor(h / 24)}d ${String(h % 24).padStart(2, "0")}h`
/** Unlocks come weekly: how far into this week's wait the student is. */
const WEEK_H = 7 * 24

/** A lesson ring: one arc per lesson, done ones lit, the lesson in progress grey, the rest faint. */
function LessonRing({ course, accent, className, children }: { course: Course; accent: boolean; className?: string; children?: React.ReactNode }) {
  const lessons = lessonsOf(course)
  const n = lessons.length
  const next = nextLesson(course)
  const gap = n > 1 ? 7 : 0
  const arc = (i: number) => {
    const a0 = ((i * 360) / n + gap / 2 - 90) * (Math.PI / 180)
    const a1 = (((i + 1) * 360) / n - gap / 2 - 90 - (n > 1 ? 0 : 0.01)) * (Math.PI / 180)
    const r = 28
    const p = (a: number) => `${(32 + Math.cos(a) * r).toFixed(2)} ${(32 + Math.sin(a) * r).toFixed(2)}`
    return `M${p(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}`
  }
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-full" aria-hidden>
        {lessons.map((l, i) => (
          <path
            key={l.id}
            d={arc(i)}
            fill="none"
            strokeWidth={2.5}
            stroke={course.locked ? TRACK : l.done ? (accent ? ACCENT : GREY[1]) : accent && next?.lesson.id === l.id ? GREY[2] : TRACK}
            strokeDasharray={course.locked ? "1.5 2.5" : undefined}
            style={{ strokeLinecap: "var(--cap)" as never }}
          />
        ))}
      </svg>
      <span className="relative text-center leading-none">{children}</span>
    </div>
  )
}

/**
 * Courses.
 * rings: a thin lesson ring per course; the course in progress carries the accent.
 * bars: a row per course with a hatched bar (done, in progress, left) and its figures.
 * unlocks: a countdown to what opens next, the week's wait, and the unlocks after it.
 */
export function CourseProgress({ variant = "rings" }: WidgetProps) {
  const { coach } = useCoach()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  if (empty) {
    if (variant === "unlocks") return <WidgetEmpty icon={Lock} title="Everything is unlocked" text={`New ${coach.wording.courses.toLowerCase()} content appears here when it's scheduled.`} />
    return <NoCourses />
  }
  const word = coach.wording.lesson.toLowerCase()
  const open = COURSES.filter((c) => !c.locked)
  const all = open.flatMap(lessonsOf)
  const done = all.filter((l) => l.done).length
  const overall = Math.round((done / all.length) * 100)
  const minutesLeft = all.filter((l) => !l.done).reduce((n, l) => n + l.minutes, 0)
  // The course the student is in: the first open one that isn't finished.
  const current = open.find((c) => courseProgress(c) < 100) ?? COURSES[0]
  const meta = `${DEMO_STUDENT.first} · ${done} of ${all.length} ${word}s · ${inWords(minutesLeft)} to go`

  if (variant === "unlocks") {
    const [first, ...later] = UNLOCKS
    const waited = WEEK_H - first.inHours
    const locked = COURSES.find((c) => c.locked)
    return (
      <WCard icon={Hourglass} crumb={coach.wording.courses} title="Next unlock" chip={<Chip>{first.date}</Chip>}>
        <div className="grid min-w-0 gap-0.5">
          <Label className="truncate">
            {first.title} · {first.lessons} {word}s
          </Label>
          <Num value={until(first.inHours)} delta={`opens ${first.date}`} deltaTone="muted" />
        </div>
        <div className="grid gap-1.5">
          <TickBar value={waited} max={WEEK_H} segments={28} now={Math.min(27, Math.floor((waited / WEEK_H) * 28))} />
          <Axis labels={["Last unlock", first.date]} />
        </div>
        {standard && later.length > 0 && (
          <div className="mt-auto hidden min-h-0 gap-1 @[15rem]:grid">
            <Rule />
            <Timeline
              items={later.slice(0, detailed ? later.length : 2).map((u) => ({
                time: `${Math.round(u.inHours / 24)}d`,
                title: u.title,
                value: `${u.lessons} ${word}s`,
              }))}
            />
          </div>
        )}
        {detailed && locked && (
          <Legend items={[{ color: GREY[3], label: `${locked.title} · needs ${locked.locked}`, value: <Lock className="size-3 text-muted-foreground" /> }]} />
        )}
      </WCard>
    )
  }

  if (variant === "bars") {
    const shown = standard ? COURSES : COURSES.slice(0, 2)
    const inProgress = 1
    return (
      <WCard icon={BookOpen} title={coach.wording.courses} meta={meta} chip={<Chip>{overall}%</Chip>}>
        <Num value={`${done}/${all.length}`} unit={`${word}s`} delta={`+${DONE_THIS_WEEK} this week`} />
        <div className="grid flex-1 content-start gap-2.5">
          {shown.map((c) => {
            const n = lessonsOf(c)
            const d = n.filter((l) => l.done).length
            const p = courseProgress(c)
            const here = c === current
            return (
              <div key={c.id} className="grid min-w-0 gap-1.5">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className={cn(TYPE.body, "truncate", c.locked && "text-muted-foreground", here && "font-medium")}>{c.title}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs leading-4 tabular-nums" style={{ fontFamily: font }}>
                    {c.locked ? (
                      <>
                        <Lock className="size-3 text-muted-foreground" />
                        <Chip tone="neutral">{c.locked}</Chip>
                      </>
                    ) : p === 100 ? (
                      <>
                        <Check className="size-3" /> {d}/{n.length}
                      </>
                    ) : (
                      <>
                        <span className="hidden text-muted-foreground @[18rem]:inline">{p}%</span>
                        <span>
                          {d}/{n.length}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <HatchBar
                  height={6}
                  total={n.length}
                  parts={c.locked ? [] : [{ value: d, color: here ? ACCENT : GREY[1] }, ...(here ? [{ value: inProgress, color: GREY[2] }] : [])]}
                />
              </div>
            )
          })}
        </div>
        {detailed && (
          <>
            <Rule />
            <Legend
              items={[
                { color: ACCENT, label: "Done", value: done },
                { color: GREY[2], label: "In progress", value: inProgress },
                { color: TRACK, label: "Left", value: `${all.length - done - inProgress} · ${inWords(minutesLeft)}` },
                { color: GREY[3], label: `Next unlock · ${UNLOCKS[0].date}`, value: `in ${until(UNLOCKS[0].inHours)}` },
              ]}
            />
          </>
        )}
      </WCard>
    )
  }

  // rings
  return (
    <WCard icon={BookOpen} title={coach.wording.courses} meta={meta} chip={<Chip>{overall}%</Chip>}>
      <div className="grid flex-1 grid-cols-3 items-center gap-2">
        {COURSES.map((c) => {
          const p = courseProgress(c)
          const n = lessonsOf(c)
          const here = c === current
          return (
            <div key={c.id} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <LessonRing course={c} accent={here} className="size-14 @[22rem]:size-16">
                {c.locked ? (
                  <Lock className="size-3.5 text-muted-foreground" />
                ) : (
                  <span className={cn("text-xs tabular-nums", here ? "text-foreground" : "text-muted-foreground")} style={{ fontFamily: font }}>
                    {p}%
                  </span>
                )}
              </LessonRing>
              <div className="grid max-w-full">
                <span className={cn("truncate text-xs leading-4", here ? "font-medium text-foreground" : "text-muted-foreground")}>{c.title}</span>
                {standard && (
                  <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
                    {c.locked ? c.locked : `${n.filter((l) => l.done).length}/${n.length}`}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {detailed && (
        <>
          <Rule />
          <Legend
            items={[
              { color: ACCENT, label: `${current.title} · now`, value: `${lessonsOf(current).filter((l) => l.done).length}/${lessonsOf(current).length}` },
              { color: GREY[1], label: `${word[0].toUpperCase()}${word.slice(1)}s done, all ${coach.wording.courses.toLowerCase()}`, value: `${done}/${all.length}` },
              { color: GREY[3], label: `Next unlock · ${UNLOCKS[0].date}`, value: `in ${until(UNLOCKS[0].inHours)}` },
            ]}
          />
        </>
      )}
    </WCard>
  )
}
