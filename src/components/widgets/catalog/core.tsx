"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import type { ModuleId } from "@/lib/data/coaches"
import type { WidgetProps } from "../parts/shared"

type CorePage = React.ComponentType<{ props?: WidgetProps["props"] }>

// Each page's tool is its own chunk: every section is a page of widgets, so a static import here sent all nine (the
// journal's charts, the calendar, the AI chat…) to every page. The server still renders the page's own one.
const PAGES: Record<ModuleId, CorePage> = {
  courses: dynamic(() => import("@/components/courses/student-courses").then((m) => m.StudentCourses)),
  calendar: dynamic(() => import("@/components/calendar/student-calendar").then((m) => m.StudentCalendar)),
  charts: dynamic(() => import("@/components/student/charts").then((m) => m.StudentCharts)),
  community: dynamic(() => import("@/components/student/community").then((m) => m.StudentCommunity)),
  journal: dynamic(() => import("@/components/student/journal").then((m) => m.StudentJournal)),
  ranking: dynamic(() => import("@/components/student/ranking").then((m) => m.StudentRanking)),
  ai: dynamic(() => import("@/components/student/ai-chat").then((m) => m.StudentAi)),
  downloads: dynamic(() => import("@/components/student/downloads").then((m) => m.StudentDownloads)),
  partners: dynamic(() => import("@/components/student/partners").then((m) => m.StudentPartners)),
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
