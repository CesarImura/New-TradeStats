"use client"

import { Suspense } from "react"
import { StudentCalendar } from "@/components/calendar/student-calendar"
import { StudentCourses } from "@/components/courses/student-courses"
import { StudentAi } from "@/components/student/ai-chat"
import { StudentCharts } from "@/components/student/charts"
import { StudentCommunity } from "@/components/student/community"
import { StudentDownloads } from "@/components/student/downloads"
import { StudentJournal } from "@/components/student/journal"
import { StudentPartners } from "@/components/student/partners"
import { StudentRanking } from "@/components/student/ranking"
import type { ModuleId } from "@/lib/data/coaches"
import type { WidgetProps } from "./shared"

const PAGES: Record<ModuleId, (p: { props?: WidgetProps["props"] }) => React.ReactNode> = {
  courses: StudentCourses,
  calendar: StudentCalendar,
  charts: StudentCharts,
  community: StudentCommunity,
  journal: StudentJournal,
  ranking: StudentRanking,
  ai: StudentAi,
  downloads: StudentDownloads,
  partners: StudentPartners,
}

/**
 * A module page's core widget: the page's own tool, as it was before pages
 * had widgets. Later steps split each page into a smaller core plus widgets.
 */
export function corePage(page: ModuleId) {
  const Page = PAGES[page]
  function Core({ props }: WidgetProps) {
    return (
      <div className="g-core-body flex min-w-0 flex-col">
        <Suspense>
          <Page props={props} />
        </Suspense>
      </div>
    )
  }
  Core.displayName = `Core(${page})`
  return Core
}
