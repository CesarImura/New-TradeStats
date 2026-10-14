"use client"

import { CalendarRange, Lock, Users } from "@/components/icons"
import { useCoach } from "@/components/coach/coach-provider"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fmtDate, groupOpening, useAccess, useViewerGroup } from "@/lib/data/access"
import { studentCourses, useCatalog } from "@/lib/data/learning"
import { cn } from "@/lib/utils"

const TODAY = "2026-10-12"

/** STU-31: the student's cohort: dates, who's in it, and what opens when. */
export function MyGroup() {
  const { coach } = useCoach()
  const group = useViewerGroup(coach)
  const access = useAccess(coach.slug)
  const catalog = useCatalog(coach)
  if (!group) return <p className="text-sm text-muted-foreground">You&apos;re not in a group. You go through everything at your own pace.</p>

  const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
  const total = Math.max(1, days(group.start, group.end))
  const gone = Math.min(total, Math.max(0, days(group.start, TODAY)))
  const week = Math.floor(gone / 7) + 1
  const schedule = studentCourses(catalog)
    .map((c) => ({ course: c, opening: groupOpening(access, c.id, group) }))
    .filter((x) => x.opening)

  return (
    <div className="grid gap-4">
      <Card className="gap-4 px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="eyebrow">Your group</span>
            <span className="text-2xl">{group.name}</span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarRange className="size-4" /> {fmtDate(group.start)} – {fmtDate(group.end)}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" /> {group.members} members
          </span>
        </div>
        {gone > 0 ? (
          <div className="grid gap-1.5">
            <div className="flex justify-between text-sm">
              <span>Week {week}</span>
              <span className="text-muted-foreground tabular-nums">{Math.round((gone / total) * 100)}%</span>
            </div>
            <Progress value={(gone / total) * 100} className="h-1.5" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Starts in {days(TODAY, group.start)} days. Everything below opens from then.</p>
        )}
        <p className="text-sm text-muted-foreground">
          {group.channel && coach.modules.community ? `Your group has its own channel in ${coach.wording.community}.` : ""}
          {group.ranking && coach.modules.ranking ? ` And its own ${coach.wording.ranking.toLowerCase()}.` : ""}
        </p>
      </Card>
      {schedule.length > 0 && (
        <Card className="gap-1 px-5">
          <span className="eyebrow pb-2">What opens when</span>
          <ol className="grid">
            {schedule.map(({ course, opening }) => (
              <li key={course.id} className="flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0">
                <span className={cn("flex items-center gap-2 text-sm", !opening!.open && "text-muted-foreground")}>
                  {!opening!.open && <Lock className="size-3.5" />}
                  {course.title}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">{opening!.open ? "Open" : opening!.date}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
