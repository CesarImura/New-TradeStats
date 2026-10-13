import { Suspense } from "react"
import { CourseBuilder } from "@/components/admin/content/course-builder"

export default function Page({ params }: PageProps<"/admin/[coach]/content/[course]">) {
  return (
    <Suspense>
      <Builder params={params} />
    </Suspense>
  )
}

async function Builder({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params
  return <CourseBuilder courseId={course} />
}
