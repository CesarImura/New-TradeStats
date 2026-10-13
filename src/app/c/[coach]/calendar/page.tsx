import { Suspense } from "react"
import { StudentCalendar } from "@/components/calendar/student-calendar"

export default function Page() {
  return (
    <Suspense>
      <StudentCalendar />
    </Suspense>
  )
}
