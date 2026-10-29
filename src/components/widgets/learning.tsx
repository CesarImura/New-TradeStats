"use client"

import Link from "next/link"
import { BookOpen, Check, Hourglass, Lock, Play, PlayCircle } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { useViewerTier } from "@/lib/data/access"
import { canAccess, courseStats, openLessons, resumeLesson, studentCourses, useCatalog, useProgress, type Course, type Progress } from "@/lib/data/learning"
import { DEMO_STUDENT } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { ACCENT, Drop, GROW_ROWS, TYPE, series, useFrame, useMore } from "./kit"
import { Axis, Chip, GREY, HatchBar, Label, Legend, Num, Rule, TickBar, Timeline, WCard, useFigureFont, useChartStyle } from "./instrument"
import { Cover, WidgetEmpty, inWords, useEmpty, type WidgetProps } from "./shared"
import { Artwork, MEDIA_FG, MediaCard, MediaProgress } from "./layouts"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })
/** The modules a student sees, each with only its published lessons. */
const modulesOf = (c: Course) => c.modules.map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.status === "published") })).filter((m) => m.lessons.length > 0)

/** The coach's catalogue, the student's progress and tier: what every widget here reads. */
function useLearning() {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const progress = useProgress(coach.slug)
  const tier = useViewerTier(coach)
  const courses = studentCourses(catalog)
  const open = courses.filter((c) => canAccess(c, tier))
  // The course the student is in: the first open one that isn't finished.
  const current = open.find((c) => courseStats(c, progress).pct < 100) ?? open[0] ?? courses[0]
  /** What a locked course asks for: the name of the first tier that gets it. */
  const needs = (c: Course) => coach.tiers.find((t) => t.id === c.tiers[0])?.name ?? "Locked"
  return { courses, open, current, progress, tier, needs }
}

/** Prototype "today" is Monday 12 October 2026, 22:00: unlocks are dated "Thu 15 Oct" in the catalogue. */
const NOW = Date.UTC(2026, 9, 12, 22)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
/** Hours until a date like "Thu 15 Oct", or null if it can't be read. */
function hoursUntil(date: string) {
  const m = /(\d{1,2})\s+([A-Za-z]{3})/.exec(date)
  const month = m ? MONTHS.indexOf(m[2][0].toUpperCase() + m[2].slice(1, 3).toLowerCase()) : -1
  if (!m || month < 0) return null
  return Math.max(0, Math.round((Date.UTC(2026, month, Number(m[1])) - NOW) / 36e5))
}
/** What opens next: scheduled lessons in the catalogue, grouped by module and date, soonest first. */
function unlocksOf(courses: Course[]) {
  const groups = new Map<string, { title: string; lessons: number; inHours: number; date: string }>()
  for (const c of courses)
    c.modules.forEach((m, i) => {
      for (const l of m.lessons) {
        if (l.status !== "scheduled" || !l.unlockAt) continue
        const inHours = hoursUntil(l.unlockAt)
        if (inHours === null) continue
        const key = `${c.id}/${m.id}/${l.unlockAt}`
        const g = groups.get(key) ?? { title: `Module ${i + 1} · ${m.title}`, lessons: 0, inHours, date: l.unlockAt }
        g.lessons += 1
        groups.set(key, g)
      }
    })
  return [...groups.values()].sort((a, b) => a.inHours - b.inHours)
}
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
function LessonBar({ course, progress, current, height: h0 = 8, modules, className }: { course: Course; progress: Progress; current: string; height?: number; modules?: boolean; className?: string }) {
  const font = useFigureFont()
  // Chart style: ticks (separate lessons, the rest hatched), solid (lessons joined, plain track), thin (a hairline).
  const style = useChartStyle()
  const height = style === "thin" ? 3 : h0
  const rest = style === "ticks" ? HATCH : { background: TRACK }
  const mods = modulesOf(course)
  const mi = mods.findIndex((m) => m.lessons.some((l) => l.id === current))
  return (
    <div className={cn("grid gap-1", className)}>
      <div className={cn("flex items-end", style === "ticks" ? "gap-[5px]" : "gap-[3px]")} style={{ height: height + 4 }} aria-hidden>
        {mods.map((m) => (
          <div key={m.id} className={cn("flex h-full items-end", style === "ticks" ? "gap-[2px]" : "gap-px")} style={{ flex: m.lessons.reduce((n, l) => n + l.minutes, 0) }}>
            {m.lessons.map((l) => {
              const now = l.id === current
              return (
                <span
                  key={l.id}
                  title={l.title}
                  className="r-bar"
                  style={{ flex: l.minutes, height: now && style !== "thin" ? height + 4 : height, ...(progress.done.includes(l.id) ? { background: GREY[1] } : now ? { background: ACCENT } : rest) }}
                />
              )
            })}
          </div>
        ))}
      </div>
      {modules && (
        <div className="flex gap-[5px] text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
          {mods.map((m, i) => (
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
  const { fixed } = useFrame()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const { open, current: now, progress } = useLearning()
  // The chosen course if the student can open it, otherwise the one they're in.
  const course = open.find((c) => c.id === props.course) ?? now
  const next = course ? resumeLesson(course, progress) : null
  if (empty || !course || !next) return <NoCourses />
  const lessons = openLessons(course)
  const index = lessons.findIndex((l) => l.id === next.lesson.id)
  const done = courseStats(course, progress).done
  const mi = modulesOf(course).findIndex((m) => m.id === next.module.id)
  const moduleName = next.module.title.split(" · ").pop()
  const minutesLeft = lessons.filter((l) => !progress.done.includes(l.id)).reduce((n, l) => n + l.minutes, 0)
  const href = `${base}/courses/${course.id}/${next.lesson.id}`
  const word = coach.wording.lesson.toLowerCase()
  const label = String(props.title || "Up next")
  const meta = `${course.title} · Module ${mi + 1} · ${word} ${index + 1} of ${lessons.length}`
  const chip = <Chip>{inWords(minutesLeft)} left</Chip>

  /** This lesson and the next ones, as a timeline (Detail = detailed). */
  // The next lessons: on Detailed, and in any cell tall enough to hold them (they give way first when it isn't).
  // The lessons ahead (then the ones done): on Detailed, a short list at the foot; in a cell that sets the height, as many
  // whole rows as it holds right under the progress, each row opening up a little, so the height carries the course, not a gap.
  const ahead = fixed ? [...lessons.slice(index), ...lessons.slice(0, index)] : lessons.slice(index, index + 4)
  const upcoming = (detailed || fixed) && (
    <Drop level={3}>
      <div className={cn("hidden min-h-0 gap-1 @[16rem]:grid", fixed ? "mt-1 flex-1 grid-rows-[auto_minmax(0,1fr)]" : "mt-auto")}>
        <Rule />
        <div className={cn("flex min-h-0 flex-col flex-wrap content-start overflow-hidden *:w-full", GROW_ROWS)}>
          {ahead.map((l) => {
            const n = lessons.indexOf(l)
            return (
              <Timeline
                key={l.id}
                items={[{ time: String(n + 1).padStart(2, "0"), title: l.title, value: n < index ? "done" : `${l.minutes} min`, color: n === index ? ACCENT : n < index ? GREY[1] : GREY[2], strong: n === index }]}
                className={cn("items-center", n < index && "opacity-60")}
              />
            )
          })}
        </div>
      </div>
    </Drop>
  )
  const footer = <Axis labels={[`${done}/${lessons.length} done`, `${inWords(minutesLeft)} left`]} />

  if (variant === "cover") {
    return (
      <WCard icon={PlayCircle} title="Continue lesson" meta={meta} chip={chip} bodyClassName="@[26rem]:flex-row @[26rem]:items-stretch @[26rem]:gap-4">
        <Cover color={series(course.color)} label={course.title} className="hidden min-h-16 @[26rem]:block @[26rem]:w-[42%] @[26rem]:max-w-64 @[26rem]:shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Cover color={series(course.color)} className="hidden h-10 w-14 shrink-0 @[16rem]:block @[26rem]:hidden" />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <Label className="truncate">
                {label} · {next.lesson.minutes} min
              </Label>
              <span className={cn(TYPE.title, "line-clamp-1 @[26rem]:line-clamp-2")}>{next.lesson.title}</span>
            </div>
            <Go href={href} label={`Continue ${word}`} />
          </div>
          <div className="mt-auto grid gap-1.5">
            <LessonBar course={course} progress={progress} current={next.lesson.id} height={6} />
            {standard && footer}
          </div>
          {upcoming}
        </div>
      </WCard>
    )
  }

  if (variant === "media") {
    return (
      <MediaCard
        image={<Artwork />}
        kicker={`${label} · Module ${mi + 1}`}
        aside={standard ? <span className="text-[0.6875rem] leading-4 tabular-nums">{next.lesson.minutes} min</span> : undefined}
        title={next.lesson.title}
        sub={standard ? `${course.title} · ${word} ${index + 1} of ${lessons.length}${detailed ? ` · ${inWords(minutesLeft)} left in the course` : ""}` : undefined}
        footer={
          <>
            <MediaProgress value={(done / lessons.length) * 100} />
            {standard && (
              <span className="shrink-0 text-[0.6875rem] leading-4 tabular-nums" style={{ color: MEDIA_FG }}>
                {done}/{lessons.length}
              </span>
            )}
            <Go href={href} label={`Continue ${word}`} />
          </>
        }
      />
    )
  }

  if (variant === "card") {
    const line = (
      <>
        <LessonBar course={course} progress={progress} current={next.lesson.id} height={6} className="hidden w-28 shrink-0 @[30rem]:grid" />
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
      {/* With the next lessons under it (a tall cell), the bar stays with the title instead of sinking to the foot. */}
      <div className={cn("grid gap-1.5", upcoming ? "mt-2" : "mt-auto")}>
        <LessonBar course={course} progress={progress} current={next.lesson.id} modules={detailed} />
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
function LessonRing({ course, progress, locked, accent, className, children }: { course: Course; progress: Progress; locked: boolean; accent: boolean; className?: string; children?: React.ReactNode }) {
  const lessons = openLessons(course)
  const n = lessons.length
  const next = resumeLesson(course, progress)
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
            stroke={locked ? TRACK : progress.done.includes(l.id) ? (accent ? ACCENT : GREY[1]) : accent && next?.lesson.id === l.id ? GREY[2] : TRACK}
            strokeDasharray={locked ? "1.5 2.5" : undefined}
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
  const { fixed } = useFrame()
  const empty = useEmpty()
  const standard = useMore("standard")
  const detailed = useMore("detailed")
  const font = useFigureFont()
  const { courses, open, current, progress, tier, needs } = useLearning()
  const unlocks = unlocksOf(courses)
  if (empty || courses.length === 0) {
    if (variant === "unlocks") return <WidgetEmpty icon={Lock} title="Everything is unlocked" text={`New ${coach.wording.courses.toLowerCase()} content appears here when it's scheduled.`} />
    return <NoCourses />
  }
  const word = coach.wording.lesson.toLowerCase()
  const stats = open.map((c) => courseStats(c, progress))
  const total = stats.reduce((n, x) => n + x.lessons, 0)
  const done = stats.reduce((n, x) => n + x.done, 0)
  const overall = total ? Math.round((done / total) * 100) : 0
  const minutesLeft = open
    .flatMap(openLessons)
    .filter((l) => !progress.done.includes(l.id))
    .reduce((n, l) => n + l.minutes, 0)
  const currentStats = courseStats(current, progress)
  const meta = `${DEMO_STUDENT.first} · ${done} of ${total} ${word}s · ${inWords(minutesLeft)} to go`

  if (variant === "unlocks") {
    if (unlocks.length === 0) return <WidgetEmpty icon={Lock} title="Everything is unlocked" text={`New ${coach.wording.courses.toLowerCase()} content appears here when it's scheduled.`} />
    const [first, ...later] = unlocks
    const waited = Math.min(WEEK_H, Math.max(0, WEEK_H - first.inHours))
    const locked = courses.find((c) => !canAccess(c, tier))
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
        {detailed && locked && <Legend items={[{ color: GREY[3], label: `${locked.title} · needs ${needs(locked)}`, value: <Lock className="size-3 text-muted-foreground" /> }]} />}
      </WCard>
    )
  }

  if (variant === "bars") {
    const shown = courses.slice(0, standard ? 4 : 2)
    const inProgress = 1
    return (
      <WCard icon={BookOpen} title={coach.wording.courses} meta={meta} chip={<Chip>{overall}%</Chip>}>
        <Num value={`${done}/${total}`} unit={`${word}s`} delta={`+${DONE_THIS_WEEK} this week`} />
        <div className="grid flex-1 content-start gap-2.5">
          {shown.map((c) => {
            const st = courseStats(c, progress)
            const d = st.done
            const p = st.pct
            const here = c.id === current.id
            const locked = !canAccess(c, tier)
            return (
              <div key={c.id} className="grid min-w-0 gap-1.5">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className={cn(TYPE.body, "truncate", locked && "text-muted-foreground", here && "font-medium")}>{c.title}</span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[0.6875rem] leading-4 tabular-nums" style={{ fontFamily: font }}>
                    {locked ? (
                      <>
                        <Lock className="size-3 text-muted-foreground" />
                        <Chip tone="neutral">{needs(c)}</Chip>
                      </>
                    ) : p === 100 ? (
                      <>
                        <Check className="size-3" /> {d}/{st.lessons}
                      </>
                    ) : (
                      <>
                        <span className="hidden text-muted-foreground @[18rem]:inline">{p}%</span>
                        <span>
                          {d}/{st.lessons}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <HatchBar height={6} total={st.lessons} parts={locked ? [] : [{ value: d, color: here ? ACCENT : GREY[1] }, ...(here ? [{ value: inProgress, color: GREY[2] }] : [])]} />
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
                { color: TRACK, label: "Left", value: `${Math.max(0, total - done - inProgress)} · ${inWords(minutesLeft)}` },
                ...(unlocks[0] ? [{ color: GREY[3], label: `Next unlock · ${unlocks[0].date}`, value: `in ${until(unlocks[0].inHours)}` }] : []),
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
      {/* Three columns; a tall, narrow card stacks them as rows (ring beside its name), so the height is used, not left blank. */}
      <div className="grid flex-1 grid-cols-3 content-center items-start gap-2 [@container_card_(max-aspect-ratio:6/5)]:grid-cols-1 [@container_card_(max-aspect-ratio:6/5)]:content-evenly">
        {courses.slice(0, 3).map((c) => {
          const st = courseStats(c, progress)
          const p = st.pct
          const here = c.id === current.id
          const locked = !canAccess(c, tier)
          return (
            // Wide (twice as wide as tall, 40rem up) or stacked: each course's name sits beside its ring instead of under it.
            <div
              key={c.id}
              className="flex min-w-0 flex-col items-center gap-0.5 text-center [@container_card_(max-aspect-ratio:6/5)]:flex-row [@container_card_(max-aspect-ratio:6/5)]:gap-3 [@container_card_(max-aspect-ratio:6/5)]:text-left [@container_card_(min-aspect-ratio:2/1)_and_(min-width:40rem)]:flex-row [@container_card_(min-aspect-ratio:2/1)_and_(min-width:40rem)]:gap-3 [@container_card_(min-aspect-ratio:2/1)_and_(min-width:40rem)]:text-left"
            >
              {/* In a fixed cell the ring follows the card's height too (cqh), so a taller card gets bigger rings, not empty bands. */}
              <LessonRing
                course={c}
                progress={progress}
                locked={locked}
                accent={here}
                className={fixed ? "size-[clamp(3.25rem,min(28cqh,16cqw),7.5rem)] [@container_card_(max-aspect-ratio:6/5)]:size-[clamp(2.75rem,min(18cqh,22cqw),5.5rem)]" : "size-[3.25rem] @[22rem]:size-15"}
              >
                {locked ? (
                  <Lock className="size-3.5 text-muted-foreground" />
                ) : (
                  <span className={cn("text-[0.6875rem] tabular-nums", here ? "text-foreground" : "text-muted-foreground")} style={{ fontFamily: font }}>
                    {p}%
                  </span>
                )}
              </LessonRing>
              <div className="grid max-w-full">
                <span className={cn("line-clamp-2 text-[0.6875rem] leading-4 text-balance", here ? "font-medium text-foreground" : "text-muted-foreground")} title={c.title}>
                  {c.title}
                </span>
                {standard && (
                  <span className="truncate text-[0.6875rem] leading-4 text-muted-foreground tabular-nums" style={{ fontFamily: font }}>
                    {locked ? `In ${needs(c)}` : `${st.done}/${st.lessons}`}
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
              { color: ACCENT, label: `${current.title} · now`, value: `${currentStats.done}/${currentStats.lessons}` },
              { color: GREY[1], label: `${word[0].toUpperCase()}${word.slice(1)}s done, all ${coach.wording.courses.toLowerCase()}`, value: `${done}/${total}` },
              ...(unlocks[0] ? [{ color: GREY[3], label: `Next unlock · ${unlocks[0].date}`, value: `in ${until(unlocks[0].inHours)}` }] : []),
            ]}
          />
        </>
      )}
    </WCard>
  )
}
