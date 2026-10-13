import { Suspense } from "react"
import { StudentLesson } from "@/components/courses/student-lesson"

export default function Page({ params }: PageProps<"/c/[coach]/courses/[course]/[lesson]">) {
  return (
    <Suspense>
      <Lesson params={params} />
    </Suspense>
  )
}

async function Lesson({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  const { course, lesson } = await params
  return <StudentLesson courseId={course} lessonId={lesson} />
}
