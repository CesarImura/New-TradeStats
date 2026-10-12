"use client"

import Link from "next/link"
import { BookOpen, Lock, PlayCircle } from "lucide-react"
import { useCoach } from "@/components/coach/coach-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { COURSES, courseProgress, nextLesson } from "@/lib/data/sample"
import { cn } from "@/lib/utils"
import { Cover, Ring, WidgetEmpty, useEmpty, type WidgetProps } from "./shared"

const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

function NoCourses() {
  const { coach } = useCoach()
  return (
    <WidgetEmpty
      icon={BookOpen}
      title={`Your ${coach.wording.courses.toLowerCase()} will show here`}
      text={`The first ${coach.wording.lesson.toLowerCase()} appears as soon as ${coach.coachName} publishes it.`}
    />
  )
}

/** Continue lesson: hero (large with video), card (compact), spotlight (cover art behind). */
export function ContinueLesson({ variant = "card", props }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  const course = COURSES.find((c) => c.id === props.course) ?? COURSES[0]
  const next = nextLesson(course)
  if (empty || !next) return <NoCourses />
  const label = String(props.title || "Start here")
  const meta = `${course.title} · ${next.module.title}`

  if (variant === "spotlight") {
    return (
      <div className="@container relative isolate flex overflow-hidden rounded-(--radius) text-white" style={{ boxShadow: "var(--card-shadow)" }}>
        <Cover hue={course.hue} className="absolute inset-0 -z-10 rounded-none" />
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mt-auto flex w-full flex-col gap-3 p-5 @lg:flex-row @lg:items-end @lg:justify-between">
          <div className="grid gap-1">
            <span className="text-xs tracking-wide text-white/75 uppercase">{label}</span>
            <span className="font-heading text-2xl leading-tight @lg:text-3xl">{next.lesson.title}</span>
            <span className="text-sm text-white/75">{meta}</span>
          </div>
          <Button size="lg" variant="secondary" {...link(`${base}/courses`)}>
            <PlayCircle /> Continue · {next.lesson.minutes} min
          </Button>
        </div>
      </div>
    )
  }

  if (variant === "hero") {
    return (
      <Card className="@container">
        <div className="grid gap-5 px-(--card-spacing) @xl:grid-cols-[1.3fr_1fr] @xl:items-center">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">{label}</span>
            <h2 className="text-2xl leading-tight @xl:text-3xl">Pick up where you left off</h2>
            <p className="text-muted-foreground">
              {meta}. Next up: <span className="text-foreground">{next.lesson.title}</span>, {next.lesson.minutes} min.
            </p>
            <Progress value={courseProgress(course)} className="max-w-sm" />
            <div>
              <Button size="lg" {...link(`${base}/courses`)}>
                <PlayCircle /> Continue {coach.wording.lesson.toLowerCase()}
              </Button>
            </div>
          </div>
          <div className="relative hidden aspect-video overflow-hidden rounded-[min(var(--radius),14px)] @xl:block">
            <Cover hue={course.hue} className="absolute inset-0" />
            <PlayCircle className="absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white drop-shadow" />
            <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 text-xs text-white">{next.lesson.minutes}:00</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="@container">
      <div className="flex items-center gap-4 px-(--card-spacing)">
        <Cover hue={course.hue} className="hidden aspect-square w-20 shrink-0 @sm:block" />
        <div className="grid min-w-0 flex-1 gap-1">
          <span className="eyebrow">{label}</span>
          <span className="truncate font-heading text-lg leading-tight">{next.lesson.title}</span>
          <span className="truncate text-sm text-muted-foreground">{meta}</span>
          <Progress value={courseProgress(course)} className="mt-1" />
        </div>
        <Button size="icon-lg" aria-label="Continue" className="shrink-0" {...link(`${base}/courses`)}>
          <PlayCircle />
        </Button>
      </div>
    </Card>
  )
}

/** Courses: list (bars), cards (covers), rings (circular progress). */
export function CourseProgress({ variant = "list" }: WidgetProps) {
  const { coach, base } = useCoach()
  const empty = useEmpty()
  if (empty) return <NoCourses />

  if (variant === "cards") {
    return (
      <div className="@container flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl">{coach.wording.courses}</h3>
          <Link href={`${base}/courses`} className="text-sm text-primary">See all</Link>
        </div>
        <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
          {COURSES.map((c) => (
            <Card key={c.id} size="sm" className="pt-0">
              <div className="relative">
                <Cover hue={c.hue} className={cn("aspect-[16/8] rounded-none", c.locked && "grayscale")} />
                {c.locked && (
                  <Badge className="absolute top-2 right-2 gap-1">
                    <Lock className="size-3" /> {c.locked}
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                {c.locked ? (
                  "Unlock with an upgrade"
                ) : (
                  <>
                    <Progress value={courseProgress(c)} className="flex-1" />
                    {courseProgress(c)}%
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "rings") {
    return (
      <Card className="@container">
        <CardHeader>
          <CardDescription className="eyebrow">{coach.wording.courses}</CardDescription>
          <CardTitle className="text-lg">Your progress</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
          {COURSES.map((c) => (
            <div key={c.id} className="flex items-center gap-3 @sm:flex-col @sm:text-center">
              <Ring value={c.locked ? 0 : courseProgress(c)} size={68}>
                {c.locked ? <Lock className="size-4 text-muted-foreground" /> : <span className="text-sm font-semibold tabular-nums">{courseProgress(c)}%</span>}
              </Ring>
              <span className="grid gap-0.5">
                <span className="text-sm">{c.title}</span>
                <span className="text-xs text-muted-foreground">{c.locked ? c.locked : `${c.modules.flatMap((m) => m.lessons).length} lessons`}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="eyebrow">{coach.wording.courses}</CardDescription>
        <CardTitle className="text-lg">Your progress</CardTitle>
        <CardAction>
          <Link href={`${base}/courses`} className="text-sm text-primary">See all</Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {COURSES.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <Cover hue={c.hue} className={cn("size-9 shrink-0", c.locked && "grayscale")} />
            <div className="grid min-w-0 flex-1 gap-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{c.title}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">{c.locked ? c.locked : `${courseProgress(c)}%`}</span>
              </div>
              <Progress value={c.locked ? 0 : courseProgress(c)} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
