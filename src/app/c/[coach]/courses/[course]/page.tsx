import { Suspense } from "react"
import { StudentCourse } from "@/components/courses/student-course"

export default function Page({ params }: PageProps<"/c/[coach]/courses/[course]">) {
  return (
    <Suspense>
      <Course params={params} />
    </Suspense>
  )
}

async function Course({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params
  return <StudentCourse courseId={course} />
}
