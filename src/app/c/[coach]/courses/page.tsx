import { Suspense } from "react"
import { StudentCourses } from "@/components/courses/student-courses"

export default function Page() {
  return (
    <Suspense>
      <StudentCourses />
    </Suspense>
  )
}
