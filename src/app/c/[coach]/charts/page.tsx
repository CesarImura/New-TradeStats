import { Suspense } from "react"
import { StudentCharts } from "@/components/student/charts"

export default function Page() {
  return (
    <Suspense>
      <StudentCharts />
    </Suspense>
  )
}
